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
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSafeDatabase } from '../database/databaseHelper';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

// Types
interface SyncStatus {
  lastSyncedAt: Date | null;
  pendingChanges: number;
  isOnline: boolean;
}

class DatabaseService {
  private localDb: SQLite.SQLiteDatabase | null = null;
  private syncStatus: SyncStatus = {
    lastSyncedAt: null,
    pendingChanges: 0,
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
      Alert.alert('Error', 'Failed to load sync status. Please try again.');

      console.error('Failed to load sync status:', error);
    }
  }

  private async saveSyncStatus() {
    try {
      await AsyncStorage.setItem('syncStatus', JSON.stringify(this.syncStatus));
    } catch (error) {
      Alert.alert('Error', 'Failed to save sync status. Please try again.');

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
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save to Firestore, saving locally. Please try again.');

      console.error('Failed to save to Firestore, saving locally:', error);
      this.syncStatus.isOnline = false;
      this.syncStatus.pendingChanges++;
    }

    // Always save to local SQLite for offline support
    if (this.localDb && tableName) {
      try {
        await this.saveToLocalDb(tableName, dataWithId);
      } catch (error) {
        Alert.alert('Error', 'Failed to save to local database. Please try again.');

        console.error('Failed to save to local database:', error);
      }
    }

    await this.saveSyncStatus();
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
      Alert.alert('Error', 'Failed to read from Firestore, reading locally. Please try again.');

      console.error('Failed to read from Firestore, reading locally:', error);
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
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update in Firestore, updating locally. Please try again.');

      console.error('Failed to update in Firestore, updating locally:', error);
      this.syncStatus.isOnline = false;
      this.syncStatus.pendingChanges++;
    }

    // Update local database
    if (this.localDb && tableName) {
      await this.updateLocalDb(tableName, docId, dataWithTimestamp);
    }

    await this.saveSyncStatus();
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
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to delete from Firestore, deleting locally. Please try again.');

      console.error('Failed to delete from Firestore, deleting locally:', error);
      this.syncStatus.isOnline = false;
      this.syncStatus.pendingChanges++;
    }

    // Delete from local database
    if (this.localDb && tableName) {
      await this.deleteFromLocalDb(tableName, docId);
    }

    await this.saveSyncStatus();
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
      Alert.alert('Error', 'Failed to list from Firestore, listing locally. Please try again.');

      console.error('Failed to list from Firestore, listing locally:', error);
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

  // Sync operations
  async syncWithCloud(): Promise<void> {
    if (!this.syncStatus.isOnline) {
      console.log('Cannot sync - offline mode');
      return;
    }

    if (this.syncStatus.pendingChanges === 0) {
      console.log('No pending changes to sync');
      return;
    }

    try {
      // Sync pending local changes to Firestore
      if (this.localDb) {
        const tables = ['users', 'workout_logs', 'nutrition_logs', 'exercises'];

        for (const table of tables) {
          const pendingRows = await this.localDb.execAsync([
            { sql: `SELECT * FROM ${table} WHERE syncStatus = 'pending'`, args: [] }
          ]);

          if (pendingRows[0].rows && pendingRows[0].rows.length > 0) {
            for (const row of pendingRows[0].rows) {
              const data = this.parseLocalData(row);
              const collectionName = this.getCollectionName(table);

              await setDoc(doc(db, collectionName, data.id), data);

              // Mark as synced
              await this.localDb.execAsync([
                {
                  sql: `UPDATE ${table} SET syncStatus = 'synced', lastSyncedAt = ? WHERE id = ?`,
                  args: [new Date().toISOString(), data.id]
                }
              ]);
            }
          }
        }
      }

      this.syncStatus.pendingChanges = 0;
      this.syncStatus.lastSyncedAt = new Date();
      await this.saveSyncStatus();

      console.log('Sync completed successfully');
    } catch (error) {
      Alert.alert('Error', 'Sync failed. Please try again.');

      console.error('Sync failed:', error);
      throw error;
    }
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

  // Check online status
  async checkOnlineStatus(): Promise<boolean> {
    try {
      // Try a simple Firestore operation to check connectivity
      const testDoc = await getDoc(doc(db, 'system', 'ping'));
      this.syncStatus.isOnline = true;
      await this.saveSyncStatus();
      return true;
    } catch (error) {
      this.syncStatus.isOnline = false;
      await this.saveSyncStatus();
      return false;
    }
  }
}

export const databaseService = new DatabaseService();