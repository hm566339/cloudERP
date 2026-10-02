#!/usr/bin/env bash
# ==============================================================================
# Cloud ERP - Production Update Script (deploy-project)
# ==============================================================================
# Reliably updates application services:
# 1. If Git repository is present, pulls latest commits.
# 2. Rebuilds modified Docker images with zero database downtime.
# 3. Verifies container health.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"
ENV_FILE="${SCRIPT_DIR}/.env"

# Colors
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
echo -e "${CYAN}              Cloud ERP - Production Update                     ${NC}"
echo -e "${CYAN}=================================================================${NC}"

# Check if deploy-project is a Git working copy
if [ -d "${SCRIPT_DIR}/.git" ] && command -v git &> /dev/null; then
    log_info "Git tracking detected. Pulling latest commits..."
    CURRENT_BRANCH=$(git -C "$SCRIPT_DIR" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")
    git -C "$SCRIPT_DIR" fetch origin "$CURRENT_BRANCH"
    git -C "$SCRIPT_DIR" merge --ff-only "origin/$CURRENT_BRANCH" || {
        log_warn "Fast-forward merge not possible. Pulling standard merge..."
        git -C "$SCRIPT_DIR" pull origin "$CURRENT_BRANCH"
    }
    log_success "Source code successfully updated from Git."
else
    log_info "Running in standalone package mode (no local .git folder)."
    log_info "To update code in standalone mode, copy updated source files into this directory."
fi

# Run the idempotent deployment script which safely rebuilds and restarts services
log_info "Applying update via deploy.sh..."
chmod +x "${SCRIPT_DIR}/deploy.sh"
"${SCRIPT_DIR}/deploy.sh"

log_success "Update routine finished."
