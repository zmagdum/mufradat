/**
 * S3 Bucket definitions for media content storage
 */

import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/environment';

export interface S3BucketsProps {
  config: EnvironmentConfig;
}

export class S3Buckets extends Construct {
  public readonly mediaBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: S3BucketsProps) {
    super(scope, id);

    const { config } = props;
    const removalPolicy = config.stage === 'prod'
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    // Media Content Bucket
    this.mediaBucket = new s3.Bucket(this, 'MediaBucket', {
      bucketName: config.s3.mediaBucketName,
      
      // Access control
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      
      // Encryption
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      
      // Versioning for production
      versioned: config.stage === 'prod',
      
      // CORS configuration for web uploads
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: config.api.corsAllowedOrigins,
          allowedHeaders: ['*'],
          exposedHeaders: ['ETag'],
          maxAge: 3600,
        },
      ],
      
      // Lifecycle rules
      lifecycleRules: config.s3.lifecycleEnabled ? [
        {
          // Delete incomplete multipart uploads after 7 days
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          // Move old versions to Intelligent Tiering after 30 days
          enabled: true,
          noncurrentVersionTransitions: [
            {
              storageClass: s3.StorageClass.INTELLIGENT_TIERING,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
        {
          // Delete old versions after 90 days
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
      ] : [],
      
      // Removal policy
      removalPolicy,
      // Note: autoDeleteObjects disabled for LocalStack compatibility (requires Lambda/Docker)
      // autoDeleteObjects: config.stage !== 'prod',
    });

    // Apply tags
    Tags.of(this.mediaBucket).add('Project', config.tags.Project);
    Tags.of(this.mediaBucket).add('Environment', config.tags.Environment);

    // Add bucket policy for CloudFront access
    this.mediaBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudFrontAccess',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:GetObject'],
        resources: [this.mediaBucket.arnForObjects('*')],
      })
    );

    // Output bucket information
    new cdk.CfnOutput(this, 'MediaBucketName', {
      value: this.mediaBucket.bucketName,
      description: 'Media content bucket name',
      exportName: `${config.stage}-MediaBucketName`,
    });

    new cdk.CfnOutput(this, 'MediaBucketArn', {
      value: this.mediaBucket.bucketArn,
      description: 'Media content bucket ARN',
      exportName: `${config.stage}-MediaBucketArn`,
    });

    new cdk.CfnOutput(this, 'MediaBucketUrl', {
      value: this.mediaBucket.bucketWebsiteUrl,
      description: 'Media content bucket URL',
    });
  }
}

