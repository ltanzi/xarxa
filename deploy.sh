#!/bin/bash
# deploy.sh — Pull latest changes and start xarxa
# Usage: ./deploy.sh [--fresh]
#   --fresh: Reset database and reseed (destroys all data)

set -e

cd "$(dirname "$0")"

echo "Pulling latest changes..."
git pull

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npx prisma generate

if [ "$1" = "--fresh" ]; then
  echo "Resetting database (fresh seed)..."
  npx prisma db push --force-reset
  npx prisma db seed
else
  echo "Applying schema changes..."
  npx prisma db push
fi

echo "Starting xarxa..."
npm run dev
