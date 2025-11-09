import { FoodItem, FoodSource, NutritionPer100g, ServingSize, FoodSearchResult } from '../types/nutrition.types';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

// Free API credentials from https://developer.edamam.com/food-database-api
const EDAMAM_APP_ID = 'e5b6f1e5';
const EDAMAM_APP_KEY = '4c9b0f4e6f8e3c2c9a9f5e3d4c9b0f4e';
const EDAMAM_API_BASE = 'https://api.edamam.com/api/food-database/v2';

/**
 * Search for foods in Edamam database
 */
export const searchFoods = async (
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<FoodSearchResult> => {
  try {
    const params = new URLSearchParams({
      app_id: EDAMAM_APP_ID,
      app_key: EDAMAM_APP_KEY,
      ingr: query,
      'nutrition-type': 'cooking'
    });

    const response = await fetch(`${EDAMAM_API_BASE}/parser?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Edamam API error: ${response.status}`);
    }

    const data = await response.json();

    const items: FoodItem[] = (data.hints || [])
      .slice(0, pageSize)
      .map((hint: any) => parseEdamamFood(hint.food, hint.measures))
      .filter((item: FoodItem | null) => item !== null) as FoodItem[];

    return {
      items,
      totalCount: data.hints?.length || 0,
      page: 1,
      pageSize: pageSize
    };
  } catch (error) {
    Alert.alert('Error', 'Searching Edamam. Please try again.');

    console.error('Error searching Edamam:', error);
    return {
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20
    };
  }
};

/**
 * Parse Edamam food to our FoodItem format
 */
function parseEdamamFood(food: any, measures: any[]): FoodItem | null {
  if (!food || !food.nutrients) {
    return null;
  }

  // Edamam provides nutrition per 100g
  const nutritionPer100g: NutritionPer100g = {
    calories: food.nutrients.ENERC_KCAL || 0,
    protein: food.nutrients.PROCNT || 0,
    carbs: food.nutrients.CHOCDF || 0,
    fat: food.nutrients.FAT || 0,
    fiber: food.nutrients.FIBTG,
    sugar: food.nutrients.SUGAR,
    saturatedFat: food.nutrients.FASAT,
    sodium: food.nutrients.NA
  };

  // Build serving sizes from measures
  const servingSizes: ServingSize[] = [];

  // Add 100g as default
  servingSizes.push({
    amount: 100,
    unit: 'g',
    label: '100g',
    gramsEquivalent: 100
  });

  // Add common measures
  if (measures && measures.length > 0) {
    measures.forEach((measure: any) => {
      if (measure.label && measure.weight) {
        servingSizes.push({
          amount: 1,
          unit: measure.label,
          label: `1 ${measure.label}`,
          gramsEquivalent: measure.weight
        });
      }
    });
  }

  return {
    id: `edamam_${food.foodId}`,
    code: food.foodId,
    name: food.label || 'Unknown Food',
    brand: food.brand,
    imageUrl: food.image,
    thumbnailUrl: food.image,
    nutritionPer100g,
    servingSizes,
    source: FoodSource.FOOD_DATA_CENTRAL,
    category: food.category,
    ingredients: [],
    allergens: [],
    dietaryTags: []
  };
}
