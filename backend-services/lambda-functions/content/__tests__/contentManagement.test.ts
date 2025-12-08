import { ContentDatabaseService } from '../../../utils/contentDatabase';
import { S3MediaService } from '../../../utils/s3Service';
import { 
  validateCreateWordRequest, 
  validateUpdateWordRequest, 
  validateMediaUploadRequest,
  ContentValidationError 
} from '../../../utils/contentValidation';
import { VocabularyWord, CreateWordRequest, UpdateWordRequest, MediaUploadRequest } from '../../../types/content';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123')
}));

describe('Content Management', () => {
  let contentDb: ContentDatabaseService;
  let s3Service: S3MediaService;

  beforeEach(() => {
    contentDb = new ContentDatabaseService();
    s3Service = new S3MediaService();
    jest.clearAllMocks();
  });

  describe('Content Validation', () => {
    describe('validateCreateWordRequest', () => {
      it('should validate a valid create word request', () => {
        const validRequest = {
          arabicText: 'الله',
          transliteration: 'Allah',
          translation: 'God',
          rootLetters: 'ا ل ه',
          wordType: 'noun',
          frequency: 2697,
          difficulty: 'beginner',
          contextualExamples: [],
          relatedWords: []
        };

        const result = validateCreateWordRequest(validRequest);
        expect(result).toEqual(validRequest);
      });

      it('should throw error for missing required fields', () => {
        const invalidRequest = {
          arabicText: '',
          transliteration: 'Allah',
          translation: 'God'
        };

        expect(() => validateCreateWordRequest(invalidRequest))
          .toThrow(ContentValidationError);
      });

      it('should throw error for invalid word type', () => {
        const invalidRequest = {
          arabicText: 'الله',
          transliteration: 'Allah',
          translation: 'God',
          rootLetters: 'ا ل ه',
          wordType: 'invalid',
          frequency: 2697,
          difficulty: 'beginner'
        };

        expect(() => validateCreateWordRequest(invalidRequest))
          .toThrow('wordType must be one of');
      });

      it('should throw error for invalid difficulty level', () => {
        const invalidRequest = {
          arabicText: 'الله',
          transliteration: 'Allah',
          translation: 'God',
          rootLetters: 'ا ل ه',
          wordType: 'noun',
          frequency: 2697,
          difficulty: 'invalid'
        };

        expect(() => validateCreateWordRequest(invalidRequest))
          .toThrow('difficulty must be one of');
      });

      it('should throw error for negative frequency', () => {
        const invalidRequest = {
          arabicText: 'الله',
          transliteration: 'Allah',
          translation: 'God',
          rootLetters: 'ا ل ه',
          wordType: 'noun',
          frequency: -1,
          difficulty: 'beginner'
        };

        expect(() => validateCreateWordRequest(invalidRequest))
          .toThrow('frequency must be a non-negative number');
      });
    });

    describe('validateUpdateWordRequest', () => {
      it('should validate a valid update word request', () => {
        const validRequest = {
          wordId: 'test-word-id',
          translation: 'Updated translation',
          difficulty: 'intermediate'
        };

        const result = validateUpdateWordRequest(validRequest);
        expect(result).toEqual(validRequest);
      });

      it('should throw error for missing wordId', () => {
        const invalidRequest = {
          translation: 'Updated translation'
        };

        expect(() => validateUpdateWordRequest(invalidRequest))
          .toThrow('wordId is required');
      });
    });

    describe('validateMediaUploadRequest', () => {
      it('should validate a valid media upload request', () => {
        const validRequest = {
          wordId: 'test-word-id',
          mediaType: 'audio',
          fileName: 'pronunciation.mp3',
          contentType: 'audio/mpeg'
        };

        const result = validateMediaUploadRequest(validRequest);
        expect(result.fileName).toBe('pronunciation.mp3');
      });

      it('should throw error for invalid media type', () => {
        const invalidRequest = {
          wordId: 'test-word-id',
          mediaType: 'invalid',
          fileName: 'file.txt',
          contentType: 'text/plain'
        };

        expect(() => validateMediaUploadRequest(invalidRequest))
          .toThrow('mediaType must be one of');
      });

      it('should throw error for mismatched content type', () => {
        const invalidRequest = {
          wordId: 'test-word-id',
          mediaType: 'audio',
          fileName: 'file.mp3',
          contentType: 'image/jpeg'
        };

        expect(() => validateMediaUploadRequest(invalidRequest))
          .toThrow('contentType must be an audio MIME type');
      });
    });
  });

  describe('S3MediaService', () => {
    describe('validateMediaConstraints', () => {
      it('should validate audio constraints', () => {
        expect(() => s3Service.validateMediaConstraints('audio', 'audio/mpeg'))
          .not.toThrow();
      });

      it('should validate image constraints', () => {
        expect(() => s3Service.validateMediaConstraints('image', 'image/jpeg'))
          .not.toThrow();
      });

      it('should validate calligraphy constraints', () => {
        expect(() => s3Service.validateMediaConstraints('calligraphy', 'image/svg+xml'))
          .not.toThrow();
      });

      it('should throw error for unsupported media type', () => {
        expect(() => s3Service.validateMediaConstraints('video', 'video/mp4'))
          .toThrow('Unsupported media type');
      });

      it('should throw error for invalid content type', () => {
        expect(() => s3Service.validateMediaConstraints('audio', 'image/jpeg'))
          .toThrow('Content type image/jpeg not allowed for audio');
      });

      it('should throw error for file size too large', () => {
        const largeFileSize = 20 * 1024 * 1024; // 20MB
        expect(() => s3Service.validateMediaConstraints('audio', 'audio/mpeg', largeFileSize))
          .toThrow('File size');
      });
    });

    describe('parseMediaUrl', () => {
      it('should parse valid media URL', () => {
        const url = 'https://example.com/words/word-123/audio/1234567890_pronunciation.mp3';
        const result = s3Service.parseMediaUrl(url);
        
        expect(result).toEqual({
          wordId: 'word-123',
          mediaType: 'audio',
          fileName: '1234567890_pronunciation.mp3'
        });
      });

      it('should return null for invalid URL', () => {
        const url = 'https://example.com/invalid/path';
        const result = s3Service.parseMediaUrl(url);
        
        expect(result).toBeNull();
      });
    });

    describe('generateMediaKey', () => {
      it('should generate proper media key', () => {
        const key = (s3Service as any).generateMediaKey('word-123', 'audio', 'test file.mp3');
        
        expect(key).toMatch(/^words\/word-123\/audio\/\d+_test_file\.mp3$/);
      });
    });
  });

  describe('Text Sanitization', () => {
    it('should sanitize Arabic text properly', () => {
      const request = {
        arabicText: '  الله  ',
        transliteration: '  Allah  ',
        translation: '  God  ',
        rootLetters: '  ا ل ه  ',
        wordType: 'noun',
        frequency: 2697,
        difficulty: 'beginner'
      };

      const result = validateCreateWordRequest(request);
      
      expect(result.arabicText).toBe('الله');
      expect(result.transliteration).toBe('Allah');
      expect(result.translation).toBe('God');
      expect(result.rootLetters).toBe('ا ل ه');
    });

    it('should normalize Arabic text', () => {
      const request = {
        arabicText: 'الله', // Text with potential normalization issues
        transliteration: 'Allah',
        translation: 'God',
        rootLetters: 'ا ل ه',
        wordType: 'noun',
        frequency: 2697,
        difficulty: 'beginner'
      };

      const result = validateCreateWordRequest(request);
      
      expect(result.arabicText).toBe('الله');
    });
  });

  describe('Contextual Examples Validation', () => {
    it('should validate contextual examples', () => {
      const request = {
        arabicText: 'الله',
        transliteration: 'Allah',
        translation: 'God',
        rootLetters: 'ا ل ه',
        wordType: 'noun',
        frequency: 2697,
        difficulty: 'beginner',
        contextualExamples: [
          {
            verseId: '1:1',
            surahNumber: 1,
            ayahNumber: 1,
            arabicText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
            translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
            transliteration: 'Bismillahi ar-rahmani ar-raheem',
            wordPosition: 1
          }
        ]
      };

      const result = validateCreateWordRequest(request);
      expect(result.contextualExamples).toHaveLength(1);
      expect(result.contextualExamples![0].verseId).toBe('1:1');
    });

    it('should throw error for invalid contextual example', () => {
      const request = {
        arabicText: 'الله',
        transliteration: 'Allah',
        translation: 'God',
        rootLetters: 'ا ل ه',
        wordType: 'noun',
        frequency: 2697,
        difficulty: 'beginner',
        contextualExamples: [
          {
            verseId: '1:1',
            surahNumber: 115, // Invalid surah number
            ayahNumber: 1,
            arabicText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
            translation: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.',
            transliteration: 'Bismillahi ar-rahmani ar-raheem',
            wordPosition: 1
          }
        ]
      };

      expect(() => validateCreateWordRequest(request))
        .toThrow('surahNumber must be a number between 1 and 114');
    });
  });
});