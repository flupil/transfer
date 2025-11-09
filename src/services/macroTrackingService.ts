import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { translate } from '../contexts/LanguageContext';

interface MacroEntry {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  timestamp: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

interface DailyMacros {
  date: string;
  targets: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  entries: MacroEntry[];
}

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
}

// Common food database
const FOOD_DATABASE: FoodItem[] = [
  // Proteins
  { name: 'Chicken Breast', calories: 165, protein: 31.0, carbs: 0.0, fat: 3.6, serving: '100g' },
  { name: 'Eggs', calories: 155, protein: 13.0, carbs: 1.1, fat: 11.0, serving: '2 large' },
  { name: 'Salmon', calories: 208, protein: 20.0, carbs: 0.0, fat: 13.0, serving: '100g' },
  { name: 'Greek Yogurt', calories: 100, protein: 10.0, carbs: 6.0, fat: 0.0, serving: '150g' },
  { name: 'Protein Shake', calories: 120, protein: 25.0, carbs: 3.0, fat: 1.0, serving: '1 scoop' },

  // Carbs
  { name: 'Brown Rice', calories: 216, protein: 5.0, carbs: 45.0, fat: 1.8, serving: '1 cup cooked' },
  { name: 'Oatmeal', calories: 150, protein: 5.0, carbs: 27.0, fat: 3.0, serving: '1/2 cup dry' },
  { name: 'Sweet Potato', calories: 103, protein: 2.3, carbs: 24.0, fat: 0.1, serving: '1 medium' },
  { name: 'Banana', calories: 105, protein: 1.3, carbs: 27.0, fat: 0.4, serving: '1 medium' },
  { name: 'Whole Wheat Bread', calories: 81, protein: 4.0, carbs: 14.0, fat: 1.0, serving: '1 slice' },

  // Fats
  { name: 'Avocado', calories: 234, protein: 3.0, carbs: 12.0, fat: 21.0, serving: '1 medium' },
  { name: 'Almonds', calories: 164, protein: 6.0, carbs: 6.0, fat: 14.0, serving: '28g' },
  { name: 'Peanut Butter', calories: 190, protein: 8.0, carbs: 8.0, fat: 16.0, serving: '2 tbsp' },
  { name: 'Olive Oil', calories: 119, protein: 0.0, carbs: 0.0, fat: 13.5, serving: '1 tbsp' },

  // Mixed
  { name: 'Protein Bar', calories: 200, protein: 20.0, carbs: 22.0, fat: 7.0, serving: '1 bar' },
  { name: 'Trail Mix', calories: 150, protein: 5.0, carbs: 15.0, fat: 10.0, serving: '30g' },
];

class MacroTrackingService {
  private readonly STORAGE_KEY = 'macroTracking';
  private readonly TARGETS_KEY = 'macroTargets';

  // Get default targets based on user profile
  getDefaultTargets(weight: number = 70, goal: 'lose' | 'maintain' | 'gain' = 'maintain'): DailyMacros['targets'] {
    let calorieMultiplier = 30; // maintain weight

    if (goal === 'lose') calorieMultiplier = 25;
    if (goal === 'gain') calorieMultiplier = 35;

    const calories = Math.round(weight * calorieMultiplier);
    const protein = Math.round(weight * 2); // 2g per kg
    const fat = Math.round(calories * 0.25 / 9); // 25% of calories from fat
    const carbs = Math.round((calories - (protein * 4) - (fat * 9)) / 4); // Rest from carbs

    return { calories, protein, carbs, fat };
  }

  // Get today's macro data
  async getTodayData(userId?: string): Promise<DailyMacros> {
    const today = format(new Date(), 'yyyy-MM-dd');
    console.log('Getting macro data for date:', today, 'userId:', userId);

    // Use AsyncStorage as single source of truth for macro tracking
    // Note: NutritionContext handles full food logging with Firebase/SQLite
    const allData = await this.getAllData();

    if (!allData[today]) {
      allData[today] = {
        date: today,
        targets: await this.getTargets(),
        consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        entries: [],
      };
    }

    return allData[today];
  }

  // Add food entry
  async addFood(
    food: Partial<MacroEntry> & { name: string; calories: number; protein: number; carbs: number; fat: number },
    meal: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'snack'
  ): Promise<DailyMacros> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const allData = await this.getAllData();

