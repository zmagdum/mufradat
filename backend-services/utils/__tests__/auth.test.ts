import {
  generateUserId,
  hashPassword,
  verifyPassword,
  generateJWT,
  verifyJWT,
} from '../auth';

describe('Auth Utilities', () => {
  describe('generateUserId', () => {
    it('should generate a unique user ID', () => {
      const userId1 = generateUserId();
      const userId2 = generateUserId();
      
      expect(userId1).toBeDefined();
      expect(userId2).toBeDefined();
      expect(userId1).not.toBe(userId2);
      expect(typeof userId1).toBe('string');
    });
  });

  describe('Password hashing', () => {
    it('should hash and verify password correctly', async () => {
      const password = 'TestPassword123';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).toContain(':');
      expect(hashedPassword).not.toBe(password);
      
      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
      
      const isInvalid = await verifyPassword('wrongpassword', hashedPassword);
      expect(isInvalid).toBe(false);
    });
  });

  describe('JWT token handling', () => {
    const testPayload = {
      userId: 'test-user-id',
      email: 'test@example.com',
    };

    it('should generate and verify JWT token correctly', () => {
      const token = generateJWT(testPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
      
      const decoded = verifyJWT(token);
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(testPayload.userId);
      expect(decoded?.email).toBe(testPayload.email);
      expect(decoded?.iat).toBeDefined();
      expect(decoded?.exp).toBeDefined();
    });

    it('should reject invalid JWT token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyJWT(invalidToken);
      
      expect(decoded).toBeNull();
    });

    it('should reject malformed JWT token', () => {
      const malformedToken = 'not-a-jwt-token';
      const decoded = verifyJWT(malformedToken);
      
      expect(decoded).toBeNull();
    });
  });
});