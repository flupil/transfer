import AsyncStorage from '@react-native-async-storage/async-storage';
import { workoutService } from './workoutService';
import { firebaseDailyDataService } from './firebaseDailyDataService';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

interface AIResponse {
  message: string;
  actions?: any[];
  aiUsed?: 'local' | 'gpt-3.5' | 'gpt-4';
}

class HybridAIService {
  private openaiApiKey: string = '';
  private conversationHistory: Message[] = [];
  private monthlyQuota = 0;
  private quotaUsed = 0;
  private useGPT4 = false;

  constructor() {
    this.loadSettings();
    this.loadConversationHistory();
  }

  private async loadSettings() {
    try {
      const key = await AsyncStorage.getItem('openai_api_key');
      if (key) this.openaiApiKey = key;

      const quota = await AsyncStorage.getItem('monthly_ai_quota');
      this.monthlyQuota = quota ? parseInt(quota) : 1000; // Default 1000 requests/month

      const used = await AsyncStorage.getItem('quota_used_this_month');
      this.quotaUsed = used ? parseInt(used) : 0;

      // Reset quota monthly
      const lastReset = await AsyncStorage.getItem('quota_last_reset');
      if (lastReset) {
        const lastResetDate = new Date(lastReset);
        const now = new Date();
        if (lastResetDate.getMonth() !== now.getMonth()) {
          this.quotaUsed = 0;
          await AsyncStorage.setItem('quota_used_this_month', '0');
          await AsyncStorage.setItem('quota_last_reset', now.toISOString());
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Loading settings. Please try again.');

      console.error('Error loading settings:', error);
    }
  }

  async setApiKey(apiKey: string) {
    this.openaiApiKey = apiKey;
    await AsyncStorage.setItem('openai_api_key', apiKey);
  }

  async processMessage(message: string, userId?: string): Promise<AIResponse> {
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    this.conversationHistory.push(userMessage);

    // Determine which AI to use based on complexity
    const complexity = this.assessComplexity(message);

    let response: AIResponse;

    if (complexity === 'simple') {
      // Use local AI for simple queries (FREE)
      response = await this.processLocally(message, userId);
    } else if (complexity === 'medium' && this.openaiApiKey && this.quotaUsed < this.monthlyQuota) {
      // Use GPT-3.5 for medium complexity (CHEAP)
      response = await this.processWithGPT35(message, userId) || await this.processLocally(message, userId);
    } else if (complexity === 'complex' && this.openaiApiKey && this.useGPT4 && this.quotaUsed < this.monthlyQuota / 10) {
      // Use GPT-4 sparingly for complex queries (EXPENSIVE)
      response = await this.processWithGPT4(message, userId) || await this.processWithGPT35(message, userId) || await this.processLocally(message, userId);
    } else {
      // Fallback to local AI when quota exceeded
      response = await this.processLocally(message, userId);

      if (this.quotaUsed >= this.monthlyQuota) {
        response.message = `[Quota exceeded - using local AI]\n${response.message}`;
      }
    }

    // Save conversation
    this.conversationHistory.push({
      role: 'assistant',
      content: response.message,
      timestamp: new Date()
    });

    await this.saveConversationHistory();

    // Update quota
    if (response.aiUsed !== 'local') {
      this.quotaUsed++;
      await AsyncStorage.setItem('quota_used_this_month', this.quotaUsed.toString());
    }

    return response;
  }

  private assessComplexity(message: string): 'simple' | 'medium' | 'complex' {
    const lowerMessage = message.toLowerCase();

    // Simple queries (can handle locally)
    const simplePatterns = [
      /^(hi|hello|hey|good morning|good evening)/i,
      /what.*time/i,
      /how are you/i,
      /thank/i,
      /start.*workout/i,
      /log.*water/i,
      /calories.*today/i,
      /show.*progress/i
    ];

    // Complex queries (need real AI)
    const complexPatterns = [
      /create.*workout.*for.*[specific requirements]/i,
      /analyze.*progress.*and.*suggest/i,
      /why.*should/i,
      /explain.*difference.*between/i,
      /personalized.*plan/i,
      /based on.*history/i,
      /compare/i,
      /optimize/i
    ];

    // Check for simple patterns
    if (simplePatterns.some(pattern => pattern.test(message))) {
      return 'simple';
    }

    // Check for complex patterns
    if (complexPatterns.some(pattern => pattern.test(lowerMessage))) {
      return 'complex';
    }

    // Check message length and word count
    const wordCount = message.split(' ').length;
    if (wordCount > 20) return 'complex';
    if (wordCount < 5) return 'simple';

    return 'medium';
  }

  private async processLocally(message: string, userId?: string): Promise<AIResponse> {
    const lowerMessage = message.toLowerCase();
    let response = '';
    let actions = [];

    // Smart local responses for common queries
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      const hour = new Date().getHours();
      if (hour < 12) response = "Good morning! Ready to crush your fitness goals today?";
      else if (hour < 17) response = "Good afternoon! How's your training going today?";
      else response = "Good evening! Let's review your progress today!";

    } else if (lowerMessage.includes('ate') || lowerMessage.includes('had') || lowerMessage.includes('lunch') || lowerMessage.includes('breakfast') || lowerMessage.includes('dinner')) {
      // Extract food items
      const foods = this.extractFoodItems(message);
      if (foods.length > 0) {
        const nutrition = this.estimateNutrition(foods);

        if (userId) {
          await firebaseDailyDataService.updateNutrition(userId, nutrition, 'add');
          actions.push({
            type: 'log_food',
            items: foods,
            nutrition: nutrition
          });
        }

        response = `I've logged your meal: ${foods.join(', ')}\n`;
        response += `Estimated: ${nutrition.calories} calories, ${nutrition.protein}g protein`;
      } else {
        response = "What did you eat? Tell me the specific foods and I'll log them for you.";
      }

    } else if (lowerMessage.includes('workout')) {
      if (lowerMessage.includes('create') || lowerMessage.includes('make')) {
        // Create basic workout
        const bodyPart = this.extractBodyPart(message);
        const workout = this.generateBasicWorkout(bodyPart);

        await workoutService.createCustomWorkout(workout);
        actions.push({ type: 'create_workout', workout: workout });

        response = `I've created a ${bodyPart} workout for you with ${workout.exercises.length} exercises. Ready to start?`;
      } else {
        response = "Would you like to start a workout, create a new one, or modify your existing plan?";
      }

    } else if (lowerMessage.includes('progress') || lowerMessage.includes('how am i doing')) {
      if (userId) {
        const todayData = await firebaseDailyDataService.getTodayData(userId);
        if (todayData) {
          const calorieProgress = todayData.calories ?
            Math.round((todayData.calories.consumed / todayData.calories.target) * 100) : 0;
          const waterProgress = todayData.water ?
            Math.round((todayData.water.consumed / todayData.water.target) * 100) : 0;

          response = `Today's Progress:\n`;
          response += `📊 Calories: ${calorieProgress}% of goal (${todayData.calories?.consumed || 0}/${todayData.calories?.target || 2000})\n`;
          response += `💧 Water: ${waterProgress}% of goal\n`;
          response += todayData.workoutCompleted ? `💪 Workout: ✅ Completed!\n` : `💪 Workout: Not yet - ready to start?\n`;

          if (calorieProgress < 50 && new Date().getHours() > 14) {
            response += "\nYou're behind on calories - make sure to fuel your body!";
          }
        } else {
          response = "Let me check your progress...";
        }
      } else {
        response = "Please log in to see your progress.";
      }

    } else if (lowerMessage.includes('water')) {
      const amount = this.extractNumber(message) || 250;
      if (userId) {
        // Log water intake
        actions.push({ type: 'log_water', amount: amount });
        response = `Logged ${amount}ml of water. Stay hydrated! 💧`;
      }

    } else if (lowerMessage.includes('motivat') || lowerMessage.includes('tired')) {
      const motivationalQuotes = [
        "The only bad workout is the one that didn't happen!",
        "Your body can stand almost anything. It's your mind you have to convince.",
        "Success starts with self-discipline.",
        "Every workout counts. Even the tough ones - especially the tough ones!",
        "You're stronger than you think!"
      ];
      response = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

    } else {
      // Default intelligent response
      response = "I can help you with:\n";
      response += "• Logging meals (just tell me what you ate)\n";
      response += "• Creating workouts\n";
      response += "• Tracking progress\n";
      response += "• Staying motivated\n";
      response += "\nWhat would you like to do?";
    }

    return {
      message: response,
      actions: actions,
      aiUsed: 'local'
    };
  }

  private async processWithGPT35(message: string, userId?: string): Promise<AIResponse | null> {
    if (!this.openaiApiKey) return null;

    try {
      const context = await this.getUserContext(userId);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are a fitness AI assistant. Be concise and helpful. Current user data: ${JSON.stringify(context)}`
            },
            ...this.conversationHistory.slice(-5).map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          ],
          temperature: 0.7,
          max_tokens: 200 // Keep responses short to save costs
        })
      });

      if (!response.ok) return null;

      const data = await response.json();

      return {
        message: data.choices[0].message.content,
        aiUsed: 'gpt-3.5'
      };
    } catch (error) {
      Alert.alert('Error', 'GPT-3.5 error. Please try again.');

      console.error('GPT-3.5 error:', error);
      return null;
    }
  }

  private async processWithGPT4(message: string, userId?: string): Promise<AIResponse | null> {
    // Similar to GPT-3.5 but with gpt-4-turbo-preview model
    // Only used for complex queries to save costs
    return null; // Implement only if really needed
  }

  private async getUserContext(userId?: string): Promise<any> {
    if (!userId) return {};

    try {
      const todayData = await firebaseDailyDataService.getTodayData(userId);
      return {
        todayStats: todayData,
        time: new Date().toISOString()
      };
    } catch {
      return {};
    }
  }

  private extractFoodItems(message: string): string[] {
    const commonFoods = {
      'chicken': true, 'rice': true, 'salad': true, 'eggs': true,
      'oatmeal': true, 'banana': true, 'apple': true, 'sandwich': true,
      'pasta': true, 'steak': true, 'fish': true, 'salmon': true,
      'broccoli': true, 'vegetables': true, 'protein shake': true,
      'yogurt': true, 'toast': true, 'coffee': true, 'pizza': true
    };

    const words = message.toLowerCase().split(/\s+/);
    const foods: string[] = [];

    for (let i = 0; i < words.length; i++) {
      // Check for two-word foods
      if (i < words.length - 1) {
        const twoWord = `${words[i]} ${words[i + 1]}`;
        if (commonFoods[twoWord]) {
          foods.push(twoWord);
          i++; // Skip next word
          continue;
        }
      }

      // Check single word foods
      if (commonFoods[words[i]]) {
        foods.push(words[i]);
      }
    }

    return foods;
  }

  private estimateNutrition(foods: string[]): any {
    // Basic nutrition database
    const nutritionDB: { [key: string]: any } = {
      'chicken': { calories: 165, protein: 31, carbs: 0, fats: 4 },
      'rice': { calories: 206, protein: 4, carbs: 45, fats: 1 },
      'salad': { calories: 50, protein: 2, carbs: 10, fats: 1 },
      'eggs': { calories: 155, protein: 13, carbs: 1, fats: 11 },
      'oatmeal': { calories: 158, protein: 6, carbs: 27, fats: 3 },
      'banana': { calories: 105, protein: 1, carbs: 27, fats: 0 },
      'apple': { calories: 95, protein: 0, carbs: 25, fats: 0 },
      'sandwich': { calories: 350, protein: 15, carbs: 45, fats: 12 },
      'pasta': { calories: 220, protein: 8, carbs: 43, fats: 1 },
      'steak': { calories: 271, protein: 25, carbs: 0, fats: 19 },
      'fish': { calories: 206, protein: 22, carbs: 0, fats: 12 },
      'salmon': { calories: 208, protein: 20, carbs: 0, fats: 13 },
      'broccoli': { calories: 31, protein: 3, carbs: 6, fats: 0 },
      'vegetables': { calories: 50, protein: 2, carbs: 10, fats: 0 },
      'protein shake': { calories: 200, protein: 30, carbs: 10, fats: 3 },
      'yogurt': { calories: 150, protein: 8, carbs: 20, fats: 4 },
      'toast': { calories: 75, protein: 3, carbs: 14, fats: 1 },
      'coffee': { calories: 5, protein: 0, carbs: 1, fats: 0 },
      'pizza': { calories: 285, protein: 12, carbs: 36, fats: 10 }
    };

    let totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };

    for (const food of foods) {
      const nutrition = nutritionDB[food] || { calories: 100, protein: 5, carbs: 15, fats: 3 };
      totals.calories += nutrition.calories;
      totals.protein += nutrition.protein;
      totals.carbs += nutrition.carbs;
      totals.fats += nutrition.fats;
    }

    return totals;
  }

  private extractBodyPart(message: string): string {
    const parts = ['chest', 'back', 'legs', 'arms', 'shoulders', 'abs', 'full body'];
    const lower = message.toLowerCase();

    for (const part of parts) {
      if (lower.includes(part)) return part;
    }

    return 'full body';
  }

  private extractNumber(message: string): number | null {
    const match = message.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }

  private generateBasicWorkout(bodyPart: string): any {
    const workouts: { [key: string]: any } = {
      'chest': {
        name: 'Chest Day',
        exercises: [
          { name: 'Push-ups', sets: 3, reps: 15, rest: 60 },
          { name: 'Bench Press', sets: 4, reps: 10, rest: 90 },
          { name: 'Chest Fly', sets: 3, reps: 12, rest: 60 },
          { name: 'Incline Press', sets: 3, reps: 10, rest: 90 }
        ]
      },
      'back': {
        name: 'Back Day',
        exercises: [
          { name: 'Pull-ups', sets: 3, reps: 8, rest: 90 },
          { name: 'Bent-over Row', sets: 4, reps: 10, rest: 90 },
          { name: 'Lat Pulldown', sets: 3, reps: 12, rest: 60 },
          { name: 'Deadlift', sets: 3, reps: 8, rest: 120 }
        ]
      },
      'legs': {
        name: 'Leg Day',
        exercises: [
          { name: 'Squats', sets: 4, reps: 10, rest: 90 },
          { name: 'Lunges', sets: 3, reps: 12, rest: 60 },
          { name: 'Leg Press', sets: 3, reps: 12, rest: 90 },
          { name: 'Calf Raises', sets: 3, reps: 15, rest: 60 }
        ]
      },
      'full body': {
        name: 'Full Body Workout',
        exercises: [
          { name: 'Burpees', sets: 3, reps: 10, rest: 60 },
          { name: 'Squats', sets: 3, reps: 12, rest: 60 },
          { name: 'Push-ups', sets: 3, reps: 15, rest: 60 },
          { name: 'Plank', sets: 3, reps: 60, rest: 60 }
        ]
      }
    };

    return workouts[bodyPart] || workouts['full body'];
  }

  private async loadConversationHistory() {
    try {
      const history = await AsyncStorage.getItem('ai_conversation_history');
      if (history) {
        this.conversationHistory = JSON.parse(history);
      }
    } catch (error) {
      Alert.alert('Error', 'Loading conversation history. Please try again.');

      console.error('Error loading conversation history:', error);
    }
  }

  private async saveConversationHistory() {
    try {
      if (this.conversationHistory.length > 50) {
        this.conversationHistory = this.conversationHistory.slice(-50);
      }
      await AsyncStorage.setItem('ai_conversation_history', JSON.stringify(this.conversationHistory));
    } catch (error) {
      Alert.alert('Error', 'Saving conversation history. Please try again.');

      console.error('Error saving conversation history:', error);
    }
  }

  async clearHistory() {
    this.conversationHistory = [];
    await AsyncStorage.removeItem('ai_conversation_history');
  }

  async getQuotaStatus(): Promise<{ used: number, total: number, remaining: number }> {
    return {
      used: this.quotaUsed,
      total: this.monthlyQuota,
      remaining: this.monthlyQuota - this.quotaUsed
    };
  }
}

export const hybridAIService = new HybridAIService();