/**
 * Get User Statistics Lambda
 * Calculates and returns comprehensive learning statistics
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodbDocumentClient } from '../shared/dynamodb-client';
import { success, failure } from '../shared/response-utils';
import { calculateStreak } from '../learning/spaced-repetition-engine';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.pathParameters?.userId;

    if (!userId) {
      return failure('User ID is required', 400);
    }

    // Get all progress records for user
    const progressResult = await dynamodbDocumentClient.send(
      new QueryCommand({
        TableName: process.env.PROGRESS_TABLE_NAME,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId,
        },
      })
    );

    const progressRecords = progressResult.Items || [];

    // Get recent sessions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessionsResult = await dynamodbDocumentClient.send(
      new QueryCommand({
        TableName: process.env.SESSIONS_TABLE_NAME,
        IndexName: 'DateIndex',
        KeyConditionExpression: 'userId = :userId AND startTime >= :thirtyDaysAgo',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':thirtyDaysAgo': thirtyDaysAgo.toISOString(),
        },
      })
    );

    const sessions = sessionsResult.Items || [];

    // Calculate statistics
    const totalWordsLearned = progressRecords.length;
    const wordsDueForReview = progressRecords.filter(
      (p) => new Date(p.nextReviewDate) <= new Date()
    ).length;

    // Mastery level distribution
    const masteryDistribution = {
      beginner: progressRecords.filter((p) => p.masteryLevel < 20).length,
      learning: progressRecords.filter((p) => p.masteryLevel >= 20 && p.masteryLevel < 50).length,
      familiar: progressRecords.filter((p) => p.masteryLevel >= 50 && p.masteryLevel < 75).length,
      proficient: progressRecords.filter((p) => p.masteryLevel >= 75 && p.masteryLevel < 90).length,
      mastered: progressRecords.filter((p) => p.masteryLevel >= 90).length,
    };

    // Calculate streak
    const reviewDates = sessions.map((s) => s.startTime);
    const currentStreak = calculateStreak(reviewDates);

    // Calculate longest streak (simplified - would need historical data)
    const longestStreak = currentStreak; // TODO: Track historical streaks

    // Last 7 days progress
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const daySessions = sessions.filter((s) => s.startTime.startsWith(dateStr));
      const newWords = daySessions.reduce((sum, s) => sum + (s.newWordsLearned || 0), 0);
      const reviewed = daySessions.reduce((sum, s) => sum + (s.totalReviews || 0), 0);

      last7Days.push({
        date: dateStr,
        newWords,
        reviewedWords: reviewed,
      });
    }

    // Total study time
    const totalStudyMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);

    const statistics = {
      totalWordsLearned,
      wordsDueForReview,
      currentStreak,
      longestStreak,
      masteryLevelDistribution: masteryDistribution,
      last7DaysProgress: last7Days,
      totalStudyTime: {
        minutes: totalStudyMinutes,
        hours: Math.round(totalStudyMinutes / 60 * 10) / 10,
      },
      averageSessionDuration: sessions.length > 0
        ? Math.round(totalStudyMinutes / sessions.length)
        : 0,
      totalSessions: sessions.length,
    };

    return success({ statistics });
  } catch (error: any) {
    console.error('Get statistics error:', error);
    return failure('Failed to retrieve statistics');
  }
};

