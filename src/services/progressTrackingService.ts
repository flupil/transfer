import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

export interface WeightEntry {
  id: string;
  date: string;
  weight: number;
  unit: 'kg' | 'lbs';
  notes?: string;
}

export interface MeasurementEntry {
  id: string;
  date: string;
  measurements: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
    calves?: number;
    neck?: number;
    shoulders?: number;
  };
  unit: 'cm' | 'inches';
  notes?: string;
}

export interface WorkoutPerformance {
  id: string;
  date: string;
  workoutId: string;
  workoutName: string;
  exercises: {
    exerciseId: string;
    exerciseName: string;
    sets: number;
    reps: number;
    weight?: number;
    duration?: number;
    notes?: string;
  }[];
  duration: number;
  caloriesBurned?: number;
  mood?: 'great' | 'good' | 'okay' | 'tired' | 'exhausted';
  notes?: string;
}

export interface StreakData {
  workoutStreak: number;
  nutritionStreak: number;
  lastWorkoutDate: string | null;
  lastNutritionLogDate: string | null;
  longestWorkoutStreak: number;
  longestNutritionStreak: number;
  totalWorkouts: number;
  totalNutritionDays: number;
  availableFreezes: number;
  lastFreezeUsedDate: string | null;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'workout' | 'nutrition' | 'progress' | 'streak' | 'milestone';
  unlockedAt?: string;
  progress?: number;
  target?: number;
  level?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

const STORAGE_KEYS = {
  WEIGHT_ENTRIES: '@weight_entries',
  MEASUREMENTS: '@measurements',
  WORKOUT_PERFORMANCE: '@workout_performance',
  STREAK_DATA: '@streak_data',
  ACHIEVEMENTS: '@achievements',
  USER_LEVEL: '@user_level',
};

// Weight Tracking
export const addWeightEntry = async (weight: number, unit: 'kg' | 'lbs' = 'kg', notes?: string): Promise<WeightEntry> => {
  try {
    const entry: WeightEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      weight,
      unit,
      notes,
    };

    const existingData = await AsyncStorage.getItem(STORAGE_KEYS.WEIGHT_ENTRIES);
    const entries: WeightEntry[] = existingData ? JSON.parse(existingData) : [];
    entries.push(entry);
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    await AsyncStorage.setItem(STORAGE_KEYS.WEIGHT_ENTRIES, JSON.stringify(entries));

    // Check for achievements
    await checkWeightAchievements(entries);

    return entry;
  } catch (error) {
    Alert.alert('Error', 'Failed to add weight entry. Please try again.');

    console.error('Failed to add weight entry:', error);
    throw error;
  }
};

export const getWeightHistory = async (limit?: number): Promise<WeightEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WEIGHT_ENTRIES);
    const entries: WeightEntry[] = data ? JSON.parse(data) : [];
    return limit ? entries.slice(0, limit) : entries;
  } catch (error) {
    Alert.alert('Error', 'Failed to get weight history. Please try again.');

    console.error('Failed to get weight history:', error);
    return [];
  }
};

export const getLatestWeight = async (): Promise<WeightEntry | null> => {
  const entries = await getWeightHistory(1);
  return entries[0] || null;
};

// Measurement Tracking
export const addMeasurementEntry = async (measurements: MeasurementEntry['measurements'], unit: 'cm' | 'inches' = 'cm', notes?: string): Promise<MeasurementEntry> => {
  try {
    const entry: MeasurementEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      measurements,
      unit,
      notes,
    };

    const existingData = await AsyncStorage.getItem(STORAGE_KEYS.MEASUREMENTS);
    const entries: MeasurementEntry[] = existingData ? JSON.parse(existingData) : [];
    entries.push(entry);
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    await AsyncStorage.setItem(STORAGE_KEYS.MEASUREMENTS, JSON.stringify(entries));

    return entry;
  } catch (error) {
    Alert.alert('Error', 'Failed to add measurement entry. Please try again.');

    console.error('Failed to add measurement entry:', error);
    throw error;
  }
};

export const getMeasurementHistory = async (limit?: number): Promise<MeasurementEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.MEASUREMENTS);
    const entries: MeasurementEntry[] = data ? JSON.parse(data) : [];
    return limit ? entries.slice(0, limit) : entries;
  } catch (error) {
    Alert.alert('Error', 'Failed to get measurement history. Please try again.');

    console.error('Failed to get measurement history:', error);
    return [];
  }
};

