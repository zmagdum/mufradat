# 🚀 Developer Quick Start Guide

**Welcome to Mufradat!** This guide will get you up and running in minutes.

---

## 👥 Choose Your Path

- **[Mobile Developer](#-mobile-developer-guide)** - Working on React Native app
- **[Backend Developer](#-backend-developer-guide)** - Working on AWS infrastructure

---

## 📱 Mobile Developer Guide

### Prerequisites
- Node.js 18+
- npm 9+
- Expo Go app on your phone (from App Store/Google Play)

### Quick Start (5 minutes)

```bash
# 1. Install dependencies
cd mobile
npm install

# 2. Start development server
npm start

# 3. Scan QR code with Expo Go app
# Your app is now running! 🎉
```

### Project Structure
```
mobile/src/
├── screens/          # Your screens go here
│   ├── auth/         # Login, Register
│   ├── learning/     # Learning interface
│   └── dashboard/    # Progress dashboard
├── components/       # Reusable components
├── services/         # API calls
│   ├── api.ts       # Axios instance (JWT auto-refresh)
│   └── storage.ts   # Secure token storage
├── store/            # Redux state
└── navigation/       # React Navigation
```

### Key Files to Know

**API Configuration:**
```typescript
// mobile/src/services/api.ts
// Axios instance with automatic:
// - JWT token injection
// - Token refresh on 401
// - Error handling
```

**State Management:**
```typescript
// Use typed hooks
import { useAppDispatch, useAppSelector } from '../store/hooks';
```

**Authentication:**
```typescript
// Use AuthContext
import { useAuth } from '../contexts/AuthContext';

const { user, loginUser, logoutUser } = useAuth();
```

### Common Commands

```bash
# Development
npm start              # Start Metro bundler
npm run ios           # Run on iOS simulator
npm run android       # Run on Android emulator
npm run web           # Run in web browser

# Code Quality
npm run type-check    # TypeScript type checking
npm run lint          # ESLint
npm test              # Jest tests
```

### Connecting to Backend

**For LocalStack (default):**
```bash
# Create .env.local in mobile directory
EXPO_PUBLIC_API_BASE_URL=http://localhost:4566/restapis/<api-id>/local/_user_request_
```

**Get API ID from backend:**
```bash
cd ../backend
awslocal apigateway get-rest-apis
# Copy the "id" field
```

### Making API Calls

```typescript
import api from '../services/api';

// GET request
const words = await api.get('/vocabulary/words');

// POST request
const result = await api.post('/auth/login', {
  email: 'user@example.com',
  password: 'password123'
});

// Token automatically included in headers!
```

### Debugging

**React DevTools:**
```bash
# Shake device or:
# iOS: Cmd+D
# Android: Cmd+M
# Select "Debug Remote JS"
```

**View Logs:**
```bash
npm start
# All logs appear in terminal
```

**Clear Cache:**
```bash
npx expo start --clear
```

### Common Issues

**"Unable to resolve module":**
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

**API not responding:**
- Check backend is running: `curl http://localhost:4566/_localstack/health`
- Verify API URL in `.env.local`
- Check you're on same network (or use ngrok for testing)

### Need Help?
- Check: `mobile/EXPO_SETUP.md`
- Main docs: `README.md` (Mobile Development Guide section)

---

## 🔧 Backend Developer Guide

### Prerequisites
- Node.js 18+
- npm 9+
- Podman or Docker
- Python 3.8+ (for awscli-local)

### Quick Start (5 minutes)

```bash
# 1. Install Podman
# See PODMAN_SETUP.md for your OS

# 2. Install dependencies
cd backend
npm install

# 3. Install AWS tools
pip3 install awscli-local
npm install -g aws-cdk-local aws-cdk

# 4. Start LocalStack
npm run localstack:start

# 5. Deploy infrastructure
npm run deploy:local

# Done! Infrastructure is running locally 🎉
```

### Verify Deployment

```bash
# Check tables
awslocal dynamodb list-tables

# Check buckets
awslocal s3 ls

# Check API
awslocal apigateway get-rest-apis

# Test health endpoint
curl http://localhost:4566/restapis/<api-id>/local/_user_request_/health
```

### Project Structure

```
backend/
├── src/
│   ├── lambdas/           # Lambda functions
│   │   ├── auth/          # Authentication
│   │   ├── vocabulary/    # Word management
│   │   ├── progress/      # Learning progress
│   │   └── shared/        # Shared utilities
│   └── shared/            # Types, validators
├── infrastructure/        # AWS CDK code
│   ├── stacks/           # CDK stacks
│   ├── constructs/       # Reusable constructs
│   └── config/           # Environment config
└── scripts/              # Deployment scripts
```

### Key Files to Know

**Lambda Structure:**
```typescript
// backend/src/lambdas/myfeature/handler.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { success, failure } from '../shared/response-utils';
import { dynamoDBClient, TABLE_NAMES } from '../shared/dynamodb-client';

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  try {
    // Your logic here
    return success({ message: 'Success' });
  } catch (error) {
    console.error('Error:', error);
    return failure('Internal server error', 500);
  }
}
```

**DynamoDB Operations:**
```typescript
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDBClient, TABLE_NAMES } from '../shared/dynamodb-client';

// Get item
const result = await dynamoDBClient.send(new GetCommand({
  TableName: TABLE_NAMES.users,
  Key: { userId: 'user123' }
}));

// Put item
await dynamoDBClient.send(new PutCommand({
  TableName: TABLE_NAMES.users,
  Item: { userId: 'user123', email: 'user@example.com' }
}));
```

### Common Commands

```bash
# LocalStack Management
npm run localstack:start     # Start LocalStack
npm run localstack:stop      # Stop LocalStack
npm run localstack:logs      # View logs
npm run localstack:restart   # Restart
npm run localstack:clean     # Clean all data

# Deployment
npm run deploy:local         # Deploy to LocalStack
npm run deploy:dev          # Deploy to AWS Dev
npm run deploy:prod         # Deploy to AWS Prod

# CDK
npm run cdk:synth           # Synthesize
npm run cdk:diff            # Show changes
npm run cdk:deploy          # Deploy

# Development
npm run build               # Build TypeScript
npm run watch               # Watch mode
npm test                    # Run tests
```

### AWS CLI (LocalStack)

```bash
# DynamoDB
awslocal dynamodb list-tables
awslocal dynamodb scan --table-name mufradat-users-local
awslocal dynamodb put-item --table-name mufradat-users-local \
  --item '{"userId": {"S": "test123"}, "email": {"S": "test@example.com"}}'

# S3
awslocal s3 ls
awslocal s3 cp file.mp3 s3://mufradat-media-local/audio/
awslocal s3 ls s3://mufradat-media-local/

# API Gateway
awslocal apigateway get-rest-apis
awslocal apigateway get-resources --rest-api-id <api-id>

# Cognito
awslocal cognito-idp list-user-pools --max-results 10
```

### Testing Locally

**Unit Tests:**
```bash
npm test
npm test -- --watch
```

**Test API Endpoint:**
```bash
# Health check
curl http://localhost:4566/restapis/<api-id>/local/_user_request_/health

# With authentication
curl -H "Authorization: Bearer <token>" \
  http://localhost:4566/restapis/<api-id>/local/_user_request_/users/profile
```

### Adding a New Feature

**1. Create Lambda Function:**
```bash
# Create file: src/lambdas/myfeature/handler.ts
# (See template above)
```

**2. Add to Infrastructure:**
```typescript
// infrastructure/stacks/mufradat-stack.ts
const myFunction = new lambda.Function(this, 'MyFunction', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'handler.handler',
  code: lambda.Code.fromAsset('src/lambdas/myfeature'),
  environment: {
    TABLE_NAME: tables.usersTable.tableName,
  },
});

// Add API endpoint
const myResource = api.root.addResource('myfeature');
myResource.addMethod('GET', new apigateway.LambdaIntegration(myFunction));
```

**3. Deploy:**
```bash
npm run deploy:local
```

**4. Test:**
```bash
curl http://localhost:4566/restapis/<api-id>/local/_user_request_/myfeature
```

### Debugging

**View Lambda Logs:**
```bash
npm run localstack:logs | grep Lambda
```

**Check DynamoDB:**
```bash
awslocal dynamodb scan --table-name <table-name>
```

**Check S3:**
```bash
awslocal s3 ls s3://bucket-name/ --recursive
```

### Common Issues

**"Name is already in use" error:**
```bash
# Check if LocalStack is already running
podman ps | grep localstack

# If shows "Up" and "healthy", it's already running! ✅
# Verify: curl http://localhost:4566/_localstack/health

# To restart anyway:
npm run localstack:stop
npm run localstack:start
```

**LocalStack not starting:**
```bash
# Check Podman
systemctl --user status podman.socket

# Restart
npm run localstack:restart

# Check logs
npm run localstack:logs
```

**Deployment fails:**
```bash
# Clear cache
rm -rf cdk.out

# Bootstrap
npx cdklocal bootstrap aws://000000000000/us-east-1

# Try again
npm run deploy:local
```

**Lambda can't access DynamoDB:**
- Check IAM permissions in CDK stack
- Verify table name in environment variables
- Check LocalStack logs

### Need Help?
- Check: `backend/LOCALSTACK_SETUP.md`
- Check: `backend/PODMAN_SETUP.md`
- Check: `backend/QUICK_START.md`
- Main docs: `README.md` (Backend Development Guide section)

---

## 🔗 Working Together

### Mobile Developer needs Backend API:

**Backend:** Share API Gateway URL
```bash
awslocal apigateway get-rest-apis
# Share: http://localhost:4566/restapis/<api-id>/local/_user_request_
```

**Mobile:** Add to `.env.local`
```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:4566/restapis/<api-id>/local/_user_request_
```

### Testing Full Flow:

**Backend:**
```bash
npm run localstack:start
npm run deploy:local
awslocal apigateway get-rest-apis  # Get API ID
```

**Mobile:**
```bash
# Update .env.local with API URL
npm start
# Test authentication, API calls, etc.
```

---

## 📚 Full Documentation

- **[README.md](README.md)** - Complete documentation
- **[docs/design.md](docs/design.md)** - Architecture
- **[docs/requirements.md](docs/requirements.md)** - Requirements
- **[docs/tasks.md](docs/tasks.md)** - Implementation progress

---

## 🎯 Quick Tips

### For Mobile Developers:
✅ Always use typed hooks: `useAppDispatch`, `useAppSelector`  
✅ API client handles JWT automatically  
✅ Use `useAuth()` for authentication  
✅ Run `npm run type-check` before committing  
✅ Test on real device with Expo Go  

### For Backend Developers:
✅ Always use `awslocal` instead of `aws` for LocalStack  
✅ Check logs: `npm run localstack:logs`  
✅ DynamoDB tables need GSI for queries  
✅ Test Lambdas locally before deploying  
✅ Use `success()` and `failure()` response helpers  

---

## 🆘 Get Help

1. **Check this file first**
2. **Check README.md** (comprehensive guide)
3. **Check specific setup guides** (LOCALSTACK_SETUP.md, etc.)
4. **Check error fix docs** (BUILD_ISSUES_REPORT.md, etc.)

---

## ✅ Pre-Commit Checklist

### Mobile:
- [ ] `npm run type-check` passes
- [ ] `npm test` passes
- [ ] No console errors in Expo Go
- [ ] Tested on at least one device

### Backend:
- [ ] `npm run build` succeeds
- [ ] `npm test` passes
- [ ] `npm run deploy:local` succeeds
- [ ] API endpoints respond correctly

---

**Happy Coding! 🚀**

