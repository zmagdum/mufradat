#!/bin/bash

# Deploy to LocalStack for local development
# Make sure LocalStack is running before executing this script

# Exit on error, but show error messages
set -e

echo "🚀 Deploying Mufradat to LocalStack..."
echo ""

# Check if LocalStack is running
if ! curl -s http://localhost:4566/_localstack/health > /dev/null; then
    echo "❌ LocalStack is not running!"
    echo "Please start LocalStack first:"
    echo "  podman-compose up -d"
    echo "  or: npm run localstack:start"
    exit 1
fi

echo "✅ LocalStack is running"
echo ""

# Set environment to local
export STAGE=local
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566

# Navigate to backend directory
cd "$(dirname "$0")/.."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check for Python venv and activate it if it exists
if [ -d "venv" ] && [ -f "venv/bin/activate" ]; then
    echo "🐍 Activating Python virtual environment..."
    source venv/bin/activate
fi

# Check for awslocal command, fallback to aws CLI with endpoint-url
AWS_CMD=""
if command -v awslocal >/dev/null 2>&1; then
    AWS_CMD="awslocal"
    echo "✅ Found awslocal command"
elif [ -f "venv/bin/awslocal" ]; then
    AWS_CMD="venv/bin/awslocal"
    echo "✅ Found awslocal in venv"
elif command -v aws >/dev/null 2>&1; then
    AWS_CMD="aws --endpoint-url=http://localhost:4566"
    echo "⚠️  Using AWS CLI with endpoint-url (awslocal not found)"
else
    echo "⚠️  Warning: Neither 'awslocal' nor 'aws' command found."
    echo "   Failed stack cleanup will be skipped."
    echo "   To install awslocal:"
    echo "     python3 -m venv venv"
    echo "     source venv/bin/activate"
    echo "     pip install awscli-local"
fi
echo ""

