# API Setup Guide

This guide explains how to connect your mobile app to the backend API.

## Quick Setup (Automated)

### 1. Deploy Backend (if not already deployed)

```bash
cd backend
npm run deploy:local
```

### 2. Run Setup Script (Recommended)

The easiest way to configure the API is using the automated setup script:

```bash
cd mobile
npm run setup:api
```

This script will:
- ✅ Check if LocalStack is running
- ✅ Get your API Gateway ID from the deployed stack
- ✅ Create a `.env` file with the correct API URL
- ✅ Backup any existing `.env` file

### 3. Start Your App

```bash
npm start
```

That's it! The app will automatically use the API URL from the `.env` file.

## Manual Setup

If you prefer to set it up manually:

### Option A: Environment Variable

Create a `.env` file in the `mobile` directory:

```bash
EXPO_PUBLIC_API_BASE_URL=https://<your-api-id>.execute-api.localhost.localstack.cloud:4566/v1
```

Get your API ID:
```bash
awslocal apigateway get-rest-apis --query 'items[0].id' --output text
```

### Option B: Update Config File

Edit `mobile/src/config/api.ts` and replace `<api-id>` with your actual API Gateway ID.

## API Response Format

The backend returns responses in this format:

```typescript
{
  success: boolean;
  data?: T;  // The actual data
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
```

### Registration Response

```json
{
  "success": true,
  "data": {
    "message": "Registration successful. You can now login.",
    "email": "user@example.com",
    "emailVerified": true
  }
}
```

### Login Response

```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "uuid",
      "email": "user@example.com",
      "username": "optional",
      ...
    },
    "tokens": {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token"
    }
  }
}
```

## Troubleshooting

### Setup Script Fails

If `npm run setup:api` fails:

1. **LocalStack not running:**
   ```bash
   cd backend && npm run localstack:start
   ```

2. **Backend not deployed:**
   ```bash
   cd backend && npm run deploy:local
   ```

3. **AWS CLI not found:**
   ```bash
   pip install awscli-local
   ```

### CORS Issues

If you see CORS errors, make sure:
1. Your origin is in the allowed list (check `backend/infrastructure/config/environment.ts`)
2. The API Gateway CORS is configured correctly

### Connection Refused

- Make sure LocalStack is running: `cd backend && npm run localstack:start`
- Verify the API URL is correct (check `.env` file)
- Check that the backend is deployed: `cd backend && npm run deploy:local`
- Re-run setup script: `npm run setup:api`

### Wrong API URL Format

The API URL should be in the format:
```
https://<api-id>.execute-api.localhost.localstack.cloud:4566/v1
```

NOT:
```
http://localhost:4566/restapis/<api-id>/v1
```

### After Redeploying Backend

If you redeploy and get a new API ID, just run the setup script again:
```bash
npm run setup:api
```

## Production Setup

For production, update the API URL in `mobile/src/config/api.ts`:

```typescript
if (__DEV__) {
  // Development
  return `https://${API_ID}.execute-api.localhost.localstack.cloud:4566/${STAGE}`;
} else {
  // Production - replace with your actual production API URL
  return 'https://api.yourdomain.com/v1';
}
```
