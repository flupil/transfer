import { exercisesData } from '../data/exercisesData';
import firebaseDailyDataService from './firebaseDailyDataService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

interface AIResponse {
  message: string;
  action?: string;
  data?: any;
  suggestedActions?: { text: string; icon?: string }[];
}

interface UserContext {
  userId?: string;
  userProfile?: any;
  messages?: any[];
}

export interface FoodAnalysis {
  items: Array<{
    name: string;
    quantity: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }>;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  confidence: 'high' | 'medium' | 'low';
  suggestions?: string[];
}

class AIService {
  private openaiApiKey: string = '';
  private openaiApiUrl = 'https://api.openai.com/v1/chat/completions';
  private useOpenAI: boolean = false;

  private anthropicApiKey: string = '';
  private anthropicApiUrl = 'https://api.anthropic.com/v1/messages';
  private useAnthropic: boolean = false;

  constructor() {
    this.initializeApiKey();
  }

  private async initializeApiKey() {
    try {
      const storedOpenAI = await AsyncStorage.getItem('openai_api_key');
      if (storedOpenAI) {
        this.openaiApiKey = storedOpenAI;
        this.useOpenAI = true;
      }

      const storedAnthropic = await AsyncStorage.getItem('anthropic_api_key');
      if (storedAnthropic) {
        this.anthropicApiKey = storedAnthropic;
        this.useAnthropic = true;
      }
    } catch (error) {
      Alert.alert('Notice', 'Failed to load AI API keys. AI features may be limited.');
      console.error('Error loading API key:', error);
    }
  }

  async setApiKey(apiKey: string, provider: 'openai' | 'anthropic' = 'openai') {
    if (provider === 'openai') {
      this.openaiApiKey = apiKey;
      this.useOpenAI = !!apiKey;
      if (apiKey) {
        await AsyncStorage.setItem('openai_api_key', apiKey);
      } else {
        await AsyncStorage.removeItem('openai_api_key');
      }
    } else {
      this.anthropicApiKey = apiKey;
      this.useAnthropic = !!apiKey;
      if (apiKey) {
        await AsyncStorage.setItem('anthropic_api_key', apiKey);
      } else {
        await AsyncStorage.removeItem('anthropic_api_key');
      }
    }
  }

