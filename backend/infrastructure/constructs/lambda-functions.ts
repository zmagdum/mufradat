/**
 * Lambda Functions Configuration
 * Creates and configures Lambda functions for the API
 */

import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/environment';
import { DynamoDBTables } from './dynamodb-tables';

export interface LambdaFunctionsProps {
  config: EnvironmentConfig;
  dynamoTables: DynamoDBTables;
}

export class LambdaFunctions extends Construct {
  public readonly registerFunction: lambda.Function;
  public readonly loginFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: LambdaFunctionsProps) {
    super(scope, id);

    const { config, dynamoTables } = props;

    // Register Lambda Function
    this.registerFunction = new lambda.Function(this, 'RegisterFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'register.handler',
      code: lambda.Code.fromAsset('../dist/lambdas/auth'),
      environment: {
        USERS_TABLE_NAME: dynamoTables.usersTable.tableName,
        STAGE: config.stage,
        AWS_ENDPOINT_URL: config.localStack?.enabled ? config.localStack.endpoint : undefined || '',
        AWS_DEFAULT_REGION: config.aws.region,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Grant DynamoDB permissions
    dynamoTables.usersTable.grantReadWriteData(this.registerFunction);

    // Login Lambda Function
    this.loginFunction = new lambda.Function(this, 'LoginFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'login.handler',
      code: lambda.Code.fromAsset('../dist/lambdas/auth'),
      environment: {
        USERS_TABLE_NAME: dynamoTables.usersTable.tableName,
        STAGE: config.stage,
        AWS_ENDPOINT_URL: config.localStack?.enabled ? config.localStack.endpoint : undefined || '',
        AWS_DEFAULT_REGION: config.aws.region,
      },
      timeout: cdk.Duration.seconds(30),
    });

    // Grant DynamoDB permissions
    dynamoTables.usersTable.grantReadData(this.loginFunction);
  }
}



