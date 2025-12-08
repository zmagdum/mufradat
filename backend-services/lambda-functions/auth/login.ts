import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { verifyPassword, generateJWT } from '../../utils/auth';
import { validateEmail } from '../../utils/validation';

const dynamodb = new DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || 'quranic-vocab-users';

interface LoginRequest {
  email: string;
  password: string;
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

    const { email, password }: LoginRequest = JSON.parse(event.body);

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

    if (!password) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Password is required' }),
      };
    }

    // Get user from database
    const result = await dynamodb.get({
      TableName: USERS_TABLE,
      Key: { email },
    }).promise();

    if (!result.Item) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Invalid credentials' }),
      };
    }

    const user = result.Item;

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Invalid credentials' }),
      };
    }

    // Update last active timestamp
    await dynamodb.update({
      TableName: USERS_TABLE,
      Key: { email },
      UpdateExpression: 'SET lastActiveAt = :timestamp',
      ExpressionAttributeValues: {
        ':timestamp': new Date().toISOString(),
      },
    }).promise();

    // Generate JWT token
    const token = generateJWT({
      userId: user.userId,
      email: user.email,
    });

    // Return user data without password hash
    const { passwordHash, ...userResponse } = user;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Login successful',
        token,
        user: userResponse,
      }),
    };
  } catch (error) {
    console.error('Login error:', error);
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