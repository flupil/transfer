import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSafeDatabase } from '../database/databaseHelper';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

interface FoodItem {
  name: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  alternatives?: FoodItem[];
}

interface Meal {
  id: string;
  name: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  foods: FoodItem[];
}

interface MealPlan {
  id: string;
  name: string;
  description: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  meals: Meal[];
}

// Predefined meal plans
const MEAL_PLANS: MealPlan[] = [
  {
    id: 'cutting',
    name: 'Cutting Plan',
    description: 'Low calorie plan for fat loss',
    totalCalories: 1800,
    totalProtein: 150,
    totalCarbs: 180,
    totalFat: 60,
    meals: [
      {
        id: 'cutting-breakfast',
        name: 'Breakfast',
        time: '7:00 AM',
        calories: 400,
        protein: 35,
        carbs: 40,
        fat: 12,
        foods: [
          {
            name: 'Egg Whites',
            amount: '200g',
            calories: 108,
            protein: 22,
            carbs: 2,
            fat: 0,
            alternatives: [
              { name: 'Tofu', amount: '150g', calories: 120, protein: 15, carbs: 4, fat: 6 },
              { name: 'Greek Yogurt', amount: '200g', calories: 110, protein: 20, carbs: 8, fat: 0 }
            ]
          },
          {
            name: 'Oatmeal',
            amount: '50g',
            calories: 189,
            protein: 7,
            carbs: 33,
            fat: 3,
            alternatives: [
              { name: 'Whole Wheat Bread', amount: '2 slices', calories: 160, protein: 8, carbs: 30, fat: 2 },
              { name: 'Brown Rice', amount: '60g dry', calories: 210, protein: 4, carbs: 44, fat: 2 }
            ]
          },
          {
            name: 'Banana',
            amount: '1 medium',
            calories: 105,
            protein: 1,
            carbs: 27,
            fat: 0,
            alternatives: [
              { name: 'Apple', amount: '1 large', calories: 95, protein: 0, carbs: 25, fat: 0 },
              { name: 'Berries', amount: '150g', calories: 85, protein: 1, carbs: 21, fat: 0 }
            ]
          }
        ]
      },
      {
        id: 'cutting-snack1',
        name: 'Morning Snack',
        time: '10:00 AM',
        calories: 200,
        protein: 20,
        carbs: 15,
        fat: 8,
        foods: [
          {
            name: 'Protein Shake',
            amount: '1 scoop',
            calories: 120,
            protein: 25,
            carbs: 3,
            fat: 1,
            alternatives: [
              { name: 'Cottage Cheese', amount: '150g', calories: 120, protein: 18, carbs: 6, fat: 2 },
              { name: 'Turkey Slices', amount: '100g', calories: 135, protein: 24, carbs: 2, fat: 3 }
            ]
          },
          {
            name: 'Almonds',
            amount: '20g',
            calories: 120,
            protein: 4,
            carbs: 4,
            fat: 10,
            alternatives: [
              { name: 'Walnuts', amount: '20g', calories: 130, protein: 3, carbs: 3, fat: 13 },
              { name: 'Peanut Butter', amount: '1 tbsp', calories: 95, protein: 4, carbs: 3, fat: 8 }
            ]
          }
        ]
      },
      {
        id: 'cutting-lunch',
        name: 'Lunch',
        time: '1:00 PM',
        calories: 450,
        protein: 40,
        carbs: 45,
        fat: 15,
        foods: [
          {
            name: 'Chicken Breast',
            amount: '150g',
            calories: 248,
            protein: 46,
            carbs: 0,
            fat: 5,
            alternatives: [
              { name: 'Turkey Breast', amount: '150g', calories: 210, protein: 42, carbs: 0, fat: 4 },
              { name: 'White Fish', amount: '200g', calories: 240, protein: 44, carbs: 0, fat: 6 }
            ]
          },
          {
            name: 'Brown Rice',
            amount: '100g cooked',
            calories: 112,
            protein: 2,
            carbs: 24,
            fat: 1,
            alternatives: [
              { name: 'Sweet Potato', amount: '150g', calories: 130, protein: 2, carbs: 30, fat: 0 },
              { name: 'Quinoa', amount: '100g cooked', calories: 120, protein: 4, carbs: 21, fat: 2 }
            ]
          },
          {
            name: 'Mixed Vegetables',
            amount: '200g',
            calories: 80,
            protein: 3,
            carbs: 16,
            fat: 0,
            alternatives: [
              { name: 'Broccoli', amount: '200g', calories: 70, protein: 5, carbs: 14, fat: 0 },
              { name: 'Spinach', amount: '200g', calories: 50, protein: 6, carbs: 8, fat: 0 }
            ]
          }
        ]
      },
      {
        id: 'cutting-snack2',
        name: 'Afternoon Snack',
        time: '4:00 PM',
        calories: 250,
        protein: 25,
        carbs: 20,
        fat: 10,
        foods: [
          {
            name: 'Rice Cakes',
            amount: '3 pieces',
            calories: 105,
            protein: 2,
            carbs: 23,
            fat: 0,
            alternatives: [
              { name: 'Whole Wheat Crackers', amount: '30g', calories: 120, protein: 3, carbs: 20, fat: 3 }
            ]
          },
          {
            name: 'Tuna',
            amount: '100g',
            calories: 130,
            protein: 28,
            carbs: 0,
            fat: 1,
            alternatives: [
              { name: 'Chicken Breast', amount: '80g', calories: 130, protein: 25, carbs: 0, fat: 3 }
            ]
          }
        ]
      },
      {
        id: 'cutting-dinner',
        name: 'Dinner',
        time: '7:00 PM',
        calories: 500,
        protein: 30,
        carbs: 60,
        fat: 15,
        foods: [
          {
            name: 'Salmon',
            amount: '150g',
            calories: 312,
            protein: 30,
            carbs: 0,
            fat: 20,
            alternatives: [
              { name: 'Lean Beef', amount: '150g', calories: 300, protein: 35, carbs: 0, fat: 16 },
              { name: 'Chicken Thigh', amount: '150g', calories: 330, protein: 28, carbs: 0, fat: 22 }
            ]
          },
          {
            name: 'Pasta',
            amount: '80g dry',
            calories: 280,
            protein: 10,
            carbs: 58,
            fat: 2,
            alternatives: [
              { name: 'White Rice', amount: '80g dry', calories: 290, protein: 6, carbs: 64, fat: 0 },
              { name: 'Potatoes', amount: '250g', calories: 220, protein: 5, carbs: 50, fat: 0 }
            ]
          },
          {
            name: 'Salad',
            amount: '150g',
            calories: 30,
            protein: 2,
            carbs: 6,
            fat: 0,
            alternatives: [
              { name: 'Cucumber', amount: '200g', calories: 32, protein: 1, carbs: 7, fat: 0 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'bulking',
    name: 'Bulking Plan',
    description: 'High calorie plan for muscle gain',
    totalCalories: 3000,
    totalProtein: 200,
    totalCarbs: 375,
    totalFat: 100,
    meals: [
      {
        id: 'bulk-breakfast',
        name: 'Breakfast',
        time: '7:00 AM',
        calories: 700,
        protein: 40,
        carbs: 85,
        fat: 20,
        foods: [
          {
            name: 'Whole Eggs',
            amount: '3 large',
            calories: 210,
            protein: 18,
            carbs: 3,
            fat: 15,
            alternatives: [
              { name: 'Egg Whites + Cheese', amount: '200g + 30g', calories: 220, protein: 25, carbs: 3, fat: 10 }
            ]
          },
          {
            name: 'Oatmeal',
            amount: '100g',
            calories: 378,
            protein: 14,
            carbs: 66,
            fat: 6,
            alternatives: [
              { name: 'Granola', amount: '100g', calories: 400, protein: 10, carbs: 70, fat: 12 }
            ]
          },
          {
            name: 'Whole Wheat Toast',
            amount: '2 slices',
            calories: 160,
            protein: 8,
            carbs: 30,
            fat: 2,
            alternatives: [
              { name: 'Bagel', amount: '1 whole', calories: 245, protein: 10, carbs: 48, fat: 2 }
            ]
          },
          {
            name: 'Peanut Butter',
            amount: '2 tbsp',
            calories: 190,
            protein: 8,
            carbs: 8,
            fat: 16,
            alternatives: [
              { name: 'Almond Butter', amount: '2 tbsp', calories: 200, protein: 7, carbs: 7, fat: 18 }
            ]
          }
        ]
      },
      {
        id: 'bulk-snack1',
        name: 'Morning Snack',
        time: '10:00 AM',
        calories: 500,
        protein: 30,
        carbs: 60,
        fat: 15,
        foods: [
          {
            name: 'Mass Gainer Shake',
            amount: '1 serving',
            calories: 300,
            protein: 25,
            carbs: 40,
            fat: 5,
            alternatives: [
              { name: 'Protein Shake + Banana', amount: '1 scoop + 2', calories: 320, protein: 27, carbs: 55, fat: 2 }
            ]
          },
          {
            name: 'Trail Mix',
            amount: '50g',
            calories: 200,
            protein: 5,
            carbs: 20,
            fat: 12,
            alternatives: [
              { name: 'Mixed Nuts', amount: '50g', calories: 290, protein: 10, carbs: 12, fat: 25 }
            ]
          }
        ]
      },
      {
        id: 'bulk-lunch',
        name: 'Lunch',
        time: '1:00 PM',
        calories: 800,
        protein: 50,
        carbs: 90,
        fat: 25,
        foods: [
          {
            name: 'Lean Beef',
            amount: '200g',
            calories: 400,
            protein: 46,
            carbs: 0,
            fat: 22,
            alternatives: [
              { name: 'Chicken Thighs', amount: '200g', calories: 440, protein: 38, carbs: 0, fat: 30 }
            ]
          },
          {
            name: 'White Rice',
            amount: '150g cooked',
            calories: 195,
            protein: 4,
            carbs: 42,
            fat: 0,
            alternatives: [
              { name: 'Pasta', amount: '150g cooked', calories: 210, protein: 8, carbs: 43, fat: 1 }
            ]
          },
          {
            name: 'Avocado',
            amount: '100g',
            calories: 160,
            protein: 2,
            carbs: 9,
            fat: 15,
            alternatives: [
              { name: 'Olive Oil', amount: '1 tbsp', calories: 120, protein: 0, carbs: 0, fat: 14 }
            ]
          },
          {
            name: 'Mixed Vegetables',
            amount: '150g',
            calories: 60,
            protein: 2,
            carbs: 12,
            fat: 0
          }
        ]
      },
      {
        id: 'bulk-snack2',
        name: 'Pre-Workout',
        time: '3:30 PM',
        calories: 300,
        protein: 20,
        carbs: 45,
        fat: 5,
        foods: [
          {
            name: 'Banana',
            amount: '2 large',
            calories: 240,
            protein: 3,
            carbs: 62,
            fat: 0,
            alternatives: [
              { name: 'Dates', amount: '100g', calories: 280, protein: 2, carbs: 75, fat: 0 }
            ]
          },
          {
            name: 'Rice Cakes',
            amount: '4 pieces',
            calories: 140,
            protein: 3,
            carbs: 31,
            fat: 0
          },
          {
            name: 'Whey Protein',
            amount: '0.5 scoop',
            calories: 60,
            protein: 12,
            carbs: 2,
            fat: 0
          }
        ]
      },
      {
        id: 'bulk-dinner',
        name: 'Dinner',
        time: '7:00 PM',
        calories: 700,
        protein: 60,
        carbs: 95,
        fat: 35,
        foods: [
          {
            name: 'Salmon',
            amount: '200g',
            calories: 416,
            protein: 40,
            carbs: 0,
            fat: 26,
            alternatives: [
              { name: 'Ribeye Steak', amount: '200g', calories: 450, protein: 48, carbs: 0, fat: 28 }
            ]
          },
          {
            name: 'Sweet Potato',
            amount: '300g',
            calories: 258,
            protein: 5,
            carbs: 60,
            fat: 0,
            alternatives: [
              { name: 'White Potato', amount: '350g', calories: 270, protein: 7, carbs: 62, fat: 0 }
            ]
          },
          {
            name: 'Green Beans',
            amount: '200g',
            calories: 70,
            protein: 4,
            carbs: 16,
            fat: 0
          },
          {
            name: 'Olive Oil',
            amount: '1 tbsp',
            calories: 120,
            protein: 0,
            carbs: 0,
            fat: 14
          }
        ]
      }
    ]
  },
  {
    id: 'maintenance',
    name: 'Maintenance Plan',
    description: 'Balanced plan for weight maintenance',
    totalCalories: 2400,
    totalProtein: 180,
    totalCarbs: 270,
    totalFat: 80,
    meals: [
      {
        id: 'maint-breakfast',
        name: 'Breakfast',
        time: '7:30 AM',
        calories: 550,
        protein: 35,
        carbs: 65,
        fat: 18,
        foods: [
          {
            name: 'Scrambled Eggs',
            amount: '2 whole + 2 whites',
            calories: 180,
            protein: 20,
            carbs: 2,
            fat: 10,
            alternatives: [
              { name: 'Omelet', amount: '3 eggs', calories: 210, protein: 18, carbs: 3, fat: 15 }
            ]
          },
          {
            name: 'Whole Wheat Toast',
            amount: '2 slices',
            calories: 160,
            protein: 8,
            carbs: 30,
            fat: 2
          },
          {
            name: 'Greek Yogurt',
            amount: '150g',
            calories: 100,
            protein: 15,
            carbs: 8,
            fat: 0,
            alternatives: [
              { name: 'Cottage Cheese', amount: '150g', calories: 120, protein: 18, carbs: 6, fat: 2 }
            ]
          },
          {
            name: 'Mixed Berries',
            amount: '100g',
            calories: 60,
            protein: 1,
            carbs: 14,
            fat: 0
          },
          {
            name: 'Almond Butter',
            amount: '1 tbsp',
            calories: 100,
            protein: 4,
            carbs: 3,
            fat: 9
          }
        ]
      },
      {
        id: 'maint-snack1',
        name: 'Mid-Morning',
        time: '10:30 AM',
        calories: 300,
        protein: 25,
        carbs: 30,
        fat: 10,
        foods: [
          {
            name: 'Protein Bar',
            amount: '1 bar',
            calories: 200,
            protein: 20,
            carbs: 22,
            fat: 7,
            alternatives: [
              { name: 'Protein Shake', amount: '1 scoop', calories: 120, protein: 25, carbs: 3, fat: 1 }
            ]
          },
          {
            name: 'Apple',
            amount: '1 medium',
            calories: 95,
            protein: 0,
            carbs: 25,
            fat: 0
          }
        ]
      },
      {
        id: 'maint-lunch',
        name: 'Lunch',
        time: '1:00 PM',
        calories: 650,
        protein: 45,
        carbs: 70,
        fat: 20,
        foods: [
          {
            name: 'Grilled Chicken',
            amount: '180g',
            calories: 300,
            protein: 55,
            carbs: 0,
            fat: 6,
            alternatives: [
              { name: 'Turkey Breast', amount: '200g', calories: 280, protein: 56, carbs: 0, fat: 5 }
            ]
          },
          {
            name: 'Quinoa',
            amount: '150g cooked',
            calories: 180,
            protein: 6,
            carbs: 32,
            fat: 3,
            alternatives: [
              { name: 'Brown Rice', amount: '150g cooked', calories: 165, protein: 4, carbs: 34, fat: 1 }
            ]
          },
          {
            name: 'Mixed Salad',
            amount: '200g',
            calories: 60,
            protein: 3,
            carbs: 12,
            fat: 0
          },
          {
            name: 'Olive Oil Dressing',
            amount: '1 tbsp',
            calories: 120,
            protein: 0,
            carbs: 0,
            fat: 14
          }
        ]
      },
      {
        id: 'maint-snack2',
        name: 'Afternoon',
        time: '4:00 PM',
        calories: 250,
        protein: 20,
        carbs: 25,
        fat: 8,
        foods: [
          {
            name: 'Hummus',
            amount: '60g',
            calories: 100,
            protein: 4,
            carbs: 12,
            fat: 5,
            alternatives: [
              { name: 'Guacamole', amount: '60g', calories: 90, protein: 1, carbs: 5, fat: 8 }
            ]
          },
          {
            name: 'Carrot Sticks',
            amount: '100g',
            calories: 40,
            protein: 1,
            carbs: 10,
            fat: 0
          },
          {
            name: 'String Cheese',
            amount: '2 pieces',
            calories: 160,
            protein: 12,
            carbs: 2,
            fat: 12
          }
        ]
      },
      {
        id: 'maint-dinner',
        name: 'Dinner',
        time: '7:00 PM',
        calories: 650,
        protein: 55,
        carbs: 80,
        fat: 24,
        foods: [
          {
            name: 'Lean Steak',
            amount: '150g',
            calories: 300,
            protein: 42,
            carbs: 0,
            fat: 14,
            alternatives: [
              { name: 'Pork Tenderloin', amount: '150g', calories: 275, protein: 40, carbs: 0, fat: 12 }
            ]
          },
          {
            name: 'Baked Potato',
            amount: '250g',
            calories: 215,
            protein: 5,
            carbs: 50,
            fat: 0,
            alternatives: [
              { name: 'Mashed Sweet Potato', amount: '250g', calories: 220, protein: 4, carbs: 52, fat: 0 }
            ]
          },
          {
            name: 'Steamed Broccoli',
            amount: '200g',
            calories: 70,
            protein: 6,
            carbs: 14,
            fat: 0
          },
          {
            name: 'Butter',
            amount: '10g',
            calories: 72,
            protein: 0,
            carbs: 0,
            fat: 8
          }
        ]
      }
    ]
  }
];

class MealPlanService {
  private readonly STORAGE_KEY = 'selectedMealPlan';
  private readonly CONSUMED_KEY = 'consumedFoods';
  private readonly CUSTOM_PLANS_KEY = 'customMealPlans';

  async getMealPlans(): Promise<MealPlan[]> {
    // Get custom plans from storage
    try {
      const customPlansStr = await AsyncStorage.getItem(this.CUSTOM_PLANS_KEY);
      const customPlans = customPlansStr ? JSON.parse(customPlansStr) : [];
      return [...MEAL_PLANS, ...customPlans];
    } catch (error) {
      Alert.alert('Error', 'Loading custom meal plans. Please try again.');

      console.error('Error loading custom meal plans:', error);
      return MEAL_PLANS;
    }
  }

  async saveMealPlan(plan: MealPlan, userId?: string): Promise<void> {
    try {
      // Save the plan to custom plans list
      const customPlansStr = await AsyncStorage.getItem(this.CUSTOM_PLANS_KEY);
      const customPlans = customPlansStr ? JSON.parse(customPlansStr) : [];

      // Remove existing plan with same ID if it exists
      const filteredPlans = customPlans.filter((p: MealPlan) => p.id !== plan.id);
      filteredPlans.push(plan);

      await AsyncStorage.setItem(this.CUSTOM_PLANS_KEY, JSON.stringify(filteredPlans));

      // Set this as the selected plan
      await this.selectPlan(plan.id);

      console.log('Meal plan saved successfully:', plan.name);
    } catch (error) {
      Alert.alert('Error', 'Saving meal plan. Please try again.');

      console.error('Error saving meal plan:', error);
      throw error;
    }
  }

  async getMealPlanById(id: string): Promise<MealPlan | null> {
    const allPlans = await this.getMealPlans();
    return allPlans.find(plan => plan.id === id) || null;
  }

  async getSelectedPlan(): Promise<MealPlan | null> {
    try {
      const planId = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (planId) {
        return this.getMealPlanById(planId);
      }
      return null;
    } catch {
      return null;
    }
  }

  async selectPlan(planId: string): Promise<void> {
    await AsyncStorage.setItem(this.STORAGE_KEY, planId);
  }

  async getMealById(planId: string, mealId: string): Promise<Meal | null> {
    const plan = await this.getMealPlanById(planId);
    if (plan) {
      return plan.meals.find(meal => meal.id === mealId) || null;
    }
    return null;
  }

  async markFoodConsumed(date: string, mealId: string, foodName: string): Promise<void> {
    try {
      const key = `${this.CONSUMED_KEY}_${date}`;
      const consumedData = await AsyncStorage.getItem(key);
      const consumed = consumedData ? JSON.parse(consumedData) : {};

      if (!consumed[mealId]) {
        consumed[mealId] = [];
      }

      if (!consumed[mealId].includes(foodName)) {
        consumed[mealId].push(foodName);
      }

      await AsyncStorage.setItem(key, JSON.stringify(consumed));
    } catch (error) {
      Alert.alert('Error', 'Marking food as consumed. Please try again.');

      console.error('Error marking food as consumed:', error);
    }
  }

  async getConsumedFoods(date: string, mealId: string): Promise<string[]> {
    try {
      const key = `${this.CONSUMED_KEY}_${date}`;
      const consumedData = await AsyncStorage.getItem(key);
      if (consumedData) {
        const consumed = JSON.parse(consumedData);
        return consumed[mealId] || [];
      }
      return [];
    } catch {
      return [];
    }
  }

  async clearTodayConsumed(date: string): Promise<void> {
    try {
      const key = `${this.CONSUMED_KEY}_${date}`;
      await AsyncStorage.removeItem(key);
      console.log('Cleared consumed foods for date:', date);
    } catch (error) {
      Alert.alert('Error', 'Clearing consumed foods. Please try again.');

      console.error('Error clearing consumed foods:', error);
    }
  }

  async replaceFoodItem(meal: Meal, originalFood: FoodItem, replacementFood: FoodItem): Promise<Meal> {
    const updatedFoods = meal.foods.map(food =>
      food.name === originalFood.name ? replacementFood : food
    );

    // Recalculate meal totals
    const totals = updatedFoods.reduce((acc, food) => ({
      calories: acc.calories + food.calories,
      protein: acc.protein + food.protein,
      carbs: acc.carbs + food.carbs,
      fat: acc.fat + food.fat
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    return {
      ...meal,
      ...totals,
      foods: updatedFoods
    };
  }

  async getTodayProgress(planId: string, userId?: string): Promise<{
    consumed: { calories: number; protein: number; carbs: number; fat: number };
    remaining: { calories: number; protein: number; carbs: number; fat: number };
    percentage: number;
  }> {
    const plan = await this.getMealPlanById(planId);
    if (!plan) {
      return {
        consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        remaining: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        percentage: 0
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const consumed = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    console.log('getTodayProgress - plan totals:', {
      calories: plan.totalCalories,
      protein: plan.totalProtein,
      carbs: plan.totalCarbs,
      fat: plan.totalFat
    });

    // Get consumed foods from database (primary source of truth)
    try {
      const { getSafeDatabase } = await import('../database/databaseHelper');
      const db = getSafeDatabase();
      if (db && userId) {
        const result = await db.getAllAsync(
          `SELECT SUM(calories) as totalCalories, SUM(protein) as totalProtein,
           SUM(carbs) as totalCarbs, SUM(fat) as totalFat
           FROM food_logs
           WHERE userId = ? AND date = ?`,
          [userId, today]
        ) as any[];

        console.log('getTodayProgress - database result:', result[0]);

        if (result.length > 0 && result[0].totalCalories) {
          consumed.calories = result[0].totalCalories || 0;
          consumed.protein = result[0].totalProtein || 0;
          consumed.carbs = result[0].totalCarbs || 0;
          consumed.fat = result[0].totalFat || 0;
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Loading from database. Please try again.');

      console.error('Error loading from database:', error);

      // Fallback to AsyncStorage method if database fails
      for (const meal of plan.meals) {
        const consumedFoods = await this.getConsumedFoods(today, meal.id);
        for (const foodName of consumedFoods) {
          const food = meal.foods.find(f => f.name === foodName);
          if (food) {
            consumed.calories += food.calories;
            consumed.protein += food.protein;
            consumed.carbs += food.carbs;
            consumed.fat += food.fat;
          }
        }
      }
    }

    const remaining = {
      calories: Math.max(0, plan.totalCalories - consumed.calories),
      protein: Math.max(0, plan.totalProtein - consumed.protein),
      carbs: Math.max(0, plan.totalCarbs - consumed.carbs),
      fat: Math.max(0, plan.totalFat - consumed.fat)
    };

    const percentage = Math.round((consumed.calories / plan.totalCalories) * 100);

    return { consumed, remaining, percentage };
  }
}

export const mealPlanService = new MealPlanService();
export const getMealPlans = () => mealPlanService.getMealPlans();
export const selectMealPlan = (planId: string) => mealPlanService.selectPlan(planId);
export const getSelectedMealPlan = () => mealPlanService.getSelectedPlan();
export const getMealDetails = (planId: string, mealId: string) => mealPlanService.getMealById(planId, mealId);
export const markFoodEaten = (date: string, mealId: string, foodName: string) => mealPlanService.markFoodConsumed(date, mealId, foodName);
export const getTodayMealProgress = (planId: string, userId?: string) => mealPlanService.getTodayProgress(planId, userId);
export const replaceMealFood = (meal: Meal, original: FoodItem, replacement: FoodItem) => mealPlanService.replaceFoodItem(meal, original, replacement);
export const clearTodayMealProgress = (date: string) => mealPlanService.clearTodayConsumed(date);
export const saveMealPlan = (plan: MealPlan, userId?: string) => mealPlanService.saveMealPlan(plan, userId);