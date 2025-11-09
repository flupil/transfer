import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSafeDatabase, ensureDatabase } from '../database/databaseHelper';
import { syncService } from './syncService';
import { foodApiService } from './foodApiService';
import uuid from 'react-native-uuid';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

export interface RecipeIngredient {
  foodId: string;
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface Recipe {
  id: string;
  userId: string;
  name: string;
  description?: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert' | 'drink' | 'other';
  ingredients: RecipeIngredient[];
  instructions: string[];
  prepTime?: number; // in minutes
  cookTime?: number; // in minutes
  servings: number;
  tags?: string[];
  imageUrl?: string;
  isPublic: boolean;
  isFavorite: boolean;
  rating?: number;
  nutritionPerServing: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface RecipeFilter {
  category?: string;
  maxCalories?: number;
  maxPrepTime?: number;
  tags?: string[];
  searchQuery?: string;
  isFavorite?: boolean;
}

class RecipeService {
  private currentUserId: string | null = null;
  private readonly STORAGE_KEY = 'user_recipes';

  setUserId(userId: string) {
    this.currentUserId = userId;
  }

  // Create a new recipe
  async createRecipe(recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt' | 'nutritionPerServing'>): Promise<Recipe> {
    try {
      await ensureDatabase();
      const db = getSafeDatabase();

      const id = uuid.v4() as string;
      const now = new Date();

      // Calculate nutrition per serving
      const totalNutrition = recipe.ingredients.reduce((acc, ingredient) => ({
        calories: acc.calories + ingredient.calories,
        protein: acc.protein + ingredient.protein,
        carbs: acc.carbs + ingredient.carbs,
        fat: acc.fat + ingredient.fat,
        fiber: (acc.fiber || 0) + (ingredient.fiber || 0),
        sugar: (acc.sugar || 0) + (ingredient.sugar || 0),
        sodium: (acc.sodium || 0) + (ingredient.sodium || 0),
      }), {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
      });

      const nutritionPerServing = {
        calories: Math.round(totalNutrition.calories / recipe.servings),
        protein: Math.round(totalNutrition.protein / recipe.servings * 10) / 10,
        carbs: Math.round(totalNutrition.carbs / recipe.servings * 10) / 10,
        fat: Math.round(totalNutrition.fat / recipe.servings * 10) / 10,
        fiber: totalNutrition.fiber ? Math.round(totalNutrition.fiber / recipe.servings * 10) / 10 : undefined,
        sugar: totalNutrition.sugar ? Math.round(totalNutrition.sugar / recipe.servings * 10) / 10 : undefined,
        sodium: totalNutrition.sodium ? Math.round(totalNutrition.sodium / recipe.servings) : undefined,
      };

      const newRecipe: Recipe = {
        ...recipe,
        id,
        userId: recipe.userId || this.currentUserId || '1',
        nutritionPerServing,
        createdAt: now,
        updatedAt: now,
      };

      if (db) {
        await db.runAsync(
          `INSERT INTO recipes (id, userId, name, description, category, ingredients, instructions,
           prepTime, cookTime, servings, tags, imageUrl, isPublic, isFavorite, rating,
           nutritionPerServing, createdAt, updatedAt, syncStatus)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 'pending')`,
          [
            newRecipe.id,
            newRecipe.userId,
            newRecipe.name,
            newRecipe.description || '',
            newRecipe.category,
            JSON.stringify(newRecipe.ingredients),
            JSON.stringify(newRecipe.instructions),
            newRecipe.prepTime || null,
            newRecipe.cookTime || null,
            newRecipe.servings,
            JSON.stringify(newRecipe.tags || []),
            newRecipe.imageUrl || '',
            newRecipe.isPublic ? 1 : 0,
            newRecipe.isFavorite ? 1 : 0,
            newRecipe.rating || null,
            JSON.stringify(newRecipe.nutritionPerServing),
          ]
        );

        await syncService.queueForSync('recipes', 'INSERT', newRecipe);
      } else {
        // Fallback to AsyncStorage
        await this.saveToStorage(newRecipe);
      }

      return newRecipe;
    } catch (error) {
      Alert.alert('Error', 'Failed to create recipe. Please try again.');

      console.error('Failed to create recipe:', error);
      throw error;
    }
  }

  // Get user's recipes
  async getUserRecipes(filter?: RecipeFilter): Promise<Recipe[]> {
    try {
      const db = getSafeDatabase();

      if (!db) {
        return this.getRecipesFromStorage(filter);
      }

      let query = 'SELECT * FROM recipes WHERE userId = ?';
      const params: any[] = [this.currentUserId || '1'];

      if (filter) {
        if (filter.category) {
          query += ' AND category = ?';
          params.push(filter.category);
        }
        if (filter.isFavorite !== undefined) {
          query += ' AND isFavorite = ?';
          params.push(filter.isFavorite ? 1 : 0);
        }
        if (filter.searchQuery) {
          query += ' AND (name LIKE ? OR description LIKE ?)';
          const searchPattern = `%${filter.searchQuery}%`;
          params.push(searchPattern, searchPattern);
        }
      }

      query += ' ORDER BY updatedAt DESC';

      const rows = await db.getAllAsync(query, params) as any[];

      const recipes = rows.map(row => ({
        ...row,
        ingredients: JSON.parse(row.ingredients),
        instructions: JSON.parse(row.instructions),
        tags: JSON.parse(row.tags || '[]'),
        nutritionPerServing: JSON.parse(row.nutritionPerServing),
        isPublic: row.isPublic === 1,
        isFavorite: row.isFavorite === 1,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }));

      // Apply additional filters that are harder to do in SQL
      let filtered = recipes;

      if (filter?.maxCalories) {
        filtered = filtered.filter(r => r.nutritionPerServing.calories <= filter.maxCalories!);
      }

      if (filter?.maxPrepTime) {
        filtered = filtered.filter(r => (r.prepTime || 0) + (r.cookTime || 0) <= filter.maxPrepTime!);
      }

      if (filter?.tags && filter.tags.length > 0) {
        filtered = filtered.filter(r =>
          filter.tags!.some(tag => r.tags?.includes(tag))
        );
      }

      return filtered;
    } catch (error) {
      Alert.alert('Error', 'Failed to get user recipes. Please try again.');

      console.error('Failed to get user recipes:', error);
      return [];
    }
  }

  // Get single recipe
  async getRecipe(recipeId: string): Promise<Recipe | null> {
    try {
      const db = getSafeDatabase();

      if (!db) {
        const recipes = await this.getRecipesFromStorage();
        return recipes.find(r => r.id === recipeId) || null;
      }

      const row = await db.getFirstAsync(
        'SELECT * FROM recipes WHERE id = ?',
        [recipeId]
      ) as any;

      if (!row) return null;

      return {
        ...row,
        ingredients: JSON.parse(row.ingredients),
        instructions: JSON.parse(row.instructions),
        tags: JSON.parse(row.tags || '[]'),
        nutritionPerServing: JSON.parse(row.nutritionPerServing),
        isPublic: row.isPublic === 1,
        isFavorite: row.isFavorite === 1,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      };
    } catch (error) {
      Alert.alert('Error', 'Failed to get recipe. Please try again.');

      console.error('Failed to get recipe:', error);
      return null;
    }
  }

  // Update recipe
  async updateRecipe(recipeId: string, updates: Partial<Recipe>): Promise<Recipe | null> {
    try {
      const db = getSafeDatabase();
      const existingRecipe = await this.getRecipe(recipeId);

      if (!existingRecipe) return null;

      const updatedRecipe = {
        ...existingRecipe,
        ...updates,
        updatedAt: new Date(),
      };

      // Recalculate nutrition if ingredients changed
      if (updates.ingredients || updates.servings) {
        const totalNutrition = updatedRecipe.ingredients.reduce((acc, ingredient) => ({
          calories: acc.calories + ingredient.calories,
          protein: acc.protein + ingredient.protein,
          carbs: acc.carbs + ingredient.carbs,
          fat: acc.fat + ingredient.fat,
          fiber: (acc.fiber || 0) + (ingredient.fiber || 0),
          sugar: (acc.sugar || 0) + (ingredient.sugar || 0),
          sodium: (acc.sodium || 0) + (ingredient.sodium || 0),
        }), {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
        });

        updatedRecipe.nutritionPerServing = {
          calories: Math.round(totalNutrition.calories / updatedRecipe.servings),
          protein: Math.round(totalNutrition.protein / updatedRecipe.servings * 10) / 10,
          carbs: Math.round(totalNutrition.carbs / updatedRecipe.servings * 10) / 10,
          fat: Math.round(totalNutrition.fat / updatedRecipe.servings * 10) / 10,
          fiber: totalNutrition.fiber ? Math.round(totalNutrition.fiber / updatedRecipe.servings * 10) / 10 : undefined,
          sugar: totalNutrition.sugar ? Math.round(totalNutrition.sugar / updatedRecipe.servings * 10) / 10 : undefined,
          sodium: totalNutrition.sodium ? Math.round(totalNutrition.sodium / updatedRecipe.servings) : undefined,
        };
      }

      if (db) {
        const setClause: string[] = [];
        const values: any[] = [];

        if (updates.name !== undefined) {
          setClause.push('name = ?');
          values.push(updates.name);
        }
        if (updates.description !== undefined) {
          setClause.push('description = ?');
          values.push(updates.description);
        }
        if (updates.ingredients !== undefined) {
          setClause.push('ingredients = ?');
          values.push(JSON.stringify(updates.ingredients));
        }
        if (updates.instructions !== undefined) {
          setClause.push('instructions = ?');
          values.push(JSON.stringify(updates.instructions));
        }
        if (updates.isFavorite !== undefined) {
          setClause.push('isFavorite = ?');
          values.push(updates.isFavorite ? 1 : 0);
        }
        if (updates.rating !== undefined) {
          setClause.push('rating = ?');
          values.push(updates.rating);
        }

        setClause.push('nutritionPerServing = ?');
        values.push(JSON.stringify(updatedRecipe.nutritionPerServing));

        setClause.push('updatedAt = datetime("now")');
        setClause.push('syncStatus = "pending"');
        values.push(recipeId);

        await db.runAsync(
          `UPDATE recipes SET ${setClause.join(', ')} WHERE id = ?`,
          values
        );

        await syncService.queueForSync('recipes', 'UPDATE', updatedRecipe);
      } else {
        await this.updateInStorage(updatedRecipe);
      }

      return updatedRecipe;
    } catch (error) {
      Alert.alert('Error', 'Failed to update recipe. Please try again.');

      console.error('Failed to update recipe:', error);
      return null;
    }
  }

  // Delete recipe
  async deleteRecipe(recipeId: string): Promise<boolean> {
    try {
      const db = getSafeDatabase();

      if (db) {
        await db.runAsync('DELETE FROM recipes WHERE id = ?', [recipeId]);
        await syncService.queueForSync('recipes', 'DELETE', { id: recipeId });
      } else {
        await this.deleteFromStorage(recipeId);
      }

      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to delete recipe. Please try again.');

      console.error('Failed to delete recipe:', error);
      return false;
    }
  }

  // Toggle favorite status
  async toggleFavorite(recipeId: string): Promise<boolean> {
    try {
      const recipe = await this.getRecipe(recipeId);
      if (!recipe) return false;

      await this.updateRecipe(recipeId, { isFavorite: !recipe.isFavorite });
      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to toggle favorite. Please try again.');

      console.error('Failed to toggle favorite:', error);
      return false;
    }
  }

  // Get public recipes (from community)
  async getPublicRecipes(filter?: RecipeFilter): Promise<Recipe[]> {
    try {
      const db = getSafeDatabase();
      if (!db) return [];

      let query = 'SELECT * FROM recipes WHERE isPublic = 1';
      const params: any[] = [];

      if (filter) {
        if (filter.category) {
          query += ' AND category = ?';
          params.push(filter.category);
        }
        if (filter.searchQuery) {
          query += ' AND (name LIKE ? OR description LIKE ?)';
          const searchPattern = `%${filter.searchQuery}%`;
          params.push(searchPattern, searchPattern);
        }
      }

      query += ' ORDER BY rating DESC, updatedAt DESC LIMIT 50';

      const rows = await db.getAllAsync(query, params) as any[];

      return rows.map(row => ({
        ...row,
        ingredients: JSON.parse(row.ingredients),
        instructions: JSON.parse(row.instructions),
        tags: JSON.parse(row.tags || '[]'),
        nutritionPerServing: JSON.parse(row.nutritionPerServing),
        isPublic: true,
        isFavorite: row.isFavorite === 1,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }));
    } catch (error) {
      Alert.alert('Error', 'Failed to get public recipes. Please try again.');

      console.error('Failed to get public recipes:', error);
      return [];
    }
  }

  // Import recipe from URL (future feature)
  async importRecipeFromUrl(url: string): Promise<Recipe | null> {
    // TODO: Implement recipe scraping from popular recipe sites
    console.log('Recipe import from URL not yet implemented');
    return null;
  }

  // Generate shopping list from recipes
  async generateShoppingList(recipeIds: string[]): Promise<Array<{
    foodName: string;
    totalQuantity: number;
    unit: string;
    recipes: string[];
  }>> {
    try {
      const recipes = await Promise.all(recipeIds.map(id => this.getRecipe(id)));
      const shoppingList = new Map<string, {
        foodName: string;
        totalQuantity: number;
        unit: string;
        recipes: string[];
      }>();

      recipes.forEach(recipe => {
        if (!recipe) return;

        recipe.ingredients.forEach(ingredient => {
          const key = `${ingredient.foodName}_${ingredient.unit}`;

          if (shoppingList.has(key)) {
            const item = shoppingList.get(key)!;
            item.totalQuantity += ingredient.quantity;
            item.recipes.push(recipe.name);
          } else {
            shoppingList.set(key, {
              foodName: ingredient.foodName,
              totalQuantity: ingredient.quantity,
              unit: ingredient.unit,
              recipes: [recipe.name],
            });
          }
        });
      });

      return Array.from(shoppingList.values()).sort((a, b) =>
        a.foodName.localeCompare(b.foodName)
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to generate shopping list. Please try again.');

      console.error('Failed to generate shopping list:', error);
      return [];
    }
  }

  // Storage fallback methods
  private async getRecipesFromStorage(filter?: RecipeFilter): Promise<Recipe[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      const recipes: Recipe[] = stored ? JSON.parse(stored) : [];

      let filtered = recipes.filter(r => r.userId === this.currentUserId);

      if (filter) {
        if (filter.category) {
          filtered = filtered.filter(r => r.category === filter.category);
        }
        if (filter.isFavorite !== undefined) {
          filtered = filtered.filter(r => r.isFavorite === filter.isFavorite);
        }
        if (filter.searchQuery) {
          const query = filter.searchQuery.toLowerCase();
          filtered = filtered.filter(r =>
            r.name.toLowerCase().includes(query) ||
            r.description?.toLowerCase().includes(query)
          );
        }
        if (filter.maxCalories) {
          filtered = filtered.filter(r => r.nutritionPerServing.calories <= filter.maxCalories!);
        }
        if (filter.maxPrepTime) {
          filtered = filtered.filter(r => (r.prepTime || 0) + (r.cookTime || 0) <= filter.maxPrepTime!);
        }
        if (filter.tags && filter.tags.length > 0) {
          filtered = filtered.filter(r =>
            filter.tags!.some(tag => r.tags?.includes(tag))
          );
        }
      }

      return filtered;
    } catch (error) {
      Alert.alert('Error', 'Failed to get recipes from storage. Please try again.');

      console.error('Failed to get recipes from storage:', error);
      return [];
    }
  }

  private async saveToStorage(recipe: Recipe): Promise<void> {
    const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
    const recipes: Recipe[] = stored ? JSON.parse(stored) : [];
    recipes.push(recipe);
    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(recipes));
  }

  private async updateInStorage(recipe: Recipe): Promise<void> {
    const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
    const recipes: Recipe[] = stored ? JSON.parse(stored) : [];
    const index = recipes.findIndex(r => r.id === recipe.id);
    if (index >= 0) {
      recipes[index] = recipe;
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(recipes));
    }
  }

  private async deleteFromStorage(recipeId: string): Promise<void> {
    const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
    const recipes: Recipe[] = stored ? JSON.parse(stored) : [];
    const filtered = recipes.filter(r => r.id !== recipeId);
    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }
}

export const recipeService = new RecipeService();