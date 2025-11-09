import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

export interface QueuedOperation {
  id: string;
  type: 'addFood' | 'updateFood' | 'removeFood' | 'addWater' | 'updateWater';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class OfflineQueueService {
  private queue: QueuedOperation[] = [];
  private isProcessing: boolean = false;
  private readonly QUEUE_KEY = 'offline_operation_queue';
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 2000; // 2 seconds
  private unsubscribeNetInfo: (() => void) | null = null;

  /**
   * Initialize the offline queue service
   * Loads existing queue from storage and sets up network listener
   */
  async initialize(): Promise<void> {
    try {
      // Load existing queue from storage
      await this.loadQueue();

      // Set up network state listener
      this.unsubscribeNetInfo = NetInfo.addEventListener((state) => {
        if (state.isConnected && this.queue.length > 0 && !this.isProcessing) {
          console.log('Network reconnected, processing offline queue...');
          this.processQueue();
        }
      });

      // Process queue if online
      const netState = await NetInfo.fetch();
      if (netState.isConnected && this.queue.length > 0) {
        this.processQueue();
      }
    } catch (error) {
      console.error('Failed to initialize offline queue:', error);
    }
  }

  /**
   * Clean up listeners when service is destroyed
   */
  cleanup(): void {
    if (this.unsubscribeNetInfo) {
      this.unsubscribeNetInfo();
      this.unsubscribeNetInfo = null;
    }
  }

  /**
   * Add an operation to the queue
   */
  async enqueue(operation: Omit<QueuedOperation, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>): Promise<void> {
    const queuedOp: QueuedOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: this.MAX_RETRIES,
    };

    this.queue.push(queuedOp);
    await this.saveQueue();

    console.log(`Operation queued (${operation.type}):`, queuedOp.id);

    // Try to process immediately if online
    const netState = await NetInfo.fetch();
    if (netState.isConnected) {
      this.processQueue();
    }
  }

  /**
   * Process the queue - execute all pending operations
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        console.log('Network offline, pausing queue processing');
        this.isProcessing = false;
        return;
      }

      console.log(`Processing ${this.queue.length} queued operations...`);

      // Process operations one by one
      while (this.queue.length > 0) {
        const operation = this.queue[0];

        try {
          await this.executeOperation(operation);
          // Success - remove from queue
          this.queue.shift();
          console.log(`Operation completed: ${operation.id}`);
        } catch (error) {
          console.error(`Operation failed: ${operation.id}`, error);

          // Increment retry count
          operation.retryCount++;

          if (operation.retryCount >= operation.maxRetries) {
            // Max retries reached - remove and notify user
            this.queue.shift();
            Alert.alert(
              'Sync Failed',
              `Unable to sync your ${operation.type} after ${operation.maxRetries} attempts. Please try again later.`,
              [{ text: 'OK' }]
            );
          } else {
            // Retry after delay
            console.log(`Retrying operation ${operation.id} (${operation.retryCount}/${operation.maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
          }
        }
      }

      await this.saveQueue();
      console.log('Queue processing completed');
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a single queued operation
   */
  private async executeOperation(operation: QueuedOperation): Promise<void> {
    // Import services dynamically to avoid circular dependencies
    const { firebaseDailyDataService } = await import('./firebaseDailyDataService');

    switch (operation.type) {
      case 'addFood':
        await firebaseDailyDataService.addFoodToMeal(
          operation.data.userId,
          operation.data.date,
          operation.data.mealType,
          operation.data.foodIntake
        );
        break;

      case 'updateFood':
        await firebaseDailyDataService.updateFoodInMeal(
          operation.data.userId,
          operation.data.date,
          operation.data.foodIntake
        );
        break;

      case 'removeFood':
        await firebaseDailyDataService.removeFoodFromMeal(
          operation.data.userId,
          operation.data.date,
          operation.data.intakeId
        );
        break;

      case 'addWater':
        await firebaseDailyDataService.addWater(
          operation.data.userId,
          operation.data.glasses,
          operation.data.date
        );
        break;

      case 'updateWater':
        await firebaseDailyDataService.updateWater(
          operation.data.userId,
          operation.data.date,
          operation.data.glasses
        );
        break;

      default:
        throw new Error(`Unknown operation type: ${(operation as any).type}`);
    }
  }

  /**
   * Load queue from AsyncStorage
   */
  private async loadQueue(): Promise<void> {
    try {
      const queueJson = await AsyncStorage.getItem(this.QUEUE_KEY);
      if (queueJson) {
        this.queue = JSON.parse(queueJson);
        console.log(`Loaded ${this.queue.length} operations from offline queue`);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  /**
   * Save queue to AsyncStorage
   */
  private async saveQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Get current queue status
   */
  getStatus(): { queueLength: number; isProcessing: boolean } {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Clear the entire queue (use with caution)
   */
  async clearQueue(): Promise<void> {
    this.queue = [];
    await this.saveQueue();
    console.log('Offline queue cleared');
  }
}

export const offlineQueueService = new OfflineQueueService();
