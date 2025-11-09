// ExerciseDB API Service - Using local ExerciseDB data
import exercisesData from '../data/exercises.json';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

interface ExerciseDBExercise {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

class ExerciseDBService {
  private exercises: ExerciseDBExercise[] = exercisesData as ExerciseDBExercise[];
  private cache: Map<string, any> = new Map();

  // Get exercise by name
  async getExerciseByName(name: string): Promise<ExerciseDBExercise | null> {
    try {
      const normalizedName = name.toLowerCase().trim();

      // Check cache first
      if (this.cache.has(normalizedName)) {
        return this.cache.get(normalizedName);
      }

      // Find exact match first
      let exercise = this.exercises.find((ex: ExerciseDBExercise) =>
        ex.name.toLowerCase() === normalizedName
      );

      // If no exact match, try partial match
      if (!exercise) {
        exercise = this.exercises.find((ex: ExerciseDBExercise) =>
          ex.name.toLowerCase().includes(normalizedName) ||
          normalizedName.includes(ex.name.toLowerCase())
        );
      }

      // If still no match, try to match common exercise names
      if (!exercise) {
        const exerciseMapping: { [key: string]: string } = {
          'bench press': 'barbell bench press',
          'squat': 'barbell squat',
          'deadlift': 'barbell deadlift',
          'pull-up': 'pull up',
          'pull up': 'pull-up',
          'push-up': 'push up',
          'push up': 'push-up',
          'bicep curl': 'dumbbell bicep curl',
          'bicep curls': 'dumbbell bicep curl',
          'overhead press': 'barbell overhead press',
          'lat pulldown': 'cable lat pulldown',
          'lunges': 'dumbbell lunge',
          'plank': 'plank',
          'leg press': 'leg press',
          'calf raises': 'calf raise',
          'tricep pushdown': 'cable pushdown',
          'bent over row': 'barbell bent over row'
        };

        const mappedName = exerciseMapping[normalizedName];
        if (mappedName) {
          exercise = this.exercises.find((ex: ExerciseDBExercise) =>
            ex.name.toLowerCase().includes(mappedName)
          );
        }
      }

      if (exercise) {
        this.cache.set(normalizedName, exercise);
        return exercise;
      }

      return null;
    } catch (error) {
      Alert.alert('Error', 'Getting exercise by name. Please try again.');

      console.error('Error getting exercise by name:', error);
      return null;
    }
  }

  // Get exercises by body part
  async getExercisesByBodyPart(bodyPart: string, limit: number = 10): Promise<ExerciseDBExercise[]> {
    const exercises = this.exercises.filter(ex =>
      ex.bodyParts.some(bp => bp.toLowerCase().includes(bodyPart.toLowerCase()))
    );
    return exercises.slice(0, limit);
  }

  // Get exercises by equipment
  async getExercisesByEquipment(equipment: string, limit: number = 10): Promise<ExerciseDBExercise[]> {
    const exercises = this.exercises.filter(ex =>
      ex.equipments.some(eq => eq.toLowerCase().includes(equipment.toLowerCase()))
    );
    return exercises.slice(0, limit);
  }

  // Get exercises by target muscle
  async getExercisesByTarget(target: string, limit: number = 10): Promise<ExerciseDBExercise[]> {
    const exercises = this.exercises.filter(ex =>
      ex.targetMuscles.some(tm => tm.toLowerCase().includes(target.toLowerCase()))
    );
    return exercises.slice(0, limit);
  }

  // Search exercises by any field
  searchExercises(query: string): ExerciseDBExercise[] {
    const normalizedQuery = query.toLowerCase();
    return this.exercises.filter(ex =>
      ex.name.toLowerCase().includes(normalizedQuery) ||
      ex.targetMuscles.some(tm => tm.toLowerCase().includes(normalizedQuery)) ||
      ex.bodyParts.some(bp => bp.toLowerCase().includes(normalizedQuery)) ||
      ex.equipments.some(eq => eq.toLowerCase().includes(normalizedQuery))
    );
  }

  // Get all unique body parts
  getBodyPartsList(): string[] {
    const bodyParts = new Set<string>();
    this.exercises.forEach(ex => ex.bodyParts.forEach(bp => bodyParts.add(bp)));
    return Array.from(bodyParts).sort();
  }

  // Get all unique equipment
  getEquipmentList(): string[] {
    const equipment = new Set<string>();
    this.exercises.forEach(ex => ex.equipments.forEach(eq => equipment.add(eq)));
    return Array.from(equipment).sort();
  }

  // Get all unique target muscles
  getTargetMusclesList(): string[] {
    const muscles = new Set<string>();
    this.exercises.forEach(ex => ex.targetMuscles.forEach(tm => muscles.add(tm)));
    return Array.from(muscles).sort();
  }

  // Format exercise data for our app
  formatExerciseData(exercise: ExerciseDBExercise): any {
    // Clean up instructions - remove "Step:X " prefix
    const cleanedInstructions = exercise.instructions.map(inst =>
      inst.replace(/^Step:\d+\s+/, '')
    );

    return {
      name: exercise.name,
      type: 'strength',
      muscle: exercise.targetMuscles[0] || 'multiple',
      equipment: exercise.equipments[0] || 'body weight',
      difficulty: this.getDifficulty(exercise),
      instructions: cleanedInstructions.join('\n'),
      gifUrl: exercise.gifUrl,
      bodyPart: exercise.bodyParts[0] || 'full body',
      secondaryMuscles: exercise.secondaryMuscles || []
    };
  }

  // Estimate difficulty based on equipment and body part
  private getDifficulty(exercise: ExerciseDBExercise): string {
    const bodyWeight = exercise.equipments.includes('body weight');
    const compound = ['chest', 'back', 'upper legs', 'lower legs'].some(part =>
      exercise.bodyParts.some(bp => bp.toLowerCase().includes(part))
    );

    if (bodyWeight && !compound) return 'beginner';
    if (!bodyWeight && compound) return 'intermediate';
    if (exercise.equipments.includes('barbell') && compound) return 'intermediate';
    return 'beginner';
  }

  // Get total exercise count
  getExerciseCount(): number {
    return this.exercises.length;
  }
}

export const exerciseDBService = new ExerciseDBService();
export const getExerciseFromDB = async (name: string) => {
  const exercise = await exerciseDBService.getExerciseByName(name);
  return exercise ? exerciseDBService.formatExerciseData(exercise) : null;
};

// Log available exercises count
console.log(`ExerciseDB loaded with ${exerciseDBService.getExerciseCount()} exercises`);