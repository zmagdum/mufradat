import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { hashPassword, generateUserId } from '../../utils/auth';
import { validateEmail, validatePassword } from '../../utils/validation';

const dynamodb = new DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || 'quranic-vocab-users';

interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Request body is required' }),
      };
    }

    const { email, password, displayName }: RegisterRequest = JSON.parse(event.body);

    // Validate input
    if (!validateEmail(email)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Invalid email format' }),
      };
    }

    if (!validatePassword(password)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ 
          error: 'Password must be at least 8 characters long and contain uppercase, lowercase, and number' 
        }),
      };
    }

    if (!displayName || displayName.trim().length < 2) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Display name must be at least 2 characters long' }),
      };
    }

    // Check if user already exists
    const existingUser = await dynamodb.get({
      TableName: USERS_TABLE,
      Key: { email },
    }).promise();

    if (existingUser.Item) {
      return {
        statusCode: 409,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'User already exists' }),
      };
    }

    // Create new user
    const userId = generateUserId();
    const hashedPassword = await hashPassword(password);
    const now = new Date().toISOString();

    const newUser = {
      userId,
      email,
      passwordHash: hashedPassword,
      displayName: displayName.trim(),
      createdAt: now,
      lastActiveAt: now,
      preferences: {
        learningModalities: ['visual', 'audio', 'contextual'],
        notificationFrequency: 'medium',
        studyGoal: 10,
        preferredStudyTime: '19:00',
      },
      statistics: {
        totalWordsLearned: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalStudyTime: 0,
      },
    };

    await dynamodb.put({
      TableName: USERS_TABLE,
      Item: newUser,
    }).promise();

    // Return user data without password hash
    const { passwordHash, ...userResponse } = newUser;

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'User registered successfully',
        user: userResponse,
      }),
    };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};