#!/bin/bash

# Helper script to extract OTP from LocalStack logs

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

EMAIL="${1:-}"

cd "$BACKEND_DIR"

if [ -z "$EMAIL" ]; then
    echo "Usage: $0 <email>"
    echo ""
    echo "Example: $0 test@example.com"
    echo ""
    echo "Or to see all recent OTPs:"
    echo "  cd backend && podman-compose logs localstack | grep -B 2 -A 2 'OTP Code:'"
    exit 1
fi

echo "🔍 Searching for OTP for email: $EMAIL"
echo ""

# Search for OTP in logs
OTP=$(podman-compose logs localstack 2>&1 | grep -A 5 "OTP CODE FOR EMAIL VERIFICATION" | grep -A 5 "$EMAIL" | grep "OTP Code:" | tail -1 | sed 's/.*OTP Code: //' | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')

if [ -n "$OTP" ] && [ ${#OTP} -eq 6 ]; then
    echo "✅ Found OTP: $OTP"
    echo ""
    echo "To use this OTP, run:"
    echo "  curl -X POST http://localhost:4566/restapis/\$(cd backend && awslocal apigateway get-rest-apis --query 'items[0].id' --output text)/v1/auth/verify-email \\"
    echo "    -H 'Content-Type: application/json' \\"
    echo "    -H 'Origin: http://localhost:19006' \\"
    echo "    -d '{\"email\": \"$EMAIL\", \"otp\": \"$OTP\"}'"
else
    echo "❌ Could not find OTP for $EMAIL"
    echo ""
    echo "Recent OTP logs:"
    podman-compose logs localstack 2>&1 | grep -B 2 -A 2 "OTP CODE FOR EMAIL VERIFICATION" | tail -20
fi

