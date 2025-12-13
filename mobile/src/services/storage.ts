/**
 * Secure Storage Service
 * Uses Expo SecureStore for native platforms and AsyncStorage for web
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'mufradat_access_token',
  REFRESH_TOKEN: 'mufradat_refresh_token',
  USER_ID: 'mufradat_user_id',
  USER_EMAIL: 'mufradat_user_email',
} as const;

// Platform-specific storage functions
const isWeb = Platform.OS === 'web';

const storage = {
  async setItem(key: string, value: string): Promise<void> {
    if (isWeb) {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async getItem(key: string): Promise<string | null> {
    if (isWeb) {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (isWeb) {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

/**
 * Store access token securely
 */
export async function storeAccessToken(token: string): Promise<void> {
  try {
    await storage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
  } catch (error) {
    console.error('Failed to store access token:', error);
    throw new Error('Failed to store access token');
  }
}

/**
 * Store refresh token securely
 */
export async function storeRefreshToken(token: string): Promise<void> {
  try {
    await storage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  } catch (error) {
    console.error('Failed to store refresh token:', error);
    throw new Error('Failed to store refresh token');
  }
}

/**
 * Store both tokens
 */
export async function storeTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    storeAccessToken(accessToken),
    storeRefreshToken(refreshToken),
  ]);
}

/**
 * Get access token
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    return await storage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.error('Failed to get access token:', error);
    return null;
  }
}

/**
 * Get refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    return await storage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Failed to get refresh token:', error);
    return null;
  }
}

/**
 * Delete access token
 */
export async function deleteAccessToken(): Promise<void> {
  try {
    await storage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  } catch (error) {
    console.error('Failed to delete access token:', error);
  }
}

/**
 * Delete refresh token
 */
export async function deleteRefreshToken(): Promise<void> {
  try {
    await storage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error('Failed to delete refresh token:', error);
  }
}

/**
 * Delete all tokens (logout)
 */
export async function deleteAllTokens(): Promise<void> {
  await Promise.all([
    deleteAccessToken(),
    deleteRefreshToken(),
    storage.removeItem(STORAGE_KEYS.USER_ID),
    storage.removeItem(STORAGE_KEYS.USER_EMAIL),
  ]);
}

/**
 * Store user info
 */
export async function storeUserInfo(userId: string, email: string): Promise<void> {
  await Promise.all([
    storage.setItem(STORAGE_KEYS.USER_ID, userId),
    storage.setItem(STORAGE_KEYS.USER_EMAIL, email),
  ]);
}

/**
 * Get user ID
 */
export async function getUserId(): Promise<string | null> {
  try {
    return await storage.getItem(STORAGE_KEYS.USER_ID);
  } catch (error) {
    console.error('Failed to get user ID:', error);
    return null;
  }
}

/**
 * Get user email
 */
export async function getUserEmail(): Promise<string | null> {
  try {
    return await storage.getItem(STORAGE_KEYS.USER_EMAIL);
  } catch (error) {
    console.error('Failed to get user email:', error);
    return null;
  }
}

/**
 * Check if user is authenticated (has tokens)
 */
export async function isAuthenticated(): Promise<boolean> {
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();
  return !!(accessToken && refreshToken);
}

// Aliases for backward compatibility
export const saveTokens = storeTokens;
export const clearTokens = deleteAllTokens;

