/**
 * Token Refresh Lambda Function
 * Handles refreshing access tokens using refresh tokens
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDBClient, TABLE_NAMES } from '../shared/dynamodb-client';
import { verifyRefreshToken, generateTokenPair } from '../shared/jwt-utils';
import {
  createSuccessResponse,
  ErrorResponses,
  parseBody,
  validateRequiredFields,
} from '../shared/response-utils';

interface RefreshRequest {
  refreshToken: string;
}

interface RefreshResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

/**
 * Lambda handler for token refresh
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('Token refresh request received', { path: event.path });

  // Extract origin from headers for CORS
  const origin = event.headers.origin || event.headers.Origin;

  try {
    // Parse and validate request body
    const body = parseBody<RefreshRequest>(event.body);
    if (!body) {
      return ErrorResponses.badRequest('Request body is required', undefined, origin);
    }

    const validation = validateRequiredFields(body, ['refreshToken']);
    if (!validation.valid) {
      return ErrorResponses.validationError({
        missing: validation.missing,
      }, origin);
    }

    const { refreshToken } = body;

    // Verify refresh token
    let tokenPayload;
    try {
      tokenPayload = verifyRefreshToken(refreshToken);
    } catch (error: any) {
      return ErrorResponses.unauthorized(error.message, origin);
    }

    // Verify user still exists
    const result = await dynamoDBClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.users,
        Key: { userId: tokenPayload.userId },
      })
    );

    if (!result.Item) {
      return ErrorResponses.unauthorized('User not found', origin);
    }

    // Generate new token pair
    const tokens = generateTokenPair(tokenPayload.userId, tokenPayload.email);

    const response: RefreshResponse = {
      tokens,
    };

    console.log('Tokens refreshed successfully', { userId: tokenPayload.userId });

    return createSuccessResponse(response, 200, origin);
  } catch (error: any) {
    console.error('Token refresh error:', error);
    return ErrorResponses.internalError('Failed to refresh tokens', origin);
  }
}

