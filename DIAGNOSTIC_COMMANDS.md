# Diagnostic Commands for Lambda Deployment

## Check Lambda Deployment Status

```bash
# Using awslocal (if available)
awslocal lambda list-functions --query 'Functions[*].[FunctionName,Runtime,CodeSize]' --output table

# Using aws CLI with endpoint
aws --endpoint-url=http://localhost:4566 lambda list-functions --query 'Functions[*].[FunctionName,Runtime,CodeSize]' --output table
```

## Check API Gateway

```bash
# List APIs
awslocal apigateway get-rest-apis --query 'items[*].[name,id]' --output table
# OR
aws --endpoint-url=http://localhost:4566 apigateway get-rest-apis --query 'items[*].[name,id]' --output table

# Get API ID
API_ID=$(awslocal apigateway get-rest-apis --query 'items[?name==`mufradat-api-local`].id' --output text)

# Check resources
awslocal apigateway get-resources --rest-api-id "$API_ID" --query 'items[*].[path,pathPart]' --output table
```

## Check CloudFormation Stack Status

```bash
# Stack status
awslocal cloudformation describe-stacks --stack-name mufradat-local --query 'Stacks[0].[StackStatus,StackStatusReason]' --output table

# Recent events
awslocal cloudformation describe-stack-events --stack-name mufradat-local --max-items 20 --query 'StackEvents[*].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId,ResourceStatusReason]' --output table
```

## Test Lambda Directly

```bash
# Get function name
FUNC_NAME=$(awslocal lambda list-functions --query 'Functions[?contains(FunctionName, `Register`)].FunctionName' --output text)

# Invoke function
awslocal lambda invoke \
  --function-name "$FUNC_NAME" \
  --payload '{"httpMethod":"POST","path":"/auth/register","headers":{"origin":"http://localhost:19006"},"body":"{\"email\":\"test@example.com\",\"password\":\"Test123!\"}"}' \
  /tmp/response.json

# View response
cat /tmp/response.json | jq '.'
```

## View Lambda Logs

```bash
# List log groups
awslocal logs describe-log-groups --query 'logGroups[*].logGroupName' --output table

# Tail logs
FUNC_NAME=$(awslocal lambda list-functions --query 'Functions[?contains(FunctionName, `Register`)].FunctionName' --output text)
awslocal logs tail "/aws/lambda/$FUNC_NAME" --follow
```

## Clean Up Failed Deployment

```bash
# Delete stack
awslocal cloudformation delete-stack --stack-name mufradat-local

# Delete DynamoDB tables
awslocal dynamodb list-tables --query 'TableNames[?contains(@, `mufradat`)]' --output text | xargs -I {} awslocal dynamodb delete-table --table-name {}

# Delete Lambda functions
awslocal lambda list-functions --query 'Functions[?contains(FunctionName, `mufradat`)].FunctionName' --output text | xargs -I {} awslocal lambda delete-function --function-name {}

# Delete API Gateway
API_ID=$(awslocal apigateway get-rest-apis --query 'items[?name==`mufradat-api-local`].id' --output text)
awslocal apigateway delete-rest-api --rest-api-id "$API_ID"
```

## Quick Diagnostic Script

Use the provided script:
```bash
./scripts/check-lambda-deployment.sh
```

## Fix Deployment Issues

Use the provided script:
```bash
./scripts/fix-deployment.sh
```



