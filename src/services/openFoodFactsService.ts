import { FoodItem, FoodSource, NutritionPer100g, ServingSize, FoodSearchResult } from '../types/nutrition.types';
import { searchCommonFoods, commonFoods as localCommonFoods } from '../data/commonFoods';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

const OFF_API_BASE = 'https://world.openfoodfacts.org/api/v2';
const OFF_SEARCH_BASE = 'https://world.openfoodfacts.org/cgi/search.pl';

// User agent for API requests (required by Open Food Facts)
const USER_AGENT = 'FitnessApp/1.0 (React Native)';

/**
 * Search for foods in Open Food Facts database
 */
export const searchFoods = async (
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<FoodSearchResult> => {
  // First, search local common foods (declare outside try-catch for error handling)
  const rawLocalResults = searchCommonFoods(query);
  const convertedLocalResults: FoodItem[] = rawLocalResults.map((food: any) => ({
      id: food.id,
      name: food.name,
      brand: food.brand,
      imageUrl: food.emoji ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="50" font-size="60" text-anchor="middle" dominant-baseline="middle">${food.emoji}</text></svg>`)}` : undefined,
      thumbnailUrl: food.emoji ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text x="50" y="50" font-size="60" text-anchor="middle" dominant-baseline="middle">${food.emoji}</text></svg>`)}` : undefined,
      nutritionPer100g: {
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber,
        sugar: food.sugar
      },
      servingSizes: [{
        amount: Number(food.servingSize),
        unit: food.servingUnit,
        label: food.servingUnit,
        gramsEquivalent: Number(food.servingSize)
      }],
      source: FoodSource.CUSTOM,
      category: food.category,
      ingredients: [],
      allergens: [],
      dietaryTags: []
    }));

  try {
    console.log(`🔍 Found ${convertedLocalResults.length} local results for "${query}"`);

    // If we have enough local results, return them
    if (convertedLocalResults.length >= pageSize) {
      console.log('✅ Returning local results only (enough to fill page)');
      return {
        items: convertedLocalResults.slice(0, pageSize),
        totalCount: convertedLocalResults.length,
        page: 1,
        pageSize: pageSize
      };
    }

    console.log('🌐 Fetching from Open Food Facts API...');
    const apiStartTime = Date.now();

    const params = new URLSearchParams({
      search_terms: query,
      search_simple: '1',
      action: 'process',
      json: '1',
      page: page.toString(),
      page_size: '50', // Reduced from 100 to 50 for faster response
      fields: 'code,product_name,brands,image_url,image_small_url,nutriments,serving_size,serving_quantity,categories,allergens,ingredients_text,ingredients_tags'
    });

    // Add 5 second timeout to prevent infinite loading (reduced from 10)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${OFF_SEARCH_BASE}?${params.toString()}`, {
      headers: {
        'User-Agent': USER_AGENT
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const apiDuration = Date.now() - apiStartTime;
    console.log(`✅ API responded in ${apiDuration}ms`);

    if (!response.ok) {
      throw new Error(`Open Food Facts API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`📦 Received ${data.products?.length || 0} products from API`);

    // Helper function to score products (simpler = higher score)
    const scoreProduct = (product: any): number => {
      let score = 0;
      const name = (product.product_name || '').toLowerCase();
      const searchTerm = query.toLowerCase();

      // Exact match gets highest priority
      if (name === searchTerm) score += 500;

      // Single word match (e.g., "apple" matches "apple" but not "apple juice")
      const nameWords = name.split(/[\s,]+/);
      if (nameWords.length === 1 && nameWords[0] === searchTerm) score += 400;

      // Name starts with search term followed by space
      if (name.startsWith(searchTerm + ' ')) score += 100;
      else if (name.startsWith(searchTerm)) score += 80;

      // Shorter names (usually simpler foods)
      const wordCount = nameWords.length;
      if (wordCount === 1) score += 150;
      else if (wordCount === 2) score += 50;
      else if (wordCount === 3) score += 10;
      else score -= (wordCount * 10);

      // HEAVILY penalize processed foods
      const processedKeywords = [
        'juice', 'cider', 'vinegar', 'sauce', 'drink', 'beverage',
        'ready', 'instant', 'frozen', 'canned', 'bottled',
        'box', 'pack', 'prepared', 'cooked', 'fried',
        'bar', 'snack', 'crisp', 'chip', 'cookie', 'candy',
        'flavored', 'sweetened', 'concentrate', 'extract',
        'powder', 'mix', 'blend', 'syrup', 'jam', 'spread',
        'dressing', 'smoothie', 'shake', 'puree'
      ];

      for (const keyword of processedKeywords) {
        if (name.includes(keyword)) score -= 300;
      }

      // Penalize branded foods
      if (product.brands && product.brands.length > 0) score -= 50;

      // Boost raw/fresh/whole foods
      if (name.includes('raw')) score += 100;
      if (name.includes('fresh')) score += 100;
      if (name.includes('whole')) score += 80;

      // Fewer ingredients = simpler food
      const ingredientCount = product.ingredients_tags?.length || 0;
      if (ingredientCount === 0 || ingredientCount === 1) score += 100;
      else if (ingredientCount <= 3) score += 40;
      else score -= Math.min(100, ingredientCount * 5);

      return score;
    };

    const apiItems: FoodItem[] = (data.products || [])
      .filter((product: any) => {
        return product.nutriments && product.product_name;
      })
      .map((product: any) => ({
        ...parseOpenFoodFactsProduct(product),
        _score: scoreProduct(product)
      }))
      .filter((item: any) => item._score > 0) // Only show items with positive scores
      .sort((a: any, b: any) => b._score - a._score)
      .slice(0, pageSize - convertedLocalResults.length)
      .map(({ _score, ...item }: any) => item);

    // Combine local results (first) with API results
    const combinedItems = [...convertedLocalResults, ...apiItems].slice(0, pageSize);

    return {
      items: combinedItems,
      totalCount: convertedLocalResults.length + (data.count || 0),
      page: data.page || 1,
      pageSize: pageSize
    };
  } catch (error: any) {
    // Handle abort errors more gracefully
    if (error.name === 'AbortError') {
      console.log('⏱️ API request timed out after 5 seconds, returning local results only');
      // Don't show alert for timeout, just return local results
      return {
        items: convertedLocalResults,
        totalCount: convertedLocalResults.length,
        page: 1,
        pageSize: pageSize
      };
    }

    console.error('❌ Error searching Open Food Facts:', error);

    // Return local results if available, otherwise empty
    return {
      items: convertedLocalResults.length > 0 ? convertedLocalResults : [],
      totalCount: convertedLocalResults.length,
      page: 1,
      pageSize: pageSize
    };
  }
};

/**
 * Get product by barcode
 */
export const getProductByBarcode = async (barcode: string): Promise<FoodItem | null> => {
  try {
    // Add 10 second timeout to prevent infinite loading
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${OFF_API_BASE}/product/${barcode}.json`, {
      headers: {
        'User-Agent': USER_AGENT
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open Food Facts API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 0 || !data.product) {
      return null; // Product not found
    }

    return parseOpenFoodFactsProduct(data.product);
  } catch (error) {
    Alert.alert('Error', 'Fetching product by barcode. Please try again.');

    console.error('Error fetching product by barcode:', error);
    return null;
  }
};

/**
 * Parse Open Food Facts product to our FoodItem format
 */
function parseOpenFoodFactsProduct(product: any): FoodItem {
  const nutriments = product.nutriments || {};

  // Extract nutrition per 100g
  const nutritionPer100g: NutritionPer100g = {
    calories: nutriments['energy-kcal_100g'] || nutriments.energy_100g / 4.184 || 0,
    protein: nutriments.proteins_100g || 0,
    carbs: nutriments.carbohydrates_100g || 0,
    fat: nutriments.fat_100g || 0,
    fiber: nutriments.fiber_100g,
    sugar: nutriments.sugars_100g,
    saturatedFat: nutriments['saturated-fat_100g'],
    sodium: nutriments.sodium_100g ? nutriments.sodium_100g * 1000 : undefined // Convert g to mg
  };

  // Parse serving sizes
  const servingSizes: ServingSize[] = [];

  // Add 100g as default
  servingSizes.push({
    amount: 100,
    unit: 'g',
    label: '100g',
    gramsEquivalent: 100
  });

  // Add common serving sizes based on food name
  const foodName = (product.product_name || '').toLowerCase();
  const commonServings: { [key: string]: { label: string, grams: number }[] } = {
    'apple': [
      { label: '1 small apple', grams: 150 },
      { label: '1 medium apple', grams: 182 },
      { label: '1 large apple', grams: 223 }
    ],
    'banana': [
      { label: '1 small banana', grams: 101 },
      { label: '1 medium banana', grams: 118 },
      { label: '1 large banana', grams: 136 }
    ],
    'orange': [
      { label: '1 small orange', grams: 96 },
      { label: '1 medium orange', grams: 131 },
      { label: '1 large orange', grams: 184 }
    ],
    'egg': [
      { label: '1 large egg', grams: 50 },
      { label: '1 medium egg', grams: 44 }
    ]
  };

  // Check if food matches common servings
  for (const [food, servings] of Object.entries(commonServings)) {
    if (foodName.includes(food)) {
      servings.forEach(serving => {
        servingSizes.push({
          amount: 1,
          unit: serving.label,
          label: serving.label,
          gramsEquivalent: serving.grams
        });
      });
      break;
    }
  }

  // Add product serving size if available
  if (product.serving_quantity && product.serving_size) {
    const servingAmount = parseFloat(product.serving_quantity);
    const servingUnit = extractUnit(product.serving_size);

    if (!isNaN(servingAmount)) {
      servingSizes.push({
        amount: servingAmount,
        unit: servingUnit || 'g',
        label: product.serving_size,
        gramsEquivalent: servingUnit === 'g' || servingUnit === 'ml' ? servingAmount : undefined
      });
    }
  }

  // Extract allergens
  const allergens: string[] = [];
  if (product.allergens_tags) {
    allergens.push(
      ...product.allergens_tags.map((tag: string) =>
        tag.replace('en:', '').replace(/-/g, ' ')
      )
    );
  }

  // Extract dietary tags
  const dietaryTags: string[] = [];
  if (product.categories_tags) {
    const categories = product.categories_tags;
    if (categories.includes('en:vegetarian')) dietaryTags.push('vegetarian');
    if (categories.includes('en:vegan')) dietaryTags.push('vegan');
    if (categories.includes('en:gluten-free')) dietaryTags.push('gluten-free');
    if (categories.includes('en:organic')) dietaryTags.push('organic');
  }

  // Extract ingredients
  const ingredients: string[] = [];
  if (product.ingredients_text) {
    // Simple split - could be improved with better parsing
    ingredients.push(
      ...product.ingredients_text
        .split(',')
        .map((ing: string) => ing.trim())
        .filter(Boolean)
    );
  }

  return {
    id: `off_${product.code}`,
    code: product.code,
    name: product.product_name || 'Unknown Product',
    brand: product.brands,
    imageUrl: product.image_url,
    thumbnailUrl: product.image_small_url || product.image_thumb_url,
    nutritionPer100g,
    servingSizes,
    source: FoodSource.OPEN_FOOD_FACTS,
    category: product.categories,
    ingredients,
    allergens,
    dietaryTags
  };
}

/**
 * Extract unit from serving size string (e.g., "150g" -> "g")
 */
function extractUnit(servingSize: string): string | undefined {
  const match = servingSize.match(/\d+\s*([a-zA-Z]+)/);
  return match ? match[1].toLowerCase() : undefined;
}

/**
 * Get popular foods (top searched items)
 */
export const getPopularFoods = async (pageSize: number = 20): Promise<FoodItem[]> => {
  try {
    const params = new URLSearchParams({
      sort_by: 'unique_scans_n',
      page_size: pageSize.toString(),
      json: '1',
      fields: 'code,product_name,brands,image_url,image_small_url,nutriments,serving_size,serving_quantity,categories,allergens'
    });

    // Add 10 second timeout to prevent infinite loading
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${OFF_SEARCH_BASE}?${params.toString()}`, {
      headers: {
        'User-Agent': USER_AGENT
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    return (data.products || [])
      .filter((product: any) => product.nutriments && product.product_name)
      .map((product: any) => parseOpenFoodFactsProduct(product));
  } catch (error) {
    Alert.alert('Error', 'Fetching popular foods. Please try again.');

    console.error('Error fetching popular foods:', error);
    return [];
  }
};

/**
 * Get autocomplete suggestions for search
 */
export const getFoodSuggestions = async (query: string): Promise<string[]> => {
  if (query.length < 2) return [];

  try {
    const results = await searchFoods(query, 1, 10);
    return results.items.map(item => item.name);
  } catch (error) {
    Alert.alert('Error', 'Getting food suggestions. Please try again.');

    console.error('Error getting food suggestions:', error);
    return [];
  }
};
