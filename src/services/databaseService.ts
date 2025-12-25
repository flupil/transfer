import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSafeDatabase } from '../database/databaseHelper';
import { Platform } from 'react-native';
import { syncQueue } from './syncQueue';

// Only import SQLite on native platforms
let SQLite: any = null;
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
}
import { translate } from '../contexts/LanguageContext';

// Types
interface SyncStatus {
  lastSyncedAt: Date | null;
  isOnline: boolean;
}

class DatabaseService {
  private localDb: SQLite.SQLiteDatabase | null = null;
  private syncStatus: SyncStatus = {
    lastSyncedAt: null,
    isOnline: true
  };

  constructor() {
    this.initializeLocalDb();
    this.loadSyncStatus();
  }

  private async initializeLocalDb() {
    this.localDb = getSafeDatabase();
  }

  private async loadSyncStatus() {
    try {
      const status = await AsyncStorage.getItem('syncStatus');
      if (status) {
        this.syncStatus = JSON.parse(status);
      }
    } catch (error) {
      // Silent error - not critical, app can continue
      console.error('Failed to load sync status:', error);
    }
  }

  private async saveSyncStatus() {
    try {
      await AsyncStorage.setItem('syncStatus', JSON.stringify(this.syncStatus));
    } catch (error) {
      // Silent error - not critical, app can continue
      console.error('Failed to save sync status:', error);
    }
  }

