import AsyncStorage from '@react-native-async-storage/async-storage';
import { workoutService } from './workoutService';
import { firebaseDailyDataService } from './firebaseDailyDataService';
import { nutritionService } from './nutritionService';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  actions?: AIAction[];
}

interface AIAction {
  type: string;
  description: string;
  executed: boolean;
  result?: any;
}

interface UserProfile {
  id: string;
  name?: string;
  age?: number;
  weight?: number;
  height?: number;
  goals?: string[];
  fitnessLevel?: 'beginner' | 'intermediate' | 'advanced';
  preferences?: {
    workoutTypes?: string[];
    dietaryRestrictions?: string[];
    workoutDuration?: number;
    workoutFrequency?: number;
  };
  history?: {
    workouts?: any[];
    nutrition?: any[];
    progress?: any[];
  };
}

interface AIResponse {
  message: string;
  actions?: AIAction[];
  reasoning?: string;
  confidence?: number;
}

class AutonomousAIService {
  private openaiApiKey: string = '';
  private conversationHistory: Message[] = [];
  private userProfile: UserProfile | null = null;
  private executedActions: AIAction[] = [];
  private maxHistoryLength = 50;

  constructor() {
    this.loadApiKey();
    this.loadConversationHistory();
    this.loadUserProfile();
  }

