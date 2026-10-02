#!/usr/bin/env bash
# ==============================================================================
# Cloud ERP - Restart Services Script (deploy-project)
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"
ENV_FILE="${SCRIPT_DIR}/.env"

if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "[ERROR] Docker Compose not found."
    exit 1
fi

echo "[INFO] Restarting Cloud ERP services..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" restart

echo "[SUCCESS] Services restarted."
"${SCRIPT_DIR}/status.sh"
