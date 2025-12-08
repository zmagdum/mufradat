/**
 * KMS Key for JWT Token Signing
 * For production: Uses AWS KMS
 * For local: Uses environment variable secret (fallback)
 */

import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/environment';

export interface KmsJwtProps {
  config: EnvironmentConfig;
}

export class KmsJwt extends Construct {
  public readonly jwtSigningKey?: kms.Key;
  public readonly jwtSigningRole?: iam.Role;

  constructor(scope: Construct, id: string, props: KmsJwtProps) {
    super(scope, id);

    const { config } = props;

    // Only create KMS resources for non-local environments
    // For local, we'll use JWT_SECRET environment variable
    if (config.stage !== 'local') {
      // Create KMS key for JWT signing
      this.jwtSigningKey = new kms.Key(this, 'JwtSigningKey', {
        description: 'KMS key for JWT token signing',
        enableKeyRotation: config.stage === 'prod',
        removalPolicy: config.stage === 'prod'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,
      });

      // Create alias for easier reference
      new kms.Alias(this, 'JwtSigningKeyAlias', {
        aliasName: `alias/mufradat-jwt-${config.stage}`,
        targetKey: this.jwtSigningKey,
      });

      // Create IAM role for Lambda functions to use KMS
      this.jwtSigningRole = new iam.Role(this, 'JwtSigningRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        description: 'Role for Lambda functions to sign JWT tokens using KMS',
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        ],
      });

      // Grant KMS permissions
      this.jwtSigningKey.grant(this.jwtSigningRole, 'kms:Sign', 'kms:Verify');

      // Apply tags
      Tags.of(this.jwtSigningKey).add('Project', config.tags.Project);
      Tags.of(this.jwtSigningKey).add('Environment', config.tags.Environment);
      Tags.of(this.jwtSigningRole).add('Project', config.tags.Project);
      Tags.of(this.jwtSigningRole).add('Environment', config.tags.Environment);

      // Outputs
      new cdk.CfnOutput(this, 'JwtSigningKeyId', {
        value: this.jwtSigningKey.keyId,
        description: 'KMS key ID for JWT signing',
        exportName: `${config.stage}-JwtSigningKeyId`,
      });

      new cdk.CfnOutput(this, 'JwtSigningKeyArn', {
        value: this.jwtSigningKey.keyArn,
        description: 'KMS key ARN for JWT signing',
        exportName: `${config.stage}-JwtSigningKeyArn`,
      });
    }
  }
}

