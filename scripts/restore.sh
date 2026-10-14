#!/usr/bin/env bash
# ============================================================================
# ORBITWATCH Database Restore Script (Linux / macOS)
# ============================================================================

set -e
BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
    BACKUP_DIR="$(dirname "$0")/snapshots"
    BACKUP_FILE=$(ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | head -n 1)
fi

if [ -n "$BACKUP_FILE" ] && [ -f "$BACKUP_FILE" ]; then
    echo "Restoring database from $BACKUP_FILE..."
    mysql -u root -p"Arihant@006" < "$BACKUP_FILE"
    echo "✓ Database restored successfully."
else
    echo "Restoring from offline JSON snapshot..."
    npm run snapshot:import
fi
