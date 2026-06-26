#!/bin/bash
# Wrapper around backup-postgres.sh / backup-uploads.sh that:
#   1. Uses pipefail so the script's exit code wins over `logger`'s.
#   2. Sends an alert email via Resend on non-zero exit.
#
# Usage (in /etc/cron.d/xarxa-backups):
#   0 3 * * * root /opt/xarxa/scripts/backup-with-alert.sh postgres
#   30 3 * * * root /opt/xarxa/scripts/backup-with-alert.sh uploads
#
# Env (read from /etc/xarxa/.env + /etc/xarxa/backup.env):
#   RESEND_API_KEY — to send the alert
#   OPERATOR_EMAIL — recipient
# Defaults to a no-op alert if either is missing.

set -o pipefail

KIND="${1-}"
case "$KIND" in
  postgres) SCRIPT=/opt/xarxa/scripts/backup-postgres.sh ;;
  uploads)  SCRIPT=/opt/xarxa/scripts/backup-uploads.sh ;;
  *) echo "Usage: $0 {postgres|uploads}" >&2; exit 2 ;;
esac

if [ -r /etc/xarxa/.env ]; then
  # shellcheck disable=SC1091
  set -a; . /etc/xarxa/.env; set +a
fi
OPERATOR_EMAIL="${OPERATOR_EMAIL:-}"

LOG=$(mktemp)
trap 'rm -f "$LOG"' EXIT

"$SCRIPT" 2>&1 | tee "$LOG" | logger -t "xarxa-backup-$KIND"
EXIT=${PIPESTATUS[0]}

if [ "$EXIT" -ne 0 ]; then
  if [ -n "${RESEND_API_KEY:-}" ] && [ -n "$OPERATOR_EMAIL" ]; then
    BODY=$(tail -c 4000 "$LOG")
    curl -sS --max-time 30 -X POST \
      -H "Authorization: Bearer $RESEND_API_KEY" \
      -H "Content-Type: application/json" \
      -d "$(jq -n --arg to "$OPERATOR_EMAIL" --arg subj "xarxa backup FAILED ($KIND)" --arg body "$BODY" \
        '{from: "alerts@xarxa.help", to: [$to], subject: $subj, text: $body}')" \
      https://api.resend.com/emails >/dev/null || true
  else
    logger -t "xarxa-backup-$KIND" "ALERT skipped: RESEND_API_KEY or OPERATOR_EMAIL missing"
  fi
fi

exit "$EXIT"
