import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ContentDatabaseService } from '../../utils/contentDatabase';
import { validateCreateWordRequest, ContentValidationError } from '../../utils/contentValidation';
import { VocabularyWord } from '../../types/content';

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
    const validatedData = validateCreateWordRequest(requestData);

    // Create the word
    const word: VocabularyWord = await contentDb.createWord({
      ...validatedData,
      mediaContent: {
        imageUrls: [],
        audioUrl: undefined,
        calligraphyUrl: undefined
      }
    });

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Word created successfully',
        word
      })
    };

  } catch (error) {
    console.error('Error creating word:', error);

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

    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Word already exists' })
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