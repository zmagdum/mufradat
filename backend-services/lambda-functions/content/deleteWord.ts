import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ContentDatabaseService } from '../../utils/contentDatabase';
import { S3MediaService } from '../../utils/s3Service';

const contentDb = new ContentDatabaseService();
const s3Service = new S3MediaService();

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'DELETE,OPTIONS'
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

    if (event.httpMethod !== 'DELETE') {
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

    // Check if word exists before deletion
    const existingWord = await contentDb.getWord(wordId);
    if (!existingWord) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Word not found' })
      };
    }

    // Delete associated media files from S3
    try {
      await s3Service.deleteAllWordMedia(wordId);
    } catch (error) {
      console.error('Error deleting media files:', error);
      // Continue with word deletion even if media deletion fails
    }

    // Delete the word from database
    await contentDb.deleteWord(wordId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Word deleted successfully'
      })
    };

  } catch (error) {
    console.error('Error deleting word:', error);

    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
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