    if (!allData[today]) {
      allData[today] = {
        date: today,
        targets: await this.getTargets(),
        consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 },
        entries: [],
      };
    }

    const entry: MacroEntry = {
      id: Date.now().toString(),
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      timestamp: new Date().toISOString(),
      meal,
    };

    allData[today].entries.push(entry);
    allData[today].consumed.calories += entry.calories;
    allData[today].consumed.protein += entry.protein;
    allData[today].consumed.carbs += entry.carbs;
    allData[today].consumed.fat += entry.fat;

    await this.saveAllData(allData);
    return allData[today];
  }

  // Quick add from database
  async quickAddFood(foodName: string, meal: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'snack'): Promise<DailyMacros | null> {
    const food = FOOD_DATABASE.find(f => f.name.toLowerCase() === foodName.toLowerCase());
    if (!food) return null;

    return this.addFood(food, meal);
  }

  // Remove food entry
  async removeEntry(entryId: string): Promise<DailyMacros> {
    const today = format(new Date(), 'yyyy-MM-dd');
    const allData = await this.getAllData();

    if (allData[today]) {
      const entryIndex = allData[today].entries.findIndex(e => e.id === entryId);
      if (entryIndex !== -1) {
        const removedEntry = allData[today].entries[entryIndex];
        allData[today].consumed.calories -= removedEntry.calories;
        allData[today].consumed.protein -= removedEntry.protein;
        allData[today].consumed.carbs -= removedEntry.carbs;
        allData[today].consumed.fat -= removedEntry.fat;
        allData[today].entries.splice(entryIndex, 1);
        await this.saveAllData(allData);
      }
    }

    return allData[today];
  }

  // Clear all entries for today
  async clearTodayEntries(userId?: string): Promise<void> {
    const today = format(new Date(), 'yyyy-MM-dd');

    try {
      // Clear from database
      const db = getSafeDatabase();
      if (db && userId) {
        await db.runAsync(
          `DELETE FROM food_logs WHERE date = ? AND userId = ?`,
          [today, userId]
        );
        console.log('Cleared food logs from database for:', today);
      }

      // Clear from AsyncStorage
      const allData = await this.getAllData();
      if (allData[today]) {
        allData[today] = {
          date: today,
          targets: await this.getTargets(),
          consumed: { calories: 0, protein: 0, carbs: 0, fat: 0 },
          entries: [],
        };
        await this.saveAllData(allData);
      }

      console.log('Successfully cleared all entries for today');
    } catch (error) {
      Alert.alert('Error', 'Clearing today entries. Please try again.');

      console.error('Error clearing today entries:', error);
      throw error;
    }
  }

  // Update daily targets
  async updateTargets(targets: DailyMacros['targets']): Promise<void> {
    await AsyncStorage.setItem(this.TARGETS_KEY, JSON.stringify(targets));

    // Update today's targets
    const today = format(new Date(), 'yyyy-MM-dd');
    const allData = await this.getAllData();

    if (allData[today]) {
      allData[today].targets = targets;
      await this.saveAllData(allData);
    }
  }

  // Get targets
  async getTargets(): Promise<DailyMacros['targets']> {
    try {
      const targets = await AsyncStorage.getItem(this.TARGETS_KEY);
      return targets ? JSON.parse(targets) : this.getDefaultTargets();
    } catch {
      return this.getDefaultTargets();
    }
  }

  // Get weekly statistics
  async getWeeklyStats(): Promise<{
    averageCalories: number;
    averageProtein: number;
    averageCarbs: number;
    averageFat: number;
    daysOnTarget: number;
  }> {
    const allData = await this.getAllData();
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let daysOnTarget = 0;
    let daysCount = 0;

    for (let d = new Date(weekAgo); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = format(d, 'yyyy-MM-dd');
      if (allData[dateStr]) {
        const dayData = allData[dateStr];
        totalCalories += dayData.consumed.calories;
        totalProtein += dayData.consumed.protein;
        totalCarbs += dayData.consumed.carbs;
        totalFat += dayData.consumed.fat;
        daysCount++;

        // Check if within 10% of targets
        const calorieRatio = dayData.consumed.calories / dayData.targets.calories;
        const proteinRatio = dayData.consumed.protein / dayData.targets.protein;
        if (calorieRatio >= 0.9 && calorieRatio <= 1.1 && proteinRatio >= 0.9) {
          daysOnTarget++;
        }
      }
    }

    return {
      averageCalories: daysCount > 0 ? Math.round(totalCalories / daysCount) : 0,
      averageProtein: daysCount > 0 ? Math.round(totalProtein / daysCount) : 0,
      averageCarbs: daysCount > 0 ? Math.round(totalCarbs / daysCount) : 0,
      averageFat: daysCount > 0 ? Math.round(totalFat / daysCount) : 0,
      daysOnTarget,
    };
  }

  // Get food database
  getFoodDatabase(): FoodItem[] {
    return FOOD_DATABASE;
  }

  // Search foods
  searchFoods(query: string): FoodItem[] {
    return FOOD_DATABASE.filter(food =>
      food.name.toLowerCase().includes(query.toLowerCase())
    );
  }

  // Private helper methods
  private async getAllData(): Promise<{ [date: string]: DailyMacros }> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  }

  private async saveAllData(data: { [date: string]: DailyMacros }): Promise<void> {
    await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }
}

// Export singleton instance
export const macroTrackingService = new MacroTrackingService();

// Export convenience functions
export const getTodayMacros = (userId?: string) => macroTrackingService.getTodayData(userId);
export const addMacroFood = (food: any, meal?: any) => macroTrackingService.addFood(food, meal);
export const quickAddMacro = (foodName: string, meal?: any) => macroTrackingService.quickAddFood(foodName, meal);
export const updateMacroTargets = (targets: any) => macroTrackingService.updateTargets(targets);
export const getMacroStats = () => macroTrackingService.getWeeklyStats();
export const searchFoods = (query: string) => macroTrackingService.searchFoods(query);
export const getFoodDatabase = () => macroTrackingService.getFoodDatabase();
export const addMacroEntry = (entry: Omit<MacroEntry, 'id' | 'timestamp'>) => macroTrackingService.addFood(entry);
export const removeMacroEntry = (entryId: string) => macroTrackingService.removeEntry(entryId);
export const clearTodayMacros = (userId?: string) => macroTrackingService.clearTodayEntries(userId);