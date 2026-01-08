#!/bin/bash
# MRS1000 LIDAR Visualization - Red Lion Flex Edge Deployment Script
#
# This script deploys the LIDAR visualization application to a Red Lion Flex Edge device.
#
# Prerequisites:
# - Docker installed on Flex Edge
# - SSH access to Flex Edge
# - Network connectivity to the MRS1000 sensor

set -e

# Configuration
FLEX_EDGE_HOST="${FLEX_EDGE_HOST:-192.168.1.1}"
FLEX_EDGE_USER="${FLEX_EDGE_USER:-admin}"
FLEX_EDGE_APP_DIR="${FLEX_EDGE_APP_DIR:-/opt/lidar-viz}"
IMAGE_NAME="mrs1000-lidar-viz"
IMAGE_TAG="latest"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}MRS1000 LIDAR Visualization Deployment${NC}"
echo -e "${GREEN}Target: Red Lion Flex Edge${NC}"
echo -e "${GREEN}================================================${NC}"

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --host HOST       Flex Edge IP address (default: 192.168.1.1)"
    echo "  -u, --user USER       SSH username (default: admin)"
    echo "  -d, --dir DIR         Application directory on Flex Edge"
    echo "  -s, --simulation      Deploy in simulation mode"
    echo "  --build-only          Only build the Docker image locally"
    echo "  --help                Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  FLEX_EDGE_HOST        Flex Edge IP address"
    echo "  FLEX_EDGE_USER        SSH username"
    echo "  FLEX_EDGE_APP_DIR     Application directory on Flex Edge"
}

# Parse arguments
SIMULATION_MODE=false
BUILD_ONLY=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            FLEX_EDGE_HOST="$2"
            shift 2
            ;;
        -u|--user)
            FLEX_EDGE_USER="$2"
            shift 2
            ;;
        -d|--dir)
            FLEX_EDGE_APP_DIR="$2"
            shift 2
            ;;
        -s|--simulation)
            SIMULATION_MODE=true
            shift
            ;;
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo -e "${YELLOW}Project directory: ${PROJECT_DIR}${NC}"
echo -e "${YELLOW}Target host: ${FLEX_EDGE_HOST}${NC}"
echo -e "${YELLOW}Target directory: ${FLEX_EDGE_APP_DIR}${NC}"

# Step 1: Build Docker image
echo ""
echo -e "${GREEN}Step 1: Building Docker image...${NC}"

cd "$PROJECT_DIR"

docker build \
    -f docker/Dockerfile \
    -t "${IMAGE_NAME}:${IMAGE_TAG}" \
    .

echo -e "${GREEN}Docker image built successfully: ${IMAGE_NAME}:${IMAGE_TAG}${NC}"

if [ "$BUILD_ONLY" = true ]; then
    echo -e "${GREEN}Build complete. Skipping deployment.${NC}"
    exit 0
fi

# Step 2: Save Docker image
echo ""
echo -e "${GREEN}Step 2: Saving Docker image...${NC}"

IMAGE_FILE="/tmp/${IMAGE_NAME}-${IMAGE_TAG}.tar"
docker save -o "$IMAGE_FILE" "${IMAGE_NAME}:${IMAGE_TAG}"
echo -e "${GREEN}Image saved to: ${IMAGE_FILE}${NC}"

# Step 3: Transfer to Flex Edge
echo ""
echo -e "${GREEN}Step 3: Transferring to Flex Edge...${NC}"

# Create application directory on Flex Edge
ssh "${FLEX_EDGE_USER}@${FLEX_EDGE_HOST}" "mkdir -p ${FLEX_EDGE_APP_DIR}"

# Transfer Docker image
scp "$IMAGE_FILE" "${FLEX_EDGE_USER}@${FLEX_EDGE_HOST}:${FLEX_EDGE_APP_DIR}/"

# Transfer configuration files
scp "${PROJECT_DIR}/config/config.yaml" "${FLEX_EDGE_USER}@${FLEX_EDGE_HOST}:${FLEX_EDGE_APP_DIR}/"
scp "${PROJECT_DIR}/docker/docker-compose.yml" "${FLEX_EDGE_USER}@${FLEX_EDGE_HOST}:${FLEX_EDGE_APP_DIR}/"

echo -e "${GREEN}Files transferred successfully${NC}"

# Step 4: Load and start container on Flex Edge
echo ""
echo -e "${GREEN}Step 4: Starting application on Flex Edge...${NC}"

ssh "${FLEX_EDGE_USER}@${FLEX_EDGE_HOST}" << EOF
    cd ${FLEX_EDGE_APP_DIR}

    # Stop existing container if running
    docker stop ${IMAGE_NAME} 2>/dev/null || true
    docker rm ${IMAGE_NAME} 2>/dev/null || true

    # Load new image
    docker load -i ${IMAGE_NAME}-${IMAGE_TAG}.tar

    # Start container
    if [ "${SIMULATION_MODE}" = "true" ]; then
        echo "Starting in SIMULATION mode..."
        docker run -d \
            --name ${IMAGE_NAME} \
            --restart unless-stopped \
            -p 8080:8080 \
            -p 2112:2112/udp \
            ${IMAGE_NAME}:${IMAGE_TAG} \
            python backend/app.py --host 0.0.0.0 --port 8080 --simulate
    else
        echo "Starting in LIVE mode..."
        docker run -d \
            --name ${IMAGE_NAME} \
            --restart unless-stopped \
            -p 8080:8080 \
            -p 2112:2112/udp \
            ${IMAGE_NAME}:${IMAGE_TAG}
    fi

    # Check if container started
    sleep 2
    docker ps | grep ${IMAGE_NAME}

    # Cleanup
    rm ${IMAGE_NAME}-${IMAGE_TAG}.tar
EOF

# Cleanup local temp file
rm -f "$IMAGE_FILE"

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "Access the visualization at: ${YELLOW}http://${FLEX_EDGE_HOST}:8080${NC}"
echo ""
echo -e "Useful commands:"
echo -e "  View logs:    ssh ${FLEX_EDGE_USER}@${FLEX_EDGE_HOST} 'docker logs -f ${IMAGE_NAME}'"
echo -e "  Stop:         ssh ${FLEX_EDGE_USER}@${FLEX_EDGE_HOST} 'docker stop ${IMAGE_NAME}'"
echo -e "  Restart:      ssh ${FLEX_EDGE_USER}@${FLEX_EDGE_HOST} 'docker restart ${IMAGE_NAME}'"
echo -e "  Status:       ssh ${FLEX_EDGE_USER}@${FLEX_EDGE_HOST} 'docker ps | grep ${IMAGE_NAME}'"
