import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSafeDatabase } from '../database/databaseHelper';
import { databaseService } from './databaseService';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  saturatedFat?: number;
  transFat?: number;
  category?: string;
  imageUrl?: string;
  verified?: boolean;
  source?: 'user' | 'usda' | 'api' | 'barcode';
  userId?: string;
}

interface Recipe {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
  instructions?: string;
  prepTime?: number;
  cookTime?: number;
  servings: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  imageUrl?: string;
  userId: string;
  tags?: string[];
  createdAt: Date;
}

interface RecipeIngredient {
  foodId: string;
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

class FoodDatabaseService {
  private localDb = getSafeDatabase();
  private foodCache: Map<string, FoodItem> = new Map();

  // Initialize with default foods
  async initializeDefaultFoods() {
    const defaultFoods: FoodItem[] = [
      {
        id: 'default_1',
        name: 'Chicken Breast',
        servingSize: 100,
        servingUnit: 'g',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0,
        category: 'Protein',
        source: 'usda',
        verified: true,
      },
      {
        id: 'default_2',
        name: 'White Rice (cooked)',
        servingSize: 100,
        servingUnit: 'g',
        calories: 130,
        protein: 2.7,
        carbs: 28.2,
        fat: 0.3,
        fiber: 0.4,
        category: 'Grains',
        source: 'usda',
        verified: true,
      },
      {
        id: 'default_3',
        name: 'Broccoli',
        servingSize: 100,
        servingUnit: 'g',
        calories: 34,
        protein: 2.8,
        carbs: 6.6,
        fat: 0.4,
        fiber: 2.6,
        category: 'Vegetables',
        source: 'usda',
        verified: true,
      },
      {
        id: 'default_4',
        name: 'Banana',
        servingSize: 118,
        servingUnit: 'g (1 medium)',
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fat: 0.4,
        fiber: 3.1,
        sugar: 14.4,
        category: 'Fruits',
        source: 'usda',
        verified: true,
      },
      {
        id: 'default_5',
        name: 'Egg (whole)',
        servingSize: 50,
        servingUnit: 'g (1 large)',
        calories: 72,
        protein: 6.3,
        carbs: 0.4,
        fat: 4.8,
        cholesterol: 186,
        category: 'Protein',
        source: 'usda',
        verified: true,
      },
      {
        id: 'default_6',
        name: 'Olive Oil',
        servingSize: 14,
        servingUnit: 'g (1 tbsp)',
        calories: 119,
        protein: 0,
        carbs: 0,
        fat: 13.5,
        saturatedFat: 1.9,
        category: 'Fats',
        source: 'usda',
        verified: true,
      },
      {
        id: 'default_7',
        name: 'Greek Yogurt (plain, non-fat)',
        servingSize: 170,
        servingUnit: 'g',
        calories: 100,
        protein: 17,
        carbs: 6,
        fat: 0.7,
        sugar: 6,
        category: 'Dairy',
        source: 'usda',
        verified: true,
      },
      {
        id: 'default_8',
        name: 'Almonds',
        servingSize: 28,
        servingUnit: 'g (1 oz)',
        calories: 164,
        protein: 6,
        carbs: 6,
        fat: 14,
        fiber: 3.5,
        category: 'Nuts',
        source: 'usda',
        verified: true,
      },
      {
        id: 'default_9',
        name: 'Oatmeal (dry)',
        servingSize: 40,
        servingUnit: 'g (1/2 cup)',
        calories: 150,
        protein: 5,
        carbs: 27,
        fat: 3,
        fiber: 4,
        category: 'Grains',
        source: 'usda',
        verified: true,
      },
      {
        id: 'default_10',
        name: 'Salmon (Atlantic)',
        servingSize: 100,
        servingUnit: 'g',
        calories: 208,
        protein: 20,
        carbs: 0,
        fat: 13,
        category: 'Protein',
        source: 'usda',
        verified: true,
      },
    ];

    for (const food of defaultFoods) {
      await this.addFood(food);
    }
  }

  // Search food items (local + API)
  async searchFoods(query: string, includeOnline: boolean = true): Promise<FoodItem[]> {
    const results: FoodItem[] = [];

    // Search local database first
    const localResults = await this.searchLocalFoods(query);
    results.push(...localResults);

    // Search online if enabled
    if (includeOnline && query.length > 2) {
      const apiResults = await this.searchFoodAPI(query);
      results.push(...apiResults);
    }

    // Remove duplicates and sort by relevance
    const uniqueResults = this.removeDuplicates(results);
    return this.sortByRelevance(uniqueResults, query);
  }

