#!/usr/bin/env bash
# ============================================================================
# ORBITWATCH Database Backup Script (Linux / macOS)
# ============================================================================

set -e
BACKUP_DIR="$(dirname "$0")/snapshots"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$BACKUP_DIR/orbitwatch_backup_$TIMESTAMP.sql"

if command -v mysqldump &> /dev/null; then
    echo "Creating physical mysqldump backup to $OUTPUT_FILE..."
    mysqldump -u root -p"Arihant@006" --routines --triggers --events --databases orbitwatch_db > "$OUTPUT_FILE"
    echo "✓ mysqldump backup completed successfully."
else
    echo "mysqldump not found in PATH, running Node snapshot export..."
    npm run snapshot:export
fi
