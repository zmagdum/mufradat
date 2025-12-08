/**
 * Record Learning Session Lambda
 * Records a completed learning session with all progress data
 */

import { APIGatewayProxyHandler } from 'aws-lambda';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { dynamodbDocumentClient } from '../shared/dynamodb-client';
import { success, failure } from '../shared/response-utils';
import { v4 as uuid } from 'uuid';

const isLocal = process.env.STAGE === 'local';

const sqsClient = new SQSClient({
  region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
  ...(isLocal && {
    endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
    },
  }),
});

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const data = JSON.parse(event.body || '{}');
    const {
      userId,
      wordsReviewed,
      startTime,
      endTime,
      newWordsLearned,
      correctReviews,
      totalReviews,
    } = data;

    // Validate input
    if (!userId || !startTime || !endTime) {
      return failure('Missing required fields: userId, startTime, endTime', 400);
    }

    const sessionId = uuid();
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    const durationMinutes = Math.round(duration / 60000);

    // Calculate session statistics
    const accuracyRate = totalReviews > 0 ? (correctReviews / totalReviews) * 100 : 0;

    const session = {
      userId,
      sessionId,
      startTime,
      endTime,
      duration: durationMinutes,
      wordsReviewed: wordsReviewed || [],
      newWordsLearned: newWordsLearned || 0,
      totalReviews: totalReviews || 0,
      correctReviews: correctReviews || 0,
      accuracyRate: Math.round(accuracyRate),
      createdAt: new Date().toISOString(),
      expiresAt: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60), // 90 days TTL
    };

    // Store session in DynamoDB
    await dynamodbDocumentClient.send(
      new PutCommand({
        TableName: process.env.SESSIONS_TABLE_NAME,
        Item: session,
      })
    );

    // Send to SQS for async analytics processing
    const queueUrl = process.env.ANALYTICS_QUEUE_URL;
    if (queueUrl) {
      await sqsClient.send(
        new SendMessageCommand({
          QueueUrl: queueUrl,
          MessageBody: JSON.stringify({
            eventType: 'session_completed',
            ...session,
          }),
        })
      );
    }

    return success({
      message: 'Session recorded successfully',
      sessionId,
      statistics: {
        duration: `${durationMinutes} minutes`,
        accuracy: `${Math.round(accuracyRate)}%`,
        wordsReviewed: totalReviews,
      },
    }, 201);
  } catch (error: any) {
    console.error('Record session error:', error);
    return failure('Failed to record session');
  }
};

