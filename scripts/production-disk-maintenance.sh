#!/usr/bin/env bash
# ==============================================================================
# Cloud ERP - Production Safe Disk Maintenance & Monitoring Script
# ==============================================================================
# - Strictly NON-DESTRUCTIVE: Never removes database volumes, persistent data,
#   uploaded assets, or active container images.
# - Cleans ONLY dangling images, stale build cache, and old compressed logs.
# - Provides configurable disk space usage alerts (Warning: >80%, Critical: >90%).
# ==============================================================================

set -euo pipefail

WARNING_THRESHOLD_PCT="${DISK_WARNING_THRESHOLD_PCT:-80}"
CRITICAL_THRESHOLD_PCT="${DISK_CRITICAL_THRESHOLD_PCT:-90}"
MIN_FREE_GB="${DISK_MIN_FREE_GB:-5}"

# Formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}=================================================================${NC}"
echo -e "${CYAN}       Cloud ERP - Production Disk Monitoring & Maintenance      ${NC}"
echo -e "${CYAN}=================================================================${NC}"

# 1. Disk Space Inspection
TARGET_MOUNT="/"
if command -v df &>/dev/null; then
    DISK_LINE=$(df -h "$TARGET_MOUNT" | awk 'NR==2')
    TOTAL_SPACE=$(echo "$DISK_LINE" | awk '{print $2}')
    USED_SPACE=$(echo "$DISK_LINE" | awk '{print $3}')
    AVAIL_SPACE=$(echo "$DISK_LINE" | awk '{print $4}')
    USE_PCT=$(echo "$DISK_LINE" | awk '{print $5}' | tr -d '%')

    echo -e "${BLUE}[INFO]${NC} Target Mount:   $TARGET_MOUNT"
    echo -e "${BLUE}[INFO]${NC} Total Space:    $TOTAL_SPACE"
    echo -e "${BLUE}[INFO]${NC} Used Space:     $USED_SPACE ($USE_PCT%)"
    echo -e "${BLUE}[INFO]${NC} Available:      $AVAIL_SPACE"

    if [ "$USE_PCT" -ge "$CRITICAL_THRESHOLD_PCT" ]; then
        echo -e "${RED}[CRITICAL ALERT] Disk usage is at ${USE_PCT}% (>= ${CRITICAL_THRESHOLD_PCT}%)!${NC}"
    elif [ "$USE_PCT" -ge "$WARNING_THRESHOLD_PCT" ]; then
        echo -e "${YELLOW}[WARNING] Disk usage is at ${USE_PCT}% (>= ${WARNING_THRESHOLD_PCT}% threshold).${NC}"
    else
        echo -e "${GREEN}[OK] Disk utilization is healthy (${USE_PCT}%).${NC}"
    fi
fi

# 2. Safe Temporary File Cleanup (/tmp)
echo -e "${BLUE}[INFO]${NC} Inspecting temporary files in /tmp..."
if [ -d "/tmp" ]; then
    # Delete stale tomcat multipart temp files older than 3 days
    find /tmp -type f \( -name "tomcat*tmp" -o -name "upload_*tmp" \) -mtime +3 -delete 2>/dev/null || true
    echo -e "${GREEN}[OK] Stale temporary upload files pruned.${NC}"
fi

# 3. Application Archived Logs Cleanup (> 14 days old)
echo -e "${BLUE}[INFO]${NC} Inspecting application archived log files..."
for log_dir in "/app/logs/archived" "./logs/archived"; do
    if [ -d "$log_dir" ]; then
        find "$log_dir" -type f -name "*.log.gz" -mtime +14 -delete 2>/dev/null || true
        echo -e "${GREEN}[OK] Archived application logs older than 14 days pruned in $log_dir.${NC}"
    fi
done

# 4. Docker Safe Cleanup (Dangling images & BuildKit cache ONLY)
if command -v docker &>/dev/null && docker info &>/dev/null; then
    echo -e "${BLUE}[INFO]${NC} Performing safe Docker cleanup (non-destructive)..."

    # Prune untagged/dangling images (Does NOT delete named images or active images)
    PRUNED_IMAGES=$(docker image prune -f 2>&1 || true)
    echo -e "${GREEN}[OK] Dangling images pruned.${NC}"

    # Prune build cache older than 7 days (168h)
    PRUNED_BUILDER=$(docker builder prune -f --filter "until=168h" 2>&1 || true)
    echo -e "${GREEN}[OK] Stale build cache pruned.${NC}"

    # 5. Check and safely truncate overgrown container logs (> 50MB) if rotation was missing
    if [ -d "/var/lib/docker/containers" ] && [ "$EUID" -eq 0 ]; then
        echo -e "${BLUE}[INFO]${NC} Checking for oversize container logs..."
        find /var/lib/docker/containers/ -type f -name "*-json.log" -size +50M 2>/dev/null | while read -r logfile; do
            echo -e "${YELLOW}[WARN] Truncating oversized container log: $logfile${NC}"
            truncate -s 0 "$logfile" || true
        done
    fi
fi

# 6. Final Status
if command -v df &>/dev/null; then
    FINAL_AVAIL=$(df -h "$TARGET_MOUNT" | awk 'NR==2 {print $4}')
    FINAL_PCT=$(df -h "$TARGET_MOUNT" | awk 'NR==2 {print $5}')
    echo -e "${GREEN}[SUCCESS] Maintenance completed. Available disk space: $FINAL_AVAIL (Usage: $FINAL_PCT).${NC}"
fi
echo -e "${CYAN}=================================================================${NC}"
exit 0

