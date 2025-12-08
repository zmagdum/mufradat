/**
 * Learning progress-related type definitions
 */

export interface WordProgress {
  userId: string;
  wordId: string;
  masteryLevel: number; // 0-100
  reviewCount: number;
  correctAnswers: number;
  lastReviewed: Date;
  nextReviewDate: Date;
  learningModality: string[];
  difficultyAdjustments: number;
  averageResponseTime: number;
}

export interface LearningSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime: Date;
  wordsStudied: string[]; // wordIds
  wordsReviewed: string[]; // wordIds
  accuracy: number;
  totalTime: number;
}

