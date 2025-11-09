import { GoogleGenerativeAI } from '@google/generative-ai';
import { workoutDatabaseService } from './workoutDatabaseService';
import { getSelectedMealPlan } from './mealPlanService';
import { getSelectedWorkoutPlan } from './workoutPlanService';
import { Alert } from 'react-native';
// @ts-ignore
import { GEMINI_API_KEY } from '@env';
import { translate } from '../contexts/LanguageContext';

class GeminiAIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private apiKey: string = '';
  private chat: any = null;

  constructor() {
    // Load API key from environment variables
    this.apiKey = GEMINI_API_KEY || '';

    this.initialize();
  }

  private initialize() {
    if (this.apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(this.apiKey);
        // Use gemini-pro model (gemini-1.5-flash requires different API setup)
        this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });

        // Start a chat session for context
        this.chat = this.model.startChat({
          history: [
            {
              role: "user",
              parts: [{ text: `You are Kira, the AI fitness coach inside [GymAppName].
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
Do not add anything else before or after the workout.` }]
            },
            {
              role: "model",
              parts: [{ text: "Understood. I am Kira. I will generate workout programs using ONLY the specified markdown format. No extra text before or after. I will follow all rules exactly." }]
            },
          ],
          generationConfig: {
            maxOutputTokens: 1000,
            temperature: 0.7,
            topP: 0.9,
          },
        });

        console.log('Gemini AI initialized successfully');
      } catch (error) {
        Alert.alert('Error', 'Failed to initialize Gemini AI. Please try again.');

        console.error('Failed to initialize Gemini AI:', error);
      }
    }
  }

  async processMessage(message: string, userId?: string): Promise<any> {
    try {
      // Load user's current plans
      const userContext = await this.getUserContext(userId);

      // STEP 1: Check what type of request this is
      const isAskingAboutCurrentPlan = this.isAskingAboutCurrentPlan(message);
      const isWorkoutRequest = this.isWorkoutRequest(message);
      const isNutritionRequest = this.isNutritionRequest(message);
      console.log('Request type - About Plan:', isAskingAboutCurrentPlan, 'Workout:', isWorkoutRequest, 'Nutrition:', isNutritionRequest);

      // STEP 1.5: Handle questions about current plans
      if (isAskingAboutCurrentPlan) {
        console.log('User asking about their current plan...');
        return this.answerAboutCurrentPlan(message, userContext);
      }

      // STEP 2: Handle workout requests
      if (isWorkoutRequest) {
        const selectedPlan = await this.intelligentPlanSelection(message, userContext);
        console.log('AI selected plan:', selectedPlan);

        if (selectedPlan && selectedPlan.plan_id) {
          const plan = workoutDatabaseService.getPlanById(selectedPlan.plan_id);
          if (plan) {
            const formattedWorkout = workoutDatabaseService.formatWorkoutPlan(plan);
            console.log('Returning database workout: Plan', plan.plan_id);
            return {
              message: formattedWorkout,
              model: 'Database + AI Selection',
              source: 'workout_database'
            };
          }
        }
      }

      // STEP 3: Handle nutrition requests with specialized prompt
      if (isNutritionRequest) {
        console.log('Processing nutrition request...');
        return await this.processNutritionRequest(message, userContext);
      }

      console.log('Using general AI generation...');

      // STEP 3: No database match, use AI
      // If chat not initialized, try direct model call
      if (!this.chat && this.model) {
        // Direct model call with 15 second timeout
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('AI request timed out')), 15000)
        );

        const result = await Promise.race([
          this.model.generateContent(message),
          timeoutPromise
        ]) as any;

        const response = await result.response;
        const text = response.text();

        return {
          message: text,
          model: 'Gemini Pro'
        };
      }

      if (!this.chat) {
        throw new Error('Gemini AI not initialized');
      }

      // Use chat session if available with 15 second timeout
      // Add reminder to follow format strictly
      const messageWithReminder = `${message}

REMINDER: Output ONLY the workout in the exact format specified. Start with 🔥. No extra text.`;

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI request timed out')), 15000)
      );

      const result = await Promise.race([
        this.chat.sendMessage(messageWithReminder),
        timeoutPromise
      ]) as any;

      const response = await result.response;
      let text = response.text();

      // Post-process: Extract only the workout format (starting with 🔥)
      text = this.extractWorkoutFormat(text);

      return {
        message: text,
        model: 'Gemini 1.5 Flash'
      };

    } catch (error: any) {
      Alert.alert('Error', 'Gemini AI Error. Please try again.');

      console.error('Gemini AI Error:', error);

      // Fallback response if API fails
      const fallbackResponses = [
        "I'm having trouble connecting right now. Please try again in a moment.",
        "Sorry, I couldn't process that. Could you rephrase your question?",
        "I'm experiencing some technical difficulties. Please try again.",
        "Connection issue detected. Please ensure you have internet access."
      ];

      return {
        message: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        model: 'Fallback'
      };
    }
  }

  // Use AI to intelligently select the best workout plan
  private async intelligentPlanSelection(message: string, userContext: any): Promise<{ plan_id: number } | null> {
    try {
      if (!this.model) return null;

      let contextNote = '';
      if (userContext.workoutPlan) {
        contextNote = `\nNote: User currently has "${userContext.workoutPlan.name}" plan.`;
      }

      const selectionPrompt = `Analyze this workout request and respond with ONLY a number 1-25:

Plans:
1 = Beginner Full Body Strength (3 days, gym, strength)
2 = PHUL (4 days, gym, intermediate muscle building)
3 = Fat Loss HIIT Circuit (4 days, minimal equipment, fat loss)
4 = Women's Sculpt & Tone (5 days, gym, beginner tone)
5 = Dumbbell Home Workout (3 days, dumbbells only, muscle building)
6 = Advanced Strength Program (4 days, gym, powerlifting)
7 = Bodyweight Home (4 days, no equipment, general fitness)
8 = Push Pull Legs (6 days, gym, intermediate muscle)
9 = Beginner Endurance & Cardio (4 days, minimal, cardio)
10 = Intermediate Cardio Blast (5 days, minimal, endurance)
11 = Upper Lower Split (4 days, gym, intermediate muscle)
12 = 5-Day Body Part Split (5 days, gym, advanced muscle)
13 = Beginner Home Strength (3 days, dumbbells, strength)
14 = Active Recovery & Mobility (3 days, none, flexibility)
15 = Advanced Athlete Training (6 days, gym, sport performance)
16 = Intermediate Fat Shredder (5 days, gym, fat loss)
17 = Beginner's PPL (3 days, gym, beginner muscle)
18 = 6-Day Strength & Hypertrophy (6 days, gym, advanced strength)
19 = Home HIIT for Fat Loss (4 days, none, beginner fat loss)
20 = Outdoor Running Program (4 days, none, intermediate endurance)
21 = Women's Beginner Gym (3 days, gym, beginner tone)
22 = Advanced 7-Day Shred (7 days, gym, advanced fat loss)
23 = Intermediate Home Athlete (4 days, dumbbells, sport performance)
24 = Beginner Stay Active (3 days, none, general fitness)
25 = Intermediate Flexibility & Yoga (4 days, none, flexibility)

User: "${message}"${contextNote}

Respond with ONLY the number (1-25). Nothing else.`;

      const result = await this.model.generateContent(selectionPrompt);
      const response = await result.response;
      const text = response.text().trim();

      console.log('AI plan selection raw response:', text);

      // Extract first number found (1-25)
      const numberMatch = text.match(/\b([1-9]|1[0-9]|2[0-5])\b/);
      if (numberMatch) {
        const planId = parseInt(numberMatch[0]);
        console.log('AI selected plan ID:', planId);
        return { plan_id: planId };
      }

      console.log('No valid plan number found in AI response');
      return null;
    } catch (error) {
      Alert.alert('Error', 'In intelligent plan selection. Please try again.');

      console.error('Error in intelligent plan selection:', error);
      return null;
    }
  }

  // Check if user is asking about their CURRENT plan (not requesting a new one)
  private isAskingAboutCurrentPlan(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const questionWords = ['what', 'whats', "what's", 'tell me', 'show me', 'which', 'my current', 'do i have'];
    const planWords = ['meal plan', 'diet plan', 'nutrition plan', 'workout plan', 'training plan', 'program', 'routine'];

    const hasQuestionWord = questionWords.some(q => lowerMessage.includes(q));
    const hasPlanWord = planWords.some(p => lowerMessage.includes(p));
    const hasMy = lowerMessage.includes('my');

    return hasQuestionWord && (hasPlanWord || hasMy);
  }

  // Answer questions about user's current plans
  private answerAboutCurrentPlan(message: string, userContext: any): any {
    const lowerMessage = message.toLowerCase();
    let response = '';

    // Check if asking about meal plan
    if (lowerMessage.includes('meal') || lowerMessage.includes('diet') || lowerMessage.includes('nutrition') || lowerMessage.includes('food')) {
      if (userContext.mealPlan) {
        response = `Your current meal plan is **${userContext.mealPlan.name}** 🍽️\n\n`;
        response += `• Daily Calories: ${userContext.mealPlan.dailyCalories}\n`;
        response += `• Protein: ${userContext.mealPlan.macros?.protein}g\n`;
        response += `• Carbs: ${userContext.mealPlan.macros?.carbs}g\n`;
        response += `• Fat: ${userContext.mealPlan.macros?.fat}g\n\n`;
        if (userContext.mealPlan.description) {
          response += `${userContext.mealPlan.description}`;
        }
      } else {
        response = "You don't have a meal plan set yet. Would you like me to help you choose one? Just tell me your goal (weight loss, muscle gain, etc.) and I can recommend one! 🍽️";
      }
    }
    // Check if asking about workout plan
    else if (lowerMessage.includes('workout') || lowerMessage.includes('training') || lowerMessage.includes('exercise')) {
      if (userContext.workoutPlan) {
        response = `Your current workout plan is **${userContext.workoutPlan.name}** 💪\n\n`;
        response += `• Training ${userContext.workoutPlan.daysPerWeek} days per week\n`;
        if (userContext.workoutPlan.description) {
          response += `\n${userContext.workoutPlan.description}`;
        }
      } else {
        response = "You don't have a workout plan set yet. Tell me your fitness goal and experience level, and I'll recommend the perfect plan! 💪";
      }
    }
    // Both or unclear
    else {
      let plans = [];
      if (userContext.mealPlan) {
        plans.push(`**Meal Plan:** ${userContext.mealPlan.name} (${userContext.mealPlan.dailyCalories} calories)`);
      }
      if (userContext.workoutPlan) {
        plans.push(`**Workout Plan:** ${userContext.workoutPlan.name} (${userContext.workoutPlan.daysPerWeek} days/week)`);
      }

      if (plans.length > 0) {
        response = "Here are your current plans:\n\n" + plans.join('\n\n');
      } else {
        response = "You don't have any plans set up yet. I can help you create personalized workout and meal plans! Just tell me your goals. 🎯";
      }
    }

    return {
      message: response,
      model: 'Plan Info',
      source: 'user_plans'
    };
  }

  // Check if message is asking for a workout
  private isWorkoutRequest(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const workoutKeywords = [
      'workout', 'exercise', 'training', 'plan', 'routine',
      'gym', 'lift', 'push', 'pull', 'legs', 'chest', 'back',
      'arms', 'shoulders', 'abs', 'core', 'strength', 'cardio',
      'beginner', 'intermediate', 'advanced', 'full body',
      'upper', 'lower', 'split'
    ];

    return workoutKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Get user's current context (meal plan, workout plan)
  private async getUserContext(userId?: string): Promise<any> {
    try {
      const mealPlan = await getSelectedMealPlan();
      const workoutPlan = await getSelectedWorkoutPlan();

      return {
        mealPlan: mealPlan ? {
          name: mealPlan.name,
          dailyCalories: mealPlan.dailyCalories,
          macros: mealPlan.macros,
          description: mealPlan.description
        } : null,
        workoutPlan: workoutPlan ? {
          name: workoutPlan.name,
          description: workoutPlan.description,
          daysPerWeek: workoutPlan.workouts?.length || 0
        } : null
      };
    } catch (error) {
      Alert.alert('Error', 'Loading user context. Please try again.');

      console.error('Error loading user context:', error);
      return { mealPlan: null, workoutPlan: null };
    }
  }

  // Process nutrition requests with specialized guidance
  private async processNutritionRequest(message: string, userContext: any): Promise<any> {
    try {
      if (!this.model) {
        throw new Error('Gemini AI not initialized');
      }

      // Build context string
      let contextInfo = '';
      if (userContext.mealPlan) {
        contextInfo += `\n**User's Current Meal Plan:** ${userContext.mealPlan.name}`;
        contextInfo += `\n- Daily Calories: ${userContext.mealPlan.dailyCalories}`;
        contextInfo += `\n- Macros: Protein ${userContext.mealPlan.macros?.protein}g, Carbs ${userContext.mealPlan.macros?.carbs}g, Fat ${userContext.mealPlan.macros?.fat}g`;
      }
      if (userContext.workoutPlan) {
        contextInfo += `\n**User's Current Workout Plan:** ${userContext.workoutPlan.name}`;
        contextInfo += `\n- Training ${userContext.workoutPlan.daysPerWeek} days per week`;
      }

      const nutritionPrompt = `You are Kira, an expert nutrition coach. The user asked: "${message}"
${contextInfo ? `\n${contextInfo}\n` : ''}
Provide clear, actionable nutrition advice following these guidelines:

**Format:**
- Be concise and direct (3-5 sentences max for simple questions)
- Use bullet points for lists
- Include practical tips
- Mention rough numbers (calories, macros) when relevant
- Reference their current meal plan when appropriate

**Topics you can help with:**
- Meal planning and prep
- Calorie and macro guidance
- Healthy food choices
- Supplements and vitamins
- Diet strategies (keto, vegan, etc.)
- Weight loss/gain nutrition
- Pre/post workout nutrition
- Hydration

**Important rules:**
- No medical advice (redirect serious health issues to doctors)
- Evidence-based recommendations only
- Acknowledge individual differences
- Be supportive and non-judgmental
- If they have a meal plan, tailor advice to it

Respond naturally as Kira, the friendly nutrition coach.`;

      const result = await this.model.generateContent(nutritionPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        message: text,
        model: 'Gemini Nutrition Coach',
        source: 'nutrition_advice'
      };
    } catch (error) {
      Alert.alert('Error', 'Nutrition request error. Please try again.');

      console.error('Nutrition request error:', error);
      return {
        message: "I'm having trouble with nutrition advice right now. Please try asking about workouts or try again later!",
        model: 'Error'
      };
    }
  }

  // Check if message is asking for nutrition advice
  private isNutritionRequest(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const nutritionKeywords = [
      'nutrition', 'diet', 'food', 'eat', 'meal', 'calories',
      'protein', 'carbs', 'fat', 'macro', 'supplement', 'vitamin',
      'weight loss', 'weight gain', 'lose weight', 'gain weight',
      'healthy', 'recipe', 'breakfast', 'lunch', 'dinner', 'snack',
      'vegetarian', 'vegan', 'keto', 'paleo', 'fasting',
      'hungry', 'craving', 'cheat meal'
    ];

    return nutritionKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Extract workout format from response (remove extra text)
  private extractWorkoutFormat(text: string): string {
    // Find the workout format starting with 🔥
    const fireEmojiIndex = text.indexOf('🔥');

    if (fireEmojiIndex === -1) {
      // No workout format found, return original text
      return text;
    }

    // Extract from 🔥 onwards
    let workout = text.substring(fireEmojiIndex);

    // Remove any text after the Tips section (common endings)
    const endPatterns = [
      /\n\n(Let me know|Feel free|If you|Hope this|Remember|Don't forget|Please|Would you|Any questions|Happy training|Good luck).*/is,
      /\n\n---\n\n.*/s,
      /\n\n\*\*.*/s
    ];

    for (const pattern of endPatterns) {
      workout = workout.replace(pattern, '');
    }

    return workout.trim();
  }

  // Update API key
  setApiKey(key: string) {
    this.apiKey = key;
    this.initialize();
  }

  // Reset chat session
  resetChat() {
    if (this.model) {
      this.chat = this.model.startChat({
        history: [],
        generationConfig: {
          maxOutputTokens: 500,
          temperature: 0.9,
          topP: 1,
        },
      });
    }
  }
}

export const geminiAIService = new GeminiAIService();