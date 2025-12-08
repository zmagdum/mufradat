import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ContentDatabaseService } from '../../utils/contentDatabase';
import { WordSearchQuery } from '../../types/content';

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

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    
    const searchQuery: WordSearchQuery = {
      searchTerm: queryParams.searchTerm,
      wordType: queryParams.wordType as any,
      difficulty: queryParams.difficulty as any,
      rootLetters: queryParams.rootLetters,
      limit: queryParams.limit ? parseInt(queryParams.limit, 10) : 50,
      lastEvaluatedKey: queryParams.lastEvaluatedKey
    };

    // Validate limit
    if (searchQuery.limit && (searchQuery.limit < 1 || searchQuery.limit > 100)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Limit must be between 1 and 100' })
      };
    }

    // Validate wordType if provided
    if (searchQuery.wordType && !['noun', 'verb', 'particle', 'adjective', 'pronoun', 'preposition'].includes(searchQuery.wordType)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid wordType. Must be one of: noun, verb, particle, adjective, pronoun, preposition' })
      };
    }

    // Validate difficulty if provided
    if (searchQuery.difficulty && !['beginner', 'intermediate', 'advanced'].includes(searchQuery.difficulty)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid difficulty. Must be one of: beginner, intermediate, advanced' })
      };
    }

    // Search for words
    const result = await contentDb.searchWords(searchQuery);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Error searching words:', error);

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