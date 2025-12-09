/**
 * User Login Lambda Function
 * Handles user authentication with email and password
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDBClient, TABLE_NAMES } from '../shared/dynamodb-client';
import { generateTokenPair } from '../shared/jwt-utils';
import { verifyPassword } from '../shared/password-utils';
import {
  createSuccessResponse,
  ErrorResponses,
  parseBody,
  validateRequiredFields,
} from '../shared/response-utils';
import { UserProfile } from '../../shared/types';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  user: UserProfile;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

/**
 * Lambda handler for user login
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  // Extract origin from headers for CORS
  const origin = event.headers?.origin || event.headers?.Origin || '*';

  try {
    // Parse and validate request body
    const body = parseBody<LoginRequest>(event.body);
    if (!body) {
      return ErrorResponses.badRequest('Request body is required', undefined, origin);
    }

    const validation = validateRequiredFields(body, ['email', 'password']);
    if (!validation.valid) {
      return ErrorResponses.validationError({
        missing: validation.missing,
      }, origin);
    }

    const { email, password } = body;

    // Query user by email using GSI
    let result;
    try {
      result = await dynamoDBClient.send(
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
    } catch (dbError: any) {
      if (dbError.name === 'ResourceNotFoundException' || dbError.code === 'ResourceNotFoundException') {
        return ErrorResponses.unauthorized('Invalid email or password', origin);
      }
      throw dbError;
    }

    if (!result.Items || result.Items.length === 0) {
      return ErrorResponses.unauthorized('Invalid email or password', origin);
    }

    // User from DynamoDB includes passwordHash and emailVerified (not in UserProfile type)
    const userWithPassword = result.Items[0] as UserProfile & { 
      passwordHash: string;
      emailVerified?: boolean;
    };

    // Email verification check (configurable via environment variable)
    const requireEmailVerification = process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
    
    if (requireEmailVerification && !userWithPassword.emailVerified) {
      return ErrorResponses.forbidden('Please verify your email before logging in. Check your inbox for the verification code.', origin);
    }

    // Verify password
    if (!userWithPassword.passwordHash) {
      return ErrorResponses.internalError('User account configuration error', origin);
    }
    
    const isValidPassword = await verifyPassword(password, userWithPassword.passwordHash);
    
    if (!isValidPassword) {
      return ErrorResponses.unauthorized('Invalid email or password', origin);
    }

    // Generate JWT tokens
    const tokens = generateTokenPair(userWithPassword.userId, userWithPassword.email);

    // Remove sensitive data from response (passwordHash not in UserProfile type)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash: _passwordHash, ...user } = userWithPassword;

    const response: LoginResponse = {
      user: user as UserProfile,
      tokens,
    };

    return createSuccessResponse(response, 200, origin);
  } catch (error: any) {
    console.error('Login error:', error);
    
    if (error.name === 'ResourceNotFoundException' || error.code === 'ResourceNotFoundException') {
      return ErrorResponses.unauthorized('Invalid email or password', origin);
    }
    
    return ErrorResponses.internalError('Failed to authenticate user', origin);
  }
}

