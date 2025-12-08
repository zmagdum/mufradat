/**
 * Mock Register Lambda Function
 * Returns mock registration response for testing
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export async function handler(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  console.log('Mock register request received', { body: event.body });

  try {
    // Parse request body
    const body = event.body ? JSON.parse(event.body) : {};
    const email = body.email || 'test@example.com';

    // Return mock response
    const response = {
      userId: 'mock-user-' + Date.now(),
      email: email,
      token: 'mock-token-' + Date.now(),
    };

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': event.headers.origin || event.headers.Origin || 'http://localhost:19006',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
      },
      body: JSON.stringify(response),
    };
  } catch (error: any) {
    console.error('Mock register error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': event.headers.origin || event.headers.Origin || 'http://localhost:19006',
        'Access-Control-Allow-Credentials': 'true',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}



