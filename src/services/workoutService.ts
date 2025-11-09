import { getSafeDatabase, ensureDatabase } from '../database/databaseHelper';
import { WorkoutPlan, WorkoutLog, Exercise, PersonalRecord, SetLog } from '../types';
import { syncService } from './syncService';
import uuid from 'react-native-uuid';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

class WorkoutService {
  private currentUserId: string | null = null;

  setUserId(userId: string) {
    this.currentUserId = userId;
  }

  async getWorkoutPlans(): Promise<WorkoutPlan[]> {
    try {
      await ensureDatabase();
      const db = getSafeDatabase();
      if (!db) return [];
      const rows = await db.getAllAsync(
        'SELECT * FROM workout_plans WHERE owner IN (?, ?) ORDER BY createdAt DESC',
        ['gym', 'coach']
      ) as any[];

      return rows.map((row) => ({
        ...row,
        workouts: JSON.parse(row.workouts || '[]'),
        assignedUserIds: JSON.parse(row.assignedUserIds || '[]'),
        tags: JSON.parse(row.tags || '[]'),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }));
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('workout.loadPlansFailed'));
      console.error('Failed to get workout plans:', error);
      return [];
    }
  }

  async getWorkoutPlan(planId: string): Promise<WorkoutPlan | null> {
    try {
      const db = getSafeDatabase();
      if (!db) return null;
      const row = await db.getFirstAsync(
        'SELECT * FROM workout_plans WHERE id = ?',
        [planId]
      ) as any;

      if (!row) return null;

      return {
        ...row,
        workouts: JSON.parse(row.workouts || '[]'),
        assignedUserIds: JSON.parse(row.assignedUserIds || '[]'),
        tags: JSON.parse(row.tags || '[]'),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      };
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('workout.loadPlanFailed'));
      console.error('Failed to get workout plan:', error);
      return null;
    }
  }

  async assignPlanToUser(planId: string, userId?: string): Promise<void> {
    try {
      const db = getSafeDatabase();
      if (!db) return;
      await db.runAsync(
        'UPDATE users SET workoutPlanId = ? WHERE id = ?',
        [planId, userId || this.currentUserId || '1']
      );
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('workout.assignPlanFailed'));
      console.error('Failed to assign plan to user:', error);
    }
  }

  async getExercises(): Promise<Exercise[]> {
    try {
      const db = getSafeDatabase();
      if (!db) return [];
      const rows = await db.getAllAsync(
        'SELECT * FROM exercises ORDER BY name',
        []
      ) as any[];

      return rows.map((row) => ({
        ...row,
        primaryMuscles: JSON.parse(row.primaryMuscles || '[]'),
        secondaryMuscles: JSON.parse(row.secondaryMuscles || '[]'),
        createdAt: new Date(row.createdAt),
      }));
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('workout.loadExercisesFailed'));
      console.error('Failed to get exercises:', error);
      return [];
    }
  }

  async createCustomExercise(exercise: Partial<Exercise>): Promise<Exercise> {
    const id = uuid.v4() as string;
    const newExercise: Exercise = {
      id,
      name: exercise.name || '',
      category: exercise.category || 'strength',
      equipment: exercise.equipment,
      primaryMuscles: exercise.primaryMuscles || [],
      secondaryMuscles: exercise.secondaryMuscles,
      imageUrl: exercise.imageUrl,
      videoUrl: exercise.videoUrl,
      instructions: exercise.instructions,
      owner: 'user',
      owner: 'user',
      createdAt: new Date(),
    };

    try {
      const db = getSafeDatabase();
      if (!db) throw new Error('Database not available');
      await db.runAsync(
        `INSERT INTO exercises (id, name, category, equipment, primaryMuscles, secondaryMuscles,
         imageUrl, videoUrl, instructions, owner, createdAt, syncStatus)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 'pending')`,
        [
          newExercise.id,
          newExercise.name,
          newExercise.category,
          newExercise.equipment || '',
          JSON.stringify(newExercise.primaryMuscles),
          JSON.stringify(newExercise.secondaryMuscles || []),
          newExercise.imageUrl || '',
          newExercise.videoUrl || '',
          newExercise.instructions || '',
          newExercise.owner,
          newExercise.owner || 'user',
        ]
      );

      await syncService.queueForSync('exercises', 'INSERT', newExercise);
      return newExercise;
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('workout.createExerciseFailed'));
      console.error('Failed to create custom exercise:', error);
      throw error;
    }
  }

  async startWorkout(planId?: string): Promise<WorkoutLog> {
    const id = uuid.v4() as string;
    const workoutLog: WorkoutLog = {
      id,
      userId: this.currentUserId || '1',
      planId,
      date: new Date(),
      name: planId ? 'Planned Workout' : 'Quick Workout',
      exercises: [],
      personalRecords: [],
      duration: 0,
      usedRestTimer: false,
    };

    try {
      const db = getSafeDatabase();
      if (!db) throw new Error('Database not available');
      await db.runAsync(
        `INSERT INTO workout_logs (id, userId, planId, date, name, exercises, personalRecords,
         duration, usedRestTimer, syncStatus)
         VALUES (?, ?, ?, ?, ?, '[]', '[]', 0, 0, 'pending')`,
        [workoutLog.id, workoutLog.userId, workoutLog.planId || '', workoutLog.date.toISOString().split('T')[0], workoutLog.name]
      );

      await syncService.queueForSync('workout_logs', 'INSERT', workoutLog);
      return workoutLog;
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('workout.startWorkoutFailed'));
      console.error('Failed to start workout:', error);
      throw error;
    }
  }

  async logSet(workoutLogId: string, exerciseId: string, setData: SetLog): Promise<void> {
    try {
      const db = getSafeDatabase();
      if (!db) return;
      const row = await db.getFirstAsync(
        'SELECT exercises FROM workout_logs WHERE id = ?',
        [workoutLogId]
      ) as any;

      if (!row) throw new Error('Workout log not found');

      const exercises = JSON.parse(row.exercises || '[]');
      let exerciseEntry = exercises.find((e: any) => e.exerciseId === exerciseId);

      if (!exerciseEntry) {
        exerciseEntry = {
          exerciseId,
          exerciseName: '',
          sets: [],
        };
        exercises.push(exerciseEntry);
      }

      exerciseEntry.sets.push(setData);

      await db.runAsync(
        'UPDATE workout_logs SET exercises = ?, syncStatus = ? WHERE id = ?',
        [JSON.stringify(exercises), 'pending', workoutLogId]
      );

      await syncService.queueForSync('workout_logs', 'UPDATE', { id: workoutLogId, exercises });
    } catch (error) {
      Alert.alert('Error', 'Failed to log set. Please try again.');
      console.error('Failed to log set:', error);
      throw error;
    }
  }

  async logWorkout(workout: Partial<WorkoutLog>): Promise<void> {
    try {
      const db = getSafeDatabase();
      if (!db) throw new Error('Database not available');

      const id = uuid.v4() as string;
      await db.runAsync(
        `INSERT INTO workout_logs (id, userId, planId, date, name, exercises, personalRecords,
         duration, notes, mood, energy, usedRestTimer, completedAt, syncStatus)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          id,
          workout.userId || this.currentUserId || '1',
          workout.planId || null,
          typeof workout.date === 'string' ? workout.date : (workout.date || new Date()).toISOString().split('T')[0],
          workout.name || 'Workout',
          JSON.stringify(workout.exercises || []),
          JSON.stringify(workout.personalRecords || []),
          workout.duration || 0,
          workout.notes || '',
          workout.mood || 3,
          workout.energy || 3,
          workout.usedRestTimer ? 1 : 0,
          typeof workout.completedAt === 'string' ? workout.completedAt : (workout.completedAt || new Date()).toISOString(),
        ]
      );

      await syncService.queueForSync('workout_logs', 'INSERT', { ...workout, id });
    } catch (error) {
      Alert.alert('Error', 'Failed to log workout. Please try again.');
      console.error('Failed to log workout:', error);
      throw error;
    }
  }

  async completeWorkout(workoutLogId: string): Promise<WorkoutLog> {
    try {
      const db = getSafeDatabase();
      if (!db) throw new Error('Database not available');
      await db.runAsync(
        'UPDATE workout_logs SET completedAt = datetime("now"), syncStatus = ? WHERE id = ?',
        ['pending', workoutLogId]
      );

      const log = await db.getFirstAsync(
        'SELECT * FROM workout_logs WHERE id = ?',
        [workoutLogId]
      ) as any;

      if (!log) throw new Error('Workout log not found');

      const workoutLog = {
        ...log,
        exercises: JSON.parse(log.exercises || '[]'),
        personalRecords: JSON.parse(log.personalRecords || '[]'),
        date: new Date(log.date),
        completedAt: new Date(log.completedAt),
      };

      await syncService.queueForSync('workout_logs', 'UPDATE', workoutLog);
      return workoutLog;
    } catch (error) {
      Alert.alert('Error', 'Failed to complete workout. Please try again.');
      console.error('Failed to complete workout:', error);
      throw error;
    }
  }

  async getWorkoutHistory(userId: string, days: number): Promise<WorkoutLog[]> {
    try {
      const db = getSafeDatabase();
      if (!db) return [];
      const rows = await db.getAllAsync(
        `SELECT * FROM workout_logs
         WHERE userId = ? AND date >= date('now', '-${days} days')
         ORDER BY date DESC`,
        [userId]
      ) as any[];

      return rows.map((row) => ({
        ...row,
        exercises: JSON.parse(row.exercises || '[]'),
        personalRecords: JSON.parse(row.personalRecords || '[]'),
        date: new Date(row.date),
        completedAt: row.completedAt ? new Date(row.completedAt) : undefined,
        syncedAt: row.syncedAt ? new Date(row.syncedAt) : undefined,
      }));
    } catch (error) {
      Alert.alert('Error', 'Failed to load workout history. Please try again.');
      console.error('Failed to get workout history:', error);
      return [];
    }
  }

  async getPersonalRecords(userId: string): Promise<PersonalRecord[]> {
    try {
      const db = getSafeDatabase();
      if (!db) return [];
      const rows = await db.getAllAsync(
        `SELECT personalRecords FROM workout_logs WHERE userId = ? AND personalRecords != '[]'`,
        [userId]
      ) as any[];

      const allRecords: PersonalRecord[] = [];
      for (const row of rows) {
        const records = JSON.parse(row.personalRecords || '[]');
        allRecords.push(...records.map((r: any) => ({
          ...r,
          date: new Date(r.date),
        })));
      }
      return allRecords;
    } catch (error) {
      Alert.alert('Error', 'Failed to load personal records. Please try again.');
      console.error('Failed to get personal records:', error);
      return [];
    }
  }

  async getTodayWorkout(date: string): Promise<any> {
    return {
      name: 'Upper Body Strength',
      exercises: [
        { name: 'Bench Press', sets: 4, reps: '8-10' },
        { name: 'Pull-ups', sets: 3, reps: '8-12' },
        { name: 'Shoulder Press', sets: 3, reps: '10-12' },
      ],
      duration: 45,
      completionRate: 65,
    };
  }

  async createCustomWorkout(workout: {
    name: string;
    description?: string;
    exercises: Array<{
      exerciseId: string;
      sets: number;
      reps: string;
      restSeconds?: number;
      notes?: string;
    }>;
    tags?: string[];
  }): Promise<string> {
    try {
      const db = getSafeDatabase();
      if (!db) throw new Error('Database not available');

      const id = uuid.v4() as string;
      const workoutPlan = {
        id,
        name: workout.name,
        description: workout.description || '',
        workouts: [{
          day: 'Custom',
          name: workout.name,
          exercises: workout.exercises,
        }],
        owner: 'user',
        ownerId: this.currentUserId || '1',
        tags: workout.tags || [],
        assignedUserIds: [this.currentUserId || '1'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.runAsync(
        `INSERT INTO workout_plans (id, name, description, owner, ownerId, workouts,
         tags, assignedUserIds, createdAt, updatedAt, syncStatus)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'), 'pending')`,
        [
          workoutPlan.id,
          workoutPlan.name,
          workoutPlan.description,
          workoutPlan.owner,
          workoutPlan.ownerId,
          JSON.stringify(workoutPlan.workouts),
          JSON.stringify(workoutPlan.tags),
          JSON.stringify(workoutPlan.assignedUserIds),
        ]
      );

      await syncService.queueForSync('workout_plans', 'INSERT', workoutPlan);
      return id;
    } catch (error) {
      Alert.alert('Error', 'Failed to create custom workout. Please try again.');
      console.error('Failed to create custom workout:', error);
      throw error;
    }
  }

  async updateWorkoutPlan(planId: string, updates: Partial<WorkoutPlan>): Promise<void> {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      const setClause: string[] = [];
      const values: any[] = [];

      if (updates.name !== undefined) {
        setClause.push('name = ?');
        values.push(updates.name);
      }
      if (updates.description !== undefined) {
        setClause.push('description = ?');
        values.push(updates.description);
      }
      if (updates.workouts !== undefined) {
        setClause.push('workouts = ?');
        values.push(JSON.stringify(updates.workouts));
      }
      if (updates.tags !== undefined) {
        setClause.push('tags = ?');
        values.push(JSON.stringify(updates.tags));
      }

      setClause.push('updatedAt = datetime("now")');
      setClause.push('syncStatus = "pending"');
      values.push(planId);

      await db.runAsync(
        `UPDATE workout_plans SET ${setClause.join(', ')} WHERE id = ?`,
        values
      );

      await syncService.queueForSync('workout_plans', 'UPDATE', { id: planId, ...updates });
    } catch (error) {
      Alert.alert('Error', 'Failed to update workout plan. Please try again.');
      console.error('Failed to update workout plan:', error);
      throw error;
    }
  }

  async deleteWorkoutPlan(planId: string): Promise<void> {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      await db.runAsync('DELETE FROM workout_plans WHERE id = ?', [planId]);
      await syncService.queueForSync('workout_plans', 'DELETE', { id: planId });
    } catch (error) {
      Alert.alert('Error', 'Failed to delete workout plan. Please try again.');
      console.error('Failed to delete workout plan:', error);
      throw error;
    }
  }

  async getUserCustomWorkouts(userId: string): Promise<WorkoutPlan[]> {
    try {
      const db = getSafeDatabase();
      if (!db) return [];

      const rows = await db.getAllAsync(
        'SELECT * FROM workout_plans WHERE owner = ? ORDER BY createdAt DESC',
        [userId]
      ) as any[];

      return rows.map((row) => ({
        ...row,
        workouts: JSON.parse(row.workouts || '[]'),
        assignedUserIds: JSON.parse(row.assignedUserIds || '[]'),
        tags: JSON.parse(row.tags || '[]'),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      }));
    } catch (error) {
      Alert.alert('Error', 'Failed to load your custom workouts. Please try again.');
      console.error('Failed to get user custom workouts:', error);
      return [];
    }
  }

  async checkPersonalRecord(exerciseId: string, weight: number, reps: number): Promise<boolean> {
    try {
      const db = getSafeDatabase();
      if (!db) return false;

      const previousBest = await db.getFirstAsync(
        `SELECT MAX(CAST(json_extract(sets.value, '$.weight') AS REAL)) as maxWeight
         FROM workout_logs, json_each(exercises) as ex, json_each(json_extract(ex.value, '$.sets')) as sets
         WHERE userId = ? AND json_extract(ex.value, '$.exerciseId') = ?`,
        [this.currentUserId || '1', exerciseId]
      ) as any;

      return !previousBest || weight > (previousBest.maxWeight || 0);
    } catch (error) {
      Alert.alert('Error', 'Failed to check personal record. Please try again.');
      console.error('Failed to check personal record:', error);
      return false;
    }
  }

  async savePersonalRecord(record: PersonalRecord): Promise<void> {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      const id = uuid.v4() as string;
      await db.runAsync(
        `INSERT INTO personal_records (id, userId, exerciseId, exerciseName, weight, reps,
         date, previousRecord, improvement, syncStatus)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          id,
          record.userId || this.currentUserId || '1',
          record.exerciseId,
          record.exerciseName,
          record.weight,
          record.reps,
          record.date.toISOString(),
          record.previousRecord || null,
          record.improvement || null,
        ]
      );

      await syncService.queueForSync('personal_records', 'INSERT', { ...record, id });
    } catch (error) {
      Alert.alert('Error', 'Failed to save personal record. Please try again.');
      console.error('Failed to save personal record:', error);
      throw error;
    }
  }
}

export const workoutService = new WorkoutService();