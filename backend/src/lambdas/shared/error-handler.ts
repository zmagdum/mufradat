/**
 * Centralized Error Handler
 * Standardized error handling and logging
 */

import { APIGatewayProxyResult } from 'aws-lambda';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(401, message);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Not authorized') {
    super(403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(429, message);
  }
}

/**
 * Log error with context
 */
export const logError = (error: Error, context?: Record<string, any>): void => {
  const errorLog: Record<string, any> = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context,
  };

  if (error instanceof AppError) {
    errorLog['statusCode'] = error.statusCode;
    errorLog['isOperational'] = error.isOperational;
  }

  console.error('Error:', JSON.stringify(errorLog, null, 2));
};

/**
 * Convert error to API response
 */
export const errorToResponse = (
  error: Error,
  includeStack: boolean = false
): APIGatewayProxyResult => {
  const isAppError = error instanceof AppError;
  const statusCode = isAppError ? error.statusCode : 500;
  const message = isAppError ? error.message : 'Internal server error';

  const body: any = {
    error: {
      message,
      statusCode,
    },
  };

  // Include stack trace in development
  if (includeStack && process.env.STAGE !== 'prod') {
    body.error.stack = error.stack;
  }

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(body),
  };
};

/**
 * Async error wrapper for Lambda handlers
 */
export const asyncHandler = (
  fn: Function
): ((event: any, context: any) => Promise<APIGatewayProxyResult>) => {
  return async (event: any, context: any): Promise<APIGatewayProxyResult> => {
    try {
      return await fn(event, context);
    } catch (error) {
      logError(error as Error, {
        event: {
          path: event.path,
          httpMethod: event.httpMethod,
          requestId: context.requestId,
        },
      });

      return errorToResponse(
        error as Error,
        process.env.STAGE !== 'prod'
      );
    }
  };
};

/**
 * Validate required fields
 */
export const validateRequired = (
  data: Record<string, any>,
  requiredFields: string[]
): void => {
  const missingFields = requiredFields.filter(
    (field) => !data[field] || data[field] === ''
  );

  if (missingFields.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missingFields.join(', ')}`
    );
  }
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
};

/**
 * Sanitize input to prevent injection
 */
export const sanitizeInput = (input: string): string => {
  // Remove potentially dangerous characters
  return input.replace(/[<>\"'`]/g, '');
};

