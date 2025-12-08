# Mufradat - Quranic Vocabulary Learning App

A comprehensive cross-platform mobile application for learning Quranic vocabulary through multi-modal learning approaches, adaptive algorithms, and spaced repetition techniques.

---

## 📑 Table of Contents

- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Mobile Development Guide](#mobile-development-guide)
- [Backend Development Guide](#backend-development-guide)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)

---

## 📁 Project Structure

```
mufradat/
├── mobile/                 # React Native mobile application (Expo)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── common/     # Common UI components
│   │   │   ├── learning/   # Learning-specific components
│   │   │   └── dashboard/  # Dashboard components
│   │   ├── screens/        # Screen components
│   │   │   ├── auth/       # Authentication screens
│   │   │   ├── learning/   # Learning screens
│   │   │   └── dashboard/  # Dashboard screens
│   │   ├── navigation/     # Navigation configuration
│   │   ├── services/       # API and service layer
│   │   │   ├── api.ts      # Axios instance with interceptors
│   │   │   ├── storage.ts  # Secure storage utilities
│   │   │   ├── offline-storage.ts  # SQLite offline storage
│   │   │   └── sync-service.ts     # Data synchronization
│   │   ├── store/          # Redux store and slices
│   │   │   ├── index.ts    # Store configuration
│   │   │   ├── hooks.ts    # Typed Redux hooks
│   │   │   └── slices/     # Redux slices
│   │   ├── contexts/       # React contexts
│   │   ├── utils/          # Utility functions
│   │   ├── types/          # TypeScript type definitions
│   │   └── assets/         # Images, audio files
│   ├── __tests__/          # Test files
│   ├── app.json            # Expo configuration
│   └── package.json
│
├── backend/                # AWS serverless backend
│   ├── src/
│   │   ├── lambdas/        # Lambda function handlers
│   │   │   ├── auth/       # Authentication functions
│   │   │   ├── users/      # User management
│   │   │   ├── vocabulary/ # Vocabulary operations
│   │   │   ├── conjugations/ # Verb conjugation
│   │   │   ├── progress/   # Learning progress
│   │   │   ├── learning/   # Learning algorithms
│   │   │   ├── recommendations/ # Recommendations
│   │   │   └── shared/     # Shared utilities
│   │   └── shared/         # Backend shared types/validators
│   ├── infrastructure/     # AWS CDK infrastructure code
│   │   ├── app.ts          # CDK app entry point
│   │   ├── stacks/         # CDK stacks
│   │   ├── constructs/     # Reusable CDK constructs
│   │   └── config/         # Environment configuration
│   ├── scripts/            # Deployment scripts
│   ├── test/               # Backend tests
│   ├── docker-compose.yml  # LocalStack configuration
│   └── package.json
│
├── shared/                 # Shared code between mobile and backend
│   ├── types/              # Shared TypeScript types
│   ├── constants/          # Shared constants
│   ├── validators/         # Shared validation functions
│   └── transformers/       # Data transformation utilities
│
└── docs/                   # Project documentation
    ├── design.md           # Architecture and design
    ├── requirements.md     # Functional requirements
    └── tasks.md            # Implementation progress

```

---

## 🛠️ Technology Stack

### Mobile (Frontend)
- **Expo SDK 50** - React Native framework with managed workflow
- **React Native 0.73** with TypeScript
- **Redux Toolkit** - State management
- **React Navigation** - Routing and navigation
- **Expo Secure Store** - Secure token storage
- **Expo AV** - Audio playback
- **Expo Notifications** - Push notifications
- **Expo SQLite** - Offline data storage (v13+)
- **Axios** - HTTP client with interceptors
- **AsyncStorage** - Non-sensitive data storage

### Backend
- **AWS Lambda** - Serverless compute (Node.js 18/TypeScript)
- **AWS API Gateway** - REST API endpoints
- **AWS Cognito** - User authentication
- **Amazon DynamoDB** - NoSQL database
- **Amazon S3** - Media file storage
- **Amazon ElastiCache (Redis)** - Caching layer
- **Amazon SQS** - Message queuing
- **AWS CDK** - Infrastructure as Code
- **LocalStack** - Local AWS cloud stack for development

### Development Tools
- **TypeScript 5.3+** - Type safety
- **Jest** - Unit testing
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Podman/Docker** - Containerization for LocalStack

---

## ✅ Prerequisites

### General
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**

### For Mobile Development
- **Expo CLI**: `npm install -g expo-cli` (optional, can use npx)
- **Expo Go** app on your iOS/Android device
- **Optional**: 
  - Xcode (for iOS simulator on Mac)
  - Android Studio (for Android emulator)

### For Backend Development
- **Podman** or **Docker** (for LocalStack)
- **AWS CLI** (for deployment to AWS)
- **Python 3.8+** (for awscli-local)

---

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone repository
git clone <repository-url>
cd mufradat

# Install root dependencies
npm install

# Install mobile dependencies
cd mobile
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Start LocalStack (Backend)

```bash
cd backend
npm run localstack:start
# Wait for LocalStack to be ready (~30 seconds)
```

### 3. Deploy to LocalStack

```bash
# Still in backend directory
npm run deploy:local
```

### 4. Start Mobile App

```bash
cd mobile
npm start
# Scan QR code with Expo Go app
```

---

## 📱 Mobile Development Guide

### Initial Setup

#### 1. Install Dependencies

```bash
cd mobile
npm install
```

#### 2. Configure API Endpoint

Create or update `.env.local`:

```bash
# For LocalStack backend
EXPO_PUBLIC_API_BASE_URL=http://localhost:4566/restapis/<api-id>/local/_user_request_

# For production
EXPO_PUBLIC_API_BASE_URL=https://your-api-gateway-url.amazonaws.com/prod
```

**Note:** API ID will be displayed after deploying to LocalStack.

#### 3. Start Development Server

```bash
npm start
```

This will:
- Start Expo Metro bundler
- Display QR code
- Open Expo Dev Tools in browser

### Running the App

#### Option 1: Expo Go (Easiest)
```bash
npm start
# Scan QR code with Expo Go app on your phone
```

#### Option 2: iOS Simulator (Mac only)
```bash
npm run ios
```

#### Option 3: Android Emulator
```bash
npm run android
```

#### Option 4: Web Browser (Best for Debugging)
```bash
# Method 1: Direct command
npm run web

# Method 2: Press 'w' after starting
npm start
# Then press 'w' in terminal

# Opens at: http://localhost:19006
```

**Web Browser Advantages:**
- ✅ **Chrome DevTools** - Full debugging with F12
- ✅ **Console logs** - See all console.log() output
- ✅ **Network inspector** - Monitor API calls to LocalStack
- ✅ **React DevTools** - Inspect component tree
- ✅ **Redux DevTools** - Monitor state and actions
- ✅ **Hot reload** - Automatic refresh on code changes
- ✅ **No device needed** - Test immediately

**Access URLs:**
- App: `http://localhost:19006`
- DevTools: `http://localhost:19000` (Expo dashboard)

### Mobile Development Workflow

#### File Structure
```
mobile/src/
├── screens/          # Add new screens here
├── components/       # Add reusable components
├── services/         # API calls and services
├── store/            # Redux state management
├── navigation/       # Navigation configuration
└── types/            # TypeScript types
```

#### Making API Calls

```typescript
// Use the configured API client
import api from '../services/api';

// API client has automatic:
// - JWT token injection
// - Token refresh on 401
// - Error handling

const response = await api.get('/vocabulary/words');
```

#### State Management

```typescript
// Use typed Redux hooks
import { useAppDispatch, useAppSelector } from '../store/hooks';

const dispatch = useAppDispatch();
const user = useAppSelector((state) => state.auth.user);
```

### Debugging Mobile App

#### Enable Remote Debugging

1. Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android)
2. Select "Debug Remote JS"
3. Open Chrome DevTools at `http://localhost:19000/debugger-ui`

#### React Native Debugger

```bash
# Install React Native Debugger
brew install --cask react-native-debugger

# Start debugger before running app
open "rndebugger://set-debugger-loc?host=localhost&port=19000"
```

#### View Logs

```bash
# View all logs in terminal
npm start

# Web browser console
# Open app in browser: npm run web
# Press F12 → Console tab

# iOS logs
npx react-native log-ios

# Android logs
npx react-native log-android
```

#### Debugging in Web Browser

**1. Open DevTools:**
```bash
npm run web
# Press F12 in browser
```

**2. Debug Network Requests:**
- Open Network tab
- See API calls to LocalStack (localhost:4566)
- Check request/response data
- Verify JWT tokens

**3. Debug State:**
```bash
# Install Redux DevTools extension
# Chrome: https://chrome.google.com/webstore/detail/redux-devtools

# Install React DevTools extension  
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools
```

**4. Test Responsive Design:**
```bash
# In DevTools (F12):
# - Click device toolbar icon (or Ctrl+Shift+M)
# - Select device (iPhone 12, Pixel 5, etc.)
# - Test portrait and landscape
```

#### Type Checking

```bash
# Run TypeScript type checker
npm run type-check

# Watch mode
npm run type-check -- --watch
```

### Common Mobile Issues

#### Issue: "Unable to resolve module"
```bash
# Clear cache and restart
rm -rf node_modules
npm install
npx expo start --clear
```

#### Issue: API calls not working
- Check `EXPO_PUBLIC_API_BASE_URL` in `.env.local`
- Ensure LocalStack is running: `curl http://localhost:4566/_localstack/health`
- Check network permissions in app.json

#### Issue: Offline storage errors
**Note:** Offline storage is currently stubbed due to SQLite v13 API changes. It returns resolved promises with warnings. To re-enable:
- Rewrite `src/services/offline-storage.ts` using new async/await SQLite API
- See `expo-sqlite` v13 documentation

### Building Mobile App

#### Development Build
```bash
# Create development build
eas build --profile development --platform ios
eas build --profile development --platform android
```

#### Production Build
```bash
# iOS
eas build --profile production --platform ios

# Android
eas build --profile production --platform android
```

---

## 🔧 Backend Development Guide

### Initial Setup

#### 1. Install Podman (Recommended) or Docker

**Linux (Fedora/RHEL/CentOS):**
```bash
sudo dnf install podman
pip3 install podman-compose

# Enable Podman socket
systemctl --user enable --now podman.socket
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get update
sudo apt-get install podman
pip3 install podman-compose

# Enable Podman socket
systemctl --user enable --now podman.socket
```

**macOS:**
```bash
brew install podman
podman machine init
podman machine start
pip3 install podman-compose
```

**Verify Installation:**
```bash
podman --version
podman-compose --version
```

#### 2. Install LocalStack Tools

```bash
# Install awscli-local (wrapper for AWS CLI)
pip3 install awscli-local

# Install cdklocal (wrapper for AWS CDK)
npm install -g aws-cdk-local aws-cdk
```

#### 3. Install Backend Dependencies

```bash
cd backend
npm install
```

### Starting LocalStack

```bash
cd backend

# Start LocalStack
npm run localstack:start

# Verify it's running
curl http://localhost:4566/_localstack/health

# View logs
npm run localstack:logs

# Stop LocalStack
npm run localstack:stop

# Clean up (removes all data)
npm run localstack:clean
```

**LocalStack Services Available:**
- API Gateway: `http://localhost:4566`
- DynamoDB: `http://localhost:4566`
- S3: `http://localhost:4566`
- Cognito: `http://localhost:4566`
- Lambda: Local execution
- CloudWatch: `http://localhost:4566`

### Deploying to LocalStack

```bash
cd backend

# Full deployment
npm run deploy:local

# This will:
# 1. Build TypeScript code
# 2. Synthesize CDK stacks
# 3. Deploy to LocalStack
# 4. Create DynamoDB tables
# 5. Create S3 buckets
# 6. Set up API Gateway
```

**After Deployment:**
```bash
# Verify resources
awslocal dynamodb list-tables
awslocal s3 ls
awslocal apigateway get-rest-apis
awslocal cognito-idp list-user-pools --max-results 10

# Get API Gateway URL
awslocal apigateway get-rest-apis
# Note the API ID for mobile app configuration
```

### Backend Development Workflow

#### File Structure
```
backend/
├── src/
│   ├── lambdas/
│   │   ├── auth/              # Add authentication functions
│   │   ├── vocabulary/        # Add vocabulary operations
│   │   └── shared/            # Shared utilities
│   └── shared/                # Backend-specific types
├── infrastructure/
│   ├── constructs/            # Reusable infrastructure
│   └── stacks/                # CDK stacks
└── scripts/                   # Deployment scripts
```

#### Adding a New Lambda Function

1. **Create Lambda Handler:**
```typescript
// backend/src/lambdas/myfeature/my-function.ts
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { success, failure } from '../shared/response-utils';

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

2. **Add to CDK Stack:**
```typescript
// backend/infrastructure/stacks/lambda-functions.ts
const myFunction = new lambda.Function(this, 'MyFunction', {
  runtime: lambda.Runtime.NODEJS_18_X,
  handler: 'my-function.handler',
  code: lambda.Code.fromAsset('src/lambdas/myfeature'),
  environment: {
    TABLE_NAME: dynamoTable.tableName,
  },
});
```

3. **Add API Endpoint:**
```typescript
// backend/infrastructure/constructs/api-gateway.ts
const myResource = this.api.root.addResource('myfeature');
myResource.addMethod('GET', new apigateway.LambdaIntegration(myFunction));
```

4. **Redeploy:**
```bash
npm run deploy:local
```

### Testing Backend Locally

#### Unit Tests
```bash
cd backend
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

#### Integration Tests
```bash
# Make sure LocalStack is running
npm run localstack:start

# Run integration tests
npm run test:integration
```

#### Manual API Testing

```bash
# Using curl
curl -X GET http://localhost:4566/restapis/<api-id>/local/_user_request_/health

# Using awslocal
awslocal apigateway get-rest-apis

# Test DynamoDB
awslocal dynamodb scan --table-name mufradat-users-local
```

### Debugging Backend

#### View Lambda Logs
```bash
# LocalStack logs include Lambda execution logs
npm run localstack:logs

# Filter for specific function
npm run localstack:logs | grep "Lambda"
```

#### Debug TypeScript

Add to `tsconfig.json`:
```json
{
  "compilerOptions": {
    "sourceMap": true
  }
}
```

Run with debugger:
```bash
# Use VSCode debugger with launch configuration
node --inspect-brk -r ts-node/register src/lambdas/auth/login.ts
```

#### Check Environment Variables
```bash
# View all environment variables passed to Lambdas
awslocal lambda get-function --function-name <function-name>
```

### Common Backend Issues

#### Issue: LocalStack not starting
```bash
# Check if Podman socket is running
ls -l /run/user/$(id -u)/podman/podman.sock

# Restart socket
systemctl --user restart podman.socket

# Check logs
npm run localstack:logs
```

#### Issue: CDK deployment fails
```bash
# Bootstrap CDK
npx cdklocal bootstrap aws://000000000000/us-east-1

# Clear cdk.out and retry
rm -rf cdk.out
npm run deploy:local
```

#### Issue: Lambda can't access DynamoDB
- Check Lambda IAM permissions in CDK stack
- Verify table name environment variable
- Check LocalStack logs for errors

#### Issue: TypeScript build errors
```bash
# Clean build
rm -rf dist
npm run build

# Check for type errors
npm run type-check
```

### Building for Production

```bash
# Build TypeScript
npm run build

# Run CDK diff to see changes
npm run cdk:diff

# Deploy to dev environment
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

---

## 🧪 Testing

### Mobile Tests

```bash
cd mobile

# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Specific test file
npm test -- src/__tests__/components/AudioPlayer.test.tsx
```

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Unit tests only
npm test -- --testPathPattern=unit

# Integration tests (requires LocalStack)
npm run localstack:start
npm test -- --testPathPattern=integration
```

### End-to-End Tests

```bash
# Start both mobile and backend
cd backend && npm run localstack:start
cd mobile && npm start

# Run E2E tests (configure first)
npm run test:e2e
```

---

## 🔍 Troubleshooting

### Mobile Issues

**Metro bundler issues:**
```bash
cd mobile
npx expo start --clear
rm -rf .expo
rm -rf node_modules && npm install
```

**iOS build issues:**
```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

**Android build issues:**
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Backend Issues

**LocalStack issues:**
```bash
# If you get "name is already in use" error:
podman ps -a | grep localstack  # Check if already running
# If it shows "Up" and "healthy", LocalStack is already running!
# Just verify: curl http://localhost:4566/_localstack/health

# To restart:
npm run localstack:stop
npm run localstack:start

# Full reset (if needed):
npm run localstack:stop
npm run localstack:clean
podman system prune -af
npm run localstack:start
```

**Lambda timeout:**
- Increase timeout in CDK stack
- Check CloudWatch logs
- Optimize function code

**DynamoDB issues:**
```bash
# List tables
awslocal dynamodb list-tables

# Describe table
awslocal dynamodb describe-table --table-name mufradat-users-local

# Scan table
awslocal dynamodb scan --table-name mufradat-users-local
```

### General Issues

**Port conflicts:**
```bash
# Check what's using port 4566
lsof -i :4566

# Kill process
kill -9 <PID>
```

**Environment variables not loading:**
- Check `.env.local` exists
- Restart development server
- Verify `EXPO_PUBLIC_` prefix for Expo

**Type errors:**
```bash
# Mobile
cd mobile && npm run type-check

# Backend
cd backend && npm run build
```

---

## 📚 Documentation

### Project Documentation
- **[docs/design.md](docs/design.md)** - Architecture and design decisions
- **[docs/requirements.md](docs/requirements.md)** - Functional and non-functional requirements
- **[docs/tasks.md](docs/tasks.md)** - Implementation tasks and progress

### Setup Documentation
- **[backend/LOCALSTACK_SETUP.md](backend/LOCALSTACK_SETUP.md)** - Detailed LocalStack setup
- **[backend/PODMAN_SETUP.md](backend/PODMAN_SETUP.md)** - Podman installation and configuration
- **[backend/QUICK_START.md](backend/QUICK_START.md)** - Quick start guide for backend
- **[mobile/EXPO_SETUP.md](mobile/EXPO_SETUP.md)** - Expo setup and configuration

### Fix Documentation
- **BUILD_ISSUES_REPORT.md** - Comprehensive build issue analysis
- **PHASE_1_FIXES_COMPLETE.md** - Phase 1 fix details
- **ALL_ERRORS_FIXED.md** - Mobile error fix summary
- **FINAL_ERROR_FIX_SUMMARY.md** - Complete fix mission report

### API Documentation

**LocalStack Endpoints:**
- Health Check: `http://localhost:4566/_localstack/health`
- API Gateway: `http://localhost:4566/restapis/<api-id>/local/_user_request_/`
- DynamoDB: Use `awslocal dynamodb` commands
- S3: Use `awslocal s3` commands

**Common AWS CLI Commands (LocalStack):**
```bash
# DynamoDB
awslocal dynamodb list-tables
awslocal dynamodb scan --table-name <table-name>

# S3
awslocal s3 ls
awslocal s3 mb s3://my-bucket
awslocal s3 cp file.txt s3://my-bucket/

# API Gateway
awslocal apigateway get-rest-apis
awslocal apigateway get-resources --rest-api-id <api-id>

# Lambda
awslocal lambda list-functions
awslocal lambda invoke --function-name <name> output.json
```

---

## 🎯 Features

- ✅ Multi-modal vocabulary learning (visual, audio, contextual, associative)
- ✅ Adaptive spaced repetition system (SM-2 algorithm)
- ✅ Verb conjugation training with Arabic grammar
- ✅ Personalized learning adaptation
- ✅ Cross-platform support (iOS & Android)
- ⚠️ Offline functionality (temporarily disabled - needs SQLite v13 migration)
- ✅ Progress tracking and analytics
- ✅ Smart notification system
- ✅ JWT authentication with automatic token refresh
- ✅ Redis caching for performance
- ✅ Media content management (S3)
- ✅ Real-time progress synchronization

---

## 📊 Project Status

### ✅ Completed (Tasks 1-16)
- Project structure and development environment
- Core data models and interfaces
- AWS infrastructure foundation (deployed to LocalStack)
- Authentication system (backend + mobile)
- Content management system
- Spaced repetition algorithm
- Progress tracking system
- Adaptive learning recommendations
- Multi-modal learning components
- Conjugation training module
- Offline functionality (stubbed)
- Progress dashboard and analytics
- Notification and reminder system
- Caching and performance optimization
- Security and error handling
- Monitoring infrastructure

### 🟡 In Progress
- CI/CD pipeline setup
- Offline storage migration to SQLite v13
- Backend type definition improvements
- Production deployment testing

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run linting: `npm run lint`
6. Commit changes: `git commit -am 'Add my feature'`
7. Push to branch: `git push origin feature/my-feature`
8. Submit a Pull Request

### Code Style

- Follow TypeScript best practices
- Use ESLint and Prettier configurations
- Write unit tests for new features
- Update documentation as needed

---

## 📄 License

[Add your license here]

---

## 📧 Contact

[Add contact information here]

---

## 🙏 Acknowledgments

- Expo team for the excellent React Native framework
- AWS for serverless infrastructure
- LocalStack for local AWS development
- Open source community

---

**Last Updated:** November 16, 2025  
**Version:** 1.0.0  
**Status:** ✅ Mobile Ready | 🟡 Backend Functional
