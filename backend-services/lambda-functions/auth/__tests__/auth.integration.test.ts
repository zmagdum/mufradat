import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock AWS SDK before importing handlers
jest.mock('aws-sdk', () => ({
  DynamoDB: {
    DocumentClient: jest.fn(() => ({
      get: jest.fn(),
      put: jest.fn(),
      update: jest.fn(),
    })),
  },
}));

// Mock auth utilities
jest.mock('../../utils/auth', () => ({
  hashPassword: jest.fn().mockResolvedValue('salt:hashedpassword'),
  verifyPassword: jest.fn(),
  generateUserId: jest.fn().mockReturnValue('test-user-id'),
  generateJWT: jest.fn().mockReturnValue('mock-jwt-token'),
  verifyJWT: jest.fn(),
}));

// Mock validation utilities
jest.mock('../../utils/validation', () => ({
  validateEmail: jest.fn(),
  validatePassword: jest.fn(),
}));

import { handler as registerHandler } from '../register';
import { handler as loginHandler } from '../login';
import { handler as profileHandler } from '../profile';
import { DynamoDB } from 'aws-sdk';
import * as authUtils from '../../utils/auth';
import * as validationUtils from '../../utils/validation';

const mockDynamoDB = new DynamoDB.DocumentClient() as jest.Mocked<DynamoDB.DocumentClient>;

