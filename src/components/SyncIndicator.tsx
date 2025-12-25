import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton, Badge, Portal, Modal, Text, ActivityIndicator } from 'react-native-paper';
import { databaseService } from '../services/databaseService';
import { useTheme } from '../contexts/ThemeContext';

export const SyncIndicator: React.FC = () => {
  const { colors } = useTheme();
  const [syncInfo, setSyncInfo] = useState({
    pendingOps: 0,
    lastSync: null as Date | null,
    isOnline: true,
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    loadSyncInfo();

    // Refresh every 10 seconds
    const interval = setInterval(loadSyncInfo, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadSyncInfo = async () => {
    try {
      const info = await databaseService.getSyncInfo();
      setSyncInfo(info);
    } catch (error) {
      console.error('Failed to load sync info:', error);
    }
  };

  const handleManualSync = async () => {
    try {
      await databaseService.checkOnlineStatus();
      await loadSyncInfo();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  // Only show indicator if there are pending operations or we're offline
  if (syncInfo.pendingOps === 0 && syncInfo.isOnline) {
    return null;
  }

  return (
    <>
      <View style={styles.container}>
        <IconButton
          icon={syncInfo.isOnline ? 'cloud-sync' : 'cloud-off-outline'}
          size={24}
          onPress={() => setShowDetails(true)}
          iconColor={syncInfo.isOnline ? colors.primary : colors.error}
        />
        {syncInfo.pendingOps > 0 && (
          <Badge style={[styles.badge, { backgroundColor: colors.warning }]}>
            {syncInfo.pendingOps}
          </Badge>
        )}
      </View>

      <Portal>
        <Modal
          visible={showDetails}
          onDismiss={() => setShowDetails(false)}
          contentContainerStyle={[
            styles.modal,
            { backgroundColor: colors.cardBackground }
          ]}
        >
          <Text variant="titleMedium" style={[styles.title, { color: colors.text }]}>
            Sync Status
          </Text>

          <View style={styles.row}>
            <Text style={{ color: colors.text }}>Status:</Text>
            <Text style={{ color: syncInfo.isOnline ? colors.success : colors.error }}>
              {syncInfo.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={{ color: colors.text }}>Pending Operations:</Text>
            <Text style={{ color: colors.text }}>{syncInfo.pendingOps}</Text>
          </View>

          {syncInfo.lastSync && (
            <View style={styles.row}>
              <Text style={{ color: colors.text }}>Last Sync:</Text>
              <Text style={{ color: colors.textSecondary }}>
                {new Date(syncInfo.lastSync).toLocaleString()}
              </Text>
            </View>
          )}

          {syncInfo.isOnline && syncInfo.pendingOps > 0 && (
            <IconButton
              icon="sync"
              mode="contained"
              onPress={handleManualSync}
              style={styles.syncButton}
            >
              Sync Now
            </IconButton>
          )}

          {!syncInfo.isOnline && (
            <Text style={[styles.info, { color: colors.textSecondary }]}>
              Changes will sync automatically when you're back online
            </Text>
          )}
        </Modal>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    fontSize: 10,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
  },
  title: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  syncButton: {
    marginTop: 16,
  },
  info: {
    marginTop: 12,
    fontSize: 12,
    fontStyle: 'italic',
  },
});
