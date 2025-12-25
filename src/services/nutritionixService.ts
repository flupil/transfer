import { FoodItem, FoodSource, NutritionPer100g, ServingSize, FoodSearchResult } from '../types/nutrition.types';
import { NUTRITIONIX_APP_ID, NUTRITIONIX_API_KEY } from '@env';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

// Get free API credentials at https://developer.nutritionix.com/
const NUTRITIONIX_API_BASE = 'https://trackapi.nutritionix.com/v2';

/**
 * Search for foods in Nutritionix database
 */
export const searchFoods = async (
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<FoodSearchResult> => {
  try {
    const appId = NUTRITIONIX_APP_ID || 'f7a8c1e0';
    const apiKey = NUTRITIONIX_API_KEY || '3eb38c7e134b318d734f1ebe4065c7d6';

    const response = await fetch(`${NUTRITIONIX_API_BASE}/search/instant?query=${encodeURIComponent(query)}`, {
      headers: {
        'x-app-id': appId,
        'x-app-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Nutritionix API error: ${response.status}`);
    }

    const data = await response.json();

    // Nutritionix returns common foods and branded foods separately
    const commonFoods = data.common || [];
    const brandedFoods = data.branded || [];

    // Prioritize common foods (whole foods) over branded
    const allFoods = [...commonFoods, ...brandedFoods];

    const items: FoodItem[] = await Promise.all(
      allFoods.slice(0, pageSize).map(async (food: any) => {
        if (food.food_name) {
          // Common food - need to get detailed nutrition
          return await getCommonFoodDetails(food.food_name, food.photo?.thumb);
        } else {
          // Branded food
          return parseBrandedFood(food);
        }
      })
    );

    // Filter out any null results
    const validItems = items.filter(item => item !== null) as FoodItem[];

    return {
      items: validItems,
      totalCount: allFoods.length,
      page: 1,
      pageSize: pageSize
    };
  } catch (error) {
    Alert.alert('Error', 'Failed to search food database. Please check your connection.');
    console.error('Error searching Nutritionix:', error);
    return {
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20
    };
  }
};

/**
 * Get detailed nutrition for a common food
 */
async function getCommonFoodDetails(foodName: string, imageUrl?: string): Promise<FoodItem | null> {
  try {
    const appId = NUTRITIONIX_APP_ID || 'f7a8c1e0';
    const apiKey = NUTRITIONIX_API_KEY || '3eb38c7e134b318d734f1ebe4065c7d6';

    const response = await fetch(`${NUTRITIONIX_API_BASE}/natural/nutrients`, {
      method: 'POST',
      headers: {
        'x-app-id': appId,
        'x-app-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: foodName
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const food = data.foods?.[0];

    if (!food) {
      return null;
    }

    return parseNutritionixFood(food, imageUrl);
  } catch (error) {
    Alert.alert('Error', 'Failed to get food details. Please try again.');
    console.error('Error getting common food details:', error);
    return null;
  }
}

/**
 * Parse Nutritionix food to our FoodItem format
 */
function parseNutritionixFood(food: any, thumbnailUrl?: string): FoodItem {
  // Nutritionix provides data per serving, we need to convert to per 100g
  const servingWeightGrams = food.serving_weight_grams || 100;
  const multiplier = 100 / servingWeightGrams;

  const nutritionPer100g: NutritionPer100g = {
    calories: (food.nf_calories || 0) * multiplier,
    protein: (food.nf_protein || 0) * multiplier,
    carbs: (food.nf_total_carbohydrate || 0) * multiplier,
    fat: (food.nf_total_fat || 0) * multiplier,
    fiber: food.nf_dietary_fiber ? food.nf_dietary_fiber * multiplier : undefined,
    sugar: food.nf_sugars ? food.nf_sugars * multiplier : undefined,
    saturatedFat: food.nf_saturated_fat ? food.nf_saturated_fat * multiplier : undefined,
    sodium: food.nf_sodium ? food.nf_sodium * multiplier : undefined
  };

  // Build serving sizes
  const servingSizes: ServingSize[] = [];

  // Add the original serving
  if (food.serving_qty && food.serving_unit) {
    servingSizes.push({
      amount: food.serving_qty,
      unit: food.serving_unit,
      label: `${food.serving_qty} ${food.serving_unit}`,
      gramsEquivalent: servingWeightGrams
    });
  }

  // Add 100g as standard
  servingSizes.push({
    amount: 100,
    unit: 'g',
    label: '100g',
    gramsEquivalent: 100
  });

  // Add alternative servings if available
  if (food.alt_measures) {
    food.alt_measures.forEach((alt: any) => {
      if (alt.serving_weight && alt.measure) {
        servingSizes.push({
          amount: alt.qty || 1,
          unit: alt.measure,
          label: `${alt.qty || 1} ${alt.measure}`,
          gramsEquivalent: alt.serving_weight
        });
      }
    });
  }

  return {
    id: `nutritionix_${food.food_name?.replace(/\s+/g, '_')}`,
    name: food.food_name || 'Unknown Food',
    brand: food.brand_name,
    imageUrl: food.photo?.highres || food.photo?.thumb || thumbnailUrl,
    thumbnailUrl: food.photo?.thumb || thumbnailUrl,
    nutritionPer100g,
    servingSizes,
    source: FoodSource.FOOD_DATA_CENTRAL, // We'll use this enum value
    category: food.tags?.food_group,
    ingredients: [],
    allergens: [],
    dietaryTags: food.tags?.item ? [food.tags.item] : []
  };
}

/**
 * Parse branded food (simpler data structure)
 */
function parseBrandedFood(food: any): FoodItem {
  // Branded foods already have per 100g data
  const servingWeightGrams = food.serving_weight_grams || 100;
  const multiplier = 100 / servingWeightGrams;

  const nutritionPer100g: NutritionPer100g = {
    calories: (food.nf_calories || 0) * multiplier,
    protein: (food.nf_protein || 0) * multiplier,
    carbs: (food.nf_total_carbohydrate || 0) * multiplier,
    fat: (food.nf_total_fat || 0) * multiplier,
    fiber: food.nf_dietary_fiber ? food.nf_dietary_fiber * multiplier : undefined,
    sugar: food.nf_sugars ? food.nf_sugars * multiplier : undefined,
    saturatedFat: food.nf_saturated_fat ? food.nf_saturated_fat * multiplier : undefined,
    sodium: food.nf_sodium ? food.nf_sodium * multiplier : undefined
  };

  const servingSizes: ServingSize[] = [
    {
      amount: food.serving_qty || 1,
      unit: food.serving_unit || 'serving',
      label: `${food.serving_qty || 1} ${food.serving_unit || 'serving'}`,
      gramsEquivalent: servingWeightGrams
    },
    {
      amount: 100,
      unit: 'g',
      label: '100g',
      gramsEquivalent: 100
    }
  ];

  return {
    id: `nutritionix_branded_${food.nix_item_id || food.food_name?.replace(/\s+/g, '_')}`,
    code: food.nix_item_id,
    name: food.food_name || food.brand_name_item_name || 'Unknown Food',
    brand: food.brand_name,
    imageUrl: food.photo?.thumb,
    thumbnailUrl: food.photo?.thumb,
    nutritionPer100g,
    servingSizes,
    source: FoodSource.FOOD_DATA_CENTRAL,
    category: undefined,
    ingredients: [],
    allergens: [],
    dietaryTags: []
  };
}
