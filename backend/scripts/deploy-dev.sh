#!/bin/bash

# Deploy to AWS Development environment

set -e

echo "🚀 Deploying Mufradat to AWS Development..."
echo ""

# Set environment to dev
export STAGE=dev

# Check AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS credentials not configured!"
    echo "Please configure AWS CLI first:"
    echo "  aws configure"
    exit 1
fi

echo "✅ AWS credentials configured"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/.."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run tests
echo "🧪 Running tests..."
npm test

# Synthesize the stack
echo "🔨 Synthesizing CDK stack..."
npm run cdk:synth

# Deploy to AWS
echo "📤 Deploying to AWS..."
npm run cdk:deploy -- --all --require-approval never

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Stack Outputs:"
npm run cdk -- outputs

echo ""

