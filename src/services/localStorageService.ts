// Using AsyncStorage for persistent key-value storage
import { format, parseISO } from 'date-fns';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FoodItem,
  FoodIntake,
  CustomMeal,
  DailyDiary,
  RecentFoods,
  MealType,
  NutritionInfo
} from '../types/nutrition.types';
import { validateNutritionInfo, sanitizeNutritionInfo } from '../utils/nutritionValidation';

// Wrapper for AsyncStorage to match MMKV-like interface
const storage = {
  getString: async (key: string): Promise<string | undefined> => {
    const value = await AsyncStorage.getItem(key);
    return value ?? undefined;
  },
  set: async (key: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(key, value);
  },
  delete: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  },
  getAllKeys: async (): Promise<string[]> => {
    return await AsyncStorage.getAllKeys();
  },
};

console.log('✅ Using AsyncStorage for persistent storage');

// Storage keys
const KEYS = {
  DIARY: (userId: string, date: string) => `diary_${userId}_${date}`,
  CUSTOM_MEALS: (userId: string) => `customMeals_${userId}`,
  RECENT_FOODS: (userId: string) => `recentFoods_${userId}`,
  FAVORITES: (userId: string) => `favorites_${userId}`,
  FOOD_CACHE: (foodId: string) => `foodCache_${foodId}`,
  TARGETS: (userId: string) => `targets_${userId}`
};

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    return date;
  }
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get daily diary for a specific date
 */
export const getDailyDiary = async (userId: string, date: Date | string = new Date()): Promise<DailyDiary> => {
  const dateStr = formatDate(date);
  const key = KEYS.DIARY(userId, dateStr);
  const data = await storage.getString(key);

  if (data) {
    const diary = JSON.parse(data);
    // Parse date strings back to Date objects
    diary.breakfast = diary.breakfast?.map((intake: any) => ({
      ...intake,
      dateTime: new Date(intake.dateTime)
    })) || [];
    diary.lunch = diary.lunch?.map((intake: any) => ({
      ...intake,
      dateTime: new Date(intake.dateTime)
    })) || [];
    diary.dinner = diary.dinner?.map((intake: any) => ({
      ...intake,
      dateTime: new Date(intake.dateTime)
    })) || [];
    diary.snacks = diary.snacks?.map((intake: any) => ({
      ...intake,
      dateTime: new Date(intake.dateTime)
    })) || [];
    return diary;
  }

  // Return empty diary with default targets
  const targets = await getUserTargets(userId);
  return {
    id: `diary_${userId}_${dateStr}`,
    userId,
    date: dateStr,
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
    totalNutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    },
    targets,
    waterIntake: 0
  };
};

/**
 * Save daily diary
 */
export const saveDailyDiary = async (diary: DailyDiary): Promise<void> => {
  const key = KEYS.DIARY(diary.userId, diary.date);
  await storage.set(key, JSON.stringify(diary));
};

/**
 * Add food intake to diary
 */
export const addFoodIntake = async (userId: string, intake: FoodIntake): Promise<DailyDiary> => {
  // Validate and sanitize nutrition data
  const sanitizedIntake = {
    ...intake,
    nutrition: sanitizeNutritionInfo(intake.nutrition)
  };

  const dateStr = formatDate(sanitizedIntake.dateTime);
  const diary = await getDailyDiary(userId, dateStr);

  // Add to appropriate meal type
  switch (sanitizedIntake.mealType) {
    case MealType.BREAKFAST:
      diary.breakfast.push(sanitizedIntake);
      break;
    case MealType.LUNCH:
      diary.lunch.push(sanitizedIntake);
      break;
    case MealType.DINNER:
      diary.dinner.push(sanitizedIntake);
      break;
    case MealType.SNACK:
      diary.snacks.push(sanitizedIntake);
      break;
  }

  // Recalculate totals
  diary.totalNutrition = calculateDailyTotals(diary);

  // Save diary
  await saveDailyDiary(diary);

  // Update recent foods
  await updateRecentFoods(userId, sanitizedIntake.foodItem);

  return diary;
};

/**
 * Remove food intake from diary
 */
export const removeFoodIntake = async (userId: string, intakeId: string, date: Date | string): Promise<DailyDiary> => {
  const diary = await getDailyDiary(userId, date);

  // Remove from all meal types
  diary.breakfast = diary.breakfast.filter(i => i.id !== intakeId);
  diary.lunch = diary.lunch.filter(i => i.id !== intakeId);
  diary.dinner = diary.dinner.filter(i => i.id !== intakeId);
  diary.snacks = diary.snacks.filter(i => i.id !== intakeId);

  // Recalculate totals
  diary.totalNutrition = calculateDailyTotals(diary);

  await saveDailyDiary(diary);
  return diary;
};

/**
 * Update food intake
 */
