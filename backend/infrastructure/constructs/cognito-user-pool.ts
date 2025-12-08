/**
 * AWS Cognito User Pool configuration
 */

import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/environment';

export interface CognitoUserPoolProps {
  config: EnvironmentConfig;
}

export class CognitoUserPool extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly userPoolDomain: cognito.UserPoolDomain;

  constructor(scope: Construct, id: string, props: CognitoUserPoolProps) {
    super(scope, id);

    const { config } = props;
    const removalPolicy = config.stage === 'prod'
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    // User Pool
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: config.cognito.userPoolName,
      
      // Sign-in configuration
      signInAliases: {
        email: true,
        username: false,
        phone: false,
      },
      
      // Self sign-up
      selfSignUpEnabled: true,
      
      // User attributes
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
      },
      
      // Custom attributes
      customAttributes: {
        studyGoal: new cognito.NumberAttribute({ min: 1, max: 100 }),
        learningModalities: new cognito.StringAttribute({ maxLen: 500 }),
      },
      
      // Password policy
      passwordPolicy: {
        minLength: config.cognito.passwordPolicyMinLength,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: config.stage === 'prod',
        tempPasswordValidity: cdk.Duration.days(7),
      },
      
      // MFA configuration
      mfa: config.cognito.mfaEnabled 
        ? cognito.Mfa.REQUIRED 
        : cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      
      // Account recovery
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      
      // Email configuration
      email: cognito.UserPoolEmail.withCognito(),
      
      // User verification
      userVerification: {
        emailSubject: 'Verify your email for Mufradat',
        emailBody: 'Hello {username}, Thank you for signing up for Mufradat! Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
      },
      
      // User invitation
      userInvitation: {
        emailSubject: 'Welcome to Mufradat!',
        emailBody: 'Hello {username}, you have been invited to join Mufradat. Your temporary password is {####}',
      },
      
      // Device tracking
      deviceTracking: {
        challengeRequiredOnNewDevice: true,
        deviceOnlyRememberedOnUserPrompt: true,
      },
      
      // Removal policy
      removalPolicy,
    });

    // Apply tags
    Tags.of(this.userPool).add('Project', config.tags.Project);
    Tags.of(this.userPool).add('Environment', config.tags.Environment);

    // User Pool Client
    this.userPoolClient = this.userPool.addClient('UserPoolClient', {
      userPoolClientName: `${config.cognito.userPoolName}-client`,
      
      // Auth flows
      authFlows: {
        userPassword: true,
        userSrp: true,
        custom: false,
        adminUserPassword: true,
      },
      
      // OAuth configuration
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: false,
        },
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: config.api.corsAllowedOrigins.map(origin => `${origin}/auth/callback`),
        logoutUrls: config.api.corsAllowedOrigins.map(origin => `${origin}/auth/logout`),
      },
      
      // Security
      preventUserExistenceErrors: true,
      enableTokenRevocation: true,
      
      // Token validity
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
      
      // Read/Write attributes
      readAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          email: true,
          emailVerified: true,
          givenName: true,
          familyName: true,
        })
        .withCustomAttributes('studyGoal', 'learningModalities'),
      
      writeAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({
          email: true,
          givenName: true,
          familyName: true,
        })
        .withCustomAttributes('studyGoal', 'learningModalities'),
    });

    // User Pool Domain
    this.userPoolDomain = this.userPool.addDomain('UserPoolDomain', {
      cognitoDomain: {
        domainPrefix: `mufradat-${config.stage}`,
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: this.userPool.userPoolId,
      description: 'Cognito User Pool ID',
      exportName: `${config.stage}-UserPoolId`,
    });

    new cdk.CfnOutput(this, 'UserPoolArn', {
      value: this.userPool.userPoolArn,
      description: 'Cognito User Pool ARN',
      exportName: `${config.stage}-UserPoolArn`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: this.userPoolClient.userPoolClientId,
      description: 'Cognito User Pool Client ID',
      exportName: `${config.stage}-UserPoolClientId`,
    });

    new cdk.CfnOutput(this, 'UserPoolDomainUrl', {
      value: this.userPoolDomain.baseUrl(),
      description: 'Cognito User Pool Domain URL',
    });
  }
}

