#!/usr/bin/env bash
# Deploy the production stack with as little downtime as possible.
#
#   ./deploy.sh                      deploy backend, admin, account, frontend
#   ./deploy.sh backend admin        only these services
#   ./deploy.sh --rollback backend   go back to the image that was running before the last deploy
#   ./deploy.sh --tag <sha> ...      (registry mode) deploy the images CI built for that commit
#   ./deploy.sh --build ...          (registry mode) build from this checkout instead of pulling
#
# Run `git pull` first; this deploys whatever is checked out.
#
# Two modes, chosen by COMPOSE_FILE in prod.env:
#   build    (compose.yaml)                        build the images on this server
#   registry (compose.yaml:compose.registry.yaml)  pull the images GitHub Actions built
#                                                  for the commit, tagged with its SHA
# In registry mode, --build builds from the checkout instead (e.g. for a change
# that isn't on master, or when CI is down) and the result is deployed the same
# way as a pulled image, so --rollback works the same either way.
#
# Order matters:
#   1. Get the new images ready while the old containers keep serving: build them,
#      or pull them. (Stopping first and then building took the API down for 27
#      minutes on 2026-11-28.) Nothing is changed if this fails.
#   2. Keep the running images (<image>-previous, or :previous in registry mode),
#      so a rollback is instant.
#   3. Swap the containers (a few seconds each) and wait for each healthcheck.
#   4. Reload nginx so it looks up the new container IPs at once. nginx also
#      re-resolves them on its own within ~2s (nginx-proxy/upstreams.conf).
#
# Including nginx in the list recreates the nginx container itself, which drops
# every listener's socket briefly.
set -euo pipefail

cd "$(dirname "$0")"
# ENV_FILE selects the settings (and, through COMPOSE_FILE in it, the stage):
#   ENV_FILE=test.env ./deploy.sh
ENV_FILE="${ENV_FILE:-prod.env}"
set +u
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
set -u
export COMPOSE_FILE="${COMPOSE_FILE:-compose.yaml}"
compose() { docker compose "$@"; }

registry=false
[[ ":$COMPOSE_FILE:" == *":compose.registry.yaml:"* ]] && registry=true

DEFAULT_SERVICES=(backend admin account frontend)

rollback=false
build_local=false
tag=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --rollback) rollback=true; shift ;;
    --tag) tag="${2:-}"; shift 2 ;;
    --build) build_local=true; shift ;;
    -*) echo "unknown option $1" >&2; exit 1 ;;
    *) break ;;
  esac
