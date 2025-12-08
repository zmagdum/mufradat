import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ContentDatabaseService } from '../../utils/contentDatabase';
import { validateUpdateWordRequest, ContentValidationError } from '../../utils/contentValidation';

const contentDb = new ContentDatabaseService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'PUT,OPTIONS'
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

    if (event.httpMethod !== 'PUT') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const wordId = event.pathParameters?.wordId;
    if (!wordId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Word ID is required' })
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

    // Add wordId to request data for validation
    requestData.wordId = wordId;

    // Validate the request data
    const validatedData = validateUpdateWordRequest(requestData);

    // Remove wordId from updates (it shouldn't be updated)
    const { wordId: _, ...updates } = validatedData;

    // Update the word
    const word = await contentDb.updateWord(wordId, updates);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Word updated successfully',
        word
      })
    };

  } catch (error) {
    console.error('Error updating word:', error);

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
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Word not found' })
      };
    }

    if (error instanceof Error && error.message === 'Word not found') {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Word not found' })
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