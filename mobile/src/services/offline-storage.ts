/**
 * Offline Storage Service
 * Manages local SQLite database for offline functionality
 * 
 * NOTE: Temporarily disabled due to Expo SQLite v13 API changes
 * TODO: Rewrite using new async/await API (runAsync, getAllAsync, etc.)
 * See: https://docs.expo.dev/versions/latest/sdk/sqlite/
 */

/**
 * Initialize offline database
 * TODO: Re-implement with new Expo SQLite v13 API
 */
export const initializeOfflineStorage = (): Promise<void> => {
  console.warn('Offline storage temporarily disabled - needs migration to SQLite v13 API');
  return Promise.resolve();
};

/**
 * Save vocabulary word offline
 * TODO: Re-implement with new Expo SQLite v13 API
 */
export const saveVocabularyOffline = async (word: any): Promise<void> => {
  console.warn('saveVocabularyOffline: Feature disabled');
  return Promise.resolve();
};

/**
 * Get offline vocabulary words
 * TODO: Re-implement with new Expo SQLite v13 API
 */
export const getOfflineVocabulary = (limit: number = 20): Promise<any[]> => {
  console.warn('getOfflineVocabulary: Feature disabled');
  return Promise.resolve([]);
};

/**
 * Save progress offline
 * TODO: Re-implement with new Expo SQLite v13 API
 */
export const saveProgressOffline = async (progress: any): Promise<void> => {
  console.warn('saveProgressOffline: Feature disabled');
  return Promise.resolve();
};

/**
 * Get pending sync items
 * TODO: Re-implement with new Expo SQLite v13 API
 */
export const getPendingSyncItems = (): Promise<any[]> => {
  console.warn('getPendingSyncItems: Feature disabled');
  return Promise.resolve([]);
};

/**
 * Clear sync queue
 * TODO: Re-implement with new Expo SQLite v13 API
 */
export const clearSyncQueue = (): Promise<void> => {
  console.warn('clearSyncQueue: Feature disabled');
  return Promise.resolve();
};
