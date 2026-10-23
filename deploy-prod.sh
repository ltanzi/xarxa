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
# xarxa-app:latest ALWAYS means "the release that is live". It is what a
# plain `docker compose up -d` starts, which is exactly what xarxa.service
# runs at boot. It moves only when a deploy has passed its healthcheck and
# smoke test, and when someone rolls back. Until 2026-10-23 nothing moved
# it: the first reboot after go-live started a 26 August image against a
# migrated database, and /board failed.
#
# INSTANT ROLLBACK (no rebuild — the old image is still on disk):
#   docker tag xarxa-app:<good-sha> xarxa-app:latest
#   docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml \
#     up -d --no-deps --wait app
# Retag first. Rolling back with COMMIT_SHA=<sha> alone runs the right
# image but leaves `latest` on the bad release, so the next reboot brings
# it back. (git checkout <good-sha> && ./deploy-prod.sh --keep-head still
# works too, but rebuilds from scratch.)

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
# `latest` hasn't moved yet, so if anything below fails it still names the
# previous good release: rolling back is a plain `up` with no COMMIT_SHA.
ROLLBACK="docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml up -d --no-deps --wait app"
if ! docker compose --env-file /etc/xarxa/.env -f docker-compose.prod.yml up -d --no-deps --wait app; then
  echo "✗ New container never became healthy."
  echo "  Roll back with: $ROLLBACK"
  exit 1
fi

echo "→ Smoke test…"
if ! curl -sfL https://xarxa.help/ > /dev/null; then
  echo "✗ Smoke failed — check 'docker compose logs app' and 'docker compose logs caddy'"
  echo "  Roll back with: $ROLLBACK"
  exit 1
fi

# Only now is this release known-good, so only now does it become what a
# reboot starts.
docker tag "xarxa-app:$SHA" xarxa-app:latest

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
