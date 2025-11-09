import professionalWorkoutPlans from '../data/professionalWorkoutPlans.json';

interface OnboardingData {
  goals?: string[];
  fitnessLevel?: number; // 0-5
  workoutPreferences?: string[]; // 'home', 'gym', 'outdoor', 'yoga'
  workoutDays?: string[]; // day names
  calorieTarget?: number;
  calorieTargetType?: string;
}

interface WorkoutPlan {
  id: number;
  name: string;
  goal: string;
  experience: string;
  duration: string;
  daysPerWeek: number;
  equipment: string;
  description: string;
}

interface MealPlan {
  id: string;
  name: string;
  calorieRange: string;
  type: string;
  description: string;
}

// Fitness level mapping: 0-1 = beginner, 2-3 = intermediate, 4-5 = advanced
const getFitnessExperience = (fitnessLevel: number): string => {
  if (fitnessLevel <= 1) return 'beginner';
  if (fitnessLevel <= 3) return 'intermediate';
  return 'advanced';
};

// Map onboarding goals to workout plan goals
const mapGoalToWorkoutGoal = (goal: string): string => {
  const goalMap: Record<string, string> = {
    'lose-weight': 'fat_loss',
    'gain-muscle': 'muscle_building',
    'get-stronger': 'strength',
    'improve-endurance': 'endurance',
    'stay-active': 'general_fitness',
    'improve-flexibility': 'flexibility',
    'reduce-stress': 'general_fitness',
    'sport-performance': 'sport_performance',
  };
  return goalMap[goal] || 'general_fitness';
};

// Map workout preferences to equipment type
const getEquipmentType = (preferences: string[]): string => {
  if (preferences.includes('gym')) return 'gym';
  if (preferences.includes('home')) return 'none';
  if (preferences.includes('yoga')) return 'none';
  if (preferences.includes('outdoor')) return 'minimal';
  return 'none';
};

export const selectWorkoutPlan = (onboardingData: OnboardingData): WorkoutPlan | null => {
  const { goals = [], fitnessLevel = 0, workoutPreferences = [], workoutDays = [] } = onboardingData;

  if (goals.length === 0) return null;

  const experience = getFitnessExperience(fitnessLevel);
  const primaryGoal = mapGoalToWorkoutGoal(goals[0]);
  const equipment = getEquipmentType(workoutPreferences);
  const daysPerWeek = workoutDays.length || 3;

  // Score each plan
  const scoredPlans = professionalWorkoutPlans.map((plan: any) => {
    let score = 0;

    // Experience level match (highest priority)
    if (plan.experience === experience) score += 40;
    else if (experience === 'beginner' && plan.experience === 'intermediate') score += 20;
    else if (experience === 'advanced' && plan.experience === 'intermediate') score += 20;

    // Goal match (high priority)
    if (plan.goal === primaryGoal) score += 30;
    // Secondary goals
    if (goals.length > 1 && plan.goal === mapGoalToWorkoutGoal(goals[1])) score += 15;

    // Equipment match
    if (plan.equipment === equipment) score += 15;
    else if (equipment === 'none' && plan.equipment === 'minimal') score += 10;
    else if (equipment === 'gym' && plan.equipment === 'dumbbells') score += 8;

    // Days per week (close match preferred)
    const daysDiff = Math.abs(plan.daysPerWeek - daysPerWeek);
    if (daysDiff === 0) score += 15;
    else if (daysDiff === 1) score += 10;
    else if (daysDiff === 2) score += 5;

    return { plan, score };
  });

  // Sort by score and return best match
  scoredPlans.sort((a, b) => b.score - a.score);

  console.log('Top 3 workout plan matches:');
  scoredPlans.slice(0, 3).forEach((item, index) => {
    console.log(`${index + 1}. ${item.plan.name} (Score: ${item.score})`);
  });

  return scoredPlans[0]?.plan || null;
};