# Cleanup: Delete existing stack and resources before deploying
if [ -n "$AWS_CMD" ]; then
    STACK_NAME="mufradat-local"
    
    echo "🔍 Checking for existing stack '$STACK_NAME'..."
    STACK_STATUS=$($AWS_CMD cloudformation describe-stacks \
      --stack-name "$STACK_NAME" \
      --query 'Stacks[0].StackStatus' \
      --output text 2>&1 || echo "NOT_FOUND")
    
    if [ "$STACK_STATUS" != "NOT_FOUND" ] && [ -n "$STACK_STATUS" ]; then
        echo "⚠️  Found existing stack in state: $STACK_STATUS"
        
        # For ROLLBACK_COMPLETE or DELETE_FAILED stacks, we MUST delete them first
        if [[ "$STACK_STATUS" == *"ROLLBACK"* ]] || [[ "$STACK_STATUS" == *"DELETE_FAILED"* ]] || [[ "$STACK_STATUS" == *"FAILED"* ]]; then
            echo "🧹 Deleting failed/rolled-back stack (this may take a moment)..."
        else
            echo "🧹 Deleting existing stack..."
        fi
        
        $AWS_CMD cloudformation delete-stack --stack-name "$STACK_NAME" 2>/dev/null || true
        
        # Wait for deletion to complete (with timeout)
        echo "   Waiting for stack deletion to complete..."
        for i in {1..90}; do
            CURRENT_STATUS=$($AWS_CMD cloudformation describe-stacks \
              --stack-name "$STACK_NAME" \
              --query 'Stacks[0].StackStatus' \
              --output text 2>&1 || echo "DELETED")
            
            if [ "$CURRENT_STATUS" = "DELETED" ] || \
               [[ "$CURRENT_STATUS" == *"does not exist"* ]] || \
               [[ "$CURRENT_STATUS" == *"NOT_FOUND"* ]] || \
               [ -z "$CURRENT_STATUS" ]; then
                echo "   ✅ Stack deleted"
                break
            fi
            
            if [ $i -eq 90 ]; then
                echo "   ⚠️  Timeout waiting for stack deletion after 3 minutes."
                echo "   Current status: $CURRENT_STATUS"
                echo "   You may need to manually delete the stack or restart LocalStack"
            else
                if [ $((i % 10)) -eq 0 ]; then
                    echo "   Waiting... ($i/90) - Status: $CURRENT_STATUS"
                fi
                sleep 2
            fi
        done
        
        # Extra wait after stack deletion to ensure all resources are cleaned up
        if [ "$CURRENT_STATUS" = "DELETED" ] || [[ "$CURRENT_STATUS" == *"does not exist"* ]] || [[ "$CURRENT_STATUS" == *"NOT_FOUND"* ]]; then
            echo "   Waiting additional 5 seconds for resource cleanup..."
            sleep 5
        fi
        echo ""
    fi
    
    # Also delete any leftover DynamoDB tables and wait for deletion to complete
    echo "🔍 Checking for leftover DynamoDB tables..."
    TABLES=$($AWS_CMD dynamodb list-tables \
      --query 'TableNames[?contains(@, `mufradat`) && contains(@, `local`)]' \
      --output text 2>&1 || echo "")
    
    if [ -n "$TABLES" ] && [ "$TABLES" != "None" ]; then
        echo "🧹 Deleting leftover DynamoDB tables..."
        for table in $TABLES; do
            echo "   Deleting table: $table"
            $AWS_CMD dynamodb delete-table --table-name "$table" 2>/dev/null || true
        done
        
        # Wait for all tables to be fully deleted (with polling)
        echo "   Waiting for tables to be deleted (this may take up to 2 minutes)..."
        for i in {1..60}; do
            REMAINING=$($AWS_CMD dynamodb list-tables \
              --query 'TableNames[?contains(@, `mufradat`) && contains(@, `local`)]' \
              --output text 2>&1 || echo "")
            
            if [ -z "$REMAINING" ] || [ "$REMAINING" = "None" ]; then
                echo "   ✅ All tables deleted"
                break
            fi
            
            # Check table status - if it's DELETING, that's okay, just wait
            TABLE_STATUS=$($AWS_CMD dynamodb describe-table \
              --table-name "$REMAINING" \
              --query 'Table.TableStatus' \
              --output text 2>&1 || echo "NOT_FOUND")
            
            if [ "$TABLE_STATUS" = "NOT_FOUND" ] || [[ "$TABLE_STATUS" == *"does not exist"* ]]; then
                echo "   ✅ Table deleted"
                break
            fi
            
            if [ $i -eq 60 ]; then
                echo "   ⚠️  Timeout waiting for table deletion after 2 minutes."
                echo "   Remaining: $REMAINING (Status: $TABLE_STATUS)"
                echo "   Attempting force deletion one more time..."
                for table in $REMAINING; do
                    echo "     Force deleting: $table"
                    $AWS_CMD dynamodb delete-table --table-name "$table" 2>/dev/null || true
                done
                sleep 5
            else
                if [ $((i % 5)) -eq 0 ]; then
                    echo "   Waiting... ($i/60) - Remaining: $REMAINING (Status: $TABLE_STATUS)"
                fi
                sleep 2
            fi
        done
        echo ""
    fi
    
    # Final verification: ensure no mufradat-local tables exist before deploying
    echo "🔍 Final verification: checking for any remaining mufradat-local resources..."
    FINAL_TABLES=$($AWS_CMD dynamodb list-tables \
      --query 'TableNames[?contains(@, `mufradat`) && contains(@, `local`)]' \
      --output text 2>&1 || echo "")
    
    if [ -n "$FINAL_TABLES" ] && [ "$FINAL_TABLES" != "None" ]; then
        echo "⚠️  Tables still exist: $FINAL_TABLES"
        echo "   Checking their status and attempting final cleanup..."
        
        for table in $FINAL_TABLES; do
            TABLE_STATUS=$($AWS_CMD dynamodb describe-table \
              --table-name "$table" \
              --query 'Table.TableStatus' \
              --output text 2>&1 || echo "NOT_FOUND")
            
            if [ "$TABLE_STATUS" = "NOT_FOUND" ] || [[ "$TABLE_STATUS" == *"does not exist"* ]]; then
                echo "   ✅ $table already deleted"
            elif [ "$TABLE_STATUS" = "DELETING" ]; then
                echo "   ⏳ $table is being deleted, waiting..."
                # Wait for this specific table to be deleted
                for j in {1..30}; do
                    CHECK_STATUS=$($AWS_CMD dynamodb describe-table \
                      --table-name "$table" \
                      --query 'Table.TableStatus' \
                      --output text 2>&1 || echo "DELETED")
                    if [ "$CHECK_STATUS" = "NOT_FOUND" ] || [[ "$CHECK_STATUS" == *"does not exist"* ]] || [ "$CHECK_STATUS" = "DELETED" ]; then
                        echo "   ✅ $table deleted"
                        break
                    fi
                    sleep 2
                done
            else
                echo "   🗑️  Deleting $table (Status: $TABLE_STATUS)..."
                $AWS_CMD dynamodb delete-table --table-name "$table" 2>/dev/null || true
                # Wait a bit for deletion to start
                sleep 3
            fi
        done
        
        # Final check
        FINAL_CHECK=$($AWS_CMD dynamodb list-tables \
          --query 'TableNames[?contains(@, `mufradat`) && contains(@, `local`)]' \
          --output text 2>&1 || echo "")
        
        if [ -n "$FINAL_CHECK" ] && [ "$FINAL_CHECK" != "None" ]; then
            echo "❌ ERROR: Tables still exist after final cleanup: $FINAL_CHECK"
            echo "   Please restart LocalStack to clear stuck resources:"
            echo "   cd backend && npm run localstack:restart"
            exit 1
        fi
    fi
    echo "   ✅ No conflicting tables found"
    echo ""
    
    # Extra safety: wait a moment for any async cleanup to complete
    echo "⏳ Waiting 3 seconds for cleanup to fully complete..."
    sleep 3
    
    # One more final check right before deployment
    FINAL_VERIFY=$($AWS_CMD dynamodb list-tables \
      --query 'TableNames[?contains(@, `mufradat`) && contains(@, `local`)]' \
      --output text 2>&1 || echo "")
    
    if [ -n "$FINAL_VERIFY" ] && [ "$FINAL_VERIFY" != "None" ]; then
        echo "❌ CRITICAL: Tables still exist right before deployment: $FINAL_VERIFY"
        echo "   This indicates a timing issue. Please restart LocalStack:"
        echo "   cd backend && npm run localstack:restart"
        exit 1
    fi
    echo ""
