import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ConjugationGenerator } from '../../utils/conjugationGenerator';
import { conjugationCache } from '../../utils/conjugationCache';

const conjugationGenerator = new ConjugationGenerator();

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

    // Parse request body
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

    // Validate required fields
    if (!requestData.rootForm || typeof requestData.rootForm !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'rootForm is required and must be a string' })
      };
    }

    const rootForm = requestData.rootForm.trim();
    const pattern = requestData.pattern || conjugationGenerator.identifyPattern(rootForm);
    const irregularities = requestData.irregularities || [];

    // Try to get from cache first
    let conjugations = await conjugationCache.getGeneratedConjugations(rootForm, pattern);
    
    if (!conjugations) {
      // Generate conjugations if not in cache
      try {
        conjugations = conjugationGenerator.generateConjugations(rootForm, pattern);
        
        // Handle irregular conjugations if specified
        if (irregularities.length > 0) {
          const irregularConjugations = conjugationGenerator.generateIrregularConjugations(
            rootForm, 
            irregularities
          );
          conjugations = { ...conjugations, ...irregularConjugations };
        }
        
        // Cache the generated conjugations
        await conjugationCache.cacheGeneratedConjugations(rootForm, pattern, conjugations);
      } catch (error) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Failed to generate conjugations',
            details: error.message
          })
        };
      }
    }

    // Get pattern information
    const patternInfo = conjugationGenerator.getPatternInfo(pattern);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        rootForm,
        pattern,
        patternInfo,
        conjugations,
        irregularities,
        message: 'Conjugations generated successfully'
      })
    };

  } catch (error) {
    console.error('Error generating conjugations:', error);

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