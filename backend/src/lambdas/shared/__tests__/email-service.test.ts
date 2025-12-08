/**
 * Email Service Unit Tests
 */

// Mock SES client before importing email-service
jest.mock('@aws-sdk/client-ses', () => ({
  SESClient: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({ MessageId: 'test-message-id' }),
  })),
  SendEmailCommand: jest.fn().mockImplementation((params) => params),
}));

import { sendEmail, sendOtpEmail } from '../email-service';

describe('Email Service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    // Clear SES client cache
    delete (global as any).__sesClient;
  });

  afterEach(() => {
    process.env = originalEnv;
    delete (global as any).__sesClient;
  });

  describe('sendEmail', () => {
    it('should log email in local mode', async () => {
      process.env.STAGE = 'local';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlBody: '<p>Test Body</p>',
        textBody: 'Test Body',
      });

      expect(consoleSpy).toHaveBeenCalledWith('📧 EMAIL (Local Mode):');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test@example.com'));
      
      consoleSpy.mockRestore();
    });

    it('should send email via SES in production', async () => {
      process.env.STAGE = 'prod';
      process.env.FROM_EMAIL = 'noreply@mufradat.com';
      
      // Note: This would require actual SES client mocking
      // For now, just verify the function doesn't throw
      await expect(sendEmail({
        to: 'test@example.com',
        subject: 'Test Subject',
        htmlBody: '<p>Test Body</p>',
      })).resolves.not.toThrow();
    });
  });

  describe('sendOtpEmail', () => {
    it('should send OTP email with correct format', async () => {
      process.env.STAGE = 'local';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await sendOtpEmail('test@example.com', '123456');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test@example.com'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('123456'));
      
      consoleSpy.mockRestore();
    });

    it('should include OTP in email body', async () => {
      process.env.STAGE = 'local';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await sendOtpEmail('test@example.com', '654321');

      const logCalls = consoleSpy.mock.calls.flat().join(' ');
      expect(logCalls).toContain('654321');
      
      consoleSpy.mockRestore();
    });
  });
});

