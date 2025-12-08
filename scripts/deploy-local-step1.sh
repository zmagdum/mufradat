#!/bin/bash

# Step 1: Deploy full infrastructure (including wiring all Lambdas) to LocalStack
# - Uses CloudFormation via CDK
# - Intended to be run infrequently (when infra or wiring changes)
# - Tables are created separately first to avoid ResourceInUseException

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

cd "$BACKEND_DIR"

ENDPOINT_URL="${AWS_ENDPOINT_URL:-http://localhost:4566}"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"

echo "🚀 Step 1: Full LocalStack deploy (infra + Lambda wiring)"
echo "Project root : $PROJECT_ROOT"
echo "Backend dir  : $BACKEND_DIR"
echo "Endpoint URL : $ENDPOINT_URL"
echo "Region       : $REGION"
echo ""

# Step 0: Create DynamoDB tables first (separate step to avoid conflicts)
echo "📋 Step 0: Creating DynamoDB tables first..."
if [ -f "$SCRIPT_DIR/create-tables-first.sh" ]; then
    bash "$SCRIPT_DIR/create-tables-first.sh"
    # Set environment variable to tell CDK to use existing tables
    export USE_EXISTING_TABLES=true
    echo "✅ Tables created - CDK will reference existing tables"
else
    echo "⚠️  create-tables-first.sh not found, skipping table creation"
    echo "   Tables will be created by CloudFormation (may fail if they exist)"
    export USE_EXISTING_TABLES=false
fi
echo ""

echo "🔍 Checking LocalStack health..."
if ! curl -s "$ENDPOINT_URL/_localstack/health" > /dev/null 2>&1; then
  echo "❌ LocalStack is not running at $ENDPOINT_URL"
  echo "   Start it first, e.g.:"
  echo "   cd backend && podman-compose up -d"
  exit 1
fi
echo "✅ LocalStack is running"
echo ""

export STAGE=local
export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-test}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-test}"
export AWS_DEFAULT_REGION="$REGION"
export AWS_ENDPOINT_URL="$ENDPOINT_URL"

# Detect AWS CLI command
AWS_CMD=""
if command -v awslocal >/dev/null 2>&1; then
    AWS_CMD="awslocal"
elif [ -f "venv/bin/awslocal" ]; then
    AWS_CMD="venv/bin/awslocal"
else
    AWS_CMD="aws --endpoint-url=$ENDPOINT_URL"
fi

# Ensure AWS_CMD is set
if [ -z "$AWS_CMD" ]; then
    echo "❌ ERROR: Could not find AWS CLI command (awslocal or aws)"
    exit 1
fi

echo "Using AWS command: $AWS_CMD"
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
            # Try to delete and capture any errors
            DELETE_OUTPUT=$($AWS_CMD dynamodb delete-table --table-name "$table" 2>&1)
            DELETE_EXIT=$?
            if [ $DELETE_EXIT -ne 0 ]; then
                if echo "$DELETE_OUTPUT" | grep -q "ResourceNotFoundException\|does not exist"; then
                    echo "     (Table already deleted)"
                else
                    echo "     ⚠️  Delete attempt failed: $DELETE_OUTPUT"
                fi
            else
                echo "     ✅ Delete initiated for $table"
            fi
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
    
    # One more final check right before deployment - CRITICAL CHECK
    echo "🔍 CRITICAL: Final pre-deployment check for conflicting tables..."
    FINAL_VERIFY=$($AWS_CMD dynamodb list-tables \
      --query 'TableNames[?contains(@, `mufradat`) && contains(@, `local`)]' \
      --output text 2>&1 || echo "")
    
    if [ -n "$FINAL_VERIFY" ] && [ "$FINAL_VERIFY" != "None" ]; then
        echo "❌ CRITICAL ERROR: Tables still exist right before deployment: $FINAL_VERIFY"
        echo ""
        echo "   Attempting emergency deletion..."
        for table in $FINAL_VERIFY; do
            echo "   🗑️  Emergency deleting: $table"
            $AWS_CMD dynamodb delete-table --table-name "$table" 2>&1 || true
        done
        
        echo "   Waiting 10 seconds for emergency deletion..."
        sleep 10
        
        # Check one more time
        EMERGENCY_CHECK=$($AWS_CMD dynamodb list-tables \
          --query 'TableNames[?contains(@, `mufradat`) && contains(@, `local`)]' \
          --output text 2>&1 || echo "")
        
        if [ -n "$EMERGENCY_CHECK" ] && [ "$EMERGENCY_CHECK" != "None" ]; then
            echo ""
            echo "❌ FATAL: Cannot proceed - tables still exist after emergency cleanup: $EMERGENCY_CHECK"
            echo ""
            echo "   Please manually delete the tables or restart LocalStack:"
            echo "   cd backend"
            echo "   npm run localstack:restart"
            echo ""
            echo "   Or manually delete:"
            for table in $EMERGENCY_CHECK; do
                echo "     awslocal dynamodb delete-table --table-name $table"
            done
            exit 1
        else
            echo "   ✅ Emergency cleanup successful"
        fi
    else
        echo "   ✅ No conflicting tables found - safe to deploy"
    fi
    echo ""
