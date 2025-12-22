/**
 * List Books Lambda
 * Lists all books from the books table
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodbDocumentClient } from '../shared/dynamodb-client';
import { createSuccessResponse, createErrorResponse } from '../shared/response-utils';

export const handler: APIGatewayProxyHandler = async (event) => {
  const origin = event.headers?.origin || event.headers?.Origin;
  
  try {
    const tableName = process.env.BOOKS_TABLE_NAME;
    
    if (!tableName) {
      return createErrorResponse(
        'CONFIG_ERROR',
        'Books table name not configured',
        500,
        undefined,
        origin
      );
    }

    // Scan the books table and filter for items with itemType = 'BOOK'
    const result = await dynamodbDocumentClient.send(
      new ScanCommand({
        TableName: tableName,
        FilterExpression: 'itemType = :itemType',
        ExpressionAttributeValues: {
          ':itemType': 'BOOK',
        },
      })
    );

    const books = (result.Items || []).map((item: any) => ({
      bookId: item.bookId,
      title: item.title || '',
      titleUrdu: item.titleUrdu || undefined,
      description: item.description || '',
      descriptionUrdu: item.descriptionUrdu || undefined,
      series: item.series || undefined,
      seriesUrdu: item.seriesUrdu || undefined,
    }));

    return createSuccessResponse(
      {
        books,
        count: books.length,
      },
      200,
      origin
    );
  } catch (error: any) {
    console.error('List books error:', error);
    return createErrorResponse(
      'SERVER_ERROR',
      'Failed to list books',
      500,
      { error: error.message },
      origin
    );
  }
};

