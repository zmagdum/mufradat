/**
 * Create Study Plan Lambda
 * Generates a personalized adaptive study plan
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodbDocumentClient } from '../shared/dynamodb-client';
import { success, failure } from '../shared/response-utils';
import { v4 as uuid } from 'uuid';

export interface StudyPlan {
  planId: string;
  userId: string;
  goal: string;
  targetDate: string;
  dailyWordTarget: number;
  weeklyReviewTarget: number;
  focusAreas: string[]; // difficulty levels or word types
  schedule: DailySchedule[];
  createdAt: string;
  updatedAt: string;
}

export interface DailySchedule {
  date: string;
  newWords: number;
  reviewWords: number;
  estimatedMinutes: number;
}

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const data = JSON.parse(event.body || '{}');
    const { userId, goal, targetDays, dailyWordTarget } = data;

    if (!userId || !goal) {
      return failure('Missing required fields: userId, goal', 400);
    }

    // Get user's current progress
    const progressResult = await dynamodbDocumentClient.send(
      new QueryCommand({
        TableName: process.env.PROGRESS_TABLE_NAME,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId },
      })
    );

    const currentProgress = progressResult.Items || [];

    // Calculate parameters
    const wordsLearned = currentProgress.length;
    const targetWords = calculateTargetWords(goal);
    const wordsRemaining = Math.max(0, targetWords - wordsLearned);
    const days = targetDays || 90; // Default 90 days
    const dailyTarget = dailyWordTarget || Math.ceil(wordsRemaining / days);

    // Generate schedule
    const schedule = generateSchedule(days, dailyTarget, currentProgress);

    // Determine focus areas based on current progress
    const focusAreas = determineFocusAreas(currentProgress);

    const studyPlan: StudyPlan = {
      planId: uuid(),
      userId,
      goal,
      targetDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
      dailyWordTarget: dailyTarget,
      weeklyReviewTarget: Math.ceil(wordsLearned / 7),
      focusAreas,
      schedule: schedule.slice(0, 7), // Show next 7 days
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store study plan (in a real app, you'd have a StudyPlans table)
    // For now, store in user metadata
    await dynamodbDocumentClient.send(
      new UpdateCommand({
        TableName: process.env.USERS_TABLE_NAME,
        Key: { userId },
        UpdateExpression: 'SET currentStudyPlan = :plan',
        ExpressionAttributeValues: {
          ':plan': studyPlan,
        },
      })
    );

    return success({
      studyPlan,
      summary: {
        currentWords: wordsLearned,
        targetWords,
        wordsRemaining,
        estimatedDays: days,
        completionDate: studyPlan.targetDate,
      },
    }, 201);
  } catch (error: any) {
    console.error('Create study plan error:', error);
    return failure('Failed to create study plan');
  }
};

/**
 * Calculate target word count based on goal
 */
function calculateTargetWords(goal: string): number {
  const goalMap: Record<string, number> = {
    'basic': 300,
    'intermediate': 1000,
    'advanced': 2000,
    'fluent': 5000,
  };

  return goalMap[goal.toLowerCase()] || 1000;
}

/**
 * Generate daily schedule
 */
function generateSchedule(
  days: number,
  dailyTarget: number,
  currentProgress: any[]
): DailySchedule[] {
  const schedule: DailySchedule[] = [];
  const today = new Date();

  // Get words due for review each day
  const reviewCounts = calculateReviewDistribution(currentProgress, days);

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    const reviewWords = reviewCounts[i] || 0;
    const newWords = Math.min(dailyTarget, Math.max(5, dailyTarget - Math.floor(reviewWords / 2)));

    schedule.push({
      date: date.toISOString().split('T')[0],
      newWords,
      reviewWords,
      estimatedMinutes: Math.ceil((newWords * 2 + reviewWords * 1) * 1.5), // 1.5 min per word
    });
  }

  return schedule;
}

/**
 * Calculate how many words will be due for review each day
 */
function calculateReviewDistribution(progress: any[], days: number): number[] {
  const distribution = new Array(days).fill(0);

  for (const p of progress) {
    const reviewDate = new Date(p.nextReviewDate);
    const dayIndex = Math.floor((reviewDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));

    if (dayIndex >= 0 && dayIndex < days) {
      distribution[dayIndex]++;
    }
  }

  return distribution;
}

/**
 * Determine focus areas based on current progress
 */
function determineFocusAreas(progress: any[]): string[] {
  const focusAreas: string[] = [];

  // Analyze mastery distribution
  const lowMastery = progress.filter(p => p.masteryLevel < 50).length;
  const totalProgress = progress.length;

  if (totalProgress === 0) {
    focusAreas.push('beginner');
  } else if (lowMastery / totalProgress > 0.5) {
    focusAreas.push('review-weak-words');
  }

  // Analyze word type distribution
  const wordTypes: Record<string, number> = {};
  for (const p of progress) {
    wordTypes[p.wordType] = (wordTypes[p.wordType] || 0) + 1;
  }

  const sortedTypes = Object.entries(wordTypes).sort((a, b) => a[1] - b[1]);
  if (sortedTypes.length > 0 && sortedTypes[0][1] < 10) {
    focusAreas.push(`learn-more-${sortedTypes[0][0]}s`);
  }

  return focusAreas;
}

