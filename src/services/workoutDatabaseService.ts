import workoutPlansData from '../data/professionalWorkoutPlans.json';

interface WorkoutPlan {
  plan_id: number;
  title: string;
  days: {
    day: string;
    exercises: string[];
  }[];
}

class WorkoutDatabaseService {
  private workoutPlans: WorkoutPlan[] = workoutPlansData;

  // Search for workout plans matching user criteria
  searchWorkoutPlans(query: string): WorkoutPlan | null {
    const lowerQuery = query.toLowerCase().replace(/[^a-z0-9\s]/g, '');

    // Score each plan based on relevance
    const scores = this.workoutPlans.slice(0, 5).map((plan, index) => {
      let score = 0;

      // Experience level detection
      if (this.containsAny(lowerQuery, ['beginner', 'begin', 'new', 'start', 'basic', 'easy'])) {
        if (index === 0) score += 10; // Plan 1 is beginner
      }
      if (this.containsAny(lowerQuery, ['intermediate', 'inter', 'moderate', 'med'])) {
        if (index === 1) score += 10; // Plan 2 is intermediate
      }
      if (this.containsAny(lowerQuery, ['advanced', 'adv', 'expert', 'heavy', 'hard'])) {
        if (index === 2) score += 10; // Plan 3 is advanced
      }

      // Split type detection
      if (this.containsAny(lowerQuery, ['full', 'body', 'total', 'whole'])) {
        if (index === 0) score += 8;
      }
      if (this.containsAny(lowerQuery, ['push', 'pull', 'leg', 'ppl'])) {
        if (index === 1) score += 8;
      }
      if (this.containsAny(lowerQuery, ['upper', 'lower'])) {
        if (index === 2) score += 8;
      }

      // Goal detection
      if (this.containsAny(lowerQuery, ['strength', 'strong', 'power'])) {
        if (index === 2) score += 7;
      }
      if (this.containsAny(lowerQuery, ['muscle', 'mass', 'gain', 'build', 'bulk', 'hypertrophy'])) {
        if (index === 1) score += 7;
      }
      if (this.containsAny(lowerQuery, ['weight', 'loss', 'fat', 'lose', 'cut', 'cardio', 'endurance'])) {
        if (index === 3) score += 10;
      }
      if (this.containsAny(lowerQuery, ['balanced', 'hybrid', 'mix', 'combined'])) {
        if (index === 4) score += 8;
      }
      if (this.containsAny(lowerQuery, ['active', 'general', 'health', 'fit', 'stay'])) {
        if (index === 0) score += 5;
      }

      // Generic workout request gets beginner plan
      if (this.containsAny(lowerQuery, ['workout', 'routine', 'plan', 'program']) && score === 0) {
        if (index === 0) score += 3;
      }

      return { plan, score };
    });

    // Sort by score and return best match
    scores.sort((a, b) => b.score - a.score);

    console.log('Plan scores:', scores.map(s => `Plan ${s.plan.plan_id}: ${s.score}`));

    // Return plan if score is above threshold
    if (scores[0].score >= 5) {
      return scores[0].plan;
    }

    // No good match found
    return null;
  }

  private containsAny(text: string, keywords: string[]): boolean {
    return keywords.some(keyword => text.includes(keyword));
  }

  // Format workout plan to match the 🔥 format
  formatWorkoutPlan(plan: WorkoutPlan): string {
    let formatted = `🔥 ${plan.title}\n\n`;

    // Add warm-up if it's the first day
    formatted += `Warm-up (5–7 min):\n`;
    formatted += `- Arm circles – 10 each direction\n`;
    formatted += `- Leg swings – 10 each leg\n`;
    formatted += `- Light cardio – 2 min\n\n`;

    // Add each day
    plan.days.forEach((day, index) => {
      formatted += `${day.day}\n`;
      day.exercises.forEach(exercise => {
        formatted += `- ${exercise}\n`;
      });

      // Add spacing between days
      if (index < plan.days.length - 1) {
        formatted += `\n`;
      }
    });

    // Add tips
    formatted += `\n💡 Tips:\n`;
    formatted += `- Rest 60–90s between sets\n`;
    formatted += `- RPE 7–8/10 effort\n`;
    formatted += `- Follow this plan for 4–6 weeks`;

    return formatted;
  }

  // Get all plans
  getAllPlans(): WorkoutPlan[] {
    return this.workoutPlans;
  }

  // Get plan by ID
  getPlanById(planId: number): WorkoutPlan | undefined {
    return this.workoutPlans.find(plan => plan.plan_id === planId);
  }
}

export const workoutDatabaseService = new WorkoutDatabaseService();
export default workoutDatabaseService;
