#!/bin/bash

# Step 2: Fast Lambda code update for LocalStack
# - Rebuilds backend code
# - Uses CDK hotswap to update Lambda code without full CloudFormation deploy
# - Ideal for rapid debug iterations once infra is already deployed

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

cd "$BACKEND_DIR"

ENDPOINT_URL="${AWS_ENDPOINT_URL:-http://localhost:4566}"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"

echo "🚀 Step 2: Fast Lambda code update (hotswap) on LocalStack"
echo "Project root : $PROJECT_ROOT"
echo "Backend dir  : $BACKEND_DIR"
echo "Endpoint URL : $ENDPOINT_URL"
echo "Region       : $REGION"
echo ""

echo "🔍 Verifying LocalStack is running..."
if ! curl -s "$ENDPOINT_URL/_localstack/health" > /dev/null 2>&1; then
  echo "❌ LocalStack is not running at $ENDPOINT_URL"
  echo "   Start it first, e.g.:"
  echo "   cd backend && podman-compose up -d"
  exit 1
fi
echo "✅ LocalStack is running"
echo ""

export STAGE=local
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"
export AWS_DEFAULT_REGION="$REGION"
export AWS_ENDPOINT_URL="$ENDPOINT_URL"

echo "🔨 Rebuilding TypeScript and preparing Lambda bundle (backend)..."
npm run build:lambda
echo "✅ Build and bundle preparation complete"
echo ""

STACK_NAME="MufradatStack-local"

echo "📤 Hotswapping Lambda code in stack '$STACK_NAME' via cdklocal..."
CDK_HOTSWAP=1 npx cdklocal deploy "$STACK_NAME" --require-approval never --hotswap
echo ""
echo "✅ Step 2 complete: Lambda code updated without re-creating infra."
echo ""


