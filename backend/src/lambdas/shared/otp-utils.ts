/**
 * OTP (One-Time Password) Utilities
 * For email verification
 */

import { PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDBClient, TABLE_NAMES } from './dynamodb-client';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

/**
 * Generate a random 6-digit OTP
 */
export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store OTP in DynamoDB
 */
export async function storeOtp(
  email: string,
  otp: string,
  otpType: 'email_verification' | 'password_reset' = 'email_verification'
): Promise<void> {
  const expiresAt = Math.floor(Date.now() / 1000) + OTP_EXPIRY_MINUTES * 60;

  await dynamoDBClient.send(
    new PutCommand({
      TableName: TABLE_NAMES.otp,
      Item: {
        email: email.toLowerCase(),
        otpType,
        otp,
        expiresAt,
        createdAt: new Date().toISOString(),
      },
    })
  );
}

/**
 * Verify OTP from DynamoDB
 */
export async function verifyOtp(
  email: string,
  otp: string,
  otpType: 'email_verification' | 'password_reset' = 'email_verification'
): Promise<boolean> {
  try {
    const result = await dynamoDBClient.send(
      new GetCommand({
        TableName: TABLE_NAMES.otp,
        Key: {
          email: email.toLowerCase(),
          otpType,
        },
      })
    );

    if (!result.Item) {
      return false;
    }

    const storedOtp = result.Item.otp;
    const expiresAt = result.Item.expiresAt;

    // Check if OTP matches
    if (storedOtp !== otp) {
      return false;
    }

    // Check if OTP has expired
    const now = Math.floor(Date.now() / 1000);
    if (expiresAt < now) {
      // Delete expired OTP
      await dynamoDBClient.send(
        new DeleteCommand({
          TableName: TABLE_NAMES.otp,
          Key: {
            email: email.toLowerCase(),
            otpType,
          },
        })
      );
      return false;
    }

    // OTP is valid, delete it (one-time use)
    await dynamoDBClient.send(
      new DeleteCommand({
        TableName: TABLE_NAMES.otp,
        Key: {
          email: email.toLowerCase(),
          otpType,
        },
      })
    );

    return true;
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
}

/**
 * Delete OTP (for cleanup)
 */
export async function deleteOtp(
  email: string,
  otpType: 'email_verification' | 'password_reset' = 'email_verification'
): Promise<void> {
  await dynamoDBClient.send(
    new DeleteCommand({
      TableName: TABLE_NAMES.otp,
      Key: {
        email: email.toLowerCase(),
        otpType,
      },
    })
  );
}

