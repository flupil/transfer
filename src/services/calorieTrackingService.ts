import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, startOfDay, isToday } from 'date-fns';

export interface BurnedCalories {
  workouts: number;
  steps: number;
  total: number;
}

export interface DailyCalorieBalance {
  date: string; // ISO date string
  goal: number;
  consumed: number;
  burned: BurnedCalories;
  net: number; // consumed - burned.total
  remaining: number; // goal - net (or with exercise calories added)
}

interface WorkoutCalorieEntry {
  workoutId: string;
  calories: number;
  timestamp: Date;
}

interface StepCalorieEntry {
  steps: number;
  calories: number;
  timestamp: Date;
}

class CalorieTrackingService {
  private static WORKOUT_CALORIES_KEY = '@workout_calories_';
  private static STEP_CALORIES_KEY = '@step_calories_';
  private static SETTINGS_KEY = '@calorie_settings';

  /**
   * Calculate calories burned during a workout based on duration and intensity
   */
  calculateWorkoutCalories(
    durationMinutes: number,
    intensity: 'light' | 'moderate' | 'vigorous',
    userWeight?: number // in kg
  ): number {
    const weight = userWeight || 70; // Default to 70kg if not provided

    // MET (Metabolic Equivalent) values for different intensities
    const metValues = {
      light: 3.5,      // Light exercise (walking, stretching)
      moderate: 5.5,   // Moderate (jogging, weight training)
      vigorous: 8.0,   // Vigorous (running, HIIT)
    };

    const met = metValues[intensity];
    // Calories = MET × weight (kg) × duration (hours)
    const calories = met * weight * (durationMinutes / 60);

    return Math.round(calories);
  }

  /**
   * Calculate calories burned from steps
   * Average: 0.04 cal/step, but varies by weight
   */
  calculateStepCalories(steps: number, userWeight?: number): number {
    const weight = userWeight || 70; // Default to 70kg
    // More accurate formula: calories = steps × 0.57 × (weight / 100)
    const caloriesPerStep = 0.57 * (weight / 100);
    return Math.round(steps * caloriesPerStep);
  }

  /**
   * Log calories burned from a workout
   */
  async logWorkoutCalories(
    workoutId: string,
    calories: number,
    date: Date = new Date()
  ): Promise<void> {
    try {
      const dateKey = format(startOfDay(date), 'yyyy-MM-dd');
      const key = `${CalorieTrackingService.WORKOUT_CALORIES_KEY}${dateKey}`;

      const existing = await AsyncStorage.getItem(key);
      const workouts: WorkoutCalorieEntry[] = existing ? JSON.parse(existing) : [];

      workouts.push({
        workoutId,
        calories,
        timestamp: date,
      });

      await AsyncStorage.setItem(key, JSON.stringify(workouts));
    } catch (error) {
      console.error('Error logging workout calories:', error);
    }
  }

  /**
   * Log calories burned from steps
   */
  async logStepCalories(
    steps: number,
    calories: number,
    date: Date = new Date()
  ): Promise<void> {
    try {
      const dateKey = format(startOfDay(date), 'yyyy-MM-dd');
      const key = `${CalorieTrackingService.STEP_CALORIES_KEY}${dateKey}`;

      await AsyncStorage.setItem(key, JSON.stringify({
        steps,
        calories,
        timestamp: date,
      }));
    } catch (error) {
      console.error('Error logging step calories:', error);
    }
  }

  /**
   * Get total calories burned for a specific date
   */
  async getBurnedCalories(date: Date = new Date()): Promise<BurnedCalories> {
    try {
      const dateKey = format(startOfDay(date), 'yyyy-MM-dd');

      // Get workout calories
      const workoutKey = `${CalorieTrackingService.WORKOUT_CALORIES_KEY}${dateKey}`;
      const workoutData = await AsyncStorage.getItem(workoutKey);
      const workouts: WorkoutCalorieEntry[] = workoutData ? JSON.parse(workoutData) : [];
      const workoutCalories = workouts.reduce((sum, w) => sum + w.calories, 0);

      // Get step calories
      const stepKey = `${CalorieTrackingService.STEP_CALORIES_KEY}${dateKey}`;
      const stepData = await AsyncStorage.getItem(stepKey);
      const stepEntry: StepCalorieEntry | null = stepData ? JSON.parse(stepData) : null;
      const stepCalories = stepEntry?.calories || 0;

      return {
        workouts: workoutCalories,
        steps: stepCalories,
        total: workoutCalories + stepCalories,
      };
    } catch (error) {
      console.error('Error getting burned calories:', error);
      return { workouts: 0, steps: 0, total: 0 };
    }
  }

  /**
   * Get daily calorie balance
   */
  async getDailyBalance(
    consumedCalories: number,
    goalCalories: number,
    date: Date = new Date()
  ): Promise<DailyCalorieBalance> {
    try {
      const burned = await this.getBurnedCalories(date);
      const settings = await this.getSettings();

      const net = consumedCalories - (settings.subtractBurnedFromConsumed ? burned.total : 0);

      // If "add exercise to goal" is enabled, increase the remaining allowance
      const adjustedGoal = settings.addBurnedToGoal ? goalCalories + burned.total : goalCalories;
      const remaining = adjustedGoal - consumedCalories;

      return {
        date: format(date, 'yyyy-MM-dd'),
        goal: goalCalories,
        consumed: consumedCalories,
        burned,
        net,
        remaining,
      };
    } catch (error) {
      console.error('Error calculating daily balance:', error);
      return {
        date: format(date, 'yyyy-MM-dd'),
        goal: goalCalories,
        consumed: consumedCalories,
        burned: { workouts: 0, steps: 0, total: 0 },
        net: consumedCalories,
        remaining: goalCalories - consumedCalories,
      };
    }
  }

  /**
   * Get/Set user settings for calorie tracking
   */
  async getSettings(): Promise<{
    addBurnedToGoal: boolean;
    subtractBurnedFromConsumed: boolean;
  }> {
    try {
      const data = await AsyncStorage.getItem(CalorieTrackingService.SETTINGS_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return {
        addBurnedToGoal: false, // Default: don't add burned to goal (weight loss mode)
        subtractBurnedFromConsumed: false, // Don't subtract from consumed (keep it simple)
      };
    } catch (error) {
      console.error('Error getting calorie settings:', error);
      return { addBurnedToGoal: false, subtractBurnedFromConsumed: false };
    }
  }

  async updateSettings(settings: {
    addBurnedToGoal?: boolean;
    subtractBurnedFromConsumed?: boolean;
  }): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };
      await AsyncStorage.setItem(
        CalorieTrackingService.SETTINGS_KEY,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error('Error updating calorie settings:', error);
    }
  }

  /**
   * Get calories burned over a date range (for analytics)
   */
  async getBurnedCaloriesRange(
    startDate: Date,
    endDate: Date
  ): Promise<{ date: string; burned: BurnedCalories }[]> {
    const results: { date: string; burned: BurnedCalories }[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const burned = await this.getBurnedCalories(currentDate);
      results.push({
        date: format(currentDate, 'yyyy-MM-dd'),
        burned,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return results;
  }

  /**
   * Clear all calorie data (for testing/reset)
   */
  async clearAllData(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const calorieKeys = keys.filter(
        key =>
          key.startsWith(CalorieTrackingService.WORKOUT_CALORIES_KEY) ||
          key.startsWith(CalorieTrackingService.STEP_CALORIES_KEY)
      );
      await AsyncStorage.multiRemove(calorieKeys);
    } catch (error) {
      console.error('Error clearing calorie data:', error);
    }
  }
}

export default new CalorieTrackingService();
