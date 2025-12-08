/**
 * Spaced Repetition Engine
 * Implements modified SM-2 algorithm with personalization factors
 * Based on SuperMemo 2 (SM-2) algorithm with adaptive enhancements
 */

export interface ReviewResult {
  quality: number; // 0-5 rating of recall quality
  timeSpent: number; // Time spent on review in seconds
  hintsUsed: boolean; // Whether hints were used
}

export interface SpacedRepetitionState {
  easeFactor: number; // Ease factor (difficulty multiplier)
  interval: number; // Current interval in days
  repetitions: number; // Number of successful repetitions
  nextReviewDate: string; // ISO date string
  lastReviewDate: string; // ISO date string
  masteryLevel: number; // 0-100 score
}

export interface PersonalizationFactors {
  learningSpeed: number; // 0.5-2.0 (user's learning speed)
  retentionRate: number; // 0.5-1.0 (user's retention capability)
  preferredDifficulty: 'easy' | 'medium' | 'hard'; // User preference
}

// Constants for SM-2 algorithm
const MIN_EASE_FACTOR = 1.3;
const MAX_EASE_FACTOR = 2.5;
const DEFAULT_EASE_FACTOR = 2.5;
const INITIAL_INTERVAL = 1; // days
const SECOND_INTERVAL = 6; // days

/**
 * Calculate next review state based on user performance
 * @param currentState Current SRS state
 * @param reviewResult User's review performance
 * @param personalization User-specific factors
 * @returns Updated SRS state
 */
export const calculateNextReview = (
  currentState: SpacedRepetitionState,
  reviewResult: ReviewResult,
  personalization?: PersonalizationFactors
): SpacedRepetitionState => {
  const { quality, timeSpent, hintsUsed } = reviewResult;
  
  // Adjust quality based on hints usage
  const adjustedQuality = hintsUsed ? Math.max(0, quality - 1) : quality;
  
  // Calculate new ease factor using SM-2 formula
  let newEaseFactor = currentState.easeFactor + (0.1 - (5 - adjustedQuality) * (0.08 + (5 - adjustedQuality) * 0.02));
  
  // Clamp ease factor to valid range
  newEaseFactor = Math.max(MIN_EASE_FACTOR, Math.min(MAX_EASE_FACTOR, newEaseFactor));
  
  // Apply personalization factors
  if (personalization) {
    newEaseFactor *= personalization.learningSpeed;
    newEaseFactor = Math.max(MIN_EASE_FACTOR, Math.min(MAX_EASE_FACTOR, newEaseFactor));
  }
  
  let newInterval: number;
  let newRepetitions: number;
  
  // If quality < 3, reset repetitions and start over
  if (adjustedQuality < 3) {
    newInterval = INITIAL_INTERVAL;
    newRepetitions = 0;
  } else {
    // Successful recall
    newRepetitions = currentState.repetitions + 1;
    
    if (currentState.repetitions === 0) {
      newInterval = INITIAL_INTERVAL;
    } else if (currentState.repetitions === 1) {
      newInterval = SECOND_INTERVAL;
    } else {
      newInterval = Math.round(currentState.interval * newEaseFactor);
    }
    
    // Apply personalization to interval
    if (personalization) {
      newInterval = Math.round(newInterval * personalization.retentionRate);
    }
  }
  
  // Calculate mastery level (0-100)
  const masteryLevel = calculateMasteryLevel(newRepetitions, newEaseFactor, adjustedQuality);
  
  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  
  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate: nextReviewDate.toISOString(),
    lastReviewDate: new Date().toISOString(),
    masteryLevel,
  };
};

/**
 * Calculate mastery level based on SRS state and performance
 * @param repetitions Number of successful repetitions
 * @param easeFactor Current ease factor
 * @param quality Latest review quality
 * @returns Mastery level (0-100)
 */
