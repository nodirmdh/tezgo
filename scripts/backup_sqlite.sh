#!/usr/bin/env bash
set -euo pipefail

DB_PATH=${DB_PATH:-"./backend/data/app.db"}
BACKUP_DIR=${BACKUP_DIR:-"./backups"}
RETENTION_DAYS=${RETENTION_DAYS:-"14"}

mkdir -p "$BACKUP_DIR"
TS=$(date +"%Y%m%d-%H%M%S")
BACKUP_FILE="$BACKUP_DIR/app-$TS.db"

sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"
gzip -f "$BACKUP_FILE"

find "$BACKUP_DIR" -type f -name "app-*.db.gz" -mtime +"$RETENTION_DAYS" -delete
echo "Backup created: $BACKUP_FILE.gz"
