#!/usr/bin/env bash
# Database maintenance for OpenMHz. Run from anywhere on the Docker host.
#
#   ./mongo/db.sh report                        read-only health report
#   ./mongo/db.sh indexes [--apply]             create the indexes the app needs
#   ./mongo/db.sh dedupe [--apply]              remove duplicate/orphaned talkgroups and groups
#   ./mongo/db.sh drop-leftovers [--apply]      drop collections nothing uses any more
#   ./mongo/db.sh remove-system <id> [--apply]  delete one duplicate system document
#   ./mongo/db.sh prune-inactive [--apply]      delete systems inactive for 6+ months
#   ./mongo/db.sh clean-calls [--apply]         delete calls older than one month
#   ./mongo/db.sh backup                        dump the database (see backup.sh)
#   ./mongo/db.sh shell                         open mongosh on the scanner database
#
# Commands that change data are dry runs unless --apply is given.
# Set MONGO_CONTAINER to override which container is used.
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"

find_container() {
  if [[ -n "${MONGO_CONTAINER:-}" ]]; then
    echo "$MONGO_CONTAINER"
    return
  fi
  # The compose project's mongo service, whatever the project is called.
  local id
  id="$(docker ps -q --filter "label=com.docker.compose.service=mongo" | head -n1)"
  if [[ -z "$id" ]]; then
    echo "No running mongo container found; set MONGO_CONTAINER" >&2
    exit 1
  fi
  echo "$id"
}

usage() {
  sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'
  exit 1
}

cmd="${1:-}"
[[ -z "$cmd" ]] && usage
shift

case "$cmd" in
  backup)
    exec "$here/backup.sh" "$@"
    ;;
  shell)
    exec docker exec -it "$(find_container)" mongosh scanner
    ;;
  report|indexes|dedupe|drop-leftovers|remove-system|prune-inactive|clean-calls)
    ;;
  *)
    usage
    ;;
esac

apply=false
id=""
for arg in "$@"; do
  case "$arg" in
    --apply) apply=true ;;
    *)
      if [[ "$arg" =~ ^[0-9a-f]{24}$ ]]; then
        id="$arg"
      else
        echo "Unknown argument: $arg" >&2
        usage
      fi
      ;;
  esac
done

container="$(find_container)"
docker cp "$here/scripts/maintain.js" "$container:/tmp/openmhz-maintain.js" >/dev/null
docker exec "$container" mongosh --quiet scanner \
  --eval "globalThis.ARGS = { cmd: '$cmd', apply: $apply, id: '$id' }; undefined" \
  --file /tmp/openmhz-maintain.js