// Workout Performance Tracking
export const logWorkoutPerformance = async (performance: Omit<WorkoutPerformance, 'id' | 'date'>): Promise<WorkoutPerformance> => {
  try {
    const entry: WorkoutPerformance = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      ...performance,
    };

    const existingData = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_PERFORMANCE);
    const entries: WorkoutPerformance[] = existingData ? JSON.parse(existingData) : [];
    entries.push(entry);
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_PERFORMANCE, JSON.stringify(entries));

    // Update streak data
    await updateWorkoutStreak();

    // Check for achievements
    await checkWorkoutAchievements(entries);

    return entry;
  } catch (error) {
    Alert.alert('Error', 'Failed to log workout performance. Please try again.');

    console.error('Failed to log workout performance:', error);
    throw error;
  }
};

export const getWorkoutHistory = async (limit?: number): Promise<WorkoutPerformance[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_PERFORMANCE);
    const entries: WorkoutPerformance[] = data ? JSON.parse(data) : [];
    return limit ? entries.slice(0, limit) : entries;
  } catch (error) {
    Alert.alert('Error', 'Failed to get workout history. Please try again.');

    console.error('Failed to get workout history:', error);
    return [];
  }
};

// Streak Tracking
export const updateWorkoutStreak = async (): Promise<void> => {
  try {
    console.log('🔥 updateWorkoutStreak called');
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_DATA);
    let streakData: StreakData = data ? JSON.parse(data) : {
      workoutStreak: 0,
      nutritionStreak: 0,
      lastWorkoutDate: null,
      lastNutritionLogDate: null,
      longestWorkoutStreak: 0,
      longestNutritionStreak: 0,
      totalWorkouts: 0,
      totalNutritionDays: 0,
      availableFreezes: 1,
      lastFreezeUsedDate: null,
    };

    console.log('🔥 Current streak data:', streakData);

    // Ensure new fields exist for existing data
    if (streakData.availableFreezes === undefined) streakData.availableFreezes = 1;
    if (!streakData.lastFreezeUsedDate) streakData.lastFreezeUsedDate = null;

    const today = new Date().toDateString();
    const lastWorkout = streakData.lastWorkoutDate ? new Date(streakData.lastWorkoutDate).toDateString() : null;

    console.log('🔥 Today:', today);
    console.log('🔥 Last workout date:', lastWorkout);

    if (lastWorkout !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      console.log('🔥 Yesterday:', yesterday);

      if (lastWorkout === yesterday) {
        // Continue streak
        streakData.workoutStreak++;
        console.log('🔥 Continuing streak, new value:', streakData.workoutStreak);
      } else {
        // Streak would break - check if we can use a freeze
        if (streakData.workoutStreak > 0 && streakData.availableFreezes > 0) {
          // Use a freeze to maintain the streak
          streakData.availableFreezes--;
          streakData.lastFreezeUsedDate = new Date().toISOString();
          console.log('🔥 Streak freeze used! Remaining freezes:', streakData.availableFreezes);
          // Keep the streak alive but don't increment it
        } else {
          // No freeze available, reset streak
          streakData.workoutStreak = 1;
          console.log('🔥 Streak reset to 1');
        }
      }

      streakData.lastWorkoutDate = new Date().toISOString();
      streakData.totalWorkouts++;

      if (streakData.workoutStreak > streakData.longestWorkoutStreak) {
        streakData.longestWorkoutStreak = streakData.workoutStreak;
      }

      // Earn a new freeze every 7 days of streak
      if (streakData.workoutStreak > 0 && streakData.workoutStreak % 7 === 0) {
        streakData.availableFreezes++;
        console.log('🔥 Earned a new freeze! Total freezes:', streakData.availableFreezes);
      }

      console.log('🔥 Saving updated streak data:', streakData);
      await AsyncStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify(streakData));

      // Check streak achievements
      await checkStreakAchievements(streakData);
    } else {
      console.log('🔥 Already worked out today, no streak update needed');
    }
  } catch (error) {
    console.error('🔥 Failed to update workout streak:', error);
    // Don't show alert - silently log the error
  }
};

export const getStreakData = async (): Promise<StreakData> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_DATA);
    const streakData = data ? JSON.parse(data) : {
      workoutStreak: 0,
      nutritionStreak: 0,
      lastWorkoutDate: null,
      lastNutritionLogDate: null,
      longestWorkoutStreak: 0,
      longestNutritionStreak: 0,
      totalWorkouts: 0,
      totalNutritionDays: 0,
      availableFreezes: 1,
      lastFreezeUsedDate: null,
    };

    // Ensure new fields exist for backward compatibility
    if (streakData.availableFreezes === undefined) streakData.availableFreezes = 1;
    if (!streakData.lastFreezeUsedDate) streakData.lastFreezeUsedDate = null;

    return streakData;
  } catch (error) {
    Alert.alert('Error', 'Failed to get streak data. Please try again.');

    console.error('Failed to get streak data:', error);
    return {
      workoutStreak: 0,
      nutritionStreak: 0,
      lastWorkoutDate: null,
      lastNutritionLogDate: null,
      longestWorkoutStreak: 0,
      longestNutritionStreak: 0,
      totalWorkouts: 0,
      totalNutritionDays: 0,
      availableFreezes: 1,
      lastFreezeUsedDate: null,
    };
  }
};

