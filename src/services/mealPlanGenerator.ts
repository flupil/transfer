import mealDatabase from '../data/mealDatabase.json';

export interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  serving: string;
  allergens: string[];
  diets: string[];
  categories: string[];
  prepTime: number;
}

export interface MealPlan {
  id: string;
  name: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  meals: {
    id: string;
    name: string;
    time: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    foods: Meal[];
  }[];
}

export interface UserPreferences {
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  allergens: string[];
  diets: string[];
  preferredCategories?: {
    breakfast?: string[];
    lunch?: string[];
    dinner?: string[];
    snack?: string[];
  };
}

class MealPlanGeneratorService {
  private meals: {
    breakfast: Meal[];
    lunch: Meal[];
    dinner: Meal[];
    snacks: Meal[];
  };

  constructor() {
    this.meals = mealDatabase as any;
  }

  /**
   * Filter meals based on user's allergens and diets
   */
  private filterMeals(meals: Meal[], preferences: UserPreferences): Meal[] {
    return meals.filter(meal => {
      // Filter out meals with allergens
      if (preferences.allergens.length > 0) {
        const hasAllergen = meal.allergens.some(allergen =>
          preferences.allergens.includes(allergen)
        );
        if (hasAllergen) return false;
      }

      // Filter by diet preferences
      if (preferences.diets.length > 0) {
        const matchesDiet = preferences.diets.some(diet =>
          meal.diets.includes(diet)
        );
        // If user has diet restrictions but meal doesn't match any, exclude it
        if (!matchesDiet && meal.diets.length > 0) return false;
      }

      return true;
    });
  }

  /**
   * Score meals based on how well they match the target macros
   */
  private scoreMeal(
    meal: Meal,
    targetCalories: number,
    targetProtein: number,
    targetCarbs: number,
    targetFat: number
  ): number {
    const calorieScore = 1 - Math.abs(meal.calories - targetCalories) / targetCalories;
    const proteinScore = 1 - Math.abs(meal.protein - targetProtein) / targetProtein;
    const carbsScore = 1 - Math.abs(meal.carbs - targetCarbs) / targetCarbs;
    const fatScore = 1 - Math.abs(meal.fat - targetFat) / targetFat;

    // Weight calories more heavily
    return (calorieScore * 2 + proteinScore + carbsScore + fatScore) / 5;
  }

  /**
   * Select best meal from available options
   */
  private selectBestMeal(
    meals: Meal[],
    targetCalories: number,
    targetProtein: number,
    targetCarbs: number,
    targetFat: number,
    usedMealIds: Set<string>
  ): Meal | null {
    if (meals.length === 0) return null;

    // Filter out already used meals
    const availableMeals = meals.filter(meal => !usedMealIds.has(meal.id));
    if (availableMeals.length === 0) return null;

    // Score and sort meals
    const scoredMeals = availableMeals.map(meal => ({
      meal,
      score: this.scoreMeal(meal, targetCalories, targetProtein, targetCarbs, targetFat)
    }));

    scoredMeals.sort((a, b) => b.score - a.score);

    // Return top meal
    return scoredMeals[0].meal;
  }

