import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

export interface CustomFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  brand?: string;
  userId: string;
  createdAt: Date;
}

export interface CustomMeal {
  id: string;
  name: string;
  foods: {
    foodId: string;
    foodName: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    serving: string;
  }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  userId: string;
  createdAt: Date;
}

export interface RecentFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  brand?: string;
  lastUsed: Date;
}

class CustomFoodsService {
  private FAVORITES_KEY = 'favorite_foods';
  private RECENT_KEY = 'recent_foods';
  private CUSTOM_FOODS_KEY = 'custom_foods';
  private CUSTOM_MEALS_KEY = 'custom_meals';

  // Favorites
  async addToFavorites(food: Omit<CustomFood, 'userId' | 'createdAt'>, userId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites(userId);
      const newFavorite: CustomFood = {
        ...food,
        userId,
        createdAt: new Date(),
      };

      // Check if already exists
      const exists = favorites.some(f => f.id === food.id);
      if (!exists) {
        favorites.push(newFavorite);
        await AsyncStorage.setItem(
          `${this.FAVORITES_KEY}_${userId}`,
          JSON.stringify(favorites)
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Adding to favorites. Please try again.');

      console.error('Error adding to favorites:', error);
      throw error;
    }
  }

  async removeFromFavorites(foodId: string, userId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites(userId);
      const filtered = favorites.filter(f => f.id !== foodId);
      await AsyncStorage.setItem(
        `${this.FAVORITES_KEY}_${userId}`,
        JSON.stringify(filtered)
      );
    } catch (error) {
      Alert.alert('Error', 'Removing from favorites. Please try again.');

      console.error('Error removing from favorites:', error);
      throw error;
    }
  }

  async getFavorites(userId: string): Promise<CustomFood[]> {
    try {
      const data = await AsyncStorage.getItem(`${this.FAVORITES_KEY}_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      Alert.alert('Error', 'Getting favorites. Please try again.');

      console.error('Error getting favorites:', error);
      return [];
    }
  }

  async isFavorite(foodId: string, userId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites(userId);
      return favorites.some(f => f.id === foodId);
    } catch (error) {
      return false;
    }
  }

  // Recent Foods
  async addToRecent(food: Omit<RecentFood, 'lastUsed'>, userId: string): Promise<void> {
    try {
      const recent = await this.getRecentFoods(userId);
      const recentFood: RecentFood = {
        ...food,
        lastUsed: new Date(),
      };

      // Remove if already exists
      const filtered = recent.filter(f => f.id !== food.id);

      // Add to beginning
      filtered.unshift(recentFood);

      // Keep only last 50
      const limited = filtered.slice(0, 50);

      await AsyncStorage.setItem(
        `${this.RECENT_KEY}_${userId}`,
        JSON.stringify(limited)
      );
    } catch (error) {
      Alert.alert('Error', 'Adding to recent. Please try again.');

      console.error('Error adding to recent:', error);
      throw error;
    }
  }

  async getRecentFoods(userId: string, limit: number = 20): Promise<RecentFood[]> {
    try {
      const data = await AsyncStorage.getItem(`${this.RECENT_KEY}_${userId}`);
      const recent = data ? JSON.parse(data) : [];
      return recent.slice(0, limit);
    } catch (error) {
      Alert.alert('Error', 'Getting recent foods. Please try again.');

      console.error('Error getting recent foods:', error);
      return [];
    }
  }

  // Custom Foods (My Foods)
  async createCustomFood(
    food: Omit<CustomFood, 'id' | 'userId' | 'createdAt'>,
    userId: string
  ): Promise<CustomFood> {
    try {
      const customFoods = await this.getCustomFoods(userId);
      const newFood: CustomFood = {
        ...food,
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        createdAt: new Date(),
      };

      customFoods.push(newFood);
      await AsyncStorage.setItem(
        `${this.CUSTOM_FOODS_KEY}_${userId}`,
        JSON.stringify(customFoods)
      );

      return newFood;
    } catch (error) {
      Alert.alert('Error', 'Creating custom food. Please try again.');

      console.error('Error creating custom food:', error);
      throw error;
    }
  }

  async updateCustomFood(foodId: string, updates: Partial<CustomFood>, userId: string): Promise<void> {
    try {
      const customFoods = await this.getCustomFoods(userId);
      const index = customFoods.findIndex(f => f.id === foodId);

      if (index !== -1) {
        customFoods[index] = { ...customFoods[index], ...updates };
        await AsyncStorage.setItem(
          `${this.CUSTOM_FOODS_KEY}_${userId}`,
          JSON.stringify(customFoods)
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Updating custom food. Please try again.');

      console.error('Error updating custom food:', error);
      throw error;
    }
  }

  async deleteCustomFood(foodId: string, userId: string): Promise<void> {
    try {
      const customFoods = await this.getCustomFoods(userId);
      const filtered = customFoods.filter(f => f.id !== foodId);
      await AsyncStorage.setItem(
        `${this.CUSTOM_FOODS_KEY}_${userId}`,
        JSON.stringify(filtered)
      );
    } catch (error) {
      Alert.alert('Error', 'Deleting custom food. Please try again.');

      console.error('Error deleting custom food:', error);
      throw error;
    }
  }

  async getCustomFoods(userId: string): Promise<CustomFood[]> {
    try {
      const data = await AsyncStorage.getItem(`${this.CUSTOM_FOODS_KEY}_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      Alert.alert('Error', 'Getting custom foods. Please try again.');

      console.error('Error getting custom foods:', error);
      return [];
    }
  }

  // Custom Meals (My Meals)
  async createCustomMeal(
    meal: Omit<CustomMeal, 'id' | 'userId' | 'createdAt'>,
    userId: string
  ): Promise<CustomMeal> {
    try {
      const customMeals = await this.getCustomMeals(userId);
      const newMeal: CustomMeal = {
        ...meal,
        id: `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        createdAt: new Date(),
      };

      customMeals.push(newMeal);
      await AsyncStorage.setItem(
        `${this.CUSTOM_MEALS_KEY}_${userId}`,
        JSON.stringify(customMeals)
      );

      return newMeal;
    } catch (error) {
      Alert.alert('Error', 'Creating custom meal. Please try again.');

      console.error('Error creating custom meal:', error);
      throw error;
    }
  }

  async deleteCustomMeal(mealId: string, userId: string): Promise<void> {
    try {
      const customMeals = await this.getCustomMeals(userId);
      const filtered = customMeals.filter(m => m.id !== mealId);
      await AsyncStorage.setItem(
        `${this.CUSTOM_MEALS_KEY}_${userId}`,
        JSON.stringify(filtered)
      );
    } catch (error) {
      Alert.alert('Error', 'Deleting custom meal. Please try again.');

      console.error('Error deleting custom meal:', error);
      throw error;
    }
  }

  async getCustomMeals(userId: string): Promise<CustomMeal[]> {
    try {
      const data = await AsyncStorage.getItem(`${this.CUSTOM_MEALS_KEY}_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      Alert.alert('Error', 'Getting custom meals. Please try again.');

      console.error('Error getting custom meals:', error);
      return [];
    }
  }
}

export const customFoodsService = new CustomFoodsService();
export default customFoodsService;
