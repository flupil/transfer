import React, { createContext, useState, useContext, ReactNode } from 'react';
import { firebaseDailyDataService } from '../services/firebaseDailyDataService';
import { useAuth } from './AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingData {
  appPurpose?: 'gym' | 'football';
  appInterest?: 'workouts' | 'football' | 'nutrition' | 'both';
  gender?: string;
  currentWeight?: number;
  weightUnit?: 'kg' | 'lb';
  height?: number;
  heightUnit?: 'cm' | 'ft';
  age?: number;
  activityLevel?: string;
  fitnessLevel?: number;
  goals?: string[];
  targetWeight?: number;
  targetWeightUnit?: 'kg' | 'lb';
  dietaryPreferences?: string[];
  allergens?: string[];
  diets?: string[];
  workoutPreferences?: string[];
  workoutDays?: string[];
  selectedWorkoutPlanId?: number;
  selectedMealPlanId?: string;
  calorieTarget?: number;
  calorieTargetType?: string;
  notifications?: {
    workoutReminders: boolean;
    progressUpdates: boolean;
    motivationalMessages: boolean;
  };
}

interface OnboardingContextType {
  onboardingData: OnboardingData;
  updateOnboardingData: (data: Partial<OnboardingData>) => void;
  saveOnboardingData: () => Promise<void>;
  calculateTargets: () => { calories: number; protein: number; carbs: number; fat: number; water: number };
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    notifications: {
      workoutReminders: true,
      progressUpdates: true,
      motivationalMessages: false,
    }
  });

  const updateOnboardingData = (data: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...data }));
  };

  const calculateTargets = () => {
    const { currentWeight, weightUnit, height, heightUnit, age, gender, activityLevel, goals, targetWeight, targetWeightUnit } = onboardingData;

    // Convert to metric if needed (height is already stored in cm)
    const weightKg = weightUnit === 'lb' ? (currentWeight || 0) / 2.20462 : (currentWeight || 0);
    const heightCm = height || 0; // Height is always stored in cm
    const targetWeightKg = targetWeightUnit === 'lb' ? (targetWeight || weightKg) / 2.20462 : (targetWeight || weightKg);

    // Calculate BMR using Mifflin-St Jeor equation
    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * (age || 25) + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * (age || 25) - 161;
    }

    // Activity multipliers (matching calculator.net)
    const activityMultipliers: Record<string, number> = {
      'sedentary': 1.2,              // Little or no exercise
      'lightly-active': 1.375,       // Exercise 1-3 times/week
      'moderately-active': 1.55,     // Exercise 4-5 times/week
      'very-active': 1.725,          // Daily exercise or intense exercise 3-4 times/week
      'extra-active': 1.9            // Intense exercise 6-7 times/week
    };

    const activityMultiplier = activityMultipliers[activityLevel || 'moderately-active'] || 1.55;
    const tdee = bmr * activityMultiplier;

    // Calculate all calorie scenarios (matching calculator.net exactly)
    // Based on the formula: 1 kg fat = ~7700 calories
    // Percentages from calculator.net results
    const maintainCalories = Math.round(tdee);
    const mildWeightLoss = Math.round(tdee * 0.90);      // 0.25 kg/week loss (90% of TDEE)
    const weightLoss = Math.round(tdee * 0.79);          // 0.5 kg/week loss (79% of TDEE)
    const extremeWeightLoss = Math.round(tdee * 0.59);   // 1 kg/week loss (59% of TDEE)
    const mildWeightGain = Math.round(tdee * 1.10);      // 0.25 kg/week gain (110% of TDEE)
    const weightGain = Math.round(tdee * 1.21);          // 0.5 kg/week gain (121% of TDEE)

    // Determine which calorie target to use based on goals and weight difference
    const weightDiff = weightKg - targetWeightKg;
    let calories = maintainCalories;

    if (goals?.includes('lose-weight') || weightDiff > 0) {
      // Weight loss goals
      if (weightDiff > 10) {
        calories = extremeWeightLoss;
      } else if (weightDiff > 5) {
        calories = weightLoss;
      } else {
        calories = mildWeightLoss;
      }
    } else if (goals?.includes('gain-muscle') || weightDiff < 0) {
      // Weight gain goals
      const absWeightDiff = Math.abs(weightDiff);
      if (absWeightDiff > 5) {
        calories = weightGain;
      } else {
        calories = mildWeightGain;
      }
    }

    // Safety check: never go below minimum recommended calories
    const minCalories = gender === 'male' ? 1500 : 1200;
    calories = Math.max(calories, minCalories);

    // Calculate macros based on goals
    let proteinRatio = 0.25;
    let carbRatio = 0.45;
    let fatRatio = 0.30;

    if (goals?.includes('gain-muscle') || goals?.includes('get-stronger')) {
      // High protein for muscle gain
      proteinRatio = 0.30;
      carbRatio = 0.45;
      fatRatio = 0.25;
    } else if (goals?.includes('lose-weight')) {
      // Higher protein to preserve muscle during weight loss
      proteinRatio = 0.35;
      carbRatio = 0.35;
      fatRatio = 0.30;
    } else if (goals?.includes('improve-endurance')) {
      // Higher carbs for endurance
      proteinRatio = 0.20;
      carbRatio = 0.55;
      fatRatio = 0.25;
    }

    const protein = Math.round((calories * proteinRatio) / 4);
    const carbs = Math.round((calories * carbRatio) / 4);
    const fat = Math.round((calories * fatRatio) / 9);

    // Water intake (ml) - 35ml per kg of body weight
    const water = Math.round(weightKg * 35);

    return {
      calories: Math.round(calories),
      protein,
      carbs,
      fat,
      water,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      maintainCalories,
      mildWeightLoss,
      weightLoss,
      extremeWeightLoss,
      mildWeightGain,
      weightGain,
    };
  };

  const saveOnboardingData = async () => {
    if (!user) return;

    const targets = calculateTargets();

    // If user didn't manually set calorie target (skipped calorie results screen),
    // but provided a target weight, use the recommended calorie target
    if (!onboardingData.calorieTarget && onboardingData.targetWeight) {
      onboardingData.calorieTarget = targets.calories;
      console.log('✓ Auto-set calorie target based on target weight:', targets.calories);
    }

    // Convert weight to kg for storage
    const weightKg = onboardingData.weightUnit === 'lb'
      ? (onboardingData.currentWeight || 0) / 2.20462
      : (onboardingData.currentWeight || 0);

    // CRITICAL: Save to AsyncStorage for nutrition onboarding to read
    const onboardingDataForNutrition = {
      weight: weightKg,
      height: onboardingData.height,
      age: onboardingData.age,
      gender: onboardingData.gender,
      activityLevel: onboardingData.activityLevel
    };

    await AsyncStorage.setItem(
      `onboarding_data_${user.id}`,
      JSON.stringify(onboardingDataForNutrition)
    );
    console.log('✓ Saved onboarding data to AsyncStorage for nutrition onboarding:', onboardingDataForNutrition);

    // CRITICAL: Save appPurpose to AsyncStorage for AppHeader to read
    if (onboardingData.appPurpose) {
      await AsyncStorage.setItem('appPurpose', onboardingData.appPurpose);
      console.log('✓ Saved appPurpose to AsyncStorage:', onboardingData.appPurpose);
    }

    // Save to Firebase user profile
    const profileData: any = {
      appInterest: onboardingData.appInterest,
      gender: onboardingData.gender,
      age: onboardingData.age,
      height: onboardingData.height,
      heightUnit: onboardingData.heightUnit,
      currentWeight: onboardingData.currentWeight,
      weightUnit: onboardingData.weightUnit,
      targets,
      onboardingCompleted: true,
      onboardingDate: new Date().toISOString()
    };

    // Only add optional fields if they are defined (Firebase doesn't allow undefined)
    if (onboardingData.targetWeight !== undefined) profileData.targetWeight = onboardingData.targetWeight;
    if (onboardingData.targetWeightUnit !== undefined) profileData.targetWeightUnit = onboardingData.targetWeightUnit;
    if (onboardingData.activityLevel !== undefined) profileData.activityLevel = onboardingData.activityLevel;
    if (onboardingData.fitnessLevel !== undefined) profileData.fitnessLevel = onboardingData.fitnessLevel;
    if (onboardingData.goals !== undefined) profileData.goals = onboardingData.goals;
    if (onboardingData.dietaryPreferences !== undefined) profileData.dietaryPreferences = onboardingData.dietaryPreferences;
    if (onboardingData.allergens !== undefined) profileData.allergens = onboardingData.allergens;
    if (onboardingData.diets !== undefined) profileData.diets = onboardingData.diets;
    if (onboardingData.workoutPreferences !== undefined) profileData.workoutPreferences = onboardingData.workoutPreferences;
    if (onboardingData.workoutDays !== undefined) profileData.workoutDays = onboardingData.workoutDays;
    if (onboardingData.notifications !== undefined) profileData.notifications = onboardingData.notifications;
    if (onboardingData.appPurpose !== undefined) profileData.appPurpose = onboardingData.appPurpose;

    // Update user profile in Firebase
    await firebaseDailyDataService.updateUserProfile(user.id, profileData);

    // Set initial daily targets
    const todayData = await firebaseDailyDataService.getTodayData(user.id);
    if (!todayData.calories.target) {
      await firebaseDailyDataService.updateTargets(user.id, targets);
    }

    // Save selected workout plan if exists
    if (onboardingData.selectedWorkoutPlanId) {
      const { selectWorkoutPlan } = await import('../services/workoutPlanService');
      await selectWorkoutPlan(onboardingData.selectedWorkoutPlanId.toString());
    }
  };

  return (
    <OnboardingContext.Provider value={{
      onboardingData,
      updateOnboardingData,
      saveOnboardingData,
      calculateTargets
    }}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};