/**
 * JWT Authorizer Lambda Function
 * Validates JWT tokens for API Gateway authorization
 */

import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent } from 'aws-lambda';
import { verifyAccessToken } from '../shared/jwt-utils';

/**
 * Generate IAM policy for API Gateway
 */
function generatePolicy(
  principalId: string,
  effect: 'Allow' | 'Deny',
  resource: string,
  context?: Record<string, string>
): APIGatewayAuthorizerResult {
  const policy: APIGatewayAuthorizerResult = {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };

  if (context) {
    policy.context = context;
  }

  return policy;
}

/**
 * Lambda handler for JWT authorization
 */
export async function handler(
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> {
  console.log('JWT authorizer invoked', { token: event.authorizationToken?.substring(0, 20) + '...' });

  try {
    // Extract token from Authorization header
    const token = event.authorizationToken;

    if (!token) {
      throw new Error('Authorization token is missing');
    }

    // Remove 'Bearer ' prefix if present
    const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;

    // Verify token
    const payload = verifyAccessToken(cleanToken);

    // Generate allow policy with user context
    const policy = generatePolicy(
      payload.userId,
      'Allow',
      event.methodArn,
      {
        userId: payload.userId,
        email: payload.email,
      }
    );

    console.log('JWT authorization successful', { userId: payload.userId });
    return policy;
  } catch (error: any) {
    console.error('JWT authorization failed:', error);

    // Generate deny policy
    return generatePolicy('user', 'Deny', event.methodArn);
  }
}

