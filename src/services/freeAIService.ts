import AsyncStorage from '@react-native-async-storage/async-storage';
import { HfInference } from '@huggingface/inference';
import { workoutService } from './workoutService';
import { firebaseDailyDataService } from './firebaseDailyDataService';
// @ts-ignore
import { HUGGING_FACE_TOKEN } from '@env';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIResponse {
  message: string;
  actions?: any[];
  model?: string;
}

class FreeAIService {
  private hf: HfInference | null = null;
  private conversationHistory: Message[] = [];

  // API token loaded from environment variables only
  private huggingFaceToken: string = HUGGING_FACE_TOKEN || '';

  // FREE Models on Hugging Face
  private readonly FREE_MODELS = {
    chat: 'microsoft/DialoGPT-medium', // Free conversational AI
    fitness: 'microsoft/BioGPT', // Medical/health focused
    small: 'facebook/blenderbot-400M-distill', // Fast responses
    llama: 'meta-llama/Llama-2-7b-chat-hf', // Powerful but may have queue
    mistral: 'mistralai/Mistral-7B-Instruct-v0.1', // Very good free model
  };

  constructor() {
    // Initialize with the shared token immediately
    console.log('Initializing AI with token:', this.huggingFaceToken ? 'Token found' : 'No token');
    if (this.huggingFaceToken && this.huggingFaceToken !== 'hf_YOUR_TOKEN_HERE') {
      this.hf = new HfInference(this.huggingFaceToken);
      console.log('Hugging Face client initialized');
    }
    this.loadSettings();
    this.loadConversationHistory();
  }

  private async loadSettings() {
    try {
      // Optional: Allow override with user's own token if they want
      const userToken = await AsyncStorage.getItem('huggingface_token');
      if (userToken) {
        this.huggingFaceToken = userToken;
        this.hf = new HfInference(userToken);
      } else if (this.huggingFaceToken && this.huggingFaceToken !== 'hf_YOUR_TOKEN_HERE') {
        // Use the embedded token for all users
        this.hf = new HfInference(this.huggingFaceToken);
      }
    } catch (error) {
      Alert.alert('Error', 'Loading settings. Please try again.');

      console.error('Error loading settings:', error);
    }
  }

  async setHuggingFaceToken(token: string) {
    this.huggingFaceToken = token;
    this.hf = new HfInference(token);
    await AsyncStorage.setItem('huggingface_token', token);
  }

