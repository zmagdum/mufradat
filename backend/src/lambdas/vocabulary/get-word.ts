/**
 * Get Vocabulary Word Lambda
 * Retrieves a single vocabulary word by ID
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodbDocumentClient } from '../shared/dynamodb-client';
import { success, failure } from '../shared/response-utils';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const wordId = event.pathParameters?.wordId;

    if (!wordId) {
      return failure('Word ID is required', 400);
    }

    // Retrieve word from DynamoDB
    const result = await dynamodbDocumentClient.send(
      new GetCommand({
        TableName: process.env.VOCABULARY_TABLE_NAME,
        Key: { wordId },
      })
    );

    if (!result.Item) {
      return failure('Word not found', 404);
    }

    return success({ word: result.Item });
  } catch (error: any) {
    console.error('Get word error:', error);
    return failure('Failed to retrieve vocabulary word');
  }
};

