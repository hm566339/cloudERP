#!/usr/bin/env bash
# ==============================================================================
# Cloud ERP - Production Deployment Automation Script (deploy-project)
# ==============================================================================
# Idempotent: pulls prebuilt images from Docker Hub (mohit950/clouderp).
# Never drops database volumes or runs destructive commands.
# Returns non-zero exit code if deployment fails.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}"

ENV_FILE="${SCRIPT_DIR}/.env"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"
STATE_FILE="${SCRIPT_DIR}/.last_release"

# Terminal Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC} $1" >&2; }

echo -e "${CYAN}=================================================================${NC}"
echo -e "${CYAN}             Cloud ERP - Production Deployment                  ${NC}"
echo -e "${CYAN}=================================================================${NC}"

# Target image tag (defaults to $1, then $TAG, then 'latest')
TARGET_TAG="${1:-${TAG:-latest}}"
export TAG="${TARGET_TAG}"
log_info "Target deployment tag: ${TAG}"

# 1. System prerequisites
log_info "Step 1/7: Verifying Docker engine & Compose..."
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed or not in PATH. Please install Docker."
    exit 1
fi

if ! docker info &> /dev/null; then
    log_error "Docker daemon is not running. Please start Docker service."
    exit 1
fi

if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    log_error "Docker Compose is required."
    exit 1
fi
log_success "Docker environment verified: $($DOCKER_COMPOSE version | head -n 1)"

# 2. Environment file check
log_info "Step 2/7: Validating environment configuration..."
if [ ! -f "$ENV_FILE" ]; then
    log_warn ".env file not found in ${SCRIPT_DIR}."
    if [ -f "${SCRIPT_DIR}/.env.example" ]; then
        log_info "Creating initial .env from .env.example..."
        cp "${SCRIPT_DIR}/.env.example" "$ENV_FILE"
        chmod 600 "$ENV_FILE"
        log_warn "Created ${ENV_FILE}. Please edit it with your production secrets!"
    else
        log_error "No .env or .env.example found in ${SCRIPT_DIR}."
        exit 1
    fi
fi

# Ensure critical secrets are not at default placeholder values
if grep -q "change_this_to_a_strong_database_password" "$ENV_FILE" 2>/dev/null; then
    log_warn "POSTGRES_PASSWORD is still set to placeholder in .env. Please update it!"
fi