  // Search local database
  private async searchLocalFoods(query: string): Promise<FoodItem[]> {
    if (!this.localDb) return [];

    try {
      const result = await this.localDb.execAsync([
        {
          sql: `SELECT * FROM food_items WHERE name LIKE ? OR brand LIKE ? LIMIT 50`,
          args: [`%${query}%`, `%${query}%`],
        },
      ]);

      if (result[0].rows) {
        return result[0].rows.map(row => this.parseFoodItem(row));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to search local foods. Please try again.');

      console.error('Failed to search local foods:', error);
    }

    return [];
  }

  // Search using USDA API (free, no key required for basic access)
  private async searchFoodAPI(query: string): Promise<FoodItem[]> {
    try {
      // Using USDA FoodData Central API
      // Note: In production, you should get an API key from https://fdc.nal.usda.gov/api-key-signup.html
      const API_KEY = 'DEMO_KEY'; // Replace with your actual API key
      const url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&api_key=${API_KEY}&limit=20`;

      const response = await fetch(url);

      if (!response.ok) {
        // Fallback to mock data if API fails
        return this.getMockAPIResults(query);
      }

      const data = await response.json();
      return this.parseUSDAResults(data.foods || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to search food API. Please try again.');

      console.error('Failed to search food API:', error);
      // Return mock data as fallback
      return this.getMockAPIResults(query);
    }
  }

  // Parse USDA API results
  private parseUSDAResults(foods: any[]): FoodItem[] {
    return foods.map(food => {
      const nutrients = food.foodNutrients || [];

      const getNutrient = (id: number): number => {
        const nutrient = nutrients.find((n: any) => n.nutrientId === id);
        return nutrient ? nutrient.value : 0;
      };

      return {
        id: `usda_${food.fdcId}`,
        name: food.description || food.lowercaseDescription,
        brand: food.brandOwner,
        servingSize: 100,
        servingUnit: 'g',
        calories: getNutrient(1008), // Energy
        protein: getNutrient(1003), // Protein
        carbs: getNutrient(1005), // Carbs
        fat: getNutrient(1004), // Fat
        fiber: getNutrient(1079), // Fiber
        sugar: getNutrient(2000), // Sugar
        sodium: getNutrient(1093), // Sodium
        source: 'usda' as const,
        verified: true,
      };
    });
  }

  // Mock API results for testing
  private getMockAPIResults(query: string): FoodItem[] {
    const mockResults: FoodItem[] = [
      {
        id: `api_${Date.now()}_1`,
        name: `${query} (API Result 1)`,
        servingSize: 100,
        servingUnit: 'g',
        calories: 150,
        protein: 10,
        carbs: 20,
        fat: 5,
        source: 'api',
        verified: false,
      },
      {
        id: `api_${Date.now()}_2`,
        name: `${query} (API Result 2)`,
        brand: 'Generic Brand',
        servingSize: 100,
        servingUnit: 'g',
        calories: 200,
        protein: 15,
        carbs: 25,
        fat: 8,
        source: 'api',
        verified: false,
      },
    ];

    return mockResults;
  }

  // Scan barcode
  async scanBarcode(barcode: string): Promise<FoodItem | null> {
    // First check local database
    const localFood = await this.getFoodByBarcode(barcode);
    if (localFood) return localFood;

    // Try Open Food Facts API (free, no key required)
    try {
      const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (data.status === 1 && data.product) {
        const product = data.product;
        const nutrients = product.nutriments || {};

        const food: FoodItem = {
          id: `barcode_${barcode}`,
          name: product.product_name || 'Unknown Product',
          brand: product.brands,
          barcode: barcode,
          servingSize: 100,
          servingUnit: 'g',
          calories: nutrients['energy-kcal_100g'] || 0,
          protein: nutrients.proteins_100g || 0,
          carbs: nutrients.carbohydrates_100g || 0,
          fat: nutrients.fat_100g || 0,
          fiber: nutrients.fiber_100g,
          sugar: nutrients.sugars_100g,
          sodium: nutrients.sodium_100g,
          saturatedFat: nutrients['saturated-fat_100g'],
          imageUrl: product.image_url,
          source: 'barcode',
          verified: true,
        };

        // Save to local database
        await this.addFood(food);
        return food;
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to scan barcode. Please try again.');

      console.error('Failed to scan barcode:', error);
    }

    return null;
  }

  // Get food by barcode from local database
  private async getFoodByBarcode(barcode: string): Promise<FoodItem | null> {
    if (!this.localDb) return null;

    try {
      const result = await this.localDb.execAsync([
        {
          sql: `SELECT * FROM food_items WHERE barcode = ?`,
          args: [barcode],
        },
      ]);

      if (result[0].rows && result[0].rows.length > 0) {
        return this.parseFoodItem(result[0].rows[0]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get food by barcode. Please try again.');

      console.error('Failed to get food by barcode:', error);
    }

    return null;
  }

  // Add custom food
  async addFood(food: FoodItem): Promise<void> {
    await databaseService.create('foodItems', food, 'food_items');
    this.foodCache.set(food.id, food);
  }

  // Create recipe
  async createRecipe(recipe: Omit<Recipe, 'id' | 'createdAt'>): Promise<Recipe> {
    const newRecipe: Recipe = {
      ...recipe,
      id: `recipe_${Date.now()}`,
      createdAt: new Date(),
    };

    await databaseService.create('recipes', newRecipe, 'recipes');
    return newRecipe;
  }

  // Get user's recipes
  async getUserRecipes(userId: string): Promise<Recipe[]> {
    return await databaseService.list<Recipe>(
      'recipes',
      [{ field: 'userId', operator: '==', value: userId }],
      'recipes'
    );
  }

  // Calculate recipe nutrition
  calculateRecipeNutrition(ingredients: RecipeIngredient[], servings: number): {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    perServing: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  } {
    const totals = ingredients.reduce(
      (acc, ing) => ({
        calories: acc.calories + ing.calories,
        protein: acc.protein + ing.protein,
        carbs: acc.carbs + ing.carbs,
        fat: acc.fat + ing.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    return {
      ...totals,
      perServing: {
        calories: Math.round(totals.calories / servings),
        protein: Math.round(totals.protein / servings * 10) / 10,
        carbs: Math.round(totals.carbs / servings * 10) / 10,
        fat: Math.round(totals.fat / servings * 10) / 10,
      },
    };
  }

  // Get recent foods
  async getRecentFoods(userId: string, limit: number = 20): Promise<FoodItem[]> {
    const recentKey = `recent_foods_${userId}`;
    const recentIds = await AsyncStorage.getItem(recentKey);

    if (!recentIds) return [];

    const ids = JSON.parse(recentIds).slice(0, limit);
    const foods: FoodItem[] = [];

    for (const id of ids) {
      const cached = this.foodCache.get(id);
      if (cached) {
        foods.push(cached);
      } else {
        const food = await this.getFoodById(id);
        if (food) foods.push(food);
      }
    }

    return foods;
  }

  // Track recent food
  async trackRecentFood(userId: string, foodId: string): Promise<void> {
    const recentKey = `recent_foods_${userId}`;
    const existing = await AsyncStorage.getItem(recentKey);
    let recentIds: string[] = existing ? JSON.parse(existing) : [];

    // Remove if already exists and add to front
    recentIds = recentIds.filter(id => id !== foodId);
    recentIds.unshift(foodId);

    // Keep only last 50
    recentIds = recentIds.slice(0, 50);

    await AsyncStorage.setItem(recentKey, JSON.stringify(recentIds));
  }

  // Get food by ID
  private async getFoodById(id: string): Promise<FoodItem | null> {
    return await databaseService.read<FoodItem>('foodItems', id, 'food_items');
  }

  // Parse database row to FoodItem
  private parseFoodItem(row: any): FoodItem {
    return {
      id: row.id,
      name: row.name,
      brand: row.brand,
      barcode: row.barcode,
      servingSize: row.servingSize,
      servingUnit: row.servingUnit,
      calories: row.calories,
      protein: row.protein,
      carbs: row.carbs,
      fat: row.fat,
      fiber: row.fiber,
      sugar: row.sugar,
      sodium: row.sodium,
      cholesterol: row.cholesterol,
      saturatedFat: row.saturatedFat,
      transFat: row.transFat,
      category: row.category,
      imageUrl: row.imageUrl,
      verified: row.verified,
      source: row.source,
      userId: row.userId,
    };
  }

  // Remove duplicate foods
  private removeDuplicates(foods: FoodItem[]): FoodItem[] {
    const seen = new Set<string>();
    return foods.filter(food => {
      const key = `${food.name}_${food.brand || ''}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Sort by relevance
  private sortByRelevance(foods: FoodItem[], query: string): FoodItem[] {
    const queryLower = query.toLowerCase();

    return foods.sort((a, b) => {
      // Exact matches first
      const aExact = a.name.toLowerCase() === queryLower;
      const bExact = b.name.toLowerCase() === queryLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // Starts with query
      const aStarts = a.name.toLowerCase().startsWith(queryLower);
      const bStarts = b.name.toLowerCase().startsWith(queryLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Verified foods first
      if (a.verified && !b.verified) return -1;
      if (!a.verified && b.verified) return 1;

      // Alphabetical
      return a.name.localeCompare(b.name);
    });
  }
}

export const foodDatabaseService = new FoodDatabaseService();