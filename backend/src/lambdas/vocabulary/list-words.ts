/**
 * List Vocabulary Words Lambda
 * Lists vocabulary words with pagination and filtering
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodbDocumentClient } from '../shared/dynamodb-client';
import { success, failure } from '../shared/response-utils';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit || '20', 10);
    const lastEvaluatedKey = queryParams.lastKey ? JSON.parse(decodeURIComponent(queryParams.lastKey)) : undefined;
    
    // Filters
    const difficulty = queryParams.difficulty;
    const wordType = queryParams.wordType;

    let result;

    // If filtering by difficulty, use DifficultyIndex GSI
    if (difficulty) {
      result = await dynamodbDocumentClient.send(
        new QueryCommand({
          TableName: process.env.VOCABULARY_TABLE_NAME,
          IndexName: 'DifficultyIndex',
          KeyConditionExpression: 'difficulty = :difficulty',
          ExpressionAttributeValues: {
            ':difficulty': difficulty,
          },
          Limit: limit,
          ExclusiveStartKey: lastEvaluatedKey,
          ScanIndexForward: false, // Most frequent first
        })
      );
    }
    // If filtering by wordType, use WordTypeIndex GSI
    else if (wordType) {
      result = await dynamodbDocumentClient.send(
        new QueryCommand({
          TableName: process.env.VOCABULARY_TABLE_NAME,
          IndexName: 'WordTypeIndex',
          KeyConditionExpression: 'wordType = :wordType',
          ExpressionAttributeValues: {
            ':wordType': wordType,
          },
          Limit: limit,
          ExclusiveStartKey: lastEvaluatedKey,
          ScanIndexForward: false, // Most frequent first
        })
      );
    }
    // Otherwise, scan the table
    else {
      result = await dynamodbDocumentClient.send(
        new ScanCommand({
          TableName: process.env.VOCABULARY_TABLE_NAME,
          Limit: limit,
          ExclusiveStartKey: lastEvaluatedKey,
        })
      );
    }

    // Prepare pagination token
    const nextKey = result.LastEvaluatedKey
      ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
      : null;

    return success({
      words: result.Items || [],
      count: result.Items?.length || 0,
      nextKey,
    });
  } catch (error: any) {
    console.error('List words error:', error);
    return failure('Failed to list vocabulary words');
  }
};

