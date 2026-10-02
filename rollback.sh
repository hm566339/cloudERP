#!/usr/bin/env bash
# ==============================================================================
# Cloud ERP - Production Rollback Automation Script (deploy-project)
# ==============================================================================
# Safely reverts services to the previous working deployment:
# 1. Restores Docker images tagged as ':previous' by deploy.sh.
# 2. Or checks out a previous Git commit if running in a Git-tracked folder.
# 3. CRITICAL GUARANTEE: Named volume 'db-data' is NEVER modified or deleted.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"
ENV_FILE="${SCRIPT_DIR}/.env"
STATE_FILE="${SCRIPT_DIR}/.last_release"

# Terminal Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

echo -e "${CYAN}=================================================================${NC}"
echo -e "${CYAN}              Cloud ERP - Production Rollback                   ${NC}"
echo -e "${CYAN}=================================================================${NC}"
log_warn "SAFETY GUARANTEE: Persistent database data (db-data volume) is preserved."

if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    log_error "Docker Compose is required."
    exit 1
fi

ROLLBACK_EXECUTED=false

# Method 1: Git-based rollback if target commit is passed as $1
if [ $# -ge 1 ] && [ -d "${SCRIPT_DIR}/.git" ] && command -v git &> /dev/null; then
    TARGET_COMMIT="$1"
    log_info "Target Git commit provided: ${TARGET_COMMIT}"
    git -C "$SCRIPT_DIR" checkout "$TARGET_COMMIT"
    log_info "Rebuilding and deploying target commit..."
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build --remove-orphans
    ROLLBACK_EXECUTED=true
fi

# Method 2: Docker Image ':previous' tag rollback (Reliable for standalone packages)
if [ "$ROLLBACK_EXECUTED" = false ]; then
    log_info "Checking for previous Docker container image snapshots..."
    SERVICES=(
        "deploy-project-auth-service"
        "deploy-project-account-service"
        "deploy-project-gateway-service"
        "deploy-project-workflow-service"
        "deploy-project-inventory-service"
        "deploy-project-frontend"
    )

    FOUND_BACKUPS=0
    for img in "${SERVICES[@]}"; do
        if docker image inspect "${img}:previous" &>/dev/null; then
            FOUND_BACKUPS=$((FOUND_BACKUPS + 1))
            docker tag "${img}:previous" "${img}:latest" 2>/dev/null || true
        fi
    done

    if [ $FOUND_BACKUPS -gt 0 ]; then
        log_info "Found ${FOUND_BACKUPS} previous image snapshots. Restoring running containers..."
        $DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-build --remove-orphans
        ROLLBACK_EXECUTED=true
        log_success "Restored services from previous container image snapshots."
    fi
fi

# Method 3: Fallback Git HEAD~1
if [ "$ROLLBACK_EXECUTED" = false ] && [ -d "${SCRIPT_DIR}/.git" ] && command -v git &> /dev/null; then
    PREV_COMMIT=$(git -C "$SCRIPT_DIR" rev-parse HEAD~1 2>/dev/null || echo "")
    if [ -n "$PREV_COMMIT" ]; then
        log_info "Reverting Git HEAD to previous commit: ${PREV_COMMIT}..."
        git -C "$SCRIPT_DIR" checkout "$PREV_COMMIT"
        $DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build --remove-orphans
        ROLLBACK_EXECUTED=true
    fi
fi

if [ "$ROLLBACK_EXECUTED" = false ]; then
    log_warn "No previous Docker image snapshot or Git commit found to roll back to."
    log_info "Restarting existing containers with current configuration..."
    $DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" restart
fi

# Run health verification
chmod +x "${SCRIPT_DIR}/status.sh"
"${SCRIPT_DIR}/status.sh"

echo ""
log_success "Rollback procedure complete. Database volume was untouched."
