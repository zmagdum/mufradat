import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ContentDatabaseService } from '../../utils/contentDatabase';
import { conjugationCache } from '../../utils/conjugationCache';

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

    const verbId = event.pathParameters?.verbId;
    if (!verbId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Verb ID is required' })
      };
    }

    // Try to get from cache first
    let conjugation = await conjugationCache.getConjugation(verbId);
    
    if (!conjugation) {
      // Get from database if not in cache
      conjugation = await contentDb.getConjugation(verbId);
      
      if (!conjugation) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Conjugation not found' })
        };
      }
      
      // Cache the result for future requests
      await conjugationCache.cacheConjugation(conjugation);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        conjugation
      })
    };

  } catch (error) {
    console.error('Error getting conjugation:', error);

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