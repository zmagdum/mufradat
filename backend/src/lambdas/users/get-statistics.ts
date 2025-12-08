/**
 * Get User Statistics Lambda Function
 * Retrieves authenticated user's learning statistics
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDBClient, TABLE_NAMES } from '../shared/dynamodb-client';
import { extractTokenFromHeader, verifyAccessToken } from '../shared/jwt-utils';
import { createSuccessResponse, ErrorResponses } from '../shared/response-utils';
import { UserProfile, WordProgress } from '../../shared/types';

interface UserStatistics {
  totalWordsLearned: number;
  masteredWords: number;
  wordsInProgress: number;
  currentStreak: number;
  longestStreak: number;
  studyGoal: number;
  progressPercentage: number;
  recentProgress: {
    date: string;
    wordsReviewed: number;
    accuracy: number;
  }[];
  difficultyDistribution: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
}

/**
 * Lambda handler for getting user statistics
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('Get statistics request received', { path: event.path });

  try {
    // Extract and verify token
    const token = extractTokenFromHeader(event.headers.Authorization);
    if (!token) {
      return ErrorResponses.unauthorized('No token provided');
    }

    let tokenPayload;
    try {
      tokenPayload = verifyAccessToken(token);
    } catch (error: any) {
      return ErrorResponses.unauthorized(error.message);
    }

    // Get user profile
    const userResult = await dynamoDBClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.users,
        Key: { userId: tokenPayload.userId },
      })
    );

    if (!userResult.Item) {
      return ErrorResponses.notFound('User');
    }

    const user = userResult.Item as UserProfile;

    // Get user's word progress
    const progressResult = await dynamoDBClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.progress,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': tokenPayload.userId,
        },
      })
    );

    const progressItems = (progressResult.Items || []) as WordProgress[];

    // Calculate statistics from progress data
    const totalWordsLearned = progressItems.filter((item) => item.masteryLevel > 0).length;
    const masteredWords = progressItems.filter((item) => item.masteryLevel >= 5).length;
    const wordsInProgress = progressItems.filter(
      (item) => item.masteryLevel > 0 && item.masteryLevel < 5
    ).length;

    // Calculate streaks from progress items (using streakDays)
    const currentStreak = progressItems.length > 0 
      ? Math.max(...progressItems.map(item => item.streakDays || 0), 0)
      : 0;
    const longestStreak = currentStreak; // For now, use current streak as longest

    const difficultyDistribution = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    };

    // Note: We'd need to join with vocabulary table to get difficulty
    // For now, return placeholder data

    const statistics: UserStatistics = {
      totalWordsLearned,
      masteredWords,
      wordsInProgress,
      currentStreak,
      longestStreak,
      studyGoal: user.studyGoal || 10,
      progressPercentage:
        (user.studyGoal || 10) > 0 ? (totalWordsLearned / (user.studyGoal || 10)) * 100 : 0,
      recentProgress: [], // Would need sessions table data
      difficultyDistribution,
    };

    console.log('Statistics retrieved successfully', { userId: user.userId });

    return createSuccessResponse(statistics);
  } catch (error: any) {
    console.error('Get statistics error:', error);
    return ErrorResponses.internalError('Failed to get user statistics');
  }
}

