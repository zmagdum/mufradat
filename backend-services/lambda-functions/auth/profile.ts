import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { verifyJWT } from '../../utils/auth';

const dynamodb = new DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || 'quranic-vocab-users';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Extract token from Authorization header
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Authorization token required' }),
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = verifyJWT(token);
    if (!decoded) {
      return {
        statusCode: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Invalid or expired token' }),
      };
    }

    const { email } = decoded;

    // Handle different HTTP methods
    switch (event.httpMethod) {
      case 'GET':
        return await getProfile(email);
      case 'PUT':
        return await updateProfile(email, event.body);
      default:
        return {
          statusCode: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Profile operation error:', error);
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

async function getProfile(email: string): Promise<APIGatewayProxyResult> {
  const result = await dynamodb.get({
    TableName: USERS_TABLE,
    Key: { email },
  }).promise();

  if (!result.Item) {
    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'User not found' }),
    };
  }

  // Return user data without password hash
  const { passwordHash, ...userResponse } = result.Item;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({ user: userResponse }),
  };
}

async function updateProfile(email: string, requestBody: string | null): Promise<APIGatewayProxyResult> {
  if (!requestBody) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Request body is required' }),
    };
  }

  const updates = JSON.parse(requestBody);
  
  // Validate allowed fields for update
  const allowedFields = ['displayName', 'preferences'];
  const updateFields: any = {};
  
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateFields[field] = updates[field];
    }
  }

  if (Object.keys(updateFields).length === 0) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'No valid fields to update' }),
    };
  }

  // Build update expression
  const updateExpressions: string[] = [];
  const expressionAttributeValues: any = {};
  
  Object.keys(updateFields).forEach((field, index) => {
    updateExpressions.push(`${field} = :val${index}`);
    expressionAttributeValues[`:val${index}`] = updateFields[field];
  });

  await dynamodb.update({
    TableName: USERS_TABLE,
    Key: { email },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeValues: expressionAttributeValues,
  }).promise();

  // Get updated user data
  const result = await dynamodb.get({
    TableName: USERS_TABLE,
    Key: { email },
  }).promise();

  const { passwordHash, ...userResponse } = result.Item!;

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: 'Profile updated successfully',
      user: userResponse,
    }),
  };
}