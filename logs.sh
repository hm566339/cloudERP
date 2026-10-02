#!/usr/bin/env bash
# ==============================================================================
# Cloud ERP - Logs Streaming Script (deploy-project)
# ==============================================================================
# Usage:
#   ./logs.sh                 # Tail all services
#   ./logs.sh auth-service    # Tail auth service only
#   ./logs.sh --tail 100      # Show last 100 lines
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

echo "[INFO] Streaming logs (Press Ctrl+C to exit)..."
$DOCKER_COMPOSE -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs -f "$@"
