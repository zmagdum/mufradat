import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { getConfig, isLocalStack } from '../config/environment';
import { DynamoDBTables } from '../constructs/dynamodb-tables';
import { S3Buckets } from '../constructs/s3-buckets';
import { SesEmail } from '../constructs/ses-email';
import { KmsJwt } from '../constructs/kms-jwt';
import { ApiGateway } from '../constructs/api-gateway';

/**
 * Main CDK Stack for Mufradat Application
 * Supports both AWS and LocalStack deployment
 */
export class MufradatStack extends cdk.Stack {
  public readonly dynamoTables: DynamoDBTables;
  public readonly s3Buckets: S3Buckets;
  public readonly sesEmail: SesEmail;
  public readonly kmsJwt: KmsJwt;
  public readonly apiGateway: ApiGateway;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get environment configuration
    const config = getConfig();
    const usingLocalStack = isLocalStack();

    // Log deployment target
    console.log(`\n🚀 Deploying to: ${config.stage} ${usingLocalStack ? '(LocalStack)' : '(AWS)'}`);
    console.log(`📍 Region: ${config.aws.region}`);
    console.log(`🏷️  Environment: ${config.tags.Environment}\n`);

    // DynamoDB Tables
    this.dynamoTables = new DynamoDBTables(this, 'DynamoDBTables', {
      config,
    });

    // S3 Buckets
    this.s3Buckets = new S3Buckets(this, 'S3Buckets', {
      config,
    });

    // SES Email (for production email sending)
    this.sesEmail = new SesEmail(this, 'SesEmail', {
      config,
    });

    // KMS for JWT signing (for production)
    this.kmsJwt = new KmsJwt(this, 'KmsJwt', {
      config,
    });

    // API Gateway
    this.apiGateway = new ApiGateway(this, 'ApiGateway', {
      config,
      dynamoTables: this.dynamoTables,
      sesEmail: this.sesEmail,
      kmsJwt: this.kmsJwt,
    });

    // Stack-level outputs
    new cdk.CfnOutput(this, 'StackName', {
      value: this.stackName,
      description: 'The name of this stack',
    });

    new cdk.CfnOutput(this, 'Stage', {
      value: config.stage,
      description: 'Deployment stage',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: config.aws.region,
      description: 'AWS Region',
    });

    new cdk.CfnOutput(this, 'LocalStackMode', {
      value: usingLocalStack ? 'Yes' : 'No',
      description: 'Running in LocalStack mode',
    });

    // Add tags to all resources in the stack
    cdk.Tags.of(this).add('Project', config.tags.Project);
    cdk.Tags.of(this).add('Environment', config.tags.Environment);
    cdk.Tags.of(this).add('ManagedBy', 'AWS CDK');
  }
}

