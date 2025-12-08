/**
 * API Gateway Response Utilities
 */

import { APIGatewayProxyResult } from 'aws-lambda';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Get CORS headers based on origin
 */
function getCorsHeaders(origin?: string): Record<string, string> {
  // Allow common local development origins
  const allowedOrigins = [
    'http://localhost:19006',
    'http://localhost:3000',
    'http://localhost:8081',
    'http://127.0.0.1:19006',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8081',
  ];
  
  const allowOrigin = origin && allowedOrigins.includes(origin) 
    ? origin 
    : allowedOrigins[0]; // Default to first allowed origin
  
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
  };
}

/**
 * Create a success response
 */
export function createSuccessResponse<T>(
  data?: T,
  statusCode: number = 200,
  origin?: string
): APIGatewayProxyResult {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  return {
    statusCode,
    headers: getCorsHeaders(origin),
    body: JSON.stringify(response),
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(
  code: string,
  message: string,
  statusCode: number = 400,
  details?: any,
  origin?: string
): APIGatewayProxyResult {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };

  return {
    statusCode,
    headers: getCorsHeaders(origin),
    body: JSON.stringify(response),
  };
}

/**
 * Common error responses
 */
export const ErrorResponses = {
  badRequest: (message: string, details?: any, origin?: string) =>
    createErrorResponse('BAD_REQUEST', message, 400, details, origin),
  
  unauthorized: (message: string = 'Unauthorized', origin?: string) =>
    createErrorResponse('UNAUTHORIZED', message, 401, undefined, origin),
  
  forbidden: (message: string = 'Forbidden', origin?: string) =>
    createErrorResponse('FORBIDDEN', message, 403, undefined, origin),
  
  notFound: (resource: string = 'Resource', origin?: string) =>
    createErrorResponse('NOT_FOUND', `${resource} not found`, 404, undefined, origin),
  
  conflict: (message: string, origin?: string) =>
    createErrorResponse('CONFLICT', message, 409, undefined, origin),
  
  internalError: (message: string = 'Internal server error', origin?: string) =>
    createErrorResponse('INTERNAL_ERROR', message, 500, undefined, origin),
  
  validationError: (errors: any, origin?: string) =>
    createErrorResponse('VALIDATION_ERROR', 'Validation failed', 400, errors, origin),
};

/**
 * Parse JSON body from API Gateway event
 */
export function parseBody<T>(body: string | null): T | null {
  if (!body) {
    return null;
  }

  try {
    return JSON.parse(body) as T;
  } catch (error) {
    throw new Error('Invalid JSON in request body');
  }
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(String(field));
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

// Aliases for backward compatibility with flexible signatures
export function success<T>(data?: T, statusCode: number = 200): APIGatewayProxyResult {
  return createSuccessResponse(data, statusCode);
}

export function failure(
  message: string,
  statusCode: number = 500,
  code?: string,
  details?: any
): APIGatewayProxyResult {
  return createErrorResponse(code || 'SERVER_ERROR', message, statusCode, details);
}

