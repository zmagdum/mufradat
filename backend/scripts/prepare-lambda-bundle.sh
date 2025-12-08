#!/bin/bash

# Prepare Lambda bundle structure for all Lambda functions
# Creates: dist/lambda-bundle/{auth,vocabulary,conjugations,...}/*.js, shared/*.js, node_modules/
# Also handles shared folders from multiple locations:
# - lambdas/shared (../shared/ imports)
# - backend/src/shared (../../shared/ imports)  
# - root shared (../../../../shared/ imports)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
BUNDLE_DIR="$BACKEND_DIR/dist/lambda-bundle"
ROOT_DIR="$(dirname "$BACKEND_DIR")"

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

# Ensure runtime deps are installed
if [ ! -d "$SOURCE_DIR/auth/node_modules/jsonwebtoken" ]; then
  echo "📦 Installing runtime dependencies..."
  # Use uuid v8 for CommonJS compatibility (v9+ is ES module only)
  npm install jsonwebtoken@^9.0.2 @aws-sdk/lib-dynamodb@^3.478.0 @aws-sdk/client-dynamodb@^3.478.0 bcryptjs@^3.0.3 uuid@8.3.2 --omit=dev --prefix "$SOURCE_DIR/auth"
fi

# Copy all Lambda handlers (auth, vocabulary, conjugations, etc.)
# To make relative imports work, we need to create the proper directory structure:
# - For ../../shared/ imports from auth/: create bundle/src/lambdas/auth/
# - For ../../../../shared/ imports from vocabulary/: create bundle/backend/src/lambdas/vocabulary/
# - Put shared/ at bundle/shared/ so imports resolve correctly
echo "📁 Copying Lambda handlers..."

# Create nested structure for lambdas based on their import paths
# Check source TypeScript files to determine import patterns
SRC_LAMBDAS_DIR="$BACKEND_DIR/src/lambdas"
mkdir -p "$BUNDLE_DIR/src/lambdas"
mkdir -p "$BUNDLE_DIR/backend/src/lambdas"

for lambda_dir in "$SOURCE_DIR"/*/; do
  if [ -d "$lambda_dir" ]; then
    lambda_name=$(basename "$lambda_dir")
    if [ "$lambda_name" != "shared" ] && [ "$lambda_name" != "__tests__" ]; then
      # Check source TypeScript files to determine import patterns
      src_lambda_dir="$SRC_LAMBDAS_DIR/$lambda_name"
      
      if [ -d "$src_lambda_dir" ]; then
        # Check if this lambda imports ../../../../shared/ (needs deepest nested structure)
        if grep -r "from ['\"]\.\.\/\.\.\/\.\.\/\.\.\/shared" "$src_lambda_dir"/*.ts 2>/dev/null | grep -q .; then
          echo "  Copying $lambda_name handlers to backend/src/lambdas/$lambda_name/ (for ../../../../shared/ imports)..."
          mkdir -p "$BUNDLE_DIR/backend/src/lambdas/$lambda_name"
          cp "$lambda_dir"/*.js "$BUNDLE_DIR/backend/src/lambdas/$lambda_name/" 2>/dev/null || true
        # Check if this lambda imports ../../shared/ (needs nested structure)
        elif grep -r "from ['\"]\.\.\/\.\.\/shared" "$src_lambda_dir"/*.ts 2>/dev/null | grep -q .; then
          echo "  Copying $lambda_name handlers to src/lambdas/$lambda_name/ (for ../../shared/ imports)..."
          mkdir -p "$BUNDLE_DIR/src/lambdas/$lambda_name"
          cp "$lambda_dir"/*.js "$BUNDLE_DIR/src/lambdas/$lambda_name/" 2>/dev/null || true
        else
          # Default: copy to flat structure for ../shared/ imports
          echo "  Copying $lambda_name handlers to $lambda_name/ (for ../shared/ imports)..."
          mkdir -p "$BUNDLE_DIR/$lambda_name"
          cp "$lambda_dir"/*.js "$BUNDLE_DIR/$lambda_name/" 2>/dev/null || true
        fi
      else
        # Fallback: copy to flat structure if source directory not found
        echo "  Copying $lambda_name handlers to $lambda_name/ (fallback)..."
        mkdir -p "$BUNDLE_DIR/$lambda_name"
        cp "$lambda_dir"/*.js "$BUNDLE_DIR/$lambda_name/" 2>/dev/null || true
      fi
    fi
  fi
done

# Copy shared utilities from lambdas/shared (../shared/ imports)
# For lambdas at src/lambdas/{name}/, ../shared/ resolves to src/lambdas/shared/
# For lambdas at backend/src/lambdas/{name}/, ../shared/ resolves to backend/src/lambdas/shared/
# For lambdas at {name}/, ../shared/ resolves to shared/
echo "📁 Copying shared utilities from lambdas/shared..."
mkdir -p "$BUNDLE_DIR/shared"
mkdir -p "$BUNDLE_DIR/src/lambdas/shared"
mkdir -p "$BUNDLE_DIR/backend/src/lambdas/shared"
if [ -d "$SOURCE_DIR/shared" ]; then
  # Copy to all locations to support different import paths
  cp "$SOURCE_DIR/shared"/*.js "$BUNDLE_DIR/shared/" 2>/dev/null || true
  cp "$SOURCE_DIR/shared"/*.js "$BUNDLE_DIR/src/lambdas/shared/" 2>/dev/null || true
  cp "$SOURCE_DIR/shared"/*.js "$BUNDLE_DIR/backend/src/lambdas/shared/" 2>/dev/null || true
  # Also copy subdirectories if they exist
  for subdir in "$SOURCE_DIR/shared"/*/; do
    if [ -d "$subdir" ]; then
      subdir_name=$(basename "$subdir")
      mkdir -p "$BUNDLE_DIR/shared/$subdir_name"
      mkdir -p "$BUNDLE_DIR/src/lambdas/shared/$subdir_name"
      mkdir -p "$BUNDLE_DIR/backend/src/lambdas/shared/$subdir_name"
      cp -r "$subdir"* "$BUNDLE_DIR/shared/$subdir_name/" 2>/dev/null || true
      cp -r "$subdir"* "$BUNDLE_DIR/src/lambdas/shared/$subdir_name/" 2>/dev/null || true
      cp -r "$subdir"* "$BUNDLE_DIR/backend/src/lambdas/shared/$subdir_name/" 2>/dev/null || true
    fi
  done
