#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# db-export.sh — dump from Neon (source) to file OR direct pipe to target DB
#
# MODE 1 — dump to file (run anywhere):
#   bash scripts/db-export.sh
#   → writes backups/tripzync_TIMESTAMP.dump
#
# MODE 2 — direct pipe on your Postgres server (fastest, no file needed):
#   export SOURCE_DB_URL="postgresql://neon-connection-string"
#   export TARGET_DB_URL="postgresql://user:pass@localhost:5432/tripzync"
#   bash scripts/db-export.sh --direct
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DIRECT=false
[[ "${1:-}" == "--direct" ]] && DIRECT=true

# ── Resolve SOURCE_DB_URL ────────────────────────────────────────────────────
if [[ -z "${SOURCE_DB_URL:-}" ]]; then
  # Fall back to DATABASE_URL from .env.local (if running locally)
  ENV_FILE="$(dirname "$0")/../.env.local"
  if [[ -f "$ENV_FILE" ]]; then
    SOURCE_DB_URL=$(grep -v '^#' "$ENV_FILE" | grep 'DATABASE_URL' | cut -d= -f2- | xargs)
  fi
fi

if [[ -z "${SOURCE_DB_URL:-}" ]]; then
  echo "❌ Set SOURCE_DB_URL to your Neon connection string:"
  echo "   export SOURCE_DB_URL='postgresql://...@neon.tech/neondb?sslmode=require'"
  exit 1
fi

# ── MODE 2: direct pipe (server-side) ────────────────────────────────────────
if $DIRECT; then
  if [[ -z "${TARGET_DB_URL:-}" ]]; then
    echo "❌ Set TARGET_DB_URL to your dedicated Postgres:"
    echo "   export TARGET_DB_URL='postgresql://user:pass@localhost:5432/tripzync'"
    exit 1
  fi

  TARGET_DB_NAME=$(echo "$TARGET_DB_URL" | sed 's|.*\/||' | sed 's|?.*||')
  TARGET_BASE=$(echo "$TARGET_DB_URL" | sed "s|\/$TARGET_DB_NAME.*||")/postgres

  echo "▶ Creating database '$TARGET_DB_NAME' if it doesn't exist"
  psql "$TARGET_BASE" -c "CREATE DATABASE \"$TARGET_DB_NAME\";" 2>/dev/null \
    && echo "   Created." \
    || echo "   Already exists — skipping."
  echo ""

  echo "▶ Piping Neon → $TARGET_DB_NAME (no temp file)"
  pg_dump "$SOURCE_DB_URL" \
    --no-owner \
    --no-acl \
    --format=custom \
  | pg_restore \
    --dbname="$TARGET_DB_URL" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    2>&1 | grep -v "^pg_restore: warning" || true

  echo ""
  echo "▶ Row counts"
  psql "$TARGET_DB_URL" -c "
    SELECT tablename, n_live_tup AS rows
    FROM pg_stat_user_tables
    ORDER BY tablename;
  "
  echo ""
  echo "✅ Direct migration complete — update DATABASE_URL and restart the app."
  exit 0
fi

# ── MODE 1: dump to file ─────────────────────────────────────────────────────
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
OUTPUT="${1:-./backups/tripzync_${TIMESTAMP}.dump}"
mkdir -p "$(dirname "$OUTPUT")"

echo "▶ Dumping Neon → $OUTPUT"
pg_dump "$SOURCE_DB_URL" \
  --no-owner \
  --no-acl \
  --format=custom \
  --compress=9 \
  --file="$OUTPUT"

SIZE=$(du -sh "$OUTPUT" | cut -f1)
echo "✅ Done: $OUTPUT ($SIZE)"
echo ""
echo "Restore with:"
echo "  export NEW_DB_URL='postgresql://user:pass@host:5432/tripzync'"
echo "  bash scripts/db-import.sh $OUTPUT"
