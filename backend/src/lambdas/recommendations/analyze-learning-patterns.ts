/**
 * Learning Pattern Analysis
 * Analyzes user learning behavior to identify patterns and preferences
 */

export interface LearningPattern {
  userId: string;
  preferredTimeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  averageSessionLength: number; // minutes
  preferredDifficulty: 'easy' | 'medium' | 'hard';
  strongModalities: string[]; // visual, audio, contextual, association
  weakModalities: string[];
  averageAccuracy: number; // 0-100
  learningSpeed: number; // 0.5-2.0 multiplier
  retentionRate: number; // 0-1
  consistency: number; // 0-100
}

export interface SessionData {
  startTime: string;
  duration: number;
  accuracy: number;
  wordsReviewed: Array<{
    wordId: string;
    difficulty: string;
    modality: string;
    correct: boolean;
  }>;
}

/**
 * Analyze user learning patterns from session history
 */
export const analyzeLearningPatterns = (
  userId: string,
  sessions: SessionData[]
): LearningPattern => {
  if (sessions.length === 0) {
    return getDefaultPattern(userId);
  }

  // Analyze preferred time of day
  const preferredTime = analyzePreferredTime(sessions);

  // Calculate average session length
  const averageSessionLength = sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;

  // Analyze modality performance
  const { strong, weak } = analyzeModalityPerformance(sessions);

  // Calculate overall metrics
  const averageAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length;

  // Analyze learning speed (words learned per hour)
  const learningSpeed = calculateLearningSpeed(sessions);

  // Calculate retention rate (long-term recall)
  const retentionRate = calculateRetentionRate(sessions);

  // Calculate consistency (streak and regularity)
  const consistency = calculateConsistency(sessions);

  // Determine preferred difficulty
  const preferredDifficulty = analyzePreferredDifficulty(sessions);

  return {
    userId,
    preferredTimeOfDay: preferredTime,
    averageSessionLength: Math.round(averageSessionLength),
    preferredDifficulty,
    strongModalities: strong,
    weakModalities: weak,
    averageAccuracy: Math.round(averageAccuracy),
    learningSpeed,
    retentionRate,
    consistency,
  };
};

/**
 * Analyze user's preferred time of day for studying
 */
function analyzePreferredTime(sessions: SessionData[]): 'morning' | 'afternoon' | 'evening' | 'night' {
  const timeSlots = { morning: 0, afternoon: 0, evening: 0, night: 0 };

  for (const session of sessions) {
    const hour = new Date(session.startTime).getHours();

    if (hour >= 6 && hour < 12) {
      timeSlots.morning++;
    } else if (hour >= 12 && hour < 17) {
      timeSlots.afternoon++;
    } else if (hour >= 17 && hour < 21) {
      timeSlots.evening++;
    } else {
      timeSlots.night++;
    }
  }

  return Object.entries(timeSlots).reduce((a, b) => (b[1] > a[1] ? b : a))[0] as any;
}

/**
 * Analyze performance across different learning modalities
 */
function analyzeModalityPerformance(sessions: SessionData[]): { strong: string[]; weak: string[] } {
  const modalityStats: Record<string, { correct: number; total: number }> = {};

  for (const session of sessions) {
    for (const word of session.wordsReviewed) {
      if (!modalityStats[word.modality]) {
        modalityStats[word.modality] = { correct: 0, total: 0 };
      }
      modalityStats[word.modality].total++;
      if (word.correct) {
        modalityStats[word.modality].correct++;
      }
    }
  }

  const modalityPerformance = Object.entries(modalityStats).map(([modality, stats]) => ({
    modality,
    accuracy: stats.total > 0 ? stats.correct / stats.total : 0,
  }));

  modalityPerformance.sort((a, b) => b.accuracy - a.accuracy);

  const strong = modalityPerformance.slice(0, 2).map((m) => m.modality);
  const weak = modalityPerformance.slice(-2).map((m) => m.modality);

  return { strong, weak };
}

/**
 * Calculate learning speed (relative to average)
 */
function calculateLearningSpeed(sessions: SessionData[]): number {
  // Average words per hour
  const totalWords = sessions.reduce((sum, s) => sum + s.wordsReviewed.length, 0);
  const totalHours = sessions.reduce((sum, s) => sum + s.duration, 0) / 60;

  if (totalHours === 0) return 1.0;

  const wordsPerHour = totalWords / totalHours;

  // Normalize to 0.5-2.0 range (assuming average is 20 words/hour)
  const normalized = Math.min(2.0, Math.max(0.5, wordsPerHour / 20));

  return Math.round(normalized * 100) / 100;
}

/**
 * Calculate retention rate
 */
function calculateRetentionRate(sessions: SessionData[]): number {
  // Simplified: based on accuracy over time
  if (sessions.length < 3) return 0.8; // Default

  const recentSessions = sessions.slice(-10);
  const avgAccuracy = recentSessions.reduce((sum, s) => sum + s.accuracy, 0) / recentSessions.length;

  return Math.round((avgAccuracy / 100) * 100) / 100;
}

/**
 * Calculate study consistency
 */
function calculateConsistency(sessions: SessionData[]): number {
  if (sessions.length < 3) return 50;

  // Calculate days with sessions in last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentSessions = sessions.filter(
    (s) => new Date(s.startTime) >= thirtyDaysAgo
  );

  const uniqueDays = new Set(
    recentSessions.map((s) => new Date(s.startTime).toISOString().split('T')[0])
  );

  // Consistency = (days with sessions / 30) * 100
  return Math.min(100, Math.round((uniqueDays.size / 30) * 100));
}

/**
 * Analyze preferred difficulty level
 */
function analyzePreferredDifficulty(sessions: SessionData[]): 'easy' | 'medium' | 'hard' {
  const difficultyStats: Record<string, number> = { easy: 0, medium: 0, hard: 0 };

  for (const session of sessions) {
    for (const word of session.wordsReviewed) {
      const difficulty = word.difficulty as 'easy' | 'medium' | 'hard';
      difficultyStats[difficulty] = (difficultyStats[difficulty] || 0) + 1;
    }
  }

  const preferred = Object.entries(difficultyStats).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  return preferred as any;
}

/**
 * Get default pattern for new users
 */
function getDefaultPattern(userId: string): LearningPattern {
  return {
    userId,
    preferredTimeOfDay: 'evening',
    averageSessionLength: 20,
    preferredDifficulty: 'medium',
    strongModalities: ['visual', 'contextual'],
    weakModalities: [],
    averageAccuracy: 70,
    learningSpeed: 1.0,
    retentionRate: 0.8,
    consistency: 50,
  };
}

