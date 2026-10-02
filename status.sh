#!/usr/bin/env bash
# ==============================================================================
# Cloud ERP - Services Status & Health Inspection Script (deploy-project)
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"
ENV_FILE="${SCRIPT_DIR}/.env"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo -e "${RED}[ERROR] Docker Compose not found.${NC}"
    exit 1
fi

echo -e "${CYAN}=================================================================${NC}"
echo -e "${CYAN}                Cloud ERP - Service Status                      ${NC}"
echo -e "${CYAN}=================================================================${NC}"

$DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

echo ""
echo -e "${CYAN}Health Check Matrix:${NC}"

# 1. PostgreSQL DB Health
DB_STATUS=$(docker inspect --format='{{json .State.Health.Status}}' erp-db 2>/dev/null || echo "\"unknown\"")
if [ "$DB_STATUS" = "\"healthy\"" ]; then
    echo -e "  [${GREEN}HEALTHY${NC}] PostgreSQL Database (erp-db internal:5432)"
else
    echo -e "  [${YELLOW}${DB_STATUS//\"/}${NC}] PostgreSQL Database (erp-db)"
fi

# 2. Frontend Nginx Container & Subpath Check
if command -v curl &> /dev/null; then
    FE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "http://127.0.0.1:3001/healthz" || echo "000")
    if [ "$FE_STATUS" = "200" ]; then
        echo -e "  [${GREEN}ONLINE${NC}] Frontend Nginx (http://127.0.0.1:3001/healthz) - HTTP $FE_STATUS"
    else
        echo -e "  [${RED}OFFLINE${NC}] Frontend Nginx (http://127.0.0.1:3001/healthz) - HTTP $FE_STATUS"
    fi

    ERP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "http://127.0.0.1:3001/erp/" || echo "000")
    if [ "$ERP_STATUS" = "200" ]; then
        echo -e "  [${GREEN}ONLINE${NC}] CloudERP Subpath (http://127.0.0.1:3001/erp/) - HTTP $ERP_STATUS"
    else
        echo -e "  [${YELLOW}CHECK${NC}] CloudERP Subpath (http://127.0.0.1:3001/erp/) - HTTP $ERP_STATUS"
    fi
fi

# 3. Internal Container Healthchecks (Isolated Docker Network)
check_container_health() {
    local container="$1"
    local name="$2"
    local port="$3"

    local c_status
    c_status=$(docker inspect --format='{{json .State.Status}}' "$container" 2>/dev/null || echo "\"unknown\"")
    local h_status
    h_status=$(docker inspect --format='{{json .State.Health.Status}}' "$container" 2>/dev/null || echo "\"none\"")

    if [ "$c_status" = "\"running\"" ]; then
        if [ "$h_status" = "\"healthy\"" ] || [ "$h_status" = "\"none\"" ]; then
            echo -e "  [${GREEN}ONLINE${NC}] $name ($container internal:$port) - Running"
        else
            echo -e "  [${YELLOW}STARTING${NC}] $name ($container internal:$port) - Health: ${h_status//\"/}"
        fi
    else
        echo -e "  [${RED}STOPPED${NC}] $name ($container)"
    fi
}

check_container_health "erp-gateway-service" "Gateway Service" "8080"
check_container_health "erp-auth-service" "Auth / SSO Service" "8090"
check_container_health "erp-account-service" "Account Service" "8081"
check_container_health "erp-workflow-service" "Workflow Service" "8083"
check_container_health "erp-inventory-service" "Inventory Service" "8082"

echo -e "${CYAN}=================================================================${NC}"
