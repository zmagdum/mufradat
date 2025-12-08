export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  createdAt: string;
  lastActiveAt: string;
  preferences: UserPreferences;
  statistics: UserStatistics;
}

export interface UserPreferences {
  learningModalities: LearningModality[];
  notificationFrequency: NotificationFrequency;
  studyGoal: number; // words per day
  preferredStudyTime: string; // HH:MM format
}

export interface UserStatistics {
  totalWordsLearned: number;
  currentStreak: number;
  longestStreak: number;
  totalStudyTime: number; // in minutes
}

export type LearningModality = 'visual' | 'audio' | 'contextual' | 'associative';
export type NotificationFrequency = 'low' | 'medium' | 'high';

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user: Omit<UserProfile, 'passwordHash'>;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface DatabaseUser extends UserProfile {
  passwordHash: string;
}