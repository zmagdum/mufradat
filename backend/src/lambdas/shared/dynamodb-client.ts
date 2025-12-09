/**
 * DynamoDB Client Configuration
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { getLocalStackEndpoint } from './localstack-endpoint';

// Configure DynamoDB client for LocalStack or AWS
const isLocalStack = process.env.STAGE === 'local';

const dynamoDBClientConfig = isLocalStack
  ? {
      endpoint: getLocalStackEndpoint(),
      region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
      credentials: {
        accessKeyId: 'test',
        secretAccessKey: 'test',
      },
    }
  : {
      region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    };

// Create DynamoDB client
const client = new DynamoDBClient(dynamoDBClientConfig);

// Create DynamoDB Document client (simplified API)
export const dynamoDBClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// Export with the name used in other files
export const dynamodbDocumentClient = dynamoDBClient;

// Table names from environment variables
export const TABLE_NAMES = {
  users: process.env.USERS_TABLE_NAME || 'mufradat-users-local',
  vocabulary: process.env.VOCABULARY_TABLE_NAME || 'mufradat-vocabulary-local',
  progress: process.env.PROGRESS_TABLE_NAME || 'mufradat-progress-local',
  conjugations: process.env.CONJUGATIONS_TABLE_NAME || 'mufradat-conjugations-local',
  sessions: process.env.SESSIONS_TABLE_NAME || 'mufradat-sessions-local',
  otp: process.env.OTP_TABLE_NAME || 'mufradat-otp-local',
};

