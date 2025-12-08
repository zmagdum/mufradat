import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { S3MediaService } from '../../utils/s3Service';
import { ContentDatabaseService } from '../../utils/contentDatabase';
import { validateMediaUploadRequest, ContentValidationError } from '../../utils/contentValidation';

const s3Service = new S3MediaService();
const contentDb = new ContentDatabaseService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  };

  try {
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: ''
      };
    }

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    // Parse and validate request body
    let requestData;
    try {
      requestData = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    // Validate the request data
    const validatedData = validateMediaUploadRequest(requestData);

    // Check if word exists
    const word = await contentDb.getWord(validatedData.wordId);
    if (!word) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Word not found' })
      };
    }

    // Validate media constraints
    s3Service.validateMediaConstraints(validatedData.mediaType, validatedData.contentType);

    // Generate upload URL
    const uploadResponse = await s3Service.generateUploadUrl(validatedData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Upload URL generated successfully',
        ...uploadResponse
      })
    };

  } catch (error) {
    console.error('Error generating upload URL:', error);

    if (error instanceof ContentValidationError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Validation failed',
          details: error.message,
          field: error.field
        })
      };
    }

    if (error instanceof Error && error.message.includes('not allowed') || error.message.includes('exceeds maximum')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Media validation failed',
          details: error.message
        })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred'
      })
    };
  }
};