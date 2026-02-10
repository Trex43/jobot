#!/bin/bash
# =============================================================================
# JobAutoFlow Backup Script
# Usage: ./backup.sh [database|files|all]
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="/tmp/jobautoflow-backups"
DATE=$(date +%Y%m%d_%H%M%S)
S3_BUCKET="${S3_BACKUP_BUCKET:-jobautoflow-backups}"
RETENTION_DAYS=30

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check dependencies
check_dependencies() {
    log_info "Checking dependencies..."
    
    command -v aws >/dev/null 2>&1 || { log_error "AWS CLI is required but not installed."; exit 1; }
    command -v pg_dump >/dev/null 2>&1 || { log_error "PostgreSQL client is required but not installed."; exit 1; }
    
    log_info "All dependencies found."
}

# Backup database
backup_database() {
    log_info "Starting database backup..."
    
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL environment variable is not set."
        exit 1
    fi
    
    mkdir -p "$BACKUP_DIR"
    
    BACKUP_FILE="jobautoflow_db_${DATE}.sql.gz"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"
    
    log_info "Creating database dump: $BACKUP_FILE"
    pg_dump "$DATABASE_URL" | gzip > "$BACKUP_PATH"
    
    log_info "Uploading to S3..."
    aws s3 cp "$BACKUP_PATH" "s3://$S3_BUCKET/database/"
    
    log_info "Cleaning up local file..."
    rm -f "$BACKUP_PATH"
    
    log_info "Database backup completed: s3://$S3_BUCKET/database/$BACKUP_FILE"
}

# Backup files
backup_files() {
    log_info "Starting files backup..."
    
    SOURCE_BUCKET="${S3_UPLOADS_BUCKET:-jobautoflow-uploads}"
    
    log_info "Syncing files from s3://$SOURCE_BUCKET to s3://$S3_BUCKET/files/$DATE/"
    aws s3 sync "s3://$SOURCE_BUCKET/" "s3://$S3_BUCKET/files/$DATE/" --storage-class STANDARD_IA
    
    log_info "Files backup completed."
}

# Create RDS snapshot
create_rds_snapshot() {
    log_info "Creating RDS snapshot..."
    
    DB_INSTANCE="${RDS_INSTANCE:-jobautoflow-db}"
    SNAPSHOT_ID="jobautoflow-manual-${DATE}"
    
    log_info "Creating snapshot: $SNAPSHOT_ID"
    aws rds create-db-snapshot \
        --db-instance-identifier "$DB_INSTANCE" \
        --db-snapshot-identifier "$SNAPSHOT_ID"
    
    log_info "Waiting for snapshot to complete..."
    aws rds wait db-snapshot-available \
        --db-snapshot-identifier "$SNAPSHOT_ID"
    
    log_info "RDS snapshot created: $SNAPSHOT_ID"
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
    
    CUTOFF_DATE=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d)
    
    # Cleanup S3 database backups
    log_info "Cleaning S3 database backups..."
    aws s3 ls "s3://$S3_BUCKET/database/" | while read -r line; do
        FILE=$(echo "$line" | awk '{print $4}')
        FILE_DATE=$(echo "$FILE" | grep -oP '\d{8}' || true)
        
        if [ -n "$FILE_DATE" ] && [ "$FILE_DATE" -lt "$CUTOFF_DATE" ]; then
            log_warn "Deleting old backup: $FILE"
            aws s3 rm "s3://$S3_BUCKET/database/$FILE"
        fi
    done
    
    # Cleanup RDS snapshots
    log_info "Cleaning RDS snapshots..."
    aws rds describe-db-snapshots \
        --snapshot-type manual \
        --query 'DBSnapshots[?starts_with(DBSnapshotIdentifier, `jobautoflow-auto-`) || starts_with(DBSnapshotIdentifier, `jobautoflow-manual-`)].[DBSnapshotIdentifier, SnapshotCreateTime]' \
        --output text | while read -r snapshot_id create_time; do
            CREATE_DATE=$(date -d "$create_time" +%s)
            CUTOFF_EPOCH=$(date -d "$RETENTION_DAYS days ago" +%s)
            
            if [ "$CREATE_DATE" -lt "$CUTOFF_EPOCH" ]; then
                log_warn "Deleting old snapshot: $snapshot_id"
                aws rds delete-db-snapshot --db-snapshot-identifier "$snapshot_id" || true
            fi
        done
    
    log_info "Cleanup completed."
}

# List backups
list_backups() {
    log_info "Listing available backups..."
    
    echo ""
    echo "=== Database Backups ==="
    aws s3 ls "s3://$S3_BUCKET/database/" | tail -10
    
    echo ""
    echo "=== RDS Snapshots ==="
    aws rds describe-db-snapshots \
        --snapshot-type manual \
        --query 'DBSnapshots[?starts_with(DBSnapshotIdentifier, `jobautoflow-`)].[DBSnapshotIdentifier, SnapshotCreateTime, Status]' \
        --output table | tail -10
    
    echo ""
    echo "=== File Backups ==="
    aws s3 ls "s3://$S3_BUCKET/files/" | tail -10
}

# Restore from backup
restore_database() {
    BACKUP_FILE="$1"
    
    if [ -z "$BACKUP_FILE" ]; then
        log_error "Please specify backup file to restore."
        log_info "Usage: ./backup.sh restore s3://bucket/database/file.sql.gz"
        exit 1
    fi
    
    log_warn "⚠️  This will OVERWRITE your current database!"
    read -p "Are you sure? Type 'yes' to continue: " confirm
    
    if [ "$confirm" != "yes" ]; then
        log_info "Restore cancelled."
        exit 0
    fi
    
    log_info "Downloading backup: $BACKUP_FILE"
    LOCAL_FILE="/tmp/restore_$(date +%s).sql.gz"
    aws s3 cp "$BACKUP_FILE" "$LOCAL_FILE"
    
    log_info "Restoring database..."
    gunzip -c "$LOCAL_FILE" | psql "$DATABASE_URL"
    
    rm -f "$LOCAL_FILE"
    
    log_info "Database restore completed."
}

# Main
main() {
    COMMAND="${1:-all}"
    
    log_info "JobAutoFlow Backup Script"
    log_info "=========================="
    log_info "Date: $(date)"
    log_info "Command: $COMMAND"
    echo ""
    
    check_dependencies
    
    case "$COMMAND" in
        database|db)
            backup_database
            ;;
        files)
            backup_files
            ;;
        snapshot|rds)
            create_rds_snapshot
            ;;
        cleanup)
            cleanup_old_backups
            ;;
        list|ls)
            list_backups
            ;;
        restore)
            restore_database "$2"
            ;;
        all|full)
            backup_database
            backup_files
            create_rds_snapshot
            cleanup_old_backups
            ;;
        *)
            echo "Usage: $0 [database|files|snapshot|cleanup|list|restore|all]"
            echo ""
            echo "Commands:"
            echo "  database  - Backup PostgreSQL database"
            echo "  files     - Backup S3 files"
            echo "  snapshot  - Create RDS snapshot"
            echo "  cleanup   - Remove old backups"
            echo "  list      - List available backups"
            echo "  restore   - Restore from backup"
            echo "  all       - Run all backup operations (default)"
            exit 1
            ;;
    esac
    
    echo ""
    log_info "Backup operations completed!"
}

main "$@"
