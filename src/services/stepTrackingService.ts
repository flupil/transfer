import { Pedometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, startOfDay, endOfDay } from 'date-fns';
import calorieTrackingService from './calorieTrackingService';

interface StepData {
  steps: number;
  date: string;
  timestamp: Date;
}

class StepTrackingService {
  private static STEP_DATA_KEY = '@step_data_';
  private static USER_WEIGHT_KEY = '@user_weight';
  private subscription: any = null;

  /**
   * Check if pedometer is available on device
   */
  async isPedometerAvailable(): Promise<boolean> {
    try {
      const available = await Pedometer.isAvailableAsync();
      return available;
    } catch (error) {
      console.error('Error checking pedometer availability:', error);
      return false;
    }
  }

  /**
   * Get steps for today from device
   */
  async getTodaySteps(): Promise<number> {
    try {
      const available = await this.isPedometerAvailable();
      if (!available) {
        console.warn('Pedometer not available on this device');
        return 0;
      }

      const start = startOfDay(new Date());
      const end = new Date();

      const result = await Pedometer.getStepCountAsync(start, end);
      return result.steps || 0;
    } catch (error) {
      console.error('Error getting today steps:', error);
      return 0;
    }
  }

  /**
   * Get steps for a specific date
   */
  async getStepsForDate(date: Date): Promise<number> {
    try {
      const available = await this.isPedometerAvailable();
      if (!available) {
        // Try to get from stored data
        return await this.getStoredStepsForDate(date);
      }

      const start = startOfDay(date);
      const end = endOfDay(date);

      const result = await Pedometer.getStepCountAsync(start, end);
      const steps = result.steps || 0;

      // Store the data
      await this.storeStepsForDate(steps, date);

      return steps;
    } catch (error) {
      console.error('Error getting steps for date:', error);
      // Fallback to stored data
      return await this.getStoredStepsForDate(date);
    }
  }

  /**
   * Store steps for a date
   */
  private async storeStepsForDate(steps: number, date: Date): Promise<void> {
    try {
      const dateKey = format(date, 'yyyy-MM-dd');
      const key = `${StepTrackingService.STEP_DATA_KEY}${dateKey}`;

      const data: StepData = {
        steps,
        date: dateKey,
        timestamp: new Date(),
      };

      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error storing steps:', error);
    }
  }

  /**
   * Get stored steps for a date (fallback)
   */
  private async getStoredStepsForDate(date: Date): Promise<number> {
    try {
      const dateKey = format(date, 'yyyy-MM-dd');
      const key = `${StepTrackingService.STEP_DATA_KEY}${dateKey}`;

      const data = await AsyncStorage.getItem(key);
      if (data) {
        const stepData: StepData = JSON.parse(data);
        return stepData.steps;
      }
      return 0;
    } catch (error) {
      console.error('Error getting stored steps:', error);
      return 0;
    }
  }

  /**
   * Start watching step updates in real-time
   */
  async startWatchingSteps(callback: (steps: number) => void): Promise<void> {
    try {
      const available = await this.isPedometerAvailable();
      if (!available) {
        console.warn('Pedometer not available, cannot watch steps');
        return;
      }

      // Stop existing subscription if any
      this.stopWatchingSteps();

      // Subscribe to step updates
      this.subscription = Pedometer.watchStepCount((result) => {
        callback(result.steps);
      });

      console.log('Started watching steps');
    } catch (error) {
      console.error('Error starting step watch:', error);
    }
  }

  /**
   * Stop watching step updates
   */
  stopWatchingSteps(): void {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
      console.log('Stopped watching steps');
    }
  }

  /**
   * Update step count and calculate/store calories
   */
  async updateStepsAndCalories(steps: number, userWeight?: number): Promise<void> {
    try {
      const date = new Date();

      // Store steps
      await this.storeStepsForDate(steps, date);

      // Get user weight if not provided
      const weight = userWeight || await this.getUserWeight();

      // Calculate calories from steps
      const calories = calorieTrackingService.calculateStepCalories(steps, weight);

      // Log calories
      await calorieTrackingService.logStepCalories(steps, calories, date);

      console.log(`Updated steps: ${steps}, burned ${calories} cal`);
    } catch (error) {
      console.error('Error updating steps and calories:', error);
    }
  }

  /**
   * Get user weight from profile
   */
  private async getUserWeight(): Promise<number> {
    try {
      const weightStr = await AsyncStorage.getItem(StepTrackingService.USER_WEIGHT_KEY);
      if (weightStr) {
        return parseFloat(weightStr);
      }
      // Default weight if not set
      return 70; // kg
    } catch (error) {
      console.error('Error getting user weight:', error);
      return 70;
    }
  }

  /**
   * Set user weight (called from profile settings)
   */
  async setUserWeight(weight: number): Promise<void> {
    try {
      await AsyncStorage.setItem(
        StepTrackingService.USER_WEIGHT_KEY,
        weight.toString()
      );
    } catch (error) {
      console.error('Error setting user weight:', error);
    }
  }

  /**
   * Sync today's steps and update calories
   * Call this periodically or when app comes to foreground
   */
  async syncTodaySteps(): Promise<{ steps: number; calories: number }> {
    try {
      const steps = await this.getTodaySteps();
      await this.updateStepsAndCalories(steps);

      const weight = await this.getUserWeight();
      const calories = calorieTrackingService.calculateStepCalories(steps, weight);

      return { steps, calories };
    } catch (error) {
      console.error('Error syncing today steps:', error);
      return { steps: 0, calories: 0 };
    }
  }

  /**
   * Get step history for date range
   */
  async getStepHistory(
    startDate: Date,
    endDate: Date
  ): Promise<{ date: string; steps: number }[]> {
    const results: { date: string; steps: number }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const steps = await this.getStepsForDate(currentDate);
      results.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        steps,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return results;
  }
}

export default new StepTrackingService();
