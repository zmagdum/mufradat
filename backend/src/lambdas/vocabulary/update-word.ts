/**
 * Update Vocabulary Word Lambda
 * Updates an existing vocabulary word
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodbDocumentClient } from '../shared/dynamodb-client';
import { success, failure } from '../shared/response-utils';
import { VocabularyWord } from '../../../../shared/types';
import { validateVocabularyWord } from '../../../../shared/validators';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const wordId = event.pathParameters?.wordId;
    const data = JSON.parse(event.body || '{}');

    if (!wordId) {
      return failure('Word ID is required', 400);
    }

    // Check if word exists
    const existingResult = await dynamodbDocumentClient.send(
      new GetCommand({
        TableName: process.env.VOCABULARY_TABLE_NAME,
        Key: { wordId },
      })
    );

    if (!existingResult.Item) {
      return failure('Word not found', 404);
    }

    const existingWord = existingResult.Item as VocabularyWord;

    // Merge updates (prevent changing wordId)
    const updatedWord: VocabularyWord = {
      ...existingWord,
      ...data,
      wordId: existingWord.wordId, // Ensure wordId doesn't change
    };

    // Validate updated word
    const validationErrors = validateVocabularyWord(updatedWord);
    if (validationErrors) {
      return failure(validationErrors.join(', '), 400);
    }

    // Update in DynamoDB
    await dynamodbDocumentClient.send(
      new PutCommand({
        TableName: process.env.VOCABULARY_TABLE_NAME,
        Item: updatedWord,
      })
    );

    return success({ word: updatedWord });
  } catch (error: any) {
    console.error('Update word error:', error);
    return failure('Failed to update vocabulary word');
  }
};

