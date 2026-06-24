#!/bin/bash
# Nightly Postgres dump → gpg → Backblaze B2.
# Runs as root via cron. Reads encryption passphrase from /etc/xarxa/backup.key.
#
# Restore (locally, on a throwaway DB):
#   gpg --batch --passphrase-file /path/to/backup.key --decrypt xarxa-pg-*.sql.gpg | psql ...

set -euo pipefail

KEY_FILE=/etc/xarxa/backup.key
COMPOSE_FILE=/opt/xarxa/docker-compose.prod.yml
ENV_FILE=/etc/xarxa/.env
B2_BUCKET=xarxa-backups
DATE=$(date -u +%Y%m%d-%H%M%S)
TMP=/tmp/xarxa-pg-$DATE.sql.gpg

if [ ! -r "$KEY_FILE" ]; then
  echo "[backup-postgres] Encryption key not readable at $KEY_FILE" >&2
  exit 1
fi

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" \
  exec -T postgres pg_dump -U xarxa xarxa \
  | gpg --batch --yes --passphrase-file "$KEY_FILE" \
        --symmetric --cipher-algo AES256 \
  > "$TMP"

rclone copy "$TMP" "b2:$B2_BUCKET/postgres/" --quiet
rm "$TMP"

echo "[backup-postgres] OK $(date -u +%FT%TZ) → b2:$B2_BUCKET/postgres/$(basename "$TMP")"
