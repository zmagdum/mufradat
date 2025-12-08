#!/bin/bash

# Step 0: Create DynamoDB tables first, before deploying the rest of the stack
# This avoids ResourceInUseException errors

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

cd "$BACKEND_DIR"

ENDPOINT_URL="${AWS_ENDPOINT_URL:-http://localhost:4566}"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"

echo "🗄️  Step 0: Creating DynamoDB tables first"
echo "Endpoint URL : $ENDPOINT_URL"
echo "Region       : $REGION"
echo ""

export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"
export AWS_DEFAULT_REGION="$REGION"

# Detect AWS CLI command
AWS_CMD=""
if command -v awslocal >/dev/null 2>&1; then
    AWS_CMD="awslocal"
elif [ -f "venv/bin/awslocal" ]; then
    AWS_CMD="venv/bin/awslocal"
else
    AWS_CMD="aws --endpoint-url=$ENDPOINT_URL"
fi

echo "Using AWS command: $AWS_CMD"
echo ""

# Function to create a table if it doesn't exist
create_table_if_not_exists() {
    local table_name=$1
    local partition_key=$2
    local partition_key_type=$3
    local sort_key=${4:-}
    local sort_key_type=${5:-}
    
    echo "🔍 Checking table: $table_name"
    
    # Check if table exists
    TABLE_EXISTS=$($AWS_CMD dynamodb describe-table --table-name "$table_name" 2>&1 || echo "NOT_FOUND")
    
    if echo "$TABLE_EXISTS" | grep -q "ResourceNotFoundException\|does not exist\|NOT_FOUND"; then
        echo "   Creating table: $table_name"
        
        # Build create-table command
        CREATE_CMD="$AWS_CMD dynamodb create-table \
            --table-name $table_name \
            --attribute-definitions AttributeName=$partition_key,AttributeType=$partition_key_type"
        
        # Add sort key if provided
        if [ -n "$sort_key" ]; then
            CREATE_CMD="$CREATE_CMD AttributeName=$sort_key,AttributeType=$sort_key_type"
        fi
        
        # Build key schema
        CREATE_CMD="$CREATE_CMD --key-schema AttributeName=$partition_key,KeyType=HASH"
        if [ -n "$sort_key" ]; then
            CREATE_CMD="$CREATE_CMD AttributeName=$sort_key,KeyType=RANGE"
        fi
        
        # Add billing mode
        CREATE_CMD="$CREATE_CMD --billing-mode PAY_PER_REQUEST"
        
        # Execute
        eval $CREATE_CMD > /dev/null 2>&1
        
        echo "   ✅ Table $table_name creation initiated"
        
        # Wait for table to be active
        echo "   Waiting for table to become active..."
        for i in {1..30}; do
            STATUS=$($AWS_CMD dynamodb describe-table --table-name "$table_name" \
                --query 'Table.TableStatus' --output text 2>&1 || echo "NOT_FOUND")
            
            if [ "$STATUS" = "ACTIVE" ]; then
                echo "   ✅ Table $table_name is ACTIVE"
                break
            fi
            
            if [ $i -eq 30 ]; then
                echo "   ⚠️  Table $table_name still not ACTIVE after 60 seconds (Status: $STATUS)"
            else
                sleep 2
            fi
        done
    else
        echo "   ✅ Table $table_name already exists"
    fi
    echo ""
}

# Create all tables
echo "📊 Creating DynamoDB tables..."

# Users Table
create_table_if_not_exists "mufradat-users-local" "userId" "S"
# Add GSI for email
echo "   Adding EmailIndex GSI to mufradat-users-local..."
$AWS_CMD dynamodb update-table \
    --table-name mufradat-users-local \
    --attribute-definitions AttributeName=email,AttributeType=S \
    --global-secondary-index-updates \
    "[{\"Create\":{\"IndexName\":\"EmailIndex\",\"KeySchema\":[{\"AttributeName\":\"email\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"},\"ProvisionedThroughput\":{\"ReadCapacityUnits\":5,\"WriteCapacityUnits\":5}}}]" \
    2>&1 | grep -v "ResourceInUseException\|already exists" || echo "   GSI already exists or will be created"
echo ""

# Vocabulary Table
create_table_if_not_exists "mufradat-vocabulary-local" "wordId" "S"

# Progress Table (has sort key)
create_table_if_not_exists "mufradat-progress-local" "userId" "S" "wordId" "S"

# Conjugations Table
create_table_if_not_exists "mufradat-conjugations-local" "verbId" "S"

# Sessions Table (has sort key)
create_table_if_not_exists "mufradat-sessions-local" "sessionId" "S" "userId" "S"

# OTP Table (has sort key)
create_table_if_not_exists "mufradat-otp-local" "email" "S" "otpType" "S"

echo "✅ All DynamoDB tables created/verified"
echo ""

