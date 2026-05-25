#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# server-deploy.sh — runs ON the Jelastic server via SSH during CI/CD
# Called by GitHub Actions; do NOT run locally.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/webroot/ROOT}"   # default Jelastic app root

echo "▶ Entering $APP_DIR"
cd "$APP_DIR"

echo "▶ Pulling latest code"
git pull origin main

echo "▶ Installing dependencies (ci = exact lockfile)"
npm ci --omit=dev

echo "▶ Running DB migrations"
npm run db:migrate

echo "▶ Building Next.js (standalone)"
npm run build

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

echo "✅ Deploy complete"
