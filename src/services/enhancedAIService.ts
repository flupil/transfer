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

interface ConversationContext {
  messages: Message[];
  userProfile: any;
  appState: {
    currentScreen?: string;
    lastWorkout?: any;
    todayStats?: any;
    goals?: any;
  };
}

interface AIResponse {
  message: string;
  action?: string;
  data?: any;
  emotion?: 'happy' | 'encouraging' | 'concerned' | 'excited' | 'neutral';
}

class EnhancedAIService {
  private openaiApiKey: string = '';
  private conversationHistory: Message[] = [];
  private userContext: any = {};
  private maxHistoryLength = 20;

  constructor() {
    this.loadApiKey();
    this.loadConversationHistory();
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

  private async saveConversationHistory() {
    try {
      // Keep only recent messages
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

  async clearHistory() {
    this.conversationHistory = [];
    await AsyncStorage.removeItem('ai_conversation_history');
  }

  async processMessage(message: string, userId?: string): Promise<AIResponse> {
    // Add user message to history
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    this.conversationHistory.push(userMessage);

    // Get current app context
    const context = await this.gatherContext(userId);

    // Decide whether to use OpenAI or local processing
    if (this.openaiApiKey) {
      const response = await this.processWithOpenAI(message, context);
      if (response) {
        // Add assistant response to history
        this.conversationHistory.push({
          role: 'assistant',
          content: response.message,
          timestamp: new Date()
        });
        await this.saveConversationHistory();
        return response;
      }
    }

    // Fallback to enhanced local processing
    return this.processLocally(message, context);
  }

  private async gatherContext(userId?: string): Promise<ConversationContext> {
    let todayStats = null;
    let goals = null;

    if (userId) {
      try {
        todayStats = await firebaseDailyDataService.getTodayData(userId);
        // Get user goals from storage or database
        const goalsData = await AsyncStorage.getItem(`user_goals_${userId}`);
        if (goalsData) goals = JSON.parse(goalsData);
      } catch (error) {
        Alert.alert('Error', 'Gathering context. Please try again.');

        console.error('Error gathering context:', error);
      }
    }

    return {
      messages: this.conversationHistory,
      userProfile: this.userContext,
      appState: {
        todayStats,
        goals
      }
    };
  }

  private async processWithOpenAI(message: string, context: ConversationContext): Promise<AIResponse | null> {
    try {
      const systemPrompt = `You are Kira, the AI fitness coach inside [GymAppName].
You ONLY identify as Kira. Never call yourself anything else.

Your job is to generate workout programs based only on the user's inputs.
Follow all rules below exactly.

Current context:
${context.appState.todayStats ? `Today's stats: ${JSON.stringify(context.appState.todayStats)}` : ''}
${context.appState.goals ? `User's goals: ${JSON.stringify(context.appState.goals)}` : ''}

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
        ...context.messages.slice(-10).map(msg => ({
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
          temperature: 0.8,
          max_tokens: 500,
          presence_penalty: 0.6,
          frequency_penalty: 0.3,
          functions: [
            {
              name: 'trigger_action',
              description: 'Trigger an action in the fitness app',
              parameters: {
                type: 'object',
                properties: {
                  action: {
                    type: 'string',
                    enum: ['CREATE_WORKOUT', 'LOG_MEAL', 'GET_STATS', 'SET_GOAL', 'START_WORKOUT', 'SHOW_EXERCISES', 'TRACK_WATER', 'SET_REMINDER']
                  },
                  data: {
                    type: 'object',
                    description: 'Additional data for the action'
                  },
                  emotion: {
                    type: 'string',
                    enum: ['happy', 'encouraging', 'concerned', 'excited', 'neutral'],
                    description: 'The emotional tone of the response'
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
        console.error('OpenAI API error:', response.status);
        return null;
      }

      const data = await response.json();
      const choice = data.choices[0];

      let action: string | undefined;
      let actionData: any;
      let emotion: any = 'neutral';

      if (choice.message.function_call) {
        const args = JSON.parse(choice.message.function_call.arguments);
        action = args.action;
        actionData = args.data;
        emotion = args.emotion || 'neutral';
      }

      return {
        message: choice.message.content,
        action,
        data: actionData,
        emotion
      };
    } catch (error) {
      Alert.alert('Error', 'OpenAI processing error. Please try again.');

      console.error('OpenAI processing error:', error);
      return null;
    }
  }

  private async processLocally(message: string, context: ConversationContext): Promise<AIResponse> {
    const lowerMessage = message.toLowerCase();

    // Analyze conversation context
    const recentTopics = this.analyzeRecentTopics(context.messages);
    const userMood = this.detectUserMood(message);
    const timeOfDay = new Date().getHours();

    // Time-aware greetings
    if (this.isGreeting(lowerMessage)) {
      let greeting = '';
      if (timeOfDay < 12) greeting = "Good morning! ";
      else if (timeOfDay < 17) greeting = "Good afternoon! ";
      else greeting = "Good evening! ";

      if (context.appState.todayStats?.workoutCompleted) {
        return {
          message: `${greeting}Great job on completing your workout today! How are you feeling?`,
          emotion: 'happy'
        };
      } else {
        return {
          message: `${greeting}Ready to make today count? What can I help you with?`,
          emotion: 'encouraging'
        };
      }
    }

    // Contextual responses based on recent topics
    if (recentTopics.includes('workout') && lowerMessage.includes('tired')) {
      return {
        message: "I understand you're feeling tired. Rest is just as important as training! Would you prefer a light stretching session instead, or should we plan your workout for tomorrow when you're feeling more energized?",
        emotion: 'concerned'
      };
    }

    // Personalized workout suggestions
    if (lowerMessage.includes('workout') || lowerMessage.includes('exercise')) {
      const lastWorkoutMention = this.findLastMention('workout', context.messages);
      if (lastWorkoutMention && this.isRecent(lastWorkoutMention.timestamp)) {
        return {
          message: "I see we were just talking about workouts! Shall we continue with that plan, or would you like to try something different today?",
          action: 'CREATE_WORKOUT',
          emotion: 'encouraging'
        };
      }

      return this.generateWorkoutResponse(message, context);
    }

    // Nutrition with memory
    if (lowerMessage.includes('eat') || lowerMessage.includes('food') || lowerMessage.includes('hungry')) {
      if (context.appState.todayStats?.calories?.consumed > 0) {
        const remaining = (context.appState.todayStats?.calories?.target || 2000) - context.appState.todayStats.calories.consumed;
        return {
          message: `You've had ${context.appState.todayStats.calories.consumed} calories today with ${remaining} remaining. What did you just eat? I'll help you track it!`,
          action: 'LOG_MEAL',
          emotion: 'neutral'
        };
      }

      return {
        message: "Let's track your meal! Tell me what you're eating and I'll help log the nutrition.",
        action: 'LOG_MEAL',
        emotion: 'encouraging'
      };
    }

    // Emotional support
    if (userMood === 'negative') {
      return {
        message: "I sense you might be going through a tough time. Remember, fitness is a journey, not a destination. Every small step counts, and you're doing better than you think. Would you like to talk about what's on your mind, or shall we focus on something positive like planning a fun workout?",
        emotion: 'concerned'
      };
    }

    // Progress check with insights
    if (lowerMessage.includes('progress') || lowerMessage.includes('how am i doing')) {
      return this.generateProgressResponse(context);
    }

    // Default conversational response with memory
    const previousTopics = this.extractTopics(context.messages);
    if (previousTopics.length > 0) {
      return {
        message: `That's interesting! Earlier we were discussing ${previousTopics[0]}. ${this.generateFollowUp(message, previousTopics[0])}`,
        emotion: 'neutral'
      };
    }

    return {
      message: "I'm here to help with your fitness journey! Whether it's workouts, nutrition, or just need someone to talk to, I'm here. What's on your mind?",
      emotion: 'encouraging'
    };
  }

  private analyzeRecentTopics(messages: Message[]): string[] {
    const recentMessages = messages.slice(-5);
    const topics: string[] = [];

    recentMessages.forEach(msg => {
      const content = msg.content.toLowerCase();
      if (content.includes('workout')) topics.push('workout');
      if (content.includes('food') || content.includes('eat')) topics.push('nutrition');
      if (content.includes('tired') || content.includes('sleep')) topics.push('rest');
      if (content.includes('goal')) topics.push('goals');
    });

    return [...new Set(topics)];
  }

  private detectUserMood(message: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['great', 'awesome', 'good', 'happy', 'excited', 'motivated', 'ready'];
    const negativeWords = ['tired', 'sad', 'frustrated', 'angry', 'stressed', 'worried', 'cant', "don't"];

    const lower = message.toLowerCase();
    const positiveCount = positiveWords.filter(word => lower.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lower.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private isGreeting(message: string): boolean {
    const greetings = ['hi', 'hello', 'hey', 'morning', 'afternoon', 'evening', 'sup', 'howdy'];
    return greetings.some(g => message.includes(g));
  }

  private findLastMention(topic: string, messages: Message[]): Message | null {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].content.toLowerCase().includes(topic)) {
        return messages[i];
      }
    }
    return null;
  }

  private isRecent(timestamp: Date): boolean {
    const now = new Date();
    const diffMinutes = (now.getTime() - timestamp.getTime()) / (1000 * 60);
    return diffMinutes < 30;
  }

  private extractTopics(messages: Message[]): string[] {
    const topics = new Set<string>();
    messages.forEach(msg => {
      if (msg.content.toLowerCase().includes('workout')) topics.add('your workout plans');
      if (msg.content.toLowerCase().includes('weight')) topics.add('your weight goals');
      if (msg.content.toLowerCase().includes('diet')) topics.add('your nutrition');
    });
    return Array.from(topics);
  }

  private generateFollowUp(currentMessage: string, previousTopic: string): string {
    const followUps: { [key: string]: string } = {
      'your workout plans': "How's your training been going? Need any adjustments to your routine?",
      'your weight goals': "How are you progressing toward your weight goals? Remember, consistency is key!",
      'your nutrition': "Have you been sticking to your nutrition plan? I can help track your meals if you'd like."
    };
    return followUps[previousTopic] || "Is there anything specific you'd like to focus on today?";
  }

  private generateWorkoutResponse(message: string, context: ConversationContext): AIResponse {
    const timeOfDay = new Date().getHours();

    if (timeOfDay < 10) {
      return {
        message: "Morning workouts are amazing for energy! Based on your recent activity, I'd suggest a moderate intensity session. Want me to create a custom morning workout for you?",
        action: 'CREATE_WORKOUT',
        emotion: 'excited'
      };
    } else if (timeOfDay < 14) {
      return {
        message: "Lunch break workout? Great idea! I can create a quick 30-minute session that'll energize your afternoon. Interested?",
        action: 'CREATE_WORKOUT',
        emotion: 'encouraging'
      };
    } else {
      return {
        message: "Evening training session coming up! Based on the time, I'd recommend something that won't interfere with your sleep. Shall I design a workout for you?",
        action: 'CREATE_WORKOUT',
        emotion: 'encouraging'
      };
    }
  }

  private generateProgressResponse(context: ConversationContext): AIResponse {
    const stats = context.appState.todayStats;

    if (!stats) {
      return {
        message: "I'd love to show you your progress, but I need to gather your data first. Let me check your stats!",
        action: 'GET_STATS',
        emotion: 'neutral'
      };
    }

    const calorieProgress = stats.calories ? (stats.calories.consumed / stats.calories.target * 100).toFixed(0) : 0;
    const waterProgress = stats.water ? (stats.water.consumed / stats.water.target * 100).toFixed(0) : 0;

    let message = `Here's your progress today:\n\n`;
    message += `📊 Calories: ${calorieProgress}% of goal\n`;
    message += `💧 Hydration: ${waterProgress}% of goal\n`;

    if (stats.workoutCompleted) {
      message += `💪 Workout: Completed! Great job!\n`;
    } else {
      message += `💪 Workout: Not yet - ready to crush it?\n`;
    }

    let emotion: any = 'neutral';
    if (Number(calorieProgress) > 80 && stats.workoutCompleted) {
      message += `\nYou're having an amazing day! Keep up the fantastic work! 🌟`;
      emotion = 'excited';
    } else if (Number(calorieProgress) < 50 && !stats.workoutCompleted) {
      message += `\nStill plenty of time to hit your goals today. I'm here to help!`;
      emotion = 'encouraging';
    }

    return {
      message,
      action: 'GET_STATS',
      emotion
    };
  }
}

export const enhancedAIService = new EnhancedAIService();