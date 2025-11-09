import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { syncService } from '../services/syncService';

interface DatabaseContextType {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: Date | null;
  syncNow: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabase = () => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return context;
};

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = React.useState(true);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastSyncTime, setLastSyncTime] = React.useState<Date | null>(null);
  const syncIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = React.useRef(false);
  const isOnlineRef = React.useRef(true);

  // Keep refs in sync with state
  React.useEffect(() => {
    isSyncingRef.current = isSyncing;
  }, [isSyncing]);

  React.useEffect(() => {
    isOnlineRef.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    // Network state listener
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      setIsOnline(connected);
      isOnlineRef.current = connected;

      // Trigger sync when coming back online
      if (connected && !isSyncingRef.current) {
        syncData();
      }
    });

    // Set up sync interval (only once!)
    syncIntervalRef.current = setInterval(() => {
      // Use refs to avoid stale closures
      if (isOnlineRef.current && !isSyncingRef.current) {
        syncData();
      }
    }, 5 * 60 * 1000);

    return () => {
      unsubscribe();
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
        syncIntervalRef.current = null;
      }
    };
  }, []); // Empty deps - only run once on mount

  const syncData = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    try {
      await syncService.syncAll();
      setLastSyncTime(new Date());
    } catch (error) {
      Alert.alert('Error', 'Failed to sync your data. Your changes are saved locally.');
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const syncNow = async () => {
    if (!isOnline) {
      throw new Error('Cannot sync while offline');
    }
    await syncData();
  };

  const value: DatabaseContextType = {
    isOnline,
    isSyncing,
    lastSyncTime,
    syncNow,
  };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
};