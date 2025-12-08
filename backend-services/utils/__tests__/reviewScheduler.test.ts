import { ReviewScheduler, createReviewScheduler } from '../reviewScheduler';
import { SpacedRepetitionEngine, createSpacedRepetitionEngine } from '../spacedRepetitionEngine';
import { WordProgress, UserStatistics, ReviewQueueItem } from '../../types/progress';

describe('ReviewScheduler', () => {
  let scheduler: ReviewScheduler;
  let engine: SpacedRepetitionEngine;
  let mockProgress: WordProgress;
  let mockUserStats: UserStatistics;

  beforeEach(() => {
    engine = createSpacedRepetitionEngine();
    scheduler = createReviewScheduler(engine);

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

    mockUserStats = {
      userId: 'user123',
      totalWordsLearned: 50,
      currentStreak: 5,
      longestStreak: 10,
      totalStudyTime: 300, // 5 hours
      averageAccuracy: 0.75,
      wordsReviewedToday: 10,
      lastStudyDate: new Date('2024-01-01'),
      studyGoal: 20,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };
  });

  describe('scheduleReview', () => {
    it('should create a review schedule for a word', () => {
      const schedule = scheduler.scheduleReview('user123', 'word456', mockProgress);

      expect(schedule.userId).toBe('user123');
      expect(schedule.wordId).toBe('word456');
      expect(schedule.scheduledDate).toEqual(mockProgress.nextReviewDate);
      expect(schedule.reviewType).toBe('spaced_repetition');
      expect(schedule.priority).toBeGreaterThan(0);
      expect(schedule.priority).toBeLessThanOrEqual(10);
      expect(schedule.createdAt).toBeInstanceOf(Date);
    });

    it('should use specified review type', () => {
      const schedule = scheduler.scheduleReview('user123', 'word456', mockProgress, 'mastery_check');

      expect(schedule.reviewType).toBe('mastery_check');
    });
  });

  describe('generateReviewQueue', () => {
    it('should generate review queue for due words', () => {
      const progressList = [
        mockProgress,
        {
          ...mockProgress,
          wordId: 'word789',
          nextReviewDate: new Date('2024-01-01'), // Overdue
          lastReviewed: new Date('2023-12-31')
        },
        {
          ...mockProgress,
          wordId: 'word101',
          nextReviewDate: new Date('2024-01-05'), // Future
          lastReviewed: new Date('2024-01-01')
        }
      ];

      const currentDate = new Date('2024-01-02');
      const reviewQueue = scheduler.generateReviewQueue(progressList, currentDate, 50, true);

      expect(reviewQueue.length).toBe(2); // Only due and overdue words
      expect(reviewQueue[0].priority).toBeGreaterThanOrEqual(reviewQueue[1].priority); // Sorted by priority
    });

    it('should respect limit parameter', () => {
      const progressList = Array(10).fill(null).map((_, index) => ({
        ...mockProgress,
        wordId: `word${index}`,
        nextReviewDate: new Date('2024-01-01') // All overdue
      }));

      const reviewQueue = scheduler.generateReviewQueue(progressList, new Date('2024-01-02'), 5);

      expect(reviewQueue.length).toBe(5);
    });

    it('should exclude overdue words when includeOverdue is false', () => {
      const progressList = [
        {
          ...mockProgress,
          nextReviewDate: new Date('2024-01-01') // Overdue
        },
        {
          ...mockProgress,
          wordId: 'word789',
          nextReviewDate: new Date('2024-01-02') // Due today
        }
      ];

      const currentDate = new Date('2024-01-02');
      const reviewQueue = scheduler.generateReviewQueue(progressList, currentDate, 50, false);

      expect(reviewQueue.length).toBe(1);
      expect(reviewQueue[0].wordId).toBe('word789');
    });

    it('should sort by priority and then by date', () => {
      const progressList = [
        {
          ...mockProgress,
          wordId: 'word1',
          masteryLevel: 80, // Lower priority
          nextReviewDate: new Date('2024-01-01')
        },
        {
          ...mockProgress,
          wordId: 'word2',
          masteryLevel: 20, // Higher priority
          nextReviewDate: new Date('2024-01-02')
        },
        {
          ...mockProgress,
          wordId: 'word3',
          masteryLevel: 20, // Same priority, earlier date
          nextReviewDate: new Date('2024-01-01')
        }
      ];

      const reviewQueue = scheduler.generateReviewQueue(progressList, new Date('2024-01-02'));

      expect(reviewQueue[0].wordId).toBe('word3'); // Higher priority, earlier date
      expect(reviewQueue[1].wordId).toBe('word2'); // Higher priority, later date
      expect(reviewQueue[2].wordId).toBe('word1'); // Lower priority
    });
  });

  describe('calculateOptimalNotificationTime', () => {
    it('should return default time for users without study history', () => {
      const statsWithoutHistory = {
        ...mockUserStats,
        lastStudyDate: new Date('1970-01-01') // Very old date
      };

      const optimalTime = scheduler.calculateOptimalNotificationTime(statsWithoutHistory);

      expect(optimalTime.hour).toBe(9);
      expect(optimalTime.minute).toBe(0);
    });

    it('should prefer morning hours for morning studiers', () => {
      const morningStats = {
        ...mockUserStats,
        lastStudyDate: new Date('2024-01-01T10:30:00Z')
      };

      const optimalTime = scheduler.calculateOptimalNotificationTime(morningStats);

      expect(optimalTime.hour).toBe(10);
    });

    it('should suggest morning for afternoon studiers', () => {
      const afternoonStats = {
        ...mockUserStats,
        lastStudyDate: new Date('2024-01-01T15:30:00Z')
      };

      const optimalTime = scheduler.calculateOptimalNotificationTime(afternoonStats);

      expect(optimalTime.hour).toBe(9);
    });

    it('should suggest early evening for night studiers', () => {
      const nightStats = {
        ...mockUserStats,
        lastStudyDate: new Date('2024-01-01T23:30:00Z')
      };

      const optimalTime = scheduler.calculateOptimalNotificationTime(nightStats);

      expect(optimalTime.hour).toBe(19);
    });
  });

  describe('calculateNotificationFrequency', () => {
    it('should adjust frequency based on user preference', () => {
      const lowFreq = scheduler.calculateNotificationFrequency(mockUserStats, 10, 'low');
      const mediumFreq = scheduler.calculateNotificationFrequency(mockUserStats, 10, 'medium');
      const highFreq = scheduler.calculateNotificationFrequency(mockUserStats, 10, 'high');

      expect(lowFreq.dailyNotifications).toBeLessThan(mediumFreq.dailyNotifications);
      expect(mediumFreq.dailyNotifications).toBeLessThan(highFreq.dailyNotifications);
      expect(lowFreq.intervalHours).toBeGreaterThan(mediumFreq.intervalHours);
      expect(mediumFreq.intervalHours).toBeGreaterThan(highFreq.intervalHours);
    });

    it('should increase frequency for large review queues', () => {
      const normalFreq = scheduler.calculateNotificationFrequency(mockUserStats, 10, 'medium');
      const highQueueFreq = scheduler.calculateNotificationFrequency(mockUserStats, 25, 'medium');

      expect(highQueueFreq.dailyNotifications).toBeGreaterThan(normalFreq.dailyNotifications);
      expect(highQueueFreq.intervalHours).toBeLessThan(normalFreq.intervalHours);
    });

    it('should decrease frequency for small review queues', () => {
      const normalFreq = scheduler.calculateNotificationFrequency(mockUserStats, 10, 'medium');
      const smallQueueFreq = scheduler.calculateNotificationFrequency(mockUserStats, 3, 'medium');

      expect(smallQueueFreq.dailyNotifications).toBeLessThan(normalFreq.dailyNotifications);
      expect(smallQueueFreq.intervalHours).toBeGreaterThan(normalFreq.intervalHours);
    });

    it('should recommend reminders for inactive users', () => {
      const inactiveStats = {
        ...mockUserStats,
        lastStudyDate: new Date('2024-01-01')
      };

      const frequency = scheduler.calculateNotificationFrequency(inactiveStats, 5, 'medium');

      expect(frequency.shouldSendReminder).toBe(true);
    });
  });

  describe('generateNotificationContent', () => {
    it('should generate content for overdue reviews', () => {
      const reviewQueue: ReviewQueueItem[] = [
        {
          wordId: 'word1',
          arabicText: 'كتاب',
          transliteration: 'kitab',
          translation: 'book',
          scheduledDate: new Date('2024-01-01'), // Overdue
          priority: 8,
          reviewType: 'spaced_repetition',
          daysSinceLastReview: 3
        },
        {
          wordId: 'word2',
          arabicText: 'قلم',
          transliteration: 'qalam',
          translation: 'pen',
          scheduledDate: new Date('2024-01-02'), // Due today
          priority: 6,
          reviewType: 'spaced_repetition',
          daysSinceLastReview: 1
        }
      ];

      const currentDate = new Date('2024-01-02');
      const content = scheduler.generateNotificationContent(reviewQueue, mockUserStats);

      expect(content.title).toContain('1 Overdue');
      expect(content.body).toContain('1 overdue words');
      expect(content.body).toContain('1 new reviews');
      expect(content.data.reviewCount).toBe(2);
      expect(content.data.overdueCount).toBe(1);
    });

    it('should generate content for regular reviews', () => {
      const reviewQueue: ReviewQueueItem[] = [
        {
          wordId: 'word1',
          arabicText: 'كتاب',
          transliteration: 'kitab',
          translation: 'book',
          scheduledDate: new Date('2024-01-02'),
          priority: 6,
          reviewType: 'spaced_repetition',
          daysSinceLastReview: 1
        }
      ];

      const content = scheduler.generateNotificationContent(reviewQueue, mockUserStats);

      expect(content.title).toContain('1 Words Ready');
      expect(content.body).toContain('1 vocabulary words');
      expect(content.data.reviewCount).toBe(1);
      expect(content.data.overdueCount).toBe(0);
    });

    it('should generate motivational content for no reviews', () => {
      const content = scheduler.generateNotificationContent([], mockUserStats);

      expect(content.title).toContain('Keep Your Streak');
      expect(content.body).toContain(`${mockUserStats.currentStreak} days`);
    });

    it('should add streak celebration for long streaks', () => {
      const longStreakStats = {
        ...mockUserStats,
        currentStreak: 15
      };

      const content = scheduler.generateNotificationContent([], longStreakStats);

      expect(content.body).toContain('🔥');
      expect(content.body).toContain('15-day streak');
    });

    it('should add encouragement for medium streaks', () => {
      const mediumStreakStats = {
        ...mockUserStats,
        currentStreak: 5
      };

      const content = scheduler.generateNotificationContent([], mediumStreakStats);

      expect(content.body).toContain('⭐');
      expect(content.body).toContain('5-day streak');
    });
  });

  describe('isAppropriateNotificationTime', () => {
    it('should allow notifications during appropriate hours', () => {
      const appropriateTime = new Date('2024-01-01T10:00:00Z'); // 10 AM
      const isAppropriate = scheduler.isAppropriateNotificationTime(appropriateTime);

      expect(isAppropriate).toBe(true);
    });

    it('should block notifications during quiet hours', () => {
      const quietTime = new Date('2024-01-01T23:00:00Z'); // 11 PM
      const isAppropriate = scheduler.isAppropriateNotificationTime(quietTime);

      expect(isAppropriate).toBe(false);
    });

    it('should block notifications during early morning quiet hours', () => {
      const earlyMorning = new Date('2024-01-01T05:00:00Z'); // 5 AM
      const isAppropriate = scheduler.isAppropriateNotificationTime(earlyMorning);

      expect(isAppropriate).toBe(false);
    });

    it('should respect custom quiet hours', () => {
      const customTime = new Date('2024-01-01T21:00:00Z'); // 9 PM
      const isAppropriate = scheduler.isAppropriateNotificationTime(
        customTime,
        'UTC',
        20, // 8 PM start
        8   // 8 AM end
      );

      expect(isAppropriate).toBe(false);
    });
  });

  describe('batchScheduleReviews', () => {
    it('should create schedules for multiple words', () => {
      const progressList = [
        mockProgress,
        { ...mockProgress, wordId: 'word789' },
        { ...mockProgress, wordId: 'word101' }
      ];

      const schedules = scheduler.batchScheduleReviews('user123', progressList);

      expect(schedules).toHaveLength(3);
      expect(schedules[0].wordId).toBe('word456');
      expect(schedules[1].wordId).toBe('word789');
      expect(schedules[2].wordId).toBe('word101');
      
      schedules.forEach(schedule => {
        expect(schedule.userId).toBe('user123');
        expect(schedule.createdAt).toBeInstanceOf(Date);
      });
    });
  });

  describe('optimizeReviewDistribution', () => {
    it('should not modify schedules within daily limit', () => {
      const schedules = Array(10).fill(null).map((_, index) => ({
        userId: 'user123',
        wordId: `word${index}`,
        scheduledDate: new Date('2024-01-01'),
        priority: 5,
        reviewType: 'spaced_repetition' as const,
        createdAt: new Date()
      }));

      const optimized = scheduler.optimizeReviewDistribution(schedules, 30);

      expect(optimized).toHaveLength(10);
      expect(optimized.every(s => s.scheduledDate.toDateString() === new Date('2024-01-01').toDateString())).toBe(true);
    });

    it('should redistribute schedules exceeding daily limit', () => {
      const schedules = Array(40).fill(null).map((_, index) => ({
        userId: 'user123',
        wordId: `word${index}`,
        scheduledDate: new Date('2024-01-01'),
        priority: Math.floor(Math.random() * 10) + 1,
        reviewType: 'spaced_repetition' as const,
        createdAt: new Date()
      }));

      const optimized = scheduler.optimizeReviewDistribution(schedules, 20);

      expect(optimized).toHaveLength(40);
      
      // Count schedules by date
      const schedulesByDate = new Map<string, number>();
      optimized.forEach(schedule => {
        const dateKey = schedule.scheduledDate.toDateString();
        schedulesByDate.set(dateKey, (schedulesByDate.get(dateKey) || 0) + 1);
      });

      // First day should have exactly 20 schedules
      const firstDayCount = schedulesByDate.get(new Date('2024-01-01').toDateString());
      expect(firstDayCount).toBe(20);

      // Remaining schedules should be distributed to following days
      const totalScheduled = Array.from(schedulesByDate.values()).reduce((sum, count) => sum + count, 0);
      expect(totalScheduled).toBe(40);
    });

    it('should maintain priority order within each day', () => {
      const schedules = Array(25).fill(null).map((_, index) => ({
        userId: 'user123',
        wordId: `word${index}`,
        scheduledDate: new Date('2024-01-01'),
        priority: index % 10 + 1, // Priorities 1-10
        reviewType: 'spaced_repetition' as const,
        createdAt: new Date()
      }));

      const optimized = scheduler.optimizeReviewDistribution(schedules, 20);

      // Get schedules for the first day
      const firstDaySchedules = optimized.filter(s => 
        s.scheduledDate.toDateString() === new Date('2024-01-01').toDateString()
      );

      expect(firstDaySchedules).toHaveLength(20);
      
      // Check that higher priority items are kept for the first day
      const firstDayPriorities = firstDaySchedules.map(s => s.priority);
      const minFirstDayPriority = Math.min(...firstDayPriorities);
      
      // Get postponed schedules
      const postponedSchedules = optimized.filter(s => 
        s.scheduledDate.toDateString() !== new Date('2024-01-01').toDateString()
      );
      
      const maxPostponedPriority = Math.max(...postponedSchedules.map(s => s.priority));
      
      // Postponed schedules should have lower or equal priority
      expect(maxPostponedPriority).toBeLessThanOrEqual(minFirstDayPriority + 1); // +1 for priority reduction
    });
  });
});