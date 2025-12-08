import { ConjugationForms, VerbConjugation } from '../types/content';

export interface ConjugationPattern {
  name: string;
  description: string;
  pattern: string;
  examples: string[];
}

export interface ConjugationRule {
  tense: string;
  person: string;
  number: string;
  gender: string;
  prefix: string;
  suffix: string;
  infix?: string;
  rootModification?: (root: string) => string;
}

// Common Arabic verb conjugation patterns
export const CONJUGATION_PATTERNS: Record<string, ConjugationPattern> = {
  'form1': {
    name: 'Form I (فَعَلَ)',
    description: 'Basic triliteral verb form',
    pattern: 'فَعَلَ',
    examples: ['كَتَبَ', 'قَرَأَ', 'ذَهَبَ']
  },
  'form2': {
    name: 'Form II (فَعَّلَ)',
    description: 'Intensive/causative form with doubled middle radical',
    pattern: 'فَعَّلَ',
    examples: ['عَلَّمَ', 'كَبَّرَ', 'قَدَّسَ']
  },
  'form3': {
    name: 'Form III (فَاعَلَ)',
    description: 'Form with alif after first radical',
    pattern: 'فَاعَلَ',
    examples: ['جَاهَدَ', 'قَاتَلَ', 'سَافَرَ']
  },
  'form4': {
    name: 'Form IV (أَفْعَلَ)',
    description: 'Causative form with hamza prefix',
    pattern: 'أَفْعَلَ',
    examples: ['أَرْسَلَ', 'أَنْزَلَ', 'أَكْرَمَ']
  },
  'form5': {
    name: 'Form V (تَفَعَّلَ)',
    description: 'Reflexive of Form II',
    pattern: 'تَفَعَّلَ',
    examples: ['تَعَلَّمَ', 'تَكَبَّرَ', 'تَقَدَّسَ']
  },
  'form6': {
    name: 'Form VI (تَفَاعَلَ)',
    description: 'Reciprocal form',
    pattern: 'تَفَاعَلَ',
    examples: ['تَجَاهَدَ', 'تَقَاتَلَ', 'تَسَافَرَ']
  },
  'form7': {
    name: 'Form VII (انْفَعَلَ)',
    description: 'Passive/reflexive form',
    pattern: 'انْفَعَلَ',
    examples: ['انْكَسَرَ', 'انْقَطَعَ', 'انْفَتَحَ']
  },
  'form8': {
    name: 'Form VIII (افْتَعَلَ)',
    description: 'Reflexive form with ta infix',
    pattern: 'افْتَعَلَ',
    examples: ['اجْتَمَعَ', 'اخْتَارَ', 'افْتَرَقَ']
  },
  'form9': {
    name: 'Form IX (افْعَلَّ)',
    description: 'Form for colors and defects',
    pattern: 'افْعَلَّ',
    examples: ['احْمَرَّ', 'اصْفَرَّ', 'اخْضَرَّ']
  },
  'form10': {
    name: 'Form X (اسْتَفْعَلَ)',
    description: 'Seeking/requesting form',
    pattern: 'اسْتَفْعَلَ',
    examples: ['اسْتَغْفَرَ', 'اسْتَكْبَرَ', 'اسْتَقْبَلَ']
  }
};

