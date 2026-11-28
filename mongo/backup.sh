#!/usr/bin/env bash
# Back up the OpenMHz database.
#
#   ./mongo/backup.sh            everything except calls (users, systems, talkgroups,
#                                groups, events, podcasts) — a few MB, run daily
#   ./mongo/backup.sh --full     including calls (~84M documents, several GB)
#
# Dumps go to $BACKUP_DIR (default: <repo>/data/backups) as gzipped mongodump
# archives, and the newest $BACKUP_KEEP (default 14) are kept.
#
# Set BACKUP_S3_URI (e.g. s3://my-private-bucket/openmhz-backups) to also copy
# each dump off the server with the AWS CLI image, using ~/.aws and
# $BACKUP_S3_PROFILE / $BACKUP_S3_ENDPOINT. The dump contains email addresses
# and password hashes: use a private bucket, never the public media bucket.
#
# Restore:
#   docker exec -i <mongo container> mongorestore --gzip --archive --drop --nsInclude='scanner.*' < dump.archive.gz
#
# Daily cron example (root crontab):
#   15 4 * * * /root/trunk-server/mongo/backup.sh >> /var/log/openmhz-backup.log 2>&1
set -euo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
repo="$(cd "$here/.." && pwd)"
backup_dir="${BACKUP_DIR:-$repo/data/backups}"
keep="${BACKUP_KEEP:-14}"

full=false
[[ "${1:-}" == "--full" ]] && full=true

container="${MONGO_CONTAINER:-$(docker ps -q --filter "label=com.docker.compose.service=mongo" | head -n1)}"
if [[ -z "$container" ]]; then
  echo "No running mongo container found; set MONGO_CONTAINER" >&2
  exit 1
fi

mkdir -p "$backup_dir"
stamp="$(date -u +%Y%m%dT%H%M%SZ)"
kind=$([[ "$full" == true ]] && echo full || echo meta)
file="$backup_dir/scanner-$kind-$stamp.archive.gz"
tmp="$file.partial"

exclude=()
[[ "$full" == true ]] || exclude=(--excludeCollection=calls)

echo "$(date -u +%FT%TZ) dumping scanner ($kind) to $file"
docker exec "$container" mongodump --quiet --db scanner ${exclude[@]+"${exclude[@]}"} --gzip --archive > "$tmp"
mv "$tmp" "$file"
echo "$(date -u +%FT%TZ) wrote $(du -h "$file" | cut -f1)"

# Keep the newest $keep dumps of this kind.
ls -1t "$backup_dir"/scanner-"$kind"-*.archive.gz 2>/dev/null | tail -n +"$((keep + 1))" | xargs -r rm -f

if [[ -n "${BACKUP_S3_URI:-}" ]]; then
  s3_args=()
  [[ -n "${BACKUP_S3_PROFILE:-}" ]] && s3_args+=(--profile "$BACKUP_S3_PROFILE")
  [[ -n "${BACKUP_S3_ENDPOINT:-}" ]] && s3_args+=(--endpoint-url "$BACKUP_S3_ENDPOINT")
  docker run --rm -v "$HOME/.aws:/root/.aws:ro" -v "$backup_dir:/backups:ro" amazon/aws-cli \
    s3 cp "/backups/$(basename "$file")" "$BACKUP_S3_URI/$(basename "$file")" ${s3_args[@]+"${s3_args[@]}"}
  echo "$(date -u +%FT%TZ) copied to $BACKUP_S3_URI"
fi
