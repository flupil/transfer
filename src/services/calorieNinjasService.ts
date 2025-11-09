import { FoodItem, FoodSource, NutritionPer100g, ServingSize, FoodSearchResult } from '../types/nutrition.types';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

const CALORIE_NINJAS_API_KEY = 'YOUR_API_KEY'; // Get free key from https://calorieninjas.com/api
const CALORIE_NINJAS_API_BASE = 'https://api.calorieninjas.com/v1/nutrition';

/**
 * Search for foods using CalorieNinjas API
 */
export const searchFoods = async (
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<FoodSearchResult> => {
  try {
    // CalorieNinjas works best with natural language queries
    const response = await fetch(`${CALORIE_NINJAS_API_BASE}?query=${encodeURIComponent(query)}`, {
      headers: {
        'X-Api-Key': CALORIE_NINJAS_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`CalorieNinjas API error: ${response.status}`);
    }

    const data = await response.json();

    const items: FoodItem[] = (data.items || [])
      .map((item: any) => parseCalorieNinjasFood(item))
      .filter((item: FoodItem | null) => item !== null) as FoodItem[];

    return {
      items,
      totalCount: items.length,
      page: 1,
      pageSize: pageSize
    };
  } catch (error) {
    Alert.alert('Error', 'Searching CalorieNinjas. Please try again.');

    console.error('Error searching CalorieNinjas:', error);
    return {
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20
    };
  }
};

/**
 * Parse CalorieNinjas food to our FoodItem format
 */
function parseCalorieNinjasFood(item: any): FoodItem | null {
  if (!item || !item.name) {
    return null;
  }

  // CalorieNinjas provides nutrition per serving, convert to per 100g
  const servingGrams = item.serving_size_g || 100;
  const multiplier = 100 / servingGrams;

  const nutritionPer100g: NutritionPer100g = {
    calories: (item.calories || 0) * multiplier,
    protein: (item.protein_g || 0) * multiplier,
    carbs: (item.carbohydrates_total_g || 0) * multiplier,
    fat: (item.fat_total_g || 0) * multiplier,
    fiber: item.fiber_g ? item.fiber_g * multiplier : undefined,
    sugar: item.sugar_g ? item.sugar_g * multiplier : undefined,
    saturatedFat: item.fat_saturated_g ? item.fat_saturated_g * multiplier : undefined,
    sodium: item.sodium_mg ? item.sodium_mg * multiplier : undefined
  };

  // Build serving sizes
  const servingSizes: ServingSize[] = [
    {
      amount: 100,
      unit: 'g',
      label: '100g',
      gramsEquivalent: 100
    },
    {
      amount: servingGrams,
      unit: 'g',
      label: `${servingGrams}g serving`,
      gramsEquivalent: servingGrams
    }
  ];

  return {
    id: `calorieninjas_${item.name.replace(/\s+/g, '_')}`,
    name: item.name || 'Unknown Food',
    imageUrl: undefined, // CalorieNinjas doesn't provide images
    thumbnailUrl: undefined,
    nutritionPer100g,
    servingSizes,
    source: FoodSource.FOOD_DATA_CENTRAL,
    category: undefined,
    ingredients: [],
    allergens: [],
    dietaryTags: []
  };
}