fi

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

echo "🔨 Building TypeScript and preparing Lambda bundle (backend)..."
npm run build:lambda
echo "✅ Build and bundle preparation complete"
echo ""

echo "🔨 Synthesizing CDK app..."
npm run cdk:synth
echo "✅ cdk synth complete"
echo ""

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
echo ""

STACK_NAME="MufradatStack-local"

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

# ONE MORE TIME: Force delete and verify table is actually gone
# This is critical - we must ensure tables are deleted before CloudFormation tries to create them
# Use describe-table for each known table name (more reliable than list-tables)
echo "🔍 LAST CHANCE: Force deleting any remaining tables and verifying deletion..."
if [ -n "$AWS_CMD" ]; then
    # Check for known table names using describe-table (more reliable)
    KNOWN_TABLES=(
        "mufradat-users-local"
        "mufradat-vocabulary-local"
        "mufradat-progress-local"
        "mufradat-conjugations-local"
        "mufradat-sessions-local"
        "mufradat-otp-local"
    )
    
    FOUND_TABLES=()
    for table_name in "${KNOWN_TABLES[@]}"; do
        TABLE_CHECK=$($AWS_CMD dynamodb describe-table --table-name "$table_name" 2>&1 || echo "NOT_FOUND")
        if ! echo "$TABLE_CHECK" | grep -q "ResourceNotFoundException\|does not exist\|NOT_FOUND"; then
            FOUND_TABLES+=("$table_name")
        fi
    done
    
    # Also check list-tables as backup
    LIST_CHECK=$($AWS_CMD dynamodb list-tables \
      --query 'TableNames[?contains(@, `mufradat`) && contains(@, `local`)]' \
      --output text 2>&1 || echo "")
    
    # Combine both checks
    if [ ${#FOUND_TABLES[@]} -gt 0 ] || ([ -n "$LIST_CHECK" ] && [ "$LIST_CHECK" != "None" ]); then
        # Merge arrays
        if [ -n "$LIST_CHECK" ] && [ "$LIST_CHECK" != "None" ]; then
            for table in $LIST_CHECK; do
                if [[ ! " ${FOUND_TABLES[@]} " =~ " ${table} " ]]; then
                    FOUND_TABLES+=("$table")
                fi
            done
        fi
        
        FORCE_CHECK=$(IFS=' '; echo "${FOUND_TABLES[*]}")
        echo "   ⚠️  Found tables: $FORCE_CHECK"
        for table in "${FOUND_TABLES[@]}"; do
            echo "   🗑️  Force deleting: $table"
            
            # Delete it
            $AWS_CMD dynamodb delete-table --table-name "$table" 2>&1 | grep -v "ResourceNotFoundException" || true
            
            # Wait and verify it's actually gone by checking describe-table (more reliable than list-tables)
            echo "      Waiting for deletion to complete (checking table status)..."
            DELETED=false
            for j in {1..30}; do
                CHECK_OUTPUT=$($AWS_CMD dynamodb describe-table --table-name "$table" 2>&1 || echo "NOT_FOUND")
                
                if echo "$CHECK_OUTPUT" | grep -q "ResourceNotFoundException\|does not exist\|NOT_FOUND"; then
                    echo "      ✅ Table $table confirmed deleted (attempt $j)"
                    DELETED=true
                    break
                fi
                
                # Extract status if table still exists
                TABLE_STATUS=$(echo "$CHECK_OUTPUT" | grep -oP '"TableStatus":\s*"\K[^"]+' || echo "UNKNOWN")
                if [ "$TABLE_STATUS" = "DELETING" ]; then
                    if [ $((j % 5)) -eq 0 ]; then
                        echo "      Still deleting... ($j/30) - Status: DELETING"
                    fi
                elif [ "$TABLE_STATUS" = "ACTIVE" ]; then
                    echo "      ⚠️  Table still ACTIVE after deletion attempt - retrying delete..."
                    $AWS_CMD dynamodb delete-table --table-name "$table" 2>&1 | grep -v "ResourceNotFoundException" || true
                fi
                
                sleep 2
            done
            
            if [ "$DELETED" = "false" ]; then
                echo "      ❌ Table $table still exists after 60 seconds"
                echo "      This indicates LocalStack persistence issues"
            fi
        done
        
        # Final verification - wait a bit more and check again
        echo "   Waiting 5 seconds for final cleanup..."
        sleep 5
        
        # Final verification using describe-table for each known table
        STILL_EXISTS=()
        for table_name in "${KNOWN_TABLES[@]}"; do
            FINAL_CHECK=$($AWS_CMD dynamodb describe-table --table-name "$table_name" 2>&1 || echo "NOT_FOUND")
            if ! echo "$FINAL_CHECK" | grep -q "ResourceNotFoundException\|does not exist\|NOT_FOUND"; then
                STILL_EXISTS+=("$table_name")
            fi
        done
        
        if [ ${#STILL_EXISTS[@]} -gt 0 ]; then
            echo ""
            echo "❌ CRITICAL: Tables persist after force deletion: ${STILL_EXISTS[*]}"
            echo ""
            echo "   LocalStack appears to be persisting these tables."
            echo "   This is a LocalStack persistence issue."
            echo ""
            echo "   SOLUTION: Restart LocalStack to clear persistent state:"
            echo "   cd backend && npm run localstack:restart"
            echo ""
            echo "   Then run this script again."
            echo ""
            exit 1
        else
            echo "   ✅ All tables confirmed deleted"
        fi
    else
        echo "   ✅ No tables found - safe to proceed"
    fi
    
    # ONE FINAL CHECK RIGHT BEFORE DEPLOYMENT - delete if exists
    echo "🔍 ABSOLUTE FINAL CHECK: Deleting mufradat-users-local if it exists..."
    $AWS_CMD dynamodb delete-table --table-name "mufradat-users-local" 2>&1 | grep -v "ResourceNotFoundException" || true
    sleep 3
    # Verify it's gone
    FINAL_VERIFY=$($AWS_CMD dynamodb describe-table --table-name "mufradat-users-local" 2>&1 || echo "NOT_FOUND")
    if echo "$FINAL_VERIFY" | grep -q "ResourceNotFoundException\|does not exist\|NOT_FOUND"; then
        echo "   ✅ mufradat-users-local confirmed deleted"
    else
        echo "   ⚠️  WARNING: mufradat-users-local still exists, but proceeding anyway"
        echo "   CloudFormation may fail - if so, restart LocalStack"
    fi
    echo ""
fi

echo "📤 Deploying CDK stack '$STACK_NAME' to LocalStack (full CloudFormation deploy via cdklocal)..."
npx cdklocal deploy "$STACK_NAME" --require-approval never
echo ""
echo "✅ Step 1 complete: infrastructure and Lambda wiring deployed."
echo ""


