/**
 * Mobile app type definitions
 * Re-exports from shared and adds mobile-specific types
 */

// For now, just define placeholder types to fix build
// TODO: Properly import from shared when monorepo is set up

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username?: string;
}

export interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UserProfile {
  userId: string;
  email: string;
  username?: string;
  givenName?: string;
  familyName?: string;
  fullName?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  studyGoal?: number;
  learningModalities?: string[];
  selectedBookId?: string;
  preferredLanguage?: string;
}

export * from './navigation.types';
