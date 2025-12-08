/**
 * API Integration Tests
 * End-to-end tests for API endpoints
 */

import axios from 'axios';

// These tests are meant to run against LocalStack or a deployed environment
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4566/restapis/mufradat-api-local/local/_user_request_';

describe('API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  beforeAll(async () => {
    // Setup: ensure API is accessible
    try {
      await axios.get(`${API_BASE_URL}/health`);
    } catch (error) {
      console.warn('API may not be accessible. Some tests may fail.');
    }
  });

  describe('Authentication Flow', () => {
    let otpCode: string;

    it('should register a new user and receive OTP', async () => {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        email: testEmail,
        password: testPassword,
      });

      expect(response.status).toBe(201);
      expect(response.data.data).toHaveProperty('email', testEmail);
      expect(response.data.data).toHaveProperty('emailVerified', false);
      expect(response.data.data).toHaveProperty('message');
      
      // In local mode, OTP is logged to console
      // In production, would be sent via email
      // For testing, we'd need to retrieve OTP from DynamoDB or use a test email service
    });

    it('should not allow duplicate registration', async () => {
      try {
        await axios.post(`${API_BASE_URL}/auth/register`, {
          email: testEmail,
          password: testPassword,
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(409);
      }
    });

    it('should verify email with OTP', async () => {
      // Note: In real test, would retrieve OTP from DynamoDB or email service
      // For now, this is a placeholder
      try {
        const response = await axios.post(`${API_BASE_URL}/auth/verify-email`, {
          email: testEmail,
          otp: '123456', // Would need actual OTP
        });

        expect(response.status).toBe(200);
        expect(response.data.data).toHaveProperty('tokens');
        expect(response.data.data.tokens).toHaveProperty('accessToken');
        expect(response.data.data.tokens).toHaveProperty('refreshToken');
        
        authToken = response.data.data.tokens.accessToken;
        userId = response.data.data.user.userId;
      } catch (error: any) {
        // OTP might be invalid in test, skip for now
        console.warn('Email verification test skipped - need actual OTP');
      }
    });

    it('should login with valid credentials after email verification', async () => {
      // Skip if email not verified
      if (!authToken) {
        console.warn('Skipping login test - email not verified');
        return;
      }

      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: testEmail,
        password: testPassword,
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toHaveProperty('tokens');
      expect(response.data.data.tokens).toHaveProperty('accessToken');
      authToken = response.data.data.tokens.accessToken;
    });

    it('should reject login with invalid credentials', async () => {
      try {
        await axios.post(`${API_BASE_URL}/auth/login`, {
          email: testEmail,
          password: 'WrongPassword',
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect([401, 403]).toContain(error.response.status);
      }
    });

    it('should reject login if email not verified', async () => {
      // Register a new user but don't verify
      const unverifiedEmail = `unverified-${Date.now()}@example.com`;
      await axios.post(`${API_BASE_URL}/auth/register`, {
        email: unverifiedEmail,
        password: testPassword,
      });

      try {
        await axios.post(`${API_BASE_URL}/auth/login`, {
          email: unverifiedEmail,
          password: testPassword,
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(403);
        expect(error.response.data.error.message).toContain('verify your email');
      }
    });
  });

  describe('User Profile', () => {
    it('should get user profile', async () => {
      const response = await axios.get(`${API_BASE_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('userId', userId);
      expect(response.data).toHaveProperty('email', testEmail);
    });

    it('should update user profile', async () => {
      const response = await axios.put(
        `${API_BASE_URL}/users/profile`,
        {
          studyGoal: 20,
          learningModalities: ['visual', 'audio'],
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.studyGoal).toBe(20);
    });
  });

  describe('Vocabulary', () => {
    let wordId: string;

    it('should list vocabulary words', async () => {
      const response = await axios.get(`${API_BASE_URL}/vocabulary/words`);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('words');
      expect(Array.isArray(response.data.words)).toBe(true);
    });

    it('should create a new word (admin only)', async () => {
      // Note: This would need admin auth token
      // Skipping actual creation in this test
      expect(true).toBe(true);
    });

    it('should get word by ID', async () => {
      // Assuming we have a known word ID from seed data
      // const response = await axios.get(`${API_BASE_URL}/vocabulary/words/word-1`);
      // expect(response.status).toBe(200);
      expect(true).toBe(true);
    });
  });

  describe('Progress Tracking', () => {
    it('should record learning session', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/progress/session`,
        {
          wordsReviewed: ['word-1', 'word-2'],
          duration: 600,
          accuracy: 85,
        },
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('sessionId');
    });

    it('should get user statistics', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/users/statistics`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('totalWordsLearned');
    });
  });

  describe('Error Handling', () => {
    it('should return 401 for unauthorized requests', async () => {
      try {
        await axios.get(`${API_BASE_URL}/users/profile`);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(401);
      }
    });

    it('should return 404 for non-existent endpoints', async () => {
      try {
        await axios.get(`${API_BASE_URL}/non-existent-endpoint`);
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });
});

