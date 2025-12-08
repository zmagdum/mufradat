export interface WordProgress {
  userId: string;
  wordId: string;
  masteryLevel: number; // 0-100
  reviewCount: number;
  correctAnswers: number;
  lastReviewed: Date;
  nextReviewDate: Date;
  learningModalities: string[];
  difficultyAdjustments: number;
  averageResponseTime: number;
  easinessFactor: number; // SM-2 algorithm factor
  interval: number; // days until next review
  repetitions: number; // number of successful repetitions
  createdAt: Date;
  updatedAt: Date;
}

export interface LearningSession {
  sessionId: string;
  userId: string;
  wordId: string;
  sessionType: SessionType;
  startTime: Date;
  endTime: Date;
  responseTime: number; // milliseconds
  accuracy: number; // 0-1
  difficulty: number; // user-perceived difficulty 1-5
  learningModality: LearningModality;
  isCorrect: boolean;
  createdAt: Date;
}

export interface UserStatistics {
  userId: string;
  totalWordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  totalStudyTime: number; // minutes
  averageAccuracy: number;
  wordsReviewedToday: number;
  lastStudyDate: Date;
  studyGoal: number; // words per day
  createdAt: Date;
  updatedAt: Date;
}

export interface SpacedRepetitionConfig {
  initialInterval: number; // days
  maxInterval: number; // days
  minEasinessFactor: number;
  maxEasinessFactor: number;
  difficultyThreshold: number; // threshold for increasing difficulty
  masteryThreshold: number; // threshold for considering word mastered
  personalizationWeight: number; // weight for personalization factors
}

export interface ReviewSchedule {
  userId: string;
  wordId: string;
  scheduledDate: Date;
  priority: number; // 1-10, higher is more urgent
  reviewType: ReviewType;
  createdAt: Date;
}

export type SessionType = 'learning' | 'review' | 'practice' | 'test';
export type LearningModality = 'visual' | 'audio' | 'contextual' | 'associative' | 'conjugation';
export type ReviewType = 'spaced_repetition' | 'difficulty_adjustment' | 'mastery_check';

// API Request/Response types
export interface RecordSessionRequest {
  wordId: string;
  sessionType: SessionType;
  responseTime: number;
  accuracy: number;
  difficulty: number;
  learningModality: LearningModality;
  isCorrect: boolean;
}

export interface GetReviewQueueRequest {
  userId: string;
  limit?: number;
  includeOverdue?: boolean;
}

export interface ReviewQueueResponse {
  words: ReviewQueueItem[];
  totalCount: number;
  overdueCount: number;
}

export interface ReviewQueueItem {
  wordId: string;
  arabicText: string;
  transliteration: string;
  translation: string;
  scheduledDate: Date;
  priority: number;
  reviewType: ReviewType;
  daysSinceLastReview: number;
}

export interface ProgressStatsResponse {
  statistics: UserStatistics;
  recentSessions: LearningSession[];
  masteryDistribution: MasteryDistribution;
  streakHistory: StreakData[];
}

export interface MasteryDistribution {
  beginner: number; // 0-33
  intermediate: number; // 34-66
  advanced: number; // 67-100
}

export interface StreakData {
  date: string;
  wordsReviewed: number;
  accuracy: number;
}

// DynamoDB types
export interface DynamoDBWordProgress extends Omit<WordProgress, 'lastReviewed' | 'nextReviewDate' | 'createdAt' | 'updatedAt'> {
  pk: string; // 'USER#${userId}'
  sk: string; // 'PROGRESS#${wordId}'
  gsi1pk: string; // 'REVIEW#${userId}'
  gsi1sk: string; // 'DATE#${nextReviewDate.toISOString()}'
  gsi2pk: string; // 'MASTERY#${userId}'
  gsi2sk: string; // 'LEVEL#${masteryLevel}#WORD#${wordId}'
  lastReviewed: number;
  nextReviewDate: number;
  createdAt: number;
  updatedAt: number;
}

export interface DynamoDBLearningSession extends Omit<LearningSession, 'startTime' | 'endTime' | 'createdAt'> {
  pk: string; // 'USER#${userId}'
  sk: string; // 'SESSION#${sessionId}'
  gsi1pk: string; // 'WORD#${wordId}'
  gsi1sk: string; // 'SESSION#${createdAt}'
  gsi2pk: string; // 'DATE#${createdAt.toISOString().split('T')[0]}'
  gsi2sk: string; // 'USER#${userId}#SESSION#${sessionId}'
  startTime: number;
  endTime: number;
  createdAt: number;
}

export interface DynamoDBUserStatistics extends Omit<UserStatistics, 'lastStudyDate' | 'createdAt' | 'updatedAt'> {
  pk: string; // 'USER#${userId}'
  sk: string; // 'STATISTICS'
  lastStudyDate: number;
  createdAt: number;
  updatedAt: number;
}

export interface DynamoDBReviewSchedule extends Omit<ReviewSchedule, 'scheduledDate' | 'createdAt'> {
  pk: string; // 'SCHEDULE#${userId}'
  sk: string; // 'REVIEW#${scheduledDate.toISOString()}#${wordId}'
  gsi1pk: string; // 'USER#${userId}'
  gsi1sk: string; // 'PRIORITY#${priority}#DATE#${scheduledDate.toISOString()}'
  scheduledDate: number;
  createdAt: number;
}