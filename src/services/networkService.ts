import NetInfo from '@react-native-community/netinfo';
import { databaseService } from './databaseService';
import { Platform } from 'react-native';

class NetworkService {
  private unsubscribe: (() => void) | null = null;
  private isInitialized = false;

  // Start listening to network changes
  initialize() {
    if (this.isInitialized) return;

    // Skip NetInfo on web - browser handles connectivity differently
    if (Platform.OS === 'web') {
      console.log('Network monitoring skipped on web platform');
      this.isInitialized = true;
      return;
    }

    this.unsubscribe = NetInfo.addEventListener(state => {
      console.log('Network state changed:', state.type, 'Connected:', state.isConnected);

      if (state.isConnected) {
        // Network is available, check online status and sync
        this.handleOnline();
      }
    });

    this.isInitialized = true;
    console.log('Network monitoring initialized');

    // Do initial sync check
    this.handleOnline();
  }

  private async handleOnline() {
    try {
      await databaseService.checkOnlineStatus();
    } catch (error) {
      console.error('Error during online sync:', error);
    }
  }

  // Stop listening (cleanup)
  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      this.isInitialized = false;
      console.log('Network monitoring stopped');
    }
  }
}

export const networkService = new NetworkService();
