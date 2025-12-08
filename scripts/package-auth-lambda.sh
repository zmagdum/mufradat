#!/bin/bash

# Helper: Build a minimal zip for the auth Lambdas (register/login/verify-email/refresh)
# This does NOT change infrastructure; you can use the zip with:
#   aws --endpoint-url=http://localhost:4566 lambda update-function-code ...

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
ARTIFACTS_DIR="$BACKEND_DIR/lambda-artifacts"

cd "$BACKEND_DIR"

echo "📦 Packaging auth Lambdas into a zip artifact..."
echo "Backend dir     : $BACKEND_DIR"
echo "Artifacts dir   : $ARTIFACTS_DIR"
echo ""

mkdir -p "$ARTIFACTS_DIR"

echo "🔨 Building backend and preparing Lambda bundle..."
npm run build:lambda
echo "✅ Build and bundle complete"
echo ""

# Use the prepared bundle directory
BUNDLE_DIR="$BACKEND_DIR/dist/lambda-bundle"

if [ ! -d "$BUNDLE_DIR" ]; then
  echo "❌ Bundle directory not found: $BUNDLE_DIR"
  echo "   Run: npm run build:lambda"
  exit 1
fi

TMP_DIR="$(mktemp -d)"

echo "📁 Copying bundle structure to $TMP_DIR ..."
# Copy entire bundle structure: auth/, shared/, node_modules/
cp -R "$BUNDLE_DIR"/* "$TMP_DIR"/

ZIP_PATH="$ARTIFACTS_DIR/auth-lambda.zip"

echo "🧵 Creating zip at $ZIP_PATH ..."
cd "$TMP_DIR"
zip -r "$ZIP_PATH" . >/dev/null
cd "$BACKEND_DIR"

echo "✅ Auth Lambda zip created:"
echo "   $ZIP_PATH"
echo ""
echo "You can deploy this zip manually to LocalStack, for example:"
echo ""
echo "  AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION=us-east-1 \\"
echo "    aws --endpoint-url=http://localhost:4566 lambda update-function-code \\"
echo "      --function-name <your-auth-lambda-name> \\"
echo "      --zip-file fileb://lambda-artifacts/auth-lambda.zip"
echo ""



