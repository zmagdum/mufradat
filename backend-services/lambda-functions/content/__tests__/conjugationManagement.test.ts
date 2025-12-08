import { ConjugationGenerator, CONJUGATION_PATTERNS } from '../../../utils/conjugationGenerator';
import { ConjugationCacheService } from '../../../utils/conjugationCache';
import { VerbConjugation, ConjugationForms } from '../../../types/content';

describe('Conjugation Management', () => {
  let conjugationGenerator: ConjugationGenerator;
  let cacheService: ConjugationCacheService;

  beforeEach(() => {
    conjugationGenerator = new ConjugationGenerator();
    cacheService = new ConjugationCacheService();
  });

  describe('ConjugationGenerator', () => {
    describe('generateConjugations', () => {
      it('should generate Form I conjugations for a triliteral root', () => {
        const rootForm = 'كتب';
        const conjugations = conjugationGenerator.generateConjugations(rootForm, 'form1');

        expect(conjugations).toHaveProperty('perfect');
        expect(conjugations).toHaveProperty('imperfect');
        expect(conjugations).toHaveProperty('imperative');

        // Check perfect tense conjugations
        expect(conjugations.perfect['3rd']['singular']['masculine']).toBeDefined();
        expect(conjugations.perfect['3rd']['singular']['feminine']).toBeDefined();
        expect(conjugations.perfect['1st']['singular']['common']).toBeDefined();

        // Check imperfect tense conjugations
        expect(conjugations.imperfect['3rd']['singular']['masculine']).toBeDefined();
        expect(conjugations.imperfect['3rd']['singular']['feminine']).toBeDefined();
        expect(conjugations.imperfect['1st']['singular']['common']).toBeDefined();

        // Check imperative conjugations
        expect(conjugations.imperative['2nd']['singular']['masculine']).toBeDefined();
        expect(conjugations.imperative['2nd']['singular']['feminine']).toBeDefined();
      });

      it('should generate Form II conjugations with doubled middle radical', () => {
        const rootForm = 'علم';
        const conjugations = conjugationGenerator.generateConjugations(rootForm, 'form2');

        expect(conjugations).toHaveProperty('perfect');
        expect(conjugations).toHaveProperty('imperfect');

        // Form II should have doubled middle radical (shadda)
        const perfectForm = conjugations.perfect['3rd']['singular']['masculine'];
        expect(perfectForm).toContain('ّ'); // Should contain shadda
      });

      it('should generate Form IV conjugations with hamza prefix', () => {
        const rootForm = 'رسل';
        const conjugations = conjugationGenerator.generateConjugations(rootForm, 'form4');

        expect(conjugations).toHaveProperty('perfect');
        expect(conjugations).toHaveProperty('imperfect');

        // Form IV perfect should start with hamza
        const perfectForm = conjugations.perfect['3rd']['singular']['masculine'];
        expect(perfectForm).toMatch(/^أ/); // Should start with hamza
      });

      it('should throw error for non-triliteral roots', () => {
        const rootForm = 'كت'; // Only two letters
        
        expect(() => {
          conjugationGenerator.generateConjugations(rootForm, 'form1');
        }).toThrow('Currently only triliteral roots are supported');
      });
    });

    describe('identifyPattern', () => {
      it('should identify Form I pattern', () => {
        const pattern = conjugationGenerator.identifyPattern('كتب');
        expect(pattern).toBe('form1');
      });

      it('should identify Form II pattern with shadda', () => {
        const pattern = conjugationGenerator.identifyPattern('علّم');
        expect(pattern).toBe('form2');
      });

      it('should identify Form IV pattern with hamza', () => {
        const pattern = conjugationGenerator.identifyPattern('أرسل');
        expect(pattern).toBe('form4');
      });

      it('should identify Form X pattern', () => {
        const pattern = conjugationGenerator.identifyPattern('استغفر');
        expect(pattern).toBe('form10');
      });
    });

    describe('getPatternInfo', () => {
      it('should return pattern information for valid pattern', () => {
        const patternInfo = conjugationGenerator.getPatternInfo('form1');
        
        expect(patternInfo).toBeDefined();
        expect(patternInfo!.name).toBe('Form I (فَعَلَ)');
        expect(patternInfo!.pattern).toBe('فَعَلَ');
        expect(patternInfo!.examples).toContain('كَتَبَ');
      });

      it('should return null for invalid pattern', () => {
        const patternInfo = conjugationGenerator.getPatternInfo('invalid');
        expect(patternInfo).toBeNull();
      });
    });

    describe('validateConjugation', () => {
      it('should validate a complete conjugation', () => {
        const validConjugation: VerbConjugation = {
          verbId: 'test-verb-123',
          rootForm: 'كتب',
          conjugations: {
            perfect: {
              '3rd': {
                'singular': {
                  'masculine': 'كَتَبَ',
                  'feminine': 'كَتَبَت'
                }
              }
            },
            imperfect: {
              '3rd': {
                'singular': {
                  'masculine': 'يَكْتُبُ',
                  'feminine': 'تَكْتُبُ'
                }
              }
            }
          },
          patterns: ['form1'],
          irregularities: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const errors = conjugationGenerator.validateConjugation(validConjugation);
        expect(errors).toHaveLength(0);
      });

      it('should return errors for invalid conjugation', () => {
        const invalidConjugation: VerbConjugation = {
          verbId: '',
          rootForm: '',
          conjugations: {},
          patterns: [],
          irregularities: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        const errors = conjugationGenerator.validateConjugation(invalidConjugation);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors).toContain('verbId is required');
        expect(errors).toContain('rootForm is required');
        expect(errors).toContain('conjugations object is required and must not be empty');
      });
    });

    describe('generateIrregularConjugations', () => {
      it('should generate hollow verb conjugations', () => {
        const rootForm = 'قال';
        const irregularities = ['hollow'];
        
        const irregularConjugations = conjugationGenerator.generateIrregularConjugations(
          rootForm, 
          irregularities
        );

        expect(irregularConjugations).toHaveProperty('perfect');
        expect(irregularConjugations.perfect).toBeDefined();
      });

      it('should generate defective verb conjugations', () => {
        const rootForm = 'دعا';
        const irregularities = ['defective'];
        
        const irregularConjugations = conjugationGenerator.generateIrregularConjugations(
          rootForm, 
          irregularities
        );

        expect(irregularConjugations).toHaveProperty('imperfect');
        expect(irregularConjugations.imperfect).toBeDefined();
      });

      it('should generate doubled verb conjugations', () => {
        const rootForm = 'مدّ';
        const irregularities = ['doubled'];
        
        const irregularConjugations = conjugationGenerator.generateIrregularConjugations(
          rootForm, 
          irregularities
        );

        expect(irregularConjugations).toHaveProperty('perfect');
        expect(irregularConjugations.perfect).toBeDefined();
      });
    });

    describe('extractRootLetters', () => {
      it('should extract root letters from simple verb', () => {
        const rootLetters = (conjugationGenerator as any).extractRootLetters('كتب');
        expect(rootLetters).toEqual(['ك', 'ت', 'ب']);
      });

      it('should extract root letters from verb with prefixes', () => {
        const rootLetters = (conjugationGenerator as any).extractRootLetters('يكتب');
        expect(rootLetters).toEqual(['ك', 'ت', 'ب']);
      });

      it('should extract root letters from verb with suffixes', () => {
        const rootLetters = (conjugationGenerator as any).extractRootLetters('كتبوا');
        expect(rootLetters).toEqual(['ك', 'ت', 'ب']);
      });
    });
  });

  describe('ConjugationCacheService', () => {
    const mockConjugation: VerbConjugation = {
      verbId: 'test-verb-123',
      rootForm: 'كتب',
      conjugations: {
        perfect: {
          '3rd': {
            'singular': {
              'masculine': 'كَتَبَ',
              'feminine': 'كَتَبَت'
            }
          }
        },
        imperfect: {
          '3rd': {
            'singular': {
              'masculine': 'يَكْتُبُ',
              'feminine': 'تَكْتُبُ'
            }
          }
        }
      },
      patterns: ['form1'],
      irregularities: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    describe('cacheConjugation and getConjugation', () => {
      it('should cache and retrieve conjugation', async () => {
        await cacheService.cacheConjugation(mockConjugation);
        const retrieved = await cacheService.getConjugation('test-verb-123');
        
        expect(retrieved).toEqual(mockConjugation);
      });

      it('should return null for non-existent conjugation', async () => {
        const retrieved = await cacheService.getConjugation('non-existent');
        expect(retrieved).toBeNull();
      });
    });

    describe('cacheGeneratedConjugations and getGeneratedConjugations', () => {
      it('should cache and retrieve generated conjugations', async () => {
        const conjugations: ConjugationForms = {
          perfect: {
            '3rd': {
              'singular': {
                'masculine': 'كَتَبَ',
                'feminine': 'كَتَبَت'
              }
            }
          }
        };

        await cacheService.cacheGeneratedConjugations('كتب', 'form1', conjugations);
        const retrieved = await cacheService.getGeneratedConjugations('كتب', 'form1');
        
        expect(retrieved).toEqual(conjugations);
      });
    });

    describe('hasConjugation', () => {
      it('should return true for cached conjugation', async () => {
        await cacheService.cacheConjugation(mockConjugation);
        const exists = await cacheService.hasConjugation('test-verb-123');
        
        expect(exists).toBe(true);
      });

      it('should return false for non-cached conjugation', async () => {
        const exists = await cacheService.hasConjugation('non-existent');
        expect(exists).toBe(false);
      });
    });

    describe('invalidateConjugation', () => {
      it('should remove conjugation from cache', async () => {
        await cacheService.cacheConjugation(mockConjugation);
        await cacheService.invalidateConjugation('test-verb-123');
        
        const retrieved = await cacheService.getConjugation('test-verb-123');
        expect(retrieved).toBeNull();
      });
    });

    describe('cacheMultipleConjugations', () => {
      it('should cache multiple conjugations', async () => {
        const conjugations = [
          { ...mockConjugation, verbId: 'verb-1' },
          { ...mockConjugation, verbId: 'verb-2' },
          { ...mockConjugation, verbId: 'verb-3' }
        ];

        await cacheService.cacheMultipleConjugations(conjugations);

        const retrieved1 = await cacheService.getConjugation('verb-1');
        const retrieved2 = await cacheService.getConjugation('verb-2');
        const retrieved3 = await cacheService.getConjugation('verb-3');

        expect(retrieved1).toBeDefined();
        expect(retrieved2).toBeDefined();
        expect(retrieved3).toBeDefined();
      });
    });
  });

  describe('CONJUGATION_PATTERNS', () => {
    it('should contain all 10 verb forms', () => {
      expect(CONJUGATION_PATTERNS).toHaveProperty('form1');
      expect(CONJUGATION_PATTERNS).toHaveProperty('form2');
      expect(CONJUGATION_PATTERNS).toHaveProperty('form3');
      expect(CONJUGATION_PATTERNS).toHaveProperty('form4');
      expect(CONJUGATION_PATTERNS).toHaveProperty('form5');
      expect(CONJUGATION_PATTERNS).toHaveProperty('form6');
      expect(CONJUGATION_PATTERNS).toHaveProperty('form7');
      expect(CONJUGATION_PATTERNS).toHaveProperty('form8');
      expect(CONJUGATION_PATTERNS).toHaveProperty('form9');
      expect(CONJUGATION_PATTERNS).toHaveProperty('form10');
    });

    it('should have proper structure for each pattern', () => {
      Object.values(CONJUGATION_PATTERNS).forEach(pattern => {
        expect(pattern).toHaveProperty('name');
        expect(pattern).toHaveProperty('description');
        expect(pattern).toHaveProperty('pattern');
        expect(pattern).toHaveProperty('examples');
        expect(Array.isArray(pattern.examples)).toBe(true);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should generate, cache, and retrieve conjugations', async () => {
      const rootForm = 'كتب';
      const pattern = 'form1';

      // Generate conjugations
      const conjugations = conjugationGenerator.generateConjugations(rootForm, pattern);
      expect(conjugations).toBeDefined();

      // Cache the generated conjugations
      await cacheService.cacheGeneratedConjugations(rootForm, pattern, conjugations);

      // Retrieve from cache
      const cachedConjugations = await cacheService.getGeneratedConjugations(rootForm, pattern);
      expect(cachedConjugations).toEqual(conjugations);
    });

    it('should handle complete conjugation workflow', async () => {
      const verbId = 'test-verb-workflow';
      const rootForm = 'كتب';
      
      // Generate conjugations
      const conjugations = conjugationGenerator.generateConjugations(rootForm, 'form1');
      
      // Create conjugation object
      const conjugation: VerbConjugation = {
        verbId,
        rootForm,
        conjugations,
        patterns: ['form1'],
        irregularities: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Validate
      const errors = conjugationGenerator.validateConjugation(conjugation);
      expect(errors).toHaveLength(0);

      // Cache
      await cacheService.cacheConjugation(conjugation);

      // Retrieve
      const retrieved = await cacheService.getConjugation(verbId);
      expect(retrieved).toEqual(conjugation);
    });
  });
});