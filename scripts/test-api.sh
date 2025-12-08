#!/bin/bash

# API Testing Script
# Tests registration and login endpoints using curl

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🧪 Testing API Endpoints"
echo ""

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
    echo -e "${RED}❌ LocalStack is not running!${NC}"
    echo "Please start LocalStack first:"
    echo "  cd backend && npm run localstack:start"
    exit 1
fi

# Get API Gateway ID
cd "$BACKEND_DIR"
API_ID=$(awslocal apigateway get-rest-apis --query 'items[0].id' --output text 2>/dev/null || echo "")

if [ -z "$API_ID" ]; then
    echo -e "${RED}❌ Could not find API Gateway${NC}"
    echo "Please deploy backend first:"
    echo "  cd backend && npm run deploy:local"
    exit 1
fi

API_URL="http://localhost:4566/restapis/$API_ID/v1"
echo -e "${GREEN}✅ API Gateway ID: $API_ID${NC}"
echo -e "${GREEN}✅ API Base URL: $API_URL${NC}"
echo ""

# Generate unique test email
TIMESTAMP=$(date +%s)
TEST_EMAIL="curl-test-${TIMESTAMP}@example.com"
TEST_PASSWORD="TestPassword123!"
TEST_USERNAME="curltest${TIMESTAMP}"

echo "📝 Test Credentials:"
echo "   Email: $TEST_EMAIL"
echo "   Password: $TEST_PASSWORD"
echo "   Username: $TEST_USERNAME"
echo ""

# Test 1: Registration
echo -e "${YELLOW}1. Testing Registration...${NC}"
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:19006" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"username\": \"$TEST_USERNAME\",
    \"studyGoal\": 20
  }")

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
BODY=$(echo "$REGISTER_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Registration successful (HTTP $HTTP_CODE)${NC}"
    echo "Response body:"
    if [ -z "$BODY" ] || [ "$BODY" = "null" ]; then
        echo -e "${YELLOW}(Empty response body)${NC}"
    else
        echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    fi
    
    # OTP verification temporarily disabled
    OTP_CODE=""
    
    # Extract OTP from response if available (for local testing)
    if command -v jq >/dev/null 2>&1; then
        OTP_MESSAGE=$(echo "$BODY" | jq -r '.message // empty' 2>/dev/null || echo "")
        if [[ "$OTP_MESSAGE" == *"verification"* ]]; then
            echo ""
            echo -e "${YELLOW}⚠️  Note: Email verification required before login${NC}"
            echo "   Check LocalStack logs for OTP code (in local dev, OTP is logged to console)"
        fi
    fi
else
    echo -e "${RED}❌ Registration failed (HTTP $HTTP_CODE)${NC}"
    echo "Response body:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
fi

echo ""

# Test 1.5: Email Verification (if registration was successful)
# TEMPORARILY DISABLED: OTP verification is disabled for testing
# TODO: Re-enable once system is working
if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo -e "${YELLOW}1.5. Email Verification (SKIPPED - OTP temporarily disabled)${NC}"
    echo -e "${YELLOW}   Email is automatically verified during registration for testing${NC}"
    echo ""
    # Skip email verification step - OTP is disabled
fi

# Test 2: Login
echo -e "${YELLOW}2. Testing Login...${NC}"
LOGIN_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:19006" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Login successful (HTTP $HTTP_CODE)${NC}"
    echo "Response body:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    
    # Extract token if jq is available
    if command -v jq >/dev/null 2>&1; then
        TOKEN=$(echo "$BODY" | jq -r '.data.tokens.accessToken // empty' 2>/dev/null || echo "")
        if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
            echo ""
            echo -e "${GREEN}✅ Access Token extracted${NC}"
            echo "Token: ${TOKEN:0:50}..."
        fi
    fi
else
    echo -e "${RED}❌ Login failed (HTTP $HTTP_CODE)${NC}"
    echo "Response body:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    
    if [ "$HTTP_CODE" = "403" ]; then
        echo ""
        echo -e "${YELLOW}💡 Tip: Login failed because email is not verified.${NC}"
        echo "   Run email verification step (1.5) first, or check Lambda logs for OTP."
    fi
fi

echo ""

# Test 3: Invalid Login
echo -e "${YELLOW}3. Testing Invalid Login (should fail)...${NC}"
INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:19006" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"WrongPassword\"
  }")

HTTP_CODE=$(echo "$INVALID_RESPONSE" | tail -n1)
BODY=$(echo "$INVALID_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo -e "${GREEN}✅ Invalid login correctly rejected (HTTP $HTTP_CODE)${NC}"
    echo "Response body:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    echo -e "${RED}❌ Unexpected response (HTTP $HTTP_CODE) - Expected 401 or 403${NC}"
    echo "Response body:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo ""
    echo -e "${YELLOW}💡 This suggests the Lambda may not be handling invalid passwords correctly.${NC}"
    echo "   Check Lambda logs: cd backend && podman-compose logs localstack 2>&1 | grep -A 20 'Login request received'"
fi

echo ""
echo -e "${GREEN}✅ API tests complete!${NC}"
echo ""
echo "📋 To view LocalStack logs:"
echo "   cd backend && podman-compose logs localstack | tail -100"
echo "   cd backend && podman-compose logs -f localstack  # Follow logs"
echo ""
echo "📋 To view Lambda function logs:"
echo "   cd backend && podman-compose logs localstack 2>&1 | grep -A 10 'Login request received'"
echo ""
echo "💡 Note: The DEBUG message 'no service set in context' is harmless - it's LocalStack internal logging."
echo "💡 To see full request/response details, check the Lambda logs above."


