/**
 * Search Vocabulary Words Lambda
 * Searches vocabulary words by Arabic text, transliteration, or translation
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodbDocumentClient } from '../shared/dynamodb-client';
import { success, failure } from '../shared/response-utils';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const searchTerm = queryParams.q || '';
    const limit = parseInt(queryParams.limit || '20', 10);

    if (!searchTerm || searchTerm.length < 2) {
      return failure('Search term must be at least 2 characters', 400);
    }

    // For now, use scan with filter expression
    // In production, consider using ElasticSearch or DynamoDB Streams + Lambda for better search
    const result = await dynamodbDocumentClient.send(
      new ScanCommand({
        TableName: process.env.VOCABULARY_TABLE_NAME,
        FilterExpression:
          'contains(arabicText, :term) OR contains(transliteration, :term) OR contains(translation, :term)',
        ExpressionAttributeValues: {
          ':term': searchTerm,
        },
        Limit: limit,
      })
    );

    return success({
      words: result.Items || [],
      count: result.Items?.length || 0,
      searchTerm,
    });
  } catch (error: any) {
    console.error('Search words error:', error);
    return failure('Failed to search vocabulary words');
  }
};