export const calculateMasteryLevel = (
  repetitions: number,
  easeFactor: number,
  quality: number
): number => {
  // Base score from repetitions (logarithmic growth)
  const repetitionScore = Math.min(60, Math.log(repetitions + 1) * 20);
  
  // Score from ease factor (normalized)
  const easeScore = ((easeFactor - MIN_EASE_FACTOR) / (MAX_EASE_FACTOR - MIN_EASE_FACTOR)) * 20;
  
  // Score from latest quality
  const qualityScore = (quality / 5) * 20;
  
  const totalScore = repetitionScore + easeScore + qualityScore;
  
  return Math.min(100, Math.max(0, Math.round(totalScore)));
};

/**
 * Get words due for review
 * @param allWords All word progress states
 * @param currentDate Current date (defaults to now)
 * @returns Words that are due for review
 */
export const getWordsDueForReview = (
  allWords: Array<SpacedRepetitionState & { wordId: string }>,
  currentDate?: Date
): Array<SpacedRepetitionState & { wordId: string }> => {
  const now = currentDate || new Date();
  
  return allWords.filter((word) => {
    const reviewDate = new Date(word.nextReviewDate);
    return reviewDate <= now;
  }).sort((a, b) => {
    // Sort by review date (earliest first)
    return new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime();
  });
};

/**
 * Initialize SRS state for a new word
 * @returns Initial SRS state
 */
export const initializeSpacedRepetition = (): SpacedRepetitionState => {
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + INITIAL_INTERVAL);
  
  return {
    easeFactor: DEFAULT_EASE_FACTOR,
    interval: INITIAL_INTERVAL,
    repetitions: 0,
    nextReviewDate: nextReviewDate.toISOString(),
    lastReviewDate: new Date().toISOString(),
    masteryLevel: 0,
  };
};

/**
 * Adjust difficulty based on user performance history
 * @param performanceHistory Array of recent quality scores
 * @returns Recommended difficulty adjustment
 */
export const adjustDifficulty = (
  performanceHistory: number[]
): 'decrease' | 'maintain' | 'increase' => {
  if (performanceHistory.length < 5) {
    return 'maintain';
  }
  
  const recentPerformance = performanceHistory.slice(-10); // Last 10 reviews
  const averageQuality = recentPerformance.reduce((a, b) => a + b, 0) / recentPerformance.length;
  
  if (averageQuality >= 4.5) {
    return 'increase'; // User is finding it too easy
  } else if (averageQuality < 3) {
    return 'decrease'; // User is struggling
  }
  
  return 'maintain';
};

/**
 * Calculate study streak
 * @param reviewDates Array of review dates
 * @param currentDate Current date
 * @returns Number of consecutive days with reviews
 */
export const calculateStreak = (reviewDates: string[], currentDate?: Date): number => {
  if (reviewDates.length === 0) {
    return 0;
  }
  
  const now = currentDate || new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Sort dates in descending order
  const sortedDates = reviewDates
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());
  
  let streak = 0;
  let checkDate = new Date(today);
  
  for (const reviewDate of sortedDates) {
    const reviewDay = new Date(
      reviewDate.getFullYear(),
      reviewDate.getMonth(),
      reviewDate.getDate()
    );
    
    if (reviewDay.getTime() === checkDate.getTime()) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (reviewDay < checkDate) {
      break;
    }
  }
  
  return streak;
};

/**
 * Get recommended study session size
 * @param availableWords Total words available for review
 * @param userPreference User's preferred session size
 * @param timeAvailable Available study time in minutes
 * @returns Recommended number of words for this session
 */
export const getRecommendedSessionSize = (
  availableWords: number,
  userPreference: number = 20,
  timeAvailable: number = 30
): number => {
  // Assume average 1.5 minutes per word
  const timeBasedLimit = Math.floor(timeAvailable / 1.5);
  
  const recommended = Math.min(availableWords, userPreference, timeBasedLimit);
  
  // Minimum 5 words, maximum 50 words per session
  return Math.max(5, Math.min(50, recommended));
};

