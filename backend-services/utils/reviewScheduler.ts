import { 
  ReviewSchedule, 
  WordProgress, 
  UserStatistics,
  ReviewType,
  ReviewQueueItem 
} from '../types/progress';
import { SpacedRepetitionEngine } from './spacedRepetitionEngine';

/**
 * Review Scheduler for managing review notifications and scheduling
 */
export class ReviewScheduler {
  private spacedRepetitionEngine: SpacedRepetitionEngine;

  constructor(spacedRepetitionEngine: SpacedRepetitionEngine) {
    this.spacedRepetitionEngine = spacedRepetitionEngine;
  }

  /**
   * Schedule a review for a specific word
   */
  scheduleReview(
    userId: string,
    wordId: string,
    progress: WordProgress,
    reviewType: ReviewType = 'spaced_repetition'
  ): ReviewSchedule {
    const priority = this.spacedRepetitionEngine.calculateReviewPriority(progress);
    
    return this.spacedRepetitionEngine.createReviewSchedule(
      userId,
      wordId,
      progress.nextReviewDate,
      reviewType,
      priority
    );
  }

  /**
   * Generate review queue for a user
   */
  generateReviewQueue(
    userProgress: WordProgress[],
    currentDate: Date = new Date(),
    limit: number = 50,
    includeOverdue: boolean = true
  ): ReviewQueueItem[] {
    const reviewItems: ReviewQueueItem[] = [];

    for (const progress of userProgress) {
      const daysSinceLastReview = Math.floor(
        (currentDate.getTime() - progress.lastReviewed.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Check if review is due
      const isDue = currentDate >= progress.nextReviewDate;
      const isOverdue = currentDate > progress.nextReviewDate;

      if (isDue || (includeOverdue && isOverdue)) {
        const priority = this.spacedRepetitionEngine.calculateReviewPriority(progress, currentDate);
        const reviewType = this.spacedRepetitionEngine.determineReviewType(progress, []);

        reviewItems.push({
          wordId: progress.wordId,
          arabicText: '', // Will be populated by the calling service
          transliteration: '', // Will be populated by the calling service
          translation: '', // Will be populated by the calling service
          scheduledDate: progress.nextReviewDate,
          priority,
          reviewType,
          daysSinceLastReview
        });
      }
    }

    // Sort by priority (descending) and then by scheduled date (ascending)
    reviewItems.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.scheduledDate.getTime() - b.scheduledDate.getTime();
    });

    return reviewItems.slice(0, limit);
  }

  /**
   * Calculate optimal notification timing based on user patterns
   */
  calculateOptimalNotificationTime(
    userStats: UserStatistics,
    userTimezone: string = 'UTC'
  ): { hour: number; minute: number } {
    // Default to 9 AM if no study pattern data
    let optimalHour = 9;
    let optimalMinute = 0;

    // If user has study history, analyze patterns
    if (userStats.lastStudyDate) {
      // For now, use a simple heuristic based on last study time
      // In a real implementation, this would analyze historical study times
      const lastStudyHour = userStats.lastStudyDate.getHours();
      
      // Prefer morning hours (8-11 AM) for better retention
      if (lastStudyHour >= 6 && lastStudyHour <= 12) {
        optimalHour = lastStudyHour;
      } else if (lastStudyHour >= 13 && lastStudyHour <= 18) {
        // Afternoon studiers - suggest morning instead
        optimalHour = 9;
      } else {
        // Evening studiers - suggest earlier evening
        optimalHour = 19;
      }
    }

    return { hour: optimalHour, minute: optimalMinute };
  }

