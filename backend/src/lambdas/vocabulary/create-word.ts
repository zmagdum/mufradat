/**
 * Create Vocabulary Word Lambda
 * Creates a new vocabulary word in DynamoDB with media content in S3
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodbDocumentClient } from '../shared/dynamodb-client';
import { success, failure } from '../shared/response-utils';
import { VocabularyWord } from '../../../../shared/types';
import { validateVocabularyWord } from '../../../../shared/validators';
import { v4 as uuid } from 'uuid';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const data = JSON.parse(event.body || '{}');

    // Generate word ID if not provided
    const wordId = data.wordId || uuid();

    // Create vocabulary word object
    const vocabularyWord: VocabularyWord = {
      wordId,
      arabicText: data.arabicText,
      transliteration: data.transliteration,
      translation: data.translation,
      rootLetters: data.rootLetters,
      wordType: data.wordType,
      frequency: data.frequency || 0,
      difficulty: data.difficulty || 'beginner',
      mediaContent: data.mediaContent || {
        audioUrl: '',
        imageUrls: [],
        calligraphyUrl: '',
      },
      contextualExamples: data.contextualExamples || [],
      relatedWords: data.relatedWords || [],
    };

    // Validate word data
    const validationErrors = validateVocabularyWord(vocabularyWord);
    if (validationErrors) {
      return failure(validationErrors.join(', '), 400);
    }

    // Store in DynamoDB
    await dynamodbDocumentClient.send(
      new PutCommand({
        TableName: process.env.VOCABULARY_TABLE_NAME,
        Item: vocabularyWord,
        ConditionExpression: 'attribute_not_exists(wordId)', // Prevent overwriting
      })
    );

    return success({ word: vocabularyWord }, 201);
  } catch (error: any) {
    console.error('Create word error:', error);

    // Handle duplicate word error
    if (error.name === 'ConditionalCheckFailedException') {
      return failure('Word with this ID already exists', 409);
    }

    return failure('Failed to create vocabulary word');
  }
};