done
services=("$@")
[[ ${#services[@]} -eq 0 ]] && services=("${DEFAULT_SERVICES[@]}")

if [[ -n "$tag" && "$registry" != true ]]; then
  echo "--tag needs registry mode (COMPOSE_FILE=compose.yaml:compose.registry.yaml)" >&2
  exit 1
fi
if [[ -n "$tag" && "$build_local" == true ]]; then
  echo "--tag and --build don't go together: --build builds the checked-out code" >&2
  exit 1
fi
# The compose files without the registry overlay: the ones that can build.
build_files="${COMPOSE_FILE//:compose.registry.yaml/}"
[[ -z "$tag" ]] && tag="$(git rev-parse HEAD)"

container_of() { compose ps -q "$1" 2>/dev/null | head -n1; }
image_of() { docker inspect -f '{{.Config.Image}}' "$1"; }
# Registry repository for a service (see compose.registry.yaml).
repo_of() {
  local name=$1
  [[ "$name" == "nginx" ]] && name="nginx-proxy"
  echo "${IMAGE_NAMESPACE:-robotastic}/trunk-server-$name"
}

wait_running() {
  local svc=$1 id state restarts health
  # Up to ~2 minutes: healthchecks allow a 30s start period.
  for _ in $(seq 1 60); do
    id="$(container_of "$svc")"
    if [[ -n "$id" ]]; then
      state="$(docker inspect -f '{{.State.Status}}' "$id")"
      restarts="$(docker inspect -f '{{.RestartCount}}' "$id")"
      health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{end}}' "$id")"
      if [[ "$state" == "running" && "$restarts" == "0" ]]; then
        if [[ "$health" == "healthy" ]]; then
          echo "  $svc is healthy"
          return 0
        elif [[ -z "$health" ]]; then
          sleep 5
          # No healthcheck: still up and not restarting after a few seconds.
          if [[ "$(docker inspect -f '{{.State.Status}} {{.RestartCount}}' "$id")" == "running 0" ]]; then
            echo "  $svc is running"
            return 0
          fi
        fi
      fi
    fi
    sleep 2
  done
  echo "  $svc did not stay up; check: docker compose logs $svc" >&2
  echo "  roll back with: ./deploy.sh --rollback $svc" >&2
  return 1
}

reload_nginx() {
  local id
  id="$(container_of nginx)"
  if [[ -n "$id" ]]; then
    docker exec "$id" nginx -s reload && echo "  nginx reloaded"
  fi
}

# The image name a service builds to under the build-mode compose files.
built_image_of() {
  COMPOSE_FILE="$build_files" docker compose config --format json \
    | python3 -c 'import json, sys; print(json.load(sys.stdin)["services"][sys.argv[1]]["image"])' "$1"
}

# Registry mode: keep what's deployed as :previous and deploy <image> as :deployed.
promote() {
  local svc=$1 source=$2 repo
  repo="$(repo_of "$svc")"
  if docker image inspect "$repo:deployed" >/dev/null 2>&1; then
    docker tag "$repo:deployed" "$repo:previous"
    echo "  $svc: kept $repo:previous"
  fi
  docker tag "$source" "$repo:deployed"
}

record() {
  mkdir -p data
  echo "$(date -u +%FT%TZ) $1 ${services[*]}" >> data/deploys.log
}

if [[ "$rollback" == true ]]; then
  echo "Rolling back: ${services[*]}"
  for svc in "${services[@]}"; do
    if [[ "$registry" == true ]]; then
      repo="$(repo_of "$svc")"
      docker image inspect "$repo:previous" >/dev/null 2>&1 || { echo "no $repo:previous to roll back to" >&2; exit 1; }
      docker tag "$repo:previous" "$repo:deployed"
      echo "  $svc -> $repo:previous"
    else
      id="$(container_of "$svc")"
      [[ -z "$id" ]] && { echo "$svc is not running" >&2; exit 1; }
      image="$(image_of "$id")"
      docker image inspect "$image-previous" >/dev/null 2>&1 || { echo "no $image-previous to roll back to" >&2; exit 1; }
      docker tag "$image-previous" "$image"
      echo "  $svc -> $image-previous"
    fi
  done
  record "rollback"

elif [[ "$registry" == true && "$build_local" == true ]]; then
  echo "Deploying $(git rev-parse --short HEAD) ($(git log -1 --format=%s)), built here: ${services[*]}"

  echo "== Building (the running containers keep serving)"
  COMPOSE_FILE="$build_files" compose build "${services[@]}"

  echo "== Keeping the running images for rollback"
  for svc in "${services[@]}"; do
    promote "$svc" "$(built_image_of "$svc")"
  done
  record "$(git rev-parse HEAD) (built here)"

elif [[ "$registry" == true ]]; then
  echo "Deploying ${tag:0:12} ($(git log -1 --format=%s "$tag" 2>/dev/null || echo "not in this checkout")): ${services[*]}"

  echo "== Pulling the images CI built (the running containers keep serving)"
  for svc in "${services[@]}"; do
    repo="$(repo_of "$svc")"
    if ! docker pull -q "$repo:$tag" >/dev/null; then
      echo "  $repo:$tag isn't available. CI may still be building this commit:" >&2
      echo "  check the 'Container Processing' workflow on GitHub. Nothing was changed." >&2
      exit 1
    fi
    echo "  $svc: $repo:${tag:0:12}"
  done

  echo "== Keeping the running images for rollback"
  for svc in "${services[@]}"; do
    promote "$svc" "$(repo_of "$svc"):$tag"
  done
  record "$tag"

else
  # Build mode (--build changes nothing here: building is what it does).
  echo "Deploying $(git rev-parse --short HEAD) ($(git log -1 --format=%s)): ${services[*]}"

  # Before building, while the image name still points at what is running.
  echo "== Keeping the running images for rollback"
  for svc in "${services[@]}"; do
    id="$(container_of "$svc")"
    if [[ -n "$id" ]]; then
      image="$(image_of "$id")"
      # By the container's image ID when the image store allows it (exact even if
      # someone rebuilt without restarting), otherwise by name.
      docker tag "$(docker inspect -f '{{.Image}}' "$id")" "$image-previous" 2>/dev/null \
        || docker tag "$image" "$image-previous"
      echo "  $svc: $image-previous"
    fi
  done

  echo "== Building (the running containers keep serving)"
  compose build "${services[@]}"
  record "$(git rev-parse HEAD) (built here)"
fi

echo "== Swapping containers"
IMAGE_TAG=deployed compose up -d --no-deps "${services[@]}"
# Point nginx at the new containers now rather than after the health checks.
reload_nginx

failed=0
for svc in "${services[@]}"; do
  wait_running "$svc" || failed=1
done

reload_nginx
compose ps
exit $failed
