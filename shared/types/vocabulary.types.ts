/**
 * Vocabulary-related type definitions
 */

export interface VocabularyWord {
  wordId: string;
  arabicText: string;
  transliteration: string;
  translation: string;
  urduTranslation?: string; // Urdu translation of the word
  rootLetters: string;
  wordType: 'noun' | 'verb' | 'particle' | 'adjective';
  frequency: number; // occurrence frequency in Quran
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  mediaContent: MediaContent;
  contextualExamples: ContextualExample[];
  relatedWords: string[]; // wordIds of related words
  // Book organization fields
  book?: number; // Book number (1, 2, 3, etc.)
  chapter?: number; // Chapter number within the book
  page?: number; // Page number within the chapter
  wordNumber?: number; // Word number on the page
  // Additional forms
  pluralForm?: string; // Plural form for nouns
  presentTenseForm?: string; // Present tense form for verbs
  pluralTranslation?: string; // English translation of plural/present tense
  // Audio file reference
  audioFileName?: string; // Name of audio file in S3 bucket
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

export interface Book {
  bookId: string;
  series: string;
  seriesUrdu?: string;
  title: string;
  titleUrdu?: string;
  description: string;
  descriptionUrdu?: string;
  sheet?: string;
  sheetTitle?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Chapter {
  chapterId: string;
  bookId: string;
  chapterNumber: number;
  title: string;
  titleUrdu?: string;
  createdAt: string;
  updatedAt: string;
}

