/**
 * Delete Vocabulary Word Lambda
 * Deletes a vocabulary word from DynamoDB
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodbDocumentClient } from '../shared/dynamodb-client';
import { success, failure } from '../shared/response-utils';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const wordId = event.pathParameters?.wordId;

    if (!wordId) {
      return failure('Word ID is required', 400);
    }

    // Delete from DynamoDB
    await dynamodbDocumentClient.send(
      new DeleteCommand({
        TableName: process.env.VOCABULARY_TABLE_NAME,
        Key: { wordId },
        // Return old values to verify deletion
        ReturnValues: 'ALL_OLD',
      })
    );

    return success({ message: 'Word deleted successfully', wordId });
  } catch (error: any) {
    console.error('Delete word error:', error);
    return failure('Failed to delete vocabulary word');
  }
};

