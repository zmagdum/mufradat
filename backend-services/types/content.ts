export interface VocabularyWord {
  wordId: string;
  arabicText: string;
  transliteration: string;
  translation: string;
  rootLetters: string;
  wordType: WordType;
  frequency: number; // occurrence frequency in Quran
  difficulty: DifficultyLevel;
  mediaContent: MediaContent;
  contextualExamples: ContextualExample[];
  relatedWords: string[]; // wordIds of related words
  createdAt: string;
  updatedAt: string;
}

export interface MediaContent {
  audioUrl?: string;
  imageUrls: string[];
  calligraphyUrl?: string;
}

export interface ContextualExample {
  verseId: string;
  surahNumber: number;
  ayahNumber: number;
  arabicText: string;
  translation: string;
  transliteration: string;
  wordPosition: number; // position of the word in the verse
}

export interface VerbConjugation {
  verbId: string;
  rootForm: string;
  conjugations: ConjugationForms;
  patterns: string[];
  irregularities: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ConjugationForms {
  [tense: string]: {
    [person: string]: {
      [number: string]: {
        [gender: string]: string;
      };
    };
  };
}

export type WordType = 'noun' | 'verb' | 'particle' | 'adjective' | 'pronoun' | 'preposition';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// API Request/Response types
export interface CreateWordRequest {
  arabicText: string;
  transliteration: string;
  translation: string;
  rootLetters: string;
  wordType: WordType;
  frequency: number;
  difficulty: DifficultyLevel;
  contextualExamples?: ContextualExample[];
  relatedWords?: string[];
}

export interface UpdateWordRequest extends Partial<CreateWordRequest> {
  wordId: string;
}

export interface WordSearchQuery {
  searchTerm?: string;
  wordType?: WordType;
  difficulty?: DifficultyLevel;
  rootLetters?: string;
  limit?: number;
  lastEvaluatedKey?: string;
}

export interface WordSearchResponse {
  words: VocabularyWord[];
  lastEvaluatedKey?: string;
  count: number;
}

export interface MediaUploadRequest {
  wordId: string;
  mediaType: 'audio' | 'image' | 'calligraphy';
  fileName: string;
  contentType: string;
}

export interface MediaUploadResponse {
  uploadUrl: string;
  mediaUrl: string;
}

// Database types
export interface DynamoDBWord extends Omit<VocabularyWord, 'createdAt' | 'updatedAt'> {
  pk: string; // 'WORD#${wordId}'
  sk: string; // 'METADATA'
  gsi1pk: string; // 'WORDTYPE#${wordType}'
  gsi1sk: string; // 'DIFFICULTY#${difficulty}#FREQUENCY#${frequency}'
  gsi2pk: string; // 'ROOT#${rootLetters}'
  gsi2sk: string; // 'WORD#${wordId}'
  createdAt: number;
  updatedAt: number;
}

export interface DynamoDBConjugation extends Omit<VerbConjugation, 'createdAt' | 'updatedAt'> {
  pk: string; // 'CONJUGATION#${verbId}'
  sk: string; // 'METADATA'
  createdAt: number;
  updatedAt: number;
}