export const updateFoodIntake = async (userId: string, intake: FoodIntake): Promise<DailyDiary> => {
  // Validate and sanitize nutrition data
  const sanitizedIntake = {
    ...intake,
    nutrition: sanitizeNutritionInfo(intake.nutrition)
  };

  const dateStr = formatDate(sanitizedIntake.dateTime);
  const diary = await getDailyDiary(userId, dateStr);

  // Find and update in appropriate meal type
  const updateInArray = (arr: FoodIntake[]) =>
    arr.map(i => i.id === sanitizedIntake.id ? sanitizedIntake : i);

  diary.breakfast = updateInArray(diary.breakfast);
  diary.lunch = updateInArray(diary.lunch);
  diary.dinner = updateInArray(diary.dinner);
  diary.snacks = updateInArray(diary.snacks);

  // Recalculate totals
  diary.totalNutrition = calculateDailyTotals(diary);

  await saveDailyDiary(diary);
  return diary;
};

/**
 * Calculate daily nutrition totals
 */
function calculateDailyTotals(diary: DailyDiary): NutritionInfo {
  const allIntakes = [
    ...diary.breakfast,
    ...diary.lunch,
    ...diary.dinner,
    ...diary.snacks
  ];

  const totals: NutritionInfo = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    saturatedFat: 0,
    sodium: 0
  };

  allIntakes.forEach(intake => {
    totals.calories += intake.nutrition.calories || 0;
    totals.protein += intake.nutrition.protein || 0;
    totals.carbs += intake.nutrition.carbs || 0;
    totals.fat += intake.nutrition.fat || 0;
    totals.fiber = (totals.fiber || 0) + (intake.nutrition.fiber || 0);
    totals.sugar = (totals.sugar || 0) + (intake.nutrition.sugar || 0);
    totals.saturatedFat = (totals.saturatedFat || 0) + (intake.nutrition.saturatedFat || 0);
    totals.sodium = (totals.sodium || 0) + (intake.nutrition.sodium || 0);
  });

  // Round to 1 decimal place
  totals.calories = Math.round(totals.calories);
  totals.protein = Math.round(totals.protein * 10) / 10;
  totals.carbs = Math.round(totals.carbs * 10) / 10;
  totals.fat = Math.round(totals.fat * 10) / 10;
  totals.fiber = Math.round((totals.fiber || 0) * 10) / 10;
  totals.sugar = Math.round((totals.sugar || 0) * 10) / 10;
  totals.saturatedFat = Math.round((totals.saturatedFat || 0) * 10) / 10;
  totals.sodium = Math.round(totals.sodium || 0);

  return totals;
}

/**
 * Copy meal to another date
 */
export const copyMeal = async (
  userId: string,
  intakeId: string,
  fromDate: Date | string,
  toDate: Date | string,
  toMealType?: MealType
): Promise<DailyDiary> => {
  const fromDiary = await getDailyDiary(userId, fromDate);
  const toDiary = await getDailyDiary(userId, toDate);

  // Find the intake
  const allIntakes = [
    ...fromDiary.breakfast,
    ...fromDiary.lunch,
    ...fromDiary.dinner,
    ...fromDiary.snacks
  ];

  const intake = allIntakes.find(i => i.id === intakeId);
  if (!intake) {
    throw new Error('Intake not found');
  }

  // Create new intake with new ID and date
  const newIntake: FoodIntake = {
    ...intake,
    id: `intake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    dateTime: new Date(formatDate(toDate)),
    mealType: toMealType || intake.mealType
  };

  return await addFoodIntake(userId, newIntake);
};

/**
 * Copy entire day
 */
export const copyDay = async (userId: string, fromDate: Date | string, toDate: Date | string): Promise<DailyDiary> => {
  const fromDiary = await getDailyDiary(userId, fromDate);
  const toDiary = await getDailyDiary(userId, toDate);

  const copyIntakes = (intakes: FoodIntake[], mealType: MealType) => {
    intakes.forEach(intake => {
      const newIntake: FoodIntake = {
        ...intake,
        id: `intake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        dateTime: new Date(formatDate(toDate)),
        mealType
      };

      switch (mealType) {
        case MealType.BREAKFAST:
          toDiary.breakfast.push(newIntake);
          break;
        case MealType.LUNCH:
          toDiary.lunch.push(newIntake);
          break;
        case MealType.DINNER:
          toDiary.dinner.push(newIntake);
          break;
        case MealType.SNACK:
          toDiary.snacks.push(newIntake);
          break;
      }
    });
  };

  copyIntakes(fromDiary.breakfast, MealType.BREAKFAST);
  copyIntakes(fromDiary.lunch, MealType.LUNCH);
  copyIntakes(fromDiary.dinner, MealType.DINNER);
  copyIntakes(fromDiary.snacks, MealType.SNACK);

  toDiary.totalNutrition = calculateDailyTotals(toDiary);
  await saveDailyDiary(toDiary);

  return toDiary;
};

/**
 * Get custom meals for user
 */
export const getCustomMeals = async (userId: string): Promise<CustomMeal[]> => {
  const key = KEYS.CUSTOM_MEALS(userId);
  const data = await storage.getString(key);
  return data ? JSON.parse(data) : [];
};

/**
 * Save custom meal
 */