// Conjugation rules for different tenses, persons, numbers, and genders
export const CONJUGATION_RULES: ConjugationRule[] = [
  // Perfect tense (الماضي) - Form I pattern
  { tense: 'perfect', person: '3rd', number: 'singular', gender: 'masculine', prefix: '', suffix: '' },
  { tense: 'perfect', person: '3rd', number: 'singular', gender: 'feminine', prefix: '', suffix: 'ت' },
  { tense: 'perfect', person: '2nd', number: 'singular', gender: 'masculine', prefix: '', suffix: 'تَ' },
  { tense: 'perfect', person: '2nd', number: 'singular', gender: 'feminine', prefix: '', suffix: 'تِ' },
  { tense: 'perfect', person: '1st', number: 'singular', gender: 'common', prefix: '', suffix: 'تُ' },
  
  { tense: 'perfect', person: '3rd', number: 'dual', gender: 'masculine', prefix: '', suffix: 'ا' },
  { tense: 'perfect', person: '3rd', number: 'dual', gender: 'feminine', prefix: '', suffix: 'تا' },
  { tense: 'perfect', person: '2nd', number: 'dual', gender: 'common', prefix: '', suffix: 'تُما' },
  
  { tense: 'perfect', person: '3rd', number: 'plural', gender: 'masculine', prefix: '', suffix: 'وا' },
  { tense: 'perfect', person: '3rd', number: 'plural', gender: 'feminine', prefix: '', suffix: 'نَ' },
  { tense: 'perfect', person: '2nd', number: 'plural', gender: 'masculine', prefix: '', suffix: 'تُم' },
  { tense: 'perfect', person: '2nd', number: 'plural', gender: 'feminine', prefix: '', suffix: 'تُنَّ' },
  { tense: 'perfect', person: '1st', number: 'plural', gender: 'common', prefix: '', suffix: 'نا' },

  // Imperfect tense (المضارع) - Form I pattern
  { tense: 'imperfect', person: '3rd', number: 'singular', gender: 'masculine', prefix: 'يَ', suffix: '' },
  { tense: 'imperfect', person: '3rd', number: 'singular', gender: 'feminine', prefix: 'تَ', suffix: '' },
  { tense: 'imperfect', person: '2nd', number: 'singular', gender: 'masculine', prefix: 'تَ', suffix: '' },
  { tense: 'imperfect', person: '2nd', number: 'singular', gender: 'feminine', prefix: 'تَ', suffix: 'ينَ' },
  { tense: 'imperfect', person: '1st', number: 'singular', gender: 'common', prefix: 'أَ', suffix: '' },
  
  { tense: 'imperfect', person: '3rd', number: 'dual', gender: 'masculine', prefix: 'يَ', suffix: 'انِ' },
  { tense: 'imperfect', person: '3rd', number: 'dual', gender: 'feminine', prefix: 'تَ', suffix: 'انِ' },
  { tense: 'imperfect', person: '2nd', number: 'dual', gender: 'common', prefix: 'تَ', suffix: 'انِ' },
  
  { tense: 'imperfect', person: '3rd', number: 'plural', gender: 'masculine', prefix: 'يَ', suffix: 'ونَ' },
  { tense: 'imperfect', person: '3rd', number: 'plural', gender: 'feminine', prefix: 'يَ', suffix: 'نَ' },
  { tense: 'imperfect', person: '2nd', number: 'plural', gender: 'masculine', prefix: 'تَ', suffix: 'ونَ' },
  { tense: 'imperfect', person: '2nd', number: 'plural', gender: 'feminine', prefix: 'تَ', suffix: 'نَ' },
  { tense: 'imperfect', person: '1st', number: 'plural', gender: 'common', prefix: 'نَ', suffix: '' },

  // Imperative (الأمر) - Form I pattern
  { tense: 'imperative', person: '2nd', number: 'singular', gender: 'masculine', prefix: '', suffix: '' },
  { tense: 'imperative', person: '2nd', number: 'singular', gender: 'feminine', prefix: '', suffix: 'ي' },
  { tense: 'imperative', person: '2nd', number: 'dual', gender: 'common', prefix: '', suffix: 'ا' },
  { tense: 'imperative', person: '2nd', number: 'plural', gender: 'masculine', prefix: '', suffix: 'وا' },
  { tense: 'imperative', person: '2nd', number: 'plural', gender: 'feminine', prefix: '', suffix: 'نَ' }
];

export class ConjugationGenerator {
  
