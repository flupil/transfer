import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { getSafeDatabase, ensureDatabase } from '../database/databaseHelper';
import { syncService } from './syncService';
import uuid from 'react-native-uuid';
import { Alert } from 'react-native';
import { firebaseDailyDataService } from './firebaseDailyDataService';
import { translate } from '../contexts/LanguageContext';

interface WaterEntry {
  id: string;
  userId?: string;
  amount: number;
  timestamp: string;
  type: 'water' | 'coffee' | 'tea' | 'juice' | 'other';
  notes?: string;
}

interface DailyWaterData {
  date: string;
  target: number;
  consumed: number;
  entries: WaterEntry[];
  percentageComplete: number;
  streak?: number;
}

interface WaterStats {
  weeklyAverage: number;
  monthlyTotal: number;
  bestDay: { date: string; amount: number };
  currentStreak: number;
  longestStreak: number;
}

class WaterTrackingService {
  private readonly STORAGE_KEY = 'waterTracking';
  private readonly DEFAULT_DAILY_TARGET = 2000; // 2000ml default
  private currentUserId: string | null = null;

  setUserId(userId: string) {
    this.currentUserId = userId;
  }

  // Get today's water data
  async getTodayData(): Promise<DailyWaterData> {
    const today = format(new Date(), 'yyyy-MM-dd');

    try {
      const db = getSafeDatabase();
      if (!db || !this.currentUserId) {
        // Fallback to AsyncStorage if database not available
        return this.getTodayDataFromStorage();
      }

      // Get today's water entries from database
      const entries = await db.getAllAsync(
        'SELECT * FROM water_logs WHERE userId = ? AND date = ? ORDER BY timestamp ASC',
        [this.currentUserId, today]
      ) as any[];

      const waterEntries: WaterEntry[] = entries.map(entry => ({
        id: entry.id.toString(),
        amount: entry.amount,
        timestamp: entry.timestamp,
        type: 'water' // Database doesn't store type yet, default to water
      }));

      const consumed = waterEntries.reduce((total, entry) => total + entry.amount, 0);
      const target = await this.getDailyTarget();

      const percentageComplete = Math.min(100, Math.round((consumed / target) * 100));
      const streak = await this.getStreak();

      return {
        date: today,
        target,
        consumed,
        entries: waterEntries,
        percentageComplete,
        streak
      };
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('water.getTodayDataFailed'));

      console.error('Error getting today water data:', error);
      return this.getTodayDataFromStorage();
    }
  }

  private async getTodayDataFromStorage(): Promise<DailyWaterData> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const allData = await this.getAllData();

    if (!allData[today]) {
      const target = await this.getDailyTarget();
      allData[today] = {
        date: today,
        target,
        consumed: 0,
        entries: [],
        percentageComplete: 0,
        streak: await this.getStreak()
      };
    } else {
      // Calculate percentage
      allData[today].percentageComplete = Math.min(100, Math.round((allData[today].consumed / allData[today].target) * 100));
      allData[today].streak = await this.getStreak();
    }

    return allData[today];
  }

  // Add water intake
  async addWater(amount: number, type: 'water' | 'coffee' | 'tea' | 'juice' | 'other' = 'water'): Promise<DailyWaterData> {
    // Save to Firebase first
    if (this.currentUserId) {
      try {
        // Convert ml to glasses (250ml = 1 glass)
        const glasses = amount / 250;
        await firebaseDailyDataService.addWater(this.currentUserId, glasses);
      } catch (error) {
        Alert.alert(translate('alert.error'), translate('water.saveToFirebaseFailed'));

        console.error('Failed to save water to Firebase:', error);
        // Continue with local save even if Firebase fails
      }
    }

    const today = format(new Date(), 'yyyy-MM-dd');
    const timestamp = new Date().toISOString();

    try {
      const db = getSafeDatabase();
      if (!db || !this.currentUserId) {
        // Fallback to AsyncStorage if database not available
        return this.addWaterToStorage(amount, type);
      }

      // Add to database
      await db.runAsync(
        'INSERT INTO water_logs (userId, date, amount, timestamp) VALUES (?, ?, ?, ?)',
        [this.currentUserId, today, amount, timestamp]
      );

      // Return updated data
      return this.getTodayData();
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('water.addToDatabaseFailed'));

      console.error('Error adding water to database:', error);
      return this.addWaterToStorage(amount, type);
    }
  }

  private async addWaterToStorage(amount: number, type: 'water' | 'coffee' | 'tea' | 'juice' | 'other' = 'water'): Promise<DailyWaterData> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const allData = await this.getAllData();

    if (!allData[today]) {
      allData[today] = {
        date: today,
        target: await this.getDailyTarget(),
        consumed: 0,
        entries: [],
        percentageComplete: 0,
      };
    }

    const entry: WaterEntry = {
      id: Date.now().toString(),
      amount,
      timestamp: new Date().toISOString(),
      type,
    };

    allData[today].entries.push(entry);
    allData[today].consumed += amount;

    await this.saveAllData(allData);
    return allData[today];
  }

  // Remove water entry
  async removeEntry(entryId: string): Promise<DailyWaterData> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const allData = await this.getAllData();

    if (allData[today]) {
      const entryIndex = allData[today].entries.findIndex(e => e.id === entryId);
      if (entryIndex !== -1) {
        const removedEntry = allData[today].entries[entryIndex];
        allData[today].consumed -= removedEntry.amount;
        allData[today].entries.splice(entryIndex, 1);
        await this.saveAllData(allData);
      }
    }

    return allData[today];
  }

  // Update daily target
  async updateDailyTarget(target: number): Promise<void> {
    await AsyncStorage.setItem('waterDailyTarget', target.toString());

    // Update today's target
    const today = format(new Date(), 'yyyy-MM-dd');
    const allData = await this.getAllData();

    if (allData[today]) {
      allData[today].target = target;
      await this.saveAllData(allData);
    }
  }

  // Get daily target
  async getDailyTarget(): Promise<number> {
    try {
      const target = await AsyncStorage.getItem('waterDailyTarget');
      return target ? parseInt(target) : this.DEFAULT_DAILY_TARGET;
    } catch {
      return this.DEFAULT_DAILY_TARGET;
    }
  }

  // Get weekly statistics
  async getWeeklyStats(): Promise<{
    averageIntake: number;
    totalIntake: number;
    daysGoalMet: number;
    bestDay: number;
  }> {
    const allData = await this.getAllData();
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    let totalIntake = 0;
    let daysGoalMet = 0;
    let bestDay = 0;
    let daysCount = 0;

    for (let d = new Date(weekAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = format(d, 'yyyy-MM-dd');
      if (allData[dateStr]) {
        const dayData = allData[dateStr];
        totalIntake += dayData.consumed;
        daysCount++;

        if (dayData.consumed >= dayData.target) {
          daysGoalMet++;
        }

        if (dayData.consumed > bestDay) {
          bestDay = dayData.consumed;
        }
      }
    }

    return {
      averageIntake: daysCount > 0 ? Math.round(totalIntake / daysCount) : 0,
      totalIntake,
      daysGoalMet,
      bestDay,
    };
  }

  // Get monthly history
  async getMonthlyHistory(): Promise<DailyWaterData[]> {
    const allData = await this.getAllData();
    const today = new Date();
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const history: DailyWaterData[] = [];

    for (let d = new Date(monthAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = format(d, 'yyyy-MM-dd');
      if (allData[dateStr]) {
        history.push(allData[dateStr]);
      } else {
        history.push({
          date: dateStr,
          target: this.DEFAULT_DAILY_TARGET,
          consumed: 0,
          entries: [],
          percentageComplete: 0,
        });
      }
    }

    return history;
  }

  // Get streak (consecutive days of meeting goal)
  async getStreak(): Promise<number> {
    const allData = await this.getAllData();
    const today = new Date();
    let streak = 0;

    for (let i = 0; i < 365; i++) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = format(date, 'yyyy-MM-dd');

      if (allData[dateStr] && allData[dateStr].consumed >= allData[dateStr].target) {
        streak++;
      } else if (i > 0) {
        // Don't break streak on current day if it's not complete yet
        break;
      }
    }

    return streak;
  }

  // Get hydration tips
  getHydrationTips(): string[] {
    return [
      'Drink a glass of water when you wake up',
      'Keep a water bottle at your desk',
      'Drink before, during, and after exercise',
      'Set reminders to drink water',
      'Eat water-rich foods like fruits',
      'Drink water before each meal',
      'Choose water over sugary drinks',
      'Monitor your urine color',
    ];
  }

  // Calculate recommended intake based on user profile
  calculateRecommendedIntake(weight: number, activityLevel: 'low' | 'moderate' | 'high'): number {
    // Basic formula: 30-35ml per kg of body weight
    let base = weight * 35;

    // Adjust for activity level
    switch (activityLevel) {
      case 'low':
        return Math.round(base);
      case 'moderate':
        return Math.round(base * 1.2);
      case 'high':
        return Math.round(base * 1.5);
      default:
        return Math.round(base);
    }
  }

  // Private helper methods
  private async getAllData(): Promise<{ [date: string]: DailyWaterData }> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private async saveAllData(data: { [date: string]: DailyWaterData }): Promise<void> {
    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  // Clear old data (older than 90 days)
  async cleanupOldData(): Promise<void> {
    const allData = await this.getAllData();
    const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    Object.keys(allData).forEach(dateStr => {
      if (new Date(dateStr) < cutoffDate) {
        delete allData[dateStr];
      }
    });

    await this.saveAllData(allData);
  }
}

// Export singleton instance
export const waterTrackingService = new WaterTrackingService();

// Export convenience functions
export const addWater = (amount: number, type?: 'water' | 'coffee' | 'tea' | 'juice' | 'other') =>
  waterTrackingService.addWater(amount, type);

export const getTodayWater = () =>
  waterTrackingService.getTodayData();

export const updateWaterTarget = (target: number) =>
  waterTrackingService.updateDailyTarget(target);

export const getWaterStats = () =>
  waterTrackingService.getWeeklyStats();

export const getWaterStreak = () =>
  waterTrackingService.getStreak();