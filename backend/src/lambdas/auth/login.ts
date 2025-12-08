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
  console.error('[LOGIN] Login request received');
  console.error('[LOGIN] Event:', JSON.stringify({
    path: event.path,
    method: event.httpMethod,
    body: event.body,
    headers: event.headers,
  }, null, 2));

  // Extract origin from headers for CORS (with defensive checks)
  const origin = event.headers?.origin || event.headers?.Origin || '*';

  try {
    // Parse and validate request body
    const body = parseBody<LoginRequest>(event.body);
    console.error('[LOGIN] Parsed body:', JSON.stringify(body));
    
    if (!body) {
      console.error('[LOGIN] No body found in request');
      return ErrorResponses.badRequest('Request body is required', undefined, origin);
    }

    const validation = validateRequiredFields(body, ['email', 'password']);
    if (!validation.valid) {
      console.error('[LOGIN] Validation failed:', validation);
      return ErrorResponses.validationError({
        missing: validation.missing,
      }, origin);
    }

    const { email, password } = body;
    console.error('[LOGIN] Attempting login for email:', email);

    // Query user by email using GSI
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
      // Use generic error message for security
      console.error('[LOGIN] User not found for email:', email);
      const errorResponse = ErrorResponses.unauthorized('Invalid email or password', origin);
      console.error('[LOGIN] Returning 401 response (user not found):', JSON.stringify({
        statusCode: errorResponse.statusCode,
        body: errorResponse.body,
      }));
      return errorResponse;
    }

    // User from DynamoDB includes passwordHash and emailVerified (not in UserProfile type)
    const userWithPassword = result.Items[0] as UserProfile & { 
      passwordHash: string;
      emailVerified?: boolean;
    };

    console.error('[LOGIN] User found:', { 
      userId: userWithPassword.userId, 
      email: userWithPassword.email,
      emailVerified: userWithPassword.emailVerified 
    });

    // TEMPORARILY DISABLED: Email verification check
    // TODO: Re-enable once OTP system is working
    /*
    // Check if email is verified
    if (!userWithPassword.emailVerified) {
      console.log('Email not verified for user:', userWithPassword.userId);
      return ErrorResponses.forbidden('Please verify your email before logging in. Check your inbox for the verification code.', origin);
    }
    */

    // Verify password
    console.error('[LOGIN] Verifying password...');
    
    // Check if passwordHash exists
    if (!userWithPassword.passwordHash) {
      console.error('[LOGIN] ERROR: User found but passwordHash is missing');
      return ErrorResponses.internalError('User account configuration error', origin);
    }
    
    const isValidPassword = await verifyPassword(password, userWithPassword.passwordHash);
    console.error('[LOGIN] Password verification result:', isValidPassword);
    
    if (!isValidPassword) {
      console.error('[LOGIN] Invalid password for user:', userWithPassword.userId);
      const errorResponse = ErrorResponses.unauthorized('Invalid email or password', origin);
      console.error('[LOGIN] Returning 401 response:', JSON.stringify({
        statusCode: errorResponse.statusCode,
        body: errorResponse.body,
      }));
      return errorResponse;
    }

    // Generate JWT tokens
    const tokens = generateTokenPair(userWithPassword.userId, userWithPassword.email);

    // Remove sensitive data from response (passwordHash not in UserProfile type)
    const { passwordHash: _, ...user } = userWithPassword;

    const response: LoginResponse = {
      user: user as UserProfile,
      tokens,
    };

    console.error('[LOGIN] User logged in successfully', { userId: user.userId, email: user.email });
    
    const successResponse = createSuccessResponse(response, 200, origin);
    console.error('[LOGIN] Returning success response:', JSON.stringify({
      statusCode: successResponse.statusCode,
      body: successResponse.body,
    }));
    return successResponse;
  } catch (error: any) {
    console.error('[LOGIN] Login error:', error);
    console.error('[LOGIN] Error stack:', error.stack);
    const errorResponse = ErrorResponses.internalError('Failed to authenticate user', origin);
    console.error('[LOGIN] Returning error response:', JSON.stringify({
      statusCode: errorResponse.statusCode,
      body: errorResponse.body,
    }));
    return errorResponse;
  }
}

