#!/bin/bash
# =============================================================================
# JobAutoFlow Rollback Script
# Usage: ./rollback.sh [version|list|help]
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
AWS_REGION="${AWS_REGION:-us-east-1}"
ECS_CLUSTER="${ECS_CLUSTER:-jobautoflow-cluster}"
ECS_SERVICE="${ECS_SERVICE:-jobautoflow-backend}"
ECR_REPOSITORY="${ECR_REPOSITORY:-jobautoflow-backend}"

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

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check AWS CLI
check_aws() {
    command -v aws >/dev/null 2>&1 || { log_error "AWS CLI is required."; exit 1; }
}

# List available versions
list_versions() {
    log_info "Available ECS Task Definition Versions:"
    echo ""
    
    aws ecs list-task-definitions \
        --family-prefix "$ECS_SERVICE" \
        --sort DESC \
        --query 'taskDefinitionArns[:10]' \
        --output table
    
    echo ""
    log_info "Available ECR Images:"
    echo ""
    
    aws ecr describe-images \
        --repository-name "$ECR_REPOSITORY" \
        --query 'imageDetails[*].{Tag:imageTags[0],Pushed:imagePushedAt,Size:imageSizeInBytes}' \
        --output table | head -15
}

# Get current deployment info
get_current_deployment() {
    log_info "Current Deployment:"
    echo ""
    
    aws ecs describe-services \
        --cluster "$ECS_CLUSTER" \
        --services "$ECS_SERVICE" \
        --query 'services[0].{Name:serviceName,Status:status,Running:runningCount,Desired:desiredCount,TaskDef:taskDefinition,Deployments:deployments}' \
        --output table
}

# Rollback to specific task definition version
rollback_to_version() {
    VERSION="$1"
    
    if [ -z "$VERSION" ]; then
        log_error "Please specify a version number."
        log_info "Usage: ./rollback.sh version 5"
        exit 1
    fi
    
    TASK_DEF="arn:aws:ecs:$AWS_REGION:$(aws sts get-caller-identity --query Account --output text):task-definition/$ECS_SERVICE:$VERSION"
    
    log_warn "⚠️  Rolling back to version $VERSION"
    log_warn "Task Definition: $TASK_DEF"
    echo ""
    
    read -p "Are you sure? Type 'rollback' to continue: " confirm
    
    if [ "$confirm" != "rollback" ]; then
        log_info "Rollback cancelled."
        exit 0
    fi
    
    log_step "Updating ECS service..."
    aws ecs update-service \
        --cluster "$ECS_CLUSTER" \
        --service "$ECS_SERVICE" \
        --task-definition "$TASK_DEF" \
        --force-new-deployment
    
    log_step "Waiting for deployment to stabilize..."
    aws ecs wait services-stable \
        --cluster "$ECS_CLUSTER" \
        --services "$ECS_SERVICE"
    
    log_info "Rollback completed successfully!"
    echo ""
    get_current_deployment
}

# Rollback to previous version
rollback_previous() {
    log_info "Getting current task definition..."
    
    CURRENT_TD=$(aws ecs describe-services \
        --cluster "$ECS_CLUSTER" \
        --services "$ECS_SERVICE" \
        --query 'services[0].taskDefinition' \
        --output text)
    
    CURRENT_VERSION=$(echo "$CURRENT_TD" | grep -oP ':\K\d+$')
    PREVIOUS_VERSION=$((CURRENT_VERSION - 1))
    
    if [ "$PREVIOUS_VERSION" -lt 1 ]; then
        log_error "No previous version available."
        exit 1
    fi
    
    log_warn "Current version: $CURRENT_VERSION"
    log_warn "Rolling back to version: $PREVIOUS_VERSION"
    echo ""
    
    rollback_to_version "$PREVIOUS_VERSION"
}