// Mock environment variables
process.env.USERS_TABLE = 'test-users-table';
process.env.JWT_SECRET = 'test-secret';

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      // Mock validation functions
      (validationUtils.validateEmail as jest.Mock).mockReturnValue(true);
      (validationUtils.validatePassword as jest.Mock).mockReturnValue(true);
      
      // Mock DynamoDB responses
      (mockDynamoDB.get as jest.Mock).mockReturnValue({
        promise: () => Promise.resolve({ Item: null }),
      });
      (mockDynamoDB.put as jest.Mock).mockReturnValue({
        promise: () => Promise.resolve({}),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPassword123',
          displayName: 'Test User',
        }),
        httpMethod: 'POST',
        headers: {},
      };

      const result = await registerHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(201);
      expect(JSON.parse(result.body)).toMatchObject({
        message: 'User registered successfully',
        user: expect.objectContaining({
          email: 'test@example.com',
          displayName: 'Test User',
        }),
      });
      expect(mockDynamoDB.get).toHaveBeenCalledWith({
        TableName: 'test-users-table',
        Key: { email: 'test@example.com' },
      });
      expect(mockDynamoDB.put).toHaveBeenCalled();
    });

    it('should reject registration with invalid email', async () => {
      // Mock validation to return false for invalid email
      (validationUtils.validateEmail as jest.Mock).mockReturnValue(false);
      
      const event: Partial<APIGatewayProxyEvent> = {
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'TestPassword123',
          displayName: 'Test User',
        }),
        httpMethod: 'POST',
        headers: {},
      };

      const result = await registerHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        error: 'Invalid email format',
      });
    });

    it('should reject registration with weak password', async () => {
      // Mock validation functions
      (validationUtils.validateEmail as jest.Mock).mockReturnValue(true);
      (validationUtils.validatePassword as jest.Mock).mockReturnValue(false);
      
      const event: Partial<APIGatewayProxyEvent> = {
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'weak',
          displayName: 'Test User',
        }),
        httpMethod: 'POST',
        headers: {},
      };

      const result = await registerHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        error: 'Password must be at least 8 characters long and contain uppercase, lowercase, and number',
      });
    });

    it('should reject registration for existing user', async () => {
      // Mock validation functions
      (validationUtils.validateEmail as jest.Mock).mockReturnValue(true);
      (validationUtils.validatePassword as jest.Mock).mockReturnValue(true);
      
      (mockDynamoDB.get as jest.Mock).mockReturnValue({
        promise: () => Promise.resolve({
          Item: { email: 'test@example.com', userId: 'existing-user' },
        }),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPassword123',
          displayName: 'Test User',
        }),
        httpMethod: 'POST',
        headers: {},
      };

      const result = await registerHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(409);
      expect(JSON.parse(result.body)).toMatchObject({
        error: 'User already exists',
      });
    });
  });

  describe('User Login', () => {
    it('should login user successfully with valid credentials', async () => {
      const mockUser = {
        userId: 'test-user-id',
        email: 'test@example.com',
        passwordHash: 'salt:hash', // This would be a real hash in practice
        displayName: 'Test User',
        preferences: {},
        statistics: {},
      };

      // Mock validation and auth functions
      (validationUtils.validateEmail as jest.Mock).mockReturnValue(true);
      (authUtils.verifyPassword as jest.Mock).mockResolvedValue(true);

      (mockDynamoDB.get as jest.Mock).mockReturnValue({
        promise: () => Promise.resolve({ Item: mockUser }),
      });
      (mockDynamoDB.update as jest.Mock).mockReturnValue({
        promise: () => Promise.resolve({}),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'TestPassword123',
        }),
        httpMethod: 'POST',
        headers: {},
      };

      const result = await loginHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody).toMatchObject({
        message: 'Login successful',
        token: expect.any(String),
        user: expect.objectContaining({
          email: 'test@example.com',
          displayName: 'Test User',
        }),
      });
      expect(responseBody.user.passwordHash).toBeUndefined();
    });

    it('should reject login with invalid email', async () => {
      (validationUtils.validateEmail as jest.Mock).mockReturnValue(false);
      
      const event: Partial<APIGatewayProxyEvent> = {
        body: JSON.stringify({
          email: 'invalid-email',
          password: 'TestPassword123',
        }),
        httpMethod: 'POST',
        headers: {},
      };

      const result = await loginHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body)).toMatchObject({
        error: 'Invalid email format',
      });
    });

    it('should reject login for non-existent user', async () => {
      (validationUtils.validateEmail as jest.Mock).mockReturnValue(true);
      
      (mockDynamoDB.get as jest.Mock).mockReturnValue({
        promise: () => Promise.resolve({ Item: null }),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        body: JSON.stringify({
          email: 'nonexistent@example.com',
          password: 'TestPassword123',
        }),
        httpMethod: 'POST',
        headers: {},
      };

      const result = await loginHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body)).toMatchObject({
        error: 'Invalid credentials',
      });
    });
  });

  describe('User Profile', () => {
    it('should get user profile with valid token', async () => {
      const mockUser = {
        userId: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        preferences: {},
        statistics: {},
      };

      (authUtils.verifyJWT as jest.Mock).mockReturnValue({
        userId: 'test-user-id',
        email: 'test@example.com',
      });

      (mockDynamoDB.get as jest.Mock).mockReturnValue({
        promise: () => Promise.resolve({ Item: mockUser }),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        headers: {
          Authorization: 'Bearer valid-jwt-token',
        },
      };

      const result = await profileHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toMatchObject({
        user: expect.objectContaining({
          email: 'test@example.com',
          displayName: 'Test User',
        }),
      });
    });

    it('should reject request without authorization token', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        headers: {},
      };

      const result = await profileHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(401);
      expect(JSON.parse(result.body)).toMatchObject({
        error: 'Authorization token required',
      });
    });

    it('should update user profile successfully', async () => {
      const mockUser = {
        userId: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Updated Name',
        preferences: { studyGoal: 15 },
        statistics: {},
      };

      (authUtils.verifyJWT as jest.Mock).mockReturnValue({
        userId: 'test-user-id',
        email: 'test@example.com',
      });

      (mockDynamoDB.get as jest.Mock).mockReturnValue({
        promise: () => Promise.resolve({ Item: mockUser }),
      });
      (mockDynamoDB.update as jest.Mock).mockReturnValue({
        promise: () => Promise.resolve({}),
      });

      const event: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'PUT',
        headers: {
          Authorization: 'Bearer valid-jwt-token',
        },
        body: JSON.stringify({
          displayName: 'Updated Name',
          preferences: { studyGoal: 15 },
        }),
      };

      const result = await profileHandler(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toMatchObject({
        message: 'Profile updated successfully',
        user: expect.objectContaining({
          displayName: 'Updated Name',
        }),
      });
    });
  });
});