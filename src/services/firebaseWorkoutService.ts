import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { COLLECTIONS } from '../config/firebaseConstants';

export interface Exercise {
  id: string;
  name: string;
  category: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'cardio';
  equipment?: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  instructions?: string;
}

export interface WorkoutSet {
  setNumber: number;
  reps: number;
  weight: number; // in kg or lbs based on user preference
  completed: boolean;
  notes?: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
  restTime?: number; // in seconds
  notes?: string;
}

export interface WorkoutSession {
  id?: string;
  userId: string;
  name: string;
  date: Date;
  startTime?: Date;
  endTime?: Date;
  exercises: WorkoutExercise[];
  totalVolume?: number; // total weight lifted
  duration?: number; // in minutes
  notes?: string;
  completed: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkoutPlan {
  id?: string;
  name: string;
  description?: string;
  creatorId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  durationWeeks: number;
  workoutsPerWeek: number;
  workouts: {
    day: number;
    name: string;
    exercises: {
      exerciseId: string;
      exerciseName: string;
      sets: number;
      reps: string; // e.g., "8-12"
      restTime: number;
    }[];
  }[];
  tags?: string[];
  isPublic: boolean;
  createdAt?: Date;
}

// Pre-defined exercises for the library
export const EXERCISE_LIBRARY: Exercise[] = [
  // Chest
  { id: 'bench-press', name: 'Bench Press', category: 'chest', equipment: 'Barbell', primaryMuscles: ['Chest'], secondaryMuscles: ['Triceps', 'Shoulders'] },
  { id: 'incline-bench', name: 'Incline Bench Press', category: 'chest', equipment: 'Barbell', primaryMuscles: ['Upper Chest'], secondaryMuscles: ['Triceps', 'Shoulders'] },
  { id: 'db-fly', name: 'Dumbbell Fly', category: 'chest', equipment: 'Dumbbells', primaryMuscles: ['Chest'] },
  { id: 'push-up', name: 'Push Up', category: 'chest', equipment: 'Bodyweight', primaryMuscles: ['Chest'], secondaryMuscles: ['Triceps'] },

  // Back
  { id: 'deadlift', name: 'Deadlift', category: 'back', equipment: 'Barbell', primaryMuscles: ['Back', 'Glutes', 'Hamstrings'] },
  { id: 'pull-up', name: 'Pull Up', category: 'back', equipment: 'Pull-up Bar', primaryMuscles: ['Lats', 'Upper Back'], secondaryMuscles: ['Biceps'] },
  { id: 'bent-row', name: 'Bent Over Row', category: 'back', equipment: 'Barbell', primaryMuscles: ['Back'], secondaryMuscles: ['Biceps'] },
  { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'back', equipment: 'Cable', primaryMuscles: ['Lats'] },

  // Legs
  { id: 'squat', name: 'Squat', category: 'legs', equipment: 'Barbell', primaryMuscles: ['Quads', 'Glutes'], secondaryMuscles: ['Hamstrings'] },
  { id: 'leg-press', name: 'Leg Press', category: 'legs', equipment: 'Machine', primaryMuscles: ['Quads', 'Glutes'] },
  { id: 'lunges', name: 'Lunges', category: 'legs', equipment: 'Dumbbells', primaryMuscles: ['Quads', 'Glutes'] },
  { id: 'leg-curl', name: 'Leg Curl', category: 'legs', equipment: 'Machine', primaryMuscles: ['Hamstrings'] },
  { id: 'calf-raise', name: 'Calf Raise', category: 'legs', equipment: 'Machine', primaryMuscles: ['Calves'] },

  // Shoulders
  { id: 'overhead-press', name: 'Overhead Press', category: 'shoulders', equipment: 'Barbell', primaryMuscles: ['Shoulders'], secondaryMuscles: ['Triceps'] },
  { id: 'lateral-raise', name: 'Lateral Raise', category: 'shoulders', equipment: 'Dumbbells', primaryMuscles: ['Side Delts'] },
  { id: 'front-raise', name: 'Front Raise', category: 'shoulders', equipment: 'Dumbbells', primaryMuscles: ['Front Delts'] },

  // Arms
  { id: 'bicep-curl', name: 'Bicep Curl', category: 'arms', equipment: 'Dumbbells', primaryMuscles: ['Biceps'] },
  { id: 'hammer-curl', name: 'Hammer Curl', category: 'arms', equipment: 'Dumbbells', primaryMuscles: ['Biceps', 'Forearms'] },
  { id: 'tricep-dips', name: 'Tricep Dips', category: 'arms', equipment: 'Parallel Bars', primaryMuscles: ['Triceps'] },
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', category: 'arms', equipment: 'Cable', primaryMuscles: ['Triceps'] },

  // Core
  { id: 'plank', name: 'Plank', category: 'core', equipment: 'Bodyweight', primaryMuscles: ['Core'] },
  { id: 'crunches', name: 'Crunches', category: 'core', equipment: 'Bodyweight', primaryMuscles: ['Abs'] },
  { id: 'russian-twist', name: 'Russian Twist', category: 'core', equipment: 'Bodyweight', primaryMuscles: ['Obliques'] },

  // Cardio
  { id: 'running', name: 'Running', category: 'cardio', equipment: 'Treadmill', primaryMuscles: ['Cardiovascular'] },
  { id: 'cycling', name: 'Cycling', category: 'cardio', equipment: 'Bike', primaryMuscles: ['Cardiovascular'] },
  { id: 'rowing', name: 'Rowing', category: 'cardio', equipment: 'Rowing Machine', primaryMuscles: ['Cardiovascular', 'Back'] }
];

/**
 * Firebase Workout Service
 * Handles workout sessions, exercises, and workout plan management
 */
class FirebaseWorkoutService {
  /**
   * Save or update a workout session
   * Creates new session if no ID provided, otherwise updates existing session
   * @param workout - Workout session object to save
   * @returns Promise with the workout session ID
   * @throws Error if save fails
   */
  async saveWorkoutSession(workout: WorkoutSession): Promise<string> {
    try {
      const workoutData = {
        ...workout,
        date: Timestamp.fromDate(workout.date),
        startTime: workout.startTime ? Timestamp.fromDate(workout.startTime) : null,
        endTime: workout.endTime ? Timestamp.fromDate(workout.endTime) : null,
        updatedAt: serverTimestamp()
      };

      if (workout.id) {
        await updateDoc(doc(db, COLLECTIONS.WORKOUTS, workout.id), workoutData);
        return workout.id;
      } else {
        const docRef = doc(collection(db, COLLECTIONS.WORKOUTS));
        await setDoc(docRef, {
          ...workoutData,
          createdAt: serverTimestamp()
        });
        return docRef.id;
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      throw error;
    }
  }

  /**
   * Get user's workout history
   * Retrieves user's workout sessions ordered by date (most recent first)
   * @param userId - User's unique identifier
   * @param limitCount - Maximum number of workouts to retrieve (default: 20)
   * @returns Promise with array of workout sessions
   * @throws Error if retrieval fails
   */
  async getUserWorkouts(userId: string, limitCount: number = 20): Promise<WorkoutSession[]> {
    try {
      const q = query(
        collection(db, COLLECTIONS.WORKOUTS),
        where('userId', '==', userId),
        orderBy('date', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        startTime: doc.data().startTime?.toDate(),
        endTime: doc.data().endTime?.toDate(),
      } as WorkoutSession));
    } catch (error) {
      console.error('Error fetching workouts:', error);
      return [];
    }
  }

