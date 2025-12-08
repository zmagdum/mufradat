# Quick Start Guide

## 🚀 Get Started in 3 Steps

> **Note:** This project uses **Podman** (Docker-compatible). See `PODMAN_SETUP.md` if you need to install it.

### Step 1: Start LocalStack
```bash
cd backend
npm run localstack:start
```

### Step 2: Deploy Infrastructure
```bash
npm run deploy:local
```

### Step 3: Verify
```bash
# Check tables
awslocal dynamodb list-tables

# Check buckets
awslocal s3 ls

# Check API
awslocal apigateway get-rest-apis
```

That's it! Your local AWS infrastructure is running! 🎉

---

## 📋 Common Commands

### LocalStack Management
```bash
npm run localstack:start    # Start LocalStack
npm run localstack:stop     # Stop LocalStack
npm run localstack:logs     # View logs
npm run localstack:restart  # Restart LocalStack
npm run localstack:clean    # Clean all data
```

### Deployment
```bash
npm run deploy:local  # Deploy to LocalStack
npm run deploy:dev    # Deploy to AWS Dev
npm run deploy:prod   # Deploy to AWS Prod
```

### CDK Commands
```bash
npm run cdk:synth     # Synthesize CloudFormation
npm run cdk:diff      # Show differences
npm run cdk:deploy    # Deploy stack
npm run cdk:destroy   # Destroy stack
```

### AWS CLI (LocalStack)
```bash
awslocal dynamodb list-tables
awslocal s3 ls
awslocal cognito-idp list-user-pools --max-results 10
awslocal apigateway get-rest-apis
```

---

## 🔧 Configuration

### Change Environment

```bash
# Option 1: Environment variable
export STAGE=dev
npm run cdk:deploy

# Option 2: Use script (recommended)
npm run deploy:dev
```

### Environment Options
- `local` - LocalStack (default)
- `dev` - AWS Development
- `test` - AWS Testing
- `prod` - AWS Production

---

## 📊 What Gets Created

### DynamoDB Tables
- `mufradat-users-{stage}`
- `mufradat-vocabulary-{stage}`
- `mufradat-progress-{stage}`
- `mufradat-conjugations-{stage}`
- `mufradat-sessions-{stage}`

### S3 Buckets
- `mufradat-media-{stage}`

### Cognito
- User Pool: `mufradat-users-{stage}`
- Domain: `mufradat-{stage}.auth.{region}.amazoncognito.com`

### API Gateway
- REST API: `mufradat-api-{stage}`
- Stage: `v1`

---

## 🐛 Troubleshooting

### LocalStack not starting?
```bash
# Check Podman containers
podman ps

# Restart
npm run localstack:restart

# Check logs
npm run localstack:logs

# If using Docker instead:
# docker ps
```

### Deployment failed?
```bash
# Clear CDK cache
rm -rf cdk.out

# Bootstrap (first time only)
STAGE=local npx cdklocal bootstrap

# Try again
npm run deploy:local
```

### Can't access services?
```bash
# Check LocalStack health
curl http://localhost:4566/_localstack/health

# Verify endpoint
echo $AWS_ENDPOINT_URL
```

---

## 📖 More Information

- **Full LocalStack Guide:** See `LOCALSTACK_SETUP.md`
- **Task Completion:** See `TASK_3_COMPLETION.md`
- **Environment Config:** See `infrastructure/config/environment.ts`

---

## 🎯 Next Steps

1. ✅ Infrastructure deployed
2. 🔄 Configure mobile app with API endpoints
3. 🔄 Implement Lambda functions
4. 🔄 Test authentication flow

See `../tasks.md` for full task list!