  /**
   * Generate all conjugation forms for a given verb root and pattern
   */
  generateConjugations(rootForm: string, verbPattern: string = 'form1'): ConjugationForms {
    const conjugations: ConjugationForms = {};
    
    // Extract root letters (assuming triliteral root for now)
    const rootLetters = this.extractRootLetters(rootForm);
    
    if (rootLetters.length !== 3) {
      throw new Error('Currently only triliteral roots are supported');
    }

    // Generate conjugations for each tense
    const tenses = ['perfect', 'imperfect', 'imperative'];
    
    for (const tense of tenses) {
      conjugations[tense] = {};
      
      const relevantRules = CONJUGATION_RULES.filter(rule => rule.tense === tense);
      
      for (const rule of relevantRules) {
        if (!conjugations[tense][rule.person]) {
          conjugations[tense][rule.person] = {};
        }
        if (!conjugations[tense][rule.person][rule.number]) {
          conjugations[tense][rule.person][rule.number] = {};
        }
        
        const conjugatedForm = this.applyConjugationRule(rootLetters, rule, verbPattern);
        conjugations[tense][rule.person][rule.number][rule.gender] = conjugatedForm;
      }
    }

    return conjugations;
  }

  /**
   * Extract root letters from Arabic verb
   */
  private extractRootLetters(verb: string): string[] {
    // This is a simplified extraction - in reality, this would be much more complex
    // and would need to handle different verb patterns, weak roots, etc.
    
    // Remove common prefixes and suffixes to get to the root
    let cleaned = verb
      .replace(/^(أ|ا|ت|ي|ن)/, '') // Remove imperfect prefixes
      .replace(/^(است|ان)/, '') // Remove Form X and VII prefixes
      .replace(/(ت|ة|ون|ين|وا|نا|تم|تن|ان|ني)$/, '') // Remove suffixes
      .replace(/ّ/g, '') // Remove shadda (doubling mark)
      .replace(/[َُِْ]/g, ''); // Remove short vowels
    
    // For now, assume the remaining letters are the root
    // In a real implementation, this would use morphological analysis
    return cleaned.split('').filter(char => char.trim().length > 0);
  }

  /**
   * Apply conjugation rule to root letters
   */
  private applyConjugationRule(rootLetters: string[], rule: ConjugationRule, pattern: string): string {
    const [r1, r2, r3] = rootLetters;
    
    // Apply root modification if specified
    let modifiedRoot = rootLetters;
    if (rule.rootModification) {
      const modifiedRootStr = rule.rootModification(rootLetters.join(''));
      modifiedRoot = modifiedRootStr.split('');
    }

    let conjugatedForm = '';

    // Apply pattern-specific logic
    switch (pattern) {
      case 'form1':
        conjugatedForm = this.applyForm1Pattern(modifiedRoot, rule);
        break;
      case 'form2':
        conjugatedForm = this.applyForm2Pattern(modifiedRoot, rule);
        break;
      case 'form4':
        conjugatedForm = this.applyForm4Pattern(modifiedRoot, rule);
        break;
      default:
        conjugatedForm = this.applyForm1Pattern(modifiedRoot, rule);
    }

    return conjugatedForm;
  }

  /**
   * Apply Form I conjugation pattern
   */
  private applyForm1Pattern(root: string[], rule: ConjugationRule): string {
    const [r1, r2, r3] = root;
    
    switch (rule.tense) {
      case 'perfect':
        return `${rule.prefix}${r1}َ${r2}َ${r3}${rule.suffix}`;
      case 'imperfect':
        return `${rule.prefix}${r1}ْ${r2}ُ${r3}${rule.suffix}`;
      case 'imperative':
        return `${rule.prefix}${r1}ْ${r2}ُ${r3}${rule.suffix}`;
      default:
        return `${r1}${r2}${r3}`;
    }
  }

  /**
   * Apply Form II conjugation pattern (doubled middle radical)
   */
  private applyForm2Pattern(root: string[], rule: ConjugationRule): string {
    const [r1, r2, r3] = root;
    
    switch (rule.tense) {
      case 'perfect':
        return `${rule.prefix}${r1}َ${r2}َّ${r3}${rule.suffix}`;
      case 'imperfect':
        return `${rule.prefix}${r1}َ${r2}ِّ${r3}${rule.suffix}`;
      case 'imperative':
        return `${rule.prefix}${r1}َ${r2}ِّ${r3}${rule.suffix}`;
      default:
        return `${r1}${r2}${r3}`;
    }
  }

