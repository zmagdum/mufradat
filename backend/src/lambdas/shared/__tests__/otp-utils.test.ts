/**
 * OTP Utilities Unit Tests
 */

import { generateOtp, storeOtp, verifyOtp, deleteOtp } from '../otp-utils';

// Mock DynamoDB client
jest.mock('../dynamodb-client', () => ({
  dynamoDBClient: {
    send: jest.fn(),
  },
  TABLE_NAMES: {
    otp: 'test-otp-table',
  },
}));

import { dynamoDBClient } from '../dynamodb-client';
import { PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

describe('OTP Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateOtp', () => {
    it('should generate a 6-digit OTP', () => {
      const otp = generateOtp();
      expect(otp).toMatch(/^\d{6}$/);
    });

    it('should generate different OTPs on each call', () => {
      const otp1 = generateOtp();
      const otp2 = generateOtp();
      expect(otp1).not.toBe(otp2);
    });
  });

  describe('storeOtp', () => {
    it('should store OTP in DynamoDB', async () => {
      const mockSend = dynamoDBClient.send as jest.Mock;
      mockSend.mockResolvedValue({});

      await storeOtp('test@example.com', '123456', 'email_verification');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'test-otp-table',
            Item: expect.objectContaining({
              email: 'test@example.com',
              otpType: 'email_verification',
              otp: '123456',
            }),
          }),
        })
      );
    });

    it('should set expiry time correctly', async () => {
      const mockSend = dynamoDBClient.send as jest.Mock;
      mockSend.mockResolvedValue({});

      const beforeTime = Math.floor(Date.now() / 1000);
      await storeOtp('test@example.com', '123456');
      const afterTime = Math.floor(Date.now() / 1000) + 600; // 10 minutes

      const call = mockSend.mock.calls[0][0];
      const expiresAt = call.input.Item.expiresAt;
      
      expect(expiresAt).toBeGreaterThan(beforeTime);
      expect(expiresAt).toBeLessThanOrEqual(afterTime);
    });
  });

  describe('verifyOtp', () => {
    it('should return true for valid OTP', async () => {
      const mockSend = dynamoDBClient.send as jest.Mock;
      const futureTime = Math.floor(Date.now() / 1000) + 600;
      
      mockSend
        .mockResolvedValueOnce({
          Item: {
            email: 'test@example.com',
            otpType: 'email_verification',
            otp: '123456',
            expiresAt: futureTime,
          },
        })
        .mockResolvedValueOnce({}); // Delete call

      const result = await verifyOtp('test@example.com', '123456');
      
      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(2); // Get + Delete
    });

    it('should return false for invalid OTP', async () => {
      const mockSend = dynamoDBClient.send as jest.Mock;
      const futureTime = Math.floor(Date.now() / 1000) + 600;
      
      mockSend.mockResolvedValueOnce({
        Item: {
          email: 'test@example.com',
          otpType: 'email_verification',
          otp: '123456',
          expiresAt: futureTime,
        },
      });

      const result = await verifyOtp('test@example.com', 'wrong-otp');
      
      expect(result).toBe(false);
    });

    it('should return false for expired OTP', async () => {
      const mockSend = dynamoDBClient.send as jest.Mock;
      const pastTime = Math.floor(Date.now() / 1000) - 600;
      
      mockSend
        .mockResolvedValueOnce({
          Item: {
            email: 'test@example.com',
            otpType: 'email_verification',
            otp: '123456',
            expiresAt: pastTime,
          },
        })
        .mockResolvedValueOnce({}); // Delete expired OTP

      const result = await verifyOtp('test@example.com', '123456');
      
      expect(result).toBe(false);
      expect(mockSend).toHaveBeenCalledTimes(2); // Get + Delete expired
    });

    it('should return false if OTP not found', async () => {
      const mockSend = dynamoDBClient.send as jest.Mock;
      mockSend.mockResolvedValueOnce({ Item: undefined });

      const result = await verifyOtp('test@example.com', '123456');
      
      expect(result).toBe(false);
    });
  });

  describe('deleteOtp', () => {
    it('should delete OTP from DynamoDB', async () => {
      const mockSend = dynamoDBClient.send as jest.Mock;
      mockSend.mockResolvedValue({});

      await deleteOtp('test@example.com', 'email_verification');

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            TableName: 'test-otp-table',
            Key: {
              email: 'test@example.com',
              otpType: 'email_verification',
            },
          }),
        })
      );
    });
  });
});

