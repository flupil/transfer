import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';
// import NetInfo from '@react-native-community/netinfo';

interface QueuedAction {
  id: string;
  type: 'workout' | 'nutrition' | 'progress' | 'profile';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retryCount: number;
}

interface CachedData {
  key: string;
  data: any;
  timestamp: string;
  expiresAt?: string;
}

const STORAGE_KEYS = {
  QUEUE: '@offline_queue',
  CACHE: '@offline_cache',
  LAST_SYNC: '@last_sync',
};

const MAX_RETRY_COUNT = 3;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

class OfflineService {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    this.initializeNetworkListener();
  }

  private initializeNetworkListener() {
    // NetInfo requires expo-network or specific setup
    // For now, assume online
    this.isOnline = true;

    // NetInfo.addEventListener((state) => {
    //   const wasOffline = !this.isOnline;
    //   this.isOnline = state.isConnected ?? false;

    //   // Notify listeners
    //   this.listeners.forEach(listener => listener(this.isOnline));

    //   // If we just came online, attempt to sync
    //   if (wasOffline && this.isOnline) {
    //     this.syncQueuedActions();
    //   }
    // });
  }

  // Add listener for network state changes
  addNetworkListener(callback: (isOnline: boolean) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Queue an action to be synced when online
  async queueAction(
    type: QueuedAction['type'],
    action: QueuedAction['action'],
    data: any
  ): Promise<void> {
    try {
      const queue = await this.getQueue();
      const newAction: QueuedAction = {
        id: `${Date.now()}_${Math.random()}`,
        type,
        action,
        data,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      queue.push(newAction);
      await AsyncStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(queue));

      // Try to sync immediately if online
      if (this.isOnline) {
        this.syncQueuedActions();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to queue action. Please try again.');

      console.error('Failed to queue action:', error);
    }
  }

  // Get queued actions
  private async getQueue(): Promise<QueuedAction[]> {
    try {
      const queueData = await AsyncStorage.getItem(STORAGE_KEYS.QUEUE);
      return queueData ? JSON.parse(queueData) : [];
    } catch (error) {
      Alert.alert('Error', 'Failed to get queue. Please try again.');

      console.error('Failed to get queue:', error);
      return [];
    }
  }

  // Sync queued actions
  async syncQueuedActions(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return;

    this.syncInProgress = true;
    try {
      const queue = await this.getQueue();
      const remainingQueue: QueuedAction[] = [];

      for (const action of queue) {
        try {
          await this.processQueuedAction(action);
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          action.retryCount++;

          if (action.retryCount < MAX_RETRY_COUNT) {
            remainingQueue.push(action);
          }
        }
      }

      await AsyncStorage.setItem(STORAGE_KEYS.QUEUE, JSON.stringify(remainingQueue));
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      Alert.alert('Error', 'Sync failed. Please try again.');

      console.error('Sync failed:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  // Process a single queued action
  private async processQueuedAction(action: QueuedAction): Promise<void> {
    // In a real app, this would make API calls to sync with backend
    // For now, we'll just simulate the sync
    console.log(`Processing queued action: ${action.type} - ${action.action}`);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Here you would implement actual sync logic based on action type
    switch (action.type) {
      case 'workout':
        // Sync workout data
        break;
      case 'nutrition':
        // Sync nutrition data
        break;
      case 'progress':
        // Sync progress data
        break;
      case 'profile':
        // Sync profile data
        break;
    }
  }

  // Cache data for offline access
  async cacheData(key: string, data: any, expiresInMs?: number): Promise<void> {
    try {
      const cache = await this.getCache();
      const cacheEntry: CachedData = {
        key,
        data,
        timestamp: new Date().toISOString(),
        expiresAt: expiresInMs
          ? new Date(Date.now() + expiresInMs).toISOString()
          : new Date(Date.now() + CACHE_DURATION).toISOString(),
      };

      cache[key] = cacheEntry;
      await AsyncStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(cache));
    } catch (error) {
      Alert.alert('Error', 'Failed to cache data. Please try again.');

      console.error('Failed to cache data:', error);
    }
  }

  // Get cached data
  async getCachedData<T>(key: string): Promise<T | null> {
    try {
      const cache = await this.getCache();
      const cacheEntry = cache[key];

      if (!cacheEntry) return null;

      // Check if cache has expired
      if (cacheEntry.expiresAt && new Date(cacheEntry.expiresAt) < new Date()) {
        delete cache[key];
        await AsyncStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(cache));
        return null;
      }

      return cacheEntry.data as T;
    } catch (error) {
      Alert.alert('Error', 'Failed to get cached data. Please try again.');

      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  // Get all cache
  private async getCache(): Promise<{ [key: string]: CachedData }> {
    try {
      const cacheData = await AsyncStorage.getItem(STORAGE_KEYS.CACHE);
      return cacheData ? JSON.parse(cacheData) : {};
    } catch (error) {
      Alert.alert('Error', 'Failed to get cache. Please try again.');

      console.error('Failed to get cache:', error);
      return {};
    }
  }

  // Clear expired cache entries
  async clearExpiredCache(): Promise<void> {
    try {
      const cache = await this.getCache();
      const now = new Date();
      let hasChanges = false;

      for (const key in cache) {
        if (cache[key].expiresAt && new Date(cache[key].expiresAt) < now) {
          delete cache[key];
          hasChanges = true;
        }
      }

      if (hasChanges) {
        await AsyncStorage.setItem(STORAGE_KEYS.CACHE, JSON.stringify(cache));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to clear expired cache. Please try again.');

      console.error('Failed to clear expired cache:', error);
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    isOnline: boolean;
    queueLength: number;
    lastSync: string | null;
  }> {
    const queue = await this.getQueue();
    const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);

    return {
      isOnline: this.isOnline,
      queueLength: queue.length,
      lastSync,
    };
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.QUEUE,
        STORAGE_KEYS.CACHE,
        STORAGE_KEYS.LAST_SYNC,
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to clear offline data. Please try again.');

      console.error('Failed to clear offline data:', error);
    }
  }

  // Check if online
  getIsOnline(): boolean {
    return this.isOnline;
  }
}

// Create singleton instance
const offlineService = new OfflineService();

// Export functions for easy use
export const queueAction = (
  type: QueuedAction['type'],
  action: QueuedAction['action'],
  data: any
) => offlineService.queueAction(type, action, data);

export const cacheData = (key: string, data: any, expiresInMs?: number) =>
  offlineService.cacheData(key, data, expiresInMs);

export const getCachedData = <T>(key: string) =>
  offlineService.getCachedData<T>(key);

export const syncQueuedActions = () => offlineService.syncQueuedActions();

export const getSyncStatus = () => offlineService.getSyncStatus();

export const clearOfflineData = () => offlineService.clearOfflineData();

export const clearExpiredCache = () => offlineService.clearExpiredCache();

export const isOnline = () => offlineService.getIsOnline();

export const addNetworkListener = (callback: (isOnline: boolean) => void) =>
  offlineService.addNetworkListener(callback);

export default offlineService;