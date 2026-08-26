#!/bin/bash
# Production deploy script. Runs on the Hetzner box from /opt/xarxa.
# Usage:
#   ./deploy-prod.sh             — pull origin/main and deploy it
#   ./deploy-prod.sh --keep-head — build + restart at the current HEAD,
#                                   skipping the git fetch+reset. Use this
#                                   for rollbacks (you've already checked
#                                   out a known-good SHA in detached HEAD).
#
# Reads secrets from /etc/xarxa/.env. Builds the image (COMMIT_SHA is a
# build arg baked into the app env, not an image tag), applies Prisma
# db push, swaps the app container, smoke-tests https://xarxa.help/,
# then prunes build cache + dangling images older than 72h so repeated
# deploys can't fill the disk.

set -euo pipefail

cd /opt/xarxa

if [ "${1-}" = "--keep-head" ]; then
  echo "→ --keep-head: skipping git fetch/reset (rollback mode)"
else
  echo "→ Pulling latest from origin/main…"
  git fetch origin
  git reset --hard origin/main
fi

SHA=$(git rev-parse --short HEAD)
export COMMIT_SHA=$SHA

echo "→ Building image for $SHA…"
docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml build app

# Apply additive schema changes only. --accept-data-loss was removed
# intentionally: a destructive column rename / column drop must be done
# manually with a witness. If you see "WARN: Drift detected" from this
# step, STOP and inspect — don't pass --accept-data-loss reflexively.
echo "→ Applying DB migrations (additive only)…"
docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml run --rm \
  app npx prisma db push

echo "→ Restarting app…"
docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml up -d --no-deps app

echo "→ Smoke test…"
sleep 5
if ! curl -sfL https://xarxa.help/ > /dev/null; then
  echo "✗ Smoke failed — check 'docker compose logs app' and 'docker compose logs caddy'"
  exit 1
fi

# Keep the disk bounded: without this, every deploy leaves ~1GB of build cache
# and an orphaned <none> image behind (measured 19GB accumulated before
# this was added). 72h filter keeps recent layers so rebuilds stay fast.
echo "→ Pruning old build cache + dangling images…"
docker builder prune -f --filter "until=72h" | tail -1 || true
docker image prune -f | tail -1 || true

echo "✓ Deploy OK at $(date -u +%FT%TZ) — sha=$SHA"
