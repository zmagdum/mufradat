import { 
  CreateWordRequest, 
  UpdateWordRequest, 
  WordType, 
  DifficultyLevel,
  ContextualExample,
  MediaUploadRequest
} from '../types/content';

export class ContentValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ContentValidationError';
  }
}

export function validateCreateWordRequest(data: any): CreateWordRequest {
  const errors: string[] = [];

  // Required fields validation
  if (!data.arabicText || typeof data.arabicText !== 'string' || data.arabicText.trim().length === 0) {
    errors.push('arabicText is required and must be a non-empty string');
  }

  if (!data.transliteration || typeof data.transliteration !== 'string' || data.transliteration.trim().length === 0) {
    errors.push('transliteration is required and must be a non-empty string');
  }

  if (!data.translation || typeof data.translation !== 'string' || data.translation.trim().length === 0) {
    errors.push('translation is required and must be a non-empty string');
  }

  if (!data.rootLetters || typeof data.rootLetters !== 'string' || data.rootLetters.trim().length === 0) {
    errors.push('rootLetters is required and must be a non-empty string');
  }

  if (!isValidWordType(data.wordType)) {
    errors.push('wordType must be one of: noun, verb, particle, adjective, pronoun, preposition');
  }

  if (!isValidDifficultyLevel(data.difficulty)) {
    errors.push('difficulty must be one of: beginner, intermediate, advanced');
  }

  if (typeof data.frequency !== 'number' || data.frequency < 0) {
    errors.push('frequency must be a non-negative number');
  }

  // Optional fields validation
  if (data.contextualExamples && !Array.isArray(data.contextualExamples)) {
    errors.push('contextualExamples must be an array');
  } else if (data.contextualExamples) {
    data.contextualExamples.forEach((example: any, index: number) => {
      const exampleErrors = validateContextualExample(example);
      if (exampleErrors.length > 0) {
        errors.push(`contextualExamples[${index}]: ${exampleErrors.join(', ')}`);
      }
    });
  }

  if (data.relatedWords && !Array.isArray(data.relatedWords)) {
    errors.push('relatedWords must be an array');
  } else if (data.relatedWords) {
    data.relatedWords.forEach((wordId: any, index: number) => {
      if (typeof wordId !== 'string' || wordId.trim().length === 0) {
        errors.push(`relatedWords[${index}] must be a non-empty string`);
      }
    });
  }

  if (errors.length > 0) {
    throw new ContentValidationError(`Validation failed: ${errors.join('; ')}`);
  }

  return {
    arabicText: sanitizeArabicText(data.arabicText),
    transliteration: sanitizeText(data.transliteration),
    translation: sanitizeText(data.translation),
    rootLetters: sanitizeArabicText(data.rootLetters),
    wordType: data.wordType,
    frequency: data.frequency,
    difficulty: data.difficulty,
    contextualExamples: data.contextualExamples || [],
    relatedWords: data.relatedWords || []
  };
}

export function validateUpdateWordRequest(data: any): UpdateWordRequest {
  const errors: string[] = [];

  if (!data.wordId || typeof data.wordId !== 'string' || data.wordId.trim().length === 0) {
    errors.push('wordId is required and must be a non-empty string');
  }

  // Validate optional fields if provided
  if (data.arabicText !== undefined) {
    if (typeof data.arabicText !== 'string' || data.arabicText.trim().length === 0) {
      errors.push('arabicText must be a non-empty string');
    }
  }

  if (data.transliteration !== undefined) {
    if (typeof data.transliteration !== 'string' || data.transliteration.trim().length === 0) {
      errors.push('transliteration must be a non-empty string');
    }
  }

  if (data.translation !== undefined) {
    if (typeof data.translation !== 'string' || data.translation.trim().length === 0) {
      errors.push('translation must be a non-empty string');
    }
  }

  if (data.rootLetters !== undefined) {
    if (typeof data.rootLetters !== 'string' || data.rootLetters.trim().length === 0) {
      errors.push('rootLetters must be a non-empty string');
    }
  }

  if (data.wordType !== undefined && !isValidWordType(data.wordType)) {
    errors.push('wordType must be one of: noun, verb, particle, adjective, pronoun, preposition');
  }

  if (data.difficulty !== undefined && !isValidDifficultyLevel(data.difficulty)) {
    errors.push('difficulty must be one of: beginner, intermediate, advanced');
  }

  if (data.frequency !== undefined && (typeof data.frequency !== 'number' || data.frequency < 0)) {
    errors.push('frequency must be a non-negative number');
  }

  if (errors.length > 0) {
    throw new ContentValidationError(`Validation failed: ${errors.join('; ')}`);
  }

  const result: UpdateWordRequest = { wordId: data.wordId };

  if (data.arabicText !== undefined) result.arabicText = sanitizeArabicText(data.arabicText);
  if (data.transliteration !== undefined) result.transliteration = sanitizeText(data.transliteration);
  if (data.translation !== undefined) result.translation = sanitizeText(data.translation);
  if (data.rootLetters !== undefined) result.rootLetters = sanitizeArabicText(data.rootLetters);
  if (data.wordType !== undefined) result.wordType = data.wordType;
  if (data.difficulty !== undefined) result.difficulty = data.difficulty;
  if (data.frequency !== undefined) result.frequency = data.frequency;
  if (data.contextualExamples !== undefined) result.contextualExamples = data.contextualExamples;
  if (data.relatedWords !== undefined) result.relatedWords = data.relatedWords;

  return result;
}

