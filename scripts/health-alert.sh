#!/bin/bash
# Host health watchdog: emails the operator when disk or memory crosses
# a threshold, BEFORE it becomes an outage. Complements UptimeRobot
# (which only notices once the site is already down).
#
# Usage (in /etc/cron.d/xarxa-health):
#   */30 * * * * root /opt/xarxa/scripts/health-alert.sh
#
# Env (read from /etc/xarxa/.env):
#   RESEND_API_KEY — to send the alert
#   OPERATOR_EMAIL — recipient
#
# Thresholds: disk > 80% used, or available memory < 300 MB.
# Silent when healthy; at most one email per condition per 6h (stamp files
# in /run so a sustained condition doesn't email every 30 minutes).

set -uo pipefail

DISK_LIMIT_PCT=80
MEM_LIMIT_MB=300
STAMP_DIR=/run/xarxa-health
RESEND_INTERVAL_MIN=360

mkdir -p "$STAMP_DIR"

if [ -r /etc/xarxa/.env ]; then
  # shellcheck disable=SC1091
  set -a; . /etc/xarxa/.env; set +a
fi
OPERATOR_EMAIL="${OPERATOR_EMAIL:-}"

alert() {
  local kind="$1" subject="$2" body="$3"
  local stamp="$STAMP_DIR/$kind"
  # Debounce: skip if we alerted for this condition recently.
  if [ -f "$stamp" ] && [ -n "$(find "$stamp" -mmin -"$RESEND_INTERVAL_MIN" 2>/dev/null)" ]; then
    return 0
  fi
  touch "$stamp"
  logger -t xarxa-health "ALERT: $subject"
  if [ -n "${RESEND_API_KEY:-}" ] && [ -n "$OPERATOR_EMAIL" ]; then
    curl -sS --max-time 30 -X POST \
      -H "Authorization: Bearer $RESEND_API_KEY" \
      -H "Content-Type: application/json" \
      -d "$(jq -n --arg to "$OPERATOR_EMAIL" --arg subj "$subject" --arg body "$body" \
        '{from: "alerts@xarxa.help", to: [$to], subject: $subj, text: $body}')" \
      https://api.resend.com/emails >/dev/null || true
  else
    logger -t xarxa-health "ALERT email skipped: RESEND_API_KEY or OPERATOR_EMAIL missing"
  fi
}

clear_stamp() { rm -f "$STAMP_DIR/$1"; }

# --- Disk ---
DISK_PCT=$(df --output=pcent / | tail -1 | tr -dc '0-9')
if [ "${DISK_PCT:-0}" -gt "$DISK_LIMIT_PCT" ]; then
  alert disk "xarxa host: disk at ${DISK_PCT}%" \
"Disk usage on / crossed ${DISK_LIMIT_PCT}%.

$(df -h /)

$(docker system df 2>/dev/null || true)

Likely fix: docker builder prune -af && docker image prune -f
Runbook: /opt/xarxa/docs/runbook.md"
else
  clear_stamp disk
fi

# --- Memory ---
MEM_AVAIL_MB=$(awk '/MemAvailable/ {printf "%d", $2/1024}' /proc/meminfo)
if [ "${MEM_AVAIL_MB:-99999}" -lt "$MEM_LIMIT_MB" ]; then
  alert mem "xarxa host: only ${MEM_AVAIL_MB}MB memory available" \
"Available memory dropped below ${MEM_LIMIT_MB}MB.

$(free -m)

$(docker stats --no-stream --format '{{.Name}}\t{{.MemUsage}}' 2>/dev/null || true)

If a deploy/build is running this may be transient. If not, check
'docker compose logs app' for a leak and consider restarting the app."
else
  clear_stamp mem
fi
