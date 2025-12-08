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
  frequency: number; // occurrence frequency in Quran
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  mediaContent: MediaContent;
  contextualExamples: ContextualExample[];
  relatedWords: string[]; // wordIds of related words
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

