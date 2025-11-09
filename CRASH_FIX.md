# App Crash Fix Guide

## Most Likely Issue: MMKV Native Module

The app is crashing because **MMKV is a native module** that needs to be compiled into your app. Since we just added it, the JavaScript bundle has the code but the native binaries aren't built yet.

---

## Quick Fix (Choose One):

### Option 1: Rebuild App with Expo (Recommended)
```bash
# For Android
npx expo run:android

# For iOS
npx expo run:ios
```

This will:
1. Compile MMKV native code
2. Link it to your app
3. Install the app with native modules

### Option 2: Use EAS Build
```bash
# Install EAS CLI if not already
npm install -g eas-cli

# Build for Android
eas build --profile development --platform android

# Build for iOS
eas build --profile development --platform ios
```

### Option 3: Use Expo Dev Client
```bash
# Install expo-dev-client
npx expo install expo-dev-client

# Prebuild
npx expo prebuild

# Run
npx expo run:android
# or
npx expo run:ios
```

---

## Alternative: Use AsyncStorage (Temporary Fallback)

If you want to test the UI without rebuilding, temporarily switch to AsyncStorage:

### 1. Install AsyncStorage
```bash
npm install @react-native-async-storage/async-storage
```

### 2. Create fallback storage service:

**File: `src/services/localStorageService.fallback.ts`**
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import {
  FoodItem,
  FoodIntake,
  CustomMeal,
  DailyDiary,
  MealType,
  NutritionInfo
} from '../types/nutrition.types';

// Storage keys (same as MMKV version)
const KEYS = {
  DIARY: (userId: string, date: string) => `diary_${userId}_${date}`,
  CUSTOM_MEALS: (userId: string) => `customMeals_${userId}`,
  RECENT_FOODS: (userId: string) => `recentFoods_${userId}`,
  FAVORITES: (userId: string) => `favorites_${userId}`,
  TARGETS: (userId: string) => `targets_${userId}`
};

const formatDate = (date: Date | string): string => {
  if (typeof date === 'string') return date;
  return format(date, 'yyyy-MM-dd');
};

// Implement same functions but with AsyncStorage
export const getDailyDiary = async (userId: string, date: Date | string = new Date()): Promise<DailyDiary> => {
  const dateStr = formatDate(date);
  const key = KEYS.DIARY(userId, dateStr);
  const data = await AsyncStorage.getItem(key);

  if (data) {
    const diary = JSON.parse(data);
    diary.breakfast = diary.breakfast?.map((intake: any) => ({
      ...intake,
      dateTime: new Date(intake.dateTime)
    })) || [];
    // ... same for lunch, dinner, snacks
    return diary;
  }

  // Return empty diary with default targets
  const targets = await getUserTargets(userId);
  const totalNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  return {
    id: `diary_${userId}_${dateStr}`,
    userId,
    date: dateStr,
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
    totalNutrition,
    targets,
    waterIntake: 0
  };
};

// ... implement other functions similarly
```

### 3. Update import in NutritionContext:
```typescript
// Change this:
import * as storageService from '../services/localStorageService';

// To this (temporarily):
import * as storageService from '../services/localStorageService.fallback';
```

---

## Debugging Steps

### 1. Check the Error Message
Look in the console/logs for:
- "MMKV initialization failed"
- "Invariant Violation"
- "Native module cannot be null"

### 2. Check Metro Bundler Output
```bash
# Clear cache and restart
npx expo start --clear
```

### 3. Check Native Logs

**Android:**
```bash
npx react-native log-android
```

**iOS:**
```bash
npx react-native log-ios
```

---

## Root Cause Explained

### Why MMKV Needs Rebuilding:

1. **MMKV is written in C++** (for speed)
2. **React Native bridge** connects C++ ↔ JavaScript
3. **Native code must be compiled** for your target platform
4. **Expo Go doesn't support** custom native modules (use dev client)

### When You Need to Rebuild:

✅ After adding MMKV (now)
✅ After adding any native module
✅ After changing native code
✅ When switching devices/simulators

### When You DON'T Need to Rebuild:

❌ JavaScript-only changes
❌ UI changes
❌ TypeScript changes
❌ Context/state changes

---

## Quick Test Without MMKV

To test if MMKV is the issue, temporarily comment it out:

**In `src/contexts/NutritionContext.tsx`:**
```typescript
// Temporarily disable storage calls
const loadDiary = (date: Date) => {
  console.log('Loading diary (mock)');
  setCurrentDiary({
    id: `diary_mock_${format(date, 'yyyy-MM-dd')}`,
    userId: user?.id || 'mock',
    date: format(date, 'yyyy-MM-dd'),
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
    totalNutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    targets: { calories: 2000, protein: 150, carbs: 200, fat: 65, water: 2000 },
    waterIntake: 0
  });
};

// Comment out real storage calls
const addFoodIntake = (intake: FoodIntake) => {
  console.log('Mock: Adding food intake', intake);
  // storageService.addFoodIntake(user.id, intake); // COMMENTED OUT
};
```

If the app works after this, MMKV is definitely the issue.

---

## Recommended Solution

**Best approach: Build with native modules**

```bash
# 1. Install expo-dev-client (if not already)
npx expo install expo-dev-client

# 2. Prebuild (generates android/ios folders)
npx expo prebuild

# 3. Build and run
npx expo run:android
# or
npx expo run:ios
```

This gives you:
- ✅ MMKV working (30x faster than AsyncStorage)
- ✅ All native modules supported
- ✅ Custom native code support
- ✅ Full debugging capabilities

---

## After Rebuilding

Once the app is rebuilt with MMKV:

1. ✅ Local storage will be encrypted
2. ✅ Data persists offline
3. ✅ 30x faster than AsyncStorage
4. ✅ All features will work

---

## Summary

**The crash is expected** because MMKV is a native module that needs compilation.

**Quick fix:**
```bash
npx expo run:android
# or
npx expo run:ios
```

**Or temporarily use AsyncStorage** until you can rebuild.

Let me know which approach you want to take!
