import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  DocumentChange,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getSafeDatabase } from '../database/databaseHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

interface RealtimeListener {
  id: string;
  unsubscribe: Unsubscribe;
  collection: string;
  userId?: string;
}

class RealtimeService {
  private listeners: Map<string, RealtimeListener> = new Map();
  private localDb = getSafeDatabase();
  private isOnline: boolean = true;

  // Subscribe to user's workout logs in real-time
  subscribeToWorkoutLogs(
    userId: string,
    onUpdate: (logs: any[]) => void,
    onError?: (error: Error) => void
  ): string {
    const listenerId = `workoutLogs_${userId}_${Date.now()}`;

    try {
      const q = query(
        collection(db, 'workoutLogs'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        async (snapshot: QuerySnapshot) => {
          const logs: any[] = [];
          const changes: DocumentChange[] = snapshot.docChanges();

          // Process changes
          for (const change of changes) {
            const data = { id: change.doc.id, ...change.doc.data() };

            if (change.type === 'added' || change.type === 'modified') {
              logs.push(data);
              // Update local database
              await this.updateLocalDatabase('workout_logs', data);
            } else if (change.type === 'removed') {
              // Remove from local database
              await this.removeFromLocalDatabase('workout_logs', change.doc.id);
            }
          }

          // Get all current documents
          const allLogs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          onUpdate(allLogs);
        },
        (error) => {
          Alert.alert('Error', 'Realtime workout logs error. Please try again.');

          console.error('Realtime workout logs error:', error);
          if (onError) onError(error);
          this.handleOffline();
        }
      );

      this.listeners.set(listenerId, {
        id: listenerId,
        unsubscribe,
        collection: 'workoutLogs',
        userId
      });

      return listenerId;
    } catch (error) {
      Alert.alert('Error', 'Failed to subscribe to workout logs. Please try again.');

      console.error('Failed to subscribe to workout logs:', error);
      this.handleOffline();
      return '';
    }
  }

  // Subscribe to user's nutrition logs in real-time
  subscribeToNutritionLogs(
    userId: string,
    onUpdate: (logs: any[]) => void,
    onError?: (error: Error) => void
  ): string {
    const listenerId = `nutritionLogs_${userId}_${Date.now()}`;

    try {
      const q = query(
        collection(db, 'nutritionLogs'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        async (snapshot: QuerySnapshot) => {
          const logs: any[] = [];
          const changes: DocumentChange[] = snapshot.docChanges();

          for (const change of changes) {
            const data = { id: change.doc.id, ...change.doc.data() };

            if (change.type === 'added' || change.type === 'modified') {
              logs.push(data);
              await this.updateLocalDatabase('nutrition_logs', data);
            } else if (change.type === 'removed') {
              await this.removeFromLocalDatabase('nutrition_logs', change.doc.id);
            }
          }

          const allLogs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          onUpdate(allLogs);
        },
        (error) => {
          Alert.alert('Error', 'Realtime nutrition logs error. Please try again.');

          console.error('Realtime nutrition logs error:', error);
          if (onError) onError(error);
          this.handleOffline();
        }
      );

      this.listeners.set(listenerId, {
        id: listenerId,
        unsubscribe,
        collection: 'nutritionLogs',
        userId
      });

      return listenerId;
    } catch (error) {
      Alert.alert('Error', 'Failed to subscribe to nutrition logs. Please try again.');

      console.error('Failed to subscribe to nutrition logs:', error);
      this.handleOffline();
      return '';
    }
  }

  // Subscribe to user's progress data in real-time
  subscribeToProgressData(
    userId: string,
    onUpdate: (progress: any) => void,
    onError?: (error: Error) => void
  ): string {
    const listenerId = `progress_${userId}_${Date.now()}`;

    try {
      const q = query(
        collection(db, 'progressData'),
        where('userId', '==', userId),
        orderBy('date', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        async (snapshot: QuerySnapshot) => {
          const progressData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Calculate aggregated progress
          const progress = this.aggregateProgressData(progressData);
          onUpdate(progress);

          // Update local storage
          for (const data of progressData) {
            await this.updateLocalDatabase('progress_data', data);
          }
        },
        (error) => {
          Alert.alert('Error', 'Realtime progress data error. Please try again.');

          console.error('Realtime progress data error:', error);
          if (onError) onError(error);
          this.handleOffline();
        }
      );

      this.listeners.set(listenerId, {
        id: listenerId,
        unsubscribe,
        collection: 'progressData',
        userId
      });

      return listenerId;
    } catch (error) {
      Alert.alert('Error', 'Failed to subscribe to progress data. Please try again.');

      console.error('Failed to subscribe to progress data:', error);
      this.handleOffline();
      return '';
    }
  }

  // Subscribe to gym announcements (for all gym members)
  subscribeToGymAnnouncements(
    gymId: string,
    onUpdate: (announcements: any[]) => void
  ): string {
    const listenerId = `announcements_${gymId}_${Date.now()}`;

    try {
      const q = query(
        collection(db, 'announcements'),
        where('gymId', '==', gymId),
        where('isActive', '==', true),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot) => {
          const announcements = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          onUpdate(announcements);
        },
        (error) => {
          Alert.alert('Error', 'Realtime announcements error. Please try again.');

          console.error('Realtime announcements error:', error);
          this.handleOffline();
        }
      );

      this.listeners.set(listenerId, {
        id: listenerId,
        unsubscribe,
        collection: 'announcements'
      });

      return listenerId;
    } catch (error) {
      Alert.alert('Error', 'Failed to subscribe to announcements. Please try again.');

      console.error('Failed to subscribe to announcements:', error);
      return '';
    }
  }

  // Subscribe to coach's assigned clients (for coaches)
  subscribeToCoachClients(
    coachId: string,
    onUpdate: (clients: any[]) => void
  ): string {
    const listenerId = `clients_${coachId}_${Date.now()}`;

    try {
      const q = query(
        collection(db, 'users'),
        where('coachId', '==', coachId),
        where('isActive', '==', true)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot: QuerySnapshot) => {
          const clients = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          onUpdate(clients);
        },
        (error) => {
          Alert.alert('Error', 'Realtime clients error. Please try again.');

          console.error('Realtime clients error:', error);
          this.handleOffline();
        }
      );

      this.listeners.set(listenerId, {
        id: listenerId,
        unsubscribe,
        collection: 'users'
      });

      return listenerId;
    } catch (error) {
      Alert.alert('Error', 'Failed to subscribe to coach clients. Please try again.');

      console.error('Failed to subscribe to coach clients:', error);
      return '';
    }
  }

  // Unsubscribe from a specific listener
  unsubscribe(listenerId: string): void {
    const listener = this.listeners.get(listenerId);
    if (listener) {
      listener.unsubscribe();
      this.listeners.delete(listenerId);
    }
  }

  // Unsubscribe from all listeners
  unsubscribeAll(): void {
    this.listeners.forEach(listener => {
      listener.unsubscribe();
    });
    this.listeners.clear();
  }

  // Update local database with real-time data
  private async updateLocalDatabase(tableName: string, data: any): Promise<void> {
    if (!this.localDb) return;

    try {
      const columns = Object.keys(data).filter(key => key !== 'id');
      const values = columns.map(col => {
        const val = data[col];
        if (typeof val === 'object' && val !== null) {
          return JSON.stringify(val);
        }
        return val;
      });

      // Add id at the beginning
      columns.unshift('id');
      values.unshift(data.id);

      const placeholders = columns.map(() => '?').join(',');
      const updatePlaceholders = columns.slice(1).map(col => `${col} = ?`).join(',');

      const sql = `
        INSERT INTO ${tableName} (${columns.join(',')})
        VALUES (${placeholders})
        ON CONFLICT(id) DO UPDATE SET ${updatePlaceholders}, syncStatus = 'synced'
      `;

      await this.localDb.execAsync([{
        sql,
        args: [...values, ...values.slice(1)]
      }]);
    } catch (error) {
      console.error(`Failed to update local ${tableName}:`, error);
    }
  }

  // Remove from local database
  private async removeFromLocalDatabase(tableName: string, id: string): Promise<void> {
    if (!this.localDb) return;

    try {
      await this.localDb.execAsync([
        { sql: `DELETE FROM ${tableName} WHERE id = ?`, args: [id] }
      ]);
    } catch (error) {
      console.error(`Failed to remove from local ${tableName}:`, error);
    }
  }

  // Handle offline mode
  private async handleOffline(): Promise<void> {
    this.isOnline = false;
    await AsyncStorage.setItem('isOnline', 'false');
    console.log('Switched to offline mode');
  }

  // Handle online mode
  private async handleOnline(): Promise<void> {
    this.isOnline = true;
    await AsyncStorage.setItem('isOnline', 'true');
    console.log('Switched to online mode');
  }

  // Aggregate progress data
  private aggregateProgressData(data: any[]): any {
    const progress = {
      totalWorkouts: 0,
      totalCaloriesBurned: 0,
      averageWorkoutDuration: 0,
      currentStreak: 0,
      personalRecords: [],
      weeklyProgress: {},
      monthlyProgress: {}
    };

    // Process each progress entry
    data.forEach(entry => {
      if (entry.type === 'workout') {
        progress.totalWorkouts++;
        progress.totalCaloriesBurned += entry.calories || 0;
      }
      if (entry.personalRecord) {
        progress.personalRecords.push(entry.personalRecord);
      }
    });

    // Calculate average duration
    if (progress.totalWorkouts > 0 && data.length > 0) {
      const totalDuration = data.reduce((sum, entry) =>
        sum + (entry.duration || 0), 0
      );
      progress.averageWorkoutDuration = totalDuration / progress.totalWorkouts;
    }

    return progress;
  }

  // Check connection status
  async checkConnectionStatus(): Promise<boolean> {
    try {
      // Try to fetch a simple document to check connection
      const testCollection = collection(db, 'system');
      const unsubscribe = onSnapshot(
        testCollection,
        () => {
          this.handleOnline();
          unsubscribe();
        },
        () => {
          this.handleOffline();
          unsubscribe();
        }
      );
      return this.isOnline;
    } catch (error) {
      this.handleOffline();
      return false;
    }
  }
}

export const realtimeService = new RealtimeService();