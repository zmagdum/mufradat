/**
 * Get Recommendations Lambda
 * Returns personalized word recommendations based on user patterns
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { QueryCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodbDocumentClient } from '../shared/dynamodb-client';
import { success, failure } from '../shared/response-utils';
import { getCachedData, setCachedData } from '../shared/redis-client';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.pathParameters?.userId;
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit || '10', 10);

    if (!userId) {
      return failure('User ID is required', 400);
    }

    // Try cache first
    const cacheKey = `recommendations:${userId}`;
    const cached = await getCachedData(cacheKey);
    if (cached) {
      return success({ recommendations: cached.slice(0, limit), cached: true });
    }

    // Get user's learning pattern
    const userResult = await dynamodbDocumentClient.send(
      new QueryCommand({
        TableName: process.env.USERS_TABLE_NAME,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId },
      })
    );

    const user = userResult.Items?.[0];
    if (!user) {
      return failure('User not found', 404);
    }

    // Get user's progress
    const progressResult = await dynamodbDocumentClient.send(
      new QueryCommand({
        TableName: process.env.PROGRESS_TABLE_NAME,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: { ':userId': userId },
      })
    );

    const learnedWordIds = new Set((progressResult.Items || []).map(p => p.wordId));

    // Get all available words
    const wordsResult = await dynamodbDocumentClient.send(
      new ScanCommand({
        TableName: process.env.VOCABULARY_TABLE_NAME,
        Limit: 100,
      })
    );

    const allWords = wordsResult.Items || [];

    // Filter out already learned words
    const availableWords = allWords.filter(w => !learnedWordIds.has(w.wordId));

    // Score and rank words based on user preferences
    const scoredWords = availableWords.map((word: any) => ({
      ...word,
      score: calculateRecommendationScore(word, user, progressResult.Items || []),
    }));

    // Sort by score (highest first)
    scoredWords.sort((a: any, b: any) => b.score - a.score);

    const recommendations = scoredWords.slice(0, limit);

    // Cache for 1 hour
    await setCachedData(cacheKey, recommendations, 3600);

    return success({
      recommendations,
      total: availableWords.length,
      cached: false,
    });
  } catch (error: any) {
    console.error('Get recommendations error:', error);
    return failure('Failed to get recommendations');
  }
};

/**
 * Calculate recommendation score for a word
 */
function calculateRecommendationScore(word: any, user: any, progress: any[]): number {
  let score = 0;

  // Base score from frequency (more common words scored higher)
  score += (word.frequency || 0) * 0.3;

  // Difficulty match (prefer words matching user's level)
  const userLevel = calculateUserLevel(progress);
  if (word.difficulty === userLevel) {
    score += 20;
  } else if (
    (word.difficulty === 'beginner' && userLevel === 'intermediate') ||
    (word.difficulty === 'intermediate' && userLevel === 'advanced')
  ) {
    score += 10;
  }

  // Word type diversity (prefer less learned types)
  const learnedTypes = progress.map(p => p.wordType);
  const typeCount = learnedTypes.filter(t => t === word.wordType).length;
  score -= typeCount * 2;

  // Random factor for variety
  score += Math.random() * 5;

  return score;
}

/**
 * Calculate user's current level
 */
function calculateUserLevel(progress: any[]): 'beginner' | 'intermediate' | 'advanced' {
  if (progress.length < 20) return 'beginner';
  if (progress.length < 100) return 'intermediate';
  return 'advanced';
}

