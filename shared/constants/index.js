"use strict";
/**
 * Shared constants used across the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WORD_TYPES = exports.LEARNING_MODALITIES = exports.MASTERY_LEVELS = exports.SR_EASE_FACTOR_DEFAULT = exports.SR_EASE_FACTOR_MAX = exports.SR_EASE_FACTOR_MIN = exports.SR_MAX_INTERVAL = exports.SR_MIN_INTERVAL = exports.IS_PROD = exports.IS_DEV = exports.ENV = exports.API_BASE_URL = void 0;
// API Configuration
exports.API_BASE_URL = process.env.API_BASE_URL ||
    process.env.EXPO_PUBLIC_API_URL ||
    'http://localhost:4566'; // LocalStack default
// Environment
exports.ENV = process.env.NODE_ENV || 'development';
exports.IS_DEV = exports.ENV === 'development';
exports.IS_PROD = exports.ENV === 'production';
// Spaced Repetition Constants
exports.SR_MIN_INTERVAL = 1; // Minimum interval in days
exports.SR_MAX_INTERVAL = 365; // Maximum interval in days
exports.SR_EASE_FACTOR_MIN = 1.3;
exports.SR_EASE_FACTOR_MAX = 2.5;
exports.SR_EASE_FACTOR_DEFAULT = 2.5;
// Mastery Levels
exports.MASTERY_LEVELS = {
    BEGINNER: 1,
    LEARNING: 2,
    FAMILIAR: 3,
    PROFICIENT: 4,
    MASTERED: 5,
};
// Learning Modalities
exports.LEARNING_MODALITIES = {
    VISUAL: 'visual',
    AUDIO: 'audio',
    CONTEXTUAL: 'contextual',
    ASSOCIATION: 'association',
};
// Word Types
exports.WORD_TYPES = {
    NOUN: 'noun',
    VERB: 'verb',
    PARTICLE: 'particle',
    PRONOUN: 'pronoun',
    ADJECTIVE: 'adjective',
    ADVERB: 'adverb',
};
//# sourceMappingURL=index.js.map