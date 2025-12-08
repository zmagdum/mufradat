#!/bin/bash

# Prepare Lambda bundle structure for auth functions
# Creates: dist/lambda-bundle/auth/*.js, shared/*.js, node_modules/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
BUNDLE_DIR="$BACKEND_DIR/dist/lambda-bundle"

cd "$BACKEND_DIR"

echo "📦 Preparing Lambda bundle structure..."
echo "Bundle dir: $BUNDLE_DIR"
echo ""

# Clean previous bundle
rm -rf "$BUNDLE_DIR"
mkdir -p "$BUNDLE_DIR"

# Ensure dist is built
if [ ! -d "dist/backend/src/lambdas/auth" ] && [ ! -d "dist/lambdas/auth" ]; then
  echo "🔨 Building TypeScript first..."
  npm run build
fi

# Determine source directory (check both possible locations)
SOURCE_DIR=""
if [ -d "dist/backend/src/lambdas/auth" ]; then
  SOURCE_DIR="dist/backend/src/lambdas"
elif [ -d "dist/lambdas/auth" ]; then
  SOURCE_DIR="dist/lambdas"
else
  echo "❌ ERROR: Could not find compiled Lambda code in dist/"
  exit 1
fi

echo "Source directory -- $SOURCE_DIR"
# Ensure runtime deps are installed in auth directory
if [ ! -d "$SOURCE_DIR/auth/node_modules/jsonwebtoken" ]; then
  echo "📦 Installing runtime dependencies..."
  # Use uuid v8 for CommonJS compatibility (v9+ is ES module only)
  npm install jsonwebtoken@^9.0.2 @aws-sdk/lib-dynamodb@^3.478.0 @aws-sdk/client-dynamodb@^3.478.0 bcryptjs@^3.0.3 uuid@8.3.2 --omit=dev --prefix "$SOURCE_DIR/auth"
fi

# Copy auth handlers
echo "📁 Copying auth handlers..."
mkdir -p "$BUNDLE_DIR/auth"
cp "$SOURCE_DIR/auth"/*.js "$BUNDLE_DIR/auth/" 2>/dev/null || true

# Copy shared utilities
echo "📁 Copying shared utilities..."
SHARED_SRC="dist/shared"
echo "Shared src $SHARED_SRC $BUNDLE_DIR/shared/"
if [ -d "$SHARED_SRC" ]; then
  # from root shared
  cp -R "$SHARED_SRC/" "$BUNDLE_DIR/shared/"
  # from lambdas/src/shared
  cp "$SOURCE_DIR/../shared"/*.js "$BUNDLE_DIR/shared/" 2>/dev/null || true
  # from lambdas/shared
  cp "$SOURCE_DIR/shared"/*.js "$BUNDLE_DIR/shared/" 2>/dev/null || true
else
  echo "⚠️  WARNING: shared folder not found at: $SHARED_SRC"
fi

# Copy node_modules (runtime dependencies)
echo "📁 Copying node_modules..."
NODE_MODULES_SRC="$SOURCE_DIR/auth/node_modules"
if [ ! -d "$NODE_MODULES_SRC" ]; then
  echo "❌ ERROR: node_modules not found at $NODE_MODULES_SRC"
  echo "   Did npm install run successfully?"
  exit 1
fi
cp -r "$NODE_MODULES_SRC" "$BUNDLE_DIR/"

echo "✅ Lambda bundle prepared at: $BUNDLE_DIR"
echo "   Structure:"
echo "     auth/*.js"
echo "     shared/*.js"
echo "     node_modules/"
echo ""