  // Generic CRUD Operations with offline support
  async create<T extends { id?: string }>(
    collectionName: string,
    data: T,
    tableName?: string
  ): Promise<T & { id: string }> {
    const id = data.id || this.generateId();
    const timestamp = new Date().toISOString();
    const dataWithId = { ...data, id, createdAt: timestamp, updatedAt: timestamp };

    try {
      // Try to save to Firestore first
      if (this.syncStatus.isOnline) {
        await setDoc(doc(db, collectionName, id), {
          ...dataWithId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else {
        // Offline: add to sync queue
        await syncQueue.add({
          type: 'create',
          collection: collectionName,
          docId: id,
          data: dataWithId,
        });
      }
    } catch (error) {
      // Save locally when offline - this is expected behavior
      console.log('Offline mode: saving locally');
      console.error('Firestore save error:', error);
      this.syncStatus.isOnline = false;

      // Add to queue for retry when back online
      await syncQueue.add({
        type: 'create',
        collection: collectionName,
        docId: id,
        data: dataWithId,
      });
    }

    // Always save to local SQLite for offline support
    if (this.localDb && tableName) {
      try {
        await this.saveToLocalDb(tableName, dataWithId);
      } catch (error) {
        // Log error but don't block the operation
        console.error('Failed to save to local database:', error);
      }
    }

    return dataWithId as T & { id: string };
  }

  async read<T>(
    collectionName: string,
    docId: string,
    tableName?: string
  ): Promise<T | null> {
    try {
      // Try to get from Firestore first
      if (this.syncStatus.isOnline) {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as T;

          // Update local cache
          if (this.localDb && tableName) {
            await this.saveToLocalDb(tableName, data);
          }

          return data;
        }
      }
    } catch (error) {
      // Fallback to local - this is expected in offline mode
      console.log('Reading from local cache');
      console.error('Firestore read error:', error);
      this.syncStatus.isOnline = false;
    }

    // Fallback to local database
    if (this.localDb && tableName) {
      return await this.readFromLocalDb<T>(tableName, docId);
    }

    return null;
  }

  async update<T extends { id: string }>(
    collectionName: string,
    docId: string,
    updates: Partial<T>,
    tableName?: string
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const dataWithTimestamp = { ...updates, updatedAt: timestamp };

    try {
      // Try to update in Firestore
      if (this.syncStatus.isOnline) {
        await updateDoc(doc(db, collectionName, docId), {
          ...dataWithTimestamp,
          updatedAt: serverTimestamp()
        });
      } else {
        // Offline: add to sync queue
        await syncQueue.add({
          type: 'update',
          collection: collectionName,
          docId,
          data: dataWithTimestamp,
        });
      }
    } catch (error) {
      // Update locally when offline - this is expected behavior
      console.log('Offline mode: updating locally');
      console.error('Firestore update error:', error);
      this.syncStatus.isOnline = false;

      // Add to queue for retry when back online
      await syncQueue.add({
        type: 'update',
        collection: collectionName,
        docId,
        data: dataWithTimestamp,
      });
    }

    // Update local database
    if (this.localDb && tableName) {
      await this.updateLocalDb(tableName, docId, dataWithTimestamp);
    }
  }

  async delete(
    collectionName: string,
    docId: string,
    tableName?: string
  ): Promise<void> {
    try {
      // Try to delete from Firestore
      if (this.syncStatus.isOnline) {
        await deleteDoc(doc(db, collectionName, docId));
      } else {
        // Offline: add to sync queue
        await syncQueue.add({
          type: 'delete',
          collection: collectionName,
          docId,
        });
      }
    } catch (error) {
      // Delete locally when offline - this is expected behavior
      console.log('Offline mode: deleting locally');
      console.error('Firestore delete error:', error);
      this.syncStatus.isOnline = false;

      // Add to queue for retry when back online
      await syncQueue.add({
        type: 'delete',
        collection: collectionName,
        docId,
      });
    }

    // Delete from local database
    if (this.localDb && tableName) {
      await this.deleteFromLocalDb(tableName, docId);
    }
  }

  async list<T>(
    collectionName: string,
    filters?: { field: string; operator: string; value: any }[],
    tableName?: string
  ): Promise<T[]> {
    try {
      // Try to get from Firestore
      if (this.syncStatus.isOnline) {
        let q = collection(db, collectionName);

        // Apply filters if provided
        if (filters && filters.length > 0) {
          const constraints = filters.map(f =>
            where(f.field, f.operator as any, f.value)
          );
          q = query(q, ...constraints) as any;
        }

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];

        // Update local cache
        if (this.localDb && tableName) {
          for (const item of data) {
            await this.saveToLocalDb(tableName, item);
          }
        }

        return data;
      }
    } catch (error) {
      // Fallback to local - this is expected in offline mode
      console.log('Reading list from local cache');
      console.error('Firestore list error:', error);
      this.syncStatus.isOnline = false;
    }

    // Fallback to local database
    if (this.localDb && tableName) {
      return await this.listFromLocalDb<T>(tableName, filters);
    }

    return [];
  }

  // Local SQLite operations
  private async saveToLocalDb(tableName: string, data: any): Promise<void> {
    if (!this.localDb) return;

    const columns = Object.keys(data);
    const values = columns.map(col => {
      const val = data[col];
      if (typeof val === 'object' && val !== null) {
        return JSON.stringify(val);
      }
      return val;
    });

    const placeholders = columns.map(() => '?').join(',');
    const updatePlaceholders = columns.map(col => `${col} = ?`).join(',');

    const sql = `
      INSERT OR REPLACE INTO ${tableName} (${columns.join(',')})
      VALUES (${placeholders})
    `;

    try {
      await this.localDb.execAsync([{ sql, args: values }]);
    } catch (error) {
      console.error(`Failed to save to local ${tableName}:`, error);
    }
  }

  private async readFromLocalDb<T>(tableName: string, id: string): Promise<T | null> {
    if (!this.localDb) return null;

    try {
      const result = await this.localDb.execAsync([
        { sql: `SELECT * FROM ${tableName} WHERE id = ?`, args: [id] }
      ]);

      if (result[0].rows && result[0].rows.length > 0) {
        return this.parseLocalData(result[0].rows[0]) as T;
      }
    } catch (error) {
      console.error(`Failed to read from local ${tableName}:`, error);
    }

    return null;
  }

  private async updateLocalDb(tableName: string, id: string, updates: any): Promise<void> {
    if (!this.localDb) return;

    const columns = Object.keys(updates);
    const values = columns.map(col => {
      const val = updates[col];
      if (typeof val === 'object' && val !== null) {
        return JSON.stringify(val);
      }
      return val;
    });
    values.push(id); // Add id for WHERE clause

    const updatePlaceholders = columns.map(col => `${col} = ?`).join(',');
    const sql = `UPDATE ${tableName} SET ${updatePlaceholders}, syncStatus = 'pending' WHERE id = ?`;

    try {
      await this.localDb.execAsync([{ sql, args: values }]);
    } catch (error) {
      console.error(`Failed to update local ${tableName}:`, error);
    }
  }

  private async deleteFromLocalDb(tableName: string, id: string): Promise<void> {
    if (!this.localDb) return;

    try {
      await this.localDb.execAsync([
        { sql: `DELETE FROM ${tableName} WHERE id = ?`, args: [id] }
      ]);
    } catch (error) {
      console.error(`Failed to delete from local ${tableName}:`, error);
    }
  }

  private async listFromLocalDb<T>(
    tableName: string,
    filters?: { field: string; operator: string; value: any }[]
  ): Promise<T[]> {
    if (!this.localDb) return [];

    let sql = `SELECT * FROM ${tableName}`;
    const args: any[] = [];

    if (filters && filters.length > 0) {
      const whereClauses = filters.map(f => {
        args.push(f.value);
        return `${f.field} ${this.mapOperator(f.operator)} ?`;
      });
      sql += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    try {
      const result = await this.localDb.execAsync([{ sql, args }]);
      if (result[0].rows) {
        return result[0].rows.map(row => this.parseLocalData(row) as T);
      }
    } catch (error) {
      console.error(`Failed to list from local ${tableName}:`, error);
    }

    return [];
  }

  private parseLocalData(data: any): any {
    const parsed: any = {};
    for (const key in data) {
      try {
        // Try to parse JSON fields
        if (typeof data[key] === 'string' &&
            (data[key].startsWith('{') || data[key].startsWith('['))) {
          parsed[key] = JSON.parse(data[key]);
        } else {
          parsed[key] = data[key];
        }
      } catch {
        parsed[key] = data[key];
      }
    }
    return parsed;
  }

  private mapOperator(operator: string): string {
    switch(operator) {
      case '==': return '=';
      case '!=': return '!=';
      case '<': return '<';
      case '<=': return '<=';
      case '>': return '>';
      case '>=': return '>=';
      default: return '=';
    }
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Sync operations - Process pending operations from queue
  async processSyncQueue(): Promise<void> {
    if (!this.syncStatus.isOnline) {
      console.log('Cannot sync - offline mode');
      return;
    }

    const queueSize = await syncQueue.size();
    if (queueSize === 0) {
      console.log('No pending operations to sync');
      return;
    }

    console.log(`Processing ${queueSize} pending operations...`);
    const operations = await syncQueue.getAll();
    let successCount = 0;
    let failCount = 0;

    for (const op of operations) {
      try {
        // Execute the operation based on type
        switch (op.type) {
          case 'create':
            await setDoc(doc(db, op.collection, op.docId), {
              ...op.data,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            break;

          case 'update':
            await updateDoc(doc(db, op.collection, op.docId), {
              ...op.data,
              updatedAt: serverTimestamp()
            });
            break;

          case 'delete':
            await deleteDoc(doc(db, op.collection, op.docId));
            break;
        }

        // Operation succeeded, remove from queue
        await syncQueue.remove(op.id);
        successCount++;
      } catch (error) {
        console.error(`Failed to sync operation ${op.id}:`, error);

        // Increment retry count or remove if max retries exceeded
        const shouldRetry = await syncQueue.incrementRetry(op.id);
        if (!shouldRetry) {
          console.error(`Operation ${op.id} permanently failed after max retries`);
        }
        failCount++;
      }
    }

    this.syncStatus.lastSyncedAt = new Date();
    await this.saveSyncStatus();

    console.log(`Sync completed: ${successCount} succeeded, ${failCount} failed`);
  }

  private getCollectionName(tableName: string): string {
    const mapping: { [key: string]: string } = {
      'users': 'users',
      'workout_logs': 'workoutLogs',
      'nutrition_logs': 'nutritionLogs',
      'exercises': 'exercises',
      'workout_plans': 'workoutPlans',
      'food_items': 'foodItems',
      'calendar_events': 'calendarEvents',
      'attendance': 'attendance'
    };
    return mapping[tableName] || tableName;
  }

  // Check online status and trigger sync if we're back online
  async checkOnlineStatus(): Promise<boolean> {
    const wasOffline = !this.syncStatus.isOnline;

    try {
      // Try a simple Firestore operation to check connectivity
      const testDoc = await getDoc(doc(db, 'system', 'ping'));
      this.syncStatus.isOnline = true;
      await this.saveSyncStatus();

      // If we just came back online, process pending operations
      if (wasOffline) {
        console.log('Back online - processing pending operations');
        await this.processSyncQueue();
      }

      return true;
    } catch (error) {
      this.syncStatus.isOnline = false;
      await this.saveSyncStatus();
      return false;
    }
  }

  // Get sync status info (for UI indicator)
  async getSyncInfo(): Promise<{ pendingOps: number; lastSync: Date | null; isOnline: boolean }> {
    const pendingOps = await syncQueue.size();
    return {
      pendingOps,
      lastSync: this.syncStatus.lastSyncedAt,
      isOnline: this.syncStatus.isOnline
    };
  }
}

export const databaseService = new DatabaseService();