// Achievement System
const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  // Workout Achievements
  { id: 'first_workout', title: 'First Steps', description: 'Complete your first workout', icon: 'run', category: 'workout', target: 1 },
  { id: 'week_warrior', title: 'Week Warrior', description: 'Work out 7 days in a row', icon: 'calendar-check', category: 'streak', target: 7 },
  { id: 'month_master', title: 'Month Master', description: 'Work out 30 days in a row', icon: 'trophy', category: 'streak', target: 30, level: 'gold' },
  { id: 'century_club', title: 'Century Club', description: 'Complete 100 workouts', icon: 'medal', category: 'milestone', target: 100, level: 'platinum' },

  // Weight Progress Achievements
  { id: 'weight_logger', title: 'Weight Logger', description: 'Log your weight 10 times', icon: 'scale', category: 'progress', target: 10 },
  { id: 'consistent_tracker', title: 'Consistent Tracker', description: 'Log weight for 30 days', icon: 'chart-line', category: 'progress', target: 30, level: 'silver' },

  // Nutrition Achievements
  { id: 'meal_planner', title: 'Meal Planner', description: 'Follow meal plan for 7 days', icon: 'food-apple', category: 'nutrition', target: 7 },
  { id: 'nutrition_master', title: 'Nutrition Master', description: 'Log meals for 30 days straight', icon: 'nutrition', category: 'nutrition', target: 30, level: 'gold' },
];

export const getAchievements = async (): Promise<Achievement[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    const unlockedIds = data ? JSON.parse(data) : [];

    return ACHIEVEMENT_DEFINITIONS.map(achievement => ({
      ...achievement,
      unlockedAt: unlockedIds.includes(achievement.id) ? new Date().toISOString() : undefined,
    }));
  } catch (error) {
    Alert.alert('Error', 'Failed to get achievements. Please try again.');

    console.error('Failed to get achievements:', error);
    return ACHIEVEMENT_DEFINITIONS;
  }
};

export const unlockAchievement = async (achievementId: string): Promise<void> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
    const unlockedIds: string[] = data ? JSON.parse(data) : [];

    if (!unlockedIds.includes(achievementId)) {
      unlockedIds.push(achievementId);
      await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(unlockedIds));
    }
  } catch (error) {
    Alert.alert('Error', 'Failed to unlock achievement. Please try again.');

    console.error('Failed to unlock achievement:', error);
  }
};

// Achievement Checkers
const checkWeightAchievements = async (entries: WeightEntry[]) => {
  if (entries.length >= 10) {
    await unlockAchievement('weight_logger');
  }

  // Check for 30 days of consistent tracking
  if (entries.length >= 30) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const recentEntries = entries.filter(e => new Date(e.date) > thirtyDaysAgo);
    if (recentEntries.length >= 30) {
      await unlockAchievement('consistent_tracker');
    }
  }
};

const checkWorkoutAchievements = async (entries: WorkoutPerformance[]) => {
  if (entries.length >= 1) {
    await unlockAchievement('first_workout');
  }

  if (entries.length >= 100) {
    await unlockAchievement('century_club');
  }
};

const checkStreakAchievements = async (streakData: StreakData) => {
  if (streakData.workoutStreak >= 7) {
    await unlockAchievement('week_warrior');
  }

  if (streakData.workoutStreak >= 30) {
    await unlockAchievement('month_master');
  }
};

// Level System
export const getUserLevel = async (): Promise<{ level: number; experience: number; nextLevelXP: number }> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_LEVEL);
    return data ? JSON.parse(data) : { level: 1, experience: 0, nextLevelXP: 100 };
  } catch (error) {
    Alert.alert('Error', 'Failed to get user level. Please try again.');

    console.error('Failed to get user level:', error);
    return { level: 1, experience: 0, nextLevelXP: 100 };
  }
};

export const addExperience = async (xp: number): Promise<void> => {
  try {
    const levelData = await getUserLevel();
    levelData.experience += xp;

    // Level up logic
    while (levelData.experience >= levelData.nextLevelXP) {
      levelData.experience -= levelData.nextLevelXP;
      levelData.level++;
      levelData.nextLevelXP = Math.floor(levelData.nextLevelXP * 1.5);
    }

    await AsyncStorage.setItem(STORAGE_KEYS.USER_LEVEL, JSON.stringify(levelData));
  } catch (error) {
    Alert.alert('Error', 'Failed to add experience. Please try again.');

    console.error('Failed to add experience:', error);
  }
};