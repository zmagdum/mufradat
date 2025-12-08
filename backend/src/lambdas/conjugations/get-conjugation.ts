/**
 * Get Verb Conjugation Lambda
 * Retrieves verb conjugation data with Redis caching
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodbDocumentClient } from '../shared/dynamodb-client';
import { success, failure } from '../shared/response-utils';
import { getCachedData, setCachedData } from '../shared/redis-client';

const CACHE_TTL = 3600; // 1 hour

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const verbId = event.pathParameters?.verbId;

    if (!verbId) {
      return failure('Verb ID is required', 400);
    }

    // Try to get from cache first
    const cacheKey = `conjugation:${verbId}`;
    const cachedData = await getCachedData(cacheKey);

    if (cachedData) {
      return success({ conjugation: cachedData, cached: true });
    }

    // If not in cache, get from DynamoDB
    const result = await dynamodbDocumentClient.send(
      new GetCommand({
        TableName: process.env.CONJUGATIONS_TABLE_NAME,
        Key: { verbId },
      })
    );

    if (!result.Item) {
      return failure('Conjugation not found', 404);
    }

    // Store in cache
    await setCachedData(cacheKey, result.Item, CACHE_TTL);

    return success({ conjugation: result.Item, cached: false });
  } catch (error: any) {
    console.error('Get conjugation error:', error);
    return failure('Failed to retrieve conjugation');
  }
};

