import { databaseService } from './databaseService';
import { FoodItem, NutritionLog, MealPlan } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DailyNutrition {
  date: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  meals: NutritionLog[];
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
}

class NutritionService {
  // Food Items
  async createFoodItem(food: Omit<FoodItem, 'id'>): Promise<FoodItem> {
    return await databaseService.create<FoodItem>(
      'foodItems',
      food as FoodItem,
      'food_items'
    );
  }

  async getFoodItem(foodId: string): Promise<FoodItem | null> {
    return await databaseService.read<FoodItem>(
      'foodItems',
      foodId,
      'food_items'
    );
  }

  async searchFoodItems(query: string): Promise<FoodItem[]> {
    // For now, return from local database
    // In production, this could also query an external API
    const allFoods = await databaseService.list<FoodItem>(
      'foodItems',
      undefined,
      'food_items'
    );

    return allFoods.filter(food =>
      food.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getFoodByBarcode(barcode: string): Promise<FoodItem | null> {
    const foods = await databaseService.list<FoodItem>(
      'foodItems',
      [{ field: 'barcode', operator: '==', value: barcode }],
      'food_items'
    );

    return foods.length > 0 ? foods[0] : null;
  }

  async getUserCustomFoods(userId: string): Promise<FoodItem[]> {
    return await databaseService.list<FoodItem>(
      'foodItems',
      [{ field: 'createdBy', operator: '==', value: userId }],
      'food_items'
    );
  }

  // Nutrition Logs
  async logMeal(log: Omit<NutritionLog, 'id'>): Promise<NutritionLog> {
    const nutritionLog = {
      ...log,
      loggedAt: new Date().toISOString()
    };

    return await databaseService.create<NutritionLog>(
      'nutritionLogs',
      nutritionLog as NutritionLog,
      'nutrition_logs'
    );
  }

  async getUserNutritionLogs(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<NutritionLog[]> {
    const filters = [
      { field: 'userId', operator: '==', value: userId }
    ];

    if (startDate) {
      filters.push({ field: 'date', operator: '>=', value: startDate.toISOString() });
    }
    if (endDate) {
      filters.push({ field: 'date', operator: '<=', value: endDate.toISOString() });
    }

    return await databaseService.list<NutritionLog>(
      'nutritionLogs',
      filters,
      'nutrition_logs'
    );
  }

  async getDailyNutrition(userId: string, date: Date): Promise<DailyNutrition> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await this.getUserNutritionLogs(userId, startOfDay, endOfDay);

    // Get user targets from AsyncStorage or use defaults
    const userTargets = await this.getUserNutritionTargets(userId);

    const daily: DailyNutrition = {
      date: date.toISOString().split('T')[0],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      meals: logs,
      targetCalories: userTargets.calories,
      targetProtein: userTargets.protein,
      targetCarbs: userTargets.carbs,
      targetFat: userTargets.fat
    };

    // Calculate totals
    logs.forEach(log => {
      log.meals.forEach(meal => {
        meal.items.forEach(item => {
          const multiplier = item.quantity / 100; // Assuming nutrition per 100g
          daily.totalCalories += (item.macros?.calories || 0) * multiplier;
          daily.totalProtein += (item.macros?.protein || 0) * multiplier;
          daily.totalCarbs += (item.macros?.carbs || 0) * multiplier;
          daily.totalFat += (item.macros?.fat || 0) * multiplier;
          daily.totalFiber += (item.macros?.fiber || 0) * multiplier;
        });
      });
    });

    return daily;
  }

  async updateNutritionLog(
    logId: string,
    updates: Partial<NutritionLog>
  ): Promise<void> {
    await databaseService.update<NutritionLog>(
      'nutritionLogs',
      logId,
      updates,
      'nutrition_logs'
    );
  }

  async deleteNutritionLog(logId: string): Promise<void> {
    await databaseService.delete('nutritionLogs', logId, 'nutrition_logs');
  }

  // Meal Plans
  async getMealPlans(): Promise<MealPlan[]> {
    return await databaseService.list<MealPlan>(
      'mealPlans',
      undefined,
      'meal_plans'
    );
  }

  async getUserMealPlan(userId: string): Promise<MealPlan | null> {
    const plans = await databaseService.list<MealPlan>(
      'mealPlans',
      [{ field: 'assignedUserIds', operator: 'array-contains', value: userId }],
      'meal_plans'
    );

    return plans.length > 0 ? plans[0] : null;
  }

  async assignMealPlan(planId: string, userId: string): Promise<void> {
    const plan = await databaseService.read<MealPlan>('mealPlans', planId, 'meal_plans');

    if (plan) {
      const assignedUserIds = plan.assignedUserIds || [];
      if (!assignedUserIds.includes(userId)) {
        assignedUserIds.push(userId);
        await databaseService.update<MealPlan>(
          'mealPlans',
          planId,
          { assignedUserIds },
          'meal_plans'
        );
      }
    }
  }

  // Water Tracking
  async logWater(userId: string, amount: number): Promise<void> {
    const key = `water_${userId}_${new Date().toISOString().split('T')[0]}`;
    const current = await AsyncStorage.getItem(key);
    const newTotal = (parseInt(current || '0') + amount).toString();
    await AsyncStorage.setItem(key, newTotal);

    // Also log to database for sync
    await this.logMeal({
      userId,
      date: new Date(),
      mealType: 'water',
      items: [{
        foodId: 'water',
        foodName: 'Water',
        quantity: amount,
        unit: 'ml',
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      }],
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0
    });
  }

  async getDailyWater(userId: string, date?: Date): Promise<number> {
    const targetDate = date || new Date();
    const key = `water_${userId}_${targetDate.toISOString().split('T')[0]}`;
    const amount = await AsyncStorage.getItem(key);
    return parseInt(amount || '0');
  }

  // Nutrition Targets
  async getUserNutritionTargets(userId: string): Promise<{
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }> {
    const key = `nutrition_targets_${userId}`;
    const targets = await AsyncStorage.getItem(key);

    if (targets) {
      return JSON.parse(targets);
    }

    // Default targets
    return {
      calories: 2000,
      protein: 150,
      carbs: 250,
      fat: 65
    };
  }

  async updateNutritionTargets(
    userId: string,
    targets: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    }
  ): Promise<void> {
    const key = `nutrition_targets_${userId}`;
    await AsyncStorage.setItem(key, JSON.stringify(targets));
  }

  // Calorie calculation
  async calculateDailyCalories(
    userId: string,
    weight: number,
    height: number,
    age: number,
    gender: 'male' | 'female',
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active',
    goal: 'lose' | 'maintain' | 'gain'
  ): Promise<number> {
    // Mifflin-St Jeor Equation
    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multiplier
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    const tdee = bmr * activityMultipliers[activityLevel];

    // Goal adjustment
    let targetCalories = tdee;
    if (goal === 'lose') {
      targetCalories = tdee - 500; // 500 calorie deficit for 1 lb/week loss
    } else if (goal === 'gain') {
      targetCalories = tdee + 300; // 300 calorie surplus for lean gain
    }

    return Math.round(targetCalories);
  }

  // Streak tracking
  async getNutritionStreak(userId: string): Promise<number> {
    const logs = await this.getUserNutritionLogs(userId);

    if (logs.length === 0) return 0;

    // Sort logs by date
    logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const log of logs) {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (currentDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === streak) {
        streak++;
      } else if (daysDiff > streak) {
        break;
      }
    }

    return streak;
  }

  // Sync with cloud
  async syncNutrition(): Promise<void> {
    await databaseService.syncWithCloud();
  }
}

export const nutritionService = new NutritionService();