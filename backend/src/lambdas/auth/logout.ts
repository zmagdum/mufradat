/**
 * User Logout Lambda Function
 * Handles user logout (token invalidation would be done via blacklist in production)
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { extractTokenFromHeader, verifyAccessToken } from '../shared/jwt-utils';
import { createSuccessResponse, ErrorResponses } from '../shared/response-utils';

/**
 * Lambda handler for user logout
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('Logout request received', { path: event.path });

  try {
    // Extract and verify token
    const token = extractTokenFromHeader(event.headers.Authorization);
    if (!token) {
      return ErrorResponses.unauthorized('No token provided');
    }

    try {
      const tokenPayload = verifyAccessToken(token);
      
      // In a production environment, you would:
      // 1. Add the token to a blacklist (Redis/DynamoDB with TTL)
      // 2. Or use token versioning in the user profile
      // For now, we'll just acknowledge the logout

      console.log('User logged out successfully', { userId: tokenPayload.userId });

      return createSuccessResponse({
        message: 'Logged out successfully',
      });
    } catch (error: any) {
      // Even if token is invalid, return success for logout
      return createSuccessResponse({
        message: 'Logged out successfully',
      });
    }
  } catch (error: any) {
    console.error('Logout error:', error);
    return ErrorResponses.internalError('Failed to logout');
  }
}

