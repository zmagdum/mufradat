/**
 * Shared type definitions for backend
 * Re-exports from root shared/ directory
 */

export interface UserProfile {
  userId: string;
  email: string;
  username?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  studyGoal?: number;
  learningModalities?: string[];
}

export interface VocabularyWord {
  wordId: string;
  arabicText: string;
  transliteration: string;
  translation: string;
  rootLetters: string[];
  wordType: 'noun' | 'verb' | 'adjective' | 'particle';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  frequency: number;
  mediaContent?: {
    audioUrl?: string;
    imageUrl?: string;
    calligraphyUrl?: string;
  };
  contextualExamples?: Array<{
    verseReference: string;
    arabicText: string;
    translation: string;
  }>;
  relatedWords?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WordProgress {
  userId: string;
  wordId: string;
  masteryLevel: number;
  lastReviewedAt: string;
  nextReviewDate: string;
  reviewCount: number;
  correctCount: number;
  incorrectCount: number;
  easeFactor: number;
  interval: number;
  streakDays: number;
}

export interface VerbConjugation {
  verbId: string;
  rootLetters: string[];
  pattern: string;
  conjugations: {
    past: Record<string, string>;
    present: Record<string, string>;
    future: Record<string, string>;
    imperative: Record<string, string>;
  };
  createdAt: string;
  updatedAt: string;
}

