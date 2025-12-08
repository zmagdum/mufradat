/**
 * Email Service for sending OTP emails
 * For production: Uses AWS SES
 * For local: Logs to console
 */

import * as ses from '@aws-sdk/client-ses';

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@mufradat.com';

// Check if SES is enabled (lazy evaluation for testing)
function isSesEnabled(): boolean {
  return process.env.STAGE !== 'local';
}

// Lazy initialization of SES client
function getSesClient(): ses.SESClient | null {
  if (!isSesEnabled()) {
    return null;
  }
  
  // Return existing client if already created (for testing)
  if ((global as any).__sesClient) {
    return (global as any).__sesClient;
  }
  
  const client = new ses.SESClient({
    region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    endpoint: process.env.AWS_ENDPOINT_URL,
  });
  
  (global as any).__sesClient = client;
  return client;
}

export interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

/**
 * Send an email
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, subject, htmlBody, textBody } = options;

  const sesClient = getSesClient();
  
  if (!isSesEnabled() || !sesClient) {
    // Local development: log to console
    console.log('📧 EMAIL (Local Mode):');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${textBody || htmlBody}`);
    console.log('--- END EMAIL ---');
    return;
  }

  try {
    const command = new ses.SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: textBody
            ? {
                Data: textBody,
                Charset: 'UTF-8',
              }
            : undefined,
        },
      },
    });

    await sesClient.send(command);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

/**
 * Send OTP email
 */
export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  // Log OTP prominently for local development
  if (!isSesEnabled()) {
    console.log('');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔐 OTP CODE FOR EMAIL VERIFICATION');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Email: ${email}`);
    console.log(`OTP Code: ${otp}`);
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
  }
  
  const subject = 'Your Mufradat Verification Code';
  const htmlBody = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50;">Mufradat Email Verification</h1>
          <p>Hello,</p>
          <p>Thank you for signing up for Mufradat! Please use the following code to verify your email address:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px;">
            <h2 style="color: #27ae60; font-size: 32px; letter-spacing: 5px; margin: 0;">${otp}</h2>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">This is an automated message from Mufradat. Please do not reply to this email.</p>
        </div>
      </body>
    </html>
  `;
  const textBody = `
Mufradat Email Verification

Hello,

Thank you for signing up for Mufradat! Please use the following code to verify your email address:

${otp}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

---
This is an automated message from Mufradat. Please do not reply to this email.
  `;

  await sendEmail({
    to: email,
    subject,
    htmlBody,
    textBody,
  });
}

