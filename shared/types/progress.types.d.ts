/**
 * Learning progress-related type definitions
 */
export interface WordProgress {
    userId: string;
    wordId: string;
    masteryLevel: number;
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
    wordsStudied: string[];
    wordsReviewed: string[];
    accuracy: number;
    totalTime: number;
}
//# sourceMappingURL=progress.types.d.ts.map