import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSafeDatabase, ensureDatabase } from '../database/databaseHelper';
import { syncService } from './syncService';
import { recipeService, Recipe } from './recipeService';
import { foodApiService } from './foodApiService';
import uuid from 'react-native-uuid';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

export interface MealPlanItem {
  id: string;
  type: 'recipe' | 'food' | 'custom';
  recipeId?: string;
  foodId?: string;
  customName?: string;
  servings: number;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  notes?: string;
}

export interface DayMealPlan {
  date: string;
  breakfast: MealPlanItem[];
  lunch: MealPlanItem[];
  dinner: MealPlanItem[];
  snacks: MealPlanItem[];
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
}

export interface WeeklyMealPlan {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate: string;
  days: DayMealPlan[];
  shoppingList?: Array<{
    foodName: string;
    quantity: number;
    unit: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MealPlanTemplate {
  id: string;
  name: string;
  description: string;
  duration: 7 | 14 | 30; // days
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  meals: {
    [day: string]: DayMealPlan;
  };
  tags: string[];
  isPublic: boolean;
}

class MealPlanningService {
  private currentUserId: string | null = null;
  private readonly STORAGE_KEY = 'meal_plans';
  private readonly TEMPLATES_KEY = 'meal_plan_templates';

  setUserId(userId: string) {
    this.currentUserId = userId;
  }

  // Create a new meal plan
  async createMealPlan(
    name: string,
    startDate: Date,
    duration: 7 | 14 | 30 = 7
  ): Promise<WeeklyMealPlan> {
    try {
      await ensureDatabase();
      const db = getSafeDatabase();

      const id = uuid.v4() as string;
      const endDate = addDays(startDate, duration - 1);

      // Initialize empty days
      const days: DayMealPlan[] = [];
      for (let i = 0; i < duration; i++) {
        const date = format(addDays(startDate, i), 'yyyy-MM-dd');
        days.push({
          date,
          breakfast: [],
          lunch: [],
          dinner: [],
          snacks: [],
          totalNutrition: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
          },
        });
      }

      const mealPlan: WeeklyMealPlan = {
        id,
        userId: this.currentUserId || '1',
        name,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        days,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (db) {
        await db.runAsync(
          `INSERT INTO meal_plans (id, userId, name, startDate, endDate, days,
           createdAt, updatedAt, syncStatus)
           VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 'pending')`,
          [
            mealPlan.id,
            mealPlan.userId,
            mealPlan.name,
            mealPlan.startDate,
            mealPlan.endDate,
            JSON.stringify(mealPlan.days),
          ]
        );

        await syncService.queueForSync('meal_plans', 'INSERT', mealPlan);
      } else {
        await this.saveToStorage(mealPlan);
      }

      return mealPlan;
    } catch (error) {
      Alert.alert('Error', 'Failed to create meal plan. Please try again.');

      console.error('Failed to create meal plan:', error);
      throw error;
    }
  }

  // Add item to meal plan
  async addMealItem(
    mealPlanId: string,
    date: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks',
    item: Omit<MealPlanItem, 'id'>
  ): Promise<WeeklyMealPlan | null> {
    try {
      const mealPlan = await this.getMealPlan(mealPlanId);
      if (!mealPlan) return null;

      const dayIndex = mealPlan.days.findIndex(d => d.date === date);
      if (dayIndex === -1) return null;

      const newItem: MealPlanItem = {
        ...item,
        id: uuid.v4() as string,
      };

      mealPlan.days[dayIndex][mealType].push(newItem);

      // Update total nutrition
      this.updateDayNutrition(mealPlan.days[dayIndex]);

      mealPlan.updatedAt = new Date();

      await this.updateMealPlan(mealPlan);
      return mealPlan;
    } catch (error) {
      Alert.alert('Error', 'Failed to add meal item. Please try again.');

      console.error('Failed to add meal item:', error);
      return null;
    }
  }

  // Remove item from meal plan
  async removeMealItem(
    mealPlanId: string,
    date: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks',
    itemId: string
  ): Promise<WeeklyMealPlan | null> {
    try {
      const mealPlan = await this.getMealPlan(mealPlanId);
      if (!mealPlan) return null;

      const dayIndex = mealPlan.days.findIndex(d => d.date === date);
      if (dayIndex === -1) return null;

      const itemIndex = mealPlan.days[dayIndex][mealType].findIndex(
        item => item.id === itemId
      );

      if (itemIndex !== -1) {
        mealPlan.days[dayIndex][mealType].splice(itemIndex, 1);
        this.updateDayNutrition(mealPlan.days[dayIndex]);
        mealPlan.updatedAt = new Date();
        await this.updateMealPlan(mealPlan);
      }

      return mealPlan;
    } catch (error) {
      Alert.alert('Error', 'Failed to remove meal item. Please try again.');

      console.error('Failed to remove meal item:', error);
      return null;
    }
  }

  // Add recipe to meal plan
  async addRecipeToMealPlan(
    mealPlanId: string,
    date: string,
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks',
    recipeId: string,
    servings: number = 1
  ): Promise<WeeklyMealPlan | null> {
    try {
      const recipe = await recipeService.getRecipe(recipeId);
      if (!recipe) return null;

      const item: Omit<MealPlanItem, 'id'> = {
        type: 'recipe',
        recipeId,
        servings,
        nutrition: {
          calories: recipe.nutritionPerServing.calories * servings,
          protein: recipe.nutritionPerServing.protein * servings,
          carbs: recipe.nutritionPerServing.carbs * servings,
          fat: recipe.nutritionPerServing.fat * servings,
          fiber: recipe.nutritionPerServing.fiber ? recipe.nutritionPerServing.fiber * servings : undefined,
          sugar: recipe.nutritionPerServing.sugar ? recipe.nutritionPerServing.sugar * servings : undefined,
          sodium: recipe.nutritionPerServing.sodium ? recipe.nutritionPerServing.sodium * servings : undefined,
        },
      };

      return this.addMealItem(mealPlanId, date, mealType, item);
    } catch (error) {
      Alert.alert('Error', 'Failed to add recipe to meal plan. Please try again.');

      console.error('Failed to add recipe to meal plan:', error);
      return null;
    }
  }

  // Get meal plan
  async getMealPlan(mealPlanId: string): Promise<WeeklyMealPlan | null> {
    try {
      const db = getSafeDatabase();

      if (!db) {
        return this.getMealPlanFromStorage(mealPlanId);
      }

      const row = await db.getFirstAsync(
        'SELECT * FROM meal_plans WHERE id = ?',
        [mealPlanId]
      ) as any;

      if (!row) return null;

      return {
        ...row,
        days: JSON.parse(row.days),
        shoppingList: row.shoppingList ? JSON.parse(row.shoppingList) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      };
    } catch (error) {
      Alert.alert('Error', 'Failed to get meal plan. Please try again.');

      console.error('Failed to get meal plan:', error);
      return null;
    }
  }

  // Get current week's meal plan
  async getCurrentWeekMealPlan(): Promise<WeeklyMealPlan | null> {
    try {
      const today = new Date();
      const weekStart = format(startOfWeek(today), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(today), 'yyyy-MM-dd');

      const db = getSafeDatabase();

      if (!db) {
        const plans = await this.getAllMealPlansFromStorage();
        return plans.find(p =>
          p.startDate <= weekStart && p.endDate >= weekEnd
        ) || null;
      }

      const row = await db.getFirstAsync(
        `SELECT * FROM meal_plans
         WHERE userId = ? AND startDate <= ? AND endDate >= ?
         ORDER BY createdAt DESC LIMIT 1`,
        [this.currentUserId || '1', weekStart, weekEnd]
      ) as any;

      if (!row) return null;

      return {
        ...row,
        days: JSON.parse(row.days),
        shoppingList: row.shoppingList ? JSON.parse(row.shoppingList) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      };
    } catch (error) {
      Alert.alert('Error', 'Failed to get current week meal plan. Please try again.');

      console.error('Failed to get current week meal plan:', error);
      return null;
    }
  }

  // Get today's meals
  async getTodaysMeals(): Promise<DayMealPlan | null> {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const weekPlan = await this.getCurrentWeekMealPlan();

      if (!weekPlan) return null;

      return weekPlan.days.find(d => d.date === today) || null;
    } catch (error) {
      console.error('Failed to get today\'s meals:', error);
      return null;
    }
  }

  // Get all user meal plans
  async getUserMealPlans(): Promise<WeeklyMealPlan[]> {
    try {
      const db = getSafeDatabase();

      if (!db) {
        return this.getAllMealPlansFromStorage();
      }

      const rows = await db.getAllAsync(
        'SELECT * FROM meal_plans WHERE userId = ? ORDER BY startDate DESC',
        [this.currentUserId || '1']
      ) as any[];

      return rows.map(row => ({
        ...row,
        days: JSON.parse(row.days),
        shoppingList: row.shoppingList ? JSON.parse(row.shoppingList) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }));
    } catch (error) {
      Alert.alert('Error', 'Failed to get user meal plans. Please try again.');

      console.error('Failed to get user meal plans:', error);
      return [];
    }
  }

  // Generate shopping list from meal plan
  async generateShoppingList(mealPlanId: string): Promise<Array<{
    foodName: string;
    quantity: number;
    unit: string;
    category: string;
  }>> {
    try {
      const mealPlan = await this.getMealPlan(mealPlanId);
      if (!mealPlan) return [];

      const shoppingMap = new Map<string, {
        foodName: string;
        quantity: number;
        unit: string;
        category: string;
      }>();

      // Collect all recipe IDs
      const recipeIds: string[] = [];
      mealPlan.days.forEach(day => {
        ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
          const meals = day[mealType as keyof DayMealPlan];
          if (Array.isArray(meals)) {
            meals.forEach(item => {
              if (item.type === 'recipe' && item.recipeId) {
                recipeIds.push(item.recipeId);
              }
            });
          }
        });
      });

      // Get recipes and their ingredients
      const recipes = await Promise.all(
        recipeIds.map(id => recipeService.getRecipe(id))
      );

      recipes.forEach(recipe => {
        if (!recipe) return;

        recipe.ingredients.forEach(ingredient => {
          const key = `${ingredient.foodName}_${ingredient.unit}`;

          if (shoppingMap.has(key)) {
            const item = shoppingMap.get(key)!;
            item.quantity += ingredient.quantity;
          } else {
            shoppingMap.set(key, {
              foodName: ingredient.foodName,
              quantity: ingredient.quantity,
              unit: ingredient.unit,
              category: this.categorizeFood(ingredient.foodName),
            });
          }
        });
      });

      // Sort by category then by name
      return Array.from(shoppingMap.values()).sort((a, b) => {
        if (a.category !== b.category) {
          return a.category.localeCompare(b.category);
        }
        return a.foodName.localeCompare(b.foodName);
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate shopping list. Please try again.');

      console.error('Failed to generate shopping list:', error);
      return [];
    }
  }

  // Copy meal plan
  async copyMealPlan(
    mealPlanId: string,
    newName: string,
    newStartDate: Date
  ): Promise<WeeklyMealPlan | null> {
    try {
      const originalPlan = await this.getMealPlan(mealPlanId);
      if (!originalPlan) return null;

      const duration = originalPlan.days.length;
      const newPlan = await this.createMealPlan(newName, newStartDate, duration as 7 | 14 | 30);

      // Copy meals to new dates
      for (let i = 0; i < originalPlan.days.length; i++) {
        const originalDay = originalPlan.days[i];
        const newDate = format(addDays(newStartDate, i), 'yyyy-MM-dd');

        newPlan.days[i] = {
          ...originalDay,
          date: newDate,
        };
      }

      await this.updateMealPlan(newPlan);
      return newPlan;
    } catch (error) {
      Alert.alert('Error', 'Failed to copy meal plan. Please try again.');

      console.error('Failed to copy meal plan:', error);
      return null;
    }
  }

  // Auto-generate meal plan based on nutrition goals
  async autoGenerateMealPlan(
    targetCalories: number,
    targetProtein: number,
    targetCarbs: number,
    targetFat: number,
    duration: 7 | 14 | 30 = 7,
    preferences?: {
      vegetarian?: boolean;
      vegan?: boolean;
      glutenFree?: boolean;
      dairyFree?: boolean;
      lowCarb?: boolean;
      highProtein?: boolean;
    }
  ): Promise<WeeklyMealPlan | null> {
    try {
      // Get available recipes
      const recipes = await recipeService.getUserRecipes();

      // Filter based on preferences
      let availableRecipes = recipes;
      if (preferences) {
        // Apply dietary filters based on recipe tags
        if (preferences.vegetarian) {
          availableRecipes = availableRecipes.filter(r => r.tags?.includes('vegetarian'));
        }
        // ... apply other filters
      }

      // Create new meal plan
      const mealPlan = await this.createMealPlan(
        `Auto-Generated Plan (${targetCalories}cal)`,
        new Date(),
        duration
      );

      // Simple meal distribution algorithm
      const mealsPerDay = {
        breakfast: Math.round(targetCalories * 0.25),
        lunch: Math.round(targetCalories * 0.35),
        dinner: Math.round(targetCalories * 0.35),
        snacks: Math.round(targetCalories * 0.05),
      };

      // For each day, select recipes that fit the targets
      for (const day of mealPlan.days) {
        for (const [mealType, targetCals] of Object.entries(mealsPerDay)) {
          // Find recipes close to target calories
          const suitableRecipes = availableRecipes.filter(r => {
            const calories = r.nutritionPerServing.calories;
            return calories >= targetCals * 0.8 && calories <= targetCals * 1.2;
          });

          if (suitableRecipes.length > 0) {
            // Random selection for variety
            const recipe = suitableRecipes[Math.floor(Math.random() * suitableRecipes.length)];
            await this.addRecipeToMealPlan(
              mealPlan.id,
              day.date,
              mealType as 'breakfast' | 'lunch' | 'dinner' | 'snacks',
              recipe.id,
              1
            );
          }
        }
      }

      return mealPlan;
    } catch (error) {
      Alert.alert('Error', 'Failed to auto-generate meal plan. Please try again.');

      console.error('Failed to auto-generate meal plan:', error);
      return null;
    }
  }

  // Helper methods
  private updateDayNutrition(day: DayMealPlan): void {
    const nutrition = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
    };

    ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
      const meals = day[mealType as keyof DayMealPlan];
      if (Array.isArray(meals)) {
        meals.forEach(item => {
          nutrition.calories += item.nutrition.calories || 0;
          nutrition.protein += item.nutrition.protein || 0;
          nutrition.carbs += item.nutrition.carbs || 0;
          nutrition.fat += item.nutrition.fat || 0;
          nutrition.fiber += item.nutrition.fiber || 0;
          nutrition.sugar += item.nutrition.sugar || 0;
          nutrition.sodium += item.nutrition.sodium || 0;
        });
      }
    });

    day.totalNutrition = nutrition;
  }

  private async updateMealPlan(mealPlan: WeeklyMealPlan): Promise<void> {
    const db = getSafeDatabase();

    if (db) {
      await db.runAsync(
        `UPDATE meal_plans SET days = ?, updatedAt = datetime('now'), syncStatus = 'pending'
         WHERE id = ?`,
        [JSON.stringify(mealPlan.days), mealPlan.id]
      );

      await syncService.queueForSync('meal_plans', 'UPDATE', mealPlan);
    } else {
      await this.updateInStorage(mealPlan);
    }
  }

  private categorizeFood(foodName: string): string {
    const name = foodName.toLowerCase();

    if (name.includes('chicken') || name.includes('beef') || name.includes('pork') ||
        name.includes('fish') || name.includes('egg')) {
      return 'Protein';
    }
    if (name.includes('milk') || name.includes('cheese') || name.includes('yogurt')) {
      return 'Dairy';
    }
    if (name.includes('bread') || name.includes('rice') || name.includes('pasta') ||
        name.includes('oat')) {
      return 'Grains';
    }
    if (name.includes('apple') || name.includes('banana') || name.includes('orange') ||
        name.includes('berry')) {
      return 'Fruits';
    }
    if (name.includes('carrot') || name.includes('broccoli') || name.includes('spinach') ||
        name.includes('tomato')) {
      return 'Vegetables';
    }
    return 'Other';
  }

  // Storage fallback methods
  private async getMealPlanFromStorage(mealPlanId: string): Promise<WeeklyMealPlan | null> {
    const plans = await this.getAllMealPlansFromStorage();
    return plans.find(p => p.id === mealPlanId) || null;
  }

  private async getAllMealPlansFromStorage(): Promise<WeeklyMealPlan[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      const plans: WeeklyMealPlan[] = stored ? JSON.parse(stored) : [];
      return plans.filter(p => p.userId === this.currentUserId);
    } catch (error) {
      Alert.alert('Error', 'Failed to get meal plans from storage. Please try again.');

      console.error('Failed to get meal plans from storage:', error);
      return [];
    }
  }

  private async saveToStorage(mealPlan: WeeklyMealPlan): Promise<void> {
    const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
    const plans: WeeklyMealPlan[] = stored ? JSON.parse(stored) : [];
    plans.push(mealPlan);
    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(plans));
  }

  private async updateInStorage(mealPlan: WeeklyMealPlan): Promise<void> {
    const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
    const plans: WeeklyMealPlan[] = stored ? JSON.parse(stored) : [];
    const index = plans.findIndex(p => p.id === mealPlan.id);
    if (index >= 0) {
      plans[index] = mealPlan;
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(plans));
    }
  }
}

export const mealPlanningService = new MealPlanningService();