/**
 * Sanitization Utilities Unit Tests
 */

import {
  sanitizeArabicText,
  sanitizeTransliteration,
  sanitizeTranslation,
  sanitizeRootLetters,
  sanitizeVerseReference,
  isValidUrl,
  sanitizeS3Url,
  sanitizeFrequency,
  sanitizeStringArray,
  isValidDifficulty,
  isValidWordType,
} from '../sanitization-utils';

describe('Sanitization Utilities', () => {
  describe('sanitizeArabicText', () => {
    it('should preserve valid Arabic text', () => {
      const input = 'السلام عليكم';
      const result = sanitizeArabicText(input);
      expect(result).toBe('السلام عليكم');
    });

    it('should remove non-Arabic characters', () => {
      const input = 'السلام<script>alert("xss")</script>';
      const result = sanitizeArabicText(input);
      expect(result).not.toContain('<script>');
    });

    it('should trim whitespace', () => {
      const input = '  السلام  ';
      const result = sanitizeArabicText(input);
      expect(result).toBe('السلام');
    });
  });

  describe('sanitizeTransliteration', () => {
    it('should preserve valid transliteration', () => {
      const input = "as-salamu 'alaykum";
      const result = sanitizeTransliteration(input);
      expect(result).toBe("as-salamu 'alaykum");
    });

    it('should remove numbers and special characters', () => {
      const input = 'salaam123!@#';
      const result = sanitizeTransliteration(input);
      expect(result).toBe('salaam');
    });
  });

  describe('sanitizeTranslation', () => {
    it('should remove HTML tags', () => {
      const input = 'Peace be upon you <script>alert("xss")</script>';
      const result = sanitizeTranslation(input);
      expect(result).not.toContain('<script>');
    });

    it('should preserve normal text', () => {
      const input = 'Peace be upon you';
      const result = sanitizeTranslation(input);
      expect(result).toBe('Peace be upon you');
    });
  });

  describe('sanitizeRootLetters', () => {
    it('should preserve 3-letter root', () => {
      const input = 'سلم';
      const result = sanitizeRootLetters(input);
      expect(result).toBe('سلم');
    });

    it('should truncate to 4 characters max', () => {
      const input = 'سلمهو';
      const result = sanitizeRootLetters(input);
      expect(result).toHaveLength(4);
    });

    it('should remove non-Arabic characters', () => {
      const input = 'س ل م';
      const result = sanitizeRootLetters(input);
      expect(result).toBe('سلم');
    });
  });

  describe('sanitizeVerseReference', () => {
    it('should validate correct verse reference', () => {
      const input = '2:255';
      const result = sanitizeVerseReference(input);
      expect(result).toBe('2:255');
    });

    it('should reject invalid surah number', () => {
      const input = '115:1';
      const result = sanitizeVerseReference(input);
      expect(result).toBeNull();
    });

    it('should reject invalid format', () => {
      const input = '2-255';
      const result = sanitizeVerseReference(input);
      expect(result).toBeNull();
    });
  });

  describe('isValidUrl', () => {
    it('should validate HTTP URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });

  describe('sanitizeS3Url', () => {
    it('should validate S3 URL with bucket name', () => {
      const url = 'https://s3.amazonaws.com/my-bucket/file.mp3';
      const result = sanitizeS3Url(url, 'my-bucket');
      expect(result).toBe(url);
    });

    it('should reject URL without bucket name', () => {
      const url = 'https://s3.amazonaws.com/other-bucket/file.mp3';
      const result = sanitizeS3Url(url, 'my-bucket');
      expect(result).toBeNull();
    });

    it('should reject invalid URLs', () => {
      const result = sanitizeS3Url('not-a-url', 'my-bucket');
      expect(result).toBeNull();
    });
  });

  describe('sanitizeFrequency', () => {
    it('should preserve valid frequency', () => {
      expect(sanitizeFrequency(100)).toBe(100);
    });

    it('should cap at 10000', () => {
      expect(sanitizeFrequency(15000)).toBe(10000);
    });

    it('should return 0 for negative numbers', () => {
      expect(sanitizeFrequency(-5)).toBe(0);
    });

    it('should handle NaN', () => {
      expect(sanitizeFrequency(NaN)).toBe(0);
    });
  });

  describe('sanitizeStringArray', () => {
    it('should preserve valid strings', () => {
      const input = ['word1', 'word2', 'word3'];
      const result = sanitizeStringArray(input);
      expect(result).toEqual(['word1', 'word2', 'word3']);
    });

    it('should remove empty strings', () => {
      const input = ['word1', '', 'word2'];
      const result = sanitizeStringArray(input);
      expect(result).toEqual(['word1', 'word2']);
    });

    it('should trim strings', () => {
      const input = ['  word1  ', 'word2'];
      const result = sanitizeStringArray(input);
      expect(result).toEqual(['word1', 'word2']);
    });

    it('should enforce max length', () => {
      const input = Array(150).fill('word');
      const result = sanitizeStringArray(input, 100);
      expect(result).toHaveLength(100);
    });

    it('should handle non-arrays', () => {
      const result = sanitizeStringArray('not-an-array' as any);
      expect(result).toEqual([]);
    });
  });

  describe('isValidDifficulty', () => {
    it('should validate correct difficulty levels', () => {
      expect(isValidDifficulty('beginner')).toBe(true);
      expect(isValidDifficulty('intermediate')).toBe(true);
      expect(isValidDifficulty('advanced')).toBe(true);
    });

    it('should reject invalid difficulty', () => {
      expect(isValidDifficulty('expert')).toBe(false);
      expect(isValidDifficulty('')).toBe(false);
    });
  });

  describe('isValidWordType', () => {
    it('should validate correct word types', () => {
      expect(isValidWordType('noun')).toBe(true);
      expect(isValidWordType('verb')).toBe(true);
      expect(isValidWordType('particle')).toBe(true);
      expect(isValidWordType('adjective')).toBe(true);
    });

    it('should reject invalid word type', () => {
      expect(isValidWordType('adverb')).toBe(false);
      expect(isValidWordType('')).toBe(false);
    });
  });
});

