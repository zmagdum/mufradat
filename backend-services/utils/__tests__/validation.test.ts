import {
  validateEmail,
  validatePassword,
  validateDisplayName,
  sanitizeString,
  validateUserPreferences,
} from '../validation';

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('test+tag@example.org')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test.example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail(null as any)).toBe(false);
      expect(validateEmail(undefined as any)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('TestPassword123')).toBe(true);
      expect(validatePassword('MySecure1Pass')).toBe(true);
      expect(validatePassword('Complex9Password')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('short')).toBe(false); // Too short
      expect(validatePassword('nouppercase123')).toBe(false); // No uppercase
      expect(validatePassword('NOLOWERCASE123')).toBe(false); // No lowercase
      expect(validatePassword('NoNumbers')).toBe(false); // No numbers
      expect(validatePassword('')).toBe(false); // Empty
      expect(validatePassword(null as any)).toBe(false); // Null
      expect(validatePassword(undefined as any)).toBe(false); // Undefined
    });
  });

  describe('validateDisplayName', () => {
    it('should validate correct display names', () => {
      expect(validateDisplayName('John Doe')).toBe(true);
      expect(validateDisplayName('Ahmed')).toBe(true);
      expect(validateDisplayName('User Name')).toBe(true);
    });

    it('should reject invalid display names', () => {
      expect(validateDisplayName('A')).toBe(false); // Too short
      expect(validateDisplayName('')).toBe(false); // Empty
      expect(validateDisplayName('   ')).toBe(false); // Only spaces
      expect(validateDisplayName('A'.repeat(51))).toBe(false); // Too long
      expect(validateDisplayName(null as any)).toBe(false); // Null
      expect(validateDisplayName(undefined as any)).toBe(false); // Undefined
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize strings correctly', () => {
      expect(sanitizeString('  Hello World  ')).toBe('Hello World');
      expect(sanitizeString('Test<script>alert("xss")</script>')).toBe('Testscriptalert("xss")/script');
      expect(sanitizeString('Normal text')).toBe('Normal text');
    });

    it('should handle invalid inputs', () => {
      expect(sanitizeString('')).toBe('');
      expect(sanitizeString(null as any)).toBe('');
      expect(sanitizeString(undefined as any)).toBe('');
    });
  });

  describe('validateUserPreferences', () => {
    it('should validate correct preferences', () => {
      const validPreferences = {
        learningModalities: ['visual', 'audio'],
        notificationFrequency: 'medium',
        studyGoal: 10,
        preferredStudyTime: '19:00',
      };
      expect(validateUserPreferences(validPreferences)).toBe(true);
    });

    it('should reject invalid learning modalities', () => {
      const invalidPreferences = {
        learningModalities: ['invalid', 'modality'],
        notificationFrequency: 'medium',
        studyGoal: 10,
        preferredStudyTime: '19:00',
      };
      expect(validateUserPreferences(invalidPreferences)).toBe(false);
    });

    it('should reject invalid notification frequency', () => {
      const invalidPreferences = {
        learningModalities: ['visual'],
        notificationFrequency: 'invalid',
        studyGoal: 10,
        preferredStudyTime: '19:00',
      };
      expect(validateUserPreferences(invalidPreferences)).toBe(false);
    });

    it('should reject invalid study goal', () => {
      const invalidPreferences = {
        learningModalities: ['visual'],
        notificationFrequency: 'medium',
        studyGoal: 0, // Invalid: too low
        preferredStudyTime: '19:00',
      };
      expect(validateUserPreferences(invalidPreferences)).toBe(false);
    });

    it('should reject invalid preferred study time', () => {
      const invalidPreferences = {
        learningModalities: ['visual'],
        notificationFrequency: 'medium',
        studyGoal: 10,
        preferredStudyTime: '25:00', // Invalid: hour > 23
      };
      expect(validateUserPreferences(invalidPreferences)).toBe(false);
    });

    it('should handle null/undefined preferences', () => {
      expect(validateUserPreferences(null)).toBe(false);
      expect(validateUserPreferences(undefined)).toBe(false);
      expect(validateUserPreferences('not an object' as any)).toBe(false);
    });
  });
});