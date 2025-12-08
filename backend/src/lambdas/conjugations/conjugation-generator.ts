/**
 * Arabic Verb Conjugation Generator
 * Generates conjugation forms programmatically based on root letters and patterns
 */

import {
  VerbConjugation,
  ConjugationForms,
  Tense,
  Person,
  Number as NumberType,
  Gender,
} from '../../../../shared/types';

// Arabic verb forms (وزن - Wazn)
export enum VerbForm {
  FORM_I = 'I',    // فَعَلَ
  FORM_II = 'II',   // فَعَّلَ
  FORM_III = 'III', // فَاعَلَ
  FORM_IV = 'IV',   // أَفْعَلَ
  FORM_V = 'V',     // تَفَعَّلَ
  FORM_VI = 'VI',   // تَفَاعَلَ
  FORM_VII = 'VII', // اِنْفَعَلَ
  FORM_VIII = 'VIII', // اِفْتَعَلَ
  FORM_IX = 'IX',   // اِفْعَلَّ
  FORM_X = 'X',     // اِسْتَفْعَلَ
}

// Conjugation patterns for perfect (past) tense
// person -> number -> gender -> suffix
const PERFECT_PATTERNS: Record<string, Record<string, Record<string, string>>> = {
  first: {
    singular: {
      masculine: 'ـْتُ', // -tu
      feminine: 'ـْتُ',
    },
    dual: {
      masculine: 'ـْنَا', // -nā
      feminine: 'ـْنَا',
    },
    plural: {
      masculine: 'ـْنَا', // -nā
      feminine: 'ـْنَا',
    },
  },
  second: {
    singular: {
      masculine: 'ـْتَ', // -ta
      feminine: 'ـْتِ', // -ti
    },
    dual: {
      masculine: 'ـْتُمَا', // -tumā
      feminine: 'ـْتُمَا',
    },
    plural: {
      masculine: 'ـْتُمْ', // -tum
      feminine: 'ـْتُنَّ', // -tunna
    },
  },
  third: {
    singular: {
      masculine: 'َ', // -a (base form)
      feminine: 'َتْ', // -at
    },
    dual: {
      masculine: 'َا', // -ā
      feminine: 'َتَا', // -atā
    },
    plural: {
      masculine: 'ُوا', // -ū
      feminine: 'ْنَ', // -na
    },
  },
};

// Conjugation patterns for imperfect (present) tense
const IMPERFECT_PREFIXES: Record<string, Record<string, Record<string, string>>> = {
  first: {
    singular: {
      masculine: 'أَ', // a-
      feminine: 'أَ',
    },
    dual: {
      masculine: 'نَ', // na-
      feminine: 'نَ',
    },
    plural: {
      masculine: 'نَ', // na-
      feminine: 'نَ',
    },
  },
  second: {
    singular: {
      masculine: 'تَ', // ta-
      feminine: 'تَ', // ta-
    },
    dual: {
      masculine: 'تَ', // ta-
      feminine: 'تَ',
    },
    plural: {
      masculine: 'تَ', // ta-
      feminine: 'تَ',
    },
  },
  third: {
    singular: {
      masculine: 'يَ', // ya-
      feminine: 'تَ', // ta-
    },
    dual: {
      masculine: 'يَ', // ya-
      feminine: 'تَ', // ta-
    },
    plural: {
      masculine: 'يَ', // ya-
      feminine: 'يَ',
    },
  },
};

const IMPERFECT_SUFFIXES: Record<string, Record<string, Record<string, string>>> = {
  first: {
    singular: {
      masculine: '', // base
      feminine: '',
    },
    dual: {
      masculine: '', // na- (prefix only)
      feminine: '',
    },
    plural: {
      masculine: '', // na- (prefix only)
      feminine: '',
    },
  },
  second: {
    singular: {
      masculine: '', // base
      feminine: 'ِينَ', // -īna
    },
    dual: {
      masculine: 'َانِ', // -āni
      feminine: 'َانِ',
    },
    plural: {
      masculine: 'ُونَ', // -ūna
      feminine: 'ْنَ', // -na
    },
  },
  third: {
    singular: {
      masculine: '', // base
      feminine: '', // ta- prefix only
    },
    dual: {
      masculine: 'َانِ', // -āni
      feminine: 'َانِ',
    },
    plural: {
      masculine: 'ُونَ', // -ūna
      feminine: 'ْنَ', // -na
    },
  },
};

/**
 * Extract root letters from a verb
 * @param verb Arabic verb in root form
 * @returns Array of root letters (typically 3-4 letters)
 */
