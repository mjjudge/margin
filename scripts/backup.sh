#!/bin/bash
# Backup script for margin-app
# Creates timestamped backups in two locations:
# 1. ~/backups/margin-app/
# 2. /mnt/ssd/backups/margin-app/ (sda drive)

set -e

# Configuration
APP_NAME="margin-app"
SOURCE_DIR="/home/marcus-judge/myapps/margin-app"
LOCAL_BACKUP_DIR="/home/marcus-judge/backups/${APP_NAME}"
SSD_BACKUP_DIR="/mnt/ssd/backups/${APP_NAME}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="${APP_NAME}_${TIMESTAMP}"

# Exclude patterns (node_modules, build artifacts, etc.)
EXCLUDE_PATTERNS=(
    "node_modules"
    ".expo"
    "ios/build"
    "android/build"
    "android/.gradle"
    ".git"
    "*.log"
    ".env"
    ".env.local"
)

# Build exclude arguments for tar
EXCLUDE_ARGS=""
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    EXCLUDE_ARGS="$EXCLUDE_ARGS --exclude=$pattern"
done

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Margin App Backup ===${NC}"
echo "Timestamp: $TIMESTAMP"
echo ""

# Create backup directories if they don't exist
echo -e "${YELLOW}Creating backup directories...${NC}"
mkdir -p "$LOCAL_BACKUP_DIR"
mkdir -p "$SSD_BACKUP_DIR"

# Create the backup archive
echo -e "${YELLOW}Creating backup archive...${NC}"
cd "$(dirname "$SOURCE_DIR")"

# Create tar archive
tar $EXCLUDE_ARGS -czf "/tmp/${BACKUP_NAME}.tar.gz" "$APP_NAME"

# Get archive size
ARCHIVE_SIZE=$(du -h "/tmp/${BACKUP_NAME}.tar.gz" | cut -f1)
echo "Archive size: $ARCHIVE_SIZE"

# Copy to local backup location
echo -e "${YELLOW}Copying to local backup folder...${NC}"
cp "/tmp/${BACKUP_NAME}.tar.gz" "$LOCAL_BACKUP_DIR/"
echo "  ✓ Saved to: $LOCAL_BACKUP_DIR/${BACKUP_NAME}.tar.gz"

# Copy to SSD backup location
echo -e "${YELLOW}Copying to SSD backup folder...${NC}"
if [ -d "/mnt/ssd" ]; then
    cp "/tmp/${BACKUP_NAME}.tar.gz" "$SSD_BACKUP_DIR/"
    echo "  ✓ Saved to: $SSD_BACKUP_DIR/${BACKUP_NAME}.tar.gz"
else
    echo -e "${RED}  ✗ SSD not mounted at /mnt/ssd${NC}"
fi

# Clean up temp file
rm "/tmp/${BACKUP_NAME}.tar.gz"

# Keep only last 10 backups in each location (optional cleanup)
echo -e "${YELLOW}Cleaning old backups (keeping last 10)...${NC}"

cleanup_old_backups() {
    local dir=$1
    local count=$(ls -1 "$dir"/*.tar.gz 2>/dev/null | wc -l)
    if [ "$count" -gt 10 ]; then
        ls -1t "$dir"/*.tar.gz | tail -n +11 | xargs rm -f
        echo "  Cleaned up old backups in $dir"
    fi
}

cleanup_old_backups "$LOCAL_BACKUP_DIR"
cleanup_old_backups "$SSD_BACKUP_DIR"

echo ""
echo -e "${GREEN}=== Backup Complete ===${NC}"
echo "Local:  $LOCAL_BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo "SSD:    $SSD_BACKUP_DIR/${BACKUP_NAME}.tar.gz"
echo ""

# List recent backups
echo "Recent backups:"
ls -lht "$LOCAL_BACKUP_DIR"/*.tar.gz 2>/dev/null | head -5
