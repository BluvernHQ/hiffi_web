#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f ".next/standalone/server.js" ]]; then
  echo "[hiffi-web] Missing .next/standalone/server.js. Run: npm run build"
  exit 1
fi

if [[ ! -d ".next/static" ]]; then
  echo "[hiffi-web] Missing .next/static. Run: npm run build"
  exit 1
fi

mkdir -p ".next/standalone/.next"
rm -rf ".next/standalone/.next/static" ".next/standalone/public"
cp -a ".next/static" ".next/standalone/.next/static"
cp -a "public" ".next/standalone/public"

export PORT="${PORT:-3002}"
export HOSTNAME="${APP_HOSTNAME:-0.0.0.0}"

echo "[hiffi-web] Starting standalone server on ${HOSTNAME}:${PORT}"
exec node ".next/standalone/server.js"
