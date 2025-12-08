"use strict";
/**
 * Shared validators for data validation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateVocabularyWord = exports.validateUserProfile = void 0;
const validateUserProfile = (profile) => {
    const errors = [];
    if (!profile.userId || typeof profile.userId !== 'string') {
        errors.push('Invalid userId');
    }
    if (!profile.email || typeof profile.email !== 'string' || !profile.email.includes('@')) {
        errors.push('Invalid email');
    }
    if (profile.studyGoal !== undefined && (typeof profile.studyGoal !== 'number' || profile.studyGoal < 0)) {
        errors.push('Invalid studyGoal');
    }
    return errors.length > 0 ? errors : null;
};
exports.validateUserProfile = validateUserProfile;
const validateVocabularyWord = (word) => {
    const errors = [];
    if (!word.wordId || typeof word.wordId !== 'string') {
        errors.push('Invalid wordId');
    }
    if (!word.arabicText || typeof word.arabicText !== 'string') {
        errors.push('Invalid arabicText');
    }
    if (!word.translation || typeof word.translation !== 'string') {
        errors.push('Invalid translation');
    }
    return errors.length > 0 ? errors : null;
};
exports.validateVocabularyWord = validateVocabularyWord;
//# sourceMappingURL=index.js.map