/**
 * Get Study Plan Lambda
 * Retrieves user's current study plan with progress
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodbDocumentClient } from '../shared/dynamodb-client';
import { success, failure } from '../shared/response-utils';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.pathParameters?.userId;

    if (!userId) {
      return failure('User ID is required', 400);
    }

    // Get user with study plan
    const userResult = await dynamodbDocumentClient.send(
      new GetCommand({
        TableName: process.env.USERS_TABLE_NAME,
        Key: { userId },
      })
    );

    const user = userResult.Item;
    if (!user) {
      return failure('User not found', 404);
    }

    const studyPlan = user.currentStudyPlan;
    if (!studyPlan) {
      return failure('No active study plan found', 404);
    }

    // Get current progress
    const progressResult = await dynamodbDocumentClient.send(
      new QueryCommand({
        TableName: process.env.PROGRESS_TABLE_NAME,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId },
      })
    );

    const progress = progressResult.Items || [];

    // Calculate completion percentage
    const targetWords = calculateTargetFromGoal(studyPlan.goal);
    const completionPercentage = Math.min(100, Math.round((progress.length / targetWords) * 100));

    // Calculate days remaining
    const targetDate = new Date(studyPlan.targetDate);
    const today = new Date();
    const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)));

    // Check today's progress
    const todayStr = today.toISOString().split('T')[0];
    const todaySchedule = studyPlan.schedule.find((s: any) => s.date === todayStr);

    return success({
      studyPlan,
      progress: {
        completionPercentage,
        wordsLearned: progress.length,
        targetWords,
        daysRemaining,
        onTrack: progress.length >= studyPlan.dailyWordTarget * (90 - daysRemaining),
      },
      today: todaySchedule || {
        date: todayStr,
        newWords: studyPlan.dailyWordTarget,
        reviewWords: 0,
        estimatedMinutes: studyPlan.dailyWordTarget * 2,
      },
    });
  } catch (error: any) {
    console.error('Get study plan error:', error);
    return failure('Failed to get study plan');
  }
};

/**
 * Calculate target word count from goal
 */
function calculateTargetFromGoal(goal: string): number {
  const goalMap: Record<string, number> = {
    'basic': 300,
    'intermediate': 1000,
    'advanced': 2000,
    'fluent': 5000,
  };

  return goalMap[goal?.toLowerCase()] || 1000;
}