export const extractRootLetters = (verb: string): string[] => {
  // Remove diacritics and extract consonants
  const consonants = verb.replace(/[َُِّْ]/g, '');
  return consonants.split('');
};

/**
 * Generate perfect (past) tense conjugations
 * @param rootLetters Root letters of the verb
 * @param form Verb form (I-X)
 * @returns ConjugationForms for perfect tense
 */
export const generatePerfectTense = (
  rootLetters: string[],
  form: VerbForm = VerbForm.FORM_I
): Record<string, Record<string, Record<string, string>>> => {
  // For Form I (فَعَلَ), construct base form
  const baseForm = constructFormI(rootLetters, 'perfect');
  
  const conjugations: any = {};
  
  for (const person of ['first', 'second', 'third']) {
    conjugations[person] = {};
    for (const number of ['singular', 'dual', 'plural']) {
      conjugations[person][number] = {};
      for (const gender of ['masculine', 'feminine']) {
        const suffix = PERFECT_PATTERNS[person]?.[number]?.[gender] || '';
        conjugations[person][number][gender] = baseForm + suffix;
      }
    }
  }
  
  return conjugations;
};

/**
 * Generate imperfect (present) tense conjugations
 * @param rootLetters Root letters of the verb
 * @param form Verb form (I-X)
 * @returns ConjugationForms for imperfect tense
 */
export const generateImperfectTense = (
  rootLetters: string[],
  form: VerbForm = VerbForm.FORM_I
): Record<string, Record<string, Record<string, string>>> => {
  const baseForm = constructFormI(rootLetters, 'imperfect');
  
  const conjugations: any = {};
  
  for (const person of ['first', 'second', 'third']) {
    conjugations[person] = {};
    for (const number of ['singular', 'dual', 'plural']) {
      conjugations[person][number] = {};
      for (const gender of ['masculine', 'feminine']) {
        const prefix = IMPERFECT_PREFIXES[person]?.[number]?.[gender] || '';
        const suffix = IMPERFECT_SUFFIXES[person]?.[number]?.[gender] || '';
        conjugations[person][number][gender] = prefix + baseForm + suffix;
      }
    }
  }
  
  return conjugations;
};

/**
 * Construct Form I verb pattern
 * @param rootLetters Root letters (ف ع ل)
 * @param tenseType 'perfect' or 'imperfect'
 * @returns Constructed verb form
 */
const constructFormI = (rootLetters: string[], tenseType: 'perfect' | 'imperfect'): string => {
  if (rootLetters.length < 3) {
    throw new Error('Root must have at least 3 letters');
  }
  
  const [f, a, l] = rootLetters; // ف ع ل (fa'ala pattern)
  
  if (tenseType === 'perfect') {
    // فَعَلَ pattern
    return `${f}َ${a}َ${l}`;
  } else {
    // فْعُلُ pattern (for imperfect, without prefix/suffix)
    return `${f}ْ${a}ُ${l}`;
  }
};

/**
 * Generate full verb conjugation
 * @param verbId Unique verb identifier
 * @param rootForm Root form of the verb
 * @param rootLetters Root letters
 * @param form Verb form (I-X)
 * @returns Complete VerbConjugation object
 */
export const generateVerbConjugation = (
  verbId: string,
  rootForm: string,
  rootLetters: string[],
  form: VerbForm = VerbForm.FORM_I
): VerbConjugation => {
  const conjugations: ConjugationForms = {
    past: generatePerfectTense(rootLetters, form),
    present: generateImperfectTense(rootLetters, form),
    future: {}, // Future uses present with سَـ or سَوْفَ prefix
    imperative: {}, // Imperative derived from present (TODO: implement)
  };
  
  return {
    verbId,
    rootForm,
    conjugations,
    patterns: [form],
    irregularities: [],
  };
};

/**
 * Check if a verb is regular or irregular
 * @param rootLetters Root letters
 * @returns true if irregular (weak, hollow, defective, doubled)
 */
export const isIrregularVerb = (rootLetters: string[]): boolean => {
  const weakLetters = ['و', 'ي', 'ا']; // و, ي, ا
  const hamza = ['ء', 'أ', 'إ', 'ؤ', 'ئ'];
  
  // Check for weak letters
  for (const letter of rootLetters) {
    if (weakLetters.includes(letter) || hamza.includes(letter)) {
      return true;
    }
  }
  
  // Check for doubled letters (e.g., مدّ)
  if (rootLetters[1] === rootLetters[2]) {
    return true;
  }
  
  return false;
};

