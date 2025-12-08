/**
 * Get Review Queue Lambda
 * Returns words due for review for a user
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodbDocumentClient } from '../shared/dynamodb-client';
import { success, failure } from '../shared/response-utils';
import { getRecommendedSessionSize } from './spaced-repetition-engine';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.pathParameters?.userId;
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit || '20', 10);

    if (!userId) {
      return failure('User ID is required', 400);
    }

    const currentDate = new Date().toISOString();

    // Query progress table using ReviewQueueIndex GSI
    const result = await dynamodbDocumentClient.send(
      new QueryCommand({
        TableName: process.env.PROGRESS_TABLE_NAME,
        IndexName: 'ReviewQueueIndex',
        KeyConditionExpression: 'userId = :userId AND nextReviewDate <= :currentDate',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':currentDate': currentDate,
        },
        Limit: limit,
      })
    );

    const dueWords = result.Items || [];

    // Get recommended session size
    const recommendedSize = getRecommendedSessionSize(
      dueWords.length,
      limit,
      30 // Default 30 minutes
    );

    // Sort by priority (earlier review dates first, then by mastery level)
    const prioritized = dueWords.sort((a, b) => {
      const dateComparison = new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
      if (dateComparison !== 0) return dateComparison;
      return a.masteryLevel - b.masteryLevel; // Lower mastery first
    });

    return success({
      reviewQueue: prioritized.slice(0, recommendedSize),
      totalDue: dueWords.length,
      recommended: recommendedSize,
      metadata: {
        currentDate,
        userId,
      },
    });
  } catch (error: any) {
    console.error('Get review queue error:', error);
    return failure('Failed to get review queue');
  }
};

