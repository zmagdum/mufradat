import { SpacedRepetitionEngine, createSpacedRepetitionEngine, DEFAULT_SR_CONFIG } from '../spacedRepetitionEngine';
import { WordProgress, LearningSession, SessionType, LearningModality, ReviewType } from '../../types/progress';

describe('SpacedRepetitionEngine', () => {
  let engine: SpacedRepetitionEngine;
  let mockProgress: WordProgress;
  let mockSession: LearningSession;

  beforeEach(() => {
    engine = createSpacedRepetitionEngine();
    
    mockProgress = {
      userId: 'user123',
      wordId: 'word456',
      masteryLevel: 50,
      reviewCount: 5,
      correctAnswers: 3,
      lastReviewed: new Date('2024-01-01'),
      nextReviewDate: new Date('2024-01-02'),
      learningModalities: ['visual', 'audio'],
      difficultyAdjustments: 0,
      averageResponseTime: 3000,
      easinessFactor: 2.5,
      interval: 1,
      repetitions: 1,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };

    mockSession = {
      sessionId: 'session789',
      userId: 'user123',
      wordId: 'word456',
      sessionType: 'review' as SessionType,
      startTime: new Date('2024-01-02T10:00:00Z'),
      endTime: new Date('2024-01-02T10:00:05Z'),
      responseTime: 3000,
      accuracy: 0.8,
      difficulty: 3,
      learningModality: 'visual' as LearningModality,
      isCorrect: true,
      createdAt: new Date('2024-01-02')
    };
  });

  describe('calculateNextReview', () => {
    it('should calculate next review date for successful session', () => {
      const result = engine.calculateNextReview(mockProgress, mockSession);

      expect(result.nextReviewDate).toBeInstanceOf(Date);
      expect(result.interval).toBeGreaterThan(0);
      expect(result.easinessFactor).toBeGreaterThanOrEqual(DEFAULT_SR_CONFIG.minEasinessFactor);
      expect(result.easinessFactor).toBeLessThanOrEqual(DEFAULT_SR_CONFIG.maxEasinessFactor);
      expect(result.repetitions).toBeGreaterThanOrEqual(0);
    });

    it('should reset repetitions for poor performance', () => {
      const poorSession = {
        ...mockSession,
        accuracy: 0.3,
        difficulty: 5,
        isCorrect: false
      };

      const result = engine.calculateNextReview(mockProgress, poorSession);

      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });

    it('should increase interval for good performance', () => {
      const goodSession = {
        ...mockSession,
        accuracy: 0.9,
        difficulty: 2,
        responseTime: 2000
      };

      const progressWithRepetitions = {
        ...mockProgress,
        repetitions: 3,
        interval: 6
      };

      const result = engine.calculateNextReview(progressWithRepetitions, goodSession);

      expect(result.interval).toBeGreaterThan(progressWithRepetitions.interval);
      expect(result.repetitions).toBe(progressWithRepetitions.repetitions + 1);
    });

    it('should apply personalization factor', () => {
      const personalizationFactor = 1.5;
      const result = engine.calculateNextReview(mockProgress, mockSession, personalizationFactor);

      // With personalization factor > 1, interval should be longer
      expect(result.interval).toBeGreaterThan(1);
    });

    it('should respect maximum interval limit', () => {
      const longIntervalProgress = {
        ...mockProgress,
        interval: 150,
        repetitions: 10,
        easinessFactor: 2.5
      };

      const result = engine.calculateNextReview(longIntervalProgress, mockSession, 2.0);

      expect(result.interval).toBeLessThanOrEqual(DEFAULT_SR_CONFIG.maxInterval);
    });
  });

  describe('calculateMasteryLevel', () => {
    it('should calculate mastery level based on progress and sessions', () => {
      const recentSessions = [
        { ...mockSession, accuracy: 0.8 },
        { ...mockSession, accuracy: 0.9 },
        { ...mockSession, accuracy: 0.7 }
      ];

      const masteryLevel = engine.calculateMasteryLevel(mockProgress, recentSessions);

      expect(masteryLevel).toBeGreaterThanOrEqual(0);
      expect(masteryLevel).toBeLessThanOrEqual(100);
      expect(typeof masteryLevel).toBe('number');
    });

    it('should give higher mastery for consistent good performance', () => {
      const goodProgress = {
        ...mockProgress,
        correctAnswers: 9,
        reviewCount: 10,
        repetitions: 5
      };

      const consistentSessions = Array(5).fill(null).map(() => ({
        ...mockSession,
        accuracy: 0.9
      }));

      const masteryLevel = engine.calculateMasteryLevel(goodProgress, consistentSessions);

      expect(masteryLevel).toBeGreaterThan(70);
    });

    it('should give lower mastery for poor performance', () => {
      const poorProgress = {
        ...mockProgress,
        correctAnswers: 2,
        reviewCount: 10,
        repetitions: 1
      };

      const poorSessions = Array(5).fill(null).map(() => ({
        ...mockSession,
        accuracy: 0.3
      }));

      const masteryLevel = engine.calculateMasteryLevel(poorProgress, poorSessions);

      expect(masteryLevel).toBeLessThan(50);
    });
  });

  describe('shouldAdjustDifficulty', () => {
    it('should suggest increasing difficulty for high performers', () => {
      const highPerformanceProgress = {
        ...mockProgress,
        repetitions: 5
      };

      const excellentSessions = Array(5).fill(null).map(() => ({
        ...mockSession,
        accuracy: 0.95,
        responseTime: 1500
      }));

      const result = engine.shouldAdjustDifficulty(highPerformanceProgress, excellentSessions);

      expect(result.shouldAdjust).toBe(true);
      expect(result.direction).toBe('increase');
    });

    it('should suggest decreasing difficulty for struggling users', () => {
      const strugglingProgress = {
        ...mockProgress,
        reviewCount: 8
      };

      const poorSessions = Array(5).fill(null).map(() => ({
        ...mockSession,
        accuracy: 0.4,
        responseTime: 8000
      }));

      const result = engine.shouldAdjustDifficulty(strugglingProgress, poorSessions);

      expect(result.shouldAdjust).toBe(true);
      expect(result.direction).toBe('decrease');
    });

    it('should not adjust difficulty for appropriate performance', () => {
      const moderateSessions = Array(3).fill(null).map(() => ({
        ...mockSession,
        accuracy: 0.7,
        responseTime: 4000
      }));

      const result = engine.shouldAdjustDifficulty(mockProgress, moderateSessions);

      expect(result.shouldAdjust).toBe(false);
    });
  });

  describe('calculateReviewPriority', () => {
    it('should calculate higher priority for overdue reviews', () => {
      const overdueProgress = {
        ...mockProgress,
        lastReviewed: new Date('2024-01-01'),
        nextReviewDate: new Date('2024-01-02'),
        interval: 1
      };

      const currentDate = new Date('2024-01-05'); // 3 days overdue
      const priority = engine.calculateReviewPriority(overdueProgress, currentDate);

      expect(priority).toBeGreaterThan(5); // Base priority
      expect(priority).toBeLessThanOrEqual(10);
    });

    it('should calculate higher priority for low mastery words', () => {
      const lowMasteryProgress = {
        ...mockProgress,
        masteryLevel: 25
      };

      const priority = engine.calculateReviewPriority(lowMasteryProgress);

      expect(priority).toBeGreaterThan(5); // Base priority + low mastery bonus
    });

    it('should calculate lower priority for well-mastered words', () => {
      const masteredProgress = {
        ...mockProgress,
        masteryLevel: 85,
        correctAnswers: 9,
        reviewCount: 10
      };

      const priority = engine.calculateReviewPriority(masteredProgress);

      expect(priority).toBeLessThan(5); // Base priority - mastery bonus
      expect(priority).toBeGreaterThanOrEqual(1);
    });
  });

  describe('calculatePersonalizationFactor', () => {
    it('should increase factor for high-performing users', () => {
      const factor = engine.calculatePersonalizationFactor(
        0.9, // high accuracy
        2500, // fast response
        ['visual', 'audio'],
        'visual' // preferred modality
      );

      expect(factor).toBeGreaterThan(1.0);
    });

    it('should decrease factor for struggling users', () => {
      const factor = engine.calculatePersonalizationFactor(
        0.5, // low accuracy
        9000, // slow response
        ['visual'],
        'audio' // non-preferred modality
      );

      expect(factor).toBeLessThan(1.0);
    });

    it('should stay within bounds', () => {
      const extremeFactor = engine.calculatePersonalizationFactor(
        0.1, // very low accuracy
        15000, // very slow response
        ['visual'],
        'audio'
      );

      expect(extremeFactor).toBeGreaterThanOrEqual(0.5);
      expect(extremeFactor).toBeLessThanOrEqual(2.0);
    });
  });

  describe('determineReviewType', () => {
    it('should return mastery_check for high mastery words', () => {
      const masteredProgress = {
        ...mockProgress,
        masteryLevel: 85,
        repetitions: 6
      };

      const reviewType = engine.determineReviewType(masteredProgress, []);

      expect(reviewType).toBe('mastery_check');
    });

    it('should return difficulty_adjustment when needed', () => {
      const strugglingProgress = {
        ...mockProgress,
        reviewCount: 8
      };

      const poorSessions = Array(5).fill(null).map(() => ({
        ...mockSession,
        accuracy: 0.4
      }));

      const reviewType = engine.determineReviewType(strugglingProgress, poorSessions);

      expect(reviewType).toBe('difficulty_adjustment');
    });

    it('should return spaced_repetition by default', () => {
      const reviewType = engine.determineReviewType(mockProgress, []);

      expect(reviewType).toBe('spaced_repetition');
    });
  });

  describe('createReviewSchedule', () => {
    it('should create a valid review schedule', () => {
      const schedule = engine.createReviewSchedule(
        'user123',
        'word456',
        new Date('2024-01-03'),
        'spaced_repetition',
        7
      );

      expect(schedule.userId).toBe('user123');
      expect(schedule.wordId).toBe('word456');
      expect(schedule.scheduledDate).toEqual(new Date('2024-01-03'));
      expect(schedule.reviewType).toBe('spaced_repetition');
      expect(schedule.priority).toBe(7);
      expect(schedule.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle zero review count', () => {
      const newProgress = {
        ...mockProgress,
        reviewCount: 0,
        correctAnswers: 0
      };

      const masteryLevel = engine.calculateMasteryLevel(newProgress, []);
      expect(masteryLevel).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty session history', () => {
      const result = engine.shouldAdjustDifficulty(mockProgress, []);
      expect(result.shouldAdjust).toBe(false);
    });

    it('should handle extreme response times', () => {
      const extremeSession = {
        ...mockSession,
        responseTime: 60000 // 1 minute
      };

      const result = engine.calculateNextReview(mockProgress, extremeSession);
      expect(result.interval).toBeGreaterThan(0);
    });
  });

  describe('algorithm consistency', () => {
    it('should produce consistent results for same inputs', () => {
      const result1 = engine.calculateNextReview(mockProgress, mockSession);
      const result2 = engine.calculateNextReview(mockProgress, mockSession);

      expect(result1.interval).toBe(result2.interval);
      expect(result1.easinessFactor).toBe(result2.easinessFactor);
      expect(result1.repetitions).toBe(result2.repetitions);
    });

    it('should maintain easiness factor bounds', () => {
      // Test with extreme quality scores
      const veryPoorSession = {
        ...mockSession,
        accuracy: 0,
        difficulty: 5,
        responseTime: 30000
      };

      const result = engine.calculateNextReview(mockProgress, veryPoorSession);

      expect(result.easinessFactor).toBeGreaterThanOrEqual(DEFAULT_SR_CONFIG.minEasinessFactor);
      expect(result.easinessFactor).toBeLessThanOrEqual(DEFAULT_SR_CONFIG.maxEasinessFactor);
    });
  });
});