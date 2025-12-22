/**
 * Update User Profile Lambda Function
 * Updates authenticated user's profile information
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDBClient, TABLE_NAMES } from '../shared/dynamodb-client';
import { extractTokenFromHeader, verifyAccessToken } from '../shared/jwt-utils';
import {
  createSuccessResponse,
  ErrorResponses,
  parseBody,
} from '../shared/response-utils';
import { UserProfile } from '../../shared/types';

interface UpdateProfileRequest {
  username?: string;
  givenName?: string;
  familyName?: string;
  fullName?: string;
  dateOfBirth?: string;
  studyGoal?: number;
  learningModalities?: ('visual' | 'audio' | 'contextual' | 'associative')[];
  preferredDifficulty?: 'beginner' | 'intermediate' | 'advanced';
  dailyGoalMinutes?: number;
  notificationsEnabled?: boolean;
  selectedBookId?: string;
  preferredLanguage?: string;
}

/**
 * Lambda handler for updating user profile
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('Update profile request received', { path: event.path });

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

    // Parse request body
    const body = parseBody<UpdateProfileRequest>(event.body);
    if (!body || Object.keys(body).length === 0) {
      return ErrorResponses.badRequest('Request body with updates is required');
    }

    // Build update expression
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Helper to add update expression
    const addUpdate = (field: string, value: any) => {
      const placeholder = `#${field}`;
      const valuePlaceholder = `:${field}`;
      updateExpressions.push(`${placeholder} = ${valuePlaceholder}`);
      expressionAttributeNames[placeholder] = field;
      expressionAttributeValues[valuePlaceholder] = value;
    };

    // Add updatable fields
    if (body.givenName !== undefined) addUpdate('givenName', body.givenName);
    if (body.familyName !== undefined) addUpdate('familyName', body.familyName);
    if (body.fullName !== undefined) addUpdate('fullName', body.fullName);
    if (body.dateOfBirth !== undefined) {
      // Validate date format (ISO 8601)
      if (body.dateOfBirth && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(body.dateOfBirth)) {
        return ErrorResponses.badRequest('Invalid date format. Use ISO 8601 format.');
      }
      addUpdate('dateOfBirth', body.dateOfBirth);
    }
    if (body.studyGoal !== undefined) {
      if (body.studyGoal < 1 || body.studyGoal > 100) {
        return ErrorResponses.badRequest('Study goal must be between 1 and 100');
      }
      addUpdate('studyGoal', body.studyGoal);
    }
    if (body.learningModalities !== undefined) {
      addUpdate('learningModalities', body.learningModalities);
    }
    if (body.preferredDifficulty !== undefined) {
      addUpdate('preferredDifficulty', body.preferredDifficulty);
    }
    if (body.dailyGoalMinutes !== undefined) {
      if (body.dailyGoalMinutes < 5 || body.dailyGoalMinutes > 180) {
        return ErrorResponses.badRequest('Daily goal must be between 5 and 180 minutes');
      }
      addUpdate('dailyGoalMinutes', body.dailyGoalMinutes);
    }
    if (body.notificationsEnabled !== undefined) {
      addUpdate('notificationsEnabled', body.notificationsEnabled);
    }
    if (body.selectedBookId !== undefined) {
      addUpdate('selectedBookId', body.selectedBookId);
    }
    if (body.preferredLanguage !== undefined) {
      addUpdate('preferredLanguage', body.preferredLanguage);
    }

    // Always update timestamp
    addUpdate('updatedAt', new Date().toISOString());

    if (updateExpressions.length === 0) {
      return ErrorResponses.badRequest('No valid fields to update');
    }

    // Update user profile in DynamoDB
    const result = await dynamoDBClient.send(
      new UpdateCommand({
        TableName: TABLE_NAMES.users,
        Key: { userId: tokenPayload.userId },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    if (!result.Attributes) {
      return ErrorResponses.notFound('User');
    }

    // DynamoDB result may include passwordHash, but UserProfile type doesn't
    const updatedUser = result.Attributes as UserProfile & { passwordHash?: string };

    // Remove sensitive data
    const { passwordHash: _, ...userWithoutPassword } = updatedUser;

    console.log('Profile updated successfully', { userId: tokenPayload.userId });

    return createSuccessResponse(userWithoutPassword);
  } catch (error: any) {
    console.error('Update profile error:', error);
    return ErrorResponses.internalError('Failed to update user profile');
  }
}

