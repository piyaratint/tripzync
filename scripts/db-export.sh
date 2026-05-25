#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# db-export.sh — dump ALL data from Neon to a local .dump file
# Run this on your LOCAL machine (needs DATABASE_URL in .env.local)
#
# Usage:
#   bash scripts/db-export.sh
#   bash scripts/db-export.sh ./backups/custom-name.dump
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# Load DATABASE_URL from .env.local if not already set
if [[ -z "${DATABASE_URL:-}" ]]; then
  ENV_FILE="$(dirname "$0")/../.env.local"
  if [[ -f "$ENV_FILE" ]]; then
    export $(grep -v '^#' "$ENV_FILE" | grep 'DATABASE_URL' | xargs)
  fi
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "❌ DATABASE_URL is not set. Add it to .env.local or export it first."
  exit 1
fi

# Output file
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
OUTPUT="${1:-./backups/tripzync_${TIMESTAMP}.dump}"
mkdir -p "$(dirname "$OUTPUT")"

echo "▶ Exporting from Neon → $OUTPUT"
echo "  (this may take a moment depending on data size)"
echo ""

pg_dump "$DATABASE_URL" \
  --no-owner \
  --no-acl \
  --format=custom \
  --compress=9 \
  --file="$OUTPUT"

SIZE=$(du -sh "$OUTPUT" | cut -f1)
echo ""
echo "✅ Export complete: $OUTPUT ($SIZE)"
echo ""
echo "Next step: copy this file to your Jelastic server and run db-import.sh"
echo "  scp -P <port> $OUTPUT <user>@<host>:/tmp/tripzync.dump"
