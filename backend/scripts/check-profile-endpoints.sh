#!/bin/bash

# Check Profile Endpoints Script
# Verifies that /users/profile GET and PATCH endpoints exist

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Checking Profile Endpoints${NC}"
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

# Check LocalStack health
if ! curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
    echo -e "${RED}❌ LocalStack is not running!${NC}"
    echo "   Start it with: npm run localstack:start"
    exit 1
fi

# Get API Gateway ID
API_ID=$($AWS_CMD apigateway get-rest-apis --query 'items[0].id' --output text 2>/dev/null || echo "")
if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
    echo -e "${RED}❌ No API Gateway found${NC}"
    echo "   Deploy infrastructure: cd backend && npm run deploy:local"
    exit 1
fi

echo -e "${GREEN}✅ Found API Gateway: $API_ID${NC}"
echo ""

# Get resources
echo -e "${BLUE}Checking API resources...${NC}"
RESOURCES=$($AWS_CMD apigateway get-resources --rest-api-id "$API_ID" 2>/dev/null || echo "")

# Find /users/profile resource
PROFILE_RESOURCE=$(echo "$RESOURCES" | jq -r '.items[] | select(.pathPart=="profile" and (.path | contains("/users"))) | {id: .id, path: .path}' 2>/dev/null || echo "")

if [ -z "$PROFILE_RESOURCE" ]; then
    echo -e "${RED}❌ /users/profile resource not found!${NC}"
    echo ""
    echo "Available resources:"
    echo "$RESOURCES" | jq -r '.items[] | "   \(.path)"' 2>/dev/null || echo "   (Could not parse resources)"
    echo ""
    echo -e "${YELLOW}💡 Solution:${NC}"
    echo "   The profile endpoints need to be deployed. Try:"
    echo "   cd backend && npm run deploy:local"
    exit 1
fi

PROFILE_RESOURCE_ID=$(echo "$PROFILE_RESOURCE" | jq -r '.id' 2>/dev/null)
PROFILE_PATH=$(echo "$PROFILE_RESOURCE" | jq -r '.path' 2>/dev/null)

echo -e "${GREEN}✅ Found profile resource: $PROFILE_PATH (ID: $PROFILE_RESOURCE_ID)${NC}"
echo ""

# Check methods
echo -e "${BLUE}Checking methods on /users/profile...${NC}"
METHODS=$($AWS_CMD apigateway get-resource --rest-api-id "$API_ID" --resource-id "$PROFILE_RESOURCE_ID" 2>/dev/null || echo "")

GET_METHOD=$(echo "$METHODS" | jq -r '.resourceMethods.GET.httpMethod // empty' 2>/dev/null || echo "")
PATCH_METHOD=$(echo "$METHODS" | jq -r '.resourceMethods.PATCH.httpMethod // empty' 2>/dev/null || echo "")

if [ -z "$GET_METHOD" ]; then
    echo -e "${RED}❌ GET method not found on /users/profile${NC}"
else
    echo -e "${GREEN}✅ GET method exists${NC}"
fi

if [ -z "$PATCH_METHOD" ]; then
    echo -e "${RED}❌ PATCH method not found on /users/profile${NC}"
else
    echo -e "${GREEN}✅ PATCH method exists${NC}"
fi

echo ""

# Get stage name
STAGE_NAME=$($AWS_CMD apigateway get-stages --rest-api-id "$API_ID" --query 'item[0].stageName' --output text 2>/dev/null || echo "v1")

if [ -z "$GET_METHOD" ] || [ -z "$PATCH_METHOD" ]; then
    echo -e "${YELLOW}⚠️  Profile endpoints are missing!${NC}"
    echo ""
    echo -e "${YELLOW}💡 Solution:${NC}"
    echo "   1. Make sure you've deployed the latest changes:"
    echo "      cd backend && npm run deploy:local"
    echo ""
    echo "   2. If that doesn't work, try destroying and redeploying:"
    echo "      cd backend/infrastructure"
    echo "      npx cdklocal destroy --all"
    echo "      cd .. && npm run deploy:local"
    exit 1
else
    echo -e "${GREEN}✅ All profile endpoints are configured!${NC}"
    echo ""
    echo "API Base URL:"
    echo "http://localhost:4566/restapis/$API_ID/$STAGE_NAME/_user_request_"
    echo ""
    echo "Profile endpoints:"
    echo "  GET:  http://localhost:4566/restapis/$API_ID/$STAGE_NAME/_user_request_/users/profile"
    echo "  PATCH: http://localhost:4566/restapis/$API_ID/$STAGE_NAME/_user_request_/users/profile"
fi