export const saveCustomMeal = async (userId: string, meal: CustomMeal): Promise<void> => {
  const meals = await getCustomMeals(userId);
  const existingIndex = meals.findIndex(m => m.id === meal.id);

  if (existingIndex >= 0) {
    meals[existingIndex] = meal;
  } else {
    meals.push(meal);
  }

  await storage.set(KEYS.CUSTOM_MEALS(userId), JSON.stringify(meals));
};

/**
 * Delete custom meal
 */
export const deleteCustomMeal = async (userId: string, mealId: string): Promise<void> => {
  const meals = await getCustomMeals(userId);
  const filtered = meals.filter(m => m.id !== mealId);
  await storage.set(KEYS.CUSTOM_MEALS(userId), JSON.stringify(filtered));
};

/**
 * Get recent foods
 */
export const getRecentFoods = async (userId: string): Promise<RecentFoods> => {
  const key = KEYS.RECENT_FOODS(userId);
  const data = await storage.getString(key);

  if (data) {
    const recent = JSON.parse(data);
    // Parse dates
    recent.foods = recent.foods.map((item: any) => ({
      ...item,
      lastUsed: new Date(item.lastUsed)
    }));
    return recent;
  }

  return {
    userId,
    foods: []
  };
};

/**
 * Update recent foods when food is logged
 */
async function updateRecentFoods(userId: string, foodItem: FoodItem): Promise<void> {
  const recent = await getRecentFoods(userId);

  const existingIndex = recent.foods.findIndex(f => f.foodItem.id === foodItem.id);

  if (existingIndex >= 0) {
    // Update existing
    recent.foods[existingIndex].lastUsed = new Date();
    recent.foods[existingIndex].frequency += 1;
  } else {
    // Add new
    recent.foods.push({
      foodItem,
      lastUsed: new Date(),
      frequency: 1
    });
  }

  // Sort by last used, keep top 50
  recent.foods.sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());
  recent.foods = recent.foods.slice(0, 50);

  await storage.set(KEYS.RECENT_FOODS(userId), JSON.stringify(recent));
}

/**
 * Get favorites
 */
export const getFavorites = async (userId: string): Promise<FoodItem[]> => {
  const key = KEYS.FAVORITES(userId);
  const data = await storage.getString(key);
  return data ? JSON.parse(data) : [];
};

/**
 * Add to favorites
 */
export const addFavorite = async (userId: string, foodItem: FoodItem): Promise<void> => {
  const favorites = await getFavorites(userId);
  if (!favorites.find(f => f.id === foodItem.id)) {
    favorites.push(foodItem);
    await storage.set(KEYS.FAVORITES(userId), JSON.stringify(favorites));
  }
};

/**
 * Remove from favorites
 */
export const removeFavorite = async (userId: string, foodId: string): Promise<void> => {
  const favorites = await getFavorites(userId);
  const filtered = favorites.filter(f => f.id !== foodId);
  await storage.set(KEYS.FAVORITES(userId), JSON.stringify(filtered));
};

/**
 * Cache food item for offline access
 */
export const cacheFoodItem = async (foodItem: FoodItem): Promise<void> => {
  const key = KEYS.FOOD_CACHE(foodItem.id);
  await storage.set(key, JSON.stringify(foodItem));
};

/**
 * Get cached food item
 */
export const getCachedFood = async (foodId: string): Promise<FoodItem | null> => {
  const key = KEYS.FOOD_CACHE(foodId);
  const data = await storage.getString(key);
  return data ? JSON.parse(data) : null;
};

/**
 * Get user's daily targets
 */
export const getUserTargets = async (userId: string): Promise<DailyDiary['targets']> => {
  const key = KEYS.TARGETS(userId);
  const data = await storage.getString(key);

  if (data) {
    return JSON.parse(data);
  }

  // Default targets
  return {
    calories: 2000,
    protein: 150,
    carbs: 225,
    fat: 65,
    water: 2000
  };
};

/**
 * Update user's daily targets
 */
export const updateUserTargets = async (
  userId: string,
  targets: DailyDiary['targets']
): Promise<void> => {
  const key = KEYS.TARGETS(userId);
  await storage.set(key, JSON.stringify(targets));
};

/**
 * Update water intake
 */
export const updateWaterIntake = async (userId: string, date: Date | string, amount: number): Promise<DailyDiary> => {
  const diary = await getDailyDiary(userId, date);
  diary.waterIntake = amount;
  await saveDailyDiary(diary);
  return diary;
};

/**
 * Get all diary dates (for calendar view)
 */
export const getAllDiaryDates = async (userId: string): Promise<string[]> => {
  const allKeys = await storage.getAllKeys();
  const prefix = `diary_${userId}_`;

  return allKeys
    .filter(key => key.startsWith(prefix))
    .map(key => key.replace(prefix, ''))
    .sort()
    .reverse(); // Most recent first
};

/**
 * Clear all data for user (use with caution!)
 */
export const clearUserData = async (userId: string): Promise<void> => {
  const allKeys = await storage.getAllKeys();
  for (const key of allKeys) {
    if (key.includes(userId)) {
      await storage.delete(key);
    }
  }
};
