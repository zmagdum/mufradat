import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ContentDatabaseService } from '../../utils/contentDatabase';

const contentDb = new ContentDatabaseService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
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

    if (event.httpMethod !== 'GET') {
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

    // Get the word
    const word = await contentDb.getWord(wordId);

    if (!word) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Word not found' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        word
      })
    };

  } catch (error) {
    console.error('Error getting word:', error);

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