  // Start a new workout session
  async startWorkout(userId: string, name: string, exercises: WorkoutExercise[]): Promise<string> {
    const workout: WorkoutSession = {
      userId,
      name,
      date: new Date(),
      startTime: new Date(),
      exercises,
      completed: false,
      totalVolume: 0
    };

    return this.saveWorkoutSession(workout);
  }

  // Complete a workout session
  async completeWorkout(workoutId: string): Promise<void> {
    try {
      const workoutRef = doc(db, COLLECTIONS.WORKOUTS, workoutId);
      const workoutSnap = await getDoc(workoutRef);

      if (!workoutSnap.exists()) {
        throw new Error('Workout not found');
      }

      const workout = workoutSnap.data() as WorkoutSession;

      // Calculate total volume
      let totalVolume = 0;
      workout.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          if (set.completed) {
            totalVolume += set.weight * set.reps;
          }
        });
      });

      // Calculate duration
      const endTime = new Date();
      const startTime = workout.startTime ? new Date(workout.startTime as any) : workout.date;
      const duration = Math.round((endTime.getTime() - new Date(startTime).getTime()) / 60000);

      await updateDoc(workoutRef, {
        endTime: Timestamp.fromDate(endTime),
        completed: true,
        totalVolume,
        duration,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error completing workout:', error);
      throw error;
    }
  }

  // Update a specific exercise set
  async updateSet(
    workoutId: string,
    exerciseIndex: number,
    setIndex: number,
    updates: Partial<WorkoutSet>
  ): Promise<void> {
    try {
      const workoutRef = doc(db, COLLECTIONS.WORKOUTS, workoutId);
      const workoutSnap = await getDoc(workoutRef);

      if (!workoutSnap.exists()) {
        throw new Error('Workout not found');
      }

      const workout = workoutSnap.data();
      const exercises = workout.exercises;

      if (exercises[exerciseIndex] && exercises[exerciseIndex].sets[setIndex]) {
        exercises[exerciseIndex].sets[setIndex] = {
          ...exercises[exerciseIndex].sets[setIndex],
          ...updates
        };

        await updateDoc(workoutRef, {
          exercises,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error updating set:', error);
      throw error;
    }
  }

  // Get exercise library
  getExerciseLibrary(): Exercise[] {
    return EXERCISE_LIBRARY;
  }

  // Search exercises
  searchExercises(searchTerm: string, category?: string): Exercise[] {
    let filtered = EXERCISE_LIBRARY;

    if (category) {
      filtered = filtered.filter(ex => ex.category === category);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(term) ||
        ex.primaryMuscles.some(m => m.toLowerCase().includes(term))
      );
    }

    return filtered;
  }

  // Get sample workout plans
  getSampleWorkoutPlans(): WorkoutPlan[] {
    return [
      {
        name: 'Beginner Full Body',
        description: 'Perfect for beginners. 3 days per week full body workout.',
        creatorId: 'system',
        difficulty: 'beginner',
        durationWeeks: 4,
        workoutsPerWeek: 3,
        isPublic: true,
        workouts: [
          {
            day: 1,
            name: 'Full Body A',
            exercises: [
              { exerciseId: 'squat', exerciseName: 'Squat', sets: 3, reps: '8-12', restTime: 90 },
              { exerciseId: 'bench-press', exerciseName: 'Bench Press', sets: 3, reps: '8-12', restTime: 90 },
              { exerciseId: 'bent-row', exerciseName: 'Bent Over Row', sets: 3, reps: '8-12', restTime: 90 },
              { exerciseId: 'overhead-press', exerciseName: 'Overhead Press', sets: 3, reps: '8-12', restTime: 60 },
              { exerciseId: 'plank', exerciseName: 'Plank', sets: 3, reps: '30-60s', restTime: 60 }
            ]
          },
          {
            day: 3,
            name: 'Full Body B',
            exercises: [
              { exerciseId: 'deadlift', exerciseName: 'Deadlift', sets: 3, reps: '5-8', restTime: 120 },
              { exerciseId: 'pull-up', exerciseName: 'Pull Up', sets: 3, reps: '5-10', restTime: 90 },
              { exerciseId: 'db-fly', exerciseName: 'Dumbbell Fly', sets: 3, reps: '10-15', restTime: 60 },
              { exerciseId: 'lunges', exerciseName: 'Lunges', sets: 3, reps: '10-12', restTime: 60 },
              { exerciseId: 'bicep-curl', exerciseName: 'Bicep Curl', sets: 3, reps: '10-15', restTime: 45 }
            ]
          },
          {
            day: 5,
            name: 'Full Body C',
            exercises: [
              { exerciseId: 'leg-press', exerciseName: 'Leg Press', sets: 3, reps: '10-15', restTime: 90 },
              { exerciseId: 'incline-bench', exerciseName: 'Incline Bench Press', sets: 3, reps: '8-12', restTime: 90 },
              { exerciseId: 'lat-pulldown', exerciseName: 'Lat Pulldown', sets: 3, reps: '10-12', restTime: 60 },
              { exerciseId: 'lateral-raise', exerciseName: 'Lateral Raise', sets: 3, reps: '12-15', restTime: 45 },
              { exerciseId: 'tricep-pushdown', exerciseName: 'Tricep Pushdown', sets: 3, reps: '12-15', restTime: 45 }
            ]
          }
        ],
        tags: ['beginner', 'full-body', 'strength']
      },
      {
        name: 'Push Pull Legs',
        description: 'Classic PPL split for intermediate lifters.',
        creatorId: 'system',
        difficulty: 'intermediate',
        durationWeeks: 8,
        workoutsPerWeek: 6,
        isPublic: true,
        workouts: [
          {
            day: 1,
            name: 'Push Day',
            exercises: [
              { exerciseId: 'bench-press', exerciseName: 'Bench Press', sets: 4, reps: '6-8', restTime: 120 },
              { exerciseId: 'overhead-press', exerciseName: 'Overhead Press', sets: 4, reps: '8-10', restTime: 90 },
              { exerciseId: 'incline-bench', exerciseName: 'Incline Bench Press', sets: 3, reps: '8-12', restTime: 90 },
              { exerciseId: 'lateral-raise', exerciseName: 'Lateral Raise', sets: 4, reps: '12-15', restTime: 45 },
              { exerciseId: 'tricep-dips', exerciseName: 'Tricep Dips', sets: 3, reps: '8-12', restTime: 60 }
            ]
          },
          {
            day: 2,
            name: 'Pull Day',
            exercises: [
              { exerciseId: 'deadlift', exerciseName: 'Deadlift', sets: 4, reps: '5-6', restTime: 180 },
              { exerciseId: 'pull-up', exerciseName: 'Pull Up', sets: 4, reps: '6-10', restTime: 90 },
              { exerciseId: 'bent-row', exerciseName: 'Bent Over Row', sets: 4, reps: '8-10', restTime: 90 },
              { exerciseId: 'lat-pulldown', exerciseName: 'Lat Pulldown', sets: 3, reps: '10-12', restTime: 60 },
              { exerciseId: 'bicep-curl', exerciseName: 'Bicep Curl', sets: 4, reps: '10-12', restTime: 45 }
            ]
          },
          {
            day: 3,
            name: 'Legs Day',
            exercises: [
              { exerciseId: 'squat', exerciseName: 'Squat', sets: 4, reps: '6-8', restTime: 150 },
              { exerciseId: 'leg-press', exerciseName: 'Leg Press', sets: 4, reps: '10-12', restTime: 90 },
              { exerciseId: 'leg-curl', exerciseName: 'Leg Curl', sets: 4, reps: '10-12', restTime: 60 },
              { exerciseId: 'lunges', exerciseName: 'Lunges', sets: 3, reps: '10-12', restTime: 60 },
              { exerciseId: 'calf-raise', exerciseName: 'Calf Raise', sets: 4, reps: '15-20', restTime: 45 }
            ]
          }
        ],
        tags: ['intermediate', 'ppl', 'strength', 'hypertrophy']
      }
    ];
  }
}

export default new FirebaseWorkoutService();