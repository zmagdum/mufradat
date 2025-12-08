/**
 * DynamoDB Table definitions for Mufradat application
 */

import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import { EnvironmentConfig, isLocalStack } from '../config/environment';

export interface DynamoDBTablesProps {
  config: EnvironmentConfig;
}

export class DynamoDBTables extends Construct {
  public readonly usersTable: dynamodb.ITable;
  public readonly vocabularyTable: dynamodb.ITable;
  public readonly progressTable: dynamodb.ITable;
  public readonly conjugationsTable: dynamodb.ITable;
  public readonly sessionsTable: dynamodb.ITable;
  public readonly otpTable: dynamodb.ITable;

  constructor(scope: Construct, id: string, props: DynamoDBTablesProps) {
    super(scope, id);

    const { config } = props;
    const removalPolicy = config.stage === 'prod' 
      ? cdk.RemovalPolicy.RETAIN 
      : cdk.RemovalPolicy.DESTROY;
    
    const usingLocalStack = isLocalStack();
    const useExistingTables = usingLocalStack && process.env.USE_EXISTING_TABLES === 'true';

    // Users Table
    // For LocalStack: If tables are created separately, reference existing tables
    if (useExistingTables) {
      // Reference existing table instead of creating new one
      this.usersTable = dynamodb.Table.fromTableName(
        this,
        'UsersTable',
        `mufradat-users-${config.stage}`
      );
    } else {
      // Create new table
      this.usersTable = new dynamodb.Table(this, 'UsersTable', {
        tableName: `mufradat-users-${config.stage}`,
        partitionKey: {
          name: 'userId',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: config.dynamodb.billingMode === 'PROVISIONED'
          ? dynamodb.BillingMode.PROVISIONED
          : dynamodb.BillingMode.PAY_PER_REQUEST,
        readCapacity: config.dynamodb.readCapacity,
        writeCapacity: config.dynamodb.writeCapacity,
        removalPolicy,
        pointInTimeRecovery: config.stage === 'prod',
        stream: config.stage === 'local' ? undefined : dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      });
    }

    // GSI for email lookup (only if creating new table)
    if (!useExistingTables) {
      (this.usersTable as dynamodb.Table).addGlobalSecondaryIndex({
        indexName: 'EmailIndex',
        partitionKey: {
          name: 'email',
          type: dynamodb.AttributeType.STRING,
        },
        projectionType: dynamodb.ProjectionType.ALL,
      });
    }

    // Vocabulary Words Table
    if (useExistingTables) {
      this.vocabularyTable = dynamodb.Table.fromTableName(
        this,
        'VocabularyTable',
        `mufradat-vocabulary-${config.stage}`
      );
    } else {
      this.vocabularyTable = new dynamodb.Table(this, 'VocabularyTable', {
      tableName: `mufradat-vocabulary-${config.stage}`,
      partitionKey: {
        name: 'wordId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: config.dynamodb.billingMode === 'PROVISIONED'
        ? dynamodb.BillingMode.PROVISIONED
        : dynamodb.BillingMode.PAY_PER_REQUEST,
      readCapacity: config.dynamodb.readCapacity,
      writeCapacity: config.dynamodb.writeCapacity,
      removalPolicy,
      pointInTimeRecovery: config.stage === 'prod',
      });

      // GSI for difficulty-based queries
      (this.vocabularyTable as dynamodb.Table).addGlobalSecondaryIndex({
        indexName: 'DifficultyIndex',
        partitionKey: {
          name: 'difficulty',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'frequency',
          type: dynamodb.AttributeType.NUMBER,
        },
        projectionType: dynamodb.ProjectionType.ALL,
      });

      // GSI for word type queries
      (this.vocabularyTable as dynamodb.Table).addGlobalSecondaryIndex({
        indexName: 'WordTypeIndex',
        partitionKey: {
          name: 'wordType',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'frequency',
          type: dynamodb.AttributeType.NUMBER,
        },
        projectionType: dynamodb.ProjectionType.ALL,
      });
    }

    // Word Progress Table
    if (useExistingTables) {
      this.progressTable = dynamodb.Table.fromTableName(
        this,
        'ProgressTable',
        `mufradat-progress-${config.stage}`
      );
    } else {
      this.progressTable = new dynamodb.Table(this, 'ProgressTable', {
        tableName: `mufradat-progress-${config.stage}`,
        partitionKey: {
          name: 'userId',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'wordId',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: config.dynamodb.billingMode === 'PROVISIONED'
          ? dynamodb.BillingMode.PROVISIONED
          : dynamodb.BillingMode.PAY_PER_REQUEST,
        readCapacity: config.dynamodb.readCapacity,
        writeCapacity: config.dynamodb.writeCapacity,
        removalPolicy,
        pointInTimeRecovery: config.stage === 'prod',
        stream: config.stage === 'local' ? undefined : dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      });

      // GSI for review queue queries (get words due for review)
      (this.progressTable as dynamodb.Table).addGlobalSecondaryIndex({
        indexName: 'ReviewQueueIndex',
        partitionKey: {
          name: 'userId',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'nextReviewDate',
          type: dynamodb.AttributeType.STRING,
        },
        projectionType: dynamodb.ProjectionType.ALL,
      });

      // GSI for mastery level queries
      (this.progressTable as dynamodb.Table).addGlobalSecondaryIndex({
        indexName: 'MasteryIndex',
        partitionKey: {
          name: 'userId',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'masteryLevel',
          type: dynamodb.AttributeType.NUMBER,
        },
        projectionType: dynamodb.ProjectionType.ALL,
      });
    }

    // Verb Conjugations Table
    if (useExistingTables) {
      this.conjugationsTable = dynamodb.Table.fromTableName(
        this,
        'ConjugationsTable',
        `mufradat-conjugations-${config.stage}`
      );
    } else {
      this.conjugationsTable = new dynamodb.Table(this, 'ConjugationsTable', {
        tableName: `mufradat-conjugations-${config.stage}`,
        partitionKey: {
          name: 'verbId',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: config.dynamodb.billingMode === 'PROVISIONED'
          ? dynamodb.BillingMode.PROVISIONED
          : dynamodb.BillingMode.PAY_PER_REQUEST,
        readCapacity: config.dynamodb.readCapacity,
        writeCapacity: config.dynamodb.writeCapacity,
        removalPolicy,
        pointInTimeRecovery: config.stage === 'prod',
      });
    }

    // Learning Sessions Table
    if (useExistingTables) {
      this.sessionsTable = dynamodb.Table.fromTableName(
        this,
        'SessionsTable',
        `mufradat-sessions-${config.stage}`
      );
    } else {
      this.sessionsTable = new dynamodb.Table(this, 'SessionsTable', {
        tableName: `mufradat-sessions-${config.stage}`,
        partitionKey: {
          name: 'userId',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'sessionId',
          type: dynamodb.AttributeType.STRING,
        },
        billingMode: config.dynamodb.billingMode === 'PROVISIONED'
          ? dynamodb.BillingMode.PROVISIONED
          : dynamodb.BillingMode.PAY_PER_REQUEST,
        readCapacity: config.dynamodb.readCapacity,
        writeCapacity: config.dynamodb.writeCapacity,
        removalPolicy,
        pointInTimeRecovery: config.stage === 'prod',
        timeToLiveAttribute: 'expiresAt', // Auto-delete old sessions
      });

      // GSI for date-based session queries
      (this.sessionsTable as dynamodb.Table).addGlobalSecondaryIndex({
        indexName: 'DateIndex',
        partitionKey: {
          name: 'userId',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'startTime',
          type: dynamodb.AttributeType.STRING,
        },
        projectionType: dynamodb.ProjectionType.ALL,
      });
    }

    // OTP Table for email verification
    if (useExistingTables) {
      this.otpTable = dynamodb.Table.fromTableName(
        this,
        'OtpTable',
        `mufradat-otp-${config.stage}`
      );
    } else {
      this.otpTable = new dynamodb.Table(this, 'OtpTable', {
      tableName: `mufradat-otp-${config.stage}`,
      partitionKey: {
        name: 'email',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'otpType',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: config.dynamodb.billingMode === 'PROVISIONED'
        ? dynamodb.BillingMode.PROVISIONED
        : dynamodb.BillingMode.PAY_PER_REQUEST,
      readCapacity: config.dynamodb.readCapacity,
      writeCapacity: config.dynamodb.writeCapacity,
      removalPolicy,
      pointInTimeRecovery: config.stage === 'prod',
      timeToLiveAttribute: 'expiresAt', // Auto-delete expired OTPs
      });
    }

    // Apply tags to all tables (only if creating new tables)
    Tags.of(this.usersTable).add('Project', config.tags.Project);
    Tags.of(this.usersTable).add('Environment', config.tags.Environment);
    Tags.of(this.vocabularyTable).add('Project', config.tags.Project);
    Tags.of(this.vocabularyTable).add('Environment', config.tags.Environment);
    Tags.of(this.progressTable).add('Project', config.tags.Project);
    Tags.of(this.progressTable).add('Environment', config.tags.Environment);
    Tags.of(this.conjugationsTable).add('Project', config.tags.Project);
    Tags.of(this.conjugationsTable).add('Environment', config.tags.Environment);
    Tags.of(this.sessionsTable).add('Project', config.tags.Project);
    Tags.of(this.sessionsTable).add('Environment', config.tags.Environment);
    Tags.of(this.otpTable).add('Project', config.tags.Project);
    Tags.of(this.otpTable).add('Environment', config.tags.Environment);

    // Output table names
    new cdk.CfnOutput(this, 'UsersTableName', {
      value: this.usersTable.tableName,
      description: 'Users table name',
      exportName: `${config.stage}-UsersTableName`,
    });

    new cdk.CfnOutput(this, 'VocabularyTableName', {
      value: this.vocabularyTable.tableName,
      description: 'Vocabulary table name',
      exportName: `${config.stage}-VocabularyTableName`,
    });

    new cdk.CfnOutput(this, 'ProgressTableName', {
      value: this.progressTable.tableName,
      description: 'Progress table name',
      exportName: `${config.stage}-ProgressTableName`,
    });

    new cdk.CfnOutput(this, 'ConjugationsTableName', {
      value: this.conjugationsTable.tableName,
      description: 'Conjugations table name',
      exportName: `${config.stage}-ConjugationsTableName`,
    });

    new cdk.CfnOutput(this, 'SessionsTableName', {
      value: this.sessionsTable.tableName,
      description: 'Sessions table name',
      exportName: `${config.stage}-SessionsTableName`,
    });

    new cdk.CfnOutput(this, 'OtpTableName', {
      value: this.otpTable.tableName,
      description: 'OTP table name',
      exportName: `${config.stage}-OtpTableName`,
    });
  }
}

