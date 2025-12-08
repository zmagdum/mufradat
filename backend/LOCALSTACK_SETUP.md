# LocalStack Setup Guide

## What is LocalStack?

LocalStack is a fully functional local AWS cloud stack that allows you to develop and test AWS applications offline, without connecting to actual AWS services. This saves costs and speeds up development.

## Prerequisites

- **Podman** installed and running (or Docker if you prefer)
- Node.js >= 18.0.0
- npm >= 9.0.0
- AWS CLI installed
- Python >= 3.8 (for awscli-local)

> **Note:** This project is configured for **Podman** (Docker-compatible, more secure). See `PODMAN_SETUP.md` for Podman installation guide.

## Installation

### 1. Install LocalStack CLI Tools

```bash
# Install awscli-local (wrapper for AWS CLI)
pip install awscli-local

# Install cdklocal (wrapper for AWS CDK)
npm install -g aws-cdk-local aws-cdk
```

### 2. Start LocalStack

```bash
cd backend
npm run localstack:start

# Or manually:
podman-compose up -d

# If you're using Docker instead:
# docker-compose up -d
```

This will start LocalStack with the following services:
- S3
- DynamoDB
- API Gateway
- Cognito
- CloudWatch
- IAM
- STS

### 3. Verify LocalStack is Running

```bash
# Check LocalStack health
curl http://localhost:4566/_localstack/health

# Should return:
# {"services": {...all services "available"...}}
```

## Usage

### Deploy Infrastructure to LocalStack

```bash
cd backend

# Method 1: Use the deployment script (recommended)
./scripts/deploy-local.sh

# Method 2: Manual deployment
export STAGE=local
npx cdklocal deploy --all
```

### Access LocalStack Services

All AWS services are available at: `http://localhost:4566`

#### DynamoDB Local

```bash
# List tables
awslocal dynamodb list-tables

# Scan a table
awslocal dynamodb scan --table-name mufradat-users-local

# Get item
awslocal dynamodb get-item \
  --table-name mufradat-users-local \
  --key '{"userId": {"S": "user123"}}'
```

#### S3 Local

```bash
# List buckets
awslocal s3 ls

# Create bucket (if not auto-created)
awslocal s3 mb s3://mufradat-media-local

# Upload file
awslocal s3 cp file.mp3 s3://mufradat-media-local/audio/

# List objects
awslocal s3 ls s3://mufradat-media-local/
```

#### Cognito Local

```bash
# List user pools
awslocal cognito-idp list-user-pools --max-results 10

# Create user
awslocal cognito-idp admin-create-user \
  --user-pool-id <pool-id> \
  --username testuser@example.com
```

#### API Gateway Local

```bash
# List APIs
awslocal apigateway get-rest-apis

# Test endpoint
curl http://localhost:4566/restapis/<api-id>/<stage>/health
```

### Environment Variables

For local development, use these environment variables:

```bash
export STAGE=local
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1
export AWS_ENDPOINT_URL=http://localhost:4566
```

### AWS SDK Configuration for LocalStack

In your Lambda functions or backend code:

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL, // http://localhost:4566 for LocalStack
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
});
```

## Development Workflow

### 1. Start LocalStack

```bash
cd backend
docker-compose up -d
```

### 2. Deploy Infrastructure

```bash
./scripts/deploy-local.sh
```

### 3. Develop and Test

Your mobile app should be configured to use LocalStack endpoints:

```typescript
// Mobile app config (mobile/src/config/environment.ts)
export const API_BASE_URL = __DEV__
  ? 'http://localhost:4566/restapis/<api-id>/local'
  : 'https://api.mufradat.com';
```

### 4. View Logs

```bash
# View LocalStack logs
docker-compose logs -f localstack

# View specific service logs
awslocal logs tail /aws/apigateway/mufradat-local --follow
```

### 5. Stop LocalStack

```bash
docker-compose down

# To also remove data
docker-compose down -v
```

## Persistence

LocalStack data is persisted in `./localstack-data` directory. To start fresh:

```bash
docker-compose down -v
rm -rf localstack-data
docker-compose up -d
```

## Useful Commands

### CDK Commands with LocalStack

```bash
# Synthesize stack
STAGE=local npx cdklocal synth

# Show differences
STAGE=local npx cdklocal diff

# Deploy stack
STAGE=local npx cdklocal deploy --all

# Destroy stack
STAGE=local npx cdklocal destroy --all

# List stacks
STAGE=local npx cdklocal list
```

### Testing API Endpoints

```bash
# Health check
curl http://localhost:4566/restapis/<api-id>/local/health

# With authentication
curl -H "Authorization: Bearer <token>" \
  http://localhost:4566/restapis/<api-id>/local/users/profile
```

### Database Queries

```bash
# Query DynamoDB
awslocal dynamodb query \
  --table-name mufradat-progress-local \
  --key-condition-expression "userId = :userId" \
  --expression-attribute-values '{":userId": {"S": "user123"}}'
```

## Troubleshooting

### LocalStack not starting

```bash
# Check Docker is running
docker ps

# Check LocalStack logs
docker-compose logs localstack

# Restart LocalStack
docker-compose restart localstack
```

### Services not available

```bash
# Check service health
curl http://localhost:4566/_localstack/health

# Restart specific service
docker-compose restart localstack
```

### CDK deployment fails

```bash
# Clear CDK cache
rm -rf cdk.out

# Bootstrap CDK for LocalStack
STAGE=local npx cdklocal bootstrap

# Try deployment again
./scripts/deploy-local.sh
```

### Port conflicts

If port 4566 is already in use:

```yaml
# Edit docker-compose.yml
ports:
  - "4567:4566"  # Use different host port

# Update endpoint in config
export AWS_ENDPOINT_URL=http://localhost:4567
```

## Differences from AWS

LocalStack aims to replicate AWS behavior, but some differences exist:

1. **IAM**: Simplified, not fully enforced
2. **Cognito**: Limited OAuth flows
3. **Performance**: Faster than AWS (no network latency)
4. **Costs**: Free (vs AWS charges)
5. **Data**: Ephemeral by default (use persistence)

## Benefits of LocalStack

1. **Fast Development**: No AWS API rate limits
2. **Cost Savings**: No AWS charges during development
3. **Offline Development**: Works without internet
4. **Consistent Environment**: Same setup for all developers
5. **Easy Testing**: Programmatic setup/teardown
6. **Safe Experimentation**: No impact on AWS account

## Integration with CI/CD

LocalStack can be used in CI/CD pipelines:

```yaml
# .github/workflows/test.yml
services:
  localstack:
    image: localstack/localstack
    ports:
      - 4566:4566
    env:
      SERVICES: dynamodb,s3,apigateway
```

## Resources

- [LocalStack Documentation](https://docs.localstack.cloud/)
- [LocalStack GitHub](https://github.com/localstack/localstack)
- [AWS CLI Local](https://github.com/localstack/awscli-local)
- [CDK Local](https://github.com/localstack/aws-cdk-local)

## Next Steps

1. Start LocalStack: `docker-compose up -d`
2. Deploy infrastructure: `./scripts/deploy-local.sh`
3. Test endpoints: `curl http://localhost:4566/...`
4. Develop your app with local backend
5. When ready, deploy to AWS: `./scripts/deploy-dev.sh`

