/**
 * Unit tests for data transformation functions
 */

import {
  DateSerializer,
  UserProfileTransformer,
  VocabularyWordTransformer,
  WordProgressTransformer,
  VerbConjugationTransformer,
  BatchTransformer,
  JsonSerializer,
} from '../types/transformers';
import {
  UserProfile,
  VocabularyWord,
  WordProgress,
  VerbConjugation,
} from '../types';

describe('DateSerializer', () => {
  it('should serialize Date to ISO string', () => {
    const date = new Date('2024-01-01T12:00:00Z');
    const serialized = DateSerializer.serialize(date);
    expect(serialized).toBe('2024-01-01T12:00:00.000Z');
  });

  it('should deserialize ISO string to Date', () => {
    const dateString = '2024-01-01T12:00:00.000Z';
    const date = DateSerializer.deserialize(dateString);
    expect(date).toBeInstanceOf(Date);
    expect(date.toISOString()).toBe(dateString);
  });

  it('should validate date strings', () => {
    expect(DateSerializer.isValidDateString('2024-01-01T12:00:00.000Z')).toBe(
      true
    );
    expect(DateSerializer.isValidDateString('invalid')).toBe(false);
  });
});

describe('UserProfileTransformer', () => {
  const mockProfile: UserProfile = {
    userId: 'user123',
    email: 'test@example.com',
    displayName: 'Test User',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    lastActiveAt: new Date('2024-01-02T00:00:00Z'),
    preferences: {
      learningModalities: ['visual', 'audio'],
      notificationFrequency: 'medium',
      studyGoal: 10,
      preferredStudyTime: '19:00',
    },
    statistics: {
      totalWordsLearned: 50,
      currentStreak: 5,
      longestStreak: 10,
      totalStudyTime: 3600,
    },
  };

  describe('toDatabase', () => {
    it('should transform UserProfile to database format', () => {
      const dbFormat = UserProfileTransformer.toDatabase(mockProfile);
      
      expect(dbFormat.userId).toBe(mockProfile.userId);
      expect(dbFormat.email).toBe(mockProfile.email);
      expect(dbFormat.displayName).toBe(mockProfile.displayName);
      expect(dbFormat.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(dbFormat.lastActiveAt).toBe('2024-01-02T00:00:00.000Z');
      expect(typeof dbFormat.preferences).toBe('string');
      expect(typeof dbFormat.statistics).toBe('string');
    });
  });

  describe('fromDatabase', () => {
    it('should transform database format to UserProfile', () => {
      const dbFormat = UserProfileTransformer.toDatabase(mockProfile);
      const profile = UserProfileTransformer.fromDatabase(dbFormat);
      
      expect(profile.userId).toBe(mockProfile.userId);
      expect(profile.email).toBe(mockProfile.email);
      expect(profile.createdAt).toBeInstanceOf(Date);
      expect(profile.createdAt.toISOString()).toBe('2024-01-01T00:00:00.000Z');
      expect(profile.preferences).toEqual(mockProfile.preferences);
      expect(profile.statistics).toEqual(mockProfile.statistics);
    });
  });

  describe('toApiResponse', () => {
    it('should transform UserProfile to API response format', () => {
      const apiResponse = UserProfileTransformer.toApiResponse(mockProfile);
      
      expect(apiResponse.userId).toBe(mockProfile.userId);
      expect(apiResponse.createdAt).toBe('2024-01-01T00:00:00.000Z');
      expect(apiResponse.preferences).toEqual(mockProfile.preferences);
    });
  });

  describe('createDefault', () => {
    it('should create default UserProfile', () => {
      const profile = UserProfileTransformer.createDefault(
        'user123',
        'test@example.com',
        'Test User'
      );
      
      expect(profile.userId).toBe('user123');
      expect(profile.email).toBe('test@example.com');
      expect(profile.displayName).toBe('Test User');
      expect(profile.statistics.totalWordsLearned).toBe(0);
      expect(profile.statistics.currentStreak).toBe(0);
      expect(profile.preferences.studyGoal).toBe(10);
    });
  });
});

describe('VocabularyWordTransformer', () => {
  const mockWord: VocabularyWord = {
    wordId: 'word123',
    arabicText: 'السلام',
    transliteration: 'as-salaam',
    translation: 'peace',
    rootLetters: 'سلم',
    wordType: 'noun',
    frequency: 100,
    difficulty: 'beginner',
    mediaContent: {
      audioUrl: 'https://example.com/audio.mp3',
      imageUrls: ['https://example.com/image.jpg'],
      calligraphyUrl: 'https://example.com/calligraphy.svg',
    },
    contextualExamples: [
      {
        verseReference: '1:1',
        arabicVerse: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
        translation: 'In the name of Allah',
        transliteration: 'Bismillah',
        highlightIndices: [0, 1],
      },
    ],
    relatedWords: ['word456', 'word789'],
  };

  describe('toDatabase', () => {
    it('should transform VocabularyWord to database format', () => {
      const dbFormat = VocabularyWordTransformer.toDatabase(mockWord);
      
      expect(dbFormat.wordId).toBe(mockWord.wordId);
      expect(dbFormat.arabicText).toBe(mockWord.arabicText);
      expect(typeof dbFormat.mediaContent).toBe('string');
      expect(typeof dbFormat.contextualExamples).toBe('string');
      expect(typeof dbFormat.relatedWords).toBe('string');
    });
  });

  describe('fromDatabase', () => {
    it('should transform database format to VocabularyWord', () => {
      const dbFormat = VocabularyWordTransformer.toDatabase(mockWord);
      const word = VocabularyWordTransformer.fromDatabase(dbFormat);
      
      expect(word.wordId).toBe(mockWord.wordId);
      expect(word.arabicText).toBe(mockWord.arabicText);
      expect(word.mediaContent).toEqual(mockWord.mediaContent);
      expect(word.contextualExamples).toEqual(mockWord.contextualExamples);
      expect(word.relatedWords).toEqual(mockWord.relatedWords);
    });
  });

  describe('toListItem', () => {
    it('should create lightweight list item', () => {
      const listItem = VocabularyWordTransformer.toListItem(mockWord);
      
      expect(listItem.wordId).toBe(mockWord.wordId);
      expect(listItem.arabicText).toBe(mockWord.arabicText);
      expect(listItem.contextualExamples).toBeUndefined();
      expect(listItem.mediaContent).toBeUndefined();
    });
  });
});

describe('WordProgressTransformer', () => {
  const mockProgress: WordProgress = {
    userId: 'user123',
    wordId: 'word123',
    masteryLevel: 50,
    reviewCount: 10,
    correctAnswers: 8,
    lastReviewed: new Date('2024-01-01T12:00:00Z'),
    nextReviewDate: new Date('2024-01-02T12:00:00Z'),
    learningModality: ['visual', 'audio'],
    difficultyAdjustments: 0,
    averageResponseTime: 5000,
  };

  describe('toDatabase', () => {
    it('should transform WordProgress to database format', () => {
      const dbFormat = WordProgressTransformer.toDatabase(mockProgress);
      
      expect(dbFormat.userId).toBe(mockProgress.userId);
      expect(dbFormat.wordId).toBe(mockProgress.wordId);
      expect(dbFormat.masteryLevel).toBe(mockProgress.masteryLevel);
      expect(dbFormat.lastReviewed).toBe('2024-01-01T12:00:00.000Z');
      expect(typeof dbFormat.learningModality).toBe('string');
    });
  });

  describe('fromDatabase', () => {
    it('should transform database format to WordProgress', () => {
      const dbFormat = WordProgressTransformer.toDatabase(mockProgress);
      const progress = WordProgressTransformer.fromDatabase(dbFormat);
      
      expect(progress.userId).toBe(mockProgress.userId);
      expect(progress.lastReviewed).toBeInstanceOf(Date);
      expect(progress.learningModality).toEqual(mockProgress.learningModality);
    });
  });

  describe('toApiResponse', () => {
    it('should include calculated accuracy', () => {
      const apiResponse = WordProgressTransformer.toApiResponse(mockProgress);
      
      expect(apiResponse.accuracy).toBe(80); // 8/10 * 100
    });
  });

  describe('createInitial', () => {
    it('should create initial WordProgress', () => {
      const progress = WordProgressTransformer.createInitial(
        'user123',
        'word123'
      );
      
      expect(progress.userId).toBe('user123');
      expect(progress.wordId).toBe('word123');
      expect(progress.masteryLevel).toBe(0);
      expect(progress.reviewCount).toBe(0);
      expect(progress.correctAnswers).toBe(0);
    });
  });

  describe('calculateAccuracy', () => {
    it('should calculate accuracy correctly', () => {
      expect(WordProgressTransformer.calculateAccuracy(mockProgress)).toBe(80);
    });

    it('should return 0 for no reviews', () => {
      const noReviews = { ...mockProgress, reviewCount: 0 };
      expect(WordProgressTransformer.calculateAccuracy(noReviews)).toBe(0);
    });
  });
});

describe('VerbConjugationTransformer', () => {
  const mockConjugation: VerbConjugation = {
    verbId: 'verb123',
    rootForm: 'كتب',
    conjugations: {
      past: {
        first: {
          singular: {
            masculine: 'كتبت',
            feminine: 'كتبت',
          },
        },
      },
      present: {
        first: {
          singular: {
            masculine: 'أكتب',
            feminine: 'أكتب',
          },
        },
      },
    },
    patterns: ['فعل'],
    irregularities: [],
  };

  describe('toDatabase', () => {
    it('should transform VerbConjugation to database format', () => {
      const dbFormat = VerbConjugationTransformer.toDatabase(mockConjugation);
      
      expect(dbFormat.verbId).toBe(mockConjugation.verbId);
      expect(dbFormat.rootForm).toBe(mockConjugation.rootForm);
      expect(typeof dbFormat.conjugations).toBe('string');
      expect(typeof dbFormat.patterns).toBe('string');
    });
  });

  describe('fromDatabase', () => {
    it('should transform database format to VerbConjugation', () => {
      const dbFormat = VerbConjugationTransformer.toDatabase(mockConjugation);
      const conjugation = VerbConjugationTransformer.fromDatabase(dbFormat);
      
      expect(conjugation.verbId).toBe(mockConjugation.verbId);
      expect(conjugation.conjugations).toEqual(mockConjugation.conjugations);
    });
  });

  describe('getConjugationForm', () => {
    it('should get specific conjugation form', () => {
      const form = VerbConjugationTransformer.getConjugationForm(
        mockConjugation,
        'past',
        'first',
        'singular',
        'masculine'
      );
      
      expect(form).toBe('كتبت');
    });

    it('should return undefined for non-existent form', () => {
      const form = VerbConjugationTransformer.getConjugationForm(
        mockConjugation,
        'future',
        'first',
        'singular',
        'masculine'
      );
      
      expect(form).toBeUndefined();
    });
  });
});

describe('BatchTransformer', () => {
  it('should transform array of UserProfiles to API', () => {
    const profiles: UserProfile[] = [
      UserProfileTransformer.createDefault('user1', 'user1@example.com', 'User 1'),
      UserProfileTransformer.createDefault('user2', 'user2@example.com', 'User 2'),
    ];
    
    const apiResponse = BatchTransformer.userProfilesToApi(profiles);
    
    expect(apiResponse).toHaveLength(2);
    expect(apiResponse[0].userId).toBe('user1');
    expect(apiResponse[1].userId).toBe('user2');
  });

  it('should transform array of VocabularyWords to list items', () => {
    const words: VocabularyWord[] = [
      {
        wordId: 'word1',
        arabicText: 'test1',
        transliteration: 'test1',
        translation: 'test1',
        rootLetters: 'test',
        wordType: 'noun',
        frequency: 1,
        difficulty: 'beginner',
        mediaContent: { audioUrl: '', imageUrls: [], calligraphyUrl: '' },
        contextualExamples: [],
        relatedWords: [],
      },
    ];
    
    const listItems = BatchTransformer.vocabularyWordsToListItems(words);
    
    expect(listItems).toHaveLength(1);
    expect(listItems[0].wordId).toBe('word1');
    expect(listItems[0].contextualExamples).toBeUndefined();
  });
});

describe('JsonSerializer', () => {
  it('should serialize objects with Dates', () => {
    const obj = {
      name: 'test',
      date: new Date('2024-01-01T00:00:00Z'),
      nested: {
        anotherDate: new Date('2024-01-02T00:00:00Z'),
      },
    };
    
    const serialized = JsonSerializer.stringify(obj);
    expect(serialized).toContain('__type');
    expect(serialized).toContain('Date');
  });

  it('should deserialize objects with Dates', () => {
    const obj = {
      name: 'test',
      date: new Date('2024-01-01T00:00:00Z'),
    };
    
    const serialized = JsonSerializer.stringify(obj);
    const deserialized = JsonSerializer.parse(serialized);
    
    expect(deserialized.name).toBe('test');
    expect(deserialized.date).toBeInstanceOf(Date);
    expect(deserialized.date.toISOString()).toBe('2024-01-01T00:00:00.000Z');
  });

  it('should handle objects without Dates', () => {
    const obj = { name: 'test', value: 123 };
    
    const serialized = JsonSerializer.stringify(obj);
    const deserialized = JsonSerializer.parse(serialized);
    
    expect(deserialized).toEqual(obj);
  });
});