# Load environment variables safely for script use (without shell evaluation/expansion of '$')
while IFS= read -r line || [ -n "$line" ]; do
    # Trim leading whitespace
    line="${line#"${line%%[![:space:]]*}"}"
    case "$line" in
        \#*|"") continue ;;
    esac
    if [[ "$line" == *"="* ]]; then
        key="${line%%=*}"
        val="${line#*=}"
        # Trim trailing whitespace from key
        key="${key%"${key##*[![:space:]]}"}"
        # Strip matching surrounding single or double quotes
        if [[ "$val" =~ ^\"(.*)\"$ ]]; then
            val="${BASH_REMATCH[1]}"
        elif [[ "$val" =~ ^\'(.*)\'$ ]]; then
            val="${BASH_REMATCH[1]}"
        fi
        if [[ "$key" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ ]]; then
            export "$key"="$val"
        fi
    fi
done < "$ENV_FILE"

# Re-ensure TAG is preserved even if .env had a different one
export TAG="${TARGET_TAG}"

# 3. Docker Hub authentication (if credentials provided)
log_info "Step 3/7: Authenticating with Docker Hub (if configured)..."
DOCKER_USER="${DOCKERHUB_USERNAME:-}"
DOCKER_TOKEN="${DOCKERHUB_TOKEN:-}"

if [ -n "$DOCKER_USER" ] && [ -n "$DOCKER_TOKEN" ]; then
    log_info "Logging in to Docker Hub as ${DOCKER_USER}..."
    if echo "$DOCKER_TOKEN" | docker login -u "$DOCKER_USER" --password-stdin &> /dev/null; then
        log_success "Docker Hub authenticated successfully."
    else
        log_warn "Docker Hub login failed. Proceeding with anonymous pull..."
    fi
else
    log_info "No Docker Hub credentials provided in environment; proceeding with public access / existing session."
fi

# 4. Save state for rollback
log_info "Step 4/7: Recording release state for rollback tracking..."
CURRENT_PREV="latest"
if [ -f "$STATE_FILE" ]; then
    # shellcheck disable=SC1090
    source "$STATE_FILE" 2>/dev/null || true
    CURRENT_PREV="${DEPLOYED_TAG:-latest}"
fi

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
cat <<EOF > "$STATE_FILE"
PREVIOUS_TAG=${CURRENT_PREV}
DEPLOYED_TAG=${TAG}
RELEASE_TIMESTAMP=${TIMESTAMP}
EOF

# 5. Pull new CloudERP images from Docker Hub
log_info "Step 5/7: Pulling prebuilt images from Docker Hub (mohit950/clouderp)..."
if ! $DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull; then
    log_error "Failed to pull Docker images for tag: ${TAG}."
    exit 1
fi
log_success "Images successfully pulled."

# 6. Database bootstrap check
if [ ! -f "${SCRIPT_DIR}/db/init.sql" ]; then
    log_error "db/init.sql not found in ${SCRIPT_DIR}. Cannot bootstrap database."
    exit 1
fi

# 7. Start/recreate services non-destructively (NEVER uses down -v or drops volumes)
log_info "Step 6/7: Deploying updated containers (Preserving persistent database volume)..."
if ! $DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans; then
    log_error "Docker Compose up failed!"
    exit 1
fi

# 8. Verification and health checks
log_info "Step 7/7: Verifying container health..."
REQUIRED_CONTAINERS=(
    "erp-db"
    "erp-auth-service"
    "erp-account-service"
    "erp-gateway-service"
    "erp-workflow-service"
    "erp-inventory-service"
    "erp-frontend"
)

# Wait for PostgreSQL container to become healthy
echo -n "Waiting for PostgreSQL database container to report healthy"
MAX_ATTEMPTS=30
ATTEMPT=0
DB_HEALTHY=false
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    STATUS=$(docker inspect --format='{{json .State.Health.Status}}' erp-db 2>/dev/null || echo "\"starting\"")
    if [ "$STATUS" = "\"healthy\"" ]; then
        DB_HEALTHY=true
        break
    fi
    echo -n "."
    sleep 2
    ATTEMPT=$((ATTEMPT + 1))
done
echo ""

if [ "$DB_HEALTHY" != true ]; then
    log_warn "Database health check timed out. Microservices may take extra time initializing."
fi

# Give services a brief stabilization period
sleep 5

# Check that all 7 required containers are in 'running' state
FAILED_CONTAINERS=()
for c in "${REQUIRED_CONTAINERS[@]}"; do
    C_STATUS=$(docker inspect --format='{{json .State.Status}}' "$c" 2>/dev/null || echo "\"missing\"")
    if [ "$C_STATUS" != "\"running\"" ]; then
        FAILED_CONTAINERS+=("$c ($C_STATUS)")
    fi
done

if [ ${#FAILED_CONTAINERS[@]} -gt 0 ]; then
    log_error "Deployment failed! The following container(s) are not running:"
    for fc in "${FAILED_CONTAINERS[@]}"; do
        echo -e "  - ${RED}${fc}${NC}"
        docker logs --tail 20 "${fc%% *}" 2>/dev/null || true
    done
    exit 1
fi

# Print formatted status matrix
if [ -f "${SCRIPT_DIR}/status.sh" ]; then
    chmod +x "${SCRIPT_DIR}/status.sh"
    "${SCRIPT_DIR}/status.sh" || true
fi

echo ""
echo -e "${GREEN}=================================================================${NC}"
echo -e "${GREEN}       Cloud ERP Deployment Completed Successfully!             ${NC}"
echo -e "${GREEN}=================================================================${NC}"
echo "Deployed Image Tag: ${TAG}"
echo "Release Version:    ${TIMESTAMP}"
echo ""
echo "Active Endpoints:"
echo "  * Frontend UI:    ${PUBLIC_BASE_URL:-https://www.mark2.in}/erp/"
echo "  * Backend API:    ${PUBLIC_BASE_URL:-https://www.mark2.in}/api/"
echo "  * Main Website:   https://www.mark2.in/ (Untouched)"
echo "  * Local Proxy:    127.0.0.1:${FRONTEND_PORT:-3001}"
echo "================================================================="
exit 0
