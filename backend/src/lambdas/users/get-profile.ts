/**
 * Get User Profile Lambda Function
 * Retrieves authenticated user's profile
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDBClient, TABLE_NAMES } from '../shared/dynamodb-client';
import { extractTokenFromHeader, verifyAccessToken } from '../shared/jwt-utils';
import { createSuccessResponse, ErrorResponses } from '../shared/response-utils';
import { UserProfile } from '../../shared/types';

/**
 * Lambda handler for getting user profile
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('Get profile request received', { path: event.path });

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

    // Get user profile from DynamoDB
    const result = await dynamoDBClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.users,
        Key: { userId: tokenPayload.userId },
      })
    );

    if (!result.Item) {
      return ErrorResponses.notFound('User');
    }

    // DynamoDB result may include passwordHash, but UserProfile type doesn't
    const user = result.Item as UserProfile & { passwordHash?: string };

    // Remove sensitive data
    const { passwordHash: _, ...userWithoutPassword } = user;

    console.log('Profile retrieved successfully', { userId: user.userId });

    return createSuccessResponse(userWithoutPassword);
  } catch (error: any) {
    console.error('Get profile error:', error);
    return ErrorResponses.internalError('Failed to get user profile');
  }
}

