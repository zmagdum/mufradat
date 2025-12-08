#!/bin/bash

# Script to fix failed CDK deployment by cleaning up resources

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

echo "🔧 Fixing Deployment Issues"
echo "==========================="
echo ""
echo "Using AWS CLI: $AWS_CMD"
echo "Stack: $STACK_NAME"
echo ""

# Check stack status
STACK_STATUS=$($AWS_CMD cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].StackStatus' --output text 2>&1 || echo "NOT_FOUND")

if [ "$STACK_STATUS" = "NOT_FOUND" ]; then
    echo "⚠️  Stack not found. Proceeding with cleanup anyway..."
elif [ "$STACK_STATUS" = "CREATE_FAILED" ] || [ "$STACK_STATUS" = "UPDATE_FAILED" ] || [ "$STACK_STATUS" = "ROLLBACK_FAILED" ]; then
    echo "❌ Stack is in failed state: $STACK_STATUS"
    echo ""
    echo "Attempting to delete failed stack..."
    $AWS_CMD cloudformation delete-stack --stack-name "$STACK_NAME" 2>&1 || echo "Delete command issued (may take time)"
    echo "Waiting for stack deletion..."
    sleep 5
else
    echo "ℹ️  Stack status: $STACK_STATUS"
fi

echo ""
echo "🧹 Cleaning up resources manually..."
echo ""

# Delete DynamoDB tables (with retries and stream handling)
echo "Deleting DynamoDB tables..."
TABLES=$($AWS_CMD dynamodb list-tables --query 'TableNames[?contains(@, `mufradat`)]' --output text 2>&1 || echo "")

if [ -n "$TABLES" ]; then
    for table in $TABLES; do
        echo "  Deleting table: $table"
        # Disable streams first if they exist
        STREAM_ARN=$($AWS_CMD dynamodb describe-table --table-name "$table" --query 'Table.LatestStreamArn' --output text 2>&1 || echo "")
        if [ -n "$STREAM_ARN" ] && [ "$STREAM_ARN" != "None" ] && [ "$STREAM_ARN" != "null" ]; then
            echo "    Table has stream: $STREAM_ARN"
            # Streams are automatically deleted when table is deleted
        fi
        # Delete table
        $AWS_CMD dynamodb delete-table --table-name "$table" 2>&1 || echo "    Failed to delete (may not exist)"
    done
    echo "  Waiting for tables to be deleted..."
    sleep 5
    
    # Verify deletion
    for table in $TABLES; do
        STATUS=$($AWS_CMD dynamodb describe-table --table-name "$table" --query 'Table.TableStatus' --output text 2>&1 || echo "DELETED")
        if [ "$STATUS" != "DELETED" ] && [ "$STATUS" != "None" ]; then
            echo "    ⚠️  Table $table still exists with status: $STATUS"
            echo "    Retrying deletion..."
            $AWS_CMD dynamodb delete-table --table-name "$table" 2>&1
            sleep 3
        fi
    done
else
    echo "  No tables found"
fi

# Delete Lambda functions
echo ""
echo "Deleting Lambda functions..."
FUNCTIONS=$($AWS_CMD lambda list-functions --query 'Functions[?contains(FunctionName, `mufradat`)].[FunctionName]' --output text 2>&1 || echo "")

if [ -n "$FUNCTIONS" ]; then
    for func in $FUNCTIONS; do
        echo "  Deleting function: $func"
        $AWS_CMD lambda delete-function --function-name "$func" 2>&1 || echo "    Failed to delete (may not exist)"
    done
else
    echo "  No functions found"
fi

# Delete API Gateway
echo ""
echo "Deleting API Gateway..."
API_ID=$($AWS_CMD apigateway get-rest-apis --query 'items[?name==`mufradat-api-local`].id' --output text 2>&1 || echo "")

if [ -n "$API_ID" ] && [ "$API_ID" != "None" ]; then
    echo "  Deleting API: $API_ID"
    $AWS_CMD apigateway delete-rest-api --rest-api-id "$API_ID" 2>&1 || echo "    Failed to delete"
else
    echo "  No API Gateway found"
fi

# Delete CloudWatch Log Groups
echo ""
echo "Deleting CloudWatch Log Groups..."
LOG_GROUPS=$($AWS_CMD logs describe-log-groups --query 'logGroups[?contains(logGroupName, `mufradat`)].logGroupName' --output text 2>&1 || echo "")

if [ -n "$LOG_GROUPS" ]; then
    for log_group in $LOG_GROUPS; do
        echo "  Deleting log group: $log_group"
        $AWS_CMD logs delete-log-group --log-group-name "$log_group" 2>&1 || echo "    Failed to delete"
    done
else
    echo "  No log groups found"
fi

echo ""
echo "✅ Cleanup complete!"
echo ""
echo "🚀 Now redeploy:"
echo "   cd backend && npm run deploy:local"

