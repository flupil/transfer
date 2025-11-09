import { workoutService } from '../services/workoutService';
import { Exercise, CustomWorkout } from '../types';

// Sample Hebrew workout data - fill this with actual data from your .docx files
const hebrewWorkoutPlans = [
  {
    name: "תוכנית פול בודי 1",
    description: "תוכנית אימון לכל הגוף - גרסה 1",
    difficulty: "intermediate" as const,
    duration: 60,
    exercises: [
      {
        name: "סקווט",
        sets: 4,
        reps: "10-12",
        rest: 90,
        weight: null,
        notes: "תרגיל בסיסי לרגליים"
      },
      {
        name: "לחיצת חזה",
        sets: 3,
        reps: "8-10",
        rest: 90,
        weight: null,
        notes: "עם משקולות או מוט"
      },
      {
        name: "חתירה בכבל",
        sets: 3,
        reps: "12-15",
        rest: 60,
        weight: null,
        notes: "לחיזוק הגב"
      },
      {
        name: "לחיצת כתפיים",
        sets: 3,
        reps: "10-12",
        rest: 60,
        weight: null,
        notes: "עם משקולות"
      },
      {
        name: "כפיפות ביד",
        sets: 3,
        reps: "12-15",
        rest: 45,
        weight: null,
        notes: "לחיזוק הזרועות"
      }
    ]
  },
  {
    name: "תוכנית פול בודי 2",
    description: "תוכנית אימון לכל הגוף - גרסה 2",
    difficulty: "intermediate" as const,
    duration: 60,
    exercises: [
      // Add exercises from second plan here
    ]
  },
  {
    name: "תוכנית פול בודי 3",
    description: "תוכנית אימון לכל הגוף - גרסה 3",
    difficulty: "advanced" as const,
    duration: 75,
    exercises: [
      // Add exercises from third plan here
    ]
  }
];

// Hebrew to English exercise name mapping
const exerciseMapping: { [key: string]: string } = {
  "סקווט": "Squat",
  "לחיצת חזה": "Bench Press",
  "חתירה בכבל": "Cable Row",
  "לחיצת כתפיים": "Shoulder Press",
  "כפיפות ביד": "Bicep Curl",
  "פשיטות ביד": "Tricep Extension",
  "דדליפט": "Deadlift",
  "עליות מתח": "Pull-ups",
  "שכיבות שמיכה": "Push-ups",
  "כפיפות בטן": "Crunches",
  "פלאנק": "Plank",
  "לחיצת רגליים": "Leg Press",
  "סקווט בולגרי": "Bulgarian Split Squat",
  "היפ ת'ראסט": "Hip Thrust",
  "חתירה במשקולת": "Dumbbell Row",
  "פרפר חזה": "Chest Fly",
  // Add more mappings as needed
};

export class HebrewWorkoutImporter {

  /**
   * Import all Hebrew workout plans into the app
   */
  async importAllWorkouts(): Promise<void> {
    console.log('Starting Hebrew workout import...');

    for (const plan of hebrewWorkoutPlans) {
      try {
        await this.importSingleWorkout(plan);
        console.log(`✅ Successfully imported: ${plan.name}`);
      } catch (error) {
        console.error(`❌ Failed to import ${plan.name}:`, error);
      }
    }

    console.log('Import complete!');
  }

  /**
   * Import a single workout plan
   */
  private async importSingleWorkout(plan: any): Promise<void> {
    // Map exercise names to English if needed
    const mappedExercises = plan.exercises.map((exercise: any) => ({
      ...exercise,
      englishName: exerciseMapping[exercise.name] || exercise.name,
    }));

    // Create the workout using the service
    const workoutData: Partial<CustomWorkout> = {
      name: plan.name,
      description: plan.description,
      difficulty: plan.difficulty,
      duration: plan.duration,
      exercises: mappedExercises.map((ex: any) => ({
        id: Date.now().toString() + Math.random(),
        name: ex.name, // Keep Hebrew name
        sets: ex.sets,
        reps: ex.reps,
        duration: null,
        rest: ex.rest,
        weight: ex.weight,
        notes: ex.notes
      })),
      createdAt: new Date().toISOString(),
      userId: 'system', // Mark as system-provided workout
    };

    await workoutService.createCustomWorkout(workoutData);
  }

  /**
   * Get exercise by Hebrew name
   */
  getExerciseByHebrewName(hebrewName: string): string {
    return exerciseMapping[hebrewName] || hebrewName;
  }
}

// Export singleton instance
export const hebrewWorkoutImporter = new HebrewWorkoutImporter();