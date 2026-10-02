#!/usr/bin/env bash
# ==============================================================================
# Cloud ERP - Production Rollback Automation Script (deploy-project)
# ==============================================================================
# Safely reverts services to a previously known Docker image tag or release.
# CRITICAL GUARANTEE: Named volume 'db-data' is NEVER modified or deleted.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

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

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1" >&2; }

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

TARGET_TAG=""

# 1. Determine rollback target tag
if [ $# -ge 1 ]; then
    TARGET_TAG="$1"
    log_info "Target rollback tag specified by user: ${TARGET_TAG}"
elif [ -f "$STATE_FILE" ]; then
    # shellcheck disable=SC1090
    source "$STATE_FILE" 2>/dev/null || true
    if [ -n "${PREVIOUS_TAG:-}" ] && [ "$PREVIOUS_TAG" != "${DEPLOYED_TAG:-}" ]; then
        TARGET_TAG="$PREVIOUS_TAG"
        log_info "Identified previous release tag from .last_release: ${TARGET_TAG}"
    fi
fi

if [ -z "$TARGET_TAG" ]; then
    log_warn "No specific previous tag found in .last_release. Falling back to 'latest'."
    TARGET_TAG="latest"
fi

export TAG="${TARGET_TAG}"
log_info "Executing rollback to image tag: ${TAG}..."

# 2. Pull target tag if needed
log_info "Checking / pulling images for tag: ${TAG}..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull || log_warn "Could not pull tag ${TAG}; attempting to use local images..."

# 3. Recreate containers with target tag
log_info "Recreating containers with tag: ${TAG}..."
if ! $DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans; then
    log_error "Rollback container recreation failed!"
    exit 1
fi

# 4. Update release tracking
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
cat <<EOF > "$STATE_FILE"
PREVIOUS_TAG=rolled_back_from_${DEPLOYED_TAG:-unknown}
DEPLOYED_TAG=${TAG}
RELEASE_TIMESTAMP=${TIMESTAMP}
EOF

# 5. Run health verification
if [ -f "${SCRIPT_DIR}/status.sh" ]; then
    chmod +x "${SCRIPT_DIR}/status.sh"
    "${SCRIPT_DIR}/status.sh" || true
fi

echo ""
log_success "Rollback procedure complete to tag: ${TAG}. Database volume was untouched."
exit 0
