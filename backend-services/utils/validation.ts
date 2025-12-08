/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.toLowerCase());
}

/**
 * Validate password strength
 * Requirements: At least 8 characters, contains uppercase, lowercase, and number
 */
export function validatePassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }

  // At least 8 characters
  if (password.length < 8) {
    return false;
  }

  // Contains uppercase letter
  if (!/[A-Z]/.test(password)) {
    return false;
  }

  // Contains lowercase letter
  if (!/[a-z]/.test(password)) {
    return false;
  }

  // Contains number
  if (!/\d/.test(password)) {
    return false;
  }

  return true;
}

/**
 * Validate display name
 */
export function validateDisplayName(displayName: string): boolean {
  if (!displayName || typeof displayName !== 'string') {
    return false;
  }

  const trimmed = displayName.trim();
  return trimmed.length >= 2 && trimmed.length <= 50;
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input.trim().replace(/[<>]/g, '');
}

/**
 * Validate user preferences
 */
export function validateUserPreferences(preferences: any): boolean {
  if (!preferences || typeof preferences !== 'object') {
    return false;
  }

  const {
    learningModalities,
    notificationFrequency,
    studyGoal,
    preferredStudyTime,
  } = preferences;

  // Validate learning modalities
  if (learningModalities && Array.isArray(learningModalities)) {
    const validModalities = ['visual', 'audio', 'contextual', 'associative'];
    if (!learningModalities.every(m => validModalities.includes(m))) {
      return false;
    }
  }

  // Validate notification frequency
  if (notificationFrequency && !['low', 'medium', 'high'].includes(notificationFrequency)) {
    return false;
  }

  // Validate study goal
  if (studyGoal !== undefined && (typeof studyGoal !== 'number' || studyGoal < 1 || studyGoal > 100)) {
    return false;
  }

  // Validate preferred study time (HH:MM format)
  if (preferredStudyTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(preferredStudyTime)) {
    return false;
  }

  return true;
}