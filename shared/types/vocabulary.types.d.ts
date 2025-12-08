/**
 * Vocabulary-related type definitions
 */
export interface VocabularyWord {
    wordId: string;
    arabicText: string;
    transliteration: string;
    translation: string;
    rootLetters: string;
    wordType: 'noun' | 'verb' | 'particle' | 'adjective';
    frequency: number;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    mediaContent: MediaContent;
    contextualExamples: ContextualExample[];
    relatedWords: string[];
}
export interface MediaContent {
    audioUrl: string;
    imageUrls: string[];
    calligraphyUrl: string;
}
export interface ContextualExample {
    verseReference: string;
    arabicVerse: string;
    translation: string;
    transliteration: string;
    highlightIndices: number[];
}
//# sourceMappingURL=vocabulary.types.d.ts.map