fi

# Copy shared utilities from backend/src/shared (../../shared/ imports)
# For lambdas at src/lambdas/{name}/, ../../shared/ resolves to src/shared/
# For lambdas at backend/src/lambdas/{name}/, ../../shared/ resolves to backend/src/shared/
echo "📁 Copying shared utilities from backend/src/shared..."
BACKEND_SRC_SHARED=""
if [ -d "dist/backend/src/shared" ]; then
  BACKEND_SRC_SHARED="dist/backend/src/shared"
elif [ -d "dist/src/shared" ]; then
  BACKEND_SRC_SHARED="dist/src/shared"
elif [ -d "dist/shared" ]; then
  BACKEND_SRC_SHARED="dist/shared"
fi

if [ -n "$BACKEND_SRC_SHARED" ] && [ -d "$BACKEND_SRC_SHARED" ]; then
  # Copy to bundle/src/shared/ for ../../shared/ imports from src/lambdas/{name}/
  mkdir -p "$BUNDLE_DIR/src/shared"
  cp "$BACKEND_SRC_SHARED"/*.js "$BUNDLE_DIR/src/shared/" 2>/dev/null || true
  # Copy to bundle/backend/src/shared/ for ../../shared/ imports from backend/src/lambdas/{name}/
  mkdir -p "$BUNDLE_DIR/backend/src/shared"
  cp "$BACKEND_SRC_SHARED"/*.js "$BUNDLE_DIR/backend/src/shared/" 2>/dev/null || true
  # Also copy subdirectories
  for subdir in "$BACKEND_SRC_SHARED"/*/; do
    if [ -d "$subdir" ]; then
      subdir_name=$(basename "$subdir")
      mkdir -p "$BUNDLE_DIR/src/shared/$subdir_name"
      mkdir -p "$BUNDLE_DIR/backend/src/shared/$subdir_name"
      cp -r "$subdir"* "$BUNDLE_DIR/src/shared/$subdir_name/" 2>/dev/null || true
      cp -r "$subdir"* "$BUNDLE_DIR/backend/src/shared/$subdir_name/" 2>/dev/null || true
    fi
  done
fi

