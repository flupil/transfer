import { getSafeDatabase, ensureDatabase } from '../database/databaseHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

interface SyncQueueItem {
  id: number;
  tableName: string;
  operation: string;
  data: string;
  createdAt: string;
  attempts: number;
  lastAttemptAt?: string;
  error?: string;
}

class SyncService {
  private isSyncing = false;
  private maxRetries = 3;

  async syncAll() {
    if (this.isSyncing) return;

    this.isSyncing = true;
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        console.log('No auth token, skipping sync');
        return;
      }

      const pendingItems = await this.getPendingSync();

      for (const item of pendingItems) {
        await this.syncItem(item, token);
      }

      await this.syncFromServer(token);
    } catch (error) {
      Alert.alert('Error', 'Sync error. Please try again.');

      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async getPendingSync(): Promise<SyncQueueItem[]> {
    try {
      const db = getSafeDatabase();
      if (!db) return [];
      const result = await db.getAllAsync(
        'SELECT * FROM sync_queue WHERE attempts < ? ORDER BY createdAt',
        [this.maxRetries]
      ) as SyncQueueItem[];
      return result;
    } catch (error) {
      Alert.alert('Error', 'Failed to get pending sync items. Please try again.');

      console.error('Failed to get pending sync items:', error);
      return [];
    }
  }

  private async syncItem(item: SyncQueueItem, token: string) {
    try {
      const data = JSON.parse(item.data);

      const response = await fetch(`${process.env.API_URL || 'http://localhost:3000/api'}/sync/${item.tableName}`, {
        method: item.operation === 'INSERT' ? 'POST' : item.operation === 'UPDATE' ? 'PUT' : 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await this.removeSyncItem(item.id);
        await this.updateLocalSyncStatus(item.tableName, data.id, 'synced');
      } else {
        throw new Error(`Sync failed with status ${response.status}`);
      }
    } catch (error: any) {
      await this.updateSyncAttempt(item.id, error.message);
    }
  }

  private async removeSyncItem(id: number) {
    try {
      const db = getSafeDatabase();
      if (!db) {
        console.warn('Database not available');
        return;
      }
      await db.runAsync('DELETE FROM sync_queue WHERE id = ?', [id]);
    } catch (error) {
      Alert.alert('Error', 'Failed to remove sync item. Please try again.');

      console.error('Failed to remove sync item:', error);
    }
  }

  private async updateSyncAttempt(id: number, error: string) {
    try {
      const db = getSafeDatabase();
      if (!db) {
        console.warn('Database not available');
        return;
      }
      await db.runAsync(
        'UPDATE sync_queue SET attempts = attempts + 1, lastAttemptAt = datetime("now"), error = ? WHERE id = ?',
        [error, id]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update sync attempt. Please try again.');

      console.error('Failed to update sync attempt:', error);
    }
  }

  private async updateLocalSyncStatus(tableName: string, recordId: string, status: string) {
    try {
      const db = getSafeDatabase();
      if (!db) {
        console.warn('Database not available');
        return;
      }
      await db.runAsync(
        `UPDATE ${tableName} SET syncStatus = ?, lastSyncedAt = datetime("now") WHERE id = ?`,
        [status, recordId]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update local sync status. Please try again.');

      console.error('Failed to update local sync status:', error);
    }
  }

  private async syncFromServer(token: string) {
    try {
      const lastSync = await AsyncStorage.getItem('lastSyncTime');
      const response = await fetch(`${process.env.API_URL || 'http://localhost:3000/api'}/sync/pull${lastSync ? `?since=${lastSync}` : ''}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        await this.applyServerChanges(data);
        await AsyncStorage.setItem('lastSyncTime', new Date().toISOString());
      }
    } catch (error) {
      Alert.alert('Error', 'Pull sync error. Please try again.');

      console.error('Pull sync error:', error);
    }
  }

  private async applyServerChanges(data: any) {
    try {
      const db = getSafeDatabase();
      if (!db) {
        console.warn('Database not available');
        return;
      }

      for (const table of Object.keys(data)) {
        const records = data[table];
        for (const record of records) {
          const columns = Object.keys(record);
          const values = Object.values(record).map(val =>
            val instanceof Date ? val.toISOString() : val
          );
          const placeholders = columns.map(() => '?').join(',');

          await db.runAsync(
            `INSERT OR REPLACE INTO ${table} (${columns.join(',')}) VALUES (${placeholders})`,
            values as any[]
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to apply server changes. Please try again.');

      console.error('Failed to apply server changes:', error);
    }
  }

  async queueForSync(tableName: string, operation: string, data: any) {
    try {
      const db = getSafeDatabase();
      if (!db) {
        console.warn('Database not available');
        return;
      }
      await db.runAsync(
        'INSERT INTO sync_queue (tableName, operation, data, createdAt) VALUES (?, ?, ?, datetime("now"))',
        [tableName, operation, JSON.stringify(data)]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to queue for sync. Please try again.');

      console.error('Failed to queue for sync:', error);
    }
  }
}

export const syncService = new SyncService();