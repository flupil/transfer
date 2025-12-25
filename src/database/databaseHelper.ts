import { Platform } from 'react-native';
import { initializeDatabase, getDatabase as getDb } from './schema';

// Only import SQLite on native platforms
let SQLite: any = null;
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
}

let isInitialized = false;
let initPromise: Promise<void> | null = null;
let cachedDb: any = null;

export const ensureDatabase = async () => {
  if (isInitialized && cachedDb) return;

  if (!initPromise) {
    initPromise = initializeDatabase()
      .then(() => {
        isInitialized = true;
        console.log('Database initialized successfully');
        try {
          cachedDb = getDb();
        } catch (e) {
          console.error('Failed to cache database:', e);
        }
      })
      .catch((error) => {
        console.error('Failed to initialize database:', error);
        // Try to open database directly as fallback
        try {
          cachedDb = SQLite.openDatabaseSync('fitgym.db');
          isInitialized = true;
          console.log('Opened database directly as fallback');
        } catch (fallbackError) {
          console.error('Fallback database open failed:', fallbackError);
          isInitialized = true; // Prevent repeated attempts
        }
      });
  }

  return initPromise;
};

export const getSafeDatabase = () => {
  try {
    if (!isInitialized) {
      // Try to open database synchronously
      try {
        cachedDb = SQLite.openDatabaseSync('fitgym.db');
        isInitialized = true;
        console.log('Opened database synchronously in getSafeDatabase');
      } catch (e) {
        console.error('Failed to open database synchronously:', e);
        return null;
      }
    }

    if (cachedDb) return cachedDb;

    const database = getDb();
    cachedDb = database;
    return database;
  } catch (error) {
    console.error('Failed to get database:', error);
    return null;
  }
};