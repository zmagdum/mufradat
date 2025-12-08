/**
 * Process Analytics Lambda
 * Processes analytics events from SQS for batch operations
 * Triggered by SQS queue messages
 */

import { SQSHandler } from 'aws-lambda';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { dynamodbDocumentClient } from '../shared/dynamodb-client';

export const handler: SQSHandler = async (event) => {
  console.log(`Processing ${event.Records.length} analytics events`);

  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      const { eventType, userId } = message;

      switch (eventType) {
        case 'session_completed':
          await updateUserStreak(userId, message.startTime);
          await updateTotalStudyTime(userId, message.duration);
          break;

        case 'word_mastered':
          await incrementMasteredWords(userId);
          break;

        case 'milestone_reached':
          await recordMilestone(userId, message.milestone);
          break;

        default:
          console.log(`Unknown event type: ${eventType}`);
      }
    } catch (error) {
      console.error('Error processing analytics event:', error);
      // Don't throw - process other messages
    }
  }

  console.log('Analytics processing complete');
};

/**
 * Update user's study streak
 */
async function updateUserStreak(userId: string, sessionDate: string): Promise<void> {
  // Logic to update streak in user profile
  // This would check last session date and update accordingly
  console.log(`Updating streak for user ${userId}`);
  
  // TODO: Implement actual streak update logic with conditional updates
}

/**
 * Update user's total study time
 */
async function updateTotalStudyTime(userId: string, duration: number): Promise<void> {
  await dynamodbDocumentClient.send(
    new UpdateCommand({
      TableName: process.env.USERS_TABLE_NAME,
      Key: { userId },
      UpdateExpression: 'ADD totalStudyTime :duration',
      ExpressionAttributeValues: {
        ':duration': duration,
      },
    })
  );
}

/**
 * Increment count of mastered words
 */
async function incrementMasteredWords(userId: string): Promise<void> {
  await dynamodbDocumentClient.send(
    new UpdateCommand({
      TableName: process.env.USERS_TABLE_NAME,
      Key: { userId },
      UpdateExpression: 'ADD masteredWords :one',
      ExpressionAttributeValues: {
        ':one': 1,
      },
    })
  );
}

/**
 * Record milestone achievement
 */
async function recordMilestone(userId: string, milestone: any): Promise<void> {
  console.log(`Recording milestone for user ${userId}:`, milestone);
  // TODO: Store milestone in achievements table
}

