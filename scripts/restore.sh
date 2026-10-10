#!/bin/bash
# ==============================================================================
# Pioneer Trio Backend - Database Disaster Recovery Restore Script
# ==============================================================================

set -euo pipefail

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <path_to_backup_file.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"
DB_NAME="${POSTGRES_DB:-pioneer_production}"
DB_USER="${POSTGRES_USER:-pioneer_prod}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "WARNING: This will restore database '${DB_NAME}' from '${BACKUP_FILE}'."
echo "All current data in '${DB_NAME}' will be overwritten!"
read -p "Type 'RESTORE' to confirm: " CONFIRMATION

if [ "${CONFIRMATION}" != "RESTORE" ]; then
  echo "Restore operation cancelled."
  exit 0
fi

echo "[$(date)] Restoring ${DB_NAME} from ${BACKUP_FILE}..."

# Terminate active client connections
PGPASSWORD="${POSTGRES_PASSWORD:-}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d postgres -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();"

# Drop and recreate database
PGPASSWORD="${POSTGRES_PASSWORD:-}" dropdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" --if-exists "${DB_NAME}"
PGPASSWORD="${POSTGRES_PASSWORD:-}" createdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" "${DB_NAME}"

# Restore dump
PGPASSWORD="${POSTGRES_PASSWORD:-}" pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -v "${BACKUP_FILE}"

echo "[$(date)] Database restoration finished successfully."
