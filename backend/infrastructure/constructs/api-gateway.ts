/**
 * API Gateway REST API configuration
 */

import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/environment';
import { DynamoDBTables } from './dynamodb-tables';
import { SesEmail } from './ses-email';
import { KmsJwt } from './kms-jwt';

export interface ApiGatewayProps {
  config: EnvironmentConfig;
  dynamoTables: DynamoDBTables;
  sesEmail: SesEmail;
  kmsJwt: KmsJwt;
}

export class ApiGateway extends Construct {
  public readonly api: apigateway.RestApi;
  public jwtAuthorizer?: apigateway.TokenAuthorizer;
  private readonly config: EnvironmentConfig;
  private readonly dynamoTables: DynamoDBTables;
  private readonly sesEmail: SesEmail;
  private readonly kmsJwt: KmsJwt;

  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id);

    const { config, dynamoTables, sesEmail, kmsJwt } = props;
    this.config = config;
    this.dynamoTables = dynamoTables;
    this.sesEmail = sesEmail;
    this.kmsJwt = kmsJwt;

    // CloudWatch Log Group for API Gateway logs
    const logGroup = new logs.LogGroup(this, 'ApiLogs', {
      logGroupName: `/aws/apigateway/mufradat-${config.stage}`,
      retention: config.stage === 'prod' 
        ? logs.RetentionDays.ONE_MONTH 
        : logs.RetentionDays.ONE_WEEK,
      removalPolicy: config.stage === 'prod'
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // REST API
    this.api = new apigateway.RestApi(this, 'MufradatApi', {
      restApiName: `mufradat-api-${config.stage}`,
      description: `Mufradat Quranic Vocabulary Learning API - ${config.stage}`,
      
      // Deployment options
      deployOptions: {
        stageName: config.api.stageName,
        
        // Logging
        accessLogDestination: new apigateway.LogGroupLogDestination(logGroup),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields({
          caller: true,
          httpMethod: true,
          ip: true,
          protocol: true,
          requestTime: true,
          resourcePath: true,
          responseLength: true,
          status: true,
          user: true,
        }),
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: config.stage !== 'prod',
        
        // Metrics
        metricsEnabled: true,
        
        // Throttling
        throttlingBurstLimit: config.stage === 'prod' ? 5000 : 100,
        throttlingRateLimit: config.stage === 'prod' ? 10000 : 50,
        
        // Caching
        cachingEnabled: config.stage === 'prod',
        cacheClusterEnabled: config.stage === 'prod',
        cacheClusterSize: config.stage === 'prod' ? '0.5' : undefined,
        cacheTtl: cdk.Duration.minutes(5),
        cacheDataEncrypted: true,
        
        // Tracing
        tracingEnabled: true,
      },
      
      // CORS configuration
      defaultCorsPreflightOptions: {
        allowOrigins: config.api.corsAllowedOrigins,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
        ],
        allowCredentials: true,
        maxAge: cdk.Duration.hours(1),
      },
      
      // API Keys and Usage Plans
      apiKeySourceType: apigateway.ApiKeySourceType.HEADER,
      
      // CloudWatch role
      cloudWatchRole: true,
      
      // Endpoint configuration
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },
      
      // Binary media types
      binaryMediaTypes: ['image/*', 'audio/*', 'application/octet-stream'],
      
      // Minimum compression size (bytes)
      minimumCompressionSize: 1024,
    });

    // Apply tags
    Tags.of(this.api).add('Project', config.tags.Project);
    Tags.of(this.api).add('Environment', config.tags.Environment);

    // Create API resources and methods first
    this.setupApiResources();

    // Note: Cognito Authorizer will be created when Lambda functions are added
    // For now, we're just setting up the API structure
    // TODO: Uncomment and attach to methods when implementing Lambda functions
    // this.authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'CognitoAuthorizer', {
    //   cognitoUserPools: [userPool],
    //   authorizerName: `mufradat-authorizer-${config.stage}`,
    //   identitySource: 'method.request.header.Authorization',
    //   resultsCacheTtl: cdk.Duration.minutes(5),
    // });

    // API Key and Usage Plan for external integrations
    const apiKey = this.api.addApiKey('ApiKey', {
      apiKeyName: `mufradat-api-key-${config.stage}`,
      description: 'API Key for Mufradat external integrations',
    });

    const usagePlan = this.api.addUsagePlan('UsagePlan', {
      name: `mufradat-usage-plan-${config.stage}`,
      description: 'Usage plan for Mufradat API',
      apiStages: [
        {
          api: this.api,
          stage: this.api.deploymentStage,
        },
      ],
      throttle: {
        rateLimit: config.stage === 'prod' ? 10000 : 50,
        burstLimit: config.stage === 'prod' ? 5000 : 100,
      },
      quota: {
        limit: config.stage === 'prod' ? 1000000 : 10000,
        period: apigateway.Period.MONTH,
      },
    });

    usagePlan.addApiKey(apiKey);

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'API Gateway URL',
      exportName: `${config.stage}-ApiUrl`,
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: 'API Gateway ID',
      exportName: `${config.stage}-ApiId`,
    });

    new cdk.CfnOutput(this, 'ApiStage', {
      value: this.api.deploymentStage.stageName,
      description: 'API Gateway Stage',
    });
  }

  private setupApiResources(): void {

    const isLocal = this.config.localStack?.enabled;

    // API structure:
    // /auth - Authentication endpoints
    // /users - User management
    // /vocabulary - Vocabulary management
    // /progress - Learning progress
    // /conjugations - Verb conjugations
    // /sessions - Learning sessions

    // Create JWT Authorizer Lambda and API Gateway authorizer
    // Note: LocalStack has limited support for CUSTOM authorizers,
    // so we only attach the authorizer in non-local environments.
    let jwtAuthorizerFunction: lambda.Function | undefined;
    if (!isLocal) {
      jwtAuthorizerFunction = new lambda.Function(this, 'JwtAuthorizerFunction', {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'jwt-authorizer.handler',
        code: lambda.Code.fromAsset(path.join(__dirname, '../../dist/lambdas/auth')),
        timeout: cdk.Duration.seconds(5),
        environment: {
          JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
          STAGE: this.config.stage,
          AWS_ENDPOINT_URL: this.config.localStack?.enabled ? this.config.localStack.endpoint : '',
          // Note: AWS_DEFAULT_REGION is set automatically by Lambda runtime
        },
      });

      // Create JWT Authorizer for real AWS environments
      this.jwtAuthorizer = new apigateway.TokenAuthorizer(this, 'JwtAuthorizer', {
        handler: jwtAuthorizerFunction,
        identitySource: 'method.request.header.Authorization',
        resultsCacheTtl: cdk.Duration.minutes(5),
      });
    }

    // Helper: auth Lambda code asset and handlers
    // Use prepared bundle directory that contains: src/lambdas/auth/*.js, shared/*.js, node_modules/
    // This ensures shared utilities and runtime deps are available
    const bundlePath = path.join(__dirname, '../../dist/lambda-bundle');
    const authCode = lambda.Code.fromAsset(bundlePath);
    const authHandler = (baseName: string) => `src/lambdas/auth/${baseName}.handler`;

    // Create Register Lambda Function
    const registerFunction = new lambda.Function(this, 'RegisterFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: authHandler('register'),
      code: authCode,
      timeout: cdk.Duration.seconds(30),
      logRetention: logs.RetentionDays.ONE_DAY,
      environment: {
        USERS_TABLE_NAME: this.dynamoTables.usersTable.tableName,
        OTP_TABLE_NAME: this.dynamoTables.otpTable.tableName,
        STAGE: this.config.stage,
        AWS_ENDPOINT_URL: this.config.localStack?.enabled ? this.config.localStack.endpoint : '',
        FROM_EMAIL: 'noreply@mufradat.com',
        JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
        // Note: AWS_DEFAULT_REGION is set automatically by Lambda runtime
      },
    });

    // Grant SES permissions if available (for non-local environments)
    if (this.sesEmail.sendEmailRole) {
      registerFunction.addToRolePolicy(new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: ['*'],
      }));
    }

    // Grant DynamoDB permissions
    this.dynamoTables.usersTable.grantReadWriteData(registerFunction);
    this.dynamoTables.otpTable.grantReadWriteData(registerFunction);

    // Create Login Lambda Function
    const loginFunction = new lambda.Function(this, 'LoginFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: authHandler('login'),
      code: authCode,
      timeout: cdk.Duration.seconds(30),
      environment: {
        USERS_TABLE_NAME: this.dynamoTables.usersTable.tableName,
        STAGE: this.config.stage,
        AWS_ENDPOINT_URL: this.config.localStack?.enabled ? this.config.localStack.endpoint : '',
        JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key-change-in-production',
        // Email verification: Set to 'true' to require email verification before login
        // For local/testing, set to 'false' to skip email verification
        REQUIRE_EMAIL_VERIFICATION: this.config.stage === 'local' ? 'false' : (process.env.REQUIRE_EMAIL_VERIFICATION || 'false'),
        // Note: AWS_DEFAULT_REGION is set automatically by Lambda runtime
      },
    });

    // Grant DynamoDB permissions
    this.dynamoTables.usersTable.grantReadData(loginFunction);

    // Create Verify Email Lambda Function
    const verifyEmailFunction = new lambda.Function(this, 'VerifyEmailFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: authHandler('verify-email'),
      code: authCode,
      timeout: cdk.Duration.seconds(30),
      environment: {
        USERS_TABLE_NAME: this.dynamoTables.usersTable.tableName,
        OTP_TABLE_NAME: this.dynamoTables.otpTable.tableName,
        STAGE: this.config.stage,
        AWS_ENDPOINT_URL: this.config.localStack?.enabled ? this.config.localStack.endpoint : '',
        JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key-change-in-production',
        // Note: AWS_DEFAULT_REGION is set automatically by Lambda runtime
      },
    });

    // Grant DynamoDB permissions
    this.dynamoTables.usersTable.grantReadWriteData(verifyEmailFunction);
    this.dynamoTables.otpTable.grantReadWriteData(verifyEmailFunction);

    // Create Refresh Token Lambda Function
    const refreshFunction = new lambda.Function(this, 'RefreshFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: authHandler('refresh'),
      code: authCode,
      timeout: cdk.Duration.seconds(30),
      environment: {
        USERS_TABLE_NAME: this.dynamoTables.usersTable.tableName,
        STAGE: this.config.stage,
        AWS_ENDPOINT_URL: this.config.localStack?.enabled ? this.config.localStack.endpoint : '',
        JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key-change-in-production',
        // Note: AWS_DEFAULT_REGION is set automatically by Lambda runtime
      },
    });

    // Grant DynamoDB permissions
    this.dynamoTables.usersTable.grantReadData(refreshFunction);

    // Auth endpoints (public)
    const auth = this.api.root.addResource('auth');
    const register = auth.addResource('register');
    const login = auth.addResource('login');
    const verifyEmail = auth.addResource('verify-email');
    const refresh = auth.addResource('refresh');
    auth.addResource('logout');
    
    // Add POST method to register endpoint
    register.addMethod('POST', new apigateway.LambdaIntegration(registerFunction, {
      proxy: true,
    }), {
      methodResponses: [
        {
          statusCode: '201',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
            'method.response.header.Content-Type': true,
          },
        },
      ],
    });
    
    // Add POST method to login endpoint
    // Using LambdaIntegration without explicit proxy (defaults to proxy: true)
    // Matching working demo configuration
    login.addMethod('POST', new apigateway.LambdaIntegration(loginFunction));

    // Add POST method to verify-email endpoint
    verifyEmail.addMethod('POST', new apigateway.LambdaIntegration(verifyEmailFunction, {
      proxy: true,
    }), {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
            'method.response.header.Content-Type': true,
          },
        },
        {
          statusCode: '401',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
            'method.response.header.Content-Type': true,
          },
        },
      ],
    });

    // Add POST method to refresh endpoint
    refresh.addMethod('POST', new apigateway.LambdaIntegration(refreshFunction, {
      proxy: true,
    }), {
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
            'method.response.header.Content-Type': true,
          },
        },
        {
          statusCode: '401',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
            'method.response.header.Content-Type': true,
          },
        },
      ],
    });

    // User endpoints (protected in real environments - require JWT authorization)
    const users = this.api.root.addResource('users');
    const profile = users.addResource('profile');
    const preferences = users.addResource('preferences');
    const statistics = users.addResource('statistics');

    // Add GET method to profile endpoint
    profile.addMethod(
      'GET',
      new apigateway.MockIntegration({
        integrationResponses: [{ statusCode: '200' }],
        requestTemplates: { 'application/json': '{ "statusCode": 200 }' },
      }),
      this.jwtAuthorizer
        ? {
            authorizer: this.jwtAuthorizer,
            methodResponses: [{ statusCode: '200' }],
          }
        : {
            methodResponses: [{ statusCode: '200' }],
          }
    );

    // Vocabulary endpoints (mix of public and protected)
    const vocabulary = this.api.root.addResource('vocabulary');
    vocabulary.addResource('words');
    vocabulary.addResource('{wordId}');

    // Progress endpoints (protected)
    const progress = this.api.root.addResource('progress');
    progress.addResource('session');
    progress.addResource('stats');
    progress.addResource('review-queue');
    progress.addResource('word').addResource('{wordId}');

    // Conjugations endpoints (mix of public and protected)
    const conjugations = this.api.root.addResource('conjugations');
    conjugations.addResource('{verbId}');

    // Learning endpoints (protected)
    const learning = this.api.root.addResource('learning');
    learning.addResource('next-words');
    learning.addResource('study-plan');
    learning.addResource('feedback');

    // Notifications endpoints (protected)
    const notifications = this.api.root.addResource('notifications');
    notifications.addResource('schedule');
    notifications.addResource('preferences');

    // Health check endpoint (public)
    const health = this.api.root.addResource('health');
    health.addMethod('GET', new apigateway.MockIntegration({
      integrationResponses: [
        {
          statusCode: '200',
          responseTemplates: {
            'application/json': JSON.stringify({
              status: 'healthy',
              timestamp: '$context.requestTime',
            }),
          },
        },
      ],
      requestTemplates: {
        'application/json': '{ "statusCode": 200 }',
      },
    }), {
      methodResponses: [{ statusCode: '200' }],
    });
  }
}

