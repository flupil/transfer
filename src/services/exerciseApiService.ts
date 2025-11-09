import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

interface ExerciseApiData {
  name: string;
  type: string;
  muscle: string;
  equipment: string;
  difficulty: string;
  instructions: string;
}

class ExerciseApiService {
  private apiKey = 's3NcFSQqSMvEeRGVgU9cng==3zvWqumKOJ7FnJWc';
  private baseUrl = 'https://api.api-ninjas.com/v1';
  private cache: Map<string, any> = new Map();

  async getExerciseByName(name: string): Promise<ExerciseApiData | null> {
    // Check cache first
    const cacheKey = `exercise_${name.toLowerCase()}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseUrl}/exercises?name=${encodeURIComponent(name)}`, {
        headers: {
          'X-Api-Key': this.apiKey
        }
      });

      if (!response.ok) {
        console.error('API Error:', response.status);
        return this.getFallbackExercise(name);
      }

      const data = await response.json();
      if (data && data.length > 0) {
        const exercise = data[0];
        this.cache.set(cacheKey, exercise);
        return exercise;
      }

      return this.getFallbackExercise(name);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch exercise. Please try again.');

      console.error('Failed to fetch exercise:', error);
      return this.getFallbackExercise(name);
    }
  }

  async getExercisesByMuscle(muscle: string, limit: number = 5): Promise<ExerciseApiData[]> {
    const cacheKey = `muscle_${muscle.toLowerCase()}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseUrl}/exercises?muscle=${encodeURIComponent(muscle)}`, {
        headers: {
          'X-Api-Key': this.apiKey
        }
      });

      if (!response.ok) {
        return this.getFallbackExercisesForMuscle(muscle);
      }

      const data = await response.json();
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch exercises. Please try again.');

      console.error('Failed to fetch exercises:', error);
      return this.getFallbackExercisesForMuscle(muscle);
    }
  }

  // Fallback data for when API is unavailable
  private getFallbackExercise(name: string): ExerciseApiData {
    const fallbackData: { [key: string]: ExerciseApiData } = {
      'bench press': {
        name: 'Bench Press',
        type: 'strength',
        muscle: 'chest',
        equipment: 'barbell',
        difficulty: 'intermediate',
        instructions: '1. Lie flat on a bench with your eyes under the bar.\n2. Grip the bar with hands slightly wider than shoulder-width.\n3. Lower the bar slowly to your chest.\n4. Press the bar back up to starting position.\n5. Keep your feet flat on the floor and maintain a slight arch in your back.'
      },
      'squat': {
        name: 'Squat',
        type: 'strength',
        muscle: 'quadriceps',
        equipment: 'barbell',
        difficulty: 'intermediate',
        instructions: '1. Stand with feet shoulder-width apart.\n2. Place the barbell on your upper back.\n3. Lower your body by bending at the hips and knees.\n4. Go down until thighs are parallel to the floor.\n5. Push through your heels to return to starting position.'
      },
      'deadlift': {
        name: 'Deadlift',
        type: 'strength',
        muscle: 'hamstrings',
        equipment: 'barbell',
        difficulty: 'intermediate',
        instructions: '1. Stand with feet hip-width apart, bar over mid-foot.\n2. Bend at hips and knees, grip the bar.\n3. Keep back straight, chest up.\n4. Lift by driving through heels and extending hips.\n5. Stand tall with shoulders back.\n6. Lower the bar with control.'
      },
      'pull-up': {
        name: 'Pull-up',
        type: 'strength',
        muscle: 'lats',
        equipment: 'body_only',
        difficulty: 'intermediate',
        instructions: '1. Hang from a pull-up bar with overhand grip.\n2. Hands slightly wider than shoulders.\n3. Pull your body up until chin is over the bar.\n4. Lower yourself with control.\n5. Keep core engaged throughout.'
      },
      'push-up': {
        name: 'Push-up',
        type: 'strength',
        muscle: 'chest',
        equipment: 'body_only',
        difficulty: 'beginner',
        instructions: '1. Start in plank position.\n2. Lower body until chest nearly touches floor.\n3. Push back up to starting position.\n4. Keep body in straight line.\n5. Engage core throughout movement.'
      },
      'plank': {
        name: 'Plank',
        type: 'strength',
        muscle: 'abdominals',
        equipment: 'body_only',
        difficulty: 'beginner',
        instructions: '1. Start in push-up position on forearms.\n2. Keep body in straight line from head to heels.\n3. Engage core and hold position.\n4. Breathe normally.\n5. Maintain neutral spine.'
      }
    };

    const key = name.toLowerCase().replace('_', ' ');
    return fallbackData[key] || {
      name: name,
      type: 'strength',
      muscle: 'multiple',
      equipment: 'various',
      difficulty: 'intermediate',
      instructions: 'Perform the exercise with proper form and control. Consult a trainer for specific guidance.'
    };
  }

  private getFallbackExercisesForMuscle(muscle: string): ExerciseApiData[] {
    const exercises: { [key: string]: ExerciseApiData[] } = {
      chest: [
        this.getFallbackExercise('bench press'),
        this.getFallbackExercise('push-up'),
        {
          name: 'Chest Fly',
          type: 'strength',
          muscle: 'chest',
          equipment: 'dumbbell',
          difficulty: 'beginner',
          instructions: '1. Lie on bench with dumbbells.\n2. Start with arms extended above chest.\n3. Lower weights in arc motion.\n4. Return to starting position.'
        }
      ],
      back: [
        this.getFallbackExercise('pull-up'),
        this.getFallbackExercise('deadlift'),
        {
          name: 'Bent Over Row',
          type: 'strength',
          muscle: 'middle_back',
          equipment: 'barbell',
          difficulty: 'intermediate',
          instructions: '1. Bend forward at hips.\n2. Pull bar to lower chest.\n3. Squeeze shoulder blades.\n4. Lower with control.'
        }
      ],
      legs: [
        this.getFallbackExercise('squat'),
        this.getFallbackExercise('deadlift'),
        {
          name: 'Lunges',
          type: 'strength',
          muscle: 'quadriceps',
          equipment: 'body_only',
          difficulty: 'beginner',
          instructions: '1. Step forward with one leg.\n2. Lower hips until knees at 90 degrees.\n3. Push back to starting position.\n4. Alternate legs.'
        }
      ],
      shoulders: [
        {
          name: 'Overhead Press',
          type: 'strength',
          muscle: 'shoulders',
          equipment: 'barbell',
          difficulty: 'intermediate',
          instructions: '1. Start with bar at shoulder level.\n2. Press bar overhead.\n3. Lock out arms.\n4. Lower with control.'
        },
        {
          name: 'Lateral Raises',
          type: 'strength',
          muscle: 'shoulders',
          equipment: 'dumbbell',
          difficulty: 'beginner',
          instructions: '1. Hold dumbbells at sides.\n2. Raise arms to shoulder height.\n3. Pause briefly.\n4. Lower with control.'
        }
      ],
      abdominals: [
        this.getFallbackExercise('plank'),
        {
          name: 'Crunches',
          type: 'strength',
          muscle: 'abdominals',
          equipment: 'body_only',
          difficulty: 'beginner',
          instructions: '1. Lie on back, knees bent.\n2. Hands behind head.\n3. Lift shoulders off floor.\n4. Lower with control.'
        }
      ]
    };

    return exercises[muscle.toLowerCase()] || [];
  }

  // Get YouTube video URL for exercise (uses search)
  getYouTubeUrl(exerciseName: string): string {
    const query = encodeURIComponent(`${exerciseName} exercise form tutorial`);
    return `https://www.youtube.com/results?search_query=${query}`;
  }

  // Get embedded video player URL
  getEmbeddedVideoUrl(exerciseName: string): string {
    // This would need actual video IDs from a database or mapping
    // For now, returns a search URL
    const query = encodeURIComponent(exerciseName);
    return `https://www.youtube.com/embed/?listType=search&list=${query}`;
  }
}

export const exerciseApiService = new ExerciseApiService();
export const getExerciseInfo = (name: string) => exerciseApiService.getExerciseByName(name);
export const getExercisesByMuscle = (muscle: string) => exerciseApiService.getExercisesByMuscle(muscle);
export const getExerciseVideoUrl = (name: string) => exerciseApiService.getYouTubeUrl(name);