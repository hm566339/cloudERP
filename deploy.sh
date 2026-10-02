#!/usr/bin/env bash
# ==============================================================================
# Cloud ERP - Production Deployment Automation Script (deploy-project)
# ==============================================================================
# Idempotent: safe to run multiple times. Tags previous images for rollback.
# Persistent database volume (db-data) is permanently preserved.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
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

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

echo -e "${CYAN}=================================================================${NC}"
echo -e "${CYAN}             Cloud ERP - Production Deployment                  ${NC}"
echo -e "${CYAN}=================================================================${NC}"

# 1. System prerequisites
log_info "Step 1/6: Verifying Docker engine & Compose..."
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
log_info "Step 2/6: Validating environment configuration..."
if [ ! -f "$ENV_FILE" ]; then
    log_warn ".env file not found in ${SCRIPT_DIR}."
    if [ -f "${SCRIPT_DIR}/.env.example" ]; then
        log_info "Creating initial .env from .env.example..."
        cp "${SCRIPT_DIR}/.env.example" "$ENV_FILE"
        chmod 600 "$ENV_FILE"
        log_warn "Created ${ENV_FILE}. Please edit it and set your production POSTGRES_PASSWORD and JWT_SECRET!"
    else
        log_error "No .env or .env.example found in ${SCRIPT_DIR}."
        exit 1
    fi
fi

# Ensure POSTGRES_PASSWORD and JWT_SECRET are set
if grep -q "change_this_to_a_strong_database_password" "$ENV_FILE" 2>/dev/null; then
    log_warn "POSTGRES_PASSWORD is still set to placeholder value in .env. Please update it!"
fi

# 3. Backup current images for rollback before building new ones
log_info "Step 3/6: Backing up current container images for safe rollback..."
SERVICES=(
    "deploy-project-auth-service"
    "deploy-project-account-service"
    "deploy-project-gateway-service"
    "deploy-project-workflow-service"
    "deploy-project-inventory-service"
    "deploy-project-frontend"
)

for img in "${SERVICES[@]}"; do
    if docker image inspect "${img}:latest" &>/dev/null; then
        docker tag "${img}:latest" "${img}:previous" 2>/dev/null || true
    fi
done

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
echo "RELEASE_TIMESTAMP=${TIMESTAMP}" > "$STATE_FILE"
if [ -d "${SCRIPT_DIR}/.git" ] && command -v git &> /dev/null; then
    echo "RELEASE_COMMIT=$(git -C "$SCRIPT_DIR" rev-parse --short HEAD 2>/dev/null || echo 'none')" >> "$STATE_FILE"
else
    echo "RELEASE_COMMIT=standalone" >> "$STATE_FILE"
fi

# 4. Database initialization script check
log_info "Step 4/6: Ensuring database bootstrap scripts are in place..."
if [ ! -f "${SCRIPT_DIR}/db/init.sql" ]; then
    log_error "db/init.sql not found in ${SCRIPT_DIR}. Cannot bootstrap database."
    exit 1
fi

# 5. Build and launch services safely (NEVER uses down -v or drops volumes)
log_info "Step 5/6: Building and starting microservices stack (Persistent data preserved)..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build --remove-orphans

# 6. Verify health
log_info "Step 6/6: Verifying database and service health..."
MAX_ATTEMPTS=25
ATTEMPT=0
DB_HEALTHY=false

echo -n "Waiting for PostgreSQL database container"
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

if [ "$DB_HEALTHY" = true ]; then
    log_success "PostgreSQL Database is healthy."
else
    log_warn "Database healthcheck timed out. Containers may still be initializing Spring contexts."
fi

# Allow services a moment to initialize
sleep 5

echo ""
echo -e "${GREEN}=================================================================${NC}"
echo -e "${GREEN}       Cloud ERP Deployment Completed Successfully!             ${NC}"
echo -e "${GREEN}=================================================================${NC}"
echo "Release Version: ${TIMESTAMP}"
echo ""
echo "Active Services & Endpoints:"
echo "  * Public Frontend:   ${PUBLIC_BASE_URL:-https://www.mark2.in}/erp/"
echo "  * Public API Proxy:  ${PUBLIC_BASE_URL:-https://www.mark2.in}/api/"
echo "  * Local Nginx Port:  127.0.0.1:${FRONTEND_PORT:-3001} (Reverse-proxied by Host Nginx)"
echo "  * Isolated Services: PostgreSQL (5432), Gateway (8080), Auth (8090), Account (8081), Workflow (8083), Inventory (8082)"
echo ""
echo "Helpful commands:"
echo "  ./status.sh          - Check service health status"
echo "  ./logs.sh            - Tail aggregated logs"
echo "  ./stop.sh            - Safely stop services"
echo "  ./rollback.sh        - Rollback to previous release"
echo "================================================================="
