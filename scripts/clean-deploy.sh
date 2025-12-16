#!/bin/bash

# Complete cleanup and redeploy script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

cd "$BACKEND_DIR"

# Detect AWS CLI command
if command -v awslocal &> /dev/null; then
    AWS_CMD="awslocal"
elif [ -f "venv/bin/awslocal" ]; then
    AWS_CMD="venv/bin/awslocal"
else
    AWS_CMD="aws --endpoint-url=http://localhost:4566"
fi

ENDPOINT="http://localhost:4566"
REGION="us-east-1"
STACK_NAME="mufradat-local"

echo "🧹 Complete Cleanup and Redeploy"
echo "================================="
echo ""

# Step 1: Check LocalStack
if ! curl -s "$ENDPOINT/_localstack/health" > /dev/null 2>&1; then
    echo "❌ LocalStack is not running!"
    echo "   Start it with: cd backend && podman-compose up -d"
    exit 1
fi
echo "✅ LocalStack is running"
echo ""

# Step 2: Delete CloudFormation stack
echo "🗑️  Step 1: Deleting CloudFormation stack...$AWS_CMD"
STACK_STATUS=$($AWS_CMD cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text 2>&1 || echo "NOT_FOUND")

if [ "$STACK_STATUS" != "NOT_FOUND" ]; then
    echo "  Stack status: $STACK_STATUS"
    $AWS_CMD cloudformation delete-stack --stack-name "$STACK_NAME" 2>&1 || true
    echo "  Waiting for stack deletion..."
    sleep 10
    
    # Wait for deletion to complete
    for i in {1..30}; do
        STATUS=$($AWS_CMD cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text 2>&1 || echo "DELETED")
        if [ "$STATUS" = "DELETED" ] || [[ "$STATUS" == *"does not exist"* ]] || [[ "$STATUS" == *"NOT_FOUND"* ]]; then
            echo "  ✅ Stack deleted"
            break
        fi
        echo "  Waiting... ($i/30)"
        sleep 2
    done
else
    echo "  ✅ Stack not found (already deleted)"
fi
echo ""

# Step 3: Delete DynamoDB tables
echo "🗑️  Step 2: Deleting DynamoDB tables..."
TABLES=$($AWS_CMD dynamodb list-tables --query 'TableNames[?contains(@, `mufradat`)]' --output text 2>&1 || echo "")

if [ -n "$TABLES" ] && [ "$TABLES" != "None" ]; then
    for table in $TABLES; do
        echo "  Deleting table: $table"
        $AWS_CMD dynamodb delete-table --table-name "$table" 2>&1 || echo "    Failed (may not exist)"
    done
    echo "  Waiting for tables to be deleted..."
    sleep 5
    
    # Verify deletion
    REMAINING=$($AWS_CMD dynamodb list-tables --query 'TableNames[?contains(@, `mufradat`)]' --output text 2>&1 || echo "")
    if [ -z "$REMAINING" ] || [ "$REMAINING" = "None" ]; then
        echo "  ✅ All tables deleted"
    else
        echo "  ⚠️  Some tables still exist: $REMAINING"
    fi
else
    echo "  ✅ No tables found"
fi
echo ""

# Step 4: Delete Lambda functions
echo "🗑️  Step 3: Deleting Lambda functions..."
FUNCTIONS=$($AWS_CMD lambda list-functions --query 'Functions[?contains(FunctionName, `mufradat`)].FunctionName' --output text 2>&1 || echo "")

if [ -n "$FUNCTIONS" ] && [ "$FUNCTIONS" != "None" ]; then
    for func in $FUNCTIONS; do
        echo "  Deleting function: $func"
        $AWS_CMD lambda delete-function --function-name "$func" 2>&1 || echo "    Failed (may not exist)"
    done
    sleep 2
    echo "  ✅ Functions deleted"
else
    echo "  ✅ No functions found"
fi
echo ""

# Step 5: Delete API Gateway
echo "🗑️  Step 4: Deleting API Gateway..."
API_ID=$($AWS_CMD apigateway get-rest-apis --query 'items[?name==`mufradat-api-local`].id' --output text 2>&1 || echo "")

if [ -n "$API_ID" ] && [ "$API_ID" != "None" ]; then
    echo "  Deleting API: $API_ID"
    $AWS_CMD apigateway delete-rest-api --rest-api-id "$API_ID" 2>&1 || echo "    Failed"
    echo "  ✅ API Gateway deleted"
else
    echo "  ✅ No API Gateway found"
fi
echo ""

# Step 6: Delete CloudWatch Log Groups
echo "🗑️  Step 5: Deleting CloudWatch Log Groups..."
LOG_GROUPS=$($AWS_CMD logs describe-log-groups --query 'logGroups[?contains(logGroupName, `mufradat`)].logGroupName' --output text 2>&1 || echo "")

if [ -n "$LOG_GROUPS" ] && [ "$LOG_GROUPS" != "None" ]; then
    for log_group in $LOG_GROUPS; do
        echo "  Deleting log group: $log_group"
        $AWS_CMD logs delete-log-group --log-group-name "$log_group" 2>&1 || echo "    Failed"
    done
    echo "  ✅ Log groups deleted"
else
    echo "  ✅ No log groups found"
fi
echo ""

# Step 7: Rebuild
echo "🔨 Step 6: Rebuilding TypeScript..."
npm run build
echo "  ✅ Build complete"
echo ""

# Step 8: Deploy
echo "🚀 Step 7: Deploying to LocalStack..."
npm run deploy:local
echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 Verify deployment:"
echo "   ./scripts/check-lambda-deployment.sh"



