/**
 * Generate Conjugation Lambda
 * Generates conjugation forms on-the-fly without storing
 * Useful for preview or temporary generation
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { success, failure } from '../shared/response-utils';
import {
  extractRootLetters,
  generateVerbConjugation,
  VerbForm,
  isIrregularVerb,
} from './conjugation-generator';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const data = JSON.parse(event.body || '{}');
    const { rootForm, form } = data;

    if (!rootForm) {
      return failure('Root form is required', 400);
    }

    // Extract root letters
    const rootLetters = extractRootLetters(rootForm);

    if (rootLetters.length < 3) {
      return failure('Root form must have at least 3 letters', 400);
    }

    // Check if irregular
    const irregular = isIrregularVerb(rootLetters);

    // Generate conjugation
    const conjugation = generateVerbConjugation(
      'temp-id',
      rootForm,
      rootLetters,
      form || VerbForm.FORM_I
    );

    return success({
      conjugation,
      rootLetters,
      irregular,
      warning: irregular ? 'This verb may have irregular forms not captured in automatic generation' : null,
    });
  } catch (error: any) {
    console.error('Generate conjugation error:', error);
    return failure('Failed to generate conjugation: ' + error.message);
  }
};