# Copy root-level shared folder (../../../../shared/ imports from vocabulary/, etc.)
# For imports like ../../../../shared/types from vocabulary/create-word.js:
# The relative path: vocabulary/ -> lambdas/ -> src/ -> backend/ -> shared/
# Since vocabulary is at bundle/backend/src/lambdas/vocabulary/, 
# ../../../../shared/ resolves to bundle/shared/ ✓
echo "📁 Copying root-level shared folder..."

# First, ensure root shared is compiled
if [ ! -d "$ROOT_DIR/shared/dist" ]; then
  echo "🔨 Building root shared folder..."
  cd "$ROOT_DIR/shared"
  if [ -f "package.json" ] && grep -q '"build"' package.json; then
    npm run build 2>/dev/null || echo "⚠️  Warning: Could not build root shared folder"
  fi
  cd "$BACKEND_DIR"
fi

# Copy root shared content to bundle/shared/ (for ../../../../shared/ imports)
if [ -d "$ROOT_DIR/shared/dist" ]; then
  # Copy types directory
  if [ -d "$ROOT_DIR/shared/dist/types" ]; then
    mkdir -p "$BUNDLE_DIR/shared/types"
    cp -r "$ROOT_DIR/shared/dist/types"/* "$BUNDLE_DIR/shared/types/" 2>/dev/null || true
  fi
  # Copy validators directory
  if [ -d "$ROOT_DIR/shared/dist/validators" ]; then
    mkdir -p "$BUNDLE_DIR/shared/validators"
    cp -r "$ROOT_DIR/shared/dist/validators"/* "$BUNDLE_DIR/shared/validators/" 2>/dev/null || true
  fi
  # Copy constants directory if it exists
  if [ -d "$ROOT_DIR/shared/dist/constants" ]; then
    mkdir -p "$BUNDLE_DIR/shared/constants"
    cp -r "$ROOT_DIR/shared/dist/constants"/* "$BUNDLE_DIR/shared/constants/" 2>/dev/null || true
  fi
  # Copy transformers directory if it exists
  if [ -d "$ROOT_DIR/shared/dist/transformers" ]; then
    mkdir -p "$BUNDLE_DIR/shared/transformers"
    cp -r "$ROOT_DIR/shared/dist/transformers"/* "$BUNDLE_DIR/shared/transformers/" 2>/dev/null || true
  fi
  # Copy any JS files at root of shared/dist
  cp "$ROOT_DIR/shared/dist"/*.js "$BUNDLE_DIR/shared/" 2>/dev/null || true
  
  echo "  ✅ Root shared content copied to bundle/shared/"
else
  echo "⚠️  Warning: Root shared folder not compiled at $ROOT_DIR/shared/dist"
  echo "   Run: cd $ROOT_DIR/shared && npm run build"
fi

# Copy node_modules (runtime dependencies)
echo "📁 Copying node_modules..."
if [ -d "$SOURCE_DIR/auth/node_modules" ]; then
  cp -r "$SOURCE_DIR/auth/node_modules" "$BUNDLE_DIR/"
elif [ -d "dist/lambdas/auth/node_modules" ]; then
  cp -r dist/lambdas/auth/node_modules "$BUNDLE_DIR/"
else
  echo "⚠️  Warning: node_modules not found. Installing dependencies..."
  npm install jsonwebtoken@^9.0.2 @aws-sdk/lib-dynamodb@^3.478.0 @aws-sdk/client-dynamodb@^3.478.0 bcryptjs@^3.0.3 uuid@8.3.2 --omit=dev --prefix "$BUNDLE_DIR"
fi

echo "✅ Lambda bundle prepared at: $BUNDLE_DIR"
echo "   Structure:"
echo "     src/lambdas/{auth,...}/*.js (for ../../shared/ imports)"
echo "     backend/src/lambdas/{vocabulary,conjugations,...}/*.js (for ../../../../shared/ imports)"
echo "     {other}/*.js (for ../shared/ imports)"
echo "     shared/*.js (lambdas/shared content)"
echo "     src/shared/*.js (backend/src/shared content)"
echo "     shared/{types,validators,...}/*.js (root shared content)"
echo "     node_modules/"
echo ""
echo "⚠️  NOTE: Handler paths in CDK may need adjustment:"
echo "   - Lambdas at src/lambdas/{name}/ need handler: 'src/lambdas/{name}/{file}.handler'"
echo "   - Lambdas at backend/src/lambdas/{name}/ need handler: 'backend/src/lambdas/{name}/{file}.handler'"
echo ""