  /**
   * Determine notification frequency based on user performance and preferences
   */
  calculateNotificationFrequency(
    userStats: UserStatistics,
    reviewQueueSize: number,
    userPreference: 'low' | 'medium' | 'high' = 'medium'
  ): {
    dailyNotifications: number;
    intervalHours: number;
    shouldSendReminder: boolean;
  } {
    let dailyNotifications = 1;
    let intervalHours = 24;

    // Adjust based on user preference
    switch (userPreference) {
      case 'low':
        dailyNotifications = 1;
        intervalHours = 24;
        break;
      case 'medium':
        dailyNotifications = 2;
        intervalHours = 12;
        break;
      case 'high':
        dailyNotifications = 3;
        intervalHours = 8;
        break;
    }

    // Adjust based on review queue size
    if (reviewQueueSize > 20) {
      dailyNotifications = Math.min(dailyNotifications + 1, 4);
      intervalHours = Math.max(intervalHours - 2, 6);
    } else if (reviewQueueSize < 5) {
      dailyNotifications = Math.max(dailyNotifications - 1, 1);
      intervalHours = Math.min(intervalHours + 4, 24);
    }

    // Check if user needs a reminder based on streak
    const daysSinceLastStudy = userStats.lastStudyDate 
      ? Math.floor((Date.now() - userStats.lastStudyDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const shouldSendReminder = daysSinceLastStudy >= 1 || reviewQueueSize > 10;

    return {
      dailyNotifications,
      intervalHours,
      shouldSendReminder
    };
  }

  /**
   * Generate notification content based on review context
   */
  generateNotificationContent(
    reviewQueue: ReviewQueueItem[],
    userStats: UserStatistics
  ): {
    title: string;
    body: string;
    data: Record<string, any>;
  } {
    const overdueCount = reviewQueue.filter(item => 
      new Date() > item.scheduledDate
    ).length;

    const totalReviews = reviewQueue.length;

    let title = 'Time for Quranic Vocabulary Review!';
    let body = '';

    if (overdueCount > 0) {
      title = `${overdueCount} Overdue Reviews`;
      body = `You have ${overdueCount} overdue words and ${totalReviews - overdueCount} new reviews waiting.`;
    } else if (totalReviews > 0) {
      title = `${totalReviews} Words Ready for Review`;
      body = `Continue your learning journey with ${totalReviews} vocabulary words.`;
    } else {
      title = 'Keep Your Streak Going!';
      body = `Current streak: ${userStats.currentStreak} days. Check for new words to learn.`;
    }

    // Add motivational message based on streak
    if (userStats.currentStreak >= 7) {
      body += ` Amazing ${userStats.currentStreak}-day streak! 🔥`;
    } else if (userStats.currentStreak >= 3) {
      body += ` Great ${userStats.currentStreak}-day streak! Keep it up! ⭐`;
    }

    return {
      title,
      body,
      data: {
        reviewCount: totalReviews,
        overdueCount,
        currentStreak: userStats.currentStreak,
        action: 'open_review_queue'
      }
    };
  }

  /**
   * Check if it's an appropriate time to send notifications
   */
  isAppropriateNotificationTime(
    currentTime: Date,
    userTimezone: string = 'UTC',
    quietHoursStart: number = 22, // 10 PM
    quietHoursEnd: number = 7 // 7 AM
  ): boolean {
    const hour = currentTime.getHours();

    // Check if it's during quiet hours
    if (quietHoursStart < quietHoursEnd) {
      // Same day quiet hours (e.g., 22-7 next day)
      return !(hour >= quietHoursStart || hour < quietHoursEnd);
    } else {
      // Quiet hours span midnight (e.g., 10 PM - 7 AM)
      return hour >= quietHoursEnd && hour < quietHoursStart;
    }
  }

  /**
   * Create batch review schedules for multiple words
   */
  batchScheduleReviews(
    userId: string,
    progressList: WordProgress[]
  ): ReviewSchedule[] {
    const schedules: ReviewSchedule[] = [];

    for (const progress of progressList) {
      const reviewType = this.spacedRepetitionEngine.determineReviewType(progress, []);
      const schedule = this.scheduleReview(userId, progress.wordId, progress, reviewType);
      schedules.push(schedule);
    }

    return schedules;
  }

  /**
   * Optimize review distribution to avoid overwhelming the user
   */
  optimizeReviewDistribution(
    schedules: ReviewSchedule[],
    maxDailyReviews: number = 30
  ): ReviewSchedule[] {
    // Group schedules by date
    const schedulesByDate = new Map<string, ReviewSchedule[]>();
    
    for (const schedule of schedules) {
      const dateKey = schedule.scheduledDate.toISOString().split('T')[0];
      if (!schedulesByDate.has(dateKey)) {
        schedulesByDate.set(dateKey, []);
      }
      schedulesByDate.get(dateKey)!.push(schedule);
    }

    const optimizedSchedules: ReviewSchedule[] = [];

    // Process each date
    for (const [dateKey, daySchedules] of schedulesByDate) {
      if (daySchedules.length <= maxDailyReviews) {
        // No optimization needed
        optimizedSchedules.push(...daySchedules);
      } else {
        // Sort by priority and keep top reviews for this date
        daySchedules.sort((a, b) => b.priority - a.priority);
        const keptSchedules = daySchedules.slice(0, maxDailyReviews);
        const postponedSchedules = daySchedules.slice(maxDailyReviews);

        optimizedSchedules.push(...keptSchedules);

        // Redistribute postponed schedules to following days
        for (let i = 0; i < postponedSchedules.length; i++) {
          const schedule = postponedSchedules[i];
          const newDate = new Date(schedule.scheduledDate);
          newDate.setDate(newDate.getDate() + Math.floor(i / maxDailyReviews) + 1);
          
          schedule.scheduledDate = newDate;
          schedule.priority = Math.max(1, schedule.priority - 1); // Slightly reduce priority
          optimizedSchedules.push(schedule);
        }
      }
    }

    return optimizedSchedules;
  }
}

/**
 * Factory function to create review scheduler
 */
export function createReviewScheduler(spacedRepetitionEngine: SpacedRepetitionEngine): ReviewScheduler {
  return new ReviewScheduler(spacedRepetitionEngine);
}