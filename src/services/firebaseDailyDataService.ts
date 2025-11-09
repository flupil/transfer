import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  runTransaction
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../config/firebaseConstants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import meal types
import { FoodIntake } from '../types/nutrition.types';

// Import validation utilities
import {
  validateNutritionInfo,
  validateWaterIntake,
  validateSteps,
  validateWeight,
  sanitizeNutritionValue,
  showValidationErrors,
  NUTRITION_LIMITS
} from '../utils/nutritionValidation';

// Type for Firestore update objects
interface FirestoreUpdateData extends Record<string, any> {
  updatedAt: any; // Firestore FieldValue
}

interface NutritionUpdateData extends FirestoreUpdateData {
  'calories.consumed'?: number;
  'protein.consumed'?: number;
  'carbs.consumed'?: number;
  'fat.consumed'?: number;
}

interface BodyMetricsUpdateData extends FirestoreUpdateData {
  weight?: number;
  bodyFat?: number;
}

interface TargetUpdateData extends FirestoreUpdateData {
  'calories.target'?: number;
  'protein.target'?: number;
  'carbs.target'?: number;
  'fat.target'?: number;
  'water.target'?: number;
  'steps.target'?: number;
}

interface UserProfileData {
  name?: string;
  email?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  activityLevel?: string;
  goals?: string[];
  [key: string]: any; // Allow additional properties
}

export interface DailyData {
  userId: string;
  date: string; // YYYY-MM-DD format

  // Nutrition
  calories: { consumed: number; target: number };
  protein: { consumed: number; target: number };
  carbs: { consumed: number; target: number };
  fat: { consumed: number; target: number };

  // Water (in glasses, 1 glass = 250ml)
  water: { consumed: number; target: number };

  // Activity
  steps: { count: number; target: number };
  activeMinutes: number;
  workoutsCompleted: number;

  // Sleep (in hours)
  sleep: { hours: number; quality: 'poor' | 'fair' | 'good' | 'excellent' };

  // Body metrics
  weight?: number;
  bodyFat?: number;

  // Detailed meal tracking
  meals?: {
    breakfast: FoodIntake[];
    lunch: FoodIntake[];
    dinner: FoodIntake[];
    snacks: FoodIntake[];
  };

  updatedAt?: Date;
  createdAt?: Date;
}

