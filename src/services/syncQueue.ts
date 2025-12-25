import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  collection: string;
  docId: string;
  data?: any;
  timestamp: number;
  retryCount?: number;
}

const QUEUE_KEY = 'sync_operations_queue';
const MAX_QUEUE_SIZE = 100;
const MAX_RETRIES = 3;

export class SyncQueue {
  private queue: PendingOperation[] = [];
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`Loaded ${this.queue.length} pending operations from storage`);
      }
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load sync queue:', error);
      this.queue = [];
      this.initialized = true;
    }
  }

  async add(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    await this.initialize();

    // Create operation with metadata
    const newOp: PendingOperation = {
      ...operation,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    // Check queue size limit
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      console.warn(`Sync queue at max capacity (${MAX_QUEUE_SIZE}), removing oldest operation`);
      this.queue.shift(); // Remove oldest
    }

    this.queue.push(newOp);
    await this.persist();
    console.log(`Added ${operation.type} operation to sync queue (${this.queue.length} pending)`);
  }

  async getAll(): Promise<PendingOperation[]> {
    await this.initialize();
    return [...this.queue]; // Return copy to prevent external modification
  }

  async remove(operationId: string): Promise<void> {
    await this.initialize();
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(op => op.id !== operationId);

    if (this.queue.length < initialLength) {
      await this.persist();
      console.log(`Removed operation ${operationId} from queue (${this.queue.length} remaining)`);
    }
  }

  async incrementRetry(operationId: string): Promise<boolean> {
    await this.initialize();
    const operation = this.queue.find(op => op.id === operationId);

    if (!operation) return false;

    operation.retryCount = (operation.retryCount || 0) + 1;

    // If max retries exceeded, remove from queue
    if (operation.retryCount >= MAX_RETRIES) {
      console.error(`Operation ${operationId} failed after ${MAX_RETRIES} retries, removing from queue`);
      await this.remove(operationId);
      return false;
    }

    await this.persist();
    return true;
  }

  async clear(): Promise<void> {
    await this.initialize();
    this.queue = [];
    await this.persist();
    console.log('Sync queue cleared');
  }

  async size(): Promise<number> {
    await this.initialize();
    return this.queue.length;
  }

  async isEmpty(): Promise<boolean> {
    await this.initialize();
    return this.queue.length === 0;
  }

  private async persist(): Promise<void> {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to persist sync queue:', error);
    }
  }

  // For debugging
  async inspect(): Promise<void> {
    await this.initialize();
    console.log('=== Sync Queue Status ===');
    console.log(`Total operations: ${this.queue.length}`);

    const byType = this.queue.reduce((acc, op) => {
      acc[op.type] = (acc[op.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('By type:', byType);

    if (this.queue.length > 0) {
      console.log('Oldest operation:', new Date(this.queue[0].timestamp).toLocaleString());
      console.log('Newest operation:', new Date(this.queue[this.queue.length - 1].timestamp).toLocaleString());
    }
    console.log('========================');
  }
}

// Singleton instance
export const syncQueue = new SyncQueue();