  async processMessage(message: string, userId?: string): Promise<AIResponse> {
    // Add to history
    this.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });

    // Simple direct response - no context, no history, just action
    const response = await this.generateSmartLocalResponse(message, userId);
    return response;
  }

  private async handleLocally(message: string, userId?: string): Promise<any> {
    const lowerMessage = message.toLowerCase();
    let handled = false;
    let responseText = '';
    let actions = [];

    // Handle food logging
    if (this.isFoodMessage(lowerMessage)) {
      const foods = this.extractFoods(message);
      if (foods.length > 0) {
        const nutrition = this.calculateNutrition(foods);

        if (userId) {
          await firebaseDailyDataService.updateNutrition(userId, nutrition, 'add');
          actions.push({
            type: 'log_food',
            items: foods,
            nutrition: nutrition
          });
        }

        responseText = `✅ Logged: ${foods.join(', ')}\n`;
        responseText += `📊 ${nutrition.calories} cal, ${nutrition.protein}g protein, ${nutrition.carbs}g carbs, ${nutrition.fats}g fat`;
        handled = true;
      }
    }

    // Handle workout creation
    else if (lowerMessage.includes('create') && lowerMessage.includes('workout')) {
      const workoutType = this.extractWorkoutType(message);
      const workout = this.createWorkout(workoutType);

      await workoutService.createCustomWorkout(workout);
      actions.push({ type: 'create_workout', workout });

      responseText = `💪 Created ${workout.name}!\n\n`;
      workout.exercises.forEach((ex: any, i: number) => {
        responseText += `${i + 1}. ${ex.name} - ${ex.sets}x${ex.reps}\n`;
      });
      handled = true;
    }

    // Handle progress check
    else if (lowerMessage.includes('progress') || lowerMessage.includes('stats')) {
      if (userId) {
        const today = await firebaseDailyDataService.getTodayData(userId);
        if (today) {
          const calPercent = today.calories ? Math.round((today.calories.consumed / today.calories.target) * 100) : 0;
          const waterPercent = today.water ? Math.round((today.water.consumed / today.water.target) * 100) : 0;

          responseText = `📈 Today's Progress:\n\n`;
          responseText += `🍽 Calories: ${calPercent}% (${today.calories?.consumed || 0}/${today.calories?.target || 2000})\n`;
          responseText += `💧 Water: ${waterPercent}% (${today.water?.consumed || 0}/${today.water?.target || 2000}ml)\n`;
          responseText += today.workoutsCompleted && today.workoutsCompleted > 0 ? `✅ Workout Complete!\n` : `⏳ Workout Pending\n`;

          if (calPercent > 80) responseText += `\n🎯 Great job on your nutrition!`;
          else if (calPercent < 40) responseText += `\n⚠️ Don't forget to fuel your body!`;

          handled = true;
        }
      }
    }

    // Handle water tracking
    else if (lowerMessage.includes('water') || lowerMessage.includes('drank')) {
      const amount = this.extractNumber(message) || 250;
      actions.push({ type: 'log_water', amount });
      responseText = `💧 Logged ${amount}ml of water. Stay hydrated!`;
      handled = true;
    }

    return { handled, message: responseText, actions };
  }

  private async processWithHuggingFace(message: string, userId?: string): Promise<AIResponse> {
    // Hugging Face models are not working with the current token
    // Skip API calls to avoid errors and use local AI instead
    throw new Error('Hugging Face unavailable - using local AI');
  }

  private async generateSmartLocalResponse(message: string, userId?: string): Promise<AIResponse> {
    const lowerMessage = message.toLowerCase();
    let response = '';

    // Basic conversational responses
    if (this.isGreeting(lowerMessage)) {
      const greetings = ["Hello!", "Hi there!", "Hey!", "Hi! How can I help?"];
      response = greetings[Math.floor(Math.random() * greetings.length)];
    }
    else if (lowerMessage.includes('how are you')) {
      response = "I'm doing well, thank you for asking!";
    }
    else if (lowerMessage.includes('thank')) {
      response = "You're welcome!";
    }
    else if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye')) {
      response = "Goodbye! Have a great day!";
    }
    else if (lowerMessage.includes('what') && lowerMessage.includes('your name')) {
      response = "I'm your AI assistant.";
    }
    else if (lowerMessage.includes('help')) {
      response = "I'm here to help! Ask me anything.";
    }
    else if (lowerMessage.includes('weather')) {
      response = "I don't have access to weather data, but you can check your weather app!";
    }
    else if (lowerMessage.includes('time')) {
      const now = new Date();
      response = `It's ${now.toLocaleTimeString()}.`;
    }
    else if (lowerMessage.includes('date')) {
      const now = new Date();
      response = `Today is ${now.toLocaleDateString()}.`;
    }
    else if (lowerMessage.includes('joke')) {
      const jokes = [
        "Why don't scientists trust atoms? Because they make up everything!",
        "What do you call a bear with no teeth? A gummy bear!",
        "Why did the scarecrow win an award? He was outstanding in his field!"
      ];
      response = jokes[Math.floor(Math.random() * jokes.length)];
    }
    // Simple catch-all response
    else {
      const responses = [
        "That's interesting! Tell me more.",
        "I see. How can I assist you with that?",
        "Could you elaborate on that?",
        "I understand. What would you like to know?",
        "Interesting question! Let me think about that.",
        "That's a good point.",
        "I'm listening. Please continue."
      ];
      response = responses[Math.floor(Math.random() * responses.length)];
    }

    return { message: response, model: 'Assistant' };
  }

  // Helper methods
  private isFoodMessage(message: string): boolean {
    const foodKeywords = ['ate', 'had', 'eating', 'breakfast', 'lunch', 'dinner', 'snack', 'meal'];
    return foodKeywords.some(keyword => message.includes(keyword));
  }

  private isGreeting(message: string): boolean {
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good evening'];
    return greetings.some(g => message.includes(g));
  }

  private extractFoods(message: string): string[] {
    const foodDB = [
      'chicken', 'rice', 'broccoli', 'steak', 'salmon', 'eggs', 'oatmeal',
      'banana', 'apple', 'salad', 'sandwich', 'pasta', 'pizza', 'burger',
      'protein shake', 'yogurt', 'toast', 'cereal', 'fish', 'turkey',
      'sweet potato', 'quinoa', 'avocado', 'nuts', 'almonds', 'milk'
    ];

    const found: string[] = [];
    const lower = message.toLowerCase();

    for (const food of foodDB) {
      if (lower.includes(food)) {
        found.push(food);
      }
    }

    return found;
  }

  private calculateNutrition(foods: string[]): any {
    const nutritionDB: { [key: string]: any } = {
      'chicken': { calories: 165, protein: 31, carbs: 0, fats: 4 },
      'rice': { calories: 206, protein: 4, carbs: 45, fats: 1 },
      'broccoli': { calories: 31, protein: 3, carbs: 6, fats: 0 },
      'steak': { calories: 271, protein: 25, carbs: 0, fats: 19 },
      'salmon': { calories: 208, protein: 20, carbs: 0, fats: 13 },
      'eggs': { calories: 155, protein: 13, carbs: 1, fats: 11 },
      'oatmeal': { calories: 158, protein: 6, carbs: 27, fats: 3 },
      'banana': { calories: 105, protein: 1, carbs: 27, fats: 0 },
      'apple': { calories: 95, protein: 0, carbs: 25, fats: 0 },
      'salad': { calories: 50, protein: 2, carbs: 10, fats: 1 },
      'sandwich': { calories: 350, protein: 15, carbs: 45, fats: 12 },
      'pasta': { calories: 220, protein: 8, carbs: 43, fats: 1 },
      'pizza': { calories: 285, protein: 12, carbs: 36, fats: 10 },
      'burger': { calories: 540, protein: 25, carbs: 40, fats: 27 },
      'protein shake': { calories: 200, protein: 30, carbs: 10, fats: 3 },
      'yogurt': { calories: 150, protein: 8, carbs: 20, fats: 4 },
      'toast': { calories: 75, protein: 3, carbs: 14, fats: 1 },
      'cereal': { calories: 150, protein: 3, carbs: 30, fats: 2 },
      'fish': { calories: 206, protein: 22, carbs: 0, fats: 12 },
      'turkey': { calories: 135, protein: 24, carbs: 0, fats: 3 },
      'sweet potato': { calories: 86, protein: 2, carbs: 20, fats: 0 },
      'quinoa': { calories: 120, protein: 4, carbs: 21, fats: 2 },
      'avocado': { calories: 160, protein: 2, carbs: 9, fats: 15 },
      'nuts': { calories: 170, protein: 6, carbs: 6, fats: 15 },
      'almonds': { calories: 164, protein: 6, carbs: 6, fats: 14 },
      'milk': { calories: 150, protein: 8, carbs: 12, fats: 8 }
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

  private extractWorkoutType(message: string): string {
    const types = ['chest', 'back', 'legs', 'arms', 'shoulders', 'abs', 'cardio', 'full body'];
    const lower = message.toLowerCase();

    for (const type of types) {
      if (lower.includes(type)) return type;
    }

    return 'full body';
  }

  private createWorkout(type: string): any {
    const workouts: { [key: string]: any } = {
      'chest': {
        name: 'Chest Blast',
        exercises: [
          { name: 'Push-ups', sets: 3, reps: 15, rest: 60 },
          { name: 'Dumbbell Press', sets: 4, reps: 10, rest: 90 },
          { name: 'Chest Fly', sets: 3, reps: 12, rest: 60 },
          { name: 'Diamond Push-ups', sets: 3, reps: 10, rest: 60 }
        ],
        duration: 30
      },
      'back': {
        name: 'Back Builder',
        exercises: [
          { name: 'Pull-ups', sets: 3, reps: 8, rest: 90 },
          { name: 'Bent Row', sets: 4, reps: 10, rest: 90 },
          { name: 'Lat Pulldown', sets: 3, reps: 12, rest: 60 },
          { name: 'Face Pulls', sets: 3, reps: 15, rest: 60 }
        ],
        duration: 35
      },
      'legs': {
        name: 'Leg Day',
        exercises: [
          { name: 'Squats', sets: 4, reps: 10, rest: 90 },
          { name: 'Lunges', sets: 3, reps: 12, rest: 60 },
          { name: 'Leg Curls', sets: 3, reps: 12, rest: 60 },
          { name: 'Calf Raises', sets: 4, reps: 15, rest: 45 }
        ],
        duration: 40
      },
      'full body': {
        name: 'Total Body',
        exercises: [
          { name: 'Burpees', sets: 3, reps: 10, rest: 60 },
          { name: 'Squats', sets: 3, reps: 15, rest: 60 },
          { name: 'Push-ups', sets: 3, reps: 12, rest: 60 },
          { name: 'Mountain Climbers', sets: 3, reps: 20, rest: 45 },
          { name: 'Plank', sets: 3, reps: 45, rest: 45 }
        ],
        duration: 25
      }
    };

    return workouts[type] || workouts['full body'];
  }

  private extractNumber(message: string): number | null {
    const match = message.match(/\d+/);
    return match ? parseInt(match[0]) : null;
  }

  private extractTopic(message: string): string {
    if (message.toLowerCase().includes('workout')) return 'workouts';
    if (message.toLowerCase().includes('food') || message.toLowerCase().includes('eat')) return 'nutrition';
    if (message.toLowerCase().includes('weight')) return 'weight management';
    if (message.toLowerCase().includes('muscle')) return 'muscle building';
    return 'fitness';
  }

  private async buildContext(userId?: string): Promise<string> {
    if (!userId) return '';

    try {
      const today = await firebaseDailyDataService.getTodayData(userId);
      if (today) {
        return `User has consumed ${today.calories?.consumed || 0} calories today. `;
      }
    } catch {}

    return '';
  }

  private cleanAIResponse(text: string): string {
    // Remove the prompt from the response
    let cleaned = text;

    // Remove any repeated prompts
    cleaned = cleaned.replace(/^(Human:|User:|Question:|Q:|Assistant:|Answer:|A:).*\n?/gmi, '');

    // Remove the original question if it appears in response
    const lines = cleaned.split('\n');
    const assistantIndex = lines.findIndex(line => line.includes('Assistant:') || line.includes('Answer:'));
    if (assistantIndex !== -1) {
      cleaned = lines.slice(assistantIndex + 1).join('\n');
    }

    // Clean up extra whitespace
    cleaned = cleaned.trim();

    // If response is too short or generic, return empty to trigger fallback
    if (cleaned.length < 10 || cleaned.toLowerCase().includes('i am a language model')) {
      return '';
    }

    return cleaned;
  }

  private addContextualInfo(message: string): string {
    // Add relevant tips based on the question to make responses more varied
    const tips = [
      "\n\n💡 Quick tip: Consistency is key to seeing results!",
      "\n\n💪 Remember: Progressive overload helps build strength over time.",
      "\n\n🎯 Pro tip: Track your progress to stay motivated!",
      "\n\n⚡ Did you know? Proper form is more important than heavy weight.",
      "\n\n🏃 Fitness fact: Rest days are when your muscles actually grow!",
      "\n\n🥗 Nutrition tip: Protein helps with muscle recovery.",
      "\n\n💧 Stay hydrated - aim for 8 glasses of water daily!",
      "\n\n🎪 Balance is key - mix cardio and strength training."
    ];

    return tips[Math.floor(Math.random() * tips.length)];
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
}

export const freeAIService = new FreeAIService();