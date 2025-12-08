import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  PutCommand, 
  GetCommand, 
  UpdateCommand, 
  DeleteCommand, 
  QueryCommand, 
  ScanCommand 
} from '@aws-sdk/lib-dynamodb';
import { 
  VocabularyWord, 
  VerbConjugation, 
  DynamoDBWord, 
  DynamoDBConjugation,
  WordSearchQuery,
  WordSearchResponse 
} from '../types/content';
import { v4 as uuidv4 } from 'uuid';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const CONTENT_TABLE = process.env.CONTENT_TABLE_NAME || 'quranic-vocab-content';

export class ContentDatabaseService {
  
  async createWord(wordData: Omit<VocabularyWord, 'wordId' | 'createdAt' | 'updatedAt'>): Promise<VocabularyWord> {
    const wordId = uuidv4();
    const now = Date.now();
    
    const word: VocabularyWord = {
      ...wordData,
      wordId,
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString()
    };

    const dynamoItem: DynamoDBWord = {
      ...word,
      pk: `WORD#${wordId}`,
      sk: 'METADATA',
      gsi1pk: `WORDTYPE#${word.wordType}`,
      gsi1sk: `DIFFICULTY#${word.difficulty}#FREQUENCY#${word.frequency.toString().padStart(6, '0')}`,
      gsi2pk: `ROOT#${word.rootLetters}`,
      gsi2sk: `WORD#${wordId}`,
      createdAt: now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: CONTENT_TABLE,
      Item: dynamoItem,
      ConditionExpression: 'attribute_not_exists(pk)'
    }));

    return word;
  }

  async getWord(wordId: string): Promise<VocabularyWord | null> {
    const result = await docClient.send(new GetCommand({
      TableName: CONTENT_TABLE,
      Key: {
        pk: `WORD#${wordId}`,
        sk: 'METADATA'
      }
    }));

    if (!result.Item) {
      return null;
    }

    return this.dynamoItemToWord(result.Item as DynamoDBWord);
  }

  async updateWord(wordId: string, updates: Partial<Omit<VocabularyWord, 'wordId' | 'createdAt' | 'updatedAt'>>): Promise<VocabularyWord> {
    const now = Date.now();
    
    // Build update expression
    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        updateExpressions.push(`#${key} = :${key}`);
        expressionAttributeNames[`#${key}`] = key;
        expressionAttributeValues[`:${key}`] = value;
      }
    });

    // Always update the updatedAt timestamp
    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = now;

    // Update GSI keys if relevant fields are being updated
    if (updates.wordType || updates.difficulty || updates.frequency) {
      const currentWord = await this.getWord(wordId);
      if (!currentWord) {
        throw new Error('Word not found');
      }

      const newWordType = updates.wordType || currentWord.wordType;
      const newDifficulty = updates.difficulty || currentWord.difficulty;
      const newFrequency = updates.frequency || currentWord.frequency;

      updateExpressions.push('#gsi1pk = :gsi1pk', '#gsi1sk = :gsi1sk');
      expressionAttributeNames['#gsi1pk'] = 'gsi1pk';
      expressionAttributeNames['#gsi1sk'] = 'gsi1sk';
      expressionAttributeValues[':gsi1pk'] = `WORDTYPE#${newWordType}`;
      expressionAttributeValues[':gsi1sk'] = `DIFFICULTY#${newDifficulty}#FREQUENCY#${newFrequency.toString().padStart(6, '0')}`;
    }

    if (updates.rootLetters) {
      updateExpressions.push('#gsi2pk = :gsi2pk');
      expressionAttributeNames['#gsi2pk'] = 'gsi2pk';
      expressionAttributeValues[':gsi2pk'] = `ROOT#${updates.rootLetters}`;
    }

    const result = await docClient.send(new UpdateCommand({
      TableName: CONTENT_TABLE,
      Key: {
        pk: `WORD#${wordId}`,
        sk: 'METADATA'
      },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
      ConditionExpression: 'attribute_exists(pk)'
    }));

    return this.dynamoItemToWord(result.Attributes as DynamoDBWord);
  }

  async deleteWord(wordId: string): Promise<void> {
    await docClient.send(new DeleteCommand({
      TableName: CONTENT_TABLE,
      Key: {
        pk: `WORD#${wordId}`,
        sk: 'METADATA'
      },
      ConditionExpression: 'attribute_exists(pk)'
    }));
  }

  async searchWords(query: WordSearchQuery): Promise<WordSearchResponse> {
    let command;
    let items: any[] = [];

    if (query.rootLetters) {
      // Search by root letters using GSI2
      command = new QueryCommand({
        TableName: CONTENT_TABLE,
        IndexName: 'GSI2',
        KeyConditionExpression: 'gsi2pk = :rootPk',
        ExpressionAttributeValues: {
          ':rootPk': `ROOT#${query.rootLetters}`
        },
        Limit: query.limit || 50,
        ExclusiveStartKey: query.lastEvaluatedKey ? JSON.parse(query.lastEvaluatedKey) : undefined
      });
    } else if (query.wordType) {
      // Search by word type using GSI1
      let keyConditionExpression = 'gsi1pk = :wordTypePk';
      const expressionAttributeValues: Record<string, any> = {
        ':wordTypePk': `WORDTYPE#${query.wordType}`
      };

      if (query.difficulty) {
        keyConditionExpression += ' AND begins_with(gsi1sk, :difficultySk)';
        expressionAttributeValues[':difficultySk'] = `DIFFICULTY#${query.difficulty}`;
      }

      command = new QueryCommand({
        TableName: CONTENT_TABLE,
        IndexName: 'GSI1',
        KeyConditionExpression: keyConditionExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        Limit: query.limit || 50,
        ExclusiveStartKey: query.lastEvaluatedKey ? JSON.parse(query.lastEvaluatedKey) : undefined
      });
    } else {
      // Full table scan with filters
      const filterExpressions: string[] = [];
      const expressionAttributeValues: Record<string, any> = {};

      if (query.difficulty) {
        filterExpressions.push('difficulty = :difficulty');
        expressionAttributeValues[':difficulty'] = query.difficulty;
      }

      if (query.searchTerm) {
        filterExpressions.push('(contains(arabicText, :searchTerm) OR contains(transliteration, :searchTerm) OR contains(translation, :searchTerm))');
        expressionAttributeValues[':searchTerm'] = query.searchTerm;
      }

      command = new ScanCommand({
        TableName: CONTENT_TABLE,
        FilterExpression: filterExpressions.length > 0 ? filterExpressions.join(' AND ') : undefined,
        ExpressionAttributeValues: Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
        Limit: query.limit || 50,
        ExclusiveStartKey: query.lastEvaluatedKey ? JSON.parse(query.lastEvaluatedKey) : undefined
      });
    }

    const result = await docClient.send(command);
    items = result.Items || [];

    // Filter out non-word items and convert to VocabularyWord objects
    const words = items
      .filter(item => item.pk.startsWith('WORD#') && item.sk === 'METADATA')
      .map(item => this.dynamoItemToWord(item as DynamoDBWord));

    return {
      words,
      lastEvaluatedKey: result.LastEvaluatedKey ? JSON.stringify(result.LastEvaluatedKey) : undefined,
      count: words.length
    };
  }

  async getWordsByIds(wordIds: string[]): Promise<VocabularyWord[]> {
    const words: VocabularyWord[] = [];
    
    // DynamoDB BatchGet has a limit of 100 items
    const batchSize = 100;
    for (let i = 0; i < wordIds.length; i += batchSize) {
      const batch = wordIds.slice(i, i + batchSize);
      const keys = batch.map(wordId => ({
        pk: `WORD#${wordId}`,
        sk: 'METADATA'
      }));

      const result = await docClient.send(new QueryCommand({
        TableName: CONTENT_TABLE,
        KeyConditionExpression: 'pk IN (:keys)',
        ExpressionAttributeValues: {
          ':keys': keys.map(key => key.pk)
        }
      }));

      if (result.Items) {
        const batchWords = result.Items
          .filter(item => item.sk === 'METADATA')
          .map(item => this.dynamoItemToWord(item as DynamoDBWord));
        words.push(...batchWords);
      }
    }

    return words;
  }

  // Conjugation methods
  async createConjugation(conjugationData: Omit<VerbConjugation, 'createdAt' | 'updatedAt'>): Promise<VerbConjugation> {
    const now = Date.now();
    
    const conjugation: VerbConjugation = {
      ...conjugationData,
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString()
    };

    const dynamoItem: DynamoDBConjugation = {
      ...conjugation,
      pk: `CONJUGATION#${conjugation.verbId}`,
      sk: 'METADATA',
      createdAt: now,
      updatedAt: now
    };

    await docClient.send(new PutCommand({
      TableName: CONTENT_TABLE,
      Item: dynamoItem,
      ConditionExpression: 'attribute_not_exists(pk)'
    }));

    return conjugation;
  }

  async getConjugation(verbId: string): Promise<VerbConjugation | null> {
    const result = await docClient.send(new GetCommand({
      TableName: CONTENT_TABLE,
      Key: {
        pk: `CONJUGATION#${verbId}`,
        sk: 'METADATA'
      }
    }));

    if (!result.Item) {
      return null;
    }

    return this.dynamoItemToConjugation(result.Item as DynamoDBConjugation);
  }

  private dynamoItemToWord(item: DynamoDBWord): VocabularyWord {
    const { pk, sk, gsi1pk, gsi1sk, gsi2pk, gsi2sk, createdAt, updatedAt, ...wordData } = item;
    return {
      ...wordData,
      createdAt: new Date(createdAt).toISOString(),
      updatedAt: new Date(updatedAt).toISOString()
    };
  }

  private dynamoItemToConjugation(item: DynamoDBConjugation): VerbConjugation {
    const { pk, sk, createdAt, updatedAt, ...conjugationData } = item;
    return {
      ...conjugationData,
      createdAt: new Date(createdAt).toISOString(),
      updatedAt: new Date(updatedAt).toISOString()
    };
  }
}