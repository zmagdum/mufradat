/**
 * Upload Media Lambda
 * Generates presigned URLs for uploading media content to S3
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { success, failure } from '../shared/response-utils';
import { generateUploadUrl, generateMediaKey, sanitizeFilename } from '../shared/s3-utils';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const data = JSON.parse(event.body || '{}');
    const { wordId, mediaType, filename, contentType } = data;

    // Validate input
    if (!wordId || !mediaType || !filename || !contentType) {
      return failure('Missing required fields: wordId, mediaType, filename, contentType', 400);
    }

    // Validate media type
    const validMediaTypes = ['audio', 'image', 'calligraphy'];
    if (!validMediaTypes.includes(mediaType)) {
      return failure('Invalid media type. Must be: audio, image, or calligraphy', 400);
    }

    // Extract file extension from filename
    const sanitized = sanitizeFilename(filename);
    const extension = sanitized.split('.').pop() || 'bin';

    // Generate S3 key
    const key = generateMediaKey(wordId, mediaType as any, extension);

    // Generate presigned upload URL
    const uploadUrl = await generateUploadUrl(key, contentType, 3600); // 1 hour expiry

    // Return upload URL and key
    return success({
      uploadUrl,
      key,
      expiresIn: 3600,
      instructions: 'Use PUT request to upload file to uploadUrl',
    });
  } catch (error: any) {
    console.error('Upload media error:', error);
    return failure('Failed to generate upload URL');
  }
};