class FirebaseDailyDataService {
  // Load user's nutrition targets from AsyncStorage
  private async getUserTargets(userId: string) {
    try {
      const nutritionDataKey = `nutrition_data_${userId}`;
      const dataStr = await AsyncStorage.getItem(nutritionDataKey);

      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.targets) {
          return {
            calories: data.targets.calories || 2000,
            protein: data.targets.protein || 150,
            carbs: data.targets.carbs || 250,
            fat: data.targets.fat || 65,
            water: Math.round((data.targets.water || 2500) / 250) // Convert ml to glasses
          };
        }
      }
    } catch (error) {
      // Silently use default values if targets can't be loaded
      console.warn('Error loading user targets, using defaults:', error);
    }

    // Return defaults if not found
    return {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 65,
      water: 8
    };
  }

  // Get or create today's data
  async getTodayData(userId: string): Promise<DailyData> {
    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, COLLECTIONS.DAILY_DATA, `${userId}_${today}`);

    try {
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as DailyData;
      } else {
        // Load user's actual targets
        const userTargets = await this.getUserTargets(userId);

        // Create default data for today with user's targets
        const defaultData: DailyData = {
          userId,
          date: today,
          calories: { consumed: 0, target: userTargets.calories },
          protein: { consumed: 0, target: userTargets.protein },
          carbs: { consumed: 0, target: userTargets.carbs },
          fat: { consumed: 0, target: userTargets.fat },
          water: { consumed: 0, target: userTargets.water },
          steps: { count: 0, target: 10000 },
          activeMinutes: 0,
          workoutsCompleted: 0,
          sleep: { hours: 0, quality: 'fair' },
          meals: {
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: []
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await setDoc(docRef, {
          ...defaultData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        return defaultData;
      }
    } catch (error) {
      // Silently handle Firebase permission errors and work offline with default values
      console.warn('Error getting today data:', error);
      // Load targets even on error
      const userTargets = await this.getUserTargets(userId);

      return {
        userId,
        date: today,
        calories: { consumed: 0, target: userTargets.calories },
        protein: { consumed: 0, target: userTargets.protein },
        carbs: { consumed: 0, target: userTargets.carbs },
        fat: { consumed: 0, target: userTargets.fat },
        water: { consumed: 0, target: userTargets.water },
        steps: { count: 0, target: 10000 },
        activeMinutes: 0,
        workoutsCompleted: 0,
        sleep: { hours: 0, quality: 'fair' },
        meals: {
          breakfast: [],
          lunch: [],
          dinner: [],
          snacks: []
        }
      };
    }
  }

  // Update today's nutrition (with transaction to prevent race conditions)
  async updateNutrition(
    userId: string,
    nutrition: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
    },
    operation: 'add' | 'set' = 'add'
  ): Promise<void> {
    // Validate nutrition values
    const validationResult = validateNutritionInfo(nutrition);
    if (!validationResult.isValid) {
      showValidationErrors(validationResult, 'Invalid Nutrition Data');
      throw new Error('Invalid nutrition data: ' + validationResult.errors.join(', '));
    }

    // Sanitize values to ensure they're within valid ranges
    const sanitizedNutrition = {
      calories: nutrition.calories !== undefined ? sanitizeNutritionValue(nutrition.calories, 'calories') : undefined,
      protein: nutrition.protein !== undefined ? sanitizeNutritionValue(nutrition.protein, 'protein') : undefined,
      carbs: nutrition.carbs !== undefined ? sanitizeNutritionValue(nutrition.carbs, 'carbs') : undefined,
      fat: nutrition.fat !== undefined ? sanitizeNutritionValue(nutrition.fat, 'fat') : undefined,
    };

    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, COLLECTIONS.DAILY_DATA, `${userId}_${today}`);

    try {
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);

        if (!docSnap.exists()) {
          // Create document with initial data
          const userTargets = await this.getUserTargets(userId);
          const defaultData: DailyData = {
            userId,
            date: today,
            calories: { consumed: 0, target: userTargets.calories },
            protein: { consumed: 0, target: userTargets.protein },
            carbs: { consumed: 0, target: userTargets.carbs },
            fat: { consumed: 0, target: userTargets.fat },
            water: { consumed: 0, target: userTargets.water },
            steps: { count: 0, target: 10000 },
            activeMinutes: 0,
            workoutsCompleted: 0,
            sleep: { hours: 0, quality: 'fair' },
            meals: {
              breakfast: [],
              lunch: [],
              dinner: [],
              snacks: []
            },
            createdAt: new Date(),
            updatedAt: new Date()
          };

          transaction.set(docRef, {
            ...defaultData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });

          // Set initial values if operation is 'set'
          if (operation === 'set') {
            const updates: NutritionUpdateData = { updatedAt: serverTimestamp() };
            if (sanitizedNutrition.calories !== undefined) updates['calories.consumed'] = sanitizedNutrition.calories;
            if (sanitizedNutrition.protein !== undefined) updates['protein.consumed'] = sanitizedNutrition.protein;
            if (sanitizedNutrition.carbs !== undefined) updates['carbs.consumed'] = sanitizedNutrition.carbs;
            if (sanitizedNutrition.fat !== undefined) updates['fat.consumed'] = sanitizedNutrition.fat;
            transaction.update(docRef, updates);
          } else if (operation === 'add') {
            const updates: NutritionUpdateData = { updatedAt: serverTimestamp() };
            if (sanitizedNutrition.calories !== undefined) updates['calories.consumed'] = sanitizedNutrition.calories;
            if (sanitizedNutrition.protein !== undefined) updates['protein.consumed'] = sanitizedNutrition.protein;
            if (sanitizedNutrition.carbs !== undefined) updates['carbs.consumed'] = sanitizedNutrition.carbs;
            if (sanitizedNutrition.fat !== undefined) updates['fat.consumed'] = sanitizedNutrition.fat;
            transaction.update(docRef, updates);
          }

          return;
        }

        // Document exists - update atomically
        const currentData = docSnap.data() as DailyData;
        const updates: NutritionUpdateData = { updatedAt: serverTimestamp() };

        if (operation === 'add') {
          // Add to existing values (atomic) - validate final values
          if (sanitizedNutrition.calories !== undefined) {
            const newValue = currentData.calories.consumed + sanitizedNutrition.calories;
            updates['calories.consumed'] = Math.max(0, Math.min(newValue, NUTRITION_LIMITS.calories.max));
          }
          if (sanitizedNutrition.protein !== undefined) {
            const newValue = currentData.protein.consumed + sanitizedNutrition.protein;
            updates['protein.consumed'] = Math.max(0, Math.min(newValue, NUTRITION_LIMITS.protein.max));
          }
          if (sanitizedNutrition.carbs !== undefined) {
            const newValue = currentData.carbs.consumed + sanitizedNutrition.carbs;
            updates['carbs.consumed'] = Math.max(0, Math.min(newValue, NUTRITION_LIMITS.carbs.max));
          }
          if (sanitizedNutrition.fat !== undefined) {
            const newValue = currentData.fat.consumed + sanitizedNutrition.fat;
            updates['fat.consumed'] = Math.max(0, Math.min(newValue, NUTRITION_LIMITS.fat.max));
          }
        } else {
          // Set values directly
          if (sanitizedNutrition.calories !== undefined) {
            updates['calories.consumed'] = sanitizedNutrition.calories;
          }
          if (sanitizedNutrition.protein !== undefined) {
            updates['protein.consumed'] = sanitizedNutrition.protein;
          }
          if (sanitizedNutrition.carbs !== undefined) {
            updates['carbs.consumed'] = sanitizedNutrition.carbs;
          }
          if (sanitizedNutrition.fat !== undefined) {
            updates['fat.consumed'] = sanitizedNutrition.fat;
          }
        }

        transaction.update(docRef, updates);
      });
    } catch (error) {
      console.error('Error updating nutrition:', error);
      throw error;
    }
  }

  // Add water (in glasses) - with transaction to prevent race conditions
  async addWater(userId: string, glasses: number = 1): Promise<void> {
    // Validate water intake (convert glasses to ml for validation: 1 glass = 250ml)
    const waterInMl = glasses * 250;
    const validationResult = validateWaterIntake(waterInMl);
    if (!validationResult.isValid) {
      showValidationErrors(validationResult, 'Invalid Water Amount');
      throw new Error('Invalid water amount: ' + validationResult.errors.join(', '));
    }

    // Sanitize glasses value
    const sanitizedGlasses = Math.max(0, Math.min(glasses, NUTRITION_LIMITS.water.max / 250));

    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, COLLECTIONS.DAILY_DATA, `${userId}_${today}`);

    try {
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);

        if (!docSnap.exists()) {
          // Document doesn't exist - create it first
          await this.getTodayData(userId);
          // Retry transaction after document creation
          const retrySnap = await transaction.get(docRef);
          if (retrySnap.exists()) {
            const data = retrySnap.data() as DailyData;
            const newWaterValue = data.water.consumed + sanitizedGlasses;
            transaction.update(docRef, {
              'water.consumed': Math.max(0, Math.min(newWaterValue, NUTRITION_LIMITS.water.max / 250)),
              updatedAt: serverTimestamp()
            });
          }
          return;
        }

        const currentData = docSnap.data() as DailyData;
        const newWaterValue = currentData.water.consumed + sanitizedGlasses;
        transaction.update(docRef, {
          'water.consumed': Math.max(0, Math.min(newWaterValue, NUTRITION_LIMITS.water.max / 250)),
          updatedAt: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('Error adding water:', error);
      throw error;
    }
  }

  // Update steps
  async updateSteps(userId: string, steps: number): Promise<void> {
    // Validate steps count
    const validationResult = validateSteps(steps);
    if (!validationResult.isValid) {
      showValidationErrors(validationResult, 'Invalid Step Count');
      throw new Error('Invalid step count: ' + validationResult.errors.join(', '));
    }

    // Sanitize steps value
    const sanitizedSteps = sanitizeNutritionValue(steps, 'steps');

    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, COLLECTIONS.DAILY_DATA, `${userId}_${today}`);

    try {
      await updateDoc(docRef, {
        'steps.count': sanitizedSteps,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating steps:', error);
      throw error;
    }
  }

  // Log sleep
  async logSleep(
    userId: string,
    hours: number,
    quality: 'poor' | 'fair' | 'good' | 'excellent'
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, COLLECTIONS.DAILY_DATA, `${userId}_${today}`);

    try {
      await updateDoc(docRef, {
        'sleep.hours': hours,
        'sleep.quality': quality,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging sleep:', error);
      throw error;
    }
  }

  // Increment workout count - with transaction to prevent race conditions
  async incrementWorkoutCount(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, COLLECTIONS.DAILY_DATA, `${userId}_${today}`);

    try {
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);

        if (!docSnap.exists()) {
          // Document doesn't exist - create it first
          await this.getTodayData(userId);
          // Retry transaction after document creation
          const retrySnap = await transaction.get(docRef);
          if (retrySnap.exists()) {
            const data = retrySnap.data() as DailyData;
            transaction.update(docRef, {
              workoutsCompleted: data.workoutsCompleted + 1,
              updatedAt: serverTimestamp()
            });
          }
          return;
        }

        const currentData = docSnap.data() as DailyData;
        transaction.update(docRef, {
          workoutsCompleted: currentData.workoutsCompleted + 1,
          updatedAt: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('Error incrementing workout count:', error);
    }
  }

  // Update body metrics
  async updateBodyMetrics(
    userId: string,
    metrics: { weight?: number; bodyFat?: number }
  ): Promise<void> {
    // Validate weight
    if (metrics.weight !== undefined) {
      const weightValidation = validateWeight(metrics.weight);
      if (!weightValidation.isValid) {
        showValidationErrors(weightValidation, 'Invalid Weight');
        throw new Error('Invalid weight: ' + weightValidation.errors.join(', '));
      }
    }

    // Validate body fat percentage (0-100%)
    if (metrics.bodyFat !== undefined) {
      if (metrics.bodyFat < 0 || metrics.bodyFat > 100) {
        throw new Error('Body fat percentage must be between 0% and 100%');
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, COLLECTIONS.DAILY_DATA, `${userId}_${today}`);

    try {
      const updates: BodyMetricsUpdateData = {
        updatedAt: serverTimestamp()
      };

      if (metrics.weight !== undefined) {
        updates.weight = sanitizeNutritionValue(metrics.weight, 'weight');
      }
      if (metrics.bodyFat !== undefined) {
        updates.bodyFat = Math.max(0, Math.min(metrics.bodyFat, 100));
      }

      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating body metrics:', error);
      throw error;
    }
  }

  // Get weekly data for charts
  async getWeeklyData(userId: string): Promise<DailyData[]> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    try {
      const q = query(
        collection(db, COLLECTIONS.DAILY_DATA),
        where('userId', '==', userId),
        where('date', '>=', weekAgoStr),
        orderBy('date', 'desc'),
        limit(7)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as DailyData);
    } catch (error) {
      console.error('Error getting weekly data:', error);
      return [];
    }
  }

  // Subscribe to daily data for any date (real-time updates)
  subscribeToDailyData(
    userId: string,
    date: string, // YYYY-MM-DD format
    callback: (data: DailyData) => void
  ): () => void {
    const docRef = doc(db, COLLECTIONS.DAILY_DATA, `${userId}_${date}`);

    const unsubscribe = onSnapshot(
      docRef,
      (doc) => {
        if (doc.exists()) {
          callback(doc.data() as DailyData);
        } else {
          // Create default data if doesn't exist
          this.getDailyDiary(userId, date).then(data => {
            callback(data);
          }).catch(error => {
            console.error('Error creating default diary in subscription:', error);
          });
        }
      },
      (error) => {
        // Handle errors in real-time subscription (silently for permission errors)
        console.error('Real-time subscription error:', error);
      }
    );

    return unsubscribe;
  }

  // Update user profile
  async updateUserProfile(userId: string, profileData: UserProfileData): Promise<void> {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    try {
      await setDoc(userRef, profileData, { merge: true });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Update daily targets
  async updateTargets(userId: string, targets: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    water?: number;
    steps?: number;
  }): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, COLLECTIONS.DAILY_DATA, `${userId}_${today}`);

    try {
      const updates: TargetUpdateData = {
        updatedAt: serverTimestamp()
      };

      if (targets.calories) updates['calories.target'] = targets.calories;
      if (targets.protein) updates['protein.target'] = targets.protein;
      if (targets.carbs) updates['carbs.target'] = targets.carbs;
      if (targets.fat) updates['fat.target'] = targets.fat;
      if (targets.water) updates['water.target'] = Math.round(targets.water / 250); // Convert ml to glasses
      if (targets.steps) updates['steps.target'] = targets.steps;

      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating targets:', error);
      // If document doesn't exist, create it first
      await this.getTodayData(userId);
      await this.updateTargets(userId, targets);
    }
  }

  // Get monthly summary
  async getMonthlySummary(userId: string): Promise<{
    totalWorkouts: number;
    avgCalories: number;
    avgSteps: number;
    avgSleep: number;
  }> {
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);
    const monthAgoStr = monthAgo.toISOString().split('T')[0];

    try {
      const q = query(
        collection(db, COLLECTIONS.DAILY_DATA),
        where('userId', '==', userId),
        where('date', '>=', monthAgoStr),
        orderBy('date', 'desc')
      );

      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data() as DailyData);

      if (data.length === 0) {
        return {
          totalWorkouts: 0,
          avgCalories: 0,
          avgSteps: 0,
          avgSleep: 0
        };
      }

      const totalWorkouts = data.reduce((sum, d) => sum + d.workoutsCompleted, 0);
      const avgCalories = Math.round(
        data.reduce((sum, d) => sum + d.calories.consumed, 0) / data.length
      );
      const avgSteps = Math.round(
        data.reduce((sum, d) => sum + d.steps.count, 0) / data.length
      );
      const avgSleep = Math.round(
        data.reduce((sum, d) => sum + d.sleep.hours, 0) / data.length * 10
      ) / 10;

      return {
        totalWorkouts,
        avgCalories,
        avgSteps,
        avgSleep
      };
    } catch (error) {
      console.error('Error getting monthly summary:', error);
      return {
        totalWorkouts: 0,
        avgCalories: 0,
        avgSteps: 0,
        avgSleep: 0
      };
    }
  }

  // Helper: Calculate nutrition totals from meals
  private calculateTotalsFromMeals(meals: DailyData['meals']): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } {
    if (!meals) {
      return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    }

    const allFoods = [
      ...meals.breakfast,
      ...meals.lunch,
      ...meals.dinner,
      ...meals.snacks
    ];

    return allFoods.reduce((totals, food) => {
      // Defensive check: skip foods with missing nutrition data
      if (!food || !food.nutrition) {
        console.warn('calculateTotalsFromMeals: Food item missing nutrition data, skipping');
        return totals;
      }

      return {
        calories: totals.calories + (food.nutrition.calories || 0),
        protein: totals.protein + (food.nutrition.protein || 0),
        carbs: totals.carbs + (food.nutrition.carbs || 0),
        fat: totals.fat + (food.nutrition.fat || 0)
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }

  // Get daily diary for any date (not just today)
  async getDailyDiary(userId: string, date: string): Promise<DailyData> {
    const docRef = doc(db, COLLECTIONS.DAILY_DATA, `${userId}_${date}`);

    try {
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data() as DailyData;
      } else {
        // Create default data for this date
        const userTargets = await this.getUserTargets(userId);

        const defaultData: DailyData = {
          userId,
          date,
          calories: { consumed: 0, target: userTargets.calories },
          protein: { consumed: 0, target: userTargets.protein },
          carbs: { consumed: 0, target: userTargets.carbs },
          fat: { consumed: 0, target: userTargets.fat },
          water: { consumed: 0, target: userTargets.water },
          steps: { count: 0, target: 10000 },
          activeMinutes: 0,
          workoutsCompleted: 0,
          sleep: { hours: 0, quality: 'fair' },
          meals: {
            breakfast: [],
            lunch: [],
            dinner: [],
            snacks: []
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await setDoc(docRef, {
          ...defaultData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        return defaultData;
      }
    } catch (error) {
      console.error('Error getting daily diary:', error);
      throw error;
    }
  }

  // Add food to a meal
  async addFoodToMeal(
    userId: string,
    date: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks',
    foodIntake: FoodIntake
  ): Promise<void> {
    const docRef = doc(db, COLLECTIONS.DAILY_DATA, `${userId}_${date}`);

    try {
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);

        if (!docSnap.exists()) {
          await this.getDailyDiary(userId, date);
          const retrySnap = await transaction.get(docRef);
          if (!retrySnap.exists()) return;
        }

        const currentData = (await transaction.get(docRef)).data() as DailyData;

        // Ensure meals object exists
        const currentMeals = currentData.meals || {
          breakfast: [],
          lunch: [],
          dinner: [],
          snacks: []
        };

        // Clean undefined values from foodIntake for Firebase
        const cleanFoodIntake = JSON.parse(JSON.stringify(foodIntake, (key, value) => {
          return value === undefined ? null : value;
        }));

        const updatedMeals = {
          ...currentMeals,
          [mealType]: [...(currentMeals[mealType] || []), cleanFoodIntake]
        };

        const totals = this.calculateTotalsFromMeals(updatedMeals);

        transaction.update(docRef, {
          meals: updatedMeals,
          'calories.consumed': totals.calories,
          'protein.consumed': totals.protein,
          'carbs.consumed': totals.carbs,
          'fat.consumed': totals.fat,
          updatedAt: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('Error adding food to meal:', error);
      throw error;
    }
  }

  // Remove food from a meal
  async removeFoodFromMeal(
    userId: string,
    date: string,
    foodIntakeId: string
  ): Promise<void> {
    const docRef = doc(db, COLLECTIONS.DAILY_DATA, `${userId}_${date}`);

    try {
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);

        if (!docSnap.exists()) return;

        const currentData = docSnap.data() as DailyData;

        // Remove food from all meal types
        const updatedMeals = {
          breakfast: currentData.meals?.breakfast.filter(f => f.id !== foodIntakeId) || [],
          lunch: currentData.meals?.lunch.filter(f => f.id !== foodIntakeId) || [],
          dinner: currentData.meals?.dinner.filter(f => f.id !== foodIntakeId) || [],
          snacks: currentData.meals?.snacks.filter(f => f.id !== foodIntakeId) || []
        };

        // Recalculate totals
        const totals = this.calculateTotalsFromMeals(updatedMeals);

        transaction.update(docRef, {
          meals: updatedMeals,
          'calories.consumed': totals.calories,
          'protein.consumed': totals.protein,
          'carbs.consumed': totals.carbs,
          'fat.consumed': totals.fat,
          updatedAt: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('Error removing food from meal:', error);
      throw error;
    }
  }

  // Update food in a meal
  async updateFoodInMeal(
    userId: string,
    date: string,
    updatedFoodIntake: FoodIntake
  ): Promise<void> {
    const docRef = doc(db, COLLECTIONS.DAILY_DATA, `${userId}_${date}`);

    try {
      await runTransaction(db, async (transaction) => {
        const docSnap = await transaction.get(docRef);

        if (!docSnap.exists()) return;

        const currentData = docSnap.data() as DailyData;

        const currentMeals = currentData.meals || {
          breakfast: [],
          lunch: [],
          dinner: [],
          snacks: []
        };

        // Clean undefined values from foodIntake for Firebase
        const cleanFoodIntake = JSON.parse(JSON.stringify(updatedFoodIntake, (key, value) => {
          return value === undefined ? null : value;
        }));

        const updateMealArray = (arr: FoodIntake[]) =>
          arr.map(f => f.id === cleanFoodIntake.id ? cleanFoodIntake : f);

        const updatedMeals = {
          breakfast: updateMealArray(currentMeals.breakfast || []),
          lunch: updateMealArray(currentMeals.lunch || []),
          dinner: updateMealArray(currentMeals.dinner || []),
          snacks: updateMealArray(currentMeals.snacks || [])
        };

        const totals = this.calculateTotalsFromMeals(updatedMeals);

        transaction.update(docRef, {
          meals: updatedMeals,
          'calories.consumed': totals.calories,
          'protein.consumed': totals.protein,
          'carbs.consumed': totals.carbs,
          'fat.consumed': totals.fat,
          updatedAt: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('Error updating food in meal:', error);
      throw error;
    }
  }
}

export const firebaseDailyDataService = new FirebaseDailyDataService();
export default firebaseDailyDataService;