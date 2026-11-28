#!/usr/bin/env bash
# Deploy the production stack with as little downtime as possible.
#
#   ./deploy.sh                      rebuild and restart backend, admin, account, frontend
#   ./deploy.sh backend admin        only these services
#   ./deploy.sh --rollback backend   go back to the image that was running before the last deploy
#
# Run `git pull` first; this deploys whatever is checked out.
#
# Order matters:
#   1. Keep each running image as <image>-previous, so a rollback is instant.
#   2. Build the new images while the old containers keep serving. (Stopping
#      first and then building took the API down for 27 minutes on 2026-11-28.)
#   3. Swap the containers (a few seconds each).
#   4. Reload nginx so it looks up the new container IPs at once (and again once
#      they are healthy). nginx also re-resolves them on its own within ~2s (see
#      nginx-proxy/upstreams.conf); the reload is a backstop.
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

DEFAULT_SERVICES=(backend admin account frontend)

rollback=false
if [[ "${1:-}" == "--rollback" ]]; then
  rollback=true
  shift
fi
services=("$@")
[[ ${#services[@]} -eq 0 ]] && services=("${DEFAULT_SERVICES[@]}")

container_of() { compose ps -q "$1" 2>/dev/null | head -n1; }
image_of() { docker inspect -f '{{.Config.Image}}' "$1"; }

wait_running() {
  local svc=$1 id state restarts
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

echo "Deploying $(git rev-parse --short HEAD) ($(git log -1 --format=%s)): ${services[*]}"

if [[ "$rollback" == true ]]; then
  for svc in "${services[@]}"; do
    id="$(container_of "$svc")"
    [[ -z "$id" ]] && { echo "$svc is not running" >&2; exit 1; }
    image="$(image_of "$id")"
    docker image inspect "$image-previous" >/dev/null 2>&1 || { echo "no $image-previous to roll back to" >&2; exit 1; }
    echo "Rolling $svc back to $image-previous"
    docker tag "$image-previous" "$image"
  done
else
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
fi

echo "== Swapping containers"
compose up -d --no-deps "${services[@]}"
# Point nginx at the new containers now rather than after the health checks.
reload_nginx

failed=0
for svc in "${services[@]}"; do
  wait_running "$svc" || failed=1
done

reload_nginx
compose ps
exit $failed
