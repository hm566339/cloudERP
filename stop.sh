#!/usr/bin/env bash
# ==============================================================================
# Cloud ERP - Stop Services Script (deploy-project)
# ==============================================================================
# Safely stops all containers. Database volumes remain preserved.
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

echo "[INFO] Safely stopping Cloud ERP services (persistent data is preserved)..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" stop

echo "[SUCCESS] Services stopped."
