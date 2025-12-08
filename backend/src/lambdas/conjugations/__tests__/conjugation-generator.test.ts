/**
 * Conjugation Generator Unit Tests
 */

import {
  extractRootLetters,
  generatePerfectTense,
  generateImperfectTense,
  generateVerbConjugation,
  isIrregularVerb,
  VerbForm,
} from '../conjugation-generator';

describe('Conjugation Generator', () => {
  describe('extractRootLetters', () => {
    it('should extract root letters from verb', () => {
      const result = extractRootLetters('كَتَبَ');
      expect(result).toEqual(['ك', 'ت', 'ب']);
    });

    it('should remove diacritics', () => {
      const result = extractRootLetters('فَعَلَ');
      expect(result.length).toBe(3);
    });

    it('should handle 4-letter roots', () => {
      const result = extractRootLetters('دَحْرَجَ');
      expect(result.length).toBe(4);
    });
  });

  describe('generatePerfectTense', () => {
    it('should generate perfect tense conjugations', () => {
      const rootLetters = ['ك', 'ت', 'ب'];
      const conjugations = generatePerfectTense(rootLetters);

      expect(conjugations).toHaveProperty('first');
      expect(conjugations).toHaveProperty('second');
      expect(conjugations).toHaveProperty('third');
      expect(conjugations.first.singular.masculine).toContain('ت');
    });

    it('should generate third person masculine singular as base form', () => {
      const rootLetters = ['ك', 'ت', 'ب'];
      const conjugations = generatePerfectTense(rootLetters);

      // Base form should be like كَتَبَ
      expect(conjugations.third.singular.masculine).toBeTruthy();
    });
  });

  describe('generateImperfectTense', () => {
    it('should generate imperfect tense conjugations', () => {
      const rootLetters = ['ك', 'ت', 'ب'];
      const conjugations = generateImperfectTense(rootLetters);

      expect(conjugations).toHaveProperty('first');
      expect(conjugations).toHaveProperty('second');
      expect(conjugations).toHaveProperty('third');
    });

    it('should use correct prefixes', () => {
      const rootLetters = ['ك', 'ت', 'ب'];
      const conjugations = generateImperfectTense(rootLetters);

      // First person should start with أ
      expect(conjugations.first.singular.masculine).toContain('أ');
      
      // Third person masculine should start with ي
      expect(conjugations.third.singular.masculine).toContain('ي');
      
      // Third person feminine should start with ت
      expect(conjugations.third.singular.feminine).toContain('ت');
    });
  });

  describe('generateVerbConjugation', () => {
    it('should generate complete verb conjugation', () => {
      const verbId = 'test-verb-1';
      const rootForm = 'كَتَبَ';
      const rootLetters = ['ك', 'ت', 'ب'];

      const conjugation = generateVerbConjugation(verbId, rootForm, rootLetters);

      expect(conjugation.verbId).toBe(verbId);
      expect(conjugation.rootForm).toBe(rootForm);
      expect(conjugation.conjugations).toHaveProperty('past');
      expect(conjugation.conjugations).toHaveProperty('present');
      expect(conjugation.patterns).toContain(VerbForm.FORM_I);
    });

    it('should initialize with empty irregularities', () => {
      const conjugation = generateVerbConjugation('test', 'كَتَبَ', ['ك', 'ت', 'ب']);
      expect(conjugation.irregularities).toEqual([]);
    });
  });

  describe('isIrregularVerb', () => {
    it('should identify weak verbs (with و)', () => {
      const rootLetters = ['و', 'ص', 'ل']; // وصل
      expect(isIrregularVerb(rootLetters)).toBe(true);
    });

    it('should identify weak verbs (with ي)', () => {
      const rootLetters = ['ب', 'ي', 'ع']; // باع
      expect(isIrregularVerb(rootLetters)).toBe(true);
    });

    it('should identify doubled verbs', () => {
      const rootLetters = ['م', 'د', 'د']; // مدّ
      expect(isIrregularVerb(rootLetters)).toBe(true);
    });

    it('should identify hamzated verbs', () => {
      const rootLetters = ['أ', 'خ', 'ذ']; // أخذ
      expect(isIrregularVerb(rootLetters)).toBe(true);
    });

    it('should identify regular verbs', () => {
      const rootLetters = ['ك', 'ت', 'ب']; // كتب
      expect(isIrregularVerb(rootLetters)).toBe(false);
    });
  });
});

