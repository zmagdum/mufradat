#!/bin/bash

# Start Local Testing Environment
# This script starts LocalStack, deploys backend, and optionally starts frontend

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
MOBILE_DIR="$PROJECT_ROOT/mobile"

echo "🚀 Starting Local Testing Environment"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists podman && ! command_exists docker; then
    echo -e "${RED}❌ Podman or Docker is required but not installed${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is required but not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is required but not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites met${NC}"
echo ""

# Step 1: Start LocalStack
echo "📦 Step 1: Starting LocalStack..."
cd "$BACKEND_DIR"

if curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  LocalStack is already running${NC}"
else
    echo "Starting LocalStack..."
    npm run localstack:start
    
    # Wait for LocalStack to be ready
    echo "Waiting for LocalStack to be ready..."
    for i in {1..30}; do
        if curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ LocalStack is running${NC}"
            break
        fi
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ LocalStack failed to start${NC}"
            exit 1
        fi
        sleep 1
    done
fi

echo ""

# Step 2: Deploy Backend
echo "🔨 Step 2: Deploying backend infrastructure..."
cd "$BACKEND_DIR"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Deploy
npm run deploy:local

echo ""

# Step 3: Get API Gateway ID
echo "🔍 Step 3: Getting API Gateway information..."
API_ID=$(awslocal apigateway get-rest-apis --query 'items[0].id' --output text 2>/dev/null || echo "")

if [ -z "$API_ID" ]; then
    echo -e "${YELLOW}⚠️  Could not get API Gateway ID. You may need to update mobile/src/services/api.ts manually${NC}"
else
    echo -e "${GREEN}✅ API Gateway ID: $API_ID${NC}"
    echo ""
    echo "Current API URL in mobile app:"
    CURRENT_URL=$(grep -o "http://localhost:4566/restapis/[^']*" "$MOBILE_DIR/src/services/api.ts" | head -1 || echo "Not found")
    echo "  $CURRENT_URL"
    echo ""
    EXPECTED_URL="http://localhost:4566/restapis/$API_ID/v1"
    if [ "$CURRENT_URL" != "$EXPECTED_URL" ]; then
        echo -e "${YELLOW}⚠️  API URL mismatch detected${NC}"
        echo "Expected: $EXPECTED_URL"
        echo ""
        read -p "Update mobile/src/services/api.ts? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            # Update API URL
            sed -i "s|http://localhost:4566/restapis/[^']*/v1|$EXPECTED_URL|g" "$MOBILE_DIR/src/services/api.ts"
            echo -e "${GREEN}✅ Updated API URL${NC}"
        fi
    else
        echo -e "${GREEN}✅ API URL is correct${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✅ Backend is ready!${NC}"
echo ""
echo "📱 To start the frontend, run:"
echo "   cd mobile"
echo "   npm run web"
echo ""
echo "Or start it automatically? (y/n)"
read -p "> " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🌐 Starting frontend..."
    cd "$MOBILE_DIR"
    npm run web
fi


