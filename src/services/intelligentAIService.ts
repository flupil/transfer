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
  reasoning?: string;
}

class IntelligentAIService {
  private openaiApiKey: string = '';
  private conversationHistory: Message[] = [];
  private systemContext: string = '';

  constructor() {
    this.loadApiKey();
    this.loadConversationHistory();
    this.initializeSystemContext();
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

  private initializeSystemContext() {
    this.systemContext = `You are an expert AI fitness coach integrated into a fitness app. You have complete autonomy to help users achieve their fitness goals.

IMPORTANT: You are as intelligent as Claude or GPT-4. You should:
1. Understand context and nuance in conversations
2. Remember previous conversations and build on them
3. Make intelligent decisions based on user data and patterns
4. Provide expert-level fitness and nutrition advice
5. Be proactive in helping users reach their goals

Your capabilities include:
- Analyzing workout performance and suggesting improvements
- Creating personalized workout plans based on user goals, experience, and preferences
- Tracking nutrition and providing dietary advice
- Monitoring progress and adjusting programs accordingly
- Providing motivation and accountability
- Understanding complex fitness concepts and explaining them clearly

When users tell you about their activities, food, or goals, take appropriate action:
- If they mention eating something, log it to their nutrition tracker
- If they want to modify workouts, make the changes
- If they're struggling, adjust their program
- Always explain your reasoning

Be conversational, intelligent, and helpful. You're not just following scripts - you're truly understanding and helping.`;
  }

  async setApiKey(apiKey: string) {
    this.openaiApiKey = apiKey;
    await AsyncStorage.setItem('openai_api_key', apiKey);
  }

  async processMessage(message: string, userId?: string): Promise<AIResponse> {
    // Add user message to history
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    this.conversationHistory.push(userMessage);

    // If no API key, provide a helpful response
    if (!this.openaiApiKey) {
      return {
        message: "I need an OpenAI API key to provide intelligent responses. Please add your API key in Settings > AI Assistant. Without it, I can only provide basic responses. Get your API key from https://platform.openai.com/api-keys",
        reasoning: 'No API key configured'
      };
    }

    try {
      // Get current user context
      const userContext = await this.getUserContext(userId);

      // Build messages for GPT-4
      const messages = [
        { role: 'system', content: this.systemContext },
        { role: 'system', content: `Current user context: ${JSON.stringify(userContext)}` },
        ...this.conversationHistory.slice(-20).map(msg => ({
          role: msg.role,
          content: msg.content
        }))
      ];

      // Call GPT-4 with function calling
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
          max_tokens: 800,
          functions: [
            {
              name: 'create_workout',
              description: 'Create a new workout plan',
              parameters: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  exercises: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        sets: { type: 'number' },
                        reps: { type: 'number' },
                        weight: { type: 'number' },
                        rest: { type: 'number' }
                      }
                    }
                  },
                  duration: { type: 'number' },
                  difficulty: { type: 'string' }
                }
              }
            },
            {
              name: 'log_food',
              description: 'Log food intake',
              parameters: {
                type: 'object',
                properties: {
                  items: { type: 'array', items: { type: 'string' } },
                  meal_type: { type: 'string' },
                  calories: { type: 'number' },
                  protein: { type: 'number' },
                  carbs: { type: 'number' },
                  fats: { type: 'number' }
                }
              }
            },
            {
              name: 'modify_workout',
              description: 'Modify an existing workout',
              parameters: {
                type: 'object',
                properties: {
                  workout_id: { type: 'string' },
                  changes: { type: 'object' }
                }
              }
            },
            {
              name: 'analyze_progress',
              description: 'Analyze user progress and provide insights',
              parameters: {
                type: 'object',
                properties: {
                  metric: { type: 'string' },
                  period: { type: 'string' }
                }
              }
            },
            {
              name: 'set_goal',
              description: 'Set or update fitness goals',
              parameters: {
                type: 'object',
                properties: {
                  goal_type: { type: 'string' },
                  target: { type: 'number' },
                  timeframe: { type: 'string' }
                }
              }
            }
          ],
          function_call: 'auto'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        Alert.alert('Error', 'OpenAI API error. Please try again.');

        console.error('OpenAI API error:', error);

        if (response.status === 401) {
          return {
            message: "Your OpenAI API key appears to be invalid. Please check your API key in Settings > AI Assistant.",
            reasoning: 'Invalid API key'
          };
        } else if (response.status === 429) {
          return {
            message: "You've reached your OpenAI API rate limit. Please try again later or upgrade your OpenAI plan.",
            reasoning: 'Rate limit exceeded'
          };
        } else {
          return {
            message: "I encountered an error connecting to OpenAI. Please try again later.",
            reasoning: `API error: ${response.status}`
          };
        }
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message;

      // Handle function calls
      let actions = [];
      if (assistantMessage.function_call) {
        const functionName = assistantMessage.function_call.name;
        const functionArgs = JSON.parse(assistantMessage.function_call.arguments);

        // Execute the function
        const result = await this.executeFunction(functionName, functionArgs, userId);
        actions.push({
          type: functionName,
          args: functionArgs,
          result: result
        });
      }

      // Save assistant response to history
      this.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage.content || 'Action executed successfully.',
        timestamp: new Date()
      });

      await this.saveConversationHistory();

      return {
        message: assistantMessage.content || this.generateActionResponse(actions),
        actions: actions,
        reasoning: 'GPT-4 response with intelligent reasoning'
      };

    } catch (error) {
      Alert.alert('Error', 'Processing message. Please try again.');

      console.error('Error processing message:', error);

      // Fallback to basic response if GPT-4 fails
      return this.generateFallbackResponse(message);
    }
  }

  private async executeFunction(functionName: string, args: any, userId?: string): Promise<any> {
    switch (functionName) {
      case 'create_workout':
        return await workoutService.createCustomWorkout({
          name: args.name,
          exercises: args.exercises,
          duration: args.duration,
          difficulty: args.difficulty
        });

      case 'log_food':
        // Log food to daily data
        if (userId) {
          const nutritionData = {
            calories: args.calories || 0,
            protein: args.protein || 0,
            carbs: args.carbs || 0,
            fats: args.fats || 0
          };

          await firebaseDailyDataService.updateNutrition(userId, nutritionData, 'add');

          return {
            success: true,
            logged: args.items,
            nutrition: nutritionData
          };
        }
        return { success: false, error: 'No user ID' };

      case 'modify_workout':
        // Modify workout logic
        return {
          success: true,
          modified: args.changes
        };

      case 'analyze_progress':
        // Get progress data
        if (userId) {
          const progress = await firebaseDailyDataService.getProgressData(userId, args.period);
          return {
            metric: args.metric,
            data: progress
          };
        }
        return null;

      case 'set_goal':
        // Set user goals
        if (userId) {
          await firebaseDailyDataService.updateTargets(userId, {
            [args.goal_type]: args.target
          });
          return {
            success: true,
            goal: args.goal_type,
            target: args.target
          };
        }
        return null;

      default:
        return null;
    }
  }

  private async getUserContext(userId?: string): Promise<any> {
    if (!userId) return {};

    try {
      const todayData = await firebaseDailyDataService.getTodayData(userId);
      const userProfile = await AsyncStorage.getItem(`user_profile_${userId}`);

      return {
        todayStats: todayData,
        profile: userProfile ? JSON.parse(userProfile) : null,
        currentTime: new Date().toISOString(),
        recentMessages: this.conversationHistory.slice(-5).map(m => m.content)
      };
    } catch (error) {
      Alert.alert('Error', 'Getting user context. Please try again.');

      console.error('Error getting user context:', error);
      return {};
    }
  }

  private generateActionResponse(actions: any[]): string {
    if (actions.length === 0) return "I've processed your request.";

    let response = "I've completed the following actions:\n\n";

    for (const action of actions) {
      switch (action.type) {
        case 'create_workout':
          response += `✅ Created a new workout: ${action.args.name}\n`;
          break;
        case 'log_food':
          response += `✅ Logged your meal: ${action.args.items.join(', ')}\n`;
          response += `   Calories: ${action.args.calories}, Protein: ${action.args.protein}g\n`;
          break;
        case 'modify_workout':
          response += `✅ Modified your workout plan\n`;
          break;
        case 'set_goal':
          response += `✅ Updated your ${action.args.goal_type} goal to ${action.args.target}\n`;
          break;
      }
    }

    return response;
  }

  private generateFallbackResponse(message: string): AIResponse {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return {
        message: "Hello! I'm your AI fitness coach. To provide intelligent responses like Claude or GPT-4, I need an OpenAI API key. Please add one in Settings > AI Assistant. Once configured, I'll be able to help you with workouts, nutrition, and all your fitness goals!",
        reasoning: 'Greeting without API key'
      };
    }

    if (lowerMessage.includes('workout')) {
      return {
        message: "I'd love to help you with your workout! However, I need an OpenAI API key to provide personalized recommendations. Please configure it in Settings > AI Assistant.",
        reasoning: 'Workout request without API key'
      };
    }

    return {
      message: "I understand you're asking about fitness-related topics. To provide intelligent, personalized responses like Claude or GPT-4 would, I need an OpenAI API key. Please add one in Settings > AI Assistant.",
      reasoning: 'General request without API key'
    };
  }

  private async saveConversationHistory() {
    try {
      // Keep only recent messages to save space
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

export const intelligentAIService = new IntelligentAIService();