#!/usr/bin/env bash
# Kept for habit: the same as `docker compose ...` with test.env copied to .env.
set -e
cd "$(dirname "$0")"
set -a; source test.env; set +a
export COMPOSE_FILE="${COMPOSE_FILE:-compose.yaml:compose.test.yaml}"
exec docker compose "$@"
