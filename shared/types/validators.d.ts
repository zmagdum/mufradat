/**
 * Data validation functions for all models
 * These validators ensure data integrity across the application
 */
import { UserProfile, UserPreferences, VocabularyWord, WordProgress, VerbConjugation } from './index';
/**
 * Validation error class
 */
export declare class ValidationError extends Error {
    field?: string | undefined;
    code?: string | undefined;
    constructor(message: string, field?: string | undefined, code?: string | undefined);
}
/**
 * Validation result type
 */
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}
/**
 * Validate email format
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Validate string length
 */
export declare function isValidLength(value: string, min: number, max: number): boolean;
/**
 * Validate number range
 */
export declare function isInRange(value: number, min: number, max: number): boolean;
/**
 * Validate date
 */
export declare function isValidDate(date: Date): boolean;
/**
 * Validate URL format
 */
export declare function isValidUrl(url: string): boolean;
/**
 * Validate UserPreferences
 */
export declare function validateUserPreferences(preferences: Partial<UserPreferences>): ValidationResult;
/**
 * Validate UserProfile
 */
export declare function validateUserProfile(profile: Partial<UserProfile>): ValidationResult;
/**
 * Validate VocabularyWord
 */
export declare function validateVocabularyWord(word: Partial<VocabularyWord>): ValidationResult;
/**
 * Validate WordProgress
 */
export declare function validateWordProgress(progress: Partial<WordProgress>): ValidationResult;
/**
 * Validate VerbConjugation
 */
export declare function validateVerbConjugation(conjugation: Partial<VerbConjugation>): ValidationResult;
//# sourceMappingURL=validators.d.ts.map