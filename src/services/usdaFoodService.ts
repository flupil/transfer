import { FoodItem, FoodSource, NutritionPer100g, ServingSize, FoodSearchResult } from '../types/nutrition.types';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

const USDA_API_KEY = 'DEMO_KEY'; // You can get a free API key at https://fdc.nal.usda.gov/api-key-signup.html
const USDA_API_BASE = 'https://api.nal.usda.gov/fdc/v1';

/**
 * Search for foods in USDA FoodData Central database
 */
export const searchFoods = async (
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<FoodSearchResult> => {
  try {
    const params = new URLSearchParams({
      query: query,
      pageSize: '50',
      pageNumber: page.toString(),
      dataType: 'Foundation,SR Legacy', // Foundation = whole foods, SR Legacy = standard reference
      api_key: USDA_API_KEY
    });

    const response = await fetch(`${USDA_API_BASE}/foods/search?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status}`);
    }

    const data = await response.json();

    console.log('USDA API response:', {
      foodsCount: data.foods?.length || 0,
      totalHits: data.totalHits || 0
    });

    const items: FoodItem[] = (data.foods || [])
      .filter((food: any) => {
        // Only include foods with complete nutrition data
        return food.foodNutrients && food.foodNutrients.length > 0;
      })
      .map((food: any) => parseUSDAFood(food))
      .slice(0, pageSize);

    return {
      items,
      totalCount: data.totalHits || 0,
      page: page,
      pageSize: pageSize
    };
  } catch (error) {
    Alert.alert('Error', 'Searching USDA FoodData Central. Please try again.');

    console.error('Error searching USDA FoodData Central:', error);
    return {
      items: [],
      totalCount: 0,
      page: 1,
      pageSize: 20
    };
  }
};

/**
 * Get food by FDC ID
 */
export const getFoodById = async (fdcId: string): Promise<FoodItem | null> => {
  try {
    const response = await fetch(`${USDA_API_BASE}/food/${fdcId}?api_key=${USDA_API_KEY}`);

    if (!response.ok) {
      throw new Error(`USDA API error: ${response.status}`);
    }

    const data = await response.json();
    return parseUSDAFood(data);
  } catch (error) {
    Alert.alert('Error', 'Fetching USDA food by ID. Please try again.');

    console.error('Error fetching USDA food by ID:', error);
    return null;
  }
};

/**
 * Parse USDA food to our FoodItem format
 */
function parseUSDAFood(food: any): FoodItem {
  // Extract nutrients from foodNutrients array
  const getNutrient = (nutrientName: string): number => {
    const nutrient = food.foodNutrients?.find((n: any) =>
      n.nutrientName?.toLowerCase().includes(nutrientName.toLowerCase())
    );
    return nutrient?.value || 0;
  };

  // USDA provides data per 100g by default
  const nutritionPer100g: NutritionPer100g = {
    calories: getNutrient('Energy') || getNutrient('Calories'),
    protein: getNutrient('Protein'),
    carbs: getNutrient('Carbohydrate'),
    fat: getNutrient('Total lipid') || getNutrient('Fat'),
    fiber: getNutrient('Fiber'),
    sugar: getNutrient('Sugars'),
    saturatedFat: getNutrient('Fatty acids, total saturated'),
    sodium: getNutrient('Sodium')
  };

  // Default serving sizes
  const servingSizes: ServingSize[] = [
    {
      amount: 100,
      unit: 'g',
      label: '100g',
      gramsEquivalent: 100
    }
  ];

  // Add common serving sizes based on food type
  const foodName = (food.description || '').toLowerCase();

  // Fruits - typically 1 medium fruit
  if (foodName.includes('apple') || foodName.includes('orange') || foodName.includes('banana')) {
    servingSizes.push({
      amount: 1,
      unit: 'medium',
      label: '1 medium',
      gramsEquivalent: 150
    });
  }

  // Add 1 cup for many foods
  servingSizes.push({
    amount: 1,
    unit: 'cup',
    label: '1 cup',
    gramsEquivalent: 150
  });

  return {
    id: `usda_${food.fdcId}`,
    code: food.fdcId?.toString(),
    name: food.description || 'Unknown Food',
    brand: food.brandOwner,
    imageUrl: undefined, // USDA doesn't provide images
    thumbnailUrl: undefined,
    nutritionPer100g,
    servingSizes,
    source: FoodSource.FOOD_DATA_CENTRAL,
    category: food.foodCategory,
    ingredients: food.ingredients ? [food.ingredients] : [],
    allergens: [],
    dietaryTags: []
  };
}
