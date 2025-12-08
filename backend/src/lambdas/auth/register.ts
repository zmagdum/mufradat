/**
 * User Registration Lambda Function
 * Handles user sign-up with email and password
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { dynamoDBClient, TABLE_NAMES } from '../shared/dynamodb-client';
import { hashPassword, validatePasswordStrength } from '../shared/password-utils';
import { generateOtp, storeOtp } from '../shared/otp-utils';
import { sendOtpEmail } from '../shared/email-service';
import {
  createSuccessResponse,
  ErrorResponses,
  parseBody,
  validateRequiredFields,
} from '../shared/response-utils';
import { validateUserProfile } from '../../shared/validators';
import { UserProfile } from '../../shared/types';

interface RegisterRequest {
  email: string;
  password: string;
  givenName?: string;
  familyName?: string;
  studyGoal?: number;
}

interface RegisterResponse {
  message: string;
  email: string;
  emailVerified: boolean;
}

/**
 * Lambda handler for user registration
 */
export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  // Enhanced logging for debugging
  console.error('[REGISTER] Registration request received');
  console.error('[REGISTER] Full Event:', JSON.stringify(event, null, 2));
  console.error('[REGISTER] Event keys:', Object.keys(event));
  
  // Validate event structure
  if (!event || typeof event !== 'object') {
    console.error('[REGISTER] Invalid event structure:', event);
    return ErrorResponses.internalError('Invalid event structure', undefined);
  }
  
  // Check if event has required fields (LocalStack sometimes sends empty events)
  if (!event.httpMethod && !event.path && !event.headers && !event.body) {
    console.error('[REGISTER] Empty event received - this may be a LocalStack API Gateway issue');
    console.error('[REGISTER] Event type:', typeof event);
    console.error('[REGISTER] Event keys:', Object.keys(event || {}));
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Invalid request: Event structure is empty. This may be a LocalStack API Gateway configuration issue.',
        details: 'The Lambda received an empty event object. Please check API Gateway integration configuration.',
      }),
    };
  }
  
  // Extract origin from headers for CORS (with defensive checks)
  const origin = event.headers?.origin || event.headers?.Origin || '*';

  try {
    // Parse and validate request body
    const body = parseBody<RegisterRequest>(event.body);
    if (!body) {
      return ErrorResponses.badRequest('Request body is required', undefined, origin);
    }

    const validation = validateRequiredFields(body, ['email', 'password']);
    if (!validation.valid) {
      return ErrorResponses.validationError({
        missing: validation.missing,
      }, origin);
    }

    const { email, password, givenName, familyName, studyGoal } = body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ErrorResponses.badRequest('Invalid email format', undefined, origin);
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return ErrorResponses.validationError({
        password: passwordValidation.errors,
      }, origin);
    }

    // Check if user already exists (query by email using GSI)
    const existingUserResult = await dynamoDBClient.send(
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

    const existingUser = existingUserResult.Items?.[0];

    if (existingUser) {
      return ErrorResponses.conflict('User with this email already exists', origin);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user profile
    const userId = uuidv4();
    const now = new Date().toISOString();

    const userProfile: UserProfile = {
      userId,
      email: email.toLowerCase(),
      username: givenName || undefined, // Use givenName as username if provided
      studyGoal: studyGoal || 10,
      learningModalities: ['visual', 'audio', 'contextual'],
      createdAt: now,
      updatedAt: now,
    };
    
    // Store password hash separately (not in UserProfile type)
    const userWithPassword = {
      ...userProfile,
      passwordHash,
    };

    // Validate user profile
    const profileValidation = validateUserProfile(userProfile);
    if (profileValidation) {
      return ErrorResponses.validationError({
        profile: profileValidation,
      }, origin);
    }

    // Store user in DynamoDB (include passwordHash in stored item)
    // TEMPORARILY: Mark email as verified immediately (OTP disabled for testing)
    // TODO: Re-enable OTP verification once system is working
    const userWithPasswordAndVerification = {
      ...userWithPassword,
      emailVerified: true, // Changed from false to true - OTP disabled
    };

    await dynamoDBClient.send(
      new PutCommand({
        TableName: TABLE_NAMES.users,
        Item: userWithPasswordAndVerification,
        ConditionExpression: 'attribute_not_exists(userId)',
      })
    );

    // TEMPORARILY DISABLED: OTP generation and email sending
    // TODO: Re-enable once system is working
    /*
    // Generate and store OTP
    const otp = generateOtp();
    await storeOtp(email.toLowerCase(), otp, 'email_verification');

    // Send OTP email
    try {
      await sendOtpEmail(email.toLowerCase(), otp);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      // Don't fail registration if email fails - user can request resend
    }
    */

    const response: RegisterResponse = {
      message: 'Registration successful. You can now login.', // Updated message
      email: email.toLowerCase(),
      emailVerified: true, // Changed from false to true
    };

    console.error('[REGISTER] User registered successfully', { userId, email });

    const _response = createSuccessResponse(response, 201, origin);
    console.error('[REGISTER] Returning success response:', JSON.stringify(_response, null, 2));
    return _response;
  } catch (error: any) {
    console.error('[REGISTER] Registration error:', error);
    console.error('[REGISTER] Error stack:', error.stack);

    if (error.name === 'ConditionalCheckFailedException') {
      return ErrorResponses.conflict('User already exists', origin);
    }

    return ErrorResponses.internalError('Failed to register user', origin);
  }
}

