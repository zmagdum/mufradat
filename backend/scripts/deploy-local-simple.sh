#!/bin/bash
# Simple deployment script for LocalStack
# Handles bootstrapping and deployment in one command

set -e

cd "$(dirname "$0")/.."

# Set LocalStack environment variables
export STAGE=local
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null 2>&1; then
  echo "❌ LocalStack is not running!"
  echo "Please start LocalStack first:"
  echo "  npm run localstack:start"
  exit 1
fi

echo "✅ LocalStack is running"
echo ""

# Detect AWS CLI command (prefer awslocal, fallback to aws with endpoint-url)
AWS_CMD=""
if command -v awslocal >/dev/null 2>&1; then
  AWS_CMD="awslocal"
elif command -v aws >/dev/null 2>&1; then
  AWS_CMD="aws --endpoint-url=http://localhost:4566"
else
  echo "⚠️  Warning: Neither 'awslocal' nor 'aws' command found."
  echo "   Stack cleanup will be skipped."
fi

# Navigate to infrastructure directory
cd infrastructure

# Check if stack exists and delete it if needed
STACK_NAME="mufradat-local"
if [ -n "$AWS_CMD" ]; then
  echo "🔍 Checking for existing stack..."
  if $AWS_CMD cloudformation describe-stacks --stack-name "$STACK_NAME" > /dev/null 2>&1; then
    echo "⚠️  Found existing stack '$STACK_NAME', deleting it first..."
    npx cdklocal destroy --all --force --require-approval never 2>&1 | grep -v "Stack.*does not exist" || true
    
    # Wait for stack deletion to complete
    echo "   Waiting for stack deletion..."
    for i in {1..60}; do
      if ! $AWS_CMD cloudformation describe-stacks --stack-name "$STACK_NAME" > /dev/null 2>&1; then
        echo "   ✅ Stack deleted"
        break
      fi
      if [ $i -eq 60 ]; then
        echo "   ⚠️  Timeout waiting for deletion, but continuing..."
      else
        sleep 2
      fi
    done
    echo ""
  else
    echo "✅ No existing stack found"
    echo ""
  fi
  
  # Clean up any leftover DynamoDB tables (LocalStack sometimes doesn't delete them with the stack)
  echo "🧹 Cleaning up any leftover DynamoDB tables..."
  TABLES=$($AWS_CMD dynamodb list-tables --query 'TableNames[?contains(@, `mufradat`) && contains(@, `local`)]' --output text 2>&1 || echo "")
  
  if [ -n "$TABLES" ] && [ "$TABLES" != "None" ]; then
    echo "   Found leftover tables: $TABLES"
    for table in $TABLES; do
      echo "   Deleting: $table"
      $AWS_CMD dynamodb delete-table --table-name "$table" > /dev/null 2>&1 || true
    done
    
    # Wait for tables to be deleted
    echo "   Waiting for table deletion..."
    for i in {1..30}; do
      REMAINING=$($AWS_CMD dynamodb list-tables --query 'TableNames[?contains(@, `mufradat`) && contains(@, `local`)]' --output text 2>&1 || echo "")
      if [ -z "$REMAINING" ] || [ "$REMAINING" = "None" ]; then
        echo "   ✅ All tables deleted"
        break
      fi
      if [ $i -eq 30 ]; then
        echo "   ⚠️  Some tables may still be deleting, but continuing..."
      else
        sleep 2
      fi
    done
  else
    echo "   ✅ No leftover tables found"
  fi
  echo ""
fi

# Bootstrap (will succeed even if already bootstrapped)
echo "🥾 Ensuring CDK is bootstrapped..."
npx cdklocal bootstrap aws://000000000000/us-east-1 2>&1 | grep -E "(already bootstrapped|already exists|Bootstrap complete|CDKToolkit)" || echo "✅ Bootstrap check complete"
echo ""

# Deploy
echo "📤 Deploying stack..."
npx cdklocal deploy --all --require-approval never

echo ""
echo "✅ Deployment complete!"
