#!/bin/bash
# ==============================================================================
# Pioneer Trio Backend - Automated PostgreSQL & S3 Backup Script
# ==============================================================================

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/pioneer}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="${POSTGRES_DB:-pioneer_production}"
DB_USER="${POSTGRES_USER:-pioneer_prod}"
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
BACKUP_FILE="${BACKUP_DIR}/pioneer_db_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting automated backup of ${DB_NAME}..."

# Export compressed Postgres dump
PGPASSWORD="${POSTGRES_PASSWORD:-}" pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -F c -b -v -f "${BACKUP_FILE}" "${DB_NAME}"

echo "[$(date)] Database backup completed successfully: ${BACKUP_FILE}"

# Optional: Upload to secondary offsite backup (e.g. AWS S3 Glacier or Wasabi)
if [ -n "${OFFSITE_BACKUP_BUCKET:-}" ]; then
  echo "[$(date)] Syncing backup to offsite storage: s3://${OFFSITE_BACKUP_BUCKET}/backups/"
  aws s3 cp "${BACKUP_FILE}" "s3://${OFFSITE_BACKUP_BUCKET}/backups/pioneer_db_${TIMESTAMP}.sql.gz"
fi

# Rotate backups older than RETENTION_DAYS
echo "[$(date)] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -type f -name "pioneer_db_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

echo "[$(date)] Backup process finished successfully."
