#!/bin/bash

# Fix API Gateway Deployment Script
# Ensures API Gateway is properly deployed to a stage in LocalStack

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 API Gateway Deployment Fix Script${NC}"
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
    exit 1
fi

# Get API Gateway ID
API_ID=$($AWS_CMD apigateway get-rest-apis --query 'items[0].id' --output text 2>/dev/null || echo "")
if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
    echo -e "${RED}❌ No API Gateway found${NC}"
    echo "   Deploy infrastructure first: cd backend && npm run deploy:local"
    exit 1
fi

echo -e "${GREEN}✅ Found API Gateway: $API_ID${NC}"
echo ""

# Check if stage exists
STAGE_NAME="v1"
STAGES=$($AWS_CMD apigateway get-stages --rest-api-id "$API_ID" 2>/dev/null || echo "")
STAGE_EXISTS=$(echo "$STAGES" | jq -r ".item[] | select(.stageName==\"$STAGE_NAME\") | .stageName" 2>/dev/null || echo "")

if [ -n "$STAGE_EXISTS" ]; then
    echo -e "${GREEN}✅ Stage '$STAGE_NAME' already exists${NC}"
    echo ""
    echo "Testing endpoint..."
    TEST_URL="http://localhost:4566/restapis/$API_ID/$STAGE_NAME/_user_request_/health"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_URL" 2>/dev/null || echo "000")
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ]; then
        echo -e "${GREEN}✅ API Gateway is accessible${NC}"
        echo "   URL format: http://localhost:4566/restapis/$API_ID/$STAGE_NAME/_user_request_"
        echo ""
        echo "Update your mobile .env file:"
        echo "EXPO_PUBLIC_API_BASE_URL=http://localhost:4566/restapis/$API_ID/$STAGE_NAME/_user_request_"
    else
        echo -e "${YELLOW}⚠️  API Gateway returned HTTP $HTTP_CODE${NC}"
        echo "   This might indicate missing resources or methods"
    fi
else
    echo -e "${YELLOW}⚠️  Stage '$STAGE_NAME' not found${NC}"
    echo "   Creating deployment..."
    
    # Create a deployment
    DEPLOYMENT_ID=$($AWS_CMD apigateway create-deployment \
        --rest-api-id "$API_ID" \
        --stage-name "$STAGE_NAME" \
        --query 'id' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$DEPLOYMENT_ID" ] && [ "$DEPLOYMENT_ID" != "None" ]; then
        echo -e "${GREEN}✅ Created deployment: $DEPLOYMENT_ID${NC}"
        echo ""
        echo "Update your mobile .env file:"
        echo "EXPO_PUBLIC_API_BASE_URL=http://localhost:4566/restapis/$API_ID/$STAGE_NAME/_user_request_"
    else
        echo -e "${RED}❌ Failed to create deployment${NC}"
        echo "   Try redeploying infrastructure: cd backend && npm run deploy:local"
        exit 1
    fi
fi

echo ""
echo -e "${GREEN}✅ Fix complete!${NC}"

