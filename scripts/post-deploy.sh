#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# post-deploy.sh — runs ON the Jelastic server after server-deploy.sh finishes
# Verifies the app is healthy before declaring the deploy successful.
# Exits non-zero if any check fails (causes GitHub Actions to mark deploy ❌).
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

PORT="${PORT:-3000}"
APP_NAME="${APP_NAME:-tripzync}"
HEALTH_URL="http://localhost:${PORT}"
MAX_WAIT=30          # seconds to wait for app to come up
INTERVAL=2           # seconds between retries

PASS="✅"
FAIL="❌"
WARN="⚠️ "

echo ""
echo "═══════════════════════════════════════════"
echo "  TripZync post-deploy checks"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════"
echo ""

ERRORS=0

# ─── 1. Required env vars ─────────────────────────────────────────────────────
echo "── 1. Environment variables"

REQUIRED_VARS=(
  DATABASE_URL
  AUTH_SECRET
  AUTH_GOOGLE_ID
  AUTH_GOOGLE_SECRET
  NEXTAUTH_URL
  GOOGLE_PLACES_API_KEY
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  ANTHROPIC_API_KEY
)

for VAR in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!VAR:-}" ]]; then
    echo "   $FAIL $VAR — NOT SET"
    ERRORS=$((ERRORS + 1))
  else
    # Mask the value — show first 6 chars only
    VAL="${!VAR}"
    MASKED="${VAL:0:6}…"
    echo "   $PASS $VAR = $MASKED"
  fi
done
echo ""

# ─── 2. PM2 process running ───────────────────────────────────────────────────
echo "── 2. PM2 process"

if pm2 list | grep -q "$APP_NAME"; then
  STATUS=$(pm2 jlist 2>/dev/null | python3 -c "
import sys, json
procs = json.load(sys.stdin)
for p in procs:
    if p.get('name') == '${APP_NAME}':
        print(p.get('pm2_env', {}).get('status', 'unknown'))
        break
" 2>/dev/null || echo "unknown")

  if [[ "$STATUS" == "online" ]]; then
    echo "   $PASS PM2 process '$APP_NAME' is online"
  else
    echo "   $FAIL PM2 process '$APP_NAME' status: $STATUS"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "   $FAIL PM2 process '$APP_NAME' not found"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# ─── 3. App responds on port ──────────────────────────────────────────────────
echo "── 3. HTTP health check ($HEALTH_URL)"

WAITED=0
HTTP_OK=false

while [[ $WAITED -lt $MAX_WAIT ]]; do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH_URL" 2>/dev/null || true)
  if [[ "$HTTP_CODE" =~ ^(200|301|302|307|308)$ ]]; then
    HTTP_OK=true
    break
  fi
  sleep $INTERVAL
  WAITED=$((WAITED + INTERVAL))
done

if $HTTP_OK; then
  echo "   $PASS App responded HTTP $HTTP_CODE in ${WAITED}s"
else
  echo "   $FAIL App did not respond on port $PORT after ${MAX_WAIT}s (last code: ${HTTP_CODE:-none})"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# ─── 4. Standalone build artefacts exist ─────────────────────────────────────
echo "── 4. Build artefacts"

REQUIRED_PATHS=(
  ".next/standalone/server.js"
  ".next/standalone/public"
  ".next/standalone/.next/static"
)

for PATH_CHECK in "${REQUIRED_PATHS[@]}"; do
  if [[ -e "$PATH_CHECK" ]]; then
    echo "   $PASS $PATH_CHECK"
  else
    echo "   $FAIL $PATH_CHECK — MISSING"
    ERRORS=$((ERRORS + 1))
  fi
done
echo ""

# ─── 5. Database connectivity ─────────────────────────────────────────────────
echo "── 5. Database connectivity"

# Hit the /api/me/trip endpoint — it queries the DB; a 401 means DB is reachable
DB_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$HEALTH_URL/api/me/trip" 2>/dev/null || true)

if [[ "$DB_CODE" =~ ^(200|401|403)$ ]]; then
  echo "   $PASS DB reachable (API returned HTTP $DB_CODE)"
elif [[ "$DB_CODE" == "500" ]]; then
  echo "   $FAIL DB unreachable — /api/me/trip returned 500 (check DATABASE_URL)"
  ERRORS=$((ERRORS + 1))
else
  echo "   $WARN /api/me/trip returned HTTP $DB_CODE — manual check recommended"
fi
echo ""

# ─── Summary ──────────────────────────────────────────────────────────────────
echo "═══════════════════════════════════════════"
if [[ $ERRORS -eq 0 ]]; then
  echo "  $PASS All checks passed — deploy is healthy"
  echo "═══════════════════════════════════════════"
  echo ""
  exit 0
else
  echo "  $FAIL $ERRORS check(s) failed — review output above"
  echo "═══════════════════════════════════════════"
  echo ""
  exit 1
fi
