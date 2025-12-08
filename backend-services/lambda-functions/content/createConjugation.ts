import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ContentDatabaseService } from '../../utils/contentDatabase';
import { ConjugationGenerator } from '../../utils/conjugationGenerator';
import { VerbConjugation } from '../../types/content';

const contentDb = new ContentDatabaseService();
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
    if (!requestData.verbId || typeof requestData.verbId !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'verbId is required and must be a string' })
      };
    }

    if (!requestData.rootForm || typeof requestData.rootForm !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'rootForm is required and must be a string' })
      };
    }

    // Generate conjugations if not provided
    let conjugations = requestData.conjugations;
    if (!conjugations) {
      const pattern = requestData.pattern || conjugationGenerator.identifyPattern(requestData.rootForm);
      conjugations = conjugationGenerator.generateConjugations(requestData.rootForm, pattern);
    }

    // Handle irregular conjugations
    let irregularConjugations = {};
    if (requestData.irregularities && Array.isArray(requestData.irregularities)) {
      irregularConjugations = conjugationGenerator.generateIrregularConjugations(
        requestData.rootForm, 
        requestData.irregularities
      );
      
      // Merge irregular conjugations with regular ones
      conjugations = { ...conjugations, ...irregularConjugations };
    }

    const conjugationData: Omit<VerbConjugation, 'createdAt' | 'updatedAt'> = {
      verbId: requestData.verbId,
      rootForm: requestData.rootForm.trim(),
      conjugations,
      patterns: requestData.patterns || [requestData.pattern || 'form1'],
      irregularities: requestData.irregularities || []
    };

    // Validate conjugation data
    const validationErrors = conjugationGenerator.validateConjugation({
      ...conjugationData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    if (validationErrors.length > 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: 'Validation failed',
          details: validationErrors
        })
      };
    }

    // Create the conjugation
    const conjugation = await contentDb.createConjugation(conjugationData);

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'Conjugation created successfully',
        conjugation
      })
    };

  } catch (error) {
    console.error('Error creating conjugation:', error);

    if (error instanceof Error && error.name === 'ConditionalCheckFailedException') {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Conjugation already exists for this verb' })
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