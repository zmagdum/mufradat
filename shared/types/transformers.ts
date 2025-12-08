/**
 * Data transformation and serialization utilities
 * These utilities handle data conversion between different formats
 */

import {
  UserProfile,
  VocabularyWord,
  WordProgress,
  VerbConjugation,
  ContextualExample,
} from './index';

/**
 * Date serialization utilities
 */
export class DateSerializer {
  /**
   * Convert Date to ISO string
   */
  static serialize(date: Date): string {
    return date.toISOString();
  }

  /**
   * Convert ISO string to Date
   */
  static deserialize(dateString: string): Date {
    return new Date(dateString);
  }

  /**
   * Check if date string is valid
   */
  static isValidDateString(dateString: string): boolean {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
}

/**
 * UserProfile transformation utilities
 */
export class UserProfileTransformer {
  /**
   * Convert UserProfile to database format (DynamoDB)
   */
  static toDatabase(profile: UserProfile): Record<string, any> {
    return {
      userId: profile.userId,
      email: profile.email,
      displayName: profile.displayName,
      createdAt: DateSerializer.serialize(profile.createdAt),
      lastActiveAt: DateSerializer.serialize(profile.lastActiveAt),
      preferences: JSON.stringify(profile.preferences),
      statistics: JSON.stringify(profile.statistics),
    };
  }

  /**
   * Convert database format to UserProfile
   */
  static fromDatabase(data: Record<string, any>): UserProfile {
    return {
      userId: data.userId,
      email: data.email,
      displayName: data.displayName,
      createdAt: DateSerializer.deserialize(data.createdAt),
      lastActiveAt: DateSerializer.deserialize(data.lastActiveAt),
      preferences: JSON.parse(data.preferences),
      statistics: JSON.parse(data.statistics),
    };
  }

  /**
   * Convert UserProfile to API response format
   */
  static toApiResponse(profile: UserProfile): Record<string, any> {
    return {
      userId: profile.userId,
      email: profile.email,
      displayName: profile.displayName,
      createdAt: profile.createdAt.toISOString(),
      lastActiveAt: profile.lastActiveAt.toISOString(),
      preferences: profile.preferences,
      statistics: profile.statistics,
    };
  }

  /**
   * Create default UserProfile
   */
  static createDefault(userId: string, email: string, displayName: string): UserProfile {
    return {
      userId,
      email,
      displayName,
      createdAt: new Date(),
      lastActiveAt: new Date(),
      preferences: {
        learningModalities: ['visual', 'audio', 'contextual'],
        notificationFrequency: 'medium',
        studyGoal: 10,
        preferredStudyTime: '19:00',
      },
      statistics: {
        totalWordsLearned: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalStudyTime: 0,
      },
    };
  }
}

/**
 * VocabularyWord transformation utilities
 */
export class VocabularyWordTransformer {
  /**
   * Convert VocabularyWord to database format
   */
  static toDatabase(word: VocabularyWord): Record<string, any> {
    return {
      wordId: word.wordId,
      arabicText: word.arabicText,
      transliteration: word.transliteration,
      translation: word.translation,
      rootLetters: word.rootLetters,
      wordType: word.wordType,
      frequency: word.frequency,
      difficulty: word.difficulty,
      mediaContent: JSON.stringify(word.mediaContent),
      contextualExamples: JSON.stringify(word.contextualExamples),
      relatedWords: JSON.stringify(word.relatedWords),
    };
  }

  /**
   * Convert database format to VocabularyWord
   */
  static fromDatabase(data: Record<string, any>): VocabularyWord {
    return {
      wordId: data.wordId,
      arabicText: data.arabicText,
      transliteration: data.transliteration,
      translation: data.translation,
      rootLetters: data.rootLetters,
      wordType: data.wordType,
      frequency: data.frequency,
      difficulty: data.difficulty,
      mediaContent: JSON.parse(data.mediaContent),
      contextualExamples: JSON.parse(data.contextualExamples),
      relatedWords: JSON.parse(data.relatedWords),
    };
  }

  /**
   * Convert VocabularyWord to API response format
   */
  static toApiResponse(word: VocabularyWord): Record<string, any> {
    return {
      wordId: word.wordId,
      arabicText: word.arabicText,
      transliteration: word.transliteration,
      translation: word.translation,
      rootLetters: word.rootLetters,
      wordType: word.wordType,
      frequency: word.frequency,
      difficulty: word.difficulty,
      mediaContent: word.mediaContent,
      contextualExamples: word.contextualExamples,
      relatedWords: word.relatedWords,
    };
  }

  /**
   * Create lightweight version for listing (without examples)
   */
  static toListItem(word: VocabularyWord): Record<string, any> {
    return {
      wordId: word.wordId,
      arabicText: word.arabicText,
      transliteration: word.transliteration,
      translation: word.translation,
      wordType: word.wordType,
      difficulty: word.difficulty,
      frequency: word.frequency,
    };
  }
}

/**
 * WordProgress transformation utilities
 */
export class WordProgressTransformer {
  /**
   * Convert WordProgress to database format
   */
  static toDatabase(progress: WordProgress): Record<string, any> {
    return {
      userId: progress.userId,
      wordId: progress.wordId,
      masteryLevel: progress.masteryLevel,
      reviewCount: progress.reviewCount,
      correctAnswers: progress.correctAnswers,
      lastReviewed: DateSerializer.serialize(progress.lastReviewed),
      nextReviewDate: DateSerializer.serialize(progress.nextReviewDate),
      learningModality: JSON.stringify(progress.learningModality),
      difficultyAdjustments: progress.difficultyAdjustments,
      averageResponseTime: progress.averageResponseTime,
    };
  }

