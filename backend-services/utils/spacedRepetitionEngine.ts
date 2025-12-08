import { 
  WordProgress, 
  LearningSession, 
  SpacedRepetitionConfig, 
  ReviewSchedule,
  SessionType,
  ReviewType 
} from '../types/progress';

/**
 * Core Spaced Repetition Engine implementing modified SM-2 algorithm
 * with personalization factors for optimal vocabulary retention
 */
export class SpacedRepetitionEngine {
  private config: SpacedRepetitionConfig;

  constructor(config?: Partial<SpacedRepetitionConfig>) {
    this.config = {
      initialInterval: 1, // 1 day
      maxInterval: 180, // 6 months
      minEasinessFactor: 1.3,
      maxEasinessFactor: 2.5,
      difficultyThreshold: 0.6, // 60% accuracy threshold
      masteryThreshold: 80, // 80% mastery level
      personalizationWeight: 0.3, // 30% weight for personalization
      ...config
    };
  }

  /**
   * Calculate next review date based on SM-2 algorithm with personalization
   */
  calculateNextReview(
    progress: WordProgress, 
    session: LearningSession,
    userPersonalizationFactor: number = 1.0
  ): { nextReviewDate: Date; interval: number; easinessFactor: number; repetitions: number } {
    const quality = this.calculateQuality(session);
    let { easinessFactor, interval, repetitions } = progress;

    // Update easiness factor based on performance
    easinessFactor = this.updateEasinessFactor(easinessFactor, quality);
    
    // Calculate new interval based on SM-2 algorithm
    if (quality < 3) {
      // Poor performance - reset repetitions and use short interval
      repetitions = 0;
      interval = 1;
    } else {
      // Good performance - increase interval
      repetitions += 1;
      
      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 6;
      } else {
        interval = Math.round(interval * easinessFactor);
      }
    }

    // Apply personalization factor
    interval = Math.round(interval * userPersonalizationFactor * 
      (1 + (this.config.personalizationWeight * (session.accuracy - 0.5))));

    // Ensure interval is within bounds
    interval = Math.max(1, Math.min(interval, this.config.maxInterval));

