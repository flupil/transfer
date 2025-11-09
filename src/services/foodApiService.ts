import AsyncStorage from '@react-native-async-storage/async-storage';
import { commonFoods, searchCommonFoods } from '../data/commonFoods';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  servingSize: string;
  servingUnit: string;
  imageUrl?: string;
  source: 'nutritionix' | 'usda' | 'openfoodfacts' | 'local';
}

interface NutritionixConfig {
  appId: string;
  apiKey: string;
}

class FoodApiService {
  private nutritionixConfig: NutritionixConfig | null = null;
  private usdaApiKey: string | null = null;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheExpiry = 1000 * 60 * 60 * 24; // 24 hours

  constructor() {
    this.loadApiKeys();
  }

  private async loadApiKeys() {
    try {
      // In production, these should come from environment variables
      this.nutritionixConfig = {
        appId: process.env.NUTRITIONIX_APP_ID || 'demo_app_id',
        apiKey: process.env.NUTRITIONIX_API_KEY || 'demo_api_key',
      };
      this.usdaApiKey = process.env.USDA_API_KEY || 'demo_usda_key';
    } catch (error) {
      Alert.alert('Error', 'Failed to load API keys. Please try again.');

      console.error('Failed to load API keys:', error);
    }
  }

  private getCacheKey(method: string, query: string): string {
    return `${method}:${query}`;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Search for food items across multiple APIs
  async searchFood(query: string): Promise<FoodItem[]> {
    const cacheKey = this.getCacheKey('search', query);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // First, search common whole foods
    const commonResults = searchCommonFoods(query);

    // Then search APIs for packaged/branded items
    const apiResults: FoodItem[] = [];

    // Only search APIs if we need more results
    if (commonResults.length < 10) {
      // Try multiple APIs in parallel
      const promises = [
        this.searchOpenFoodFacts(query).catch(err => {
          console.error('OpenFoodFacts search failed:', err);
          return [];
        }),
        // Only use Nutritionix and USDA if configured
        this.searchNutritionix(query).catch(err => {
          console.error('Nutritionix search failed:', err);
          return [];
        }),
        this.searchUSDA(query).catch(err => {
          console.error('USDA search failed:', err);
          return [];
        }),
      ];

      const allApiResults = await Promise.all(promises);
      allApiResults.forEach(results => apiResults.push(...results));
    }

    // Combine results with common foods first
    const allResults = [...commonResults, ...apiResults];

    // Remove duplicates based on name and brand
    const uniqueResults = allResults.filter((item, index, self) =>
      index === self.findIndex((t) => t.name === item.name && t.brand === item.brand)
    );

    // Limit to reasonable number of results
    const limitedResults = uniqueResults.slice(0, 50);

    this.setCache(cacheKey, limitedResults);
    return limitedResults;
  }

  // Search Nutritionix API
  private async searchNutritionix(query: string): Promise<FoodItem[]> {
    if (!this.nutritionixConfig ||
        this.nutritionixConfig.appId === 'demo_app_id') {
      return [];
    }

    try {
      const response = await fetch(
        `https://trackapi.nutritionix.com/v2/search/instant?query=${encodeURIComponent(query)}`,
        {
          headers: {
            'x-app-id': this.nutritionixConfig.appId,
            'x-app-key': this.nutritionixConfig.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Nutritionix API error');

      const data = await response.json();
      const items: FoodItem[] = [];

      // Process common foods
      if (data.common) {
        for (const food of data.common.slice(0, 5)) {
          const details = await this.getNutritionixDetails(food.food_name);
          if (details) items.push(details);
        }
      }

      // Process branded foods
      if (data.branded) {
        data.branded.slice(0, 5).forEach((food: any) => {
          items.push({
            id: `nutritionix_${food.nix_item_id}`,
            name: food.food_name,
            brand: food.brand_name,
            calories: food.nf_calories || 0,
            protein: food.nf_protein || 0,
            carbs: food.nf_total_carbohydrate || 0,
            fat: food.nf_total_fat || 0,
            fiber: food.nf_dietary_fiber,
            sugar: food.nf_sugars,
            sodium: food.nf_sodium,
            servingSize: food.serving_qty?.toString() || '1',
            servingUnit: food.serving_unit || 'serving',
            imageUrl: food.photo?.thumb,
            source: 'nutritionix',
          });
        });
      }

      return items;
    } catch (error) {
      Alert.alert('Error', 'Nutritionix search error. Please try again.');

      console.error('Nutritionix search error:', error);
      return [];
    }
  }

  // Get detailed nutrition from Nutritionix
  private async getNutritionixDetails(foodName: string): Promise<FoodItem | null> {
    if (!this.nutritionixConfig ||
        this.nutritionixConfig.appId === 'demo_app_id') {
      return null;
    }

    try {
      const response = await fetch(
        'https://trackapi.nutritionix.com/v2/natural/nutrients',
        {
          method: 'POST',
          headers: {
            'x-app-id': this.nutritionixConfig.appId,
            'x-app-key': this.nutritionixConfig.apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: foodName }),
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      const food = data.foods?.[0];
      if (!food) return null;

      return {
        id: `nutritionix_${food.food_name}`,
        name: food.food_name,
        brand: food.brand_name,
        calories: food.nf_calories || 0,
        protein: food.nf_protein || 0,
        carbs: food.nf_total_carbohydrate || 0,
        fat: food.nf_total_fat || 0,
        fiber: food.nf_dietary_fiber,
        sugar: food.nf_sugars,
        sodium: food.nf_sodium,
        servingSize: food.serving_qty?.toString() || '1',
        servingUnit: food.serving_unit || 'serving',
        imageUrl: food.photo?.thumb,
        source: 'nutritionix',
      };
    } catch (error) {
      Alert.alert('Error', 'Nutritionix details error. Please try again.');

      console.error('Nutritionix details error:', error);
      return null;
    }
  }

  // Search USDA FoodData Central
  private async searchUSDA(query: string): Promise<FoodItem[]> {
    if (!this.usdaApiKey || this.usdaApiKey === 'demo_usda_key') {
      return [];
    }

    try {
      const response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${this.usdaApiKey}&query=${encodeURIComponent(query)}&limit=10`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('USDA API error');

      const data = await response.json();
      const items: FoodItem[] = [];

      for (const food of data.foods || []) {
        const nutrients = food.foodNutrients || [];

        const findNutrient = (id: number) => {
          const nutrient = nutrients.find((n: any) => n.nutrientId === id);
          return nutrient?.value || 0;
        };

        items.push({
          id: `usda_${food.fdcId}`,
          name: food.description || food.lowercaseDescription,
          brand: food.brandName || food.brandOwner,
          calories: findNutrient(1008), // Energy
          protein: findNutrient(1003), // Protein
          carbs: findNutrient(1005), // Carbohydrate
          fat: findNutrient(1004), // Total fat
          fiber: findNutrient(1079), // Fiber
          sugar: findNutrient(2000), // Sugars
          sodium: findNutrient(1093), // Sodium
          servingSize: '100',
          servingUnit: 'g',
          source: 'usda',
        });
      }

      return items;
    } catch (error) {
      Alert.alert('Error', 'USDA search error. Please try again.');

      console.error('USDA search error:', error);
      return [];
    }
  }

  // Search Open Food Facts (free, no API key needed)
  private async searchOpenFoodFacts(query: string): Promise<FoodItem[]> {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10`,
        {
          headers: {
            'User-Agent': 'FitGym App - Android/iOS - Version 1.0',
          },
        }
      );

      if (!response.ok) throw new Error('OpenFoodFacts API error');

      const data = await response.json();
      const items: FoodItem[] = [];

      for (const product of data.products || []) {
        const nutrients = product.nutriments || {};

        items.push({
          id: `off_${product.code}`,
          name: product.product_name || product.generic_name || 'Unknown',
          brand: product.brands,
          barcode: product.code,
          calories: nutrients['energy-kcal_100g'] || nutrients.energy_100g || 0,
          protein: nutrients.proteins_100g || 0,
          carbs: nutrients.carbohydrates_100g || 0,
          fat: nutrients.fat_100g || 0,
          fiber: nutrients.fiber_100g,
          sugar: nutrients.sugars_100g,
          sodium: nutrients.sodium_100g ? nutrients.sodium_100g * 1000 : undefined, // Convert to mg
          servingSize: '100',
          servingUnit: 'g',
          imageUrl: product.image_url || product.image_front_url,
          source: 'openfoodfacts',
        });
      }

      return items;
    } catch (error) {
      Alert.alert('Error', 'OpenFoodFacts search error. Please try again.');

      console.error('OpenFoodFacts search error:', error);
      return [];
    }
  }

  // Get food by barcode
  async getFoodByBarcode(barcode: string): Promise<FoodItem | null> {
    const cacheKey = this.getCacheKey('barcode', barcode);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Try Open Food Facts first (best for barcodes)
    const offResult = await this.getOpenFoodFactsBarcode(barcode);
    if (offResult) {
      this.setCache(cacheKey, offResult);
      return offResult;
    }

    // Fallback to Nutritionix
    const nutritionixResult = await this.getNutritionixBarcode(barcode);
    if (nutritionixResult) {
      this.setCache(cacheKey, nutritionixResult);
      return nutritionixResult;
    }

    return null;
  }

  // Get barcode from Open Food Facts
  private async getOpenFoodFactsBarcode(barcode: string): Promise<FoodItem | null> {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
        {
          headers: {
            'User-Agent': 'FitGym App - Android/iOS - Version 1.0',
          },
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      const product = data.product;

      if (!product || data.status !== 1) return null;

      const nutrients = product.nutriments || {};

      return {
        id: `off_${product.code}`,
        name: product.product_name || product.generic_name || 'Unknown',
        brand: product.brands,
        barcode: product.code,
        calories: nutrients['energy-kcal_100g'] || nutrients.energy_100g || 0,
        protein: nutrients.proteins_100g || 0,
        carbs: nutrients.carbohydrates_100g || 0,
        fat: nutrients.fat_100g || 0,
        fiber: nutrients.fiber_100g,
        sugar: nutrients.sugars_100g,
        sodium: nutrients.sodium_100g ? nutrients.sodium_100g * 1000 : undefined,
        servingSize: product.serving_size || '100',
        servingUnit: 'g',
        imageUrl: product.image_url || product.image_front_url,
        source: 'openfoodfacts',
      };
    } catch (error) {
      Alert.alert('Error', 'OpenFoodFacts barcode error. Please try again.');

      console.error('OpenFoodFacts barcode error:', error);
      return null;
    }
  }

  // Get barcode from Nutritionix
  private async getNutritionixBarcode(barcode: string): Promise<FoodItem | null> {
    if (!this.nutritionixConfig ||
        this.nutritionixConfig.appId === 'demo_app_id') {
      return null;
    }

    try {
      const response = await fetch(
        `https://trackapi.nutritionix.com/v2/search/item?upc=${barcode}`,
        {
          headers: {
            'x-app-id': this.nutritionixConfig.appId,
            'x-app-key': this.nutritionixConfig.apiKey,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      const food = data.foods?.[0];

      if (!food) return null;

      return {
        id: `nutritionix_${food.nix_item_id}`,
        name: food.food_name,
        brand: food.brand_name,
        barcode: barcode,
        calories: food.nf_calories || 0,
        protein: food.nf_protein || 0,
        carbs: food.nf_total_carbohydrate || 0,
        fat: food.nf_total_fat || 0,
        fiber: food.nf_dietary_fiber,
        sugar: food.nf_sugars,
        sodium: food.nf_sodium,
        servingSize: food.serving_qty?.toString() || '1',
        servingUnit: food.serving_unit || 'serving',
        imageUrl: food.photo?.thumb,
        source: 'nutritionix',
      };
    } catch (error) {
      Alert.alert('Error', 'Nutritionix barcode error. Please try again.');

      console.error('Nutritionix barcode error:', error);
      return null;
    }
  }

  // Save custom food to local database
  async saveCustomFood(food: Omit<FoodItem, 'id' | 'source'>): Promise<FoodItem> {
    const customFood: FoodItem = {
      ...food,
      id: `local_${Date.now()}`,
      source: 'local',
    };

    try {
      const storedFoods = await AsyncStorage.getItem('customFoods');
      const foods = storedFoods ? JSON.parse(storedFoods) : [];
      foods.push(customFood);
      await AsyncStorage.setItem('customFoods', JSON.stringify(foods));

      return customFood;
    } catch (error) {
      Alert.alert('Error', 'Failed to save custom food. Please try again.');

      console.error('Failed to save custom food:', error);
      throw error;
    }
  }

  // Get custom foods from local storage
  async getCustomFoods(): Promise<FoodItem[]> {
    try {
      const storedFoods = await AsyncStorage.getItem('customFoods');
      return storedFoods ? JSON.parse(storedFoods) : [];
    } catch (error) {
      Alert.alert('Error', 'Failed to get custom foods. Please try again.');

      console.error('Failed to get custom foods:', error);
      return [];
    }
  }
}

export const foodApiService = new FoodApiService();