  /**
   * Generate a single meal plan
   */
  private generateSinglePlan(
    preferences: UserPreferences,
    planNumber: number,
    usedMealIds: Set<string>
  ): MealPlan | null {
    // Filter meals by preferences
    const filteredBreakfast = this.filterMeals(this.meals.breakfast, preferences);
    const filteredLunch = this.filterMeals(this.meals.lunch, preferences);
    const filteredDinner = this.filterMeals(this.meals.dinner, preferences);
    const filteredSnacks = this.filterMeals(this.meals.snacks, preferences);

    if (filteredBreakfast.length === 0 || filteredLunch.length === 0 || filteredDinner.length === 0) {
      return null;
    }

    // Calculate target calories per meal (approximation)
    // Breakfast: 25%, Lunch: 35%, Dinner: 35%, Snack: 5%
    const breakfastCalories = preferences.calorieTarget * 0.25;
    const lunchCalories = preferences.calorieTarget * 0.35;
    const dinnerCalories = preferences.calorieTarget * 0.35;
    const snackCalories = preferences.calorieTarget * 0.05;

    // Calculate target macros per meal
    const breakfastProtein = preferences.proteinTarget * 0.25;
    const lunchProtein = preferences.proteinTarget * 0.35;
    const dinnerProtein = preferences.proteinTarget * 0.35;
    const snackProtein = preferences.proteinTarget * 0.05;

    const breakfastCarbs = preferences.carbsTarget * 0.25;
    const lunchCarbs = preferences.carbsTarget * 0.35;
    const dinnerCarbs = preferences.carbsTarget * 0.35;
    const snackCarbs = preferences.carbsTarget * 0.05;

    const breakfastFat = preferences.fatTarget * 0.25;
    const lunchFat = preferences.fatTarget * 0.35;
    const dinnerFat = preferences.fatTarget * 0.35;
    const snackFat = preferences.fatTarget * 0.05;

    // Select meals
    const breakfast = this.selectBestMeal(
      filteredBreakfast,
      breakfastCalories,
      breakfastProtein,
      breakfastCarbs,
      breakfastFat,
      usedMealIds
    );

    const lunch = this.selectBestMeal(
      filteredLunch,
      lunchCalories,
      lunchProtein,
      lunchCarbs,
      lunchFat,
      usedMealIds
    );

    const dinner = this.selectBestMeal(
      filteredDinner,
      dinnerCalories,
      dinnerProtein,
      dinnerCarbs,
      dinnerFat,
      usedMealIds
    );

    const snack = this.selectBestMeal(
      filteredSnacks,
      snackCalories,
      snackProtein,
      snackCarbs,
      snackFat,
      usedMealIds
    );

    if (!breakfast || !lunch || !dinner || !snack) {
      return null;
    }

    // Mark meals as used
    usedMealIds.add(breakfast.id);
    usedMealIds.add(lunch.id);
    usedMealIds.add(dinner.id);
    usedMealIds.add(snack.id);

    // Calculate totals
    const totalCalories = breakfast.calories + lunch.calories + dinner.calories + snack.calories;
    const totalProtein = breakfast.protein + lunch.protein + dinner.protein + snack.protein;
    const totalCarbs = breakfast.carbs + lunch.carbs + dinner.carbs + snack.carbs;
    const totalFat = breakfast.fat + lunch.fat + dinner.fat + snack.fat;
    const totalFiber = breakfast.fiber + lunch.fiber + dinner.fiber + snack.fiber;

    return {
      id: `plan_${planNumber}`,
      name: `Balanced Plan ${planNumber}`,
      totalCalories: Math.round(totalCalories),
      totalProtein: Math.round(totalProtein),
      totalCarbs: Math.round(totalCarbs),
      totalFat: Math.round(totalFat),
      totalFiber: Math.round(totalFiber),
      meals: [
        {
          id: 'breakfast',
          name: 'Breakfast',
          time: '8:00 AM',
          calories: breakfast.calories,
          protein: breakfast.protein,
          carbs: breakfast.carbs,
          fat: breakfast.fat,
          foods: [breakfast]
        },
        {
          id: 'lunch',
          name: 'Lunch',
          time: '12:30 PM',
          calories: lunch.calories,
          protein: lunch.protein,
          carbs: lunch.carbs,
          fat: lunch.fat,
          foods: [lunch]
        },
        {
          id: 'snack',
          name: 'Snack',
          time: '3:00 PM',
          calories: snack.calories,
          protein: snack.protein,
          carbs: snack.carbs,
          fat: snack.fat,
          foods: [snack]
        },
        {
          id: 'dinner',
          name: 'Dinner',
          time: '6:30 PM',
          calories: dinner.calories,
          protein: dinner.protein,
          carbs: dinner.carbs,
          fat: dinner.fat,
          foods: [dinner]
        }
      ]
    };
  }

  /**
   * Generate multiple meal plan options
   */
  generateMealPlans(preferences: UserPreferences, count: number = 3): MealPlan[] {
    const plans: MealPlan[] = [];
    const usedMealIds = new Set<string>();

    for (let i = 1; i <= count; i++) {
      const plan = this.generateSinglePlan(preferences, i, usedMealIds);
      if (plan) {
        plans.push(plan);
      } else {
        // If we can't generate more unique plans, break
        break;
      }
    }

    return plans;
  }

  /**
   * Get plan names based on macro focus
   */
  getPlanVariations(preferences: UserPreferences): MealPlan[] {
    const plans: MealPlan[] = [];

    // Plan 1: Balanced (original preferences)
    const balancedPlans = this.generateMealPlans(preferences, 1);
    if (balancedPlans.length > 0) {
      plans.push({ ...balancedPlans[0], name: 'Balanced Plan' });
    }

    // Plan 2: High Protein (increase protein by 10%, reduce carbs)
    const highProteinPrefs = {
      ...preferences,
      proteinTarget: preferences.proteinTarget * 1.1,
      carbsTarget: preferences.carbsTarget * 0.9
    };
    const highProteinPlans = this.generateMealPlans(highProteinPrefs, 1);
    if (highProteinPlans.length > 0) {
      plans.push({ ...highProteinPlans[0], name: 'High Protein Plan', id: 'plan_high_protein' });
    }

    // Plan 3: Low Carb (reduce carbs by 20%, increase fat)
    const lowCarbPrefs = {
      ...preferences,
      carbsTarget: preferences.carbsTarget * 0.8,
      fatTarget: preferences.fatTarget * 1.2
    };
    const lowCarbPlans = this.generateMealPlans(lowCarbPrefs, 1);
    if (lowCarbPlans.length > 0) {
      plans.push({ ...lowCarbPlans[0], name: 'Low Carb Plan', id: 'plan_low_carb' });
    }

    return plans;
  }
}

export const mealPlanGenerator = new MealPlanGeneratorService();
export default mealPlanGenerator;
