#!/bin/bash

# Script to view Lambda function logs from LocalStack

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

FUNCTION_NAME="${1:-}"

cd "$BACKEND_DIR"

if [ -z "$FUNCTION_NAME" ]; then
    echo "Usage: $0 <function-name-pattern>"
    echo ""
    echo "Example: $0 Register"
    echo "Example: $0 Login"
    echo ""
    echo "Available functions:"
    awslocal lambda list-functions --query 'Functions[*].FunctionName' --output table 2>/dev/null || echo "Could not list functions"
    exit 1
fi

echo "🔍 Searching for Lambda functions matching: $FUNCTION_NAME"
echo ""

# Find matching function names
FUNCTIONS=$(awslocal lambda list-functions --query "Functions[?contains(FunctionName, '$FUNCTION_NAME')].FunctionName" --output text 2>/dev/null)

if [ -z "$FUNCTIONS" ]; then
    echo "❌ No functions found matching '$FUNCTION_NAME'"
    echo ""
    echo "Available functions:"
    awslocal lambda list-functions --query 'Functions[*].FunctionName' --output table 2>/dev/null
    exit 1
fi

echo "📋 Found functions:"
echo "$FUNCTIONS" | while read -r func; do
    echo "  - $func"
done
echo ""

# Try to get logs from CloudWatch
for func in $FUNCTIONS; do
    echo "═══════════════════════════════════════════════════════"
    echo "📜 Logs for: $func"
    echo "═══════════════════════════════════════════════════════"
    
    LOG_GROUP="/aws/lambda/$func"
    
    # Check if log group exists
    LOG_EXISTS=$(awslocal logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --query 'logGroups[0].logGroupName' --output text 2>/dev/null)
    
    if [ -n "$LOG_EXISTS" ] && [ "$LOG_EXISTS" != "None" ]; then
        echo "✅ Found log group: $LOG_EXISTS"
        echo ""
        echo "Recent logs:"
        awslocal logs tail "$LOG_GROUP" --follow=false 2>/dev/null | tail -50 || echo "No logs found"
    else
        echo "⚠️  Log group not found: $LOG_GROUP"
        echo "   LocalStack may not create CloudWatch log groups automatically."
        echo ""
        echo "📋 Checking LocalStack container logs for this function..."
        echo ""
        
        # Extract a search pattern from function name (remove prefixes)
        SEARCH_PATTERN=$(echo "$func" | sed 's/.*-\([A-Z][a-zA-Z]*\)Function.*/\1/' | tr '[:upper:]' '[:lower:]')
        
        if [ -n "$SEARCH_PATTERN" ]; then
            echo "   Searching container logs for: $SEARCH_PATTERN"
            echo ""
            # Search for Lambda execution logs, errors, and function invocations
            CONTAINER_LOGS=$(podman-compose logs --tail=1000 localstack 2>&1 | grep -i "$SEARCH_PATTERN\|$func" | grep -v "DEBUG.*version_manager\|DEBUG.*event_manager\|DEBUG.*lambda_models\|DEBUG.*change_set_model\|DEBUG.*router\|DEBUG.*docker\|DEBUG.*run" | tail -50)
            
            if [ -n "$CONTAINER_LOGS" ]; then
                echo "$CONTAINER_LOGS"
            else
                echo "   No recent execution logs found in container."
                echo "   The Lambda may not have produced output or errors."
            fi
        else
            echo "   Showing recent Lambda-related logs:"
            echo ""
            podman-compose logs --tail=500 localstack 2>&1 | grep -i "lambda\|$func" | grep -v "DEBUG.*version_manager\|DEBUG.*event_manager" | tail -30 || echo "   No recent logs found"
        fi
        
        echo ""
        echo "💡 Tips for viewing Lambda logs:"
        echo ""
        echo "   1. View real-time container logs:"
        echo "      cd backend && podman-compose logs -f localstack | grep -i '$SEARCH_PATTERN'"
        echo ""
        echo "   2. Check if Lambda was invoked:"
        echo "      awslocal logs describe-log-groups --query 'logGroups[*].logGroupName' --output table"
        echo ""
        echo "   3. Invoke Lambda directly to generate logs:"
        echo "      awslocal lambda invoke --function-name $func --payload '{}' /tmp/response.json"
        echo ""
        echo "   4. LocalStack Lambda logs are typically in container logs, not CloudWatch."
        echo "      Enable DEBUG logging for more details:"
        echo "      Set DEBUG=1 in docker-compose.yml (already enabled)"
    fi
    echo ""
done

