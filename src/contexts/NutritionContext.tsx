import React, { createContext, useState, useContext, useEffect, ReactNode, useRef } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';
import {
  FoodItem,
  FoodIntake,
  CustomMeal,
  DailyDiary,
  MealType,
  NutritionInfo
} from '../types/nutrition.types';
import { firebaseDailyDataService, DailyData } from '../services/firebaseDailyDataService';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as storageService from '../services/localStorageService';
import { offlineQueueService } from '../services/offlineQueueService';

interface NutritionContextType {
  // Current diary state
  currentDiary: DailyDiary | null;
  selectedDate: Date;

  // Actions
  setSelectedDate: (date: Date) => void;
  addFoodIntake: (intake: FoodIntake) => Promise<void>;
  removeFoodIntake: (intakeId: string) => Promise<void>;
  updateFoodIntake: (intake: FoodIntake) => Promise<void>;
  copyMeal: (intakeId: string, toDate: Date, toMealType?: MealType) => Promise<void>;
  copyDay: (fromDate: Date, toDate: Date) => Promise<void>;
  updateWaterIntake: (amount: number) => Promise<void>;
  addWater: (amountMl: number) => Promise<void>; // NEW: Single entry point for water additions

  // Getters
  getTodayTotals: () => NutritionInfo;
  getRemainingCalories: () => number;
  getRemainingMacros: () => { protein: number; carbs: number; fat: number };

  // Recent foods & favorites
  recentFoods: FoodItem[];
  favorites: FoodItem[];
  addFavorite: (foodItem: FoodItem) => Promise<void>;
  removeFavorite: (foodId: string) => Promise<void>;

  // Custom meals
  customMeals: CustomMeal[];
  saveCustomMeal: (meal: CustomMeal) => Promise<void>;
  deleteCustomMeal: (mealId: string) => Promise<void>;

  // Diary history
  diaryDates: string[];
  refreshDiary: () => void;
}

const NutritionContext = createContext<NutritionContextType | undefined>(undefined);