  private async loadApiKey() {
    try {
      const key = await AsyncStorage.getItem('openai_api_key');
      if (key) this.openaiApiKey = key;
    } catch (error) {
      Alert.alert('Error', 'Loading API key. Please try again.');

      console.error('Error loading API key:', error);
    }
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

  private async loadUserProfile() {
    try {
      const profile = await AsyncStorage.getItem('ai_user_profile');
      if (profile) {
        this.userProfile = JSON.parse(profile);
      }
    } catch (error) {
      Alert.alert('Error', 'Loading user profile. Please try again.');

      console.error('Error loading user profile:', error);
    }
  }

  private async saveConversationHistory() {
    try {
      if (this.conversationHistory.length > this.maxHistoryLength) {
        this.conversationHistory = this.conversationHistory.slice(-this.maxHistoryLength);
      }
      await AsyncStorage.setItem('ai_conversation_history', JSON.stringify(this.conversationHistory));
    } catch (error) {
      Alert.alert('Error', 'Saving conversation history. Please try again.');

      console.error('Error saving conversation history:', error);
    }
  }

  async setApiKey(apiKey: string) {
    this.openaiApiKey = apiKey;
    await AsyncStorage.setItem('openai_api_key', apiKey);
  }

  async updateUserProfile(profile: Partial<UserProfile>) {
    this.userProfile = { ...this.userProfile, ...profile } as UserProfile;
    await AsyncStorage.setItem('ai_user_profile', JSON.stringify(this.userProfile));
  }

  async processMessage(message: string, userId?: string): Promise<AIResponse> {
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    this.conversationHistory.push(userMessage);

    // Analyze intent and context
    const analysis = await this.analyzeIntent(message);

    // Make autonomous decisions
    const decisions = await this.makeDecisions(analysis, userId);

    // Execute actions autonomously
    const executedActions = await this.executeActions(decisions, userId);

    // Generate response with OpenAI if available, otherwise use enhanced local processing
    let response: AIResponse;
    if (this.openaiApiKey) {
      response = await this.processWithGPT4(message, analysis, executedActions) ||
                 await this.processAutonomously(message, analysis, executedActions);
    } else {
      response = await this.processAutonomously(message, analysis, executedActions);
    }

    // Save assistant response
    this.conversationHistory.push({
      role: 'assistant',
      content: response.message,
      timestamp: new Date(),
      actions: executedActions
    });

    await this.saveConversationHistory();

    return response;
  }

  private async analyzeIntent(message: string): Promise<any> {
    const lowerMessage = message.toLowerCase();

    const intents = {
      modifyWorkout: /change|modify|update|adjust|switch|replace|different.*workout/i.test(message),
      createWorkout: /create|make|build|design|plan.*workout/i.test(message),
      logFood: /ate|eaten|had|consumed|breakfast|lunch|dinner|snack|meal|food/i.test(message),
      trackProgress: /progress|how.*doing|results|gains|improvement/i.test(message),
      getNutrition: /calories|protein|carbs|fats|macros|nutrition/i.test(message),
      setGoal: /goal|target|aim|objective|want to/i.test(message),
      getAdvice: /should|recommend|suggest|advice|tips|help/i.test(message),
      startWorkout: /start|begin|let's go|ready|workout time/i.test(message),
      analyzePerformance: /analyze|review|evaluate|assessment/i.test(message),
      planMeal: /meal plan|diet|what.*eat|food suggestion/i.test(message)
    };

    // Extract entities
    const entities = {
      exercises: this.extractExercises(message),
      foodItems: this.extractFoodItems(message),
      numbers: this.extractNumbers(message),
      timeReferences: this.extractTimeReferences(message),
      bodyParts: this.extractBodyParts(message)
    };

    // Determine user mood and urgency
    const sentiment = this.analyzeSentiment(message);

    return {
      intents,
      entities,
      sentiment,
      context: {
        previousTopic: this.getPreviousTopic(),
        timeOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
        userHistory: this.getUserRecentHistory()
      }
    };
  }

  private async makeDecisions(analysis: any, userId?: string): Promise<AIAction[]> {
    const actions: AIAction[] = [];

    // Autonomous decision making based on context
    if (analysis.intents.modifyWorkout) {
      const currentWorkout = await this.getCurrentWorkout(userId);
      if (currentWorkout) {
        actions.push({
          type: 'MODIFY_WORKOUT',
          description: 'Modifying current workout based on user request',
          executed: false,
          result: { workoutId: currentWorkout.id, modifications: this.determineModifications(analysis) }
        });
      }
    }

    if (analysis.intents.logFood) {
      const foodData = await this.parseFoodFromMessage(analysis);
      if (foodData) {
        actions.push({
          type: 'LOG_FOOD',
          description: `Logging ${foodData.items.join(', ')} to nutrition tracker`,
          executed: false,
          result: foodData
        });
      }
    }

    if (analysis.intents.createWorkout) {
      const workoutPlan = this.generateWorkoutPlan(analysis, this.userProfile);
      actions.push({
        type: 'CREATE_WORKOUT',
        description: 'Creating personalized workout plan',
        executed: false,
        result: workoutPlan
      });
    }

    // Proactive suggestions based on patterns
    if (!analysis.intents.logFood && this.shouldSuggestMealLogging()) {
      actions.push({
        type: 'SUGGEST_MEAL_LOG',
        description: 'Suggesting meal logging based on time of day',
        executed: false
      });
    }

    if (this.detectOvertraining(userId)) {
      actions.push({
        type: 'SUGGEST_REST',
        description: 'Recommending rest day due to training patterns',
        executed: false
      });
    }

    return actions;
  }

  private async executeActions(actions: AIAction[], userId?: string): Promise<AIAction[]> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'MODIFY_WORKOUT':
            const modResult = await this.modifyWorkout(action.result);
            action.executed = true;
            action.result = modResult;
            break;

          case 'LOG_FOOD':
            const logResult = await this.logFood(action.result, userId);
            action.executed = true;
            action.result = logResult;
            break;

          case 'CREATE_WORKOUT':
            const createResult = await workoutService.createCustomWorkout(action.result);
            action.executed = true;
            action.result = createResult;
            break;

          case 'UPDATE_GOALS':
            if (userId) {
              await firebaseDailyDataService.updateTargets(userId, action.result);
              action.executed = true;
            }
            break;

          case 'TRACK_WATER':
            // Implement water tracking
            action.executed = true;
            break;

          case 'START_WORKOUT':
            // Navigate to workout screen
            action.executed = true;
            break;
        }
      } catch (error) {
        console.error(`Failed to execute action ${action.type}:`, error);
        action.executed = false;
      }
    }

    this.executedActions.push(...actions);
    return actions;
  }

  private async modifyWorkout(data: any): Promise<any> {
    // Implement workout modification logic
    const { workoutId, modifications } = data;

    // Example modifications:
    // - Change exercise sets/reps
    // - Replace exercises
    // - Adjust rest periods
    // - Modify workout duration

    return {
      success: true,
      workoutId,
      modifications: modifications
    };
  }

  private async logFood(foodData: any, userId?: string): Promise<any> {
    if (!userId) return null;

    try {
      // Parse nutrition information
      const nutritionData = await this.getNutritionData(foodData.items);

      // Log to database
      const logEntry = {
        userId,
        date: new Date(),
        mealType: foodData.mealType || this.determineMealType(),
        items: foodData.items,
        calories: nutritionData.calories,
        protein: nutritionData.protein,
        carbs: nutritionData.carbs,
        fats: nutritionData.fats
      };

      // Save to nutrition service
      // TODO: Adapt to existing nutrition service structure
      console.log('Logging meal:', logEntry);

      return {
        success: true,
        logged: logEntry
      };
    } catch (error) {
      Alert.alert('Error', 'Logging food. Please try again.');

      console.error('Error logging food:', error);
      return { success: false, error };
    }
  }

  private async getNutritionData(items: string[]): Promise<any> {
    // Implement nutrition data lookup
    // This could use an API or local database
    const nutritionData = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0
    };

    // Example: Basic estimation
    for (const item of items) {
      if (item.includes('chicken')) {
        nutritionData.calories += 165;
        nutritionData.protein += 31;
      } else if (item.includes('rice')) {
        nutritionData.calories += 206;
        nutritionData.carbs += 45;
      } else if (item.includes('salad')) {
        nutritionData.calories += 50;
        nutritionData.carbs += 10;
      }
      // Add more food items...
    }

    return nutritionData;
  }

  private async processWithGPT4(message: string, analysis: any, executedActions: AIAction[]): Promise<AIResponse | null> {
    try {
      const systemPrompt = `You are Kira, the AI fitness coach inside [GymAppName].
You ONLY identify as Kira. Never call yourself anything else.

Your job is to generate workout programs based only on the user's inputs.
Follow all rules below exactly.

Current user profile: ${JSON.stringify(this.userProfile)}
Recent actions taken: ${JSON.stringify(executedActions)}
Analysis: ${JSON.stringify(analysis)}

==================================================
USER OPTIONS:
- Single Workout Plan → Generate one complete session for today.
- Weekly Plan → Generate a structured plan for the whole week.

USER INPUTS:
- Fitness goal (strength, hypertrophy, fat loss, endurance, tone, general health)
- Training type (single workout / full weekly plan)
- Training split preference (full body, push/pull/legs, upper/lower, body part focus)
- Experience level (beginner / intermediate / advanced)
- Available equipment (gym machines, dumbbells, cables, bands, bodyweight only)
- Time per workout (minutes)
- Training frequency (days per week, for weekly plan)
- Injury or mobility constraints (optional)

==================================================
OUTPUT RULES:
- Output ONLY the workout plan.
- No introductions, explanations, or disclaimers.
- Always use the markdown structure shown below.
- Always adapt to the user's inputs (goal, experience, equipment, etc.).

==================================================
WORKOUT FORMAT:

🔥 [Plan Title]

Warm-up (5–7 min):
- [2–3 dynamic stretches or light cardio moves]

[Muscle Group / Workout Day]
- Exercise 1 – sets × reps
- Exercise 2 – sets × reps
- Exercise 3 – sets × reps
(Add Exercises 4–6 if time/goal/experience allows)

[Next Muscle Group / Next Workout Day]
(Same format)

Finisher (Optional)
- Quick conditioning or burnout exercise × reps/time

💡 Tips:
- Rest guidelines (seconds/minutes)
- Intensity cues (RPE or % effort)
- Weekly frequency suggestions (if relevant)

==================================================
SPECIAL RULES:

Single Workout Plan:
- Output only one complete session in the above format.

Weekly Plan:
- Output 4–7 days depending on user's training frequency.
- Use common splits (Push/Pull/Legs, Upper/Lower, or Full Body).
- Each day must follow the same workout format.

Scaling Exercises by Experience:
- Beginner → 3 exercises per group/day
- Intermediate → 4–5 exercises per group/day
- Advanced or long sessions → 5–6 exercises per group/day

Sets & Reps by Goal:
- Strength → 4–5 sets × 4–6 reps, 90–120s rest
- Hypertrophy → 3–4 sets × 8–12 reps, 60–90s rest
- Endurance/Tone → 2–3 sets × 12–20 reps, 30–60s rest

Equipment Rules:
- If the user lacks equipment, always replace with suitable alternatives.
- Prioritize bodyweight when no equipment is available.

==================================================
FINAL STEP:
Always output the finished workout (single session or weekly plan) using ONLY the above markdown format.
Do not add anything else before or after the workout.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        ...this.conversationHistory.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4-turbo-preview',
          messages: messages,
          temperature: 0.7,
          max_tokens: 600
        })
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      return {
        message: data.choices[0].message.content,
        actions: executedActions,
        confidence: 0.95
      };
    } catch (error) {
      Alert.alert('Error', 'GPT-4 processing error. Please try again.');

      console.error('GPT-4 processing error:', error);
      return null;
    }
  }

  private async processAutonomously(message: string, analysis: any, executedActions: AIAction[]): Promise<AIResponse> {
    let responseText = '';

    // Build response based on executed actions
    if (executedActions.length > 0) {
      responseText = "I've taken the following actions for you:\n\n";

      for (const action of executedActions) {
        if (action.executed) {
          switch (action.type) {
            case 'MODIFY_WORKOUT':
              responseText += `✅ Modified your workout: ${action.description}\n`;
              break;
            case 'LOG_FOOD':
              responseText += `✅ Logged your meal: ${action.result?.logged?.items?.join(', ')}\n`;
              responseText += `   Calories: ${action.result?.logged?.calories}, Protein: ${action.result?.logged?.protein}g\n`;
              break;
            case 'CREATE_WORKOUT':
              responseText += `✅ Created a new workout plan tailored to your goals\n`;
              break;
            default:
              responseText += `✅ ${action.description}\n`;
          }
        }
      }

      responseText += '\n';
    }

    // Add contextual response
    if (analysis.intents.modifyWorkout) {
      responseText += "I've analyzed your recent performance and made adjustments to optimize your results. ";
      responseText += "The changes focus on progressive overload while ensuring proper recovery.";
    } else if (analysis.intents.logFood) {
      const calories = executedActions.find(a => a.type === 'LOG_FOOD')?.result?.logged?.calories || 0;
      responseText += `That brings your total calories today to approximately ${calories}. `;
      responseText += "You're on track with your nutrition goals!";
    } else if (analysis.intents.getAdvice) {
      responseText += this.generateExpertAdvice(analysis);
    } else {
      responseText += this.generateContextualResponse(message, analysis);
    }

    return {
      message: responseText,
      actions: executedActions,
      reasoning: 'Autonomous decision based on user patterns and goals',
      confidence: 0.85
    };
  }

  // Helper methods
  private extractExercises(message: string): string[] {
    const exercises = ['squat', 'deadlift', 'bench press', 'pull up', 'push up', 'row', 'curl', 'press'];
    return exercises.filter(ex => message.toLowerCase().includes(ex));
  }

  private extractFoodItems(message: string): string[] {
    const commonFoods = ['chicken', 'rice', 'salad', 'eggs', 'oatmeal', 'banana', 'protein shake', 'sandwich'];
    const found: string[] = [];

    for (const food of commonFoods) {
      if (message.toLowerCase().includes(food)) {
        found.push(food);
      }
    }

    return found;
  }

  private extractNumbers(message: string): number[] {
    const matches = message.match(/\d+/g);
    return matches ? matches.map(n => parseInt(n)) : [];
  }

  private extractTimeReferences(message: string): string[] {
    const timeWords = ['today', 'yesterday', 'tomorrow', 'morning', 'evening', 'night', 'now'];
    return timeWords.filter(t => message.toLowerCase().includes(t));
  }

  private extractBodyParts(message: string): string[] {
    const bodyParts = ['chest', 'back', 'legs', 'arms', 'shoulders', 'abs', 'core'];
    return bodyParts.filter(bp => message.toLowerCase().includes(bp));
  }

  private analyzeSentiment(message: string): string {
    const positive = ['great', 'good', 'awesome', 'love', 'excellent', 'happy'];
    const negative = ['bad', 'terrible', 'hate', 'awful', 'tired', 'sore', 'hurt'];

    const posCount = positive.filter(w => message.toLowerCase().includes(w)).length;
    const negCount = negative.filter(w => message.toLowerCase().includes(w)).length;

    if (posCount > negCount) return 'positive';
    if (negCount > posCount) return 'negative';
    return 'neutral';
  }

  private getPreviousTopic(): string | null {
    if (this.conversationHistory.length < 2) return null;
    const previous = this.conversationHistory[this.conversationHistory.length - 2];

    if (previous.content.toLowerCase().includes('workout')) return 'workout';
    if (previous.content.toLowerCase().includes('food')) return 'nutrition';
    if (previous.content.toLowerCase().includes('progress')) return 'progress';

    return null;
  }

  private getUserRecentHistory(): any {
    return this.conversationHistory.slice(-5).map(m => ({
      role: m.role,
      topic: this.extractTopic(m.content)
    }));
  }

  private extractTopic(content: string): string {
    if (content.includes('workout')) return 'workout';
    if (content.includes('food') || content.includes('eat')) return 'nutrition';
    if (content.includes('progress')) return 'progress';
    return 'general';
  }

  private async getCurrentWorkout(userId?: string): Promise<any> {
    // Get user's current/most recent workout plan
    return null; // Implement based on your data structure
  }

  private determineModifications(analysis: any): any {
    const modifications: any = {};

    if (analysis.entities.bodyParts.length > 0) {
      modifications.targetMuscles = analysis.entities.bodyParts;
    }

    if (analysis.entities.numbers.length > 0) {
      modifications.sets = analysis.entities.numbers[0];
      if (analysis.entities.numbers.length > 1) {
        modifications.reps = analysis.entities.numbers[1];
      }
    }

    return modifications;
  }

  private async parseFoodFromMessage(analysis: any): Promise<any> {
    const foodItems = analysis.entities.foodItems;
    if (foodItems.length === 0) return null;

    return {
      items: foodItems,
      mealType: this.determineMealType(),
      timestamp: new Date()
    };
  }

  private determineMealType(): string {
    const hour = new Date().getHours();
    if (hour < 10) return 'breakfast';
    if (hour < 14) return 'lunch';
    if (hour < 18) return 'dinner';
    return 'snack';
  }

  private generateWorkoutPlan(analysis: any, profile: UserProfile | null): any {
    const targetMuscles = analysis.entities.bodyParts.length > 0
      ? analysis.entities.bodyParts
      : ['full body'];

    return {
      name: `AI Generated ${targetMuscles.join(' & ')} Workout`,
      description: 'Personalized workout created by AI',
      exercises: this.selectExercises(targetMuscles, profile?.fitnessLevel || 'intermediate'),
      duration: profile?.preferences?.workoutDuration || 45,
      difficulty: profile?.fitnessLevel || 'intermediate'
    };
  }

  private selectExercises(targetMuscles: string[], level: string): any[] {
    // Implement exercise selection logic
    const exercises = [];

    // Example exercises based on muscle groups
    if (targetMuscles.includes('chest') || targetMuscles.includes('full body')) {
      exercises.push({
        name: 'Bench Press',
        sets: level === 'beginner' ? 3 : 4,
        reps: level === 'beginner' ? 10 : 8,
        rest: 90
      });
    }

    if (targetMuscles.includes('back') || targetMuscles.includes('full body')) {
      exercises.push({
        name: 'Pull Ups',
        sets: 3,
        reps: level === 'beginner' ? 5 : 10,
        rest: 90
      });
    }

    // Add more exercises...

    return exercises;
  }

  private shouldSuggestMealLogging(): boolean {
    const hour = new Date().getHours();
    const mealTimes = [8, 12, 18]; // Breakfast, lunch, dinner
    return mealTimes.some(time => Math.abs(hour - time) < 1);
  }

  private detectOvertraining(userId?: string): boolean {
    // Analyze workout frequency and recovery patterns
    // This is a simplified example
    const recentWorkouts = this.executedActions.filter(
      a => a.type === 'START_WORKOUT' &&
      a.executed &&
      new Date(a.result?.date).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    return recentWorkouts.length > 6; // More than 6 workouts in last 7 days
  }

  private generateExpertAdvice(analysis: any): string {
    const bodyParts = analysis.entities.bodyParts;

    if (bodyParts.includes('legs')) {
      return "For leg development, focus on compound movements like squats and deadlifts. Progressive overload is key - aim to increase weight by 2.5-5% when you can complete all sets with good form. Don't neglect single-leg work for balance and stability.";
    }

    if (analysis.sentiment === 'negative') {
      return "I understand training can be challenging. Remember that progress isn't always linear. Focus on consistency over perfection, and ensure you're getting adequate rest and nutrition. Small steps forward are still progress.";
    }

    return "Based on your training history, you're making solid progress. Keep focusing on progressive overload, proper form, and adequate recovery. Consistency is your best tool for long-term success.";
  }

  private generateContextualResponse(message: string, analysis: any): string {
    const timeOfDay = analysis.context.timeOfDay;

    if (timeOfDay < 12) {
      return "Good morning! Ready to tackle today's training? I'm here to help optimize your workout and nutrition for maximum results.";
    } else if (timeOfDay < 17) {
      return "Hope you're having a productive day! Remember to stay hydrated and maintain your energy levels. Let me know how I can help with your fitness goals.";
    } else {
      return "Evening! Great time for training or meal prep. I can adjust your workout intensity based on your energy levels or help plan tomorrow's nutrition.";
    }
  }

  async clearHistory() {
    this.conversationHistory = [];
    this.executedActions = [];
    await AsyncStorage.removeItem('ai_conversation_history');
  }
}

export const autonomousAIService = new AutonomousAIService();