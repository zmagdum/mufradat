/**
 * Email Verification Lambda Function
 * Verifies email using OTP code
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDBClient, TABLE_NAMES } from '../shared/dynamodb-client';
import { verifyOtp } from '../shared/otp-utils';
import { generateTokenPair } from '../shared/jwt-utils';
import {
  createSuccessResponse,
  ErrorResponses,
  parseBody,
  validateRequiredFields,
} from '../shared/response-utils';
import { UserProfile } from '../../shared/types';

interface VerifyEmailRequest {
  email: string;
  otp: string;
}

interface VerifyEmailResponse {
  user: UserProfile;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  emailVerified: boolean;
}

/**
 * Lambda handler for email verification
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('Email verification request received', { path: event.path });

  // Extract origin from headers for CORS
  const origin = event.headers.origin || event.headers.Origin;

  try {
    // Parse and validate request body
    const body = parseBody<VerifyEmailRequest>(event.body);
    if (!body) {
      return ErrorResponses.badRequest('Request body is required', undefined, origin);
    }

    const validation = validateRequiredFields(body, ['email', 'otp']);
    if (!validation.valid) {
      return ErrorResponses.validationError({
        missing: validation.missing,
      }, origin);
    }

    const { email, otp } = body;

    // Verify OTP
    const isValidOtp = await verifyOtp(email.toLowerCase(), otp, 'email_verification');
    if (!isValidOtp) {
      return ErrorResponses.unauthorized('Invalid or expired verification code', origin);
    }

    // Get user from DynamoDB (query by email using GSI)
    const result = await dynamoDBClient.send(
      new QueryCommand({
        TableName: TABLE_NAMES.users,
        IndexName: 'EmailIndex',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: {
          ':email': email.toLowerCase(),
        },
        Limit: 1,
      })
    );

    if (!result.Items || result.Items.length === 0) {
      return ErrorResponses.notFound('User not found', origin);
    }

    const user = result.Items[0] as UserProfile & { passwordHash?: string; emailVerified?: boolean };

    // Update user to mark email as verified
    await dynamoDBClient.send(
      new UpdateCommand({
        TableName: TABLE_NAMES.users,
        Key: { userId: user.userId },
        UpdateExpression: 'SET emailVerified = :verified, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':verified': true,
          ':updatedAt': new Date().toISOString(),
        },
      })
    );

    // Generate JWT tokens
    const tokens = generateTokenPair(user.userId, user.email);

    // Remove sensitive data from response
    const { passwordHash: _, emailVerified: __, ...userWithoutSensitive } = user;

    const response: VerifyEmailResponse = {
      user: {
        ...userWithoutSensitive,
        emailVerified: true,
      } as UserProfile,
      tokens,
      emailVerified: true,
    };

    console.log('Email verified successfully', { userId: user.userId, email: user.email });

    return createSuccessResponse(response, 200, origin);
  } catch (error: any) {
    console.error('Email verification error:', error);
    return ErrorResponses.internalError('Failed to verify email', origin);
  }
}

