import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

// Define meal type for navigation
export type MealTypeId = 'breakfast' | 'lunch' | 'snack' | 'dinner';

// ===========================
// NUTRITION STACK PARAMS
// ===========================
export type NutritionStackParamList = {
  NutritionMain: {
    scrollToLogMeal?: boolean;
  } | undefined;
  FoodLog: {
    mealType?: string;
  } | undefined;
  MealLog: {
    mealType: MealTypeId;
    mealName: string;
  };
  FoodSearch: {
    mealType?: string;
    onFoodSelected?: (food: any) => void;
  } | undefined;
  ManualFoodEntry: {
    mealType?: string;
  } | undefined;
  PhotoMealLog: {
    mealType?: string;
  } | undefined;
  AINutritionAdvisor: undefined;
  CreateCustomFood: {
    mealType?: string;
  } | undefined;
  CreateCustomMeal: undefined;
  FoodDiary: undefined;
  MealPlans: undefined;
  MealPlanSelection: undefined;
  MealDetail: {
    mealId: string;
    mealName?: string;
  };
};

// Navigation prop types for Nutrition screens
export type NutritionScreenNavigationProp<T extends keyof NutritionStackParamList> =
  StackNavigationProp<NutritionStackParamList, T>;

// Route prop types for Nutrition screens
export type NutritionScreenRouteProp<T extends keyof NutritionStackParamList> =
  RouteProp<NutritionStackParamList, T>;

// ===========================
// WORKOUT STACK PARAMS
// ===========================
export type WorkoutStackParamList = {
  WorkoutMain: undefined;
  WorkoutPlanSelection: undefined;
  AIWorkoutGenerator: undefined;
  WorkoutDetail: {
    planId: string;
    planName?: string;
  };
  EditWeek: {
    planId: string;
    weekNumber: number;
  };
  WorkoutLog: {
    planId?: string;
    dayNumber?: number;
  } | undefined;
  PersonalRecords: undefined;
  ProgressPhotos: undefined;
};

// Navigation prop types for Workout screens
export type WorkoutScreenNavigationProp<T extends keyof WorkoutStackParamList> =
  StackNavigationProp<WorkoutStackParamList, T>;

// Route prop types for Workout screens
export type WorkoutScreenRouteProp<T extends keyof WorkoutStackParamList> =
  RouteProp<WorkoutStackParamList, T>;

// ===========================
// MAIN TAB PARAMS
// ===========================
export type MainTabParamList = {
  Home: undefined;
  Workout: undefined;
  Nutrition: undefined;
  Calendar: undefined;
  Kira: undefined;
};

// ===========================
// ROOT STACK PARAMS
// ===========================
export type RootStackParamList = {
  Main: undefined;
  Profile: undefined;
  Settings: undefined;
  PrivacyPolicy: undefined;
  Subscription: undefined;
  Attendance: undefined;
  Notifications: undefined;
  MonthlyReports: undefined;
  Streak: undefined;
  Onboarding: undefined;
  MealTracking: undefined;
};
