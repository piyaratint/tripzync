#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# server-deploy.sh — runs ON the Jelastic server via SSH during CI/CD
# Called by GitHub Actions; do NOT run locally.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="${APP_DIR:-/home/jelastic/ROOT}"     # Jelastic app root
PORT="${PORT:-3000}"                          # Next.js listens on this port

echo "▶ Entering $APP_DIR"
cd "$APP_DIR"

echo "▶ Pulling latest code"
git pull origin main

echo "▶ Installing dependencies (ci = exact lockfile)"
npm ci --omit=dev

echo "▶ Running DB migrations"
npm run db:migrate

echo "▶ Building Next.js (standalone)"
# Unset NODE_ENV first, then set to production — overrides any value in .env
# or the system environment that would trigger Next.js non-standard NODE_ENV warning
unset NODE_ENV
NODE_ENV=production npm run build

# Copy static assets into the standalone output (Next.js requires this step)
echo "▶ Copying public/ and static assets into standalone build"
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

echo "▶ Reloading PM2 (zero-downtime)"
if pm2 list | grep -q "tripzync"; then
  pm2 reload tripzync
else
  pm2 start ecosystem.config.js --env production
  pm2 save
fi

echo "▶ Running post-deploy checks"
bash "$APP_DIR/scripts/post-deploy.sh"