  async analyzeFoodFromPhoto(imageUri: string): Promise<FoodAnalysis> {
    try {
      // Ensure API key is loaded
      await this.initializeApiKey();

      if (!this.useAnthropic || !this.anthropicApiKey) {
        console.log('API key check failed:', { useAnthropic: this.useAnthropic, hasKey: !!this.anthropicApiKey });
        throw new Error('Anthropic API key not configured. Please set your API key in settings.');
      }

      // Read image as base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Determine media type
      const extension = imageUri.split('.').pop()?.toLowerCase() || 'jpeg';
      const mediaType = extension === 'png' ? 'image/png' : 'image/jpeg';

      console.log('Making API request with key:', this.anthropicApiKey.substring(0, 20) + '...');

      const response = await fetch(this.anthropicApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: mediaType,
                    data: base64,
                  },
                },
                {
                  type: 'text',
                  text: `Analyze this food image and provide detailed nutritional information.

Return a JSON response with this exact structure:
{
  "items": [
    {
      "name": "food name",
      "quantity": "portion size (e.g., '1 cup', '200g', '1 medium')",
      "calories": number,
      "protein": number (grams),
      "carbs": number (grams),
      "fat": number (grams)
    }
  ],
  "confidence": "high" | "medium" | "low",
  "suggestions": ["optional tips about the meal"]
}

Be as accurate as possible with portion sizes and nutritional values. If multiple items are visible, list each separately.`,
                },
              ],
            },
          ],
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const error = await response.text();
        console.error('API Error Response:', error);
        throw new Error(`API Error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      console.log('API Response received');
      const content = data.content[0].text;
      console.log('Content preview:', content.substring(0, 200));

      // Extract JSON from response
      let jsonStr = content;
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr);

      // Calculate totals
      const totalCalories = parsed.items.reduce((sum: number, item: any) => sum + item.calories, 0);
      const totalProtein = parsed.items.reduce((sum: number, item: any) => sum + item.protein, 0);
      const totalCarbs = parsed.items.reduce((sum: number, item: any) => sum + item.carbs, 0);
      const totalFat = parsed.items.reduce((sum: number, item: any) => sum + item.fat, 0);

      return {
        ...parsed,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
      };
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze food photo. Please check your API key and try again.');
      console.error('Error analyzing food photo:', error);
      throw error;
    }
  }

  async generateWorkoutPlan(preferences: {
    goal: string;
    experience: string;
    daysPerWeek: number;
    equipment: string;
    duration: string;
    limitations?: string;
  }): Promise<any> {
    try {
      // Ensure API key is loaded
      await this.initializeApiKey();

      if (!this.useAnthropic || !this.anthropicApiKey) {
        console.log('API key check failed:', { useAnthropic: this.useAnthropic, hasKey: !!this.anthropicApiKey });
        throw new Error('Anthropic API key not configured. Please set your API key in settings.');
      }

      const response = await fetch(this.anthropicApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: `Create a personalized workout plan with the following specifications:

Goal: ${preferences.goal}
Experience Level: ${preferences.experience}
Days Per Week: ${preferences.daysPerWeek}
Equipment: ${preferences.equipment}
Session Duration: ${preferences.duration} minutes
${preferences.limitations ? `Limitations: ${preferences.limitations}` : ''}

Return a JSON response with this exact structure:
{
  "name": "Plan Name (e.g., '4-Day Muscle Building Program')",
  "description": "Brief description of the plan",
  "level": "${preferences.experience}",
  "daysPerWeek": ${preferences.daysPerWeek},
  "goal": "${preferences.goal}",
  "workouts": [
    {
      "id": "day-1",
      "day": "Day 1",
      "name": "Workout Name (e.g., 'Chest & Triceps')",
      "focusArea": "Primary muscle groups",
      "duration": "${preferences.duration} min",
      "exercises": [
        {
          "id": "ex-1",
          "name": "Exercise Name",
          "sets": 3,
          "reps": "8-12",
          "weight": "Moderate",
          "rest": "60-90 sec",
          "muscleGroup": "Target Muscle",
          "equipment": "Required Equipment",
          "instructions": "Brief exercise instructions",
          "tips": "Form tips and common mistakes to avoid"
        }
      ]
    }
  ]
}

Guidelines:
- Create ${preferences.daysPerWeek} unique workout days
- Each workout should last approximately ${preferences.duration} minutes
- Adjust exercise count based on duration (4-6 exercises for 30-45min, 6-8 for 60min+)
- Match sets/reps to the goal (Strength: 4-6 reps, Hypertrophy: 8-12, Endurance: 12-20)
- Consider equipment availability: ${preferences.equipment}
- Scale difficulty for ${preferences.experience} level
- Ensure balanced muscle group coverage across the week
- Include rest periods appropriate for the goal
- Provide practical form tips for each exercise`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.content[0].text;

      // Extract JSON from response
      let jsonStr = content;
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr);

      return parsed;
    } catch (error) {
      Alert.alert('Error', 'Failed to generate workout plan. Please check your API key and try again.');
      console.error('Error generating workout plan:', error);
      throw error;
    }
  }

  async getNutritionAdvice(data: {
    currentIntake: { calories: number; protein: number; carbs: number; fat: number };
    targets: { calories: number; protein: number; carbs: number; fat: number };
    weekData: any[];
  }): Promise<any> {
    try {
      // Ensure API key is loaded
      await this.initializeApiKey();

      if (!this.useAnthropic || !this.anthropicApiKey) {
        console.log('API key check failed:', { useAnthropic: this.useAnthropic, hasKey: !!this.anthropicApiKey });
        throw new Error('Anthropic API key not configured. Please set your API key in settings.');
      }

      const response = await fetch(this.anthropicApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 2048,
          messages: [
            {
              role: 'user',
              content: `Analyze this nutrition data and provide personalized advice:

Current Average Daily Intake (past 7 days):
- Calories: ${data.currentIntake.calories} kcal
- Protein: ${data.currentIntake.protein}g
- Carbs: ${data.currentIntake.carbs}g
- Fat: ${data.currentIntake.fat}g

Target Daily Intake:
- Calories: ${data.targets.calories} kcal
- Protein: ${data.targets.protein}g
- Carbs: ${data.targets.carbs}g
- Fat: ${data.targets.fat}g

Return a JSON response with this exact structure:
{
  "summary": "Brief 2-3 sentence overview of their nutrition status",
  "strengths": [
    "What they're doing well (2-3 items)"
  ],
  "improvements": [
    "Areas that need improvement (2-4 items)"
  ],
  "recommendations": [
    "Specific actionable recommendations (3-5 items)"
  ],
  "mealSuggestions": [
    "Meal ideas that fit their goals (3-4 items)"
  ],
  "supplements": [
    "Optional supplement suggestions if needed (1-3 items, or empty array)"
  ]
}

Guidelines:
- Be encouraging and positive
- Provide specific, actionable advice
- Consider macro balance vs targets
- Suggest realistic changes
- Focus on sustainability
- Include practical meal ideas
- Only suggest supplements if there's a clear nutritional gap`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      const content = data.content[0].text;

      // Extract JSON from response
      let jsonStr = content;
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonStr);

      return parsed;
    } catch (error) {
      Alert.alert('Error', 'Failed to get nutrition advice. Please check your API key and try again.');
      console.error('Error getting nutrition advice:', error);
      throw error;
    }
  }

  // Main function to process user messages
  async processMessage(message: string, context: UserContext): Promise<AIResponse> {
    // Try OpenAI first if available
    if (this.useOpenAI && this.openaiApiKey) {
      try {
        const openAIResponse = await this.processWithOpenAI(message, context);
        if (openAIResponse) {
          return openAIResponse;
        }
      } catch (error) {
        Alert.alert('Notice', 'AI service unavailable. Using basic responses.');
        console.error('OpenAI processing failed, falling back to local:', error);
      }
    }

    // Fallback to local processing
    return this.processLocally(message, context);
  }

  private async processWithOpenAI(message: string, context: UserContext): Promise<AIResponse | null> {
    try {
      const systemPrompt = `You are Kira, the AI fitness coach inside [GymAppName].
You ONLY identify as Kira. Never call yourself anything else.

Your job is to generate workout programs based only on the user's inputs.
Follow all rules below exactly.

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
        ...(context.messages?.slice(-5).map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        })) || []),
        { role: 'user', content: message }
      ];

      const response = await fetch(this.openaiApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages,
          temperature: 0.7,
          max_tokens: 500,
          functions: [
            {
              name: 'trigger_app_action',
              description: 'Trigger an action in the fitness app',
              parameters: {
                type: 'object',
                properties: {
                  action: {
                    type: 'string',
                    enum: ['CREATE_WORKOUT', 'LOG_MEAL', 'GET_STATS', 'SET_GOAL'],
                    description: 'The action to trigger'
                  },
                  data: {
                    type: 'object',
                    description: 'Additional data for the action'
                  }
                },
                required: ['action']
              }
            }
          ],
          function_call: 'auto'
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const choice = data.choices[0];

      // Parse function call if present
      let action: string | undefined;
      let actionData: any;
      if (choice.message.function_call) {
        const functionArgs = JSON.parse(choice.message.function_call.arguments);
        action = functionArgs.action;
        actionData = functionArgs.data;
      }

      // Generate suggested actions based on context
      const suggestedActions = this.generateSuggestedActions(message, action);

      return {
        message: choice.message.content || 'I understand. How can I help you further?',
        action,
        data: actionData,
        // No suggested actions for pure chat experience
      };
    } catch (error) {
      Alert.alert('Error', 'Failed to connect to AI service. Using basic responses.');
      console.error('OpenAI API error:', error);
      return null;
    }
  }

  private generateSuggestedActions(message: string, action?: string): Array<{ text: string }> {
    const lowerMessage = message.toLowerCase();

    if (action === 'CREATE_WORKOUT' || lowerMessage.includes('workout')) {
      return [
        { text: "Start this workout" },
        { text: "Modify exercises" },
        { text: "Save for later" }
      ];
    }

    if (action === 'LOG_MEAL' || lowerMessage.includes('food') || lowerMessage.includes('meal')) {
      return [
        { text: "Search foods" },
        { text: "Quick add calories" },
        { text: "View nutrition" }
      ];
    }

    if (action === 'GET_STATS' || lowerMessage.includes('progress')) {
      return [
        { text: "View detailed stats" },
        { text: "Update weight" },
        { text: "Set new goals" }
      ];
    }

    // Default suggestions
    return [
      { text: "Create workout plan" },
      { text: "Track my meal" },
      { text: "Check my progress" },
      { text: "Get motivation" }
    ];
  }

  // Local processing as fallback
  private async processLocally(message: string, context: UserContext): Promise<AIResponse> {
    const lowerMessage = message.toLowerCase();

    // General conversation handlers
    if (this.isGreeting(lowerMessage)) {
      return this.handleGreeting();
    }

    if (this.isQuestion(lowerMessage)) {
      return this.handleGeneralQuestion(message);
    }

    // Workout plan creation
    if (this.isWorkoutRequest(lowerMessage)) {
      return await this.handleWorkoutRequest(message, context);
    }

    // Nutrition tracking
    if (this.isNutritionRequest(lowerMessage)) {
      return await this.handleNutritionRequest(message, context);
    }

    // Progress checking
    if (this.isProgressRequest(lowerMessage)) {
      return await this.handleProgressRequest(message, context);
    }

    // Motivation
    if (this.isMotivationRequest(lowerMessage)) {
      return this.handleMotivationRequest();
    }

    // Exercise information
    if (this.isExerciseInfoRequest(lowerMessage)) {
      return this.handleExerciseInfoRequest(message);
    }

    // Goal setting
    if (this.isGoalSettingRequest(lowerMessage)) {
      return await this.handleGoalSettingRequest(message, context);
    }

    // General conversational response
    return this.handleGeneralChat(message);
  }

  private isGreeting(message: string): boolean {
    const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'greetings'];
    return greetings.some(greeting => message.includes(greeting));
  }

  private handleGreeting(): AIResponse {
    const greetings = [
      "Hey there! How's your fitness journey going today?",
      "Hello! Ready to crush some goals today?",
      "Hi! What can I help you with today?",
      "Hey! How are you feeling? Ready for a great workout?",
    ];

    return {
      message: greetings[Math.floor(Math.random() * greetings.length)],
    };
  }

  private isQuestion(message: string): boolean {
    return message.includes('?') ||
           message.startsWith('what') ||
           message.startsWith('how') ||
           message.startsWith('why') ||
           message.startsWith('when') ||
           message.startsWith('where') ||
           message.startsWith('who');
  }

  private handleGeneralQuestion(message: string): AIResponse {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('how are you')) {
      return {
        message: "I'm doing great, thanks for asking! I'm here to help you achieve your fitness goals. How are you doing today?",
      };
    }

    if (lowerMessage.includes('what can you do') || lowerMessage.includes('help')) {
      return {
        message: "I'm your AI fitness coach! I can:\n\n• Create personalized workout plans\n• Track your meals and calories\n• Monitor your progress\n• Answer fitness questions\n• Provide motivation\n• Help set and achieve goals\n\nI'm also happy to just chat about your fitness journey or anything else on your mind!",
      };
    }

    // Default question response
    return {
      message: "That's a great question! While I'm primarily focused on fitness and nutrition, I'm happy to chat about anything. What's on your mind?"
    };
  }

  private handleGeneralChat(message: string): AIResponse {
    const responses = [
      {
        message: "That's interesting! Tell me more about that. How does it relate to your fitness journey?"},
      {
        message: "I hear you! Is there anything specific about your fitness or health that you'd like to discuss?"},
      {
        message: "Thanks for sharing that with me! How can I help you today with your fitness goals?"},
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Check if message is about workouts
  private isWorkoutRequest(message: string): boolean {
    const keywords = ['workout', 'exercise', 'training', 'plan', 'routine', 'program', 'gym'];
    return keywords.some(keyword => message.includes(keyword));
  }

  // Handle workout-related requests
  private async handleWorkoutRequest(message: string, context: UserContext): Promise<AIResponse> {
    const lowerMessage = message.toLowerCase();

    // Determine workout type
    let workoutType = 'full_body';
    let difficulty = 'intermediate';
    let duration = 45;

    if (lowerMessage.includes('chest') || lowerMessage.includes('push')) {
      workoutType = 'chest';
    } else if (lowerMessage.includes('back') || lowerMessage.includes('pull')) {
      workoutType = 'back';
    } else if (lowerMessage.includes('leg')) {
      workoutType = 'legs';
    } else if (lowerMessage.includes('arm')) {
      workoutType = 'arms';
    } else if (lowerMessage.includes('abs') || lowerMessage.includes('core')) {
      workoutType = 'abs';
    }

    if (lowerMessage.includes('beginner') || lowerMessage.includes('easy')) {
      difficulty = 'beginner';
      duration = 30;
    } else if (lowerMessage.includes('advanced') || lowerMessage.includes('hard')) {
      difficulty = 'advanced';
      duration = 60;
    }

    if (lowerMessage.includes('quick') || lowerMessage.includes('short')) {
      duration = 20;
    } else if (lowerMessage.includes('long')) {
      duration = 60;
    }

    // Generate workout plan
    const workout = this.generateWorkoutPlan(workoutType, difficulty, duration);

    return {
      message: `I've created a ${difficulty} ${workoutType.replace('_', ' ')} workout plan for you:\n\n${this.formatWorkout(workout)}`,
      action: 'CREATE_WORKOUT',
      data: workout};
  }

  // Generate a workout plan based on parameters
  private generateWorkoutPlan(type: string, difficulty: string, duration: number) {
    const exercises = exercisesData.filter(ex =>
      ex.muscle?.toLowerCase().includes(type) ||
      type === 'full_body'
    );

    const exerciseCount = Math.floor(duration / 7); // Roughly 7 minutes per exercise
    const selectedExercises = exercises.slice(0, exerciseCount);

    const sets = difficulty === 'beginner' ? 3 : difficulty === 'advanced' ? 5 : 4;
    const reps = difficulty === 'beginner' ? '8-10' : difficulty === 'advanced' ? '12-15' : '10-12';

    return {
      name: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} ${type.replace('_', ' ')} Workout`,
      duration: duration,
      exercises: selectedExercises.map(ex => ({
        id: ex.id,
        name: ex.name,
        sets: sets,
        reps: reps,
        rest: '60s',
        muscle: ex.muscle,
        equipment: ex.equipment
      }))
    };
  }

  // Format workout for display
  private formatWorkout(workout: any): string {
    let formatted = `Duration: ${workout.duration} minutes\n\n`;
    workout.exercises.forEach((ex: any, index: number) => {
      formatted += `${index + 1}. ${ex.name}\n   ${ex.sets} sets × ${ex.reps} reps | Rest: ${ex.rest}\n   Equipment: ${ex.equipment || 'Bodyweight'}\n\n`;
    });
    return formatted;
  }

  // Check if message is about nutrition
  private isNutritionRequest(message: string): boolean {
    const keywords = ['eat', 'food', 'meal', 'calorie', 'nutrition', 'diet', 'protein', 'carb', 'fat', 'track', 'log'];
    return keywords.some(keyword => message.includes(keyword));
  }

  // Handle nutrition-related requests
  private async handleNutritionRequest(message: string, context: UserContext): Promise<AIResponse> {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('track') || lowerMessage.includes('log')) {
      return {
        message: "I'll help you log your meal. What did you eat? Please describe your meal and I'll help you track it."};
    }

    if (lowerMessage.includes('calorie')) {
      const calories = await this.estimateCalories(message);
      return {
        message: `Based on your description, I estimate this meal contains approximately ${calories} calories. Would you like me to log this?`,
        action: 'LOG_MEAL',
        data: { calories, description: message }};
    }

    return {
      message: "I can help you track your nutrition. Tell me what you've eaten, and I'll help you log the calories and macros."};
  }

  // Estimate calories from meal description
  private async estimateCalories(description: string): Promise<number> {
    // Simple estimation based on common foods
    let calories = 0;
    const desc = description.toLowerCase();

    // Proteins
    if (desc.includes('chicken')) calories += 200;
    if (desc.includes('beef')) calories += 250;
    if (desc.includes('fish') || desc.includes('salmon')) calories += 180;
    if (desc.includes('egg')) calories += 70;

    // Carbs
    if (desc.includes('rice')) calories += 200;
    if (desc.includes('bread')) calories += 80;
    if (desc.includes('pasta')) calories += 220;
    if (desc.includes('oatmeal')) calories += 150;

    // Vegetables/Fruits
    if (desc.includes('salad') || desc.includes('vegetable')) calories += 50;
    if (desc.includes('fruit') || desc.includes('apple') || desc.includes('banana')) calories += 80;

    // Fats
    if (desc.includes('nuts') || desc.includes('almond')) calories += 160;
    if (desc.includes('avocado')) calories += 240;
    if (desc.includes('oil') || desc.includes('butter')) calories += 120;

    // Default if nothing matches
    if (calories === 0) calories = 400;

    return calories;
  }

  // Check if message is about progress
  private isProgressRequest(message: string): boolean {
    const keywords = ['progress', 'stats', 'results', 'improvement', 'weight', 'gain', 'loss', 'how am i doing'];
    return keywords.some(keyword => message.includes(keyword));
  }

  // Handle progress-related requests
  private async handleProgressRequest(message: string, context: UserContext): Promise<AIResponse> {
    if (!context.userId) {
      return {
        message: "Please log in to view your progress."};
    }

    try {
      const todayData = await firebaseDailyDataService.getTodayData(context.userId);
      const weekData = await firebaseDailyDataService.getWeekData(context.userId);

      let progressMessage = "Here's your progress summary:\n\n";
      progressMessage += `Today's Stats:\n`;
      progressMessage += `• Calories: ${todayData.calories.consumed}/${todayData.calories.target} kcal\n`;
      progressMessage += `• Protein: ${todayData.protein.consumed}/${todayData.protein.target}g\n`;
      progressMessage += `• Water: ${todayData.water.consumed}/${todayData.water.target}ml\n`;
      progressMessage += `• Steps: ${todayData.steps.current}/${todayData.steps.target}\n\n`;

      progressMessage += `This Week:\n`;
      progressMessage += `• Average calories: ${this.calculateAverage(weekData, 'calories')} kcal\n`;
      progressMessage += `• Workouts completed: ${weekData.filter((d: any) => d.workoutCompleted).length}\n`;

      return {
        message: progressMessage,
        action: 'GET_STATS'};
    } catch (error) {
      return {
        message: "I'm having trouble accessing your progress data. Please try again later."};
    }
  }

  // Calculate average from week data
  private calculateAverage(weekData: any[], field: string): number {
    if (!weekData || weekData.length === 0) return 0;
    const sum = weekData.reduce((acc, day) => acc + (day[field]?.consumed || 0), 0);
    return Math.round(sum / weekData.length);
  }

  // Check if message is asking for motivation
  private isMotivationRequest(message: string): boolean {
    const keywords = ['motivat', 'inspir', 'encourag', 'help', 'tired', 'lazy', 'don\'t want', 'can\'t'];
    return keywords.some(keyword => message.includes(keyword));
  }

  // Handle motivation requests
  private handleMotivationRequest(): AIResponse {
    const motivationalQuotes = [
      "The only bad workout is the one that didn't happen! Every step counts toward your goals.",
      "You're stronger than you think! Remember why you started this journey.",
      "Progress isn't always visible immediately, but every workout is building a better you!",
      "Champions are made when no one is watching. Keep pushing!",
      "Your body can stand almost anything. It's your mind you have to convince!",
      "Success isn't given, it's earned. You're earning it right now!",
      "Every expert was once a beginner. Keep going!",
      "The pain you feel today will be the strength you feel tomorrow.",
      "Don't stop when you're tired. Stop when you're done!",
      "You're not just building muscle, you're building character and discipline!"
    ];

    const tips = [
      "Try working out with music that pumps you up",
      "Set small, achievable goals for today",
      "Remember to celebrate small victories",
      "Find a workout buddy for accountability",
      "Visualize how you'll feel after the workout"
    ];

    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    return {
      message: `${randomQuote}\n\n💡 Tip: ${randomTip}`};
  }

  // Check if message is about exercise information
  private isExerciseInfoRequest(message: string): boolean {
    const keywords = ['how to', 'form', 'technique', 'proper', 'correct', 'what is', 'explain'];
    return keywords.some(keyword => message.includes(keyword));
  }

  // Handle exercise information requests
  private handleExerciseInfoRequest(message: string): AIResponse {
    const exercises = exercisesData;
    const lowerMessage = message.toLowerCase();

    // Find matching exercise
    const matchingExercise = exercises.find(ex =>
      lowerMessage.includes(ex.name.toLowerCase())
    );

    if (matchingExercise) {
      return {
        message: `Here's how to perform ${matchingExercise.name}:\n\n` +
                 `Muscle Group: ${matchingExercise.muscle}\n` +
                 `Equipment: ${matchingExercise.equipment || 'Bodyweight'}\n\n` +
                 `Instructions:\n` +
                 `1. Start in the proper position\n` +
                 `2. Maintain good form throughout\n` +
                 `3. Control the movement\n` +
                 `4. Breathe properly (exhale on exertion)\n` +
                 `5. Don't rush the movement\n\n` +
                 `Common mistakes to avoid:\n` +
                 `• Going too fast\n` +
                 `• Using momentum instead of muscle\n` +
                 `• Not maintaining proper alignment`};
    }

    return {
      message: "Which exercise would you like to learn about? I can explain proper form and technique for any exercise."};
  }

  // Check if message is about goal setting
  private isGoalSettingRequest(message: string): boolean {
    const keywords = ['goal', 'target', 'aim', 'want to', 'trying to', 'objective', 'lose', 'gain', 'build'];
    return keywords.some(keyword => message.includes(keyword));
  }

  // Handle goal setting requests
  private async handleGoalSettingRequest(message: string, context: UserContext): Promise<AIResponse> {
    const lowerMessage = message.toLowerCase();
    let goalType = '';
    let target = 0;

    if (lowerMessage.includes('weight') || lowerMessage.includes('lose') || lowerMessage.includes('gain')) {
      goalType = 'weight';

      // Extract numbers from message
      const numbers = message.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        target = parseInt(numbers[0]);
      }

      const isLoss = lowerMessage.includes('lose');

      return {
        message: `Great! Setting a goal to ${isLoss ? 'lose' : 'gain'} ${target || '?'} ${target > 20 ? 'lbs' : 'kg'}.\n\n` +
                 `To achieve this safely, I recommend:\n` +
                 `• ${isLoss ? 'Calorie deficit' : 'Calorie surplus'} of ${isLoss ? '500' : '300'} cal/day\n` +
                 `• High protein intake (${isLoss ? '1.2' : '1.5'}g per kg body weight)\n` +
                 `• Regular strength training ${isLoss ? '3-4' : '4-5'} times/week\n` +
                 `• ${isLoss ? 'Cardio 2-3' : 'Limited cardio 1-2'} times/week\n` +
                 `• Track progress weekly\n\n` +
                 `This should help you ${isLoss ? 'lose' : 'gain'} about ${isLoss ? '0.5-1' : '0.25-0.5'} kg per week safely.`,
        action: 'SET_GOAL',
        data: {
          type: goalType,
          target: target,
          isLoss: isLoss
        }};
    }

    if (lowerMessage.includes('muscle') || lowerMessage.includes('strength')) {
      return {
        message: "Building muscle requires:\n\n" +
                 "• Progressive overload in training\n" +
                 "• Adequate protein (1.6-2.2g/kg body weight)\n" +
                 "• Slight calorie surplus (200-500 cal/day)\n" +
                 "• 4-5 training sessions per week\n" +
                 "• 7-9 hours of sleep\n" +
                 "• Patience and consistency\n\n" +
                 "Would you like me to create a muscle-building program for you?"};
    }

    return {
      message: "What's your fitness goal? I can help you create a plan to achieve it!"};
  }
}

export const aiService = new AIService();

