/**
 * S3 Utilities for Media Content Storage
 * Handles uploading, retrieving, and managing media files in S3
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const isLocal = process.env.STAGE === 'local';

const s3Client = new S3Client({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
  ...(isLocal && {
    endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
    forcePathStyle: true, // Required for LocalStack
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    },
  }),
});

const MEDIA_BUCKET = process.env.MEDIA_BUCKET_NAME || 'mufradat-media-local';

/**
 * Generate a presigned URL for uploading media content
 * @param key S3 object key
 * @param contentType MIME type of the file
 * @param expiresIn URL expiration time in seconds (default: 1 hour)
 */
export const generateUploadUrl = async (
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<string> => {
  const command = new PutObjectCommand({
    Bucket: MEDIA_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Generate a presigned URL for downloading/viewing media content
 * @param key S3 object key
 * @param expiresIn URL expiration time in seconds (default: 1 hour)
 */
export const generateDownloadUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: MEDIA_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Upload media content directly to S3
 * @param key S3 object key
 * @param body File buffer or stream
 * @param contentType MIME type of the file
 */
export const uploadMedia = async (
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string
): Promise<void> => {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: MEDIA_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
};

/**
 * Delete media content from S3
 * @param key S3 object key
 */
export const deleteMedia = async (key: string): Promise<void> => {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: MEDIA_BUCKET,
      Key: key,
    })
  );
};

/**
 * Check if media file exists in S3
 * @param key S3 object key
 */
export const mediaExists = async (key: string): Promise<boolean> => {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: MEDIA_BUCKET,
        Key: key,
      })
    );
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
};

/**
 * Generate S3 key for vocabulary media content
 * @param wordId Vocabulary word ID
 * @param mediaType Type of media (audio, image, calligraphy)
 * @param fileExtension File extension
 */
export const generateMediaKey = (
  wordId: string,
  mediaType: 'audio' | 'image' | 'calligraphy',
  fileExtension: string
): string => {
  const timestamp = Date.now();
  return `vocabulary/${wordId}/${mediaType}/${timestamp}.${fileExtension}`;
};

/**
 * Sanitize filename for S3 storage
 * @param filename Original filename
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};

