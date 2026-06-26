#!/bin/bash
# Nightly restic snapshot of the uploads Docker volume → Backblaze B2.
# Runs as root via cron. B2 credentials + restic password loaded from
# /etc/xarxa/backup.env (mode 400 root).
#
# Restore:
#   source /etc/xarxa/backup.env
#   restic snapshots               # list available
#   restic restore <id> --target /tmp/restore

set -euo pipefail

ENV_FILE=/etc/xarxa/backup.env
if [ ! -r "$ENV_FILE" ]; then
  echo "[backup-uploads] $ENV_FILE not readable" >&2
  exit 1
fi
# shellcheck source=/dev/null
source "$ENV_FILE"

UPLOADS_PATH=$(docker volume inspect xarxa_uploads --format '{{.Mountpoint}}')
if [ -z "$UPLOADS_PATH" ] || [ ! -d "$UPLOADS_PATH" ]; then
  echo "[backup-uploads] uploads volume mountpoint not found" >&2
  exit 1
fi

restic backup "$UPLOADS_PATH" --tag uploads --quiet
restic forget --keep-daily 7 --keep-weekly 4 --keep-monthly 3 --prune --quiet

echo "[backup-uploads] OK $(date -u +%FT%TZ)"
