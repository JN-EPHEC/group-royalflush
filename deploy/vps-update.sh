#!/usr/bin/env bash
# Mise à jour manuelle sur le VPS (backend Docker).
set -euo pipefail

DEPLOY_DIR="${DEPLOY_DIR:-$HOME/group-royalflush}"
ENV_FILE="${ROYALFLUSH_ENV_FILE:-$HOME/royalflush-api.env}"
BRANCH="${BRANCH:-main}"

cd "$DEPLOY_DIR"
git fetch origin "$BRANCH"
git checkout "$BRANCH"
git pull --ff-only origin "$BRANCH"

export ROYALFLUSH_ENV_FILE="$ENV_FILE"
cd deploy
docker compose up -d --build --remove-orphans

echo "Backend mis à jour ($(docker ps --filter name=royalflush-api --format '{{.Status}}'))"
