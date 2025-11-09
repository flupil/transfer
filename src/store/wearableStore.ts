import { create } from 'zustand';
import { WearableData } from '../types';

interface WearableState {
  todayWearableData: WearableData | null;
  weeklyData: WearableData[];
  isLoading: boolean;
  error: string | null;

  syncWearableData: () => Promise<void>;
  getWeeklyData: () => Promise<void>;
}

export const useWearableStore = create<WearableState>((set) => ({
  todayWearableData: null,
  weeklyData: [],
  isLoading: false,
  error: null,

  syncWearableData: async () => {
    set({ isLoading: true });
    try {
      const mockData: WearableData = {
        userId: '1',
        date: new Date(),
        steps: 8500,
        heartRate: {
          resting: 65,
          average: 75,
          max: 120,
        },
        calories: 450,
        activeMinutes: 45,
        distance: 4.2,
        source: 'apple_health',
        lastSyncedAt: new Date(),
      };
      set({ todayWearableData: mockData });
    } catch (error) {
      set({ error: 'Failed to sync wearable data' });
    } finally {
      set({ isLoading: false });
    }
  },

  getWeeklyData: async () => {
    set({ isLoading: true });
    try {
      const mockWeekData: WearableData[] = Array.from({ length: 7 }, (_, i) => ({
        userId: '1',
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
        steps: Math.floor(Math.random() * 5000) + 5000,
        heartRate: {
          resting: 60 + Math.floor(Math.random() * 10),
          average: 70 + Math.floor(Math.random() * 20),
          max: 100 + Math.floor(Math.random() * 40),
        },
        calories: Math.floor(Math.random() * 300) + 300,
        activeMinutes: Math.floor(Math.random() * 60) + 20,
        distance: Math.random() * 5 + 2,
        source: 'apple_health',
        lastSyncedAt: new Date(),
      }));
      set({ weeklyData: mockWeekData });
    } catch (error) {
      set({ error: 'Failed to get weekly data' });
    } finally {
      set({ isLoading: false });
    }
  },
}));