import { create } from 'zustand';
import { FoodItem, MealPlan, NutritionLog, MacroTargets } from '../types';

interface NutritionState {
  foodItems: FoodItem[];
  mealPlans: MealPlan[];
  nutritionLogs: NutritionLog[];
  todayNutrition: NutritionLog | null;
  favorites: FoodItem[];
  isLoading: boolean;
  error: string | null;

  searchFood: (query: string) => Promise<FoodItem[]>;
  addFoodToLog: (food: FoodItem, quantity: number, mealType: string) => Promise<void>;
  getFavorites: () => Promise<void>;
  toggleFavorite: (foodId: string) => Promise<void>;
  getMacroProgress: () => Promise<void>;
  calculateMacroTargets: (userData: any) => MacroTargets;
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  foodItems: [],
  mealPlans: [],
  nutritionLogs: [],
  todayNutrition: null,
  favorites: [],
  isLoading: false,
  error: null,

  searchFood: async (query: string) => {
    set({ isLoading: true });
    try {
      const mockFoods: FoodItem[] = [
        {
          id: '1',
          name: 'Chicken Breast',
          brand: 'Generic',
          servingSize: 100,
          servingUnit: 'g',
          macrosPer100g: {
            calories: 165,
            protein: 31,
            carbs: 0,
            fat: 3.6,
          },
          category: 'protein',
          isCustom: false,
          verified: true,
          createdAt: new Date(),
        },
      ];
      return mockFoods;
    } catch (error) {
      set({ error: 'Failed to search food' });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  addFoodToLog: async (food: FoodItem, quantity: number, mealType: string) => {
    set({ isLoading: true });
    try {
      console.log('Adding food to log:', food, quantity, mealType);
    } catch (error) {
      set({ error: 'Failed to add food' });
    } finally {
      set({ isLoading: false });
    }
  },

  getFavorites: async () => {
    set({ isLoading: true });
    try {
      set({ favorites: [] });
    } catch (error) {
      set({ error: 'Failed to get favorites' });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleFavorite: async (foodId: string) => {
    const favorites = get().favorites;
    const isFavorite = favorites.some((f) => f.id === foodId);
    if (isFavorite) {
      set({ favorites: favorites.filter((f) => f.id !== foodId) });
    } else {
      const food = get().foodItems.find((f) => f.id === foodId);
      if (food) {
        set({ favorites: [...favorites, food] });
      }
    }
  },

  getMacroProgress: async () => {
    try {
      const mockToday: NutritionLog = {
        id: '1',
        userId: '1',
        date: new Date(),
        meals: [],
        totals: {
          calories: 1200,
          protein: 90,
          carbs: 150,
          fat: 30,
        },
        targets: {
          calories: 2000,
          protein: 150,
          carbs: 250,
          fat: 65,
        },
        syncedAt: new Date(),
      };
      set({ todayNutrition: mockToday });
    } catch (error) {
      console.error('Failed to get macro progress:', error);
    }
  },

  calculateMacroTargets: (userData: any): MacroTargets => {
    const bmr = userData.weight * 10 + userData.height * 6.25 - userData.age * 5 + 5;
    const tdee = bmr * 1.5;

    return {
      calories: Math.round(tdee),
      protein: Math.round(userData.weight * 2),
      carbs: Math.round((tdee * 0.45) / 4),
      fat: Math.round((tdee * 0.25) / 9),
      proteinPercent: 30,
      carbsPercent: 45,
      fatPercent: 25,
    };
  },
}));