export const NutritionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentDiary, setCurrentDiary] = useState<DailyDiary | null>(null);
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);
  const [favorites, setFavorites] = useState<FoodItem[]>([]);
  const [customMeals, setCustomMeals] = useState<CustomMeal[]>([]);
  const [diaryDates, setDiaryDates] = useState<string[]>([]);

  // Ref to store the unsubscribe function for real-time updates
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Helper: Convert DailyData (Firebase) to DailyDiary (UI format)
  const convertToDailyDiary = (dailyData: DailyData): DailyDiary => {
    return {
      id: `diary_${dailyData.userId}_${dailyData.date}`,
      userId: dailyData.userId,
      date: dailyData.date,
      breakfast: dailyData.meals?.breakfast || [],
      lunch: dailyData.meals?.lunch || [],
      dinner: dailyData.meals?.dinner || [],
      snacks: dailyData.meals?.snacks || [],
      totalNutrition: {
        calories: dailyData.calories.consumed,
        protein: dailyData.protein.consumed,
        carbs: dailyData.carbs.consumed,
        fat: dailyData.fat.consumed
      },
      targets: {
        calories: dailyData.calories.target,
        protein: dailyData.protein.target,
        carbs: dailyData.carbs.target,
        fat: dailyData.fat.target,
        water: dailyData.water.target * 250 // Convert glasses to ml
      },
      waterIntake: dailyData.water.consumed * 250 // Convert glasses to ml
    };
  };

  // Initialize offline queue service
  useEffect(() => {
    offlineQueueService.initialize();
    return () => {
      offlineQueueService.cleanup();
    };
  }, []);

  // Set up real-time sync when date or user changes
  useEffect(() => {
    console.log('🔥 NutritionContext: useEffect running, user:', user ? user.id : 'NO USER', 'selectedDate:', selectedDate.toISOString());

    if (!user) {
      console.log('⚠️ NutritionContext: No user, cleaning up subscription');
      // Clean up subscription if user logs out
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      setCurrentDiary(null);
      return;
    }

    // Load supplementary data (not real-time)
    loadRecentFoods();
    loadFavorites();
    loadCustomMeals();
    loadDiaryDates();

    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Set up real-time subscription for diary
    const dateStr = selectedDate.toISOString().split('T')[0];

    // Create a local fallback diary in case Firebase fails
    const createLocalDiary = () => {
      console.log('⚠️ NutritionContext: Creating local fallback diary');
      const localDiary: DailyDiary = {
        id: `diary_${user.id}_${dateStr}`,
        userId: user.id,
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
        targets: {
          calories: 2000,
          protein: 150,
          carbs: 250,
          fat: 65,
          water: 2000
        },
        waterIntake: 0
      };
      setCurrentDiary(localDiary);
      console.log('✅ NutritionContext: Local diary created');
    };

    try {
      let hasReceivedData = false;
      const timeout = setTimeout(() => {
        if (!hasReceivedData) {
          console.log('⚠️ NutritionContext: Subscription timeout - creating local diary as fallback');
          createLocalDiary();
        }
      }, 3000); // 3 second timeout

      unsubscribeRef.current = firebaseDailyDataService.subscribeToDailyData(
        user.id,
        dateStr,
        (dailyData) => {
          hasReceivedData = true;
          clearTimeout(timeout);

          const diary = convertToDailyDiary(dailyData);

          setCurrentDiary(diary);
        }
      );
      console.log('✅ NutritionContext: Subscription set up successfully');
    } catch (error) {
      console.log('❌ NutritionContext: Error setting up subscription:', error);
      console.log('⚠️ NutritionContext: Using local diary due to error');
      createLocalDiary();
    }

    // Cleanup function - unsubscribe when component unmounts or dependencies change
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user, selectedDate]);

  // Legacy method kept for manual refresh if needed
  const loadDiary = async (date: Date) => {
    if (!user) return;
    try {
      const dateStr = date.toISOString().split('T')[0];
      const dailyData = await firebaseDailyDataService.getDailyDiary(user.id, dateStr);
      const diary = convertToDailyDiary(dailyData);
      setCurrentDiary(diary);
    } catch (error) {
      Alert.alert('Error', 'Failed to load your food diary. Please try again.');
      console.error('Error loading diary:', error);
    }
  };

  const loadRecentFoods = async () => {
    if (!user) return;
    const recent = await storageService.getRecentFoods(user.id);
    setRecentFoods(recent.foods.map(f => f.foodItem));
  };

  const loadFavorites = async () => {
    if (!user) return;
    const favs = await storageService.getFavorites(user.id);
    setFavorites(favs);
  };

  const loadCustomMeals = async () => {
    if (!user) return;
    const meals = await storageService.getCustomMeals(user.id);
    setCustomMeals(meals);
  };

  const loadDiaryDates = async () => {
    if (!user) return;
    const dates = await storageService.getAllDiaryDates(user.id);
    setDiaryDates(dates);
  };

  const addFoodIntake = async (intake: FoodIntake) => {



    if (!user || !currentDiary) {
      console.log('❌ Aborting: Missing user or currentDiary');
      return;
    }

    try {
      // Add to Firebase (single source of truth)
      const dateStr = currentDiary.date;

      // Convert mealType to the correct diary key (snack -> snacks)
      const mealTypeKey = intake.mealType.toLowerCase() === 'snack'
        ? 'snacks'
        : intake.mealType.toLowerCase();

      await firebaseDailyDataService.addFoodToMeal(
        user.id,
        dateStr,
        mealTypeKey as 'breakfast' | 'lunch' | 'dinner' | 'snacks',
        intake
      );

      console.log('✅ Food added to Firebase successfully');

      // Real-time subscription will auto-update currentDiary
      // Only refresh supplementary data
      loadRecentFoods(); // Refresh recent foods
      loadDiaryDates(); // Refresh dates
    } catch (error) {
      console.log('❌ Error adding food to Firebase:', error);
      console.log('⚠️ Working offline - updating local diary');

      // Update local diary immediately (convert snack -> snacks)
      const mealTypeKey = intake.mealType.toLowerCase() === 'snack'
        ? 'snacks'
        : intake.mealType.toLowerCase();

      const updatedDiary = {
        ...currentDiary,
        [mealTypeKey]: [...currentDiary[mealTypeKey as 'breakfast' | 'lunch' | 'dinner' | 'snacks'], intake],
      };

      // Recalculate totals
      const allFoods = [
        ...updatedDiary.breakfast,
        ...updatedDiary.lunch,
        ...updatedDiary.dinner,
        ...updatedDiary.snacks,
      ];

      updatedDiary.totalNutrition = allFoods.reduce(
        (totals, food) => ({
          calories: totals.calories + (food.nutrition?.calories || 0),
          protein: totals.protein + (food.nutrition?.protein || 0),
          carbs: totals.carbs + (food.nutrition?.carbs || 0),
          fat: totals.fat + (food.nutrition?.fat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      setCurrentDiary(updatedDiary);
      console.log('✅ Local diary updated with new food');

      // Queue operation for retry when online
      await offlineQueueService.enqueue({
        type: 'addFood',
        data: {
          userId: user.id,
          date: currentDiary.date,
          mealType: intake.mealType.toLowerCase(),
          foodIntake: intake,
        },
      });

      console.log('📋 Food queued for sync when online');
    }
  };

  const removeFoodIntake = async (intakeId: string) => {
    if (!user || !currentDiary) return;
    try {
      // Remove from Firebase (single source of truth)
      const dateStr = currentDiary.date;
      await firebaseDailyDataService.removeFoodFromMeal(user.id, dateStr, intakeId);

      // Real-time subscription will auto-update currentDiary
    } catch (error) {
      Alert.alert('Error', 'Failed to remove food from your diary. Please try again.');
      console.error('NutritionContext: Failed to remove food:', error);
    }
  };

  const updateFoodIntake = async (intake: FoodIntake) => {
    if (!user || !currentDiary) return;
    try {
      // Update in Firebase (single source of truth)
      const dateStr = currentDiary.date;
      await firebaseDailyDataService.updateFoodInMeal(user.id, dateStr, intake);

      // Real-time subscription will auto-update currentDiary
    } catch (error) {
      Alert.alert('Error', 'Failed to update food in your diary. Please try again.');
      console.error('NutritionContext: Failed to update food:', error);
    }
  };

  const copyMeal = async (intakeId: string, toDate: Date, toMealType?: MealType) => {
    if (!user) return;
    await storageService.copyMeal(user.id, intakeId, selectedDate, toDate, toMealType);
    // If copying to current date, refresh
    if (toDate.toDateString() === selectedDate.toDateString()) {
      await loadDiary(selectedDate);
    }
    await loadDiaryDates();
  };

  const copyDay = async (fromDate: Date, toDate: Date) => {
    if (!user) return;
    await storageService.copyDay(user.id, fromDate, toDate);
    // If copying to current date, refresh
    if (toDate.toDateString() === selectedDate.toDateString()) {
      await loadDiary(selectedDate);
    }
    await loadDiaryDates();
  };

  const updateWaterIntake = async (amount: number) => {
    if (!user || !currentDiary) return;
    try {
      // Convert ml to glasses for Firebase (250ml = 1 glass)
      const glasses = Math.round(amount / 250);
      const dateStr = currentDiary.date;

      // Update in Firebase (single source of truth)
      const docRef = doc(db, 'dailyData', `${user.id}_${dateStr}`);
      await updateDoc(docRef, {
        'water.consumed': glasses,
        updatedAt: serverTimestamp()
      });

      // Real-time subscription will auto-update currentDiary
    } catch (error) {
      Alert.alert('Error', 'Failed to update water intake. Please try again.');
      console.error('NutritionContext: Failed to update water:', error);
    }
  };

  // Add water (increment by amount in ml) - SINGLE ENTRY POINT for all water additions
  const addWater = async (amountMl: number) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to track water intake.');
      return;
    }

    try {
      // Convert ml to glasses (250ml = 1 glass)
      const glasses = Math.round(amountMl / 250);

      // Add water through Firebase service (uses today's date automatically)
      await firebaseDailyDataService.addWater(user.id, glasses);

      // Real-time subscription will auto-update currentDiary
    } catch (error) {
      // Queue operation for retry when online
      const dateStr = selectedDate.toISOString().split('T')[0];
      const glasses = Math.round(amountMl / 250);

      await offlineQueueService.enqueue({
        type: 'addWater',
        data: {
          userId: user.id,
          glasses,
          date: dateStr,
        },
      });

      Alert.alert(
        'Queued for Sync',
        'Your water intake will be synced when you\'re back online.',
        [{ text: 'OK' }]
      );
      console.error('NutritionContext: Failed to add water, queued for retry:', error);
      throw error; // Re-throw for caller to handle if needed
    }
  };

  const getTodayTotals = (): NutritionInfo => {
    if (!currentDiary) {
      return {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };
    }
    return currentDiary.totalNutrition;
  };

  const getRemainingCalories = (): number => {
    if (!currentDiary) return 0;
    return currentDiary.targets.calories - currentDiary.totalNutrition.calories;
  };

  const getRemainingMacros = () => {
    if (!currentDiary) {
      return { protein: 0, carbs: 0, fat: 0 };
    }
    return {
      protein: currentDiary.targets.protein - currentDiary.totalNutrition.protein,
      carbs: currentDiary.targets.carbs - currentDiary.totalNutrition.carbs,
      fat: currentDiary.targets.fat - currentDiary.totalNutrition.fat
    };
  };

  const addFavorite = async (foodItem: FoodItem) => {
    if (!user) return;
    await storageService.addFavorite(user.id, foodItem);
    await loadFavorites();
  };

  const removeFavorite = async (foodId: string) => {
    if (!user) return;
    await storageService.removeFavorite(user.id, foodId);
    await loadFavorites();
  };

  const saveCustomMeal = async (meal: CustomMeal) => {
    if (!user) return;
    await storageService.saveCustomMeal(user.id, meal);
    await loadCustomMeals();
  };

  const deleteCustomMeal = async (mealId: string) => {
    if (!user) return;
    await storageService.deleteCustomMeal(user.id, mealId);
    await loadCustomMeals();
  };

  const refreshDiary = () => {
    loadDiary(selectedDate);
    loadRecentFoods();
    loadFavorites();
    loadCustomMeals();
    loadDiaryDates();
  };

  return (
    <NutritionContext.Provider
      value={{
        currentDiary,
        selectedDate,
        setSelectedDate,
        addFoodIntake,
        removeFoodIntake,
        updateFoodIntake,
        copyMeal,
        copyDay,
        updateWaterIntake,
        addWater,
        getTodayTotals,
        getRemainingCalories,
        getRemainingMacros,
        recentFoods,
        favorites,
        addFavorite,
        removeFavorite,
        customMeals,
        saveCustomMeal,
        deleteCustomMeal,
        diaryDates,
        refreshDiary
      }}
    >
      {children}
    </NutritionContext.Provider>
  );
};

export const useNutrition = () => {
  const context = useContext(NutritionContext);
  if (!context) {
    throw new Error('useNutrition must be used within a NutritionProvider');
  }
  return context;
};
