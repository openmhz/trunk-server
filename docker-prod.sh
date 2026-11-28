#!/usr/bin/env bash
# Kept for habit: the same as `docker compose ...` with prod.env linked as .env.
set -e
cd "$(dirname "$0")"
set -a; source prod.env; set +a
export COMPOSE_FILE="${COMPOSE_FILE:-compose.yaml}"
exec docker compose "$@"
