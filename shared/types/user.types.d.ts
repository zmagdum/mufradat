/**
 * User-related type definitions
 */
export interface UserProfile {
    userId: string;
    email: string;
    displayName: string;
    createdAt: Date;
    lastActiveAt: Date;
    preferences: UserPreferences;
    statistics: UserStatistics;
}
export interface UserPreferences {
    learningModalities: string[];
    notificationFrequency: 'low' | 'medium' | 'high';
    studyGoal: number;
    preferredStudyTime: string;
}
export interface UserStatistics {
    totalWordsLearned: number;
    currentStreak: number;
    longestStreak: number;
    totalStudyTime: number;
}
//# sourceMappingURL=user.types.d.ts.map