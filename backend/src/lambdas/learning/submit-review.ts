/**
 * Submit Review Lambda
 * Records a word review and updates SRS state
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodbDocumentClient } from '../shared/dynamodb-client';
import { success, failure } from '../shared/response-utils';
import { calculateNextReview, SpacedRepetitionState, ReviewResult } from './spaced-repetition-engine';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const data = JSON.parse(event.body || '{}');
    const { userId, wordId, quality, timeSpent, hintsUsed } = data;

    // Validate input
    if (!userId || !wordId || quality === undefined) {
      return failure('Missing required fields: userId, wordId, quality', 400);
    }

    if (quality < 0 || quality > 5) {
      return failure('Quality must be between 0 and 5', 400);
    }

    // Get current progress state
    const result = await dynamodbDocumentClient.send(
      new GetCommand({
        TableName: process.env.PROGRESS_TABLE_NAME,
        Key: { userId, wordId },
      })
    );

    if (!result.Item) {
      return failure('Progress record not found', 404);
    }

    const currentState: SpacedRepetitionState = {
      easeFactor: result.Item.easeFactor,
      interval: result.Item.interval,
      repetitions: result.Item.repetitions,
      nextReviewDate: result.Item.nextReviewDate,
      lastReviewDate: result.Item.lastReviewDate,
      masteryLevel: result.Item.masteryLevel,
    };

    // Get user personalization factors (if available)
    const personalization = result.Item.personalization;

    // Calculate next review state
    const reviewResult: ReviewResult = {
      quality,
      timeSpent: timeSpent || 0,
      hintsUsed: hintsUsed || false,
    };

    const newState = calculateNextReview(currentState, reviewResult, personalization);

    // Update progress in DynamoDB
    await dynamodbDocumentClient.send(
      new UpdateCommand({
        TableName: process.env.PROGRESS_TABLE_NAME,
        Key: { userId, wordId },
        UpdateExpression: `
          SET easeFactor = :ef,
              #interval = :interval,
              repetitions = :reps,
              nextReviewDate = :nextDate,
              lastReviewDate = :lastDate,
              masteryLevel = :mastery,
              totalReviews = totalReviews + :one,
              updatedAt = :updatedAt
        `,
        ExpressionAttributeNames: {
          '#interval': 'interval', // 'interval' is a reserved word
        },
        ExpressionAttributeValues: {
          ':ef': newState.easeFactor,
          ':interval': newState.interval,
          ':reps': newState.repetitions,
          ':nextDate': newState.nextReviewDate,
          ':lastDate': newState.lastReviewDate,
          ':mastery': newState.masteryLevel,
          ':one': 1,
          ':updatedAt': new Date().toISOString(),
        },
      })
    );

    return success({
      message: 'Review submitted successfully',
      newState,
      masteryLevel: newState.masteryLevel,
      nextReviewIn: `${newState.interval} days`,
    });
  } catch (error: any) {
    console.error('Submit review error:', error);
    return failure('Failed to submit review');
  }
};

