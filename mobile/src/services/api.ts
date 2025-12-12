/**
 * API Service
 * Handles all HTTP requests to the backend
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, storeTokens, deleteAllTokens } from './storage';
import { API_BASE_URL } from '../config/api';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401) {
      // Token refresh will be handled by the auth context
      // For now, just pass the error through
    }
    return Promise.reject(error);
  }
);

export default api;

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Auth API
export interface RegisterData {
  email: string;
  password: string;
  givenName?: string;
  familyName?: string;
  studyGoal?: number;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    userId: string;
    email: string;
    givenName: string;
    familyName: string;
    studyGoal: number;
    currentStreak: number;
    totalWordsLearned: number;
    [key: string]: any;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

/**
 * Register a new user
 */
export async function register(data: RegisterData): Promise<{ message: string; email: string; emailVerified: boolean }> {
  const response = await api.post<ApiResponse<{ message: string; email: string; emailVerified: boolean }>>('/auth/register', data);
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Registration failed');
  }
  
  return response.data.data;
}

/**
 * Login with email and password
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Login failed');
  }
  
  return response.data.data;
}

/**
 * Refresh access token
 */
export async function refreshToken(refreshToken: string): Promise<AuthResponse['tokens']> {
  const response = await api.post<ApiResponse<{ tokens: AuthResponse['tokens'] }>>(
    '/auth/refresh',
    { refreshToken }
  );
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Token refresh failed');
  }
  
  return response.data.data.tokens;
}

/**
 * Logout (invalidate tokens)
 */
export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    // Logout always succeeds locally even if API call fails
    console.warn('Logout API call failed:', error);
  } finally {
    await deleteAllTokens();
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(): Promise<AuthResponse['user']> {
  const response = await api.get<ApiResponse<AuthResponse['user']>>('/users/profile');
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to get profile');
  }
  
  return response.data.data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: Partial<AuthResponse['user']>): Promise<AuthResponse['user']> {
  const response = await api.patch<ApiResponse<AuthResponse['user']>>(
    '/users/profile',
    updates
  );
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to update profile');
  }
  
  return response.data.data;
}

/**
 * Get user statistics
 */
export interface UserStatistics {
  totalWordsLearned: number;
  masteredWords: number;
  wordsInProgress: number;
  currentStreak: number;
  longestStreak: number;
  studyGoal: number;
  progressPercentage: number;
}

export async function getUserStatistics(): Promise<UserStatistics> {
  const response = await api.get<ApiResponse<UserStatistics>>('/users/statistics');
  
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error?.message || 'Failed to get statistics');
  }
  
  return response.data.data;
}

