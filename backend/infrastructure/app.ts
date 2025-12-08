#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MufradatStack } from './stacks/mufradat-stack';
import { getConfig, getLocalStackEndpoint } from './config/environment';

const app = new cdk.App();

// Get environment configuration
const config = getConfig();
const localStackEndpoint = getLocalStackEndpoint();

// If using LocalStack, configure AWS SDK to use LocalStack endpoints
if (localStackEndpoint) {
  console.log(`\n🔧 Configuring for LocalStack at ${localStackEndpoint}`);
  
  // Set environment variables for AWS SDK
  process.env.AWS_ENDPOINT_URL = localStackEndpoint;
  process.env.AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID || 'test';
  process.env.AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY || 'test';
  process.env.AWS_DEFAULT_REGION = config.aws.region;
}

// Configure environment
const env: cdk.Environment = {
  account: localStackEndpoint ? '000000000000' : (config.aws.accountId || process.env.CDK_DEFAULT_ACCOUNT),
  region: config.aws.region || process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Create the stack
new MufradatStack(app, `MufradatStack-${config.stage}`, {
  env,
  description: `Mufradat - Quranic Vocabulary Learning App Infrastructure (${config.stage})`,
  tags: {
    Project: config.tags.Project,
    Environment: config.tags.Environment,
    Stage: config.stage,
  },
  // Stack name
  stackName: `mufradat-${config.stage}`,
});

app.synth();

