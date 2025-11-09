import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

interface BackupData {
  version: string;
  timestamp: string;
  data: {
    profile?: any;
    workouts?: any;
    nutrition?: any;
    progress?: any;
    challenges?: any;
    settings?: any;
    customWorkouts?: any;
    playlists?: any;
  };
}

interface BackupMetadata {
  id: string;
  name: string;
  timestamp: string;
  size: number;
  autoBackup: boolean;
  cloudSync?: boolean;
}

const STORAGE_KEYS = {
  BACKUP_METADATA: '@backup_metadata',
  BACKUP_SETTINGS: '@backup_settings',
  LAST_BACKUP: '@last_backup',
};

const BACKUP_VERSION = '1.0.0';

class BackupService {
  private autoBackupEnabled: boolean = false;
  private autoBackupInterval: NodeJS.Timeout | null = null;

  // Create backup
  async createBackup(name?: string): Promise<BackupMetadata> {
    try {
      const timestamp = new Date().toISOString();
      const backupName = name || `FitPower_Backup_${timestamp.split('T')[0]}`;

      // Collect all data from AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      const allData = await AsyncStorage.multiGet(allKeys);

      // Organize data by category
      const backupData: BackupData = {
        version: BACKUP_VERSION,
        timestamp,
        data: {},
      };

      // Categorize data
      for (const [key, value] of allData) {
        if (!value) continue;

        if (key.includes('profile')) {
          backupData.data.profile = backupData.data.profile || {};
          backupData.data.profile[key] = JSON.parse(value);
        } else if (key.includes('workout')) {
          backupData.data.workouts = backupData.data.workouts || {};
          backupData.data.workouts[key] = JSON.parse(value);
        } else if (key.includes('nutrition')) {
          backupData.data.nutrition = backupData.data.nutrition || {};
          backupData.data.nutrition[key] = JSON.parse(value);
        } else if (key.includes('progress')) {
          backupData.data.progress = backupData.data.progress || {};
          backupData.data.progress[key] = JSON.parse(value);
        } else if (key.includes('challenge')) {
          backupData.data.challenges = backupData.data.challenges || {};
          backupData.data.challenges[key] = JSON.parse(value);
        } else if (key.includes('custom')) {
          backupData.data.customWorkouts = backupData.data.customWorkouts || {};
          backupData.data.customWorkouts[key] = JSON.parse(value);
        } else if (key.includes('playlist')) {
          backupData.data.playlists = backupData.data.playlists || {};
          backupData.data.playlists[key] = JSON.parse(value);
        } else {
          backupData.data.settings = backupData.data.settings || {};
          backupData.data.settings[key] = JSON.parse(value);
        }
      }

      // Convert to JSON string
      const backupJson = JSON.stringify(backupData, null, 2);
      const backupSize = new Blob([backupJson]).size;

      // Save to file system
      const fileUri = FileSystem.documentDirectory + backupName + '.json';
      await FileSystem.writeAsStringAsync(fileUri, backupJson, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Create metadata
      const metadata: BackupMetadata = {
        id: `backup_${Date.now()}`,
        name: backupName,
        timestamp,
        size: backupSize,
        autoBackup: false,
      };

      // Save metadata
      await this.saveBackupMetadata(metadata);

      // Update last backup time
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_BACKUP, timestamp);

      return metadata;
    } catch (error) {
      Alert.alert('Error', 'Failed to create backup. Please try again.');

      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  // Restore from backup
  async restoreBackup(backupUri?: string): Promise<boolean> {
    try {
      let fileUri = backupUri;

      // If no URI provided, let user pick a file
      if (!fileUri) {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
          copyToCacheDirectory: true,
        });

        if (result.canceled) {
          return false;
        }

        fileUri = result.assets?.[0]?.uri || '';
      }

      // Read backup file
      const backupJson = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const backupData: BackupData = JSON.parse(backupJson);

      // Verify backup version
      if (!this.isCompatibleVersion(backupData.version)) {
        throw new Error('Incompatible backup version');
      }

      // Clear current data
      await AsyncStorage.clear();

      // Restore data category by category
      const restorePromises: Promise<void>[] = [];

      for (const category in backupData.data) {
        const categoryData = backupData.data[category as keyof typeof backupData.data];
        if (!categoryData) continue;

        for (const key in categoryData) {
          restorePromises.push(
            AsyncStorage.setItem(key, JSON.stringify(categoryData[key]))
          );
        }
      }

      await Promise.all(restorePromises);

      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to restore backup. Please try again.');

      console.error('Failed to restore backup:', error);
      return false;
    }
  }