    // Calculate next review date
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    return {
      nextReviewDate,
      interval,
      easinessFactor,
      repetitions
    };
  }

  /**
   * Calculate quality score (0-5) based on session performance
   */
  private calculateQuality(session: LearningSession): number {
    const accuracyWeight = 0.6;
    const responseTimeWeight = 0.2;
    const difficultyWeight = 0.2;

    // Normalize response time (assuming optimal response time is 3 seconds)
    const optimalResponseTime = 3000; // 3 seconds in milliseconds
    const responseTimeScore = Math.max(0, 1 - (session.responseTime / (optimalResponseTime * 2)));

    // Normalize difficulty (1-5 scale, where 1 is easy and 5 is very hard)
    const difficultyScore = (6 - session.difficulty) / 5;

    // Calculate weighted quality score
    const qualityScore = (
      session.accuracy * accuracyWeight +
      responseTimeScore * responseTimeWeight +
      difficultyScore * difficultyWeight
    ) * 5; // Scale to 0-5

    return Math.max(0, Math.min(5, Math.round(qualityScore)));
  }

  /**
   * Update easiness factor based on quality score
   */
  private updateEasinessFactor(currentEF: number, quality: number): number {
    const newEF = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    return Math.max(this.config.minEasinessFactor, Math.min(this.config.maxEasinessFactor, newEF));
  }

  /**
   * Calculate mastery level based on progress history
   */
  calculateMasteryLevel(progress: WordProgress, recentSessions: LearningSession[]): number {
    const baseAccuracy = progress.correctAnswers / Math.max(1, progress.reviewCount);
    const recentAccuracy = this.calculateRecentAccuracy(recentSessions);
    const consistencyBonus = this.calculateConsistencyBonus(recentSessions);
    const repetitionBonus = Math.min(20, progress.repetitions * 2);

    let masteryLevel = (
      baseAccuracy * 40 + // 40% weight for overall accuracy
      recentAccuracy * 30 + // 30% weight for recent performance
      consistencyBonus * 20 + // 20% weight for consistency
      repetitionBonus // 10% weight for repetitions (up to 20 points)
    );

    // Apply difficulty adjustment
    masteryLevel *= (1 + progress.difficultyAdjustments * 0.1);

    return Math.max(0, Math.min(100, Math.round(masteryLevel)));
  }

  /**
   * Calculate recent accuracy from last 5 sessions
   */
  private calculateRecentAccuracy(sessions: LearningSession[]): number {
    if (sessions.length === 0) return 0;
    
    const recentSessions = sessions.slice(-5);
    const totalAccuracy = recentSessions.reduce((sum, session) => sum + session.accuracy, 0);
    return (totalAccuracy / recentSessions.length) * 100;
  }

  /**
   * Calculate consistency bonus based on session regularity
   */
  private calculateConsistencyBonus(sessions: LearningSession[]): number {
    if (sessions.length < 3) return 0;

    const sortedSessions = sessions.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    const intervals: number[] = [];

    for (let i = 1; i < sortedSessions.length; i++) {
      const interval = (sortedSessions[i].createdAt.getTime() - sortedSessions[i-1].createdAt.getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(interval);
    }

    // Calculate coefficient of variation (lower is more consistent)
    const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - mean, 2), 0) / intervals.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = standardDeviation / mean;

    // Convert to bonus (lower CV = higher bonus)
    return Math.max(0, 20 - (coefficientOfVariation * 10));
  }

  /**
   * Determine if difficulty should be adjusted
   */
  shouldAdjustDifficulty(progress: WordProgress, recentSessions: LearningSession[]): {
    shouldAdjust: boolean;
    direction: 'increase' | 'decrease';
    reason: string;
  } {
    const recentAccuracy = this.calculateRecentAccuracy(recentSessions) / 100;
    const averageResponseTime = recentSessions.reduce((sum, s) => sum + s.responseTime, 0) / recentSessions.length;

    // Too easy - increase difficulty
    if (recentAccuracy > 0.9 && averageResponseTime < 2000 && progress.repetitions >= 3) {
      return {
        shouldAdjust: true,
        direction: 'increase',
        reason: 'High accuracy and fast response times indicate word may be too easy'
      };
    }

    // Too hard - decrease difficulty
    if (recentAccuracy < this.config.difficultyThreshold && progress.reviewCount >= 5) {
      return {
        shouldAdjust: true,
        direction: 'decrease',
        reason: 'Low accuracy indicates word may be too difficult'
      };
    }

    return {
      shouldAdjust: false,
      direction: 'increase',
      reason: 'Current difficulty level is appropriate'
    };
  }

  /**
   * Calculate priority for review scheduling (1-10, higher is more urgent)
   */
  calculateReviewPriority(progress: WordProgress, currentDate: Date = new Date()): number {
    const daysSinceLastReview = Math.floor(
      (currentDate.getTime() - progress.lastReviewed.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysOverdue = Math.max(0, daysSinceLastReview - progress.interval);
    
    let priority = 5; // Base priority

    // Increase priority for overdue reviews
    if (daysOverdue > 0) {
      priority += Math.min(3, daysOverdue * 0.5);
    }

    // Increase priority for low mastery words
    if (progress.masteryLevel < 50) {
      priority += 2;
    } else if (progress.masteryLevel < 30) {
      priority += 3;
    }

    // Increase priority for words with recent poor performance
    if (progress.correctAnswers / Math.max(1, progress.reviewCount) < 0.6) {
      priority += 1;
    }

    // Decrease priority for well-mastered words
    if (progress.masteryLevel > this.config.masteryThreshold) {
      priority -= 1;
    }

    return Math.max(1, Math.min(10, Math.round(priority)));
  }

  /**
   * Generate personalization factor based on user learning patterns
   */
  calculatePersonalizationFactor(
    userAccuracy: number,
    averageResponseTime: number,
    preferredModalities: string[],
    sessionModality: string
  ): number {
    let factor = 1.0;

    // Adjust based on user's overall accuracy
    if (userAccuracy > 0.8) {
      factor *= 1.2; // Faster progression for high performers
    } else if (userAccuracy < 0.6) {
      factor *= 0.8; // Slower progression for struggling users
    }

    // Adjust based on response time
    if (averageResponseTime < 3000) {
      factor *= 1.1; // Slightly faster for quick responders
    } else if (averageResponseTime > 8000) {
      factor *= 0.9; // Slightly slower for slow responders
    }

    // Adjust based on learning modality preference
    if (preferredModalities.includes(sessionModality)) {
      factor *= 1.15; // Faster progression in preferred modalities
    }

    return Math.max(0.5, Math.min(2.0, factor));
  }

  /**
   * Create review schedule for a word
   */
  createReviewSchedule(
    userId: string,
    wordId: string,
    scheduledDate: Date,
    reviewType: ReviewType,
    priority: number
  ): ReviewSchedule {
    return {
      userId,
      wordId,
      scheduledDate,
      priority,
      reviewType,
      createdAt: new Date()
    };
  }

  /**
   * Determine optimal review type based on progress
   */
  determineReviewType(progress: WordProgress, recentSessions: LearningSession[]): ReviewType {
    // Check if mastery assessment is needed
    if (progress.masteryLevel > this.config.masteryThreshold && progress.repetitions >= 5) {
      return 'mastery_check';
    }

    // Check if difficulty adjustment is needed
    const difficultyCheck = this.shouldAdjustDifficulty(progress, recentSessions);
    if (difficultyCheck.shouldAdjust) {
      return 'difficulty_adjustment';
    }

    // Default to spaced repetition
    return 'spaced_repetition';
  }
}

/**
 * Factory function to create configured spaced repetition engine
 */
export function createSpacedRepetitionEngine(config?: Partial<SpacedRepetitionConfig>): SpacedRepetitionEngine {
  return new SpacedRepetitionEngine(config);
}

/**
 * Default configuration for the spaced repetition engine
 */
export const DEFAULT_SR_CONFIG: SpacedRepetitionConfig = {
  initialInterval: 1,
  maxInterval: 180,
  minEasinessFactor: 1.3,
  maxEasinessFactor: 2.5,
  difficultyThreshold: 0.6,
  masteryThreshold: 80,
  personalizationWeight: 0.3
};