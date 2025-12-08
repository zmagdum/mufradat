/**
 * Get Media URL Lambda
 * Generates presigned URLs for accessing media content from S3
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { success, failure } from '../shared/response-utils';
import { generateDownloadUrl, mediaExists } from '../shared/s3-utils';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const key = event.queryStringParameters?.key;

    if (!key) {
      return failure('Media key is required', 400);
    }

    // Check if media exists
    const exists = await mediaExists(key);
    if (!exists) {
      return failure('Media not found', 404);
    }

    // Generate presigned download URL
    const downloadUrl = await generateDownloadUrl(key, 3600); // 1 hour expiry

    return success({
      downloadUrl,
      key,
      expiresIn: 3600,
    });
  } catch (error: any) {
    console.error('Get media URL error:', error);
    return failure('Failed to generate download URL');
  }
};

