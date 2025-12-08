#!/bin/bash

# Script to check Lambda deployment status in LocalStack

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

echo "🔍 Checking Lambda Deployment Status"
echo "======================================"
echo ""
echo "Using AWS CLI: $AWS_CMD"
echo "Endpoint: $ENDPOINT"
echo "Region: $REGION"
echo ""

# Check if LocalStack is running
if ! curl -s "$ENDPOINT/_localstack/health" > /dev/null 2>&1; then
    echo "❌ LocalStack is not running!"
    echo "   Start it with: cd backend && podman-compose up -d"
    exit 1
fi

echo "✅ LocalStack is running"
echo ""

# List all Lambda functions
echo "📋 Lambda Functions:"
echo "--------------------"
$AWS_CMD lambda list-functions --region "$REGION" --query 'Functions[*].[FunctionName,Runtime,CodeSize,LastModified]' --output table 2>&1 || {
    echo "❌ Failed to list Lambda functions"
    echo "   Error details:"
    $AWS_CMD lambda list-functions --region "$REGION" 2>&1 | head -20
    exit 1
}
echo ""

# Check for Register function specifically
echo "🔍 Looking for Register function:"
REGISTER_FUNC=$($AWS_CMD lambda list-functions --region "$REGION" --query 'Functions[?contains(FunctionName, `Register`)].FunctionName' --output text 2>&1 | head -1)

if [ -z "$REGISTER_FUNC" ] || [ "$REGISTER_FUNC" = "None" ]; then
    echo "❌ No Register function found!"
    echo ""
    echo "Available functions:"
    $AWS_CMD lambda list-functions --region "$REGION" --query 'Functions[*].FunctionName' --output table 2>&1
    echo ""
    echo "⚠️  Lambda functions may not be deployed. Try:"
    echo "   cd backend && npm run deploy:local"
    exit 1
fi

echo "✅ Found Register function: $REGISTER_FUNC"
echo ""

# Get function details
echo "📝 Function Details:"
echo "-------------------"
$AWS_CMD lambda get-function --function-name "$REGISTER_FUNC" --region "$REGION" --query '[Configuration.FunctionName,Configuration.Runtime,Configuration.Handler,Configuration.CodeSize,Configuration.Timeout,Configuration.MemorySize]' --output table 2>&1
echo ""

# Check API Gateway integration
echo "🌐 API Gateway Integration:"
echo "---------------------------"
API_ID=$($AWS_CMD apigateway get-rest-apis --region "$REGION" --query 'items[?name==`mufradat-api-local`].id' --output text 2>&1)

if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
    echo "❌ API Gateway not found!"
    echo ""
    echo "Available APIs:"
    $AWS_CMD apigateway get-rest-apis --region "$REGION" --query 'items[*].[name,id]' --output table 2>&1
else
    echo "✅ Found API Gateway: $API_ID"
    echo ""
    
    # Get register resource
    echo "Checking /auth/register endpoint:"
    REGISTER_RESOURCE=$($AWS_CMD apigateway get-resources --rest-api-id "$API_ID" --region "$REGION" --query 'items[?pathPart==`register`].[id,path]' --output text 2>&1)
    
    if [ -z "$REGISTER_RESOURCE" ] || [ "$REGISTER_RESOURCE" = "None" ]; then
        echo "❌ /auth/register endpoint not found!"
    else
        echo "✅ Found register endpoint: $REGISTER_RESOURCE"
        
        # Get POST method
        RESOURCE_ID=$(echo "$REGISTER_RESOURCE" | awk '{print $1}')
        METHOD=$($AWS_CMD apigateway get-method --rest-api-id "$API_ID" --resource-id "$RESOURCE_ID" --http-method POST --region "$REGION" --query '[httpMethod,methodIntegration.type,methodIntegration.uri]' --output text 2>&1 || echo "None")
        
        if [ "$METHOD" = "None" ]; then
            echo "❌ POST method not configured!"
        else
            echo "✅ POST method configured: $METHOD"
        fi
    fi
fi

echo ""

# Test direct Lambda invocation
echo "🧪 Testing Direct Lambda Invocation:"
echo "------------------------------------"
echo "Invoking function: $REGISTER_FUNC"
echo ""

TEST_PAYLOAD='{
  "httpMethod": "POST",
  "path": "/auth/register",
  "headers": {
    "origin": "http://localhost:19006",
    "Content-Type": "application/json"
  },
  "body": "{\"email\":\"test@example.com\",\"password\":\"Test123!\"}"
}'

echo "$TEST_PAYLOAD" > /tmp/test-lambda-payload.json

INVOKE_RESULT=$($AWS_CMD lambda invoke \
    --function-name "$REGISTER_FUNC" \
    --payload file:///tmp/test-lambda-payload.json \
    --region "$REGION" \
    /tmp/lambda-response.json 2>&1)

if [ $? -eq 0 ]; then
    echo "✅ Lambda invocation successful!"
    echo ""
    echo "Response:"
    cat /tmp/lambda-response.json | jq '.' 2>/dev/null || cat /tmp/lambda-response.json
    echo ""
    
    # Check for logs
    echo "📜 Checking CloudWatch Logs:"
    LOG_GROUP="/aws/lambda/$REGISTER_FUNC"
    LOG_STREAMS=$($AWS_CMD logs describe-log-streams --log-group-name "$LOG_GROUP" --region "$REGION" --order-by LastEventTime --descending --max-items 1 --query 'logStreams[0].logStreamName' --output text 2>&1 || echo "None")
    
    if [ -n "$LOG_STREAMS" ] && [ "$LOG_STREAMS" != "None" ]; then
        echo "✅ Found log stream: $LOG_STREAMS"
        echo ""
        echo "Recent log events:"
        $AWS_CMD logs get-log-events \
            --log-group-name "$LOG_GROUP" \
            --log-stream-name "$LOG_STREAMS" \
            --region "$REGION" \
            --limit 20 \
            --query 'events[*].message' \
            --output text 2>&1 | grep -E "\[REGISTER\]|Registration|error|Error" || echo "No matching log entries found"
    else
        echo "⚠️  No log streams found (Lambda may not have been invoked yet)"
    fi
else
    echo "❌ Lambda invocation failed!"
    echo "$INVOKE_RESULT"
fi

echo ""
echo "======================================"
echo "💡 To view all LocalStack logs:"
echo "   cd backend && podman-compose logs -f localstack | grep -i lambda"
echo ""
echo "💡 To view Lambda logs:"
echo "   $AWS_CMD logs tail /aws/lambda/$REGISTER_FUNC --follow"



