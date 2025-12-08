/**
 * Shared constants used across the application
 */

// API Configuration
export const API_BASE_URL = 
  process.env.API_BASE_URL || 
  process.env.EXPO_PUBLIC_API_URL || 
  'http://localhost:4566'; // LocalStack default

// Environment
export const ENV = process.env.NODE_ENV || 'development';
export const IS_DEV = ENV === 'development';
export const IS_PROD = ENV === 'production';

// Spaced Repetition Constants
export const SR_MIN_INTERVAL = 1; // Minimum interval in days
export const SR_MAX_INTERVAL = 365; // Maximum interval in days
export const SR_EASE_FACTOR_MIN = 1.3;
export const SR_EASE_FACTOR_MAX = 2.5;
export const SR_EASE_FACTOR_DEFAULT = 2.5;

// Mastery Levels
export const MASTERY_LEVELS = {
  BEGINNER: 1,
  LEARNING: 2,
  FAMILIAR: 3,
  PROFICIENT: 4,
  MASTERED: 5,
} as const;

// Learning Modalities
export const LEARNING_MODALITIES = {
  VISUAL: 'visual',
  AUDIO: 'audio',
  CONTEXTUAL: 'contextual',
  ASSOCIATION: 'association',
} as const;

// Word Types
export const WORD_TYPES = {
  NOUN: 'noun',
  VERB: 'verb',
  PARTICLE: 'particle',
  PRONOUN: 'pronoun',
  ADJECTIVE: 'adjective',
  ADVERB: 'adverb',
} as const;
