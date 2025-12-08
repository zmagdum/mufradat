/**
 * SES Email Configuration
 * For production: Uses AWS SES
 * For local: Uses console logging (LocalStack SES support is limited)
 */

import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { EnvironmentConfig } from '../config/environment';

export interface SesEmailProps {
  config: EnvironmentConfig;
}

export class SesEmail extends Construct {
  public readonly verifiedEmail?: ses.EmailIdentity;
  public readonly sendEmailRole?: iam.Role;

  constructor(scope: Construct, id: string, props: SesEmailProps) {
    super(scope, id);

    const { config } = props;

    // Only create SES resources for non-local environments
    // For local, we'll use console.log in the Lambda functions
    if (config.stage !== 'local') {
      // Create verified email identity
      // Note: In production, you'll need to verify this email address in SES console
      this.verifiedEmail = new ses.EmailIdentity(this, 'VerifiedEmail', {
        identity: ses.Identity.email(`noreply@mufradat.com`),
      });

      // Create IAM role for Lambda functions to send emails
      this.sendEmailRole = new iam.Role(this, 'SendEmailRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        description: 'Role for Lambda functions to send emails via SES',
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        ],
      });

      // Grant SES send email permissions
      this.sendEmailRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'ses:SendEmail',
            'ses:SendRawEmail',
          ],
          resources: [
            this.verifiedEmail.emailIdentityArn,
          ],
        })
      );

      // Apply tags
      Tags.of(this.verifiedEmail).add('Project', config.tags.Project);
      Tags.of(this.verifiedEmail).add('Environment', config.tags.Environment);
      Tags.of(this.sendEmailRole).add('Project', config.tags.Project);
      Tags.of(this.sendEmailRole).add('Environment', config.tags.Environment);

      // Outputs
      new cdk.CfnOutput(this, 'VerifiedEmailAddress', {
        value: `noreply@mufradat.com`,
        description: 'SES verified email address',
        exportName: `${config.stage}-VerifiedEmailAddress`,
      });
    }
  }
}

