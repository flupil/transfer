import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { databaseService } from './databaseService';
import { realtimeService } from './realtimeService';
import { getSafeDatabase } from '../database/databaseHelper';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

interface SyncQueue {
  id: string;
  table: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: Date;
  attempts: number;
}

class SyncManager {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncQueue: SyncQueue[] = [];
  private syncInterval: NodeJS.Timeout | null = null;
  private netInfoUnsubscribe: (() => void) | null = null;
  private localDb = getSafeDatabase();

  constructor() {
    this.initializeNetworkListener();
    this.loadSyncQueue();
    this.startPeriodicSync();
  }

  // Initialize network state listener
  private initializeNetworkListener(): void {
    this.netInfoUnsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable !== false;

      console.log(`Network status: ${this.isOnline ? 'Online' : 'Offline'}`);

      // If we just came online, trigger sync
      if (wasOffline && this.isOnline) {
        console.log('Connection restored, starting sync...');
        this.performSync();
      }
    });

    // Check initial network state
    NetInfo.fetch().then(state => {
      this.isOnline = state.isConnected && state.isInternetReachable !== false;
    });
  }

  // Load sync queue from storage
  private async loadSyncQueue(): Promise<void> {
    try {
      const queue = await AsyncStorage.getItem('syncQueue');
      if (queue) {
        this.syncQueue = JSON.parse(queue);
        console.log(`Loaded ${this.syncQueue.length} items from sync queue`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load sync queue. Please try again.');

      console.error('Failed to load sync queue:', error);
    }
  }

  // Save sync queue to storage
  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    } catch (error) {
      Alert.alert('Error', 'Failed to save sync queue. Please try again.');

      console.error('Failed to save sync queue:', error);
    }
  }

  // Add item to sync queue
  async addToSyncQueue(
    table: string,
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    data: any
  ): Promise<void> {
    const queueItem: SyncQueue = {
      id: `${Date.now()}_${Math.random()}`,
      table,
      operation,
      data,
      timestamp: new Date(),
      attempts: 0
    };

    this.syncQueue.push(queueItem);
    await this.saveSyncQueue();

    // Try to sync immediately if online
    if (this.isOnline && !this.isSyncing) {
      this.performSync();
    }
  }

  // Start periodic sync (every 5 minutes)
  private startPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.performSync();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  // Perform sync operation
  async performSync(): Promise<void> {
    if (this.isSyncing || !this.isOnline) {
      return;
    }

    this.isSyncing = true;
    console.log('Starting sync process...');

    try {
      // Sync pending items from queue
      await this.processSyncQueue();

      // Sync all tables with pending changes
      await this.syncPendingChanges();

      // Pull latest data from cloud
      await this.pullLatestData();

      // Update last sync time
      await AsyncStorage.setItem('lastSyncTime', new Date().toISOString());

      console.log('Sync completed successfully');
    } catch (error) {
      Alert.alert('Error', 'Sync failed. Please try again.');

      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Process sync queue
  private async processSyncQueue(): Promise<void> {
    const itemsToRemove: string[] = [];

    for (const item of this.syncQueue) {
      try {
        item.attempts++;

        switch (item.operation) {
          case 'CREATE':
            await databaseService.create(
              this.getCollectionName(item.table),
              item.data,
              item.table
            );
            break;

          case 'UPDATE':
            await databaseService.update(
              this.getCollectionName(item.table),
              item.data.id,
              item.data,
              item.table
            );
            break;

          case 'DELETE':
            await databaseService.delete(
              this.getCollectionName(item.table),
              item.data.id,
              item.table
            );
            break;
        }

        itemsToRemove.push(item.id);
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);

        // Remove after 3 failed attempts
        if (item.attempts >= 3) {
          itemsToRemove.push(item.id);
          console.error(`Removing item ${item.id} after 3 failed attempts`);
        }
      }
    }

    // Remove successfully synced items
    this.syncQueue = this.syncQueue.filter(item => !itemsToRemove.includes(item.id));
    await this.saveSyncQueue();
  }

  // Sync pending changes from local database
  private async syncPendingChanges(): Promise<void> {
    if (!this.localDb) return;

    const tables = [
      'workout_logs',
      'nutrition_logs',
      'exercises',
      'progress_data',
      'calendar_events'
    ];

    for (const table of tables) {
      try {
        // Get all pending items
        const pendingItems = await this.localDb.execAsync([
          {
            sql: `SELECT * FROM ${table} WHERE syncStatus = 'pending'`,
            args: []
          }
        ]);

        if (pendingItems[0].rows && pendingItems[0].rows.length > 0) {
          console.log(`Syncing ${pendingItems[0].rows.length} pending items from ${table}`);

          for (const row of pendingItems[0].rows) {
            try {
              const data = this.parseRow(row);
              const collectionName = this.getCollectionName(table);

              // Upload to Firebase
              await databaseService.create(collectionName, data, table);

              // Mark as synced
              await this.localDb.execAsync([
                {
                  sql: `UPDATE ${table} SET syncStatus = 'synced', lastSyncedAt = ? WHERE id = ?`,
                  args: [new Date().toISOString(), data.id]
                }
              ]);
            } catch (error) {
              console.error(`Failed to sync item from ${table}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Failed to sync ${table}:`, error);
      }
    }
  }

  // Pull latest data from cloud
  private async pullLatestData(): Promise<void> {
    try {
      const lastSyncTime = await AsyncStorage.getItem('lastSyncTime');
      const syncFrom = lastSyncTime ? new Date(lastSyncTime) : new Date(0);

      // Get user ID
      const userStr = await AsyncStorage.getItem('user');
      if (!userStr) return;

      const user = JSON.parse(userStr);
      const userId = user.id;

      // Pull workout logs
      const workoutLogs = await databaseService.list(
        'workoutLogs',
        [
          { field: 'userId', operator: '==', value: userId },
          { field: 'updatedAt', operator: '>', value: syncFrom.toISOString() }
        ],
        'workout_logs'
      );

      console.log(`Pulled ${workoutLogs.length} workout logs from cloud`);

      // Pull nutrition logs
      const nutritionLogs = await databaseService.list(
        'nutritionLogs',
        [
          { field: 'userId', operator: '==', value: userId },
          { field: 'updatedAt', operator: '>', value: syncFrom.toISOString() }
        ],
        'nutrition_logs'
      );

      console.log(`Pulled ${nutritionLogs.length} nutrition logs from cloud`);

      // Pull progress data
      const progressData = await databaseService.list(
        'progressData',
        [
          { field: 'userId', operator: '==', value: userId },
          { field: 'updatedAt', operator: '>', value: syncFrom.toISOString() }
        ],
        'progress_data'
      );

      console.log(`Pulled ${progressData.length} progress entries from cloud`);
    } catch (error) {
      Alert.alert('Error', 'Failed to pull latest data. Please try again.');

      console.error('Failed to pull latest data:', error);
    }
  }

  // Parse database row
  private parseRow(row: any): any {
    const parsed: any = {};
    for (const key in row) {
      try {
        // Try to parse JSON fields
        if (typeof row[key] === 'string' &&
            (row[key].startsWith('{') || row[key].startsWith('['))) {
          parsed[key] = JSON.parse(row[key]);
        } else {
          parsed[key] = row[key];
        }
      } catch {
        parsed[key] = row[key];
      }
    }
    return parsed;
  }

  // Get Firestore collection name from table name
  private getCollectionName(tableName: string): string {
    const mapping: { [key: string]: string } = {
      'workout_logs': 'workoutLogs',
      'nutrition_logs': 'nutritionLogs',
      'exercises': 'exercises',
      'workout_plans': 'workoutPlans',
      'meal_plans': 'mealPlans',
      'progress_data': 'progressData',
      'calendar_events': 'calendarEvents',
      'users': 'users'
    };
    return mapping[tableName] || tableName;
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    isOnline: boolean;
    isSyncing: boolean;
    pendingItems: number;
    lastSyncTime: Date | null;
  }> {
    const lastSyncTime = await AsyncStorage.getItem('lastSyncTime');

    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      pendingItems: this.syncQueue.length,
      lastSyncTime: lastSyncTime ? new Date(lastSyncTime) : null
    };
  }

  // Force sync
  async forceSync(): Promise<void> {
    if (this.isOnline) {
      await this.performSync();
    } else {
      throw new Error('Cannot sync while offline');
    }
  }

  // Clear sync queue
  async clearSyncQueue(): Promise<void> {
    this.syncQueue = [];
    await AsyncStorage.removeItem('syncQueue');
  }

  // Cleanup
  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
    }
  }
}

export const syncManager = new SyncManager();