  // Export backup (share)
  async exportBackup(backupName?: string): Promise<boolean> {
    try {
      const metadata = await this.createBackup(backupName);
      const fileUri = FileSystem.documentDirectory + metadata.name + '.json';

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        console.error('Sharing is not available on this platform');
        return false;
      }

      // Share the backup file
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Fit&Power Backup',
        UTI: 'public.json',
      });

      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to export backup. Please try again.');

      console.error('Failed to export backup:', error);
      return false;
    }
  }

  // Import backup
  async importBackup(): Promise<boolean> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });

      if (result.type === 'cancel') {
        return false;
      }

      return await this.restoreBackup(result.assets?.[0]?.uri || '');
    } catch (error) {
      Alert.alert('Error', 'Failed to import backup. Please try again.');

      console.error('Failed to import backup:', error);
      return false;
    }
  }

  // Get backup metadata list
  async getBackupList(): Promise<BackupMetadata[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BACKUP_METADATA);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      Alert.alert('Error', 'Failed to get backup list. Please try again.');

      console.error('Failed to get backup list:', error);
      return [];
    }
  }

  // Save backup metadata
  private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
    try {
      const backupList = await this.getBackupList();
      backupList.push(metadata);

      // Keep only last 10 backups in metadata
      if (backupList.length > 10) {
        backupList.shift();
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.BACKUP_METADATA,
        JSON.stringify(backupList)
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save backup metadata. Please try again.');

      console.error('Failed to save backup metadata:', error);
    }
  }

  // Delete backup
  async deleteBackup(backupId: string): Promise<boolean> {
    try {
      const backupList = await this.getBackupList();
      const backup = backupList.find(b => b.id === backupId);

      if (!backup) return false;

      // Delete file
      const fileUri = `${FileSystem.documentDirectory}${backup.name}.json`;
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(fileUri);
      }

      // Remove from metadata
      const updatedList = backupList.filter(b => b.id !== backupId);
      await AsyncStorage.setItem(
        STORAGE_KEYS.BACKUP_METADATA,
        JSON.stringify(updatedList)
      );

      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to delete backup. Please try again.');

      console.error('Failed to delete backup:', error);
      return false;
    }
  }

  // Enable auto backup
  async enableAutoBackup(intervalHours: number = 24): Promise<void> {
    try {
      this.autoBackupEnabled = true;

      // Clear existing interval
      if (this.autoBackupInterval) {
        clearInterval(this.autoBackupInterval);
      }

      // Set new interval
      this.autoBackupInterval = setInterval(async () => {
        if (this.autoBackupEnabled) {
          const metadata = await this.createBackup('AutoBackup');
          metadata.autoBackup = true;
          await this.saveBackupMetadata(metadata);
        }
      }, intervalHours * 60 * 60 * 1000);

      // Save settings
      await AsyncStorage.setItem(
        STORAGE_KEYS.BACKUP_SETTINGS,
        JSON.stringify({
          autoBackupEnabled: true,
          intervalHours,
        })
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to enable auto backup. Please try again.');

      console.error('Failed to enable auto backup:', error);
    }
  }

  // Disable auto backup
  async disableAutoBackup(): Promise<void> {
    try {
      this.autoBackupEnabled = false;

      if (this.autoBackupInterval) {
        clearInterval(this.autoBackupInterval);
        this.autoBackupInterval = null;
      }

      await AsyncStorage.setItem(
        STORAGE_KEYS.BACKUP_SETTINGS,
        JSON.stringify({
          autoBackupEnabled: false,
        })
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to disable auto backup. Please try again.');

      console.error('Failed to disable auto backup:', error);
    }
  }

  // Get backup settings
  async getBackupSettings(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BACKUP_SETTINGS);
      return data ? JSON.parse(data) : { autoBackupEnabled: false };
    } catch (error) {
      Alert.alert('Error', 'Failed to get backup settings. Please try again.');

      console.error('Failed to get backup settings:', error);
      return { autoBackupEnabled: false };
    }
  }

  // Get last backup time
  async getLastBackupTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LAST_BACKUP);
    } catch (error) {
      Alert.alert('Error', 'Failed to get last backup time. Please try again.');

      console.error('Failed to get last backup time:', error);
      return null;
    }
  }

  // Check version compatibility
  private isCompatibleVersion(version: string): boolean {
    const [major] = version.split('.');
    const [currentMajor] = BACKUP_VERSION.split('.');
    return major === currentMajor;
  }

  // Cloud sync placeholder (would integrate with cloud service)
  async syncToCloud(cloudService: 'google' | 'icloud' | 'dropbox'): Promise<boolean> {
    try {
      // Create backup
      const metadata = await this.createBackup(`CloudSync_${cloudService}`);

      // In production, you would:
      // 1. Authenticate with cloud service
      // 2. Upload the backup file
      // 3. Store sync metadata

      console.log(`Syncing to ${cloudService}...`);

      // Mock success
      return true;
    } catch (error) {
      console.error(`Failed to sync to ${cloudService}:`, error);
      return false;
    }
  }

  // Restore from cloud placeholder
  async restoreFromCloud(cloudService: 'google' | 'icloud' | 'dropbox'): Promise<boolean> {
    try {
      // In production, you would:
      // 1. Authenticate with cloud service
      // 2. Download the latest backup
      // 3. Restore from downloaded backup

      console.log(`Restoring from ${cloudService}...`);

      // Mock success
      return true;
    } catch (error) {
      console.error(`Failed to restore from ${cloudService}:`, error);
      return false;
    }
  }
}

// Create singleton instance
const backupService = new BackupService();

// Export functions
export const createBackup = (name?: string) => backupService.createBackup(name);
export const restoreBackup = (backupUri?: string) => backupService.restoreBackup(backupUri);
export const exportBackup = (backupName?: string) => backupService.exportBackup(backupName);
export const importBackup = () => backupService.importBackup();
export const getBackupList = () => backupService.getBackupList();
export const deleteBackup = (backupId: string) => backupService.deleteBackup(backupId);
export const enableAutoBackup = (intervalHours?: number) =>
  backupService.enableAutoBackup(intervalHours);
export const disableAutoBackup = () => backupService.disableAutoBackup();
export const getBackupSettings = () => backupService.getBackupSettings();
export const getLastBackupTime = () => backupService.getLastBackupTime();
export const syncToCloud = (cloudService: 'google' | 'icloud' | 'dropbox') =>
  backupService.syncToCloud(cloudService);
export const restoreFromCloud = (cloudService: 'google' | 'icloud' | 'dropbox') =>
  backupService.restoreFromCloud(cloudService);

export default backupService;