export function validateMediaUploadRequest(data: any): MediaUploadRequest {
  const errors: string[] = [];

  if (!data.wordId || typeof data.wordId !== 'string' || data.wordId.trim().length === 0) {
    errors.push('wordId is required and must be a non-empty string');
  }

  if (!data.mediaType || !['audio', 'image', 'calligraphy'].includes(data.mediaType)) {
    errors.push('mediaType must be one of: audio, image, calligraphy');
  }

  if (!data.fileName || typeof data.fileName !== 'string' || data.fileName.trim().length === 0) {
    errors.push('fileName is required and must be a non-empty string');
  }

  if (!data.contentType || typeof data.contentType !== 'string' || data.contentType.trim().length === 0) {
    errors.push('contentType is required and must be a non-empty string');
  }

  // Validate content type based on media type
  if (data.mediaType === 'audio' && !data.contentType.startsWith('audio/')) {
    errors.push('contentType must be an audio MIME type for audio media');
  }

  if (data.mediaType === 'image' && !data.contentType.startsWith('image/')) {
    errors.push('contentType must be an image MIME type for image media');
  }

  if (data.mediaType === 'calligraphy' && !data.contentType.startsWith('image/')) {
    errors.push('contentType must be an image MIME type for calligraphy media');
  }

  if (errors.length > 0) {
    throw new ContentValidationError(`Validation failed: ${errors.join('; ')}`);
  }

  return {
    wordId: data.wordId,
    mediaType: data.mediaType,
    fileName: sanitizeFileName(data.fileName),
    contentType: data.contentType
  };
}

function validateContextualExample(example: any): string[] {
  const errors: string[] = [];

  if (!example.verseId || typeof example.verseId !== 'string') {
    errors.push('verseId is required and must be a string');
  }

  if (typeof example.surahNumber !== 'number' || example.surahNumber < 1 || example.surahNumber > 114) {
    errors.push('surahNumber must be a number between 1 and 114');
  }

  if (typeof example.ayahNumber !== 'number' || example.ayahNumber < 1) {
    errors.push('ayahNumber must be a positive number');
  }

  if (!example.arabicText || typeof example.arabicText !== 'string') {
    errors.push('arabicText is required and must be a string');
  }

  if (!example.translation || typeof example.translation !== 'string') {
    errors.push('translation is required and must be a string');
  }

  if (!example.transliteration || typeof example.transliteration !== 'string') {
    errors.push('transliteration is required and must be a string');
  }

  if (typeof example.wordPosition !== 'number' || example.wordPosition < 0) {
    errors.push('wordPosition must be a non-negative number');
  }

  return errors;
}

function isValidWordType(wordType: any): wordType is WordType {
  return ['noun', 'verb', 'particle', 'adjective', 'pronoun', 'preposition'].includes(wordType);
}

function isValidDifficultyLevel(difficulty: any): difficulty is DifficultyLevel {
  return ['beginner', 'intermediate', 'advanced'].includes(difficulty);
}

function sanitizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

function sanitizeArabicText(text: string): string {
  // Remove extra whitespace and normalize Arabic text
  return text.trim().replace(/\s+/g, ' ').normalize('NFC');
}

function sanitizeFileName(fileName: string): string {
  // Remove potentially dangerous characters from file names
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
}