fi

# Build Lambda bundle before synthesizing
# UNCONDITIONAL cleanup: Always delete tables before building/deploying
# This ensures we start fresh even if previous cleanup didn't run
echo "🧹 UNCONDITIONAL cleanup: Ensuring no conflicting tables exist..."
if [ -n "$AWS_CMD" ]; then
    ALL_TABLES=$($AWS_CMD dynamodb list-tables \
      --query 'TableNames[?contains(@, `mufradat`) && contains(@, `local`)]' \
      --output text 2>&1 || echo "")
    
    if [ -n "$ALL_TABLES" ] && [ "$ALL_TABLES" != "None" ]; then
        echo "   Found tables: $ALL_TABLES"
        echo "   Deleting all mufradat-local tables..."
        for table in $ALL_TABLES; do
            echo "     Deleting: $table"
            $AWS_CMD dynamodb delete-table --table-name "$table" 2>&1 | grep -v "ResourceNotFoundException" || true
        done
        
        # Wait for deletion
        echo "   Waiting for deletion to complete..."
        for i in {1..30}; do
            REMAINING=$($AWS_CMD dynamodb list-tables \
              --query 'TableNames[?contains(@, `mufradat`) && contains(@, `local`)]' \
              --output text 2>&1 || echo "")
            if [ -z "$REMAINING" ] || [ "$REMAINING" = "None" ]; then
                echo "   ✅ All tables deleted"
                break
            fi
            sleep 2
        done
    else
        echo "   ✅ No conflicting tables found"
    fi
    echo ""
fi

echo "🔨 Building TypeScript and preparing Lambda bundle..."
if ! npm run build:lambda 2>&1; then
    echo ""
    echo "❌ Build failed!"
    echo "   Check the error messages above for details"
    exit 1
fi
echo "✅ Build complete"
echo ""

# Synthesize the stack
echo "🔨 Synthesizing CDK stack..."
set -e  # Enable exit on error for critical steps
if ! npm run cdk:synth 2>&1; then
    echo ""
    echo "❌ CDK synthesis failed!"
    echo "   Check the error messages above for details"
    exit 1
fi

# Bootstrap CDK environment for LocalStack (only if not already bootstrapped)
echo "🥾 Checking CDK bootstrap status..."
set +e  # Don't exit on error for checks
BOOTSTRAP_CHECK=$($AWS_CMD ssm get-parameter --name /cdk-bootstrap/hnb659fds/version --query 'Parameter.Value' --output text 2>&1)
BOOTSTRAP_CHECK_EXIT=$?
set -e  # Re-enable exit on error

if [ $BOOTSTRAP_CHECK_EXIT -eq 0 ] && [ -n "$BOOTSTRAP_CHECK" ]; then
    echo "✅ CDK already bootstrapped (version: $BOOTSTRAP_CHECK)"