# Database rollback
database_rollback() {
    log_info "Available Database Backups:"
    echo ""
    
    S3_BUCKET="${S3_BACKUP_BUCKET:-jobautoflow-backups}"
    aws s3 ls "s3://$S3_BUCKET/database/" | tail -10
    
    echo ""
    read -p "Enter backup file name to restore (e.g., jobautoflow_db_20240101_120000.sql.gz): " backup_file
    
    if [ -z "$backup_file" ]; then
        log_error "No backup file specified."
        exit 1
    fi
    
    BACKUP_PATH="s3://$S3_BUCKET/database/$backup_file"
    
    log_warn "⚠️  This will OVERWRITE your current database!"
    log_warn "Backup: $BACKUP_PATH"
    echo ""
    
    read -p "Type 'RESTORE' to continue: " confirm
    
    if [ "$confirm" != "RESTORE" ]; then
        log_info "Database rollback cancelled."
        exit 0
    fi
    
    log_step "Downloading backup..."
    LOCAL_FILE="/tmp/restore_$(date +%s).sql.gz"
    aws s3 cp "$BACKUP_PATH" "$LOCAL_FILE"
    
    log_step "Restoring database..."
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL environment variable not set."
        rm -f "$LOCAL_FILE"
        exit 1
    fi
    
    gunzip -c "$LOCAL_FILE" | psql "$DATABASE_URL"
    rm -f "$LOCAL_FILE"
    
    log_info "Database restore completed!"
}

# Emergency rollback (full system)
emergency_rollback() {
    log_warn "🚨 EMERGENCY ROLLBACK MODE"
    log_warn "This will rollback both application and database!"
    echo ""
    
    read -p "Type 'EMERGENCY' to continue: " confirm
    
    if [ "$confirm" != "EMERGENCY" ]; then
        log_info "Emergency rollback cancelled."
        exit 0
    fi
    
    # 1. Stop current deployments
    log_step "1. Scaling down current service..."
    aws ecs update-service \
        --cluster "$ECS_CLUSTER" \
        --service "$ECS_SERVICE" \
        --desired-count 0
    
    # 2. Rollback to previous version
    log_step "2. Rolling back to previous version..."
    rollback_previous
    
    # 3. Scale back up
    log_step "3. Scaling service back up..."
    aws ecs update-service \
        --cluster "$ECS_CLUSTER" \
        --service "$ECS_SERVICE" \
        --desired-count 2
    
    log_info "Emergency rollback completed!"
}

# Show help
show_help() {
    echo "JobAutoFlow Rollback Script"
    echo "==========================="
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  list, ls              List available versions"
    echo "  current               Show current deployment"
    echo "  previous              Rollback to previous version"
    echo "  version <n>           Rollback to specific version"
    echo "  database              Rollback database from backup"
    echo "  emergency             Emergency full rollback"
    echo "  help                  Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 list                    # List versions"
    echo "  $0 previous                # Rollback to previous"
    echo "  $0 version 5               # Rollback to version 5"
    echo "  $0 database                # Restore database"
    echo ""
    echo "Environment Variables:"
    echo "  AWS_REGION              AWS region (default: us-east-1)"
    echo "  ECS_CLUSTER             ECS cluster name"
    echo "  ECS_SERVICE             ECS service name"
    echo "  ECR_REPOSITORY          ECR repository name"
    echo "  DATABASE_URL            Database connection string"
    echo "  S3_BACKUP_BUCKET        S3 backup bucket name"
}

# Main
main() {
    COMMAND="${1:-help}"
    
    check_aws
    
    case "$COMMAND" in
        list|ls)
            list_versions
            ;;
        current|status)
            get_current_deployment
            ;;
        previous|prev)
            rollback_previous
            ;;
        version|v)
            rollback_to_version "$2"
            ;;
        database|db)
            database_rollback
            ;;
        emergency|panic)
            emergency_rollback
            ;;
        help|h|--help|-h)
            show_help
            ;;
        *)
            log_error "Unknown command: $COMMAND"
            show_help
            exit 1
            ;;
    esac
}

main "$@"
