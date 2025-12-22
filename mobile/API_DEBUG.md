# API Gateway Debugging Guide

## Problem: "API does not correspond to a deployed API Gateway API"

This error occurs when the API Gateway URL format doesn't match LocalStack's expected format.

## Quick Fix

### Step 1: Run the debug script
```bash
cd backend
./scripts/debug-api-gateway.sh
```

This will show you:
- Your API Gateway ID
- Current deployments and stages
- The correct URL format to use

### Step 2: Fix the deployment (if needed)
```bash
cd backend
./scripts/fix-api-gateway-deployment.sh
```

### Step 3: Update mobile app .env file

**Option A: Use the setup script (recommended)**
```bash
cd mobile
npm run setup:api
```

**Option B: Manual setup**
1. Get your API ID:
   ```bash
   awslocal apigateway get-rest-apis --query 'items[0].id' --output text
   ```

2. Create/update `mobile/.env` file:
   ```bash
   EXPO_PUBLIC_API_BASE_URL=http://localhost:4566/restapis/YOUR_API_ID/v1/_user_request_
   ```

3. Restart Expo:
   ```bash
   npm start -- --clear
   ```

## URL Formats

### ✅ Correct (LocalStack Native Format)
```
http://localhost:4566/restapis/{api-id}/{stage}/_user_request_
```

Example:
```
http://localhost:4566/restapis/abc123def/v1/_user_request_
```

### ❌ Incorrect (Execute-API Format - may not work)
```
https://{api-id}.execute-api.localhost.localstack.cloud:4566/{stage}
```

## Testing the API

Test if your API is accessible:
```bash
# Replace YOUR_API_ID and v1 with your actual values
curl http://localhost:4566/restapis/YOUR_API_ID/v1/_user_request_/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "..."
}
```

## Common Issues

### Issue 1: API Gateway exists but no stage
**Solution:** Run `./scripts/fix-api-gateway-deployment.sh`

### Issue 2: Wrong URL format
**Solution:** Use LocalStack native format: `http://localhost:4566/restapis/{id}/{stage}/_user_request_`

### Issue 3: API not deployed
**Solution:** Redeploy infrastructure:
```bash
cd backend
npm run deploy:local
```

### Issue 4: .env file not loaded
**Solution:** 
1. Make sure `.env` file is in `mobile/` directory
2. Restart Expo with `npm start -- --clear`
3. Check console logs for environment variable values

## Verification Steps

1. **Check API Gateway exists:**
   ```bash
   awslocal apigateway get-rest-apis
   ```

2. **Check stages:**
   ```bash
   awslocal apigateway get-stages --rest-api-id YOUR_API_ID
   ```

3. **Check resources:**
   ```bash
   awslocal apigateway get-resources --rest-api-id YOUR_API_ID
   ```

4. **Test endpoint:**
   ```bash
   curl http://localhost:4566/restapis/YOUR_API_ID/v1/_user_request_/health
   ```

5. **Check mobile app logs:**
   - Look for "🔗 API Base URL:" in console
   - Should show: `http://localhost:4566/restapis/...`

## Still Having Issues?

1. Check LocalStack logs:
   ```bash
   cd backend
   docker-compose logs localstack
   ```

2. Verify LocalStack is running:
   ```bash
   curl http://localhost:4566/_localstack/health
   ```

3. Check CloudFormation stack:
   ```bash
   awslocal cloudformation describe-stacks --stack-name mufradat-local
   ```

