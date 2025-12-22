#!/bin/bash

# Debug API Gateway Script
# Helps diagnose API Gateway deployment issues in LocalStack

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 API Gateway Debug Script${NC}"
echo ""

# Detect AWS CLI command
AWS_CMD=""
if command -v awslocal >/dev/null 2>&1; then
    AWS_CMD="awslocal"
elif command -v aws >/dev/null 2>&1; then
    AWS_CMD="aws --endpoint-url=http://localhost:4566"
else
    echo -e "${RED}❌ Neither 'awslocal' nor 'aws' command found${NC}"
    exit 1
fi

echo "Using AWS command: $AWS_CMD"
echo ""

# Check LocalStack health
echo -e "${BLUE}1. Checking LocalStack health...${NC}"
if ! curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
    echo -e "${RED}❌ LocalStack is not running!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ LocalStack is running${NC}"
echo ""

# List API Gateways
echo -e "${BLUE}2. Listing API Gateways...${NC}"
APIS=$($AWS_CMD apigateway get-rest-apis 2>/dev/null || echo "")
if [ -z "$APIS" ] || echo "$APIS" | grep -q '"items":\s*\[\]'; then
    echo -e "${RED}❌ No API Gateways found${NC}"
    echo "   Deploy your infrastructure: cd backend && npm run deploy:local"
    exit 1
fi

echo "$APIS" | jq -r '.items[] | "   ID: \(.id) | Name: \(.name)"' 2>/dev/null || echo "$APIS"
echo ""

# Get first API ID
API_ID=$($AWS_CMD apigateway get-rest-apis --query 'items[0].id' --output text 2>/dev/null || echo "")
if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
    echo -e "${RED}❌ Could not get API Gateway ID${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found API Gateway ID: $API_ID${NC}"
echo ""

# Check deployments
echo -e "${BLUE}3. Checking deployments...${NC}"
DEPLOYMENTS=$($AWS_CMD apigateway get-deployments --rest-api-id "$API_ID" 2>/dev/null || echo "")
if [ -z "$DEPLOYMENTS" ]; then
    echo -e "${RED}❌ No deployments found!${NC}"
    echo "   This is likely the issue - the API Gateway needs to be deployed to a stage"
    echo ""
    echo -e "${YELLOW}💡 Solution:${NC}"
    echo "   The API Gateway should be automatically deployed by CDK."
    echo "   Try redeploying:"
    echo "   cd backend && npm run deploy:local"
    exit 1
fi

echo "$DEPLOYMENTS" | jq -r '.items[] | "   Deployment ID: \(.id) | Created: \(.createdDate)"' 2>/dev/null || echo "$DEPLOYMENTS"
echo ""

# Check stages
echo -e "${BLUE}4. Checking stages...${NC}"
STAGES=$($AWS_CMD apigateway get-stages --rest-api-id "$API_ID" 2>/dev/null || echo "")
if [ -z "$STAGES" ]; then
    echo -e "${RED}❌ No stages found!${NC}"
    echo "   The API Gateway exists but has no stages deployed"
    exit 1
fi

echo "$STAGES" | jq -r '.item[] | "   Stage: \(.stageName) | Deployment: \(.deploymentId)"' 2>/dev/null || echo "$STAGES"
STAGE_NAME=$($AWS_CMD apigateway get-stages --rest-api-id "$API_ID" --query 'item[0].stageName' --output text 2>/dev/null || echo "v1")
echo ""

# Check resources
echo -e "${BLUE}5. Checking API resources...${NC}"
RESOURCES=$($AWS_CMD apigateway get-resources --rest-api-id "$API_ID" 2>/dev/null || echo "")
RESOURCE_COUNT=$(echo "$RESOURCES" | jq '.items | length' 2>/dev/null || echo "0")
echo "   Found $RESOURCE_COUNT resources"
echo ""

# Test API endpoint
echo -e "${BLUE}6. Testing API endpoint...${NC}"
echo "   Testing LocalStack URL format:"
echo "   http://localhost:4566/restapis/$API_ID/$STAGE_NAME/_user_request_/health"
echo ""

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "http://localhost:4566/restapis/$API_ID/$STAGE_NAME/_user_request_/health" 2>/dev/null || echo "")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health endpoint works!${NC}"
    echo "   Response: $BODY"
else
    echo -e "${YELLOW}⚠️  Health endpoint returned HTTP $HTTP_CODE${NC}"
    echo "   Response: $BODY"
fi
echo ""

# Show correct URL formats
echo -e "${BLUE}7. Correct URL formats for LocalStack:${NC}"
echo ""
echo -e "${GREEN}Option 1: LocalStack native format (recommended)${NC}"
echo "   http://localhost:4566/restapis/$API_ID/$STAGE_NAME/_user_request_/{path}"
echo ""
echo -e "${GREEN}Option 2: Execute-API format (may not work in all LocalStack versions)${NC}"
echo "   https://$API_ID.execute-api.localhost.localstack.cloud:4566/$STAGE_NAME/{path}"
echo ""

# Generate .env file content
echo -e "${BLUE}8. Recommended .env file content:${NC}"
echo ""
cat << EOF
# For LocalStack - use native format
EXPO_PUBLIC_API_BASE_URL=http://localhost:4566/restapis/$API_ID/$STAGE_NAME/_user_request_

# Alternative - execute-api format (if supported)
# EXPO_PUBLIC_API_BASE_URL=https://$API_ID.execute-api.localhost.localstack.cloud:4566/$STAGE_NAME
EOF
echo ""

echo -e "${GREEN}✅ Debug complete!${NC}"

