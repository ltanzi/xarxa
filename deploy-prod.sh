#!/bin/bash
# Production deploy script. Runs on the Hetzner box from /opt/xarxa.
# Usage:
#   ./deploy-prod.sh             — pull origin/main and deploy it
#   ./deploy-prod.sh --keep-head — build + restart at the current HEAD,
#                                   skipping the git fetch+reset. Use this
#                                   for rollbacks (you've already checked
#                                   out a known-good SHA in detached HEAD).
#
# Reads secrets from /etc/xarxa/.env. Builds the image tagged
# xarxa-app:<sha>, applies recorded Prisma migrations, swaps the app
# container gated on its healthcheck (--wait), smoke-tests
# https://xarxa.help/, then prunes build cache and keeps only the 5 most
# recent SHA images so the disk stays bounded.
#
# INSTANT ROLLBACK (no rebuild — the old image is still on disk):
#   COMMIT_SHA=<good-sha> docker compose --env-file /etc/xarxa/.env \
#     -f docker-compose.prod.yml up -d --no-deps --wait app
# (git checkout <good-sha> && ./deploy-prod.sh --keep-head still works
# too, but rebuilds from scratch.)

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

# Apply recorded migrations only (prisma/migrations/*). Unlike the old
# `db push`, this never diffs prod against the schema at deploy time —
# destructive changes show up as reviewable SQL in the PR diff instead of
# a surprise prompt on the box, and every applied change is recorded in
# _prisma_migrations for a rebuild-from-history restore. New schema work:
# `npx prisma migrate dev --name <what-changed>` locally, commit the
# generated folder. (Prod DB was baselined with `migrate resolve
# --applied 0_init` on 2026-08-26.)
echo "→ Applying DB migrations…"
docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml run --rm \
  app npx prisma migrate deploy

echo "→ Restarting app (waiting for healthcheck)…"
PREV_TAG=$(docker inspect --format '{{.Config.Image}}' xarxa-app-1 2>/dev/null || echo "")
if ! docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml up -d --no-deps --wait app; then
  echo "✗ New container never became healthy."
  [ -n "$PREV_TAG" ] && echo "  Roll back with: COMMIT_SHA=${PREV_TAG#xarxa-app:} docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml up -d --no-deps --wait app"
  exit 1
fi

echo "→ Smoke test…"
if ! curl -sfL https://xarxa.help/ > /dev/null; then
  echo "✗ Smoke failed — check 'docker compose logs app' and 'docker compose logs caddy'"
  [ -n "$PREV_TAG" ] && echo "  Roll back with: COMMIT_SHA=${PREV_TAG#xarxa-app:} docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml up -d --no-deps --wait app"
  exit 1
fi

# Keep the disk bounded: without this, every deploy leaves ~1GB of build cache
# and an orphaned image behind (measured 19GB accumulated before this was
# added). 72h filter keeps recent layers so rebuilds stay fast; the 5 newest
# SHA-tagged images stay available for instant rollback.
echo "→ Pruning old build cache + images (keeping last 5 SHAs)…"
docker builder prune -f --filter "until=72h" | tail -1 || true
docker image prune -f | tail -1 || true
docker images xarxa-app --format '{{.Tag}}' | grep -vx latest | tail -n +6 \
  | xargs -r -I{} docker rmi "xarxa-app:{}" > /dev/null || true

echo "✓ Deploy OK at $(date -u +%FT%TZ) — sha=$SHA"
