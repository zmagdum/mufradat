/**
 * Verb conjugation-related type definitions
 */

export interface VerbConjugation {
  verbId: string;
  rootForm: string;
  conjugations: ConjugationForms;
  patterns: string[];
  irregularities: string[];
}

export interface ConjugationForms {
  [tense: string]: {
    [person: string]: {
      [number: string]: {
        [gender: string]: string;
      };
    };
  };
}

export type Tense = 'past' | 'present' | 'future' | 'imperative';
export type Person = 'first' | 'second' | 'third';
export type Number = 'singular' | 'dual' | 'plural';
export type Gender = 'masculine' | 'feminine';

