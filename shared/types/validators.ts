/**
 * Data validation functions for all models
 * These validators ensure data integrity across the application
 */

import {
  UserProfile,
  UserPreferences,
  VocabularyWord,
  WordProgress,
  VerbConjugation,
} from './index';

/**
 * Validation error class
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Email validation regex
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate string length
 */
export function isValidLength(
  value: string,
  min: number,
  max: number
): boolean {
  return value.length >= min && value.length <= max;
}

/**
 * Validate number range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate date
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate UserPreferences
 */
export function validateUserPreferences(
  preferences: Partial<UserPreferences>
): ValidationResult {
  const errors: ValidationError[] = [];

  if (preferences.learningModalities) {
    const validModalities = ['visual', 'audio', 'contextual', 'associative'];
    const invalid = preferences.learningModalities.filter(
      (m) => !validModalities.includes(m)
    );
    if (invalid.length > 0) {
      errors.push(
        new ValidationError(
          `Invalid learning modalities: ${invalid.join(', ')}`,
          'learningModalities',
          'INVALID_MODALITY'
        )
      );
    }
  }

  if (preferences.notificationFrequency) {
    const validFrequencies = ['low', 'medium', 'high'];
    if (!validFrequencies.includes(preferences.notificationFrequency)) {
      errors.push(
        new ValidationError(
          'Invalid notification frequency',
          'notificationFrequency',
          'INVALID_FREQUENCY'
        )
      );
    }
  }

  if (
    preferences.studyGoal !== undefined &&
    !isInRange(preferences.studyGoal, 1, 100)
  ) {
    errors.push(
      new ValidationError(
        'Study goal must be between 1 and 100',
        'studyGoal',
        'OUT_OF_RANGE'
      )
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate UserProfile
 */
export function validateUserProfile(
  profile: Partial<UserProfile>
): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!profile.userId || !isValidLength(profile.userId, 1, 128)) {
    errors.push(
      new ValidationError(
        'User ID is required and must be between 1-128 characters',
        'userId',
        'INVALID_USER_ID'
      )
    );
  }

  if (!profile.email || !isValidEmail(profile.email)) {
    errors.push(
      new ValidationError(
        'Valid email is required',
        'email',
        'INVALID_EMAIL'
      )
    );
  }

  if (!profile.displayName || !isValidLength(profile.displayName, 1, 100)) {
    errors.push(
      new ValidationError(
        'Display name is required and must be between 1-100 characters',
        'displayName',
        'INVALID_DISPLAY_NAME'
      )
    );
  }

  // Validate dates
  if (profile.createdAt && !isValidDate(profile.createdAt)) {
    errors.push(
      new ValidationError('Invalid created date', 'createdAt', 'INVALID_DATE')
    );
  }

  if (profile.lastActiveAt && !isValidDate(profile.lastActiveAt)) {
    errors.push(
      new ValidationError(
        'Invalid last active date',
        'lastActiveAt',
        'INVALID_DATE'
      )
    );
  }

  // Validate nested preferences
  if (profile.preferences) {
    const prefResult = validateUserPreferences(profile.preferences);
    errors.push(...prefResult.errors);
  }

  // Validate statistics
  if (profile.statistics) {
    const stats = profile.statistics;
    if (stats.totalWordsLearned !== undefined && stats.totalWordsLearned < 0) {
      errors.push(
        new ValidationError(
          'Total words learned cannot be negative',
          'statistics.totalWordsLearned',
          'NEGATIVE_VALUE'
        )
      );
    }
    if (stats.currentStreak !== undefined && stats.currentStreak < 0) {
      errors.push(
        new ValidationError(
          'Current streak cannot be negative',
          'statistics.currentStreak',
          'NEGATIVE_VALUE'
        )
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate VocabularyWord
 */
export function validateVocabularyWord(
  word: Partial<VocabularyWord>
): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!word.wordId || !isValidLength(word.wordId, 1, 128)) {
    errors.push(
      new ValidationError(
        'Word ID is required and must be between 1-128 characters',
        'wordId',
        'INVALID_WORD_ID'
      )
    );
  }

  if (!word.arabicText || !isValidLength(word.arabicText, 1, 200)) {
    errors.push(
      new ValidationError(
        'Arabic text is required and must be between 1-200 characters',
        'arabicText',
        'INVALID_ARABIC_TEXT'
      )
    );
  }

  if (!word.transliteration || !isValidLength(word.transliteration, 1, 200)) {
    errors.push(
      new ValidationError(
        'Transliteration is required',
        'transliteration',
        'REQUIRED'
      )
    );
  }

  if (!word.translation || !isValidLength(word.translation, 1, 500)) {
    errors.push(
      new ValidationError('Translation is required', 'translation', 'REQUIRED')
    );
  }

  // Validate word type
  if (word.wordType) {
    const validTypes = ['noun', 'verb', 'particle', 'adjective'];
    if (!validTypes.includes(word.wordType)) {
      errors.push(
        new ValidationError(
          'Invalid word type',
          'wordType',
          'INVALID_WORD_TYPE'
        )
      );
    }
  }

  // Validate difficulty
  if (word.difficulty) {
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficulties.includes(word.difficulty)) {
      errors.push(
        new ValidationError(
          'Invalid difficulty level',
          'difficulty',
          'INVALID_DIFFICULTY'
        )
      );
    }
  }

  // Validate frequency
  if (word.frequency !== undefined && !isInRange(word.frequency, 0, 10000)) {
    errors.push(
      new ValidationError(
        'Frequency must be between 0 and 10000',
        'frequency',
        'OUT_OF_RANGE'
      )
    );
  }

  // Validate media content URLs
  if (word.mediaContent) {
    if (word.mediaContent.audioUrl && !isValidUrl(word.mediaContent.audioUrl)) {
      errors.push(
        new ValidationError(
          'Invalid audio URL',
          'mediaContent.audioUrl',
          'INVALID_URL'
        )
      );
    }
    if (
      word.mediaContent.calligraphyUrl &&
      !isValidUrl(word.mediaContent.calligraphyUrl)
    ) {
      errors.push(
        new ValidationError(
          'Invalid calligraphy URL',
          'mediaContent.calligraphyUrl',
          'INVALID_URL'
        )
      );
    }
    if (word.mediaContent.imageUrls) {
      word.mediaContent.imageUrls.forEach((url, index) => {
        if (!isValidUrl(url)) {
          errors.push(
            new ValidationError(
              `Invalid image URL at index ${index}`,
              `mediaContent.imageUrls[${index}]`,
              'INVALID_URL'
            )
          );
        }
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate WordProgress
 */
export function validateWordProgress(
  progress: Partial<WordProgress>
): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!progress.userId) {
    errors.push(
      new ValidationError('User ID is required', 'userId', 'REQUIRED')
    );
  }

  if (!progress.wordId) {
    errors.push(
      new ValidationError('Word ID is required', 'wordId', 'REQUIRED')
    );
  }

  // Validate mastery level (0-100)
  if (
    progress.masteryLevel !== undefined &&
    !isInRange(progress.masteryLevel, 0, 100)
  ) {
    errors.push(
      new ValidationError(
        'Mastery level must be between 0 and 100',
        'masteryLevel',
        'OUT_OF_RANGE'
      )
    );
  }

  // Validate counts
  if (progress.reviewCount !== undefined && progress.reviewCount < 0) {
    errors.push(
      new ValidationError(
        'Review count cannot be negative',
        'reviewCount',
        'NEGATIVE_VALUE'
      )
    );
  }

  if (progress.correctAnswers !== undefined && progress.correctAnswers < 0) {
    errors.push(
      new ValidationError(
        'Correct answers cannot be negative',
        'correctAnswers',
        'NEGATIVE_VALUE'
      )
    );
  }

  // Validate dates
  if (progress.lastReviewed && !isValidDate(progress.lastReviewed)) {
    errors.push(
      new ValidationError(
        'Invalid last reviewed date',
        'lastReviewed',
        'INVALID_DATE'
      )
    );
  }

  if (progress.nextReviewDate && !isValidDate(progress.nextReviewDate)) {
    errors.push(
      new ValidationError(
        'Invalid next review date',
        'nextReviewDate',
        'INVALID_DATE'
      )
    );
  }

  // Validate average response time
  if (
    progress.averageResponseTime !== undefined &&
    progress.averageResponseTime < 0
  ) {
    errors.push(
      new ValidationError(
        'Average response time cannot be negative',
        'averageResponseTime',
        'NEGATIVE_VALUE'
      )
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate VerbConjugation
 */
export function validateVerbConjugation(
  conjugation: Partial<VerbConjugation>
): ValidationResult {
  const errors: ValidationError[] = [];

  // Required fields
  if (!conjugation.verbId) {
    errors.push(
      new ValidationError('Verb ID is required', 'verbId', 'REQUIRED')
    );
  }

  if (!conjugation.rootForm || !isValidLength(conjugation.rootForm, 1, 50)) {
    errors.push(
      new ValidationError(
        'Root form is required and must be between 1-50 characters',
        'rootForm',
        'INVALID_ROOT_FORM'
      )
    );
  }

  // Validate conjugations structure
  if (conjugation.conjugations && typeof conjugation.conjugations === 'object') {
    // Basic structure validation
    const tenses = Object.keys(conjugation.conjugations);
    if (tenses.length === 0) {
      errors.push(
        new ValidationError(
          'At least one tense is required',
          'conjugations',
          'EMPTY_CONJUGATIONS'
        )
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