else
    echo "🥾 Bootstrapping CDK environment for LocalStack..."
    set +e  # Don't exit on error for bootstrap
    BOOTSTRAP_OUTPUT=$(npx cdklocal bootstrap aws://000000000000/us-east-1 2>&1)
    BOOTSTRAP_EXIT=$?
    if [ $BOOTSTRAP_EXIT -ne 0 ]; then
        if echo "$BOOTSTRAP_OUTPUT" | grep -q "already bootstrapped\|already exists"; then
            echo "✅ Bootstrap already done, continuing..."
        else
            echo "⚠️  Bootstrap warning (may be okay):"
            echo "$BOOTSTRAP_OUTPUT" | tail -5
        fi
    else
        echo "✅ Bootstrap complete"
    fi
    set -e  # Re-enable exit on error
fi

# FINAL CHECK: Verify no tables exist RIGHT before deployment
echo "🔍 FINAL PRE-DEPLOYMENT CHECK: Verifying no conflicting tables..."
if [ -n "$AWS_CMD" ]; then
    PRE_DEPLOY_TABLES=$($AWS_CMD dynamodb list-tables \
      --query 'TableNames[?contains(@, `mufradat`) && contains(@, `local`)]' \
      --output text 2>&1 || echo "")
    
    if [ -n "$PRE_DEPLOY_TABLES" ] && [ "$PRE_DEPLOY_TABLES" != "None" ]; then
        echo "❌ FATAL ERROR: Tables exist right before deployment: $PRE_DEPLOY_TABLES"
        echo ""
        echo "   This should not happen - cleanup should have removed them."
        echo "   Attempting one final deletion..."
        for table in $PRE_DEPLOY_TABLES; do
            echo "   🗑️  Deleting: $table"
            $AWS_CMD dynamodb delete-table --table-name "$table" 2>&1 || true
        done
        
        echo "   Waiting 15 seconds for deletion..."
        sleep 15
        
        FINAL_CHECK=$($AWS_CMD dynamodb list-tables \
          --query 'TableNames[?contains(@, `mufradat`) && contains(@, `local`)]' \
          --output text 2>&1 || echo "")
        
        if [ -n "$FINAL_CHECK" ] && [ "$FINAL_CHECK" != "None" ]; then
            echo ""
            echo "❌ CANNOT PROCEED: Tables still exist: $FINAL_CHECK"
            echo ""
            echo "   The table deletion is not completing. This may indicate:"
            echo "   1. LocalStack is having issues"
            echo "   2. The table is stuck in DELETING state"
            echo ""
            echo "   SOLUTION: Restart LocalStack to clear stuck resources:"
            echo "   cd backend && npm run localstack:restart"
            echo ""
            echo "   Then manually delete if needed:"
            for table in $FINAL_CHECK; do
                echo "     awslocal dynamodb delete-table --table-name $table"
            done
            exit 1
        else
            echo "   ✅ Final cleanup successful - proceeding with deployment"
        fi
    else
        echo "   ✅ No conflicting tables - safe to deploy"
    fi
    echo ""
fi

# Deploy to LocalStack using cdklocal
echo "📤 Deploying to LocalStack..."
DEPLOY_OUTPUT=$(npx cdklocal deploy --all --require-approval never 2>&1)
DEPLOY_EXIT=$?

if [ $DEPLOY_EXIT -ne 0 ]; then
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    
    # Check for specific error types
    if echo "$DEPLOY_OUTPUT" | grep -q "Docker not available\|docker not available"; then
        echo "🔧 Docker/Podman Issue Detected:"
        echo ""
        echo "LocalStack needs Docker/Podman to execute Lambda functions."
        echo ""
        echo "Solutions:"
        echo "  1. Ensure Podman socket is accessible:"
        echo "     test -S /run/user/1000/podman/podman.sock && echo 'Socket OK'"
        echo ""
        echo "  2. Restart LocalStack with proper socket access:"
        echo "     npm run localstack:restart"
        echo ""
        echo "  3. Check LocalStack logs:"
        echo "     npm run localstack:logs"
        echo ""
        echo "  4. If using Podman, ensure socket is running:"
        echo "     systemctl --user status podman.socket"
        echo ""
    elif echo "$DEPLOY_OUTPUT" | grep -q "failed state\|DELETE_FAILED\|ROLLBACK_COMPLETE"; then
        echo "🔧 Stack in Failed State:"
        echo ""
        echo "Run cleanup script:"
        echo "  ./scripts/cleanup-failed-stacks.sh"
        echo ""
    else
        echo "Common issues and solutions:"
        echo "  1. Stack in failed state:"
        echo "     ./scripts/cleanup-failed-stacks.sh"
        echo ""
        echo "  2. LocalStack not running:"
        echo "     npm run localstack:start"
        echo ""
        echo "  3. Docker/Podman not accessible:"
        echo "     Check LocalStack logs: npm run localstack:logs"
        echo ""
    fi
    
    echo "Full error output:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━Stack in failed state:"
        echo "     ./scripts/cleanup-failed-stacks.sh"
        echo ""
        echo "  2. LocalStack not running:"
        echo "     npm run localstack:start"
        echo ""
        echo "  3. Check the error messages above for specific issues"
        echo ""
    fi
    
    echo "Full error output:"
    echo "$DEPLOY_OUTPUT" | tail -50
    echo ""
    exit 1
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔗 LocalStack Services:"
echo "  Dashboard: http://localhost:4566"
echo "  DynamoDB: http://localhost:4566"
echo "  S3: http://localhost:4566"
echo "  API Gateway: http://localhost:4566"
echo ""

