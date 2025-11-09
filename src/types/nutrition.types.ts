// Nutrition data standardized per 100g (industry standard)
export interface NutritionPer100g {
  calories: number;      // kcal per 100g
  protein: number;       // grams per 100g
  carbs: number;         // grams per 100g
  fat: number;           // grams per 100g
  fiber?: number;        // grams per 100g
  sugar?: number;        // grams per 100g
  saturatedFat?: number; // grams per 100g
  sodium?: number;       // mg per 100g
}

// Complete nutrition info for a specific serving
export interface NutritionInfo extends NutritionPer100g {
  servingSize?: number;   // e.g., 150
  servingUnit?: string;   // e.g., "g", "ml", "cup", "piece"
}

// Food source enum
export enum FoodSource {
  OPEN_FOOD_FACTS = 'off',
  FOOD_DATA_CENTRAL = 'fdc',
  CUSTOM = 'custom',
  MEAL_PLAN = 'meal_plan'
}

// Meal type enum (matching OpenNutriTracker)
export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack'
}

// Base food item (from database or API)
export interface FoodItem {
  id: string;
  code?: string;                    // Barcode or unique identifier
  name: string;
  brand?: string;
  imageUrl?: string;
  thumbnailUrl?: string;

  // Nutrition per 100g
  nutritionPer100g: NutritionPer100g;

  // Common serving sizes
  servingSizes?: ServingSize[];

  // Metadata
  source: FoodSource;
  category?: string;
  ingredients?: string[];
  allergens?: string[];
  dietaryTags?: string[];          // vegetarian, vegan, gluten-free, etc.
}

// Serving size options
export interface ServingSize {
  amount: number;
  unit: string;                     // g, ml, cup, tbsp, piece, slice, etc.
  label?: string;                   // "1 medium apple", "1 cup chopped"
  gramsEquivalent?: number;         // Convert to grams for calculation
}

// Logged food intake
export interface FoodIntake {
  id: string;
  userId: string;
  foodItem: FoodItem;

  // How much was consumed
  amount: number;
  unit: string;

  // When and what meal
  dateTime: Date;
  mealType: MealType;

  // Calculated nutrition based on amount
  nutrition: NutritionInfo;
}

// Custom meal (user-created recipe)
export interface CustomMeal {
  id: string;
  userId: string;
  name: string;
  description?: string;
  imageUrl?: string;

  // Meal composition
  ingredients: MealIngredient[];

  // Total nutrition (calculated from ingredients)
  nutrition: NutritionInfo;
  nutritionPer100g: NutritionPer100g;

  // Metadata
  mealType?: MealType;
  servings: number;                 // Recipe yields X servings
  prepTime?: number;                // minutes
  cookTime?: number;                // minutes
  difficulty?: 'easy' | 'medium' | 'hard';
  instructions?: string[];

  // Tags
  dietaryTags?: string[];
  allergens?: string[];

  // User favorites
  isFavorite?: boolean;
  timesLogged?: number;
  lastLoggedDate?: Date;
}

// Ingredient in a custom meal
export interface MealIngredient {
  foodItem: FoodItem;
  amount: number;
  unit: string;
}

// Daily food diary entry
export interface DailyDiary {
  id: string;
  userId: string;
  date: string;                     // YYYY-MM-DD format

  // Meals organized by type
  breakfast: FoodIntake[];
  lunch: FoodIntake[];
  dinner: FoodIntake[];
  snacks: FoodIntake[];

  // Daily totals
  totalNutrition: NutritionInfo;

  // Targets for the day
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    water: number;
  };

  // Water tracking
  waterIntake: number;              // ml

  // Notes
  notes?: string;
}

// Meal plan (pre-made plan with multiple meals)
export interface MealPlan {
  id: string;
  name: string;
  description?: string;

  // Daily meals
  breakfast?: CustomMeal;
  lunch?: CustomMeal;
  dinner?: CustomMeal;
  snack?: CustomMeal;

  // Total daily nutrition
  totalCalories: number;
  totalNutrition: NutritionInfo;

  // Filtering criteria
  calorieRange: {
    min: number;
    max: number;
  };

  goals?: string[];
  dietaryTags?: string[];
  allergens?: string[];
}

// Search result from food database
export interface FoodSearchResult {
  items: FoodItem[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Recent foods tracker
export interface RecentFoods {
  userId: string;
  foods: {
    foodItem: FoodItem;
    lastUsed: Date;
    frequency: number;              // How many times logged
  }[];
}

// Nutrition calculation helper
export function calculateNutrition(
  nutritionPer100g: NutritionPer100g | null | undefined,
  amount: number,
  unit: string
): NutritionInfo {
  // Defensive check: if nutrition data is missing, return zeros
  if (!nutritionPer100g) {
    console.warn('calculateNutrition: nutritionPer100g is null or undefined, returning zero values');
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: undefined,
      sugar: undefined,
      saturatedFat: undefined,
      sodium: undefined,
      servingSize: amount,
      servingUnit: unit
    };
  }

  // Convert amount to grams first
  let grams = amount;

  // If unit is not grams, convert it
  if (unit === 'ml') {
    grams = amount; // Assume density of 1 for liquids
  } else if (unit !== 'g') {
    // For other units, we need serving size data
    // This is a simplified version
    grams = amount;
  }

  // Calculate nutrition based on grams
  const multiplier = grams / 100;

  // Use nullish coalescing to handle missing properties
  return {
    calories: Math.round((nutritionPer100g.calories ?? 0) * multiplier),
    protein: Math.round((nutritionPer100g.protein ?? 0) * multiplier * 10) / 10,
    carbs: Math.round((nutritionPer100g.carbs ?? 0) * multiplier * 10) / 10,
    fat: Math.round((nutritionPer100g.fat ?? 0) * multiplier * 10) / 10,
    fiber: nutritionPer100g.fiber ? Math.round(nutritionPer100g.fiber * multiplier * 10) / 10 : undefined,
    sugar: nutritionPer100g.sugar ? Math.round(nutritionPer100g.sugar * multiplier * 10) / 10 : undefined,
    saturatedFat: nutritionPer100g.saturatedFat ? Math.round(nutritionPer100g.saturatedFat * multiplier * 10) / 10 : undefined,
    sodium: nutritionPer100g.sodium ? Math.round(nutritionPer100g.sodium * multiplier) : undefined,
    servingSize: grams,
    servingUnit: 'g'
  };
}
