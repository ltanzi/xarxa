#!/bin/bash
# Postgres dump -> gpg -> Backblaze B2. Runs as root via cron, every 4h.
#
# Two things here exist to survive a transient B2 outage, which is what
# actually happens in practice: on 2026-10-01 a 503 "no tomes available"
# killed a run even though B2 was healthy again minutes later, and the
# finished dump was sitting in /tmp with nothing to retry it.
#
#   1. rclone retries for ~4 minutes instead of its default ~45 seconds.
#   2. The spool directory holds dumps that could not be uploaded, and
#      every later run retries them. A failure now self-heals within 4h
#      instead of needing someone on the box. Files are deleted only once
#      B2 has them.
#
# Because of (2) the retry loop must never be handed a bad dump, so the
# dump is written to .partial, verified by decrypting it and checking for
# pg_dump's completion marker, and only then renamed into the spool.
#
# Restore (locally, on a throwaway DB):
#   gpg --batch --passphrase-file /path/to/backup.key --decrypt xarxa-pg-*.sql.gpg | psql ...

set -euo pipefail

KEY_FILE=/etc/xarxa/backup.key
COMPOSE_FILE=/opt/xarxa/docker-compose.prod.yml
ENV_FILE=/etc/xarxa/.env
B2_BUCKET=xarxa-backups
# /tmp is cleared on reboot. That is acceptable: losing a pending dump
# costs one 4-hourly snapshot, never a gap in coverage, because the next
# run takes a fresh one.
SPOOL=/tmp
DATE=$(date -u +%Y%m%d-%H%M%S)
TMP=$SPOOL/xarxa-pg-$DATE.sql.gpg
PARTIAL=$TMP.partial

# B2 can 503 for minutes at a time. rclone's default (3 tries, ~15s apart)
# is not enough to ride that out.
RCLONE_RETRY=(--retries 5 --retries-sleep 60s)

if [ ! -r "$KEY_FILE" ]; then
  echo "[backup-postgres] Encryption key not readable at $KEY_FILE" >&2
  exit 1
fi

# A failed pg_dump aborts the script under `set -e` before any cleanup line
# could run, so the partial is removed on exit instead. Once promoted with
# mv the path is gone and this is a no-op.
trap 'rm -f "$PARTIAL"' EXIT

# Backstop for a run killed outright (SIGKILL, reboot), where the trap never
# fires. Partials are invisible to the upload glob, so without this they
# would accumulate unnoticed.
find "$SPOOL" -maxdepth 1 -name 'xarxa-pg-*.sql.gpg.partial' -mmin +60 -delete 2>/dev/null || true

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" \
  exec -T postgres pg_dump -U xarxa xarxa \
  | gpg --batch --yes --passphrase-file "$KEY_FILE" \
        --symmetric --cipher-algo AES256 \
  > "$PARTIAL"

# A pg_dump that dies midway still produces a well-formed .gpg of a
# truncated dump, which the retry loop would happily ship forever. grep -c
# rather than -q: -q closes the pipe on first match, which SIGPIPEs gpg,
# and pipefail would then report the verification itself as failed.
COMPLETE=$(gpg --batch --quiet --passphrase-file "$KEY_FILE" --decrypt "$PARTIAL" 2>/dev/null \
  | grep -c '^-- PostgreSQL database dump complete' || true)
if [ "$COMPLETE" -lt 1 ]; then
  echo "[backup-postgres] dump did not verify as complete - discarding, nothing uploaded" >&2
  exit 1
fi
mv "$PARTIAL" "$TMP"

# This run's dump plus anything an earlier run could not ship.
FAILED=0
shopt -s nullglob
for f in "$SPOOL"/xarxa-pg-*.sql.gpg; do
  NAME=$(basename "$f")
  if rclone copy "$f" "b2:$B2_BUCKET/postgres/" --quiet "${RCLONE_RETRY[@]}"; then
    rm -f "$f"
    echo "[backup-postgres] OK $(date -u +%FT%TZ) -> b2:$B2_BUCKET/postgres/$NAME"
  else
    echo "[backup-postgres] upload FAILED for $NAME - kept in $SPOOL, next run retries it" >&2
    FAILED=1
  fi
done
shopt -u nullglob

exit "$FAILED"
