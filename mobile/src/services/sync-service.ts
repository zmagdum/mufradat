/**
 * Sync Service
 * Handles data synchronization between offline storage and server
 */

import NetInfo from '@react-native-community/netinfo';
import api from './api';
import {
  getPendingSyncItems,
  saveVocabularyOffline,
  saveProgressOffline,
  clearSyncQueue,
} from './offline-storage';

/**
 * Check if device is online
 */
export const isOnline = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected === true;
};

/**
 * Sync pending changes to server
 */
export const syncToServer = async (): Promise<{ success: boolean; synced: number }> => {
  const online = await isOnline();
  if (!online) {
    return { success: false, synced: 0 };
  }

  try {
    const pendingItems = await getPendingSyncItems();
    let syncedCount = 0;

    for (const item of pendingItems) {
      try {
        const data = JSON.parse(item.data);

        switch (item.operation) {
          case 'CREATE':
          case 'UPDATE':
            await api.post(`/${item.tableName}`, data);
            syncedCount++;
            break;

          case 'DELETE':
            await api.delete(`/${item.tableName}/${item.recordId}`);
            syncedCount++;
            break;
        }
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        // Continue with next item
      }
    }

    // Clear successfully synced items
    if (syncedCount > 0) {
      await clearSyncQueue();
    }

    return { success: true, synced: syncedCount };
  } catch (error) {
    console.error('Sync to server failed:', error);
    return { success: false, synced: 0 };
  }
};

/**
 * Sync from server to local storage
 */
export const syncFromServer = async (userId: string): Promise<{ success: boolean; downloaded: number }> => {
  const online = await isOnline();
  if (!online) {
    return { success: false, downloaded: 0 };
  }

  try {
    // Download vocabulary
    const vocabResponse = await api.get('/vocabulary/words?limit=100');
    const words = vocabResponse.data.words || [];

    for (const word of words) {
      await saveVocabularyOffline(word);
    }

    // Download progress
    const progressResponse = await api.get(`/users/${userId}/progress`);
    const progressItems = progressResponse.data.items || [];

    for (const progress of progressItems) {
      await saveProgressOffline(progress);
    }

    return {
      success: true,
      downloaded: words.length + progressItems.length,
    };
  } catch (error) {
    console.error('Sync from server failed:', error);
    return { success: false, downloaded: 0 };
  }
};

/**
 * Perform bidirectional sync
 */
export const performFullSync = async (
  userId: string
): Promise<{ success: boolean; uploaded: number; downloaded: number }> => {
  // Upload pending changes first
  const uploadResult = await syncToServer();

  // Then download latest data
  const downloadResult = await syncFromServer(userId);

  return {
    success: uploadResult.success && downloadResult.success,
    uploaded: uploadResult.synced,
    downloaded: downloadResult.downloaded,
  };
};

/**
 * Setup auto-sync when connection is restored
 */
export const setupAutoSync = (userId: string) => {
  return NetInfo.addEventListener((state: any) => {
    if (state.isConnected) {
      performFullSync(userId).then((result) => {
        console.log('Auto-sync completed:', result);
      });
    }
  });
};

