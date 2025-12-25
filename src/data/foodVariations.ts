export interface FoodVariation {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  // Nutrition per 100g
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  // Common serving sizes
  servingSize: number;
  servingUnit: string;
}

export interface FoodWithVariations {
  baseFoodName: string;
  baseFoodKeywords: string[]; // Keywords to match against search
  emoji: string;
  variations: FoodVariation[];
}

export const foodVariations: FoodWithVariations[] = [
  // PASTA
  {
    baseFoodName: 'Pasta',
    baseFoodKeywords: ['pasta', 'pasta (cooked)', 'spaghetti', 'penne', 'fettuccine', 'linguine', 'macaroni'],
    emoji: '🍝',
    variations: [
      {
        id: 'pasta_bolognese',
        name: 'Pasta Bolognese',
        emoji: '🍝',
        description: 'Pasta with meat sauce',
        calories: 150,
        protein: 8,
        carbs: 20,
        fat: 4,
        fiber: 2,
        sugar: 3,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'pasta_carbonara',
        name: 'Pasta Carbonara',
        emoji: '🍝',
        description: 'Pasta with eggs, cheese, and bacon',
        calories: 180,
        protein: 9,
        carbs: 18,
        fat: 8,
        fiber: 1,
        sugar: 1,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'pasta_tomato',
        name: 'Pasta with Tomato Sauce',
        emoji: '🍝',
        description: 'Pasta with marinara sauce',
        calories: 120,
        protein: 4,
        carbs: 22,
        fat: 2,
        fiber: 2,
        sugar: 4,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'pasta_pesto',
        name: 'Pasta with Pesto',
        emoji: '🍝',
        description: 'Pasta with basil pesto sauce',
        calories: 165,
        protein: 5,
        carbs: 20,
        fat: 7,
        fiber: 2,
        sugar: 1,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'pasta_alfredo',
        name: 'Pasta Alfredo',
        emoji: '🍝',
        description: 'Pasta with creamy alfredo sauce',
        calories: 195,
        protein: 7,
        carbs: 19,
        fat: 10,
        fiber: 1,
        sugar: 2,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'pasta_arrabiata',
        name: 'Pasta Arrabiata',
        emoji: '🍝',
        description: 'Spicy pasta with tomato sauce',
        calories: 125,
        protein: 4,
        carbs: 22,
        fat: 2.5,
        fiber: 2,
        sugar: 4,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'pasta_aglio_olio',
        name: 'Aglio e Olio',
        emoji: '🍝',
        description: 'Pasta with garlic and olive oil',
        calories: 160,
        protein: 5,
        carbs: 24,
        fat: 5,
        fiber: 2,
        sugar: 1,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'mac_and_cheese',
        name: 'Mac and Cheese',
        emoji: '🧀',
        description: 'Macaroni with cheese sauce',
        calories: 170,
        protein: 7,
        carbs: 20,
        fat: 7,
        fiber: 1,
        sugar: 3,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'pasta_plain',
        name: 'Plain Pasta',
        emoji: '🍝',
        description: 'Plain cooked pasta (no sauce)',
        calories: 131,
        protein: 5,
        carbs: 25,
        fat: 1.1,
        fiber: 1.8,
        sugar: 0.6,
        servingSize: 100,
        servingUnit: 'g'
      }
    ]
  },

  // CHICKEN
  {
    baseFoodName: 'Chicken',
    baseFoodKeywords: ['chicken', 'chicken breast'],
    emoji: '🍗',
    variations: [
      {
        id: 'chicken_grilled',
        name: 'Grilled Chicken Breast',
        emoji: '🍗',
        description: 'Lean grilled chicken',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0,
        sugar: 0,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'chicken_fried',
        name: 'Fried Chicken',
        emoji: '🍗',
        description: 'Breaded and fried chicken',
        calories: 246,
        protein: 19,
        carbs: 12,
        fat: 14,
        fiber: 0.6,
        sugar: 0,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'chicken_baked',
        name: 'Baked Chicken',
        emoji: '🍗',
        description: 'Oven-baked chicken',
        calories: 167,
        protein: 30,
        carbs: 0,
        fat: 4.5,
        fiber: 0,
        sugar: 0,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'chicken_bbq',
        name: 'BBQ Chicken',
        emoji: '🍗',
        description: 'Chicken with BBQ sauce',
        calories: 190,
        protein: 28,
        carbs: 8,
        fat: 5,
        fiber: 0.3,
        sugar: 6,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'chicken_curry',
        name: 'Chicken Curry',
        emoji: '🍛',
        description: 'Chicken in curry sauce',
        calories: 135,
        protein: 15,
        carbs: 7,
        fat: 5,
        fiber: 1,
        sugar: 3,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'chicken_teriyaki',
        name: 'Teriyaki Chicken',
        emoji: '🍗',
        description: 'Chicken with teriyaki sauce',
        calories: 155,
        protein: 23,
        carbs: 9,
        fat: 3,
        fiber: 0.2,
        sugar: 7,
        servingSize: 100,
        servingUnit: 'g'
      }
    ]
  },

  // EGGS
  {
    baseFoodName: 'Eggs',
    baseFoodKeywords: ['egg', 'eggs'],
    emoji: '🥚',
    variations: [
      {
        id: 'eggs_scrambled',
        name: 'Scrambled Eggs',
        emoji: '🍳',
        description: 'Scrambled with butter/oil',
        calories: 148,
        protein: 10,
        carbs: 1,
        fat: 11,
        fiber: 0,
        sugar: 1,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'eggs_fried',
        name: 'Fried Eggs',
        emoji: '🍳',
        description: 'Pan-fried in oil',
        calories: 196,
        protein: 14,
        carbs: 1,
        fat: 15,
        fiber: 0,
        sugar: 0.4,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'eggs_boiled',
        name: 'Boiled Eggs',
        emoji: '🥚',
        description: 'Hard or soft boiled',
        calories: 155,
        protein: 13,
        carbs: 1.1,
        fat: 11,
        fiber: 0,
        sugar: 1.1,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'eggs_poached',
        name: 'Poached Eggs',
        emoji: '🥚',
        description: 'Poached in water',
        calories: 143,
        protein: 12.5,
        carbs: 0.7,
        fat: 9.5,
        fiber: 0,
        sugar: 0.4,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'eggs_omelette',
        name: 'Omelette',
        emoji: '🍳',
        description: 'Omelette with cheese/veggies',
        calories: 154,
        protein: 11,
        carbs: 2,
        fat: 12,
        fiber: 0.2,
        sugar: 1,
        servingSize: 100,
        servingUnit: 'g'
      }
    ]
  },

  // RICE
  {
    baseFoodName: 'Rice',
    baseFoodKeywords: ['rice', 'white rice', 'brown rice'],
    emoji: '🍚',
    variations: [
      {
        id: 'rice_white_plain',
        name: 'White Rice (Plain)',
        emoji: '🍚',
        description: 'Plain cooked white rice',
        calories: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3,
        fiber: 0.4,
        sugar: 0.1,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'rice_brown',
        name: 'Brown Rice',
        emoji: '🍚',
        description: 'Cooked brown rice',
        calories: 112,
        protein: 2.6,
        carbs: 23.5,
        fat: 0.9,
        fiber: 1.8,
        sugar: 0.4,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'rice_fried',
        name: 'Fried Rice',
        emoji: '🍚',
        description: 'Rice stir-fried with vegetables/meat',
        calories: 163,
        protein: 4,
        carbs: 26,
        fat: 5,
        fiber: 1,
        sugar: 1,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'rice_spanish',
        name: 'Spanish Rice',
        emoji: '🍚',
        description: 'Rice with tomatoes and spices',
        calories: 140,
        protein: 3,
        carbs: 27,
        fat: 2,
        fiber: 1.5,
        sugar: 2,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'rice_pilaf',
        name: 'Rice Pilaf',
        emoji: '🍚',
        description: 'Rice cooked in broth',
        calories: 145,
        protein: 3,
        carbs: 26,
        fat: 3,
        fiber: 1,
        sugar: 0.5,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'rice_beans',
        name: 'Rice and Beans',
        emoji: '🍚',
        description: 'Rice mixed with beans',
        calories: 130,
        protein: 5,
        carbs: 24,
        fat: 1.5,
        fiber: 4,
        sugar: 1,
        servingSize: 100,
        servingUnit: 'g'
      }
    ]
  },

  // BURGER
  {
    baseFoodName: 'Burger',
    baseFoodKeywords: ['burger', 'hamburger'],
    emoji: '🍔',
    variations: [
      {
        id: 'burger_plain',
        name: 'Plain Hamburger',
        emoji: '🍔',
        description: 'Beef patty with bun',
        calories: 250,
        protein: 13,
        carbs: 31,
        fat: 9,
        fiber: 1.2,
        sugar: 5,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'burger_cheese',
        name: 'Cheeseburger',
        emoji: '🍔',
        description: 'Burger with cheese',
        calories: 285,
        protein: 15,
        carbs: 31,
        fat: 13,
        fiber: 1.2,
        sugar: 5,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'burger_double',
        name: 'Double Cheeseburger',
        emoji: '🍔',
        description: 'Two patties with cheese',
        calories: 320,
        protein: 20,
        carbs: 28,
        fat: 16,
        fiber: 1.5,
        sugar: 5,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'burger_bacon',
        name: 'Bacon Burger',
        emoji: '🍔',
        description: 'Burger with bacon and cheese',
        calories: 310,
        protein: 17,
        carbs: 30,
        fat: 15,
        fiber: 1.2,
        sugar: 5,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'burger_veggie',
        name: 'Veggie Burger',
        emoji: '🥗',
        description: 'Vegetarian patty',
        calories: 180,
        protein: 11,
        carbs: 28,
        fat: 4,
        fiber: 5,
        sugar: 3,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'burger_turkey',
        name: 'Turkey Burger',
        emoji: '🍔',
        description: 'Turkey patty with bun',
        calories: 205,
        protein: 16,
        carbs: 25,
        fat: 5,
        fiber: 1.5,
        sugar: 4,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'burger_chicken',
        name: 'Chicken Burger',
        emoji: '🍔',
        description: 'Grilled chicken patty',
        calories: 185,
        protein: 18,
        carbs: 22,
        fat: 4,
        fiber: 1,
        sugar: 3,
        servingSize: 100,
        servingUnit: 'g'
      }
    ]
  },

  // PIZZA
  {
    baseFoodName: 'Pizza',
    baseFoodKeywords: ['pizza'],
    emoji: '🍕',
    variations: [
      {
        id: 'pizza_margherita',
        name: 'Margherita Pizza',
        emoji: '🍕',
        description: 'Tomato, mozzarella, basil',
        calories: 266,
        protein: 11,
        carbs: 33,
        fat: 10,
        fiber: 2,
        sugar: 4,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'pizza_pepperoni',
        name: 'Pepperoni Pizza',
        emoji: '🍕',
        description: 'With pepperoni',
        calories: 298,
        protein: 12,
        carbs: 35,
        fat: 13,
        fiber: 2,
        sugar: 4,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'pizza_hawaiian',
        name: 'Hawaiian Pizza',
        emoji: '🍕',
        description: 'Ham and pineapple',
        calories: 274,
        protein: 11,
        carbs: 37,
        fat: 9,
        fiber: 2,
        sugar: 7,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'pizza_veggie',
        name: 'Veggie Pizza',
        emoji: '🍕',
        description: 'Assorted vegetables',
        calories: 235,
        protein: 10,
        carbs: 32,
        fat: 8,
        fiber: 3,
        sugar: 5,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'pizza_bbq_chicken',
        name: 'BBQ Chicken Pizza',
        emoji: '🍕',
        description: 'BBQ sauce and chicken',
        calories: 280,
        protein: 14,
        carbs: 34,
        fat: 10,
        fiber: 2,
        sugar: 8,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'pizza_meat_lovers',
        name: 'Meat Lovers Pizza',
        emoji: '🍕',
        description: 'Multiple meat toppings',
        calories: 320,
        protein: 14,
        carbs: 30,
        fat: 17,
        fiber: 2,
        sugar: 4,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'pizza_cheese',
        name: 'Cheese Pizza',
        emoji: '🍕',
        description: 'Just cheese',
        calories: 271,
        protein: 12,
        carbs: 33,
        fat: 10,
        fiber: 2,
        sugar: 4,
        servingSize: 100,
        servingUnit: 'g'
      }
    ]
  },

  // POTATO
  {
    baseFoodName: 'Potato',
    baseFoodKeywords: ['potato', 'potatoes', 'french fries', 'fries'],
    emoji: '🥔',
    variations: [
      {
        id: 'potato_baked',
        name: 'Baked Potato',
        emoji: '🥔',
        description: 'Plain baked potato',
        calories: 93,
        protein: 2.5,
        carbs: 21,
        fat: 0.1,
        fiber: 2.2,
        sugar: 1,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'potato_mashed',
        name: 'Mashed Potatoes',
        emoji: '🥔',
        description: 'Mashed with butter and milk',
        calories: 116,
        protein: 2,
        carbs: 17,
        fat: 4.5,
        fiber: 1.5,
        sugar: 1.5,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'potato_french_fries',
        name: 'French Fries',
        emoji: '🍟',
        description: 'Deep fried potato strips',
        calories: 312,
        protein: 3.4,
        carbs: 41,
        fat: 15,
        fiber: 3.8,
        sugar: 0.2,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'potato_hash_browns',
        name: 'Hash Browns',
        emoji: '🥔',
        description: 'Shredded and fried',
        calories: 265,
        protein: 3,
        carbs: 35,
        fat: 13,
        fiber: 3,
        sugar: 1,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'potato_roasted',
        name: 'Roasted Potatoes',
        emoji: '🥔',
        description: 'Roasted with oil',
        calories: 149,
        protein: 2.5,
        carbs: 23,
        fat: 5,
        fiber: 2.5,
        sugar: 1,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'potato_wedges',
        name: 'Potato Wedges',
        emoji: '🥔',
        description: 'Seasoned and baked/fried',
        calories: 175,
        protein: 3,
        carbs: 27,
        fat: 6,
        fiber: 3,
        sugar: 1,
        servingSize: 100,
        servingUnit: 'g'
      }
    ]
  },

  // OATMEAL
  {
    baseFoodName: 'Oatmeal',
    baseFoodKeywords: ['oatmeal', 'oats', 'porridge'],
    emoji: '🥣',
    variations: [
      {
        id: 'oatmeal_plain',
        name: 'Plain Oatmeal',
        emoji: '🥣',
        description: 'Cooked with water',
        calories: 71,
        protein: 2.5,
        carbs: 12,
        fat: 1.5,
        fiber: 1.7,
        sugar: 0.3,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'oatmeal_milk',
        name: 'Oatmeal with Milk',
        emoji: '🥣',
        description: 'Cooked with milk',
        calories: 85,
        protein: 3.5,
        carbs: 13,
        fat: 2.5,
        fiber: 1.7,
        sugar: 3,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'oatmeal_honey',
        name: 'Oatmeal with Honey',
        emoji: '🍯',
        description: 'With honey',
        calories: 110,
        protein: 2.5,
        carbs: 20,
        fat: 1.5,
        fiber: 1.7,
        sugar: 8,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'oatmeal_fruit',
        name: 'Oatmeal with Fruit',
        emoji: '🍓',
        description: 'With berries or banana',
        calories: 95,
        protein: 2.8,
        carbs: 18,
        fat: 1.5,
        fiber: 3,
        sugar: 6,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'oatmeal_nuts',
        name: 'Oatmeal with Nuts',
        emoji: '🥜',
        description: 'With almonds or walnuts',
        calories: 145,
        protein: 5,
        carbs: 13,
        fat: 7,
        fiber: 3,
        sugar: 1,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'oatmeal_protein',
        name: 'Protein Oatmeal',
        emoji: '💪',
        description: 'With protein powder',
        calories: 120,
        protein: 12,
        carbs: 15,
        fat: 2,
        fiber: 2,
        sugar: 2,
        servingSize: 100,
        servingUnit: 'g'
      }
    ]
  },

  // SANDWICH
  {
    baseFoodName: 'Sandwich',
    baseFoodKeywords: ['sandwich'],
    emoji: '🥪',
    variations: [
      {
        id: 'sandwich_blt',
        name: 'BLT Sandwich',
        emoji: '🥓',
        description: 'Bacon, lettuce, tomato',
        calories: 265,
        protein: 12,
        carbs: 28,
        fat: 12,
        fiber: 2,
        sugar: 4,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'sandwich_club',
        name: 'Club Sandwich',
        emoji: '🥪',
        description: 'Turkey, bacon, lettuce, tomato',
        calories: 250,
        protein: 14,
        carbs: 24,
        fat: 11,
        fiber: 2,
        sugar: 3,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'sandwich_grilled_cheese',
        name: 'Grilled Cheese',
        emoji: '🧀',
        description: 'Grilled cheese sandwich',
        calories: 290,
        protein: 11,
        carbs: 28,
        fat: 15,
        fiber: 1.2,
        sugar: 4,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'sandwich_tuna',
        name: 'Tuna Sandwich',
        emoji: '🐟',
        description: 'Tuna salad sandwich',
        calories: 225,
        protein: 14,
        carbs: 25,
        fat: 8,
        fiber: 2,
        sugar: 3,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'sandwich_chicken',
        name: 'Chicken Sandwich',
        emoji: '🍗',
        description: 'Grilled chicken sandwich',
        calories: 195,
        protein: 16,
        carbs: 24,
        fat: 4,
        fiber: 2,
        sugar: 3,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'sandwich_turkey',
        name: 'Turkey Sandwich',
        emoji: '🦃',
        description: 'Turkey and cheese',
        calories: 210,
        protein: 15,
        carbs: 26,
        fat: 5,
        fiber: 2,
        sugar: 3,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'sandwich_ham',
        name: 'Ham & Cheese Sandwich',
        emoji: '🥪',
        description: 'Ham and cheese',
        calories: 245,
        protein: 14,
        carbs: 26,
        fat: 9,
        fiber: 2,
        sugar: 3,
        servingSize: 100,
        servingUnit: 'g'
      }
    ]
  },

  // SALAD
  {
    baseFoodName: 'Salad',
    baseFoodKeywords: ['salad'],
    emoji: '🥗',
    variations: [
      {
        id: 'salad_caesar',
        name: 'Caesar Salad',
        emoji: '🥗',
        description: 'Romaine, croutons, parmesan',
        calories: 180,
        protein: 6,
        carbs: 12,
        fat: 13,
        fiber: 2,
        sugar: 2,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'salad_caesar_chicken',
        name: 'Chicken Caesar Salad',
        emoji: '🥗',
        description: 'With grilled chicken',
        calories: 200,
        protein: 15,
        carbs: 10,
        fat: 12,
        fiber: 2,
        sugar: 2,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'salad_greek',
        name: 'Greek Salad',
        emoji: '🥗',
        description: 'Feta, olives, cucumber, tomato',
        calories: 110,
        protein: 4,
        carbs: 8,
        fat: 7,
        fiber: 2,
        sugar: 4,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'salad_garden',
        name: 'Garden Salad',
        emoji: '🥗',
        description: 'Mixed greens and vegetables',
        calories: 35,
        protein: 2,
        carbs: 7,
        fat: 0.3,
        fiber: 2,
        sugar: 3,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'salad_cobb',
        name: 'Cobb Salad',
        emoji: '🥗',
        description: 'Chicken, bacon, egg, avocado',
        calories: 150,
        protein: 12,
        carbs: 5,
        fat: 10,
        fiber: 3,
        sugar: 2,
        servingSize: 100,
        servingUnit: 'g'
      }
    ]
  },

  // COFFEE
  {
    baseFoodName: 'Coffee',
    baseFoodKeywords: ['coffee'],
    emoji: '☕',
    variations: [
      {
        id: 'coffee_black',
        name: 'Black Coffee',
        emoji: '☕',
        description: 'Plain black coffee',
        calories: 2,
        protein: 0.3,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        servingSize: 100,
        servingUnit: 'ml'
      },
      {
        id: 'coffee_milk',
        name: 'Coffee with Milk',
        emoji: '☕',
        description: 'Coffee with milk',
        calories: 30,
        protein: 1.5,
        carbs: 2.5,
        fat: 1.5,
        fiber: 0,
        sugar: 2,
        servingSize: 100,
        servingUnit: 'ml'
      },
      {
        id: 'coffee_cream_sugar',
        name: 'Coffee with Cream & Sugar',
        emoji: '☕',
        description: 'Coffee with cream and sugar',
        calories: 65,
        protein: 0.8,
        carbs: 8,
        fat: 3,
        fiber: 0,
        sugar: 7,
        servingSize: 100,
        servingUnit: 'ml'
      },
      {
        id: 'coffee_latte',
        name: 'Latte',
        emoji: '☕',
        description: 'Espresso with steamed milk',
        calories: 54,
        protein: 3,
        carbs: 5,
        fat: 2,
        fiber: 0,
        sugar: 5,
        servingSize: 100,
        servingUnit: 'ml'
      },
      {
        id: 'coffee_cappuccino',
        name: 'Cappuccino',
        emoji: '☕',
        description: 'Espresso with foamed milk',
        calories: 46,
        protein: 2.5,
        carbs: 4.5,
        fat: 1.8,
        fiber: 0,
        sugar: 4.5,
        servingSize: 100,
        servingUnit: 'ml'
      },
      {
        id: 'coffee_mocha',
        name: 'Mocha',
        emoji: '☕',
        description: 'Coffee with chocolate',
        calories: 82,
        protein: 2,
        carbs: 12,
        fat: 2.5,
        fiber: 0.5,
        sugar: 10,
        servingSize: 100,
        servingUnit: 'ml'
      },
      {
        id: 'coffee_iced',
        name: 'Iced Coffee',
        emoji: '🧊',
        description: 'Cold coffee',
        calories: 25,
        protein: 1,
        carbs: 3,
        fat: 1,
        fiber: 0,
        sugar: 2.5,
        servingSize: 100,
        servingUnit: 'ml'
      }
    ]
  },

  // YOGURT
  {
    baseFoodName: 'Yogurt',
    baseFoodKeywords: ['yogurt', 'yoghurt'],
    emoji: '🥛',
    variations: [
      {
        id: 'yogurt_plain',
        name: 'Plain Yogurt',
        emoji: '🥛',
        description: 'Plain unflavored yogurt',
        calories: 59,
        protein: 3.5,
        carbs: 4.7,
        fat: 3.3,
        fiber: 0,
        sugar: 4.7,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'yogurt_greek',
        name: 'Greek Yogurt',
        emoji: '🥛',
        description: 'Thick Greek yogurt',
        calories: 97,
        protein: 9,
        carbs: 3.6,
        fat: 5,
        fiber: 0,
        sugar: 3.2,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'yogurt_fruit',
        name: 'Yogurt with Fruit',
        emoji: '🍓',
        description: 'Yogurt with fruit',
        calories: 85,
        protein: 4,
        carbs: 14,
        fat: 1.5,
        fiber: 0.5,
        sugar: 12,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'yogurt_honey',
        name: 'Yogurt with Honey',
        emoji: '🍯',
        description: 'Yogurt with honey',
        calories: 95,
        protein: 3.5,
        carbs: 16,
        fat: 2,
        fiber: 0,
        sugar: 14,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'yogurt_granola',
        name: 'Yogurt with Granola',
        emoji: '🥣',
        description: 'Yogurt with granola',
        calories: 125,
        protein: 5,
        carbs: 18,
        fat: 4,
        fiber: 2,
        sugar: 10,
        servingSize: 100,
        servingUnit: 'g'
      }
    ]
  },

  // PANCAKES
  {
    baseFoodName: 'Pancakes',
    baseFoodKeywords: ['pancake', 'pancakes'],
    emoji: '🥞',
    variations: [
      {
        id: 'pancakes_plain',
        name: 'Plain Pancakes',
        emoji: '🥞',
        description: 'Plain pancakes',
        calories: 227,
        protein: 6,
        carbs: 28,
        fat: 10,
        fiber: 1,
        sugar: 5,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'pancakes_syrup',
        name: 'Pancakes with Syrup',
        emoji: '🥞',
        description: 'With maple syrup',
        calories: 285,
        protein: 5,
        carbs: 52,
        fat: 7,
        fiber: 1,
        sugar: 28,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'pancakes_butter',
        name: 'Pancakes with Butter',
        emoji: '🥞',
        description: 'With butter',
        calories: 280,
        protein: 6,
        carbs: 30,
        fat: 15,
        fiber: 1,
        sugar: 6,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'pancakes_fruit',
        name: 'Pancakes with Fruit',
        emoji: '🍓',
        description: 'With berries',
        calories: 245,
        protein: 6,
        carbs: 38,
        fat: 8,
        fiber: 3,
        sugar: 15,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'pancakes_protein',
        name: 'Protein Pancakes',
        emoji: '💪',
        description: 'High protein pancakes',
        calories: 180,
        protein: 15,
        carbs: 22,
        fat: 4,
        fiber: 2,
        sugar: 3,
        servingSize: 100,
        servingUnit: 'g'
      }
    ]
  },

  // TOAST
  {
    baseFoodName: 'Toast',
    baseFoodKeywords: ['toast', 'bread', 'french toast'],
    emoji: '🍞',
    variations: [
      {
        id: 'toast_plain',
        name: 'Plain Toast',
        emoji: '🍞',
        description: 'Just toasted bread',
        calories: 265,
        protein: 9,
        carbs: 49,
        fat: 3.2,
        fiber: 2.7,
        sugar: 5,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'toast_butter',
        name: 'Toast with Butter',
        emoji: '🧈',
        description: 'Toast with butter',
        calories: 340,
        protein: 8,
        carbs: 45,
        fat: 14,
        fiber: 2.7,
        sugar: 5,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'toast_jam',
        name: 'Toast with Jam',
        emoji: '🍓',
        description: 'Toast with jam/jelly',
        calories: 295,
        protein: 8,
        carbs: 58,
        fat: 3,
        fiber: 2.5,
        sugar: 20,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'toast_avocado',
        name: 'Avocado Toast',
        emoji: '🥑',
        description: 'Toast with avocado',
        calories: 190,
        protein: 5,
        carbs: 20,
        fat: 10,
        fiber: 5,
        sugar: 2,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'toast_peanut_butter',
        name: 'Peanut Butter Toast',
        emoji: '🥜',
        description: 'Toast with peanut butter',
        calories: 345,
        protein: 13,
        carbs: 38,
        fat: 16,
        fiber: 4,
        sugar: 10,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'toast_french',
        name: 'French Toast',
        emoji: '🍞',
        description: 'Egg-soaked and fried',
        calories: 210,
        protein: 7,
        carbs: 28,
        fat: 7,
        fiber: 1.5,
        sugar: 8,
        servingSize: 100,
        servingUnit: 'g'
      }
    ]
  },

  // BEEF
  {
    baseFoodName: 'Beef',
    baseFoodKeywords: ['beef', 'steak'],
    emoji: '🥩',
    variations: [
      {
        id: 'beef_grilled_steak',
        name: 'Grilled Steak',
        emoji: '🥩',
        description: 'Grilled beef steak',
        calories: 271,
        protein: 25,
        carbs: 0,
        fat: 19,
        fiber: 0,
        sugar: 0,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'beef_ground',
        name: 'Ground Beef (Lean)',
        emoji: '🍖',
        description: '90/10 lean ground beef',
        calories: 176,
        protein: 20,
        carbs: 0,
        fat: 10,
        fiber: 0,
        sugar: 0,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'beef_ground_regular',
        name: 'Ground Beef (Regular)',
        emoji: '🍖',
        description: '80/20 ground beef',
        calories: 254,
        protein: 17,
        carbs: 0,
        fat: 20,
        fiber: 0,
        sugar: 0,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'beef_roast',
        name: 'Roast Beef',
        emoji: '🥩',
        description: 'Roasted beef',
        calories: 205,
        protein: 25,
        carbs: 0,
        fat: 11,
        fiber: 0,
        sugar: 0,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'beef_stew',
        name: 'Beef Stew',
        emoji: '🍲',
        description: 'Beef stew with vegetables',
        calories: 106,
        protein: 9,
        carbs: 7,
        fat: 4,
        fiber: 1,
        sugar: 2,
        servingSize: 100,
        servingUnit: 'g'
      }
    ]
  },

  // FISH
  {
    baseFoodName: 'Fish',
    baseFoodKeywords: ['fish', 'salmon', 'tuna'],
    emoji: '🐟',
    variations: [
      {
        id: 'fish_grilled_salmon',
        name: 'Grilled Salmon',
        emoji: '🐟',
        description: 'Grilled salmon fillet',
        calories: 206,
        protein: 22,
        carbs: 0,
        fat: 12,
        fiber: 0,
        sugar: 0,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'fish_fried',
        name: 'Fried Fish',
        emoji: '🐟',
        description: 'Breaded and fried',
        calories: 232,
        protein: 19,
        carbs: 15,
        fat: 11,
        fiber: 0.5,
        sugar: 0.5,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'fish_baked',
        name: 'Baked Fish',
        emoji: '🐟',
        description: 'Oven-baked fish',
        calories: 143,
        protein: 20,
        carbs: 0,
        fat: 6,
        fiber: 0,
        sugar: 0,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'fish_tuna_water',
        name: 'Tuna in Water',
        emoji: '🐟',
        description: 'Canned tuna in water',
        calories: 116,
        protein: 26,
        carbs: 0,
        fat: 0.8,
        fiber: 0,
        sugar: 0,
        servingSize: 100,
        servingUnit: 'g'
      },
      {
        id: 'fish_tuna_oil',
        name: 'Tuna in Oil',
        emoji: '🐟',
        description: 'Canned tuna in oil',
        calories: 198,
        protein: 29,
        carbs: 0,
        fat: 8,
        fiber: 0,
        sugar: 0,
        servingSize: 100,
        servingUnit: 'g'
      }
    ]
  },

  // SOUP
  {
    baseFoodName: 'Soup',
    baseFoodKeywords: ['soup'],
    emoji: '🍲',
    variations: [
      {
        id: 'soup_chicken_noodle',
        name: 'Chicken Noodle Soup',
        emoji: '🍲',
        description: 'Chicken and noodles',
        calories: 38,
        protein: 3,
        carbs: 4,
        fat: 1.2,
        fiber: 0.5,
        sugar: 1,
        servingSize: 100,
        servingUnit: 'ml'
      },
      {
        id: 'soup_tomato',
        name: 'Tomato Soup',
        emoji: '🍅',
        description: 'Creamy tomato soup',
        calories: 48,
        protein: 1,
        carbs: 9,
        fat: 1.2,
        fiber: 1,
        sugar: 6,
        servingSize: 100,
        servingUnit: 'ml'
      },
      {
        id: 'soup_vegetable',
        name: 'Vegetable Soup',
        emoji: '🥕',
        description: 'Mixed vegetable soup',
        calories: 30,
        protein: 1,
        carbs: 6,
        fat: 0.5,
        fiber: 1.5,
        sugar: 2,
        servingSize: 100,
        servingUnit: 'ml'
      },
      {
        id: 'soup_minestrone',
        name: 'Minestrone Soup',
        emoji: '🍲',
        description: 'Italian vegetable soup',
        calories: 44,
        protein: 2,
        carbs: 8,
        fat: 1,
        fiber: 1.5,
        sugar: 2,
        servingSize: 100,
        servingUnit: 'ml'
      },
      {
        id: 'soup_lentil',
        name: 'Lentil Soup',
        emoji: '🍲',
        description: 'Hearty lentil soup',
        calories: 55,
        protein: 3.5,
        carbs: 9,
        fat: 0.8,
        fiber: 3,
        sugar: 1.5,
        servingSize: 100,
        servingUnit: 'ml'
      }
    ]
  }
];

/**
 * Check if a food name matches any base food with variations
 */
export const findFoodWithVariations = (foodName: string): FoodWithVariations | null => {
  const nameLower = foodName.toLowerCase();

  for (const foodWithVariations of foodVariations) {
    // Check if the food name matches any keywords
    const matches = foodWithVariations.baseFoodKeywords.some(keyword =>
      nameLower.includes(keyword.toLowerCase())
    );

    if (matches) {
      return foodWithVariations;
    }
  }

  return null;
};