// Score individual meal based on criteria
const scoreMeal = (
  meal: any,
  targetCalories: number,
  goals: string[],
  dietaryPreferences: string[],
  allergens: string[]
): number => {
  let score = 0;

  // Calorie match (50 points)
  if (meal.nutrition?.calories) {
    const calorieDiff = Math.abs(meal.nutrition.calories - targetCalories);
    // Perfect match if within 50 calories
    if (calorieDiff <= 50) {
      score += 50;
    } else {
      // Decrease score based on distance
      score += Math.max(0, 50 - (calorieDiff / 10));
    }
  }

  // Meal type bonus (25 points if specified)
  // This ensures we get meals appropriate for the time of day

  // Dietary preference match (30 points)
  if (meal.dietaryTags && dietaryPreferences.length > 0) {
    const matchCount = dietaryPreferences.filter(pref =>
      meal.dietaryTags.some((tag: string) => tag.toLowerCase() === pref.toLowerCase())
    ).length;
    score += (matchCount / dietaryPreferences.length) * 30;
  } else if (dietaryPreferences.length === 0) {
    score += 15; // Neutral score if no preferences
  }

  // Allergen check (disqualify)
  if (meal.allergens && allergens.length > 0) {
    const hasAllergen = allergens.some(allergen =>
      meal.allergens.some((mealAllergen: string) =>
        mealAllergen.toLowerCase() === allergen.toLowerCase()
      )
    );
    if (hasAllergen) {
      return -1000; // Disqualify
    }
  }

  // Goal alignment (20 points)
  if (meal.goals && goals.length > 0) {
    const goalMap: Record<string, string[]> = {
      'lose-weight': ['weight_loss', 'fat_loss', 'cutting'],
      'gain-muscle': ['muscle_gain', 'bulking', 'mass_building'],
      'get-stronger': ['strength', 'performance'],
      'improve-endurance': ['endurance', 'performance'],
      'stay-active': ['balanced', 'general'],
    };

    const primaryGoalMatches = goalMap[goals[0]] || [];
    if (meal.goals.some((g: string) => primaryGoalMatches.includes(g.toLowerCase()))) {
      score += 20;
    }
  }

  return score;
};

// Select best meal for a specific meal type and calorie target
const selectMealByType = (
  mealPlans: any[],
  mealType: string,
  targetCalories: number,
  goals: string[],
  dietaryPreferences: string[],
  allergens: string[]
): any | null => {
  // Filter meals by type
  const mealsOfType = mealPlans.filter(
    meal => meal.mealType?.toLowerCase() === mealType.toLowerCase()
  );

  if (mealsOfType.length === 0) return null;

  // Score each meal
  const scoredMeals = mealsOfType.map(meal => ({
    meal,
    score: scoreMeal(meal, targetCalories, goals, dietaryPreferences, allergens)
  }));

  // Filter and sort
  const validMeals = scoredMeals.filter(item => item.score >= 0);
  validMeals.sort((a, b) => b.score - a.score);

  return validMeals[0]?.meal || null;
};

// Select complete daily meal plan
export const selectDailyMealPlan = (mealPlans: any[], onboardingData: OnboardingData) => {
  const { goals = [], calorieTarget, dietaryPreferences = [], allergens = [] } = onboardingData;

  if (!calorieTarget || !mealPlans || mealPlans.length === 0) return null;

  // Typical calorie distribution:
  // Breakfast: 25%, Lunch: 35%, Dinner: 30%, Snacks: 10%
  const breakfastCals = Math.round(calorieTarget * 0.25);
  const lunchCals = Math.round(calorieTarget * 0.35);
  const dinnerCals = Math.round(calorieTarget * 0.30);
  const snackCals = Math.round(calorieTarget * 0.10);

  const breakfast = selectMealByType(mealPlans, 'breakfast', breakfastCals, goals, dietaryPreferences, allergens);
  const lunch = selectMealByType(mealPlans, 'lunch', lunchCals, goals, dietaryPreferences, allergens);
  const dinner = selectMealByType(mealPlans, 'dinner', dinnerCals, goals, dietaryPreferences, allergens);
  const snack = selectMealByType(mealPlans, 'snack', snackCals, goals, dietaryPreferences, allergens);

  const dailyPlan = {
    breakfast,
    lunch,
    dinner,
    snack,
    totalCalories: (breakfast?.nutrition?.calories || 0) +
                   (lunch?.nutrition?.calories || 0) +
                   (dinner?.nutrition?.calories || 0) +
                   (snack?.nutrition?.calories || 0),
    targetCalories: calorieTarget
  };

  console.log('Daily Meal Plan Selected:');
  console.log(`Breakfast: ${breakfast?.name || 'None'} (${breakfast?.nutrition?.calories || 0} cal)`);
  console.log(`Lunch: ${lunch?.name || 'None'} (${lunch?.nutrition?.calories || 0} cal)`);
  console.log(`Dinner: ${dinner?.name || 'None'} (${dinner?.nutrition?.calories || 0} cal)`);
  console.log(`Snack: ${snack?.name || 'None'} (${snack?.nutrition?.calories || 0} cal)`);
  console.log(`Total: ${dailyPlan.totalCalories} cal (Target: ${calorieTarget} cal)`);

  return dailyPlan;
};

// Legacy function for single meal plan selection (backward compatibility)
export const selectMealPlan = (mealPlans: any[], onboardingData: OnboardingData): any | null => {
  const dailyPlan = selectDailyMealPlan(mealPlans, onboardingData);

  // Return a summary object with the best overall plan
  if (!dailyPlan) return null;

  return {
    id: 'daily-plan',
    name: 'Your Daily Meal Plan',
    breakfast: dailyPlan.breakfast,
    lunch: dailyPlan.lunch,
    dinner: dailyPlan.dinner,
    snack: dailyPlan.snack,
    totalCalories: dailyPlan.totalCalories,
    targetCalories: dailyPlan.targetCalories
  };
};
