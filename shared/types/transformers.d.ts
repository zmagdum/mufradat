/**
 * Data transformation and serialization utilities
 * These utilities handle data conversion between different formats
 */
import { UserProfile, VocabularyWord, WordProgress, VerbConjugation } from './index';
/**
 * Date serialization utilities
 */
export declare class DateSerializer {
    /**
     * Convert Date to ISO string
     */
    static serialize(date: Date): string;
    /**
     * Convert ISO string to Date
     */
    static deserialize(dateString: string): Date;
    /**
     * Check if date string is valid
     */
    static isValidDateString(dateString: string): boolean;
}
/**
 * UserProfile transformation utilities
 */
export declare class UserProfileTransformer {
    /**
     * Convert UserProfile to database format (DynamoDB)
     */
    static toDatabase(profile: UserProfile): Record<string, any>;
    /**
     * Convert database format to UserProfile
     */
    static fromDatabase(data: Record<string, any>): UserProfile;
    /**
     * Convert UserProfile to API response format
     */
    static toApiResponse(profile: UserProfile): Record<string, any>;
    /**
     * Create default UserProfile
     */
    static createDefault(userId: string, email: string, displayName: string): UserProfile;
}
/**
 * VocabularyWord transformation utilities
 */
export declare class VocabularyWordTransformer {
    /**
     * Convert VocabularyWord to database format
     */
    static toDatabase(word: VocabularyWord): Record<string, any>;
    /**
     * Convert database format to VocabularyWord
     */
    static fromDatabase(data: Record<string, any>): VocabularyWord;
    /**
     * Convert VocabularyWord to API response format
     */
    static toApiResponse(word: VocabularyWord): Record<string, any>;
    /**
     * Create lightweight version for listing (without examples)
     */
    static toListItem(word: VocabularyWord): Record<string, any>;
}
/**
 * WordProgress transformation utilities
 */
export declare class WordProgressTransformer {
    /**
     * Convert WordProgress to database format
     */
    static toDatabase(progress: WordProgress): Record<string, any>;
    /**
     * Convert database format to WordProgress
     */
    static fromDatabase(data: Record<string, any>): WordProgress;
    /**
     * Convert WordProgress to API response format
     */
    static toApiResponse(progress: WordProgress): Record<string, any>;
    /**
     * Create initial WordProgress for a new word
     */
    static createInitial(userId: string, wordId: string): WordProgress;
    /**
     * Calculate accuracy percentage
     */
    static calculateAccuracy(progress: WordProgress): number;
}
/**
 * VerbConjugation transformation utilities
 */
export declare class VerbConjugationTransformer {
    /**
     * Convert VerbConjugation to database format
     */
    static toDatabase(conjugation: VerbConjugation): Record<string, any>;
    /**
     * Convert database format to VerbConjugation
     */
    static fromDatabase(data: Record<string, any>): VerbConjugation;
    /**
     * Convert VerbConjugation to API response format
     */
    static toApiResponse(conjugation: VerbConjugation): Record<string, any>;
    /**
     * Get specific conjugation form
     */
    static getConjugationForm(conjugation: VerbConjugation, tense: string, person: string, number: string, gender: string): string | undefined;
}
/**
 * Batch transformation utilities
 */
export declare class BatchTransformer {
    /**
     * Transform array of UserProfiles to API response
     */
    static userProfilesToApi(profiles: UserProfile[]): Record<string, any>[];
    /**
     * Transform array of VocabularyWords to API response
     */
    static vocabularyWordsToApi(words: VocabularyWord[]): Record<string, any>[];
    /**
     * Transform array of VocabularyWords to list items
     */
    static vocabularyWordsToListItems(words: VocabularyWord[]): Record<string, any>[];
    /**
     * Transform array of WordProgress to API response
     */
    static wordProgressToApi(progressList: WordProgress[]): Record<string, any>[];
}
/**
 * JSON serialization utilities with Date support
 */
export declare class JsonSerializer {
    /**
     * Stringify with Date conversion
     */
    static stringify(obj: any): string;
    /**
     * Parse with Date conversion
     */
    static parse(json: string): any;
}
//# sourceMappingURL=transformers.d.ts.map