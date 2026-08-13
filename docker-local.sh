#!/bin/bash
# Local development wrapper. Same idea as docker-test.sh, plus the MinIO storage layer.
#
#   ./docker-local.sh build
#   ./docker-local.sh up -d
#   ./docker-local.sh logs -f backend
#   ./docker-local.sh down
#
# Pass --cloud as the first argument to run against the real S3 bucket
# (test.cloud.env) instead of local MinIO, to check parity with production.

set -e

ENV_FILE=test.env
COMPOSE_FILES="-f docker-compose.yml -f test-compose.yml -f local-compose.yml"

if [ "$1" = "--cloud" ]; then
  shift
  ENV_FILE=test.cloud.env
  # No MinIO layer when pointing at real object storage.
  COMPOSE_FILES="-f docker-compose.yml -f test-compose.yml"
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE (copy test.env.example and fill it in)" >&2
  exit 1
fi

source "./$ENV_FILE"

echo "Env File: " $ENV_FILE
echo "Domains:  " $DOMAIN_NAME
echo "Protocol: " $PROTOCOL
echo "Storage:  " $S3_ENDPOINT "bucket:" $S3_BUCKET
echo "Docker Compose Command: " "$@"

docker compose $COMPOSE_FILES "$@"
