#!/bin/bash

# Deploy to AWS Production environment
# WARNING: This will deploy to production!

set -e

echo "⚠️  WARNING: You are about to deploy to PRODUCTION!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

echo ""
echo "🚀 Deploying Mufradat to AWS Production..."
echo ""

# Set environment to prod
export STAGE=prod

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

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run tests
echo "🧪 Running tests..."
npm test

if [ $? -ne 0 ]; then
    echo "❌ Tests failed! Aborting deployment."
    exit 1
fi

# Synthesize the stack
echo "🔨 Synthesizing CDK stack..."
npm run cdk:synth

# Diff to show changes
echo "📊 Changes to be deployed:"
npm run cdk:diff

echo ""
read -p "Proceed with deployment? (yes/no): " proceed

if [ "$proceed" != "yes" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

# Deploy to AWS
echo "📤 Deploying to AWS Production..."
npm run cdk:deploy -- --all

echo ""
echo "✅ Production deployment complete!"
echo ""
echo "📋 Stack Outputs:"
npm run cdk -- outputs

echo ""

