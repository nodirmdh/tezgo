#!/usr/bin/env bash
set -euo pipefail

BACKUP_FILE=${1:-""}
DB_PATH=${DB_PATH:-"./backend/data/app.db"}

if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage: DB_PATH=... ./scripts/restore_sqlite.sh <backup.db.gz|backup.db>"
  exit 1
fi

TMP_FILE="$BACKUP_FILE"
if [[ "$BACKUP_FILE" == *.gz ]]; then
  TMP_FILE="$(mktemp)"
  gunzip -c "$BACKUP_FILE" > "$TMP_FILE"
fi

sqlite3 "$DB_PATH" ".restore '$TMP_FILE'"

if [[ "$BACKUP_FILE" == *.gz ]]; then
  rm -f "$TMP_FILE"
fi

echo "Restore finished: $DB_PATH"
