#!/bin/bash

# Cleanup Failed CDK Stacks in LocalStack
# This script forcefully removes failed stacks that prevent deployment

set -e

echo "🧹 Cleaning up failed CDK stacks..."
echo ""

# Set environment to local
export STAGE=local
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null; then
    echo "❌ LocalStack is not running!"
    echo "Please start LocalStack first:"
    echo "  cd backend && npm run localstack:start"
    exit 1
fi

echo "✅ LocalStack is running"
echo ""

# Check for awslocal command, fallback to aws CLI with endpoint-url
if command -v awslocal >/dev/null 2>&1; then
    AWS_CMD="awslocal"
elif command -v aws >/dev/null 2>&1; then
    AWS_CMD="aws --endpoint-url=http://localhost:4566"
    echo "⚠️  Using AWS CLI with endpoint-url (awslocal not found)"
    echo "   To install awslocal: pip3 install awscli-local"
    echo ""
else
    echo "❌ Neither 'awslocal' nor 'aws' command found!"
    echo ""
    echo "Please install one of the following:"
    echo "  1. awscli-local (recommended): pip3 install awscli-local"
    echo "  2. AWS CLI: https://aws.amazon.com/cli/"
    exit 1
fi

# Navigate to backend directory
cd "$(dirname "$0")/.."

# List all stacks
echo "📋 Listing all stacks..."
$AWS_CMD cloudformation list-stacks --query 'StackSummaries[*].[StackName,StackStatus]' --output table

echo ""

# Find failed stacks
echo "🔍 Searching for failed stacks..."
FAILED_STACKS=$($AWS_CMD cloudformation list-stacks \
  --stack-status-filter DELETE_FAILED CREATE_FAILED UPDATE_FAILED ROLLBACK_FAILED \
  --query 'StackSummaries[?contains(StackName, `mufradat`)].StackName' \
  --output text 2>/dev/null || echo "")

if [ -z "$FAILED_STACKS" ]; then
    echo "✅ No failed stacks found!"
    exit 0
fi

echo "⚠️  Found failed stack(s):"
for stack in $FAILED_STACKS; do
    echo "   - $stack"
done
echo ""

# Ask for confirmation
read -p "Delete these failed stacks? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""
echo "🗑️  Deleting failed stacks..."

for stack in $FAILED_STACKS; do
    echo ""
    echo "Processing: $stack"
    
    # Get stack status
    STACK_STATUS=$($AWS_CMD cloudformation describe-stacks \
      --stack-name "$stack" \
      --query 'Stacks[0].StackStatus' \
      --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$STACK_STATUS" = "NOT_FOUND" ]; then
        echo "   ✅ Stack not found (already deleted)"
        continue
    fi
    
    echo "   Current status: $STACK_STATUS"
    
    # Try CDK destroy first
    echo "   Attempting CDK destroy..."
    npx cdklocal destroy "$stack" --force --require-approval never 2>/dev/null || true
    
    # Wait a moment
    sleep 2
    
    # Try CloudFormation delete-stack
    echo "   Attempting CloudFormation delete..."
    $AWS_CMD cloudformation delete-stack --stack-name "$stack" 2>/dev/null || true
    
    # Wait for deletion
    echo "   Waiting for deletion..."
    for i in {1..30}; do
        CURRENT_STATUS=$($AWS_CMD cloudformation describe-stacks \
          --stack-name "$stack" \
          --query 'Stacks[0].StackStatus' \
          --output text 2>/dev/null || echo "NOT_FOUND")
        
        if [ "$CURRENT_STATUS" = "NOT_FOUND" ]; then
            echo "   ✅ Stack deleted successfully"
            break
        fi
        
        if [ $i -eq 30 ]; then
            echo "   ⚠️  Stack still exists after 30 seconds"
            echo "   Current status: $CURRENT_STATUS"
            echo "   You may need to manually clean up resources"
        fi
        
        sleep 1
    done
done

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "You can now run: npm run deploy:local"

