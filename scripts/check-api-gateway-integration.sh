#!/bin/bash

# Script to verify API Gateway Lambda Proxy Integration configuration
# Checks if the integration is correctly configured as AWS_PROXY type

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")/backend"

cd "$BACKEND_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔍 Checking API Gateway Lambda Proxy Integration Configuration"
echo ""

# Get API Gateway ID
API_ID=$(awslocal --endpoint-url=http://localhost:4566 apigateway get-rest-apis --query 'items[0].id' --output text 2>/dev/null || echo "")

if [ -z "$API_ID" ]; then
    echo -e "${RED}❌ Could not find API Gateway${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found API Gateway: $API_ID${NC}"
echo ""

# Get resources
echo "📋 Getting API resources..."
RESOURCES=$(awslocal --endpoint-url=http://localhost:4566 apigateway get-resources --rest-api-id "$API_ID" --output json 2>/dev/null)

# Find login resource
LOGIN_RESOURCE_ID=$(echo "$RESOURCES" | jq -r '.items[] | select(.pathPart == "login") | .id' 2>/dev/null || echo "")

if [ -z "$LOGIN_RESOURCE_ID" ]; then
    echo -e "${RED}❌ Could not find /auth/login resource${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found login resource: $LOGIN_RESOURCE_ID${NC}"
echo ""

# Get POST method details
echo "📋 Checking POST method integration..."
METHOD_DETAILS=$(awslocal --endpoint-url=http://localhost:4566 apigateway get-method \
    --rest-api-id "$API_ID" \
    --resource-id "$LOGIN_RESOURCE_ID" \
    --http-method POST \
    --output json 2>/dev/null)

if [ -z "$METHOD_DETAILS" ]; then
    echo -e "${RED}❌ Could not get method details${NC}"
    exit 1
fi

# Check integration type
INTEGRATION_TYPE=$(echo "$METHOD_DETAILS" | jq -r '.methodIntegration.type' 2>/dev/null || echo "")
INTEGRATION_URI=$(echo "$METHOD_DETAILS" | jq -r '.methodIntegration.uri' 2>/dev/null || echo "")
INTEGRATION_HTTP_METHOD=$(echo "$METHOD_DETAILS" | jq -r '.methodIntegration.httpMethod' 2>/dev/null || echo "")

echo "Integration Details:"
echo "  Type: $INTEGRATION_TYPE"
echo "  HTTP Method: $INTEGRATION_HTTP_METHOD"
echo "  URI: $INTEGRATION_URI"
echo ""

if [ "$INTEGRATION_TYPE" = "AWS_PROXY" ]; then
    echo -e "${GREEN}✅ Integration is correctly configured as AWS_PROXY (Lambda Proxy)${NC}"
else
    echo -e "${RED}❌ Integration type is '$INTEGRATION_TYPE' - Expected 'AWS_PROXY'${NC}"
    echo -e "${YELLOW}   This might be why status codes aren't being forwarded correctly${NC}"
fi

# Check if it's a Lambda integration
if echo "$INTEGRATION_URI" | grep -q "lambda"; then
    echo -e "${GREEN}✅ Integration URI points to Lambda function${NC}"
else
    echo -e "${YELLOW}⚠️  Integration URI doesn't appear to be a Lambda function${NC}"
fi

echo ""
echo "Full method details:"
echo "$METHOD_DETAILS" | jq '.' 2>/dev/null || echo "$METHOD_DETAILS"

