/**
 * Spaced Repetition Engine Unit Tests
 */

import {
  calculateNextReview,
  calculateMasteryLevel,
  getWordsDueForReview,
  initializeSpacedRepetition,
  adjustDifficulty,
  calculateStreak,
  getRecommendedSessionSize,
  SpacedRepetitionState,
  ReviewResult,
} from '../spaced-repetition-engine';

describe('Spaced Repetition Engine', () => {
  describe('initializeSpacedRepetition', () => {
    it('should initialize with default values', () => {
      const state = initializeSpacedRepetition();

      expect(state.easeFactor).toBe(2.5);
      expect(state.interval).toBe(1);
      expect(state.repetitions).toBe(0);
      expect(state.masteryLevel).toBe(0);
      expect(state.nextReviewDate).toBeTruthy();
      expect(state.lastReviewDate).toBeTruthy();
    });

    it('should set next review date to 1 day from now', () => {
      const state = initializeSpacedRepetition();
      const nextReview = new Date(state.nextReviewDate);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(nextReview.getDate()).toBe(tomorrow.getDate());
    });
  });

  describe('calculateNextReview', () => {
    const initialState: SpacedRepetitionState = {
      easeFactor: 2.5,
      interval: 1,
      repetitions: 0,
      nextReviewDate: new Date().toISOString(),
      lastReviewDate: new Date().toISOString(),
      masteryLevel: 0,
    };

    it('should increase interval on good recall (quality >= 3)', () => {
      const reviewResult: ReviewResult = {
        quality: 4,
        timeSpent: 30,
        hintsUsed: false,
      };

      const newState = calculateNextReview(initialState, reviewResult);

      expect(newState.repetitions).toBe(1);
      expect(newState.interval).toBeGreaterThan(0);
    });

    it('should reset on poor recall (quality < 3)', () => {
      const stateAfterSuccess: SpacedRepetitionState = {
        ...initialState,
        repetitions: 3,
        interval: 15,
      };

      const reviewResult: ReviewResult = {
        quality: 2,
        timeSpent: 60,
        hintsUsed: false,
      };

      const newState = calculateNextReview(stateAfterSuccess, reviewResult);

      expect(newState.repetitions).toBe(0);
      expect(newState.interval).toBe(1);
    });

    it('should decrease quality when hints are used', () => {
      const reviewResult1: ReviewResult = {
        quality: 4,
        timeSpent: 30,
        hintsUsed: false,
      };

      const reviewResult2: ReviewResult = {
        quality: 4,
        timeSpent: 30,
        hintsUsed: true,
      };

      const state1 = calculateNextReview(initialState, reviewResult1);
      const state2 = calculateNextReview(initialState, reviewResult2);

      expect(state2.easeFactor).toBeLessThan(state1.easeFactor);
    });

    it('should clamp ease factor within valid range', () => {
      const reviewResult: ReviewResult = {
        quality: 0,
        timeSpent: 100,
        hintsUsed: false,
      };

      const newState = calculateNextReview(initialState, reviewResult);

      expect(newState.easeFactor).toBeGreaterThanOrEqual(1.3);
      expect(newState.easeFactor).toBeLessThanOrEqual(2.5);
    });

    it('should apply personalization factors', () => {
      const reviewResult: ReviewResult = {
        quality: 4,
        timeSpent: 30,
        hintsUsed: false,
      };

      const personalization = {
        learningSpeed: 1.5,
        retentionRate: 0.8,
        preferredDifficulty: 'medium' as const,
      };

      const newState = calculateNextReview(initialState, reviewResult, personalization);

      expect(newState).toBeTruthy();
    });
  });

  describe('calculateMasteryLevel', () => {
    it('should return 0 for no repetitions', () => {
      const level = calculateMasteryLevel(0, 2.5, 3);
      expect(level).toBe(0);
    });

    it('should increase with more repetitions', () => {
      const level1 = calculateMasteryLevel(1, 2.5, 4);
      const level2 = calculateMasteryLevel(5, 2.5, 4);
      const level3 = calculateMasteryLevel(10, 2.5, 4);

      expect(level2).toBeGreaterThan(level1);
      expect(level3).toBeGreaterThan(level2);
    });

    it('should be capped at 100', () => {
      const level = calculateMasteryLevel(1000, 2.5, 5);
      expect(level).toBeLessThanOrEqual(100);
    });

    it('should be at least 0', () => {
      const level = calculateMasteryLevel(0, 1.3, 0);
      expect(level).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getWordsDueForReview', () => {
    it('should return words due before current date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const words = [
        { wordId: 'word1', ...initializeSpacedRepetition(), nextReviewDate: yesterday.toISOString() },
        { wordId: 'word2', ...initializeSpacedRepetition(), nextReviewDate: tomorrow.toISOString() },
      ];

      const dueWords = getWordsDueForReview(words);

      expect(dueWords).toHaveLength(1);
      expect(dueWords[0].wordId).toBe('word1');
    });

    it('should sort by review date (earliest first)', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const words = [
        { wordId: 'word1', ...initializeSpacedRepetition(), nextReviewDate: yesterday.toISOString() },
        { wordId: 'word2', ...initializeSpacedRepetition(), nextReviewDate: twoDaysAgo.toISOString() },
      ];

      const dueWords = getWordsDueForReview(words);

      expect(dueWords[0].wordId).toBe('word2');
      expect(dueWords[1].wordId).toBe('word1');
    });
  });

  describe('adjustDifficulty', () => {
    it('should maintain difficulty with average performance', () => {
      const history = [3, 4, 3, 4, 3];
      const adjustment = adjustDifficulty(history);
      expect(adjustment).toBe('maintain');
    });

    it('should increase difficulty with excellent performance', () => {
      const history = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
      const adjustment = adjustDifficulty(history);
      expect(adjustment).toBe('increase');
    });

    it('should decrease difficulty with poor performance', () => {
      const history = [2, 1, 2, 2, 1, 2, 1, 2, 2, 1];
      const adjustment = adjustDifficulty(history);
      expect(adjustment).toBe('decrease');
    });

    it('should maintain with insufficient history', () => {
      const history = [3, 4];
      const adjustment = adjustDifficulty(history);
      expect(adjustment).toBe('maintain');
    });
  });

  describe('calculateStreak', () => {
    it('should return 0 for no reviews', () => {
      const streak = calculateStreak([]);
      expect(streak).toBe(0);
    });

    it('should calculate consecutive days', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const reviews = [
        today.toISOString(),
        yesterday.toISOString(),
        twoDaysAgo.toISOString(),
      ];

      const streak = calculateStreak(reviews);
      expect(streak).toBe(3);
    });

    it('should break streak on missing day', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const reviews = [
        today.toISOString(),
        yesterday.toISOString(),
        threeDaysAgo.toISOString(),
      ];

      const streak = calculateStreak(reviews);
      expect(streak).toBe(2);
    });
  });

  describe('getRecommendedSessionSize', () => {
    it('should respect user preference when possible', () => {
      const size = getRecommendedSessionSize(100, 20, 60);
      expect(size).toBe(20);
    });

    it('should limit by available words', () => {
      const size = getRecommendedSessionSize(10, 20, 60);
      expect(size).toBe(10);
    });

    it('should limit by available time', () => {
      const size = getRecommendedSessionSize(100, 50, 15); // Only 15 minutes
      expect(size).toBeLessThan(15); // ~10 words in 15 minutes
    });

    it('should enforce minimum of 5 words', () => {
      const size = getRecommendedSessionSize(2, 2, 5);
      expect(size).toBe(5);
    });

    it('should enforce maximum of 50 words', () => {
      const size = getRecommendedSessionSize(200, 100, 200);
      expect(size).toBe(50);
    });
  });
});

