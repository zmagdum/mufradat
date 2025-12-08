"use strict";
/**
 * Unit tests for data validation functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
const validators_1 = require("../types/validators");
describe('Validation Utility Functions', () => {
    describe('isValidEmail', () => {
        it('should validate correct email addresses', () => {
            expect((0, validators_1.isValidEmail)('test@example.com')).toBe(true);
            expect((0, validators_1.isValidEmail)('user.name@domain.co.uk')).toBe(true);
            expect((0, validators_1.isValidEmail)('user+tag@example.com')).toBe(true);
        });
        it('should reject invalid email addresses', () => {
            expect((0, validators_1.isValidEmail)('invalid')).toBe(false);
            expect((0, validators_1.isValidEmail)('invalid@')).toBe(false);
            expect((0, validators_1.isValidEmail)('@example.com')).toBe(false);
            expect((0, validators_1.isValidEmail)('invalid@.com')).toBe(false);
        });
    });
    describe('isValidLength', () => {
        it('should validate string length within range', () => {
            expect((0, validators_1.isValidLength)('test', 1, 10)).toBe(true);
            expect((0, validators_1.isValidLength)('a', 1, 1)).toBe(true);
            expect((0, validators_1.isValidLength)('12345', 5, 5)).toBe(true);
        });
        it('should reject strings outside range', () => {
            expect((0, validators_1.isValidLength)('', 1, 10)).toBe(false);
            expect((0, validators_1.isValidLength)('test', 5, 10)).toBe(false);
            expect((0, validators_1.isValidLength)('toolongstring', 1, 5)).toBe(false);
        });
    });
    describe('isInRange', () => {
        it('should validate numbers within range', () => {
            expect((0, validators_1.isInRange)(5, 1, 10)).toBe(true);
            expect((0, validators_1.isInRange)(0, 0, 100)).toBe(true);
            expect((0, validators_1.isInRange)(100, 0, 100)).toBe(true);
        });
        it('should reject numbers outside range', () => {
            expect((0, validators_1.isInRange)(-1, 0, 100)).toBe(false);
            expect((0, validators_1.isInRange)(101, 0, 100)).toBe(false);
            expect((0, validators_1.isInRange)(5, 10, 20)).toBe(false);
        });
    });
    describe('isValidDate', () => {
        it('should validate valid Date objects', () => {
            expect((0, validators_1.isValidDate)(new Date())).toBe(true);
            expect((0, validators_1.isValidDate)(new Date('2024-01-01'))).toBe(true);
        });
        it('should reject invalid dates', () => {
            expect((0, validators_1.isValidDate)(new Date('invalid'))).toBe(false);
        });
    });
    describe('isValidUrl', () => {
        it('should validate correct URLs', () => {
            expect((0, validators_1.isValidUrl)('https://example.com')).toBe(true);
            expect((0, validators_1.isValidUrl)('http://example.com/path')).toBe(true);
            expect((0, validators_1.isValidUrl)('https://example.com:8080/path?query=1')).toBe(true);
        });
        it('should reject invalid URLs', () => {
            expect((0, validators_1.isValidUrl)('not-a-url')).toBe(false);
            expect((0, validators_1.isValidUrl)('ftp://')).toBe(false);
        });
    });
});
describe('UserPreferences Validation', () => {
    it('should validate correct preferences', () => {
        const preferences = {
            learningModalities: ['visual', 'audio'],
            notificationFrequency: 'medium',
            studyGoal: 10,
            preferredStudyTime: '19:00',
        };
        const result = (0, validators_1.validateUserPreferences)(preferences);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
    it('should reject invalid learning modalities', () => {
        const preferences = {
            learningModalities: ['invalid', 'audio'],
        };
        const result = (0, validators_1.validateUserPreferences)(preferences);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].field).toBe('learningModalities');
    });
    it('should reject invalid notification frequency', () => {
        const preferences = {
            notificationFrequency: 'invalid',
        };
        const result = (0, validators_1.validateUserPreferences)(preferences);
        expect(result.valid).toBe(false);
        expect(result.errors[0].field).toBe('notificationFrequency');
    });
    it('should reject study goal out of range', () => {
        const preferences = {
            studyGoal: 200,
        };
        const result = (0, validators_1.validateUserPreferences)(preferences);
        expect(result.valid).toBe(false);
        expect(result.errors[0].field).toBe('studyGoal');
    });
});
describe('UserProfile Validation', () => {
    const validProfile = {
        userId: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        createdAt: new Date(),
        lastActiveAt: new Date(),
        preferences: {
            learningModalities: ['visual'],
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
    it('should validate correct user profile', () => {
        const result = (0, validators_1.validateUserProfile)(validProfile);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
    it('should reject missing userId', () => {
        const profile = { ...validProfile, userId: '' };
        const result = (0, validators_1.validateUserProfile)(profile);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'userId')).toBe(true);
    });
    it('should reject invalid email', () => {
        const profile = { ...validProfile, email: 'invalid-email' };
        const result = (0, validators_1.validateUserProfile)(profile);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'email')).toBe(true);
    });
    it('should reject negative statistics', () => {
        const profile = {
            ...validProfile,
            statistics: {
                ...validProfile.statistics,
                totalWordsLearned: -5,
            },
        };
        const result = (0, validators_1.validateUserProfile)(profile);
        expect(result.valid).toBe(false);
    });
});
describe('VocabularyWord Validation', () => {
    const validWord = {
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
        contextualExamples: [],
        relatedWords: [],
    };
    it('should validate correct vocabulary word', () => {
        const result = (0, validators_1.validateVocabularyWord)(validWord);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
    it('should reject missing wordId', () => {
        const word = { ...validWord, wordId: '' };
        const result = (0, validators_1.validateVocabularyWord)(word);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'wordId')).toBe(true);
    });
    it('should reject invalid word type', () => {
        const word = { ...validWord, wordType: 'invalid' };
        const result = (0, validators_1.validateVocabularyWord)(word);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'wordType')).toBe(true);
    });
    it('should reject invalid difficulty', () => {
        const word = { ...validWord, difficulty: 'invalid' };
        const result = (0, validators_1.validateVocabularyWord)(word);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'difficulty')).toBe(true);
    });
    it('should reject invalid audio URL', () => {
        const word = {
            ...validWord,
            mediaContent: {
                ...validWord.mediaContent,
                audioUrl: 'not-a-url',
            },
        };
        const result = (0, validators_1.validateVocabularyWord)(word);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field?.includes('audioUrl'))).toBe(true);
    });
    it('should reject frequency out of range', () => {
        const word = { ...validWord, frequency: 20000 };
        const result = (0, validators_1.validateVocabularyWord)(word);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'frequency')).toBe(true);
    });
});
describe('WordProgress Validation', () => {
    const validProgress = {
        userId: 'user123',
        wordId: 'word123',
        masteryLevel: 50,
        reviewCount: 10,
        correctAnswers: 8,
        lastReviewed: new Date(),
        nextReviewDate: new Date(Date.now() + 86400000),
        learningModality: ['visual', 'audio'],
        difficultyAdjustments: 0,
        averageResponseTime: 5000,
    };
    it('should validate correct word progress', () => {
        const result = (0, validators_1.validateWordProgress)(validProgress);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
    it('should reject missing userId', () => {
        const progress = { ...validProgress, userId: undefined };
        const result = (0, validators_1.validateWordProgress)(progress);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'userId')).toBe(true);
    });
    it('should reject missing wordId', () => {
        const progress = { ...validProgress, wordId: undefined };
        const result = (0, validators_1.validateWordProgress)(progress);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'wordId')).toBe(true);
    });
    it('should reject mastery level out of range', () => {
        const progress = { ...validProgress, masteryLevel: 150 };
        const result = (0, validators_1.validateWordProgress)(progress);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'masteryLevel')).toBe(true);
    });
    it('should reject negative review count', () => {
        const progress = { ...validProgress, reviewCount: -1 };
        const result = (0, validators_1.validateWordProgress)(progress);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'reviewCount')).toBe(true);
    });
    it('should reject negative average response time', () => {
        const progress = { ...validProgress, averageResponseTime: -100 };
        const result = (0, validators_1.validateWordProgress)(progress);
        expect(result.valid).toBe(false);
    });
});
describe('VerbConjugation Validation', () => {
    const validConjugation = {
        verbId: 'verb123',
        rootForm: 'كتب',
        conjugations: {
            past: {
                first: {
                    singular: {
                        masculine: 'كتبت',
                    },
                },
            },
        },
        patterns: ['فعل'],
        irregularities: [],
    };
    it('should validate correct verb conjugation', () => {
        const result = (0, validators_1.validateVerbConjugation)(validConjugation);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });
    it('should reject missing verbId', () => {
        const conjugation = { ...validConjugation, verbId: undefined };
        const result = (0, validators_1.validateVerbConjugation)(conjugation);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'verbId')).toBe(true);
    });
    it('should reject missing rootForm', () => {
        const conjugation = { ...validConjugation, rootForm: '' };
        const result = (0, validators_1.validateVerbConjugation)(conjugation);
        expect(result.valid).toBe(false);
        expect(result.errors.some((e) => e.field === 'rootForm')).toBe(true);
    });
    it('should reject empty conjugations', () => {
        const conjugation = { ...validConjugation, conjugations: {} };
        const result = (0, validators_1.validateVerbConjugation)(conjugation);
        expect(result.valid).toBe(false);
    });
});
describe('ValidationError', () => {
    it('should create validation error with all properties', () => {
        const error = new validators_1.ValidationError('Test error', 'testField', 'TEST_CODE');
        expect(error.message).toBe('Test error');
        expect(error.field).toBe('testField');
        expect(error.code).toBe('TEST_CODE');
        expect(error.name).toBe('ValidationError');
    });
    it('should create validation error without optional properties', () => {
        const error = new validators_1.ValidationError('Test error');
        expect(error.message).toBe('Test error');
        expect(error.field).toBeUndefined();
        expect(error.code).toBeUndefined();
    });
});
//# sourceMappingURL=validators.test.js.map