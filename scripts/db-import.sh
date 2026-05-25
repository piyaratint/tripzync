#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# db-import.sh — restore dump into your dedicated Postgres (Jelastic)
# Run this ON the Jelastic server (or any machine with pg_restore + access)
#
# Usage:
#   bash scripts/db-import.sh /tmp/tripzync.dump
#
# Required env vars (set in Jelastic dashboard or export before running):
#   NEW_DB_URL   postgresql://user:password@host:5432/dbname
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DUMP_FILE="${1:-}"
if [[ -z "$DUMP_FILE" || ! -f "$DUMP_FILE" ]]; then
  echo "❌ Usage: bash scripts/db-import.sh /path/to/tripzync.dump"
  exit 1
fi

if [[ -z "${NEW_DB_URL:-}" ]]; then
  echo "❌ NEW_DB_URL is not set."
  echo "   Export it first: export NEW_DB_URL=postgresql://user:pass@host:5432/dbname"
  exit 1
fi

echo "▶ Target database: ${NEW_DB_URL%%@*}@…"   # mask credentials in log
echo "▶ Dump file: $DUMP_FILE"
echo ""

# ── Create the target database if it doesn't exist ───────────────────────────
# Extract components from URL: postgresql://user:pass@host:port/dbname
DB_NAME=$(echo "$NEW_DB_URL" | sed 's|.*\/||' | sed 's|?.*||')
DB_BASE_URL=$(echo "$NEW_DB_URL" | sed "s|\/$DB_NAME.*||")/postgres

echo "▶ Ensuring database '$DB_NAME' exists"
psql "$DB_BASE_URL" -c "CREATE DATABASE \"$DB_NAME\";" 2>/dev/null \
  && echo "   Created database '$DB_NAME'" \
  || echo "   Database '$DB_NAME' already exists — skipping"
echo ""

# ── Restore ───────────────────────────────────────────────────────────────────
echo "▶ Restoring dump (this may take a moment)"
pg_restore \
  --dbname="$NEW_DB_URL" \
  --no-owner \
  --no-acl \
  --clean \
  --if-exists \
  --verbose \
  "$DUMP_FILE" 2>&1 | grep -v "^pg_restore: warning" || true

echo ""
echo "▶ Verifying row counts"
psql "$NEW_DB_URL" -c "
SELECT
  schemaname,
  tablename,
  n_live_tup AS rows
FROM pg_stat_user_tables
ORDER BY tablename;
"

echo ""
echo "✅ Import complete!"
echo ""
echo "Next steps:"
echo "  1. Update DATABASE_URL in Jelastic dashboard to: $NEW_DB_URL"
echo "  2. Redeploy the app: bash scripts/server-deploy.sh"