  /**
   * Apply Form IV conjugation pattern (hamza prefix)
   */
  private applyForm4Pattern(root: string[], rule: ConjugationRule): string {
    const [r1, r2, r3] = root;
    
    switch (rule.tense) {
      case 'perfect':
        return `أ${rule.prefix}${r1}ْ${r2}َ${r3}${rule.suffix}`;
      case 'imperfect':
        return `${rule.prefix}${r1}ْ${r2}ِ${r3}${rule.suffix}`;
      case 'imperative':
        return `أ${rule.prefix}${r1}ْ${r2}ِ${r3}${rule.suffix}`;
      default:
        return `${r1}${r2}${r3}`;
    }
  }

  /**
   * Identify verb pattern from root form
   */
  identifyPattern(verb: string): string {
    // Simplified pattern identification
    if (verb.includes('ّ')) return 'form2';
    if (verb.startsWith('أ')) return 'form4';
    if (verb.startsWith('ت') && verb.includes('ّ')) return 'form5';
    if (verb.startsWith('است')) return 'form10';
    
    return 'form1'; // Default to Form I
  }

  /**
   * Get pattern information
   */
  getPatternInfo(pattern: string): ConjugationPattern | null {
    return CONJUGATION_PATTERNS[pattern] || null;
  }

  /**
   * Validate conjugation data
   */
  validateConjugation(conjugation: VerbConjugation): string[] {
    const errors: string[] = [];

    if (!conjugation.verbId || conjugation.verbId.trim().length === 0) {
      errors.push('verbId is required');
    }

    if (!conjugation.rootForm || conjugation.rootForm.trim().length === 0) {
      errors.push('rootForm is required');
    }

    if (!conjugation.conjugations || Object.keys(conjugation.conjugations).length === 0) {
      errors.push('conjugations object is required and must not be empty');
    }

    // Validate that required tenses exist
    const requiredTenses = ['perfect', 'imperfect'];
    for (const tense of requiredTenses) {
      if (!conjugation.conjugations[tense]) {
        errors.push(`${tense} tense conjugations are required`);
      }
    }

    return errors;
  }

  /**
   * Generate irregular conjugation forms
   */
  generateIrregularConjugations(rootForm: string, irregularities: string[]): Partial<ConjugationForms> {
    const irregularConjugations: Partial<ConjugationForms> = {};
    
    // Handle common irregular patterns
    for (const irregularity of irregularities) {
      switch (irregularity) {
        case 'hollow':
          // Handle hollow verbs (وسط معتل) like قال، باع
          irregularConjugations.perfect = this.generateHollowPerfect(rootForm);
          break;
        case 'defective':
          // Handle defective verbs (ناقص) like دعا، رمى
          irregularConjugations.imperfect = this.generateDefectiveImperfect(rootForm);
          break;
        case 'doubled':
          // Handle doubled verbs (مضعف) like مدّ، شدّ
          irregularConjugations.perfect = this.generateDoubledPerfect(rootForm);
          break;
      }
    }

    return irregularConjugations;
  }

  private generateHollowPerfect(rootForm: string): any {
    // Simplified hollow verb conjugation
    // In reality, this would be much more complex
    return {
      '3rd': {
        'singular': {
          'masculine': rootForm,
          'feminine': rootForm + 'ت'
        }
      }
    };
  }

  private generateDefectiveImperfect(rootForm: string): any {
    // Simplified defective verb conjugation
    return {
      '3rd': {
        'singular': {
          'masculine': 'ي' + rootForm.slice(0, -1) + 'و',
          'feminine': 'ت' + rootForm.slice(0, -1) + 'و'
        }
      }
    };
  }

  private generateDoubledPerfect(rootForm: string): any {
    // Simplified doubled verb conjugation
    return {
      '3rd': {
        'singular': {
          'masculine': rootForm,
          'feminine': rootForm + 'ت'
        }
      }
    };
  }
}