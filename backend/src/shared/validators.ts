/**
 * Shared validators for backend
 */

import { UserProfile, VocabularyWord, WordProgress, VerbConjugation } from './types';

export function validateUserProfile(profile: Partial<UserProfile>): string[] | null {
  const errors: string[] = [];
  
  if (!profile.email || !profile.email.includes('@')) {
    errors.push('Invalid email address');
  }
  
  if (profile.studyGoal && (profile.studyGoal < 1 || profile.studyGoal > 100)) {
    errors.push('Study goal must be between 1 and 100');
  }
  
  return errors.length > 0 ? errors : null;
}

export function validateVocabularyWord(word: Partial<VocabularyWord>): string[] | null {
  const errors: string[] = [];
  
  if (!word.arabicText) {
    errors.push('Arabic text is required');
  }
  
  if (!word.transliteration) {
    errors.push('Transliteration is required');
  }
  
  if (!word.translation) {
    errors.push('Translation is required');
  }
  
  return errors.length > 0 ? errors : null;
}

export function validateWordProgress(progress: Partial<WordProgress>): string[] | null {
  const errors: string[] = [];
  
  if (!progress.userId) {
    errors.push('User ID is required');
  }
  
  if (!progress.wordId) {
    errors.push('Word ID is required');
  }
  
  if (progress.masteryLevel !== undefined && (progress.masteryLevel < 0 || progress.masteryLevel > 100)) {
    errors.push('Mastery level must be between 0 and 100');
  }
  
  return errors.length > 0 ? errors : null;
}

export function validateVerbConjugation(conjugation: Partial<VerbConjugation>): string[] | null {
  const errors: string[] = [];
  
  if (!conjugation.verbId) {
    errors.push('Verb ID is required');
  }
  
  if (!conjugation.rootLetters || conjugation.rootLetters.length === 0) {
    errors.push('Root letters are required');
  }
  
  return errors.length > 0 ? errors : null;
}

