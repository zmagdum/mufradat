/**
 * Content Sanitization Utilities
 * Sanitizes and validates content for security
 */

/**
 * Sanitize Arabic text to remove potentially harmful characters
 * while preserving valid Arabic characters, diacritics, and punctuation
 */
export const sanitizeArabicText = (text: string): string => {
  // Allow Arabic letters (U+0600-U+06FF), Arabic Supplement (U+0750-U+077F),
  // Arabic diacritics, spaces, and common punctuation
  return text.replace(/[^\u0600-\u06FF\u0750-\u077F\s\.,،؛؟!]/g, '').trim();
};

/**
 * Sanitize transliteration text
 * Allows only Latin letters, spaces, hyphens, and apostrophes
 */
export const sanitizeTransliteration = (text: string): string => {
  return text.replace(/[^a-zA-Z\s\-']/g, '').trim();
};

/**
 * Sanitize translation text
 * Removes potentially harmful HTML/script tags and special characters
 */
export const sanitizeTranslation = (text: string): string => {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '') // Remove remaining angle brackets
    .trim();
};

/**
 * Sanitize root letters (should be 3-4 Arabic characters)
 */
export const sanitizeRootLetters = (text: string): string => {
  const sanitized = text.replace(/[^\u0600-\u06FF]/g, '');
  // Root letters should be 3-4 characters
  return sanitized.substring(0, 4);
};

/**
 * Validate and sanitize verse reference
 * Format: SurahNumber:VerseNumber (e.g., "2:255")
 */
export const sanitizeVerseReference = (ref: string): string | null => {
  const match = ref.match(/^(\d{1,3}):(\d{1,3})$/);
  if (!match) {
    return null;
  }
  
  const surah = parseInt(match[1], 10);
  const verse = parseInt(match[2], 10);
  
  // Validate surah number (1-114)
  if (surah < 1 || surah > 114) {
    return null;
  }
  
  // Basic validation (actual verse count varies by surah)
  if (verse < 1 || verse > 286) { // Al-Baqarah has 286 verses (longest)
    return null;
  }
  
  return `${surah}:${verse}`;
};

/**
 * Validate URL format
 */
export const isValidUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Sanitize S3 URL to ensure it's from the correct bucket
 */
export const sanitizeS3Url = (url: string, bucketName: string): string | null => {
  if (!isValidUrl(url)) {
    return null;
  }
  
  // Check if URL contains the bucket name
  if (!url.includes(bucketName)) {
    return null;
  }
  
  return url;
};

/**
 * Validate and sanitize frequency (0-10000 range)
 */
export const sanitizeFrequency = (frequency: number): number => {
  const freq = parseInt(String(frequency), 10);
  if (isNaN(freq) || freq < 0) {
    return 0;
  }
  return Math.min(freq, 10000); // Cap at 10000
};

/**
 * Sanitize array of strings
 */
export const sanitizeStringArray = (arr: string[], maxLength: number = 100): string[] => {
  if (!Array.isArray(arr)) {
    return [];
  }
  
  return arr
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, maxLength);
};

/**
 * Validate difficulty level
 */
export const isValidDifficulty = (difficulty: string): boolean => {
  return ['beginner', 'intermediate', 'advanced'].includes(difficulty);
};

/**
 * Validate word type
 */
export const isValidWordType = (wordType: string): boolean => {
  return ['noun', 'verb', 'particle', 'adjective'].includes(wordType);
};

