/**
 * Create Verb Conjugation Lambda
 * Creates a new verb conjugation entry
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodbDocumentClient } from '../shared/dynamodb-client';
import { success, failure } from '../shared/response-utils';
import { VerbConjugation, validateVerbConjugation } from '../../../../shared/types';
import {
  extractRootLetters,
  generateVerbConjugation,
  VerbForm,
} from './conjugation-generator';
import { v4 as uuid } from 'uuid';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const data = JSON.parse(event.body || '{}');

    // Extract data
    const verbId = data.verbId || uuid();
    const rootForm = data.rootForm;
    const form = data.form || VerbForm.FORM_I;

    if (!rootForm) {
      return failure('Root form is required', 400);
    }

    // Extract root letters
    const rootLetters = data.rootLetters || extractRootLetters(rootForm);

    // Generate conjugation
    const conjugation: VerbConjugation = generateVerbConjugation(
      verbId,
      rootForm,
      rootLetters,
      form
    );

    // Allow manual overrides
    if (data.conjugations) {
      conjugation.conjugations = { ...conjugation.conjugations, ...data.conjugations };
    }
    if (data.patterns) {
      conjugation.patterns = data.patterns;
    }
    if (data.irregularities) {
      conjugation.irregularities = data.irregularities;
    }

    // Validate conjugation
    const validationResult = validateVerbConjugation(conjugation);
    if (!validationResult.valid) {
      const message = validationResult.errors.map((e) => e.message).join(', ');
      return failure(message, 400);
    }

    // Store in DynamoDB
    await dynamodbDocumentClient.send(
      new PutCommand({
        TableName: process.env.CONJUGATIONS_TABLE_NAME,
        Item: conjugation,
        ConditionExpression: 'attribute_not_exists(verbId)',
      })
    );

    return success({ conjugation }, 201);
  } catch (error: any) {
    console.error('Create conjugation error:', error);

    if (error.name === 'ConditionalCheckFailedException') {
      return failure('Conjugation with this ID already exists', 409);
    }

    return failure('Failed to create conjugation');
  }
};