  /**
   * Convert database format to WordProgress
   */
  static fromDatabase(data: Record<string, any>): WordProgress {
    return {
      userId: data.userId,
      wordId: data.wordId,
      masteryLevel: data.masteryLevel,
      reviewCount: data.reviewCount,
      correctAnswers: data.correctAnswers,
      lastReviewed: DateSerializer.deserialize(data.lastReviewed),
      nextReviewDate: DateSerializer.deserialize(data.nextReviewDate),
      learningModality: JSON.parse(data.learningModality),
      difficultyAdjustments: data.difficultyAdjustments,
      averageResponseTime: data.averageResponseTime,
    };
  }

  /**
   * Convert WordProgress to API response format
   */
  static toApiResponse(progress: WordProgress): Record<string, any> {
    return {
      userId: progress.userId,
      wordId: progress.wordId,
      masteryLevel: progress.masteryLevel,
      reviewCount: progress.reviewCount,
      correctAnswers: progress.correctAnswers,
      lastReviewed: progress.lastReviewed.toISOString(),
      nextReviewDate: progress.nextReviewDate.toISOString(),
      learningModality: progress.learningModality,
      difficultyAdjustments: progress.difficultyAdjustments,
      averageResponseTime: progress.averageResponseTime,
      accuracy: progress.reviewCount > 0 
        ? (progress.correctAnswers / progress.reviewCount) * 100 
        : 0,
    };
  }

  /**
   * Create initial WordProgress for a new word
   */
  static createInitial(userId: string, wordId: string): WordProgress {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return {
      userId,
      wordId,
      masteryLevel: 0,
      reviewCount: 0,
      correctAnswers: 0,
      lastReviewed: now,
      nextReviewDate: tomorrow,
      learningModality: [],
      difficultyAdjustments: 0,
      averageResponseTime: 0,
    };
  }

  /**
   * Calculate accuracy percentage
   */
  static calculateAccuracy(progress: WordProgress): number {
    if (progress.reviewCount === 0) return 0;
    return (progress.correctAnswers / progress.reviewCount) * 100;
  }
}

/**
 * VerbConjugation transformation utilities
 */
export class VerbConjugationTransformer {
  /**
   * Convert VerbConjugation to database format
   */
  static toDatabase(conjugation: VerbConjugation): Record<string, any> {
    return {
      verbId: conjugation.verbId,
      rootForm: conjugation.rootForm,
      conjugations: JSON.stringify(conjugation.conjugations),
      patterns: JSON.stringify(conjugation.patterns),
      irregularities: JSON.stringify(conjugation.irregularities),
    };
  }

  /**
   * Convert database format to VerbConjugation
   */
  static fromDatabase(data: Record<string, any>): VerbConjugation {
    return {
      verbId: data.verbId,
      rootForm: data.rootForm,
      conjugations: JSON.parse(data.conjugations),
      patterns: JSON.parse(data.patterns),
      irregularities: JSON.parse(data.irregularities),
    };
  }

  /**
   * Convert VerbConjugation to API response format
   */
  static toApiResponse(conjugation: VerbConjugation): Record<string, any> {
    return {
      verbId: conjugation.verbId,
      rootForm: conjugation.rootForm,
      conjugations: conjugation.conjugations,
      patterns: conjugation.patterns,
      irregularities: conjugation.irregularities,
    };
  }

  /**
   * Get specific conjugation form
   */
  static getConjugationForm(
    conjugation: VerbConjugation,
    tense: string,
    person: string,
    number: string,
    gender: string
  ): string | undefined {
    return conjugation.conjugations?.[tense]?.[person]?.[number]?.[gender];
  }
}

/**
 * Batch transformation utilities
 */
export class BatchTransformer {
  /**
   * Transform array of UserProfiles to API response
   */
  static userProfilesToApi(profiles: UserProfile[]): Record<string, any>[] {
    return profiles.map(UserProfileTransformer.toApiResponse);
  }

  /**
   * Transform array of VocabularyWords to API response
   */
  static vocabularyWordsToApi(words: VocabularyWord[]): Record<string, any>[] {
    return words.map(VocabularyWordTransformer.toApiResponse);
  }

  /**
   * Transform array of VocabularyWords to list items
   */
  static vocabularyWordsToListItems(words: VocabularyWord[]): Record<string, any>[] {
    return words.map(VocabularyWordTransformer.toListItem);
  }

  /**
   * Transform array of WordProgress to API response
   */
  static wordProgressToApi(progressList: WordProgress[]): Record<string, any>[] {
    return progressList.map(WordProgressTransformer.toApiResponse);
  }
}

/**
 * JSON serialization utilities with Date support
 */
export class JsonSerializer {
  /**
   * Stringify with Date conversion
   */
  static stringify(obj: any): string {
    return JSON.stringify(obj, (key, value) => {
      if (value instanceof Date) {
        return { __type: 'Date', value: value.toISOString() };
      }
      return value;
    });
  }

  /**
   * Parse with Date conversion
   */
  static parse(json: string): any {
    return JSON.parse(json, (key, value) => {
      if (value && value.__type === 'Date') {
        return new Date(value.value);
      }
      return value;
    });
  }
}

