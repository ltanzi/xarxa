#!/bin/bash
# Production deploy script. Runs on the Hetzner box from /opt/xarxa.
# Usage: ./deploy-prod.sh
#
# Reads secrets from /etc/xarxa/.env. Builds the image tagged with the
# current commit SHA, applies Prisma db push, swaps the app container,
# smoke-tests https://xarxa.org/.

set -euo pipefail

cd /opt/xarxa

echo "→ Pulling latest…"
git fetch origin
git reset --hard origin/main

SHA=$(git rev-parse --short HEAD)
export COMMIT_SHA=$SHA

echo "→ Building image for $SHA…"
docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml build app

echo "→ Applying DB migrations…"
docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml run --rm \
  app npx prisma db push --accept-data-loss

echo "→ Restarting app…"
docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml up -d --no-deps app

echo "→ Smoke test…"
sleep 5
if ! curl -sfL https://xarxa.org/ > /dev/null; then
  echo "✗ Smoke failed — check 'docker compose logs app' and 'docker compose logs caddy'"
  exit 1
fi

echo "✓ Deploy OK at $(date -u +%FT%TZ) — sha=$SHA"
