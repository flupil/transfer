import { create } from 'zustand';
import { WorkoutPlan, WorkoutLog, Exercise, PersonalRecord } from '../types';
import { workoutService } from '../services/workoutService';

interface WorkoutState {
  workoutPlans: WorkoutPlan[];
  userWorkoutPlan: WorkoutPlan | null;
  exercises: Exercise[];
  workoutLogs: WorkoutLog[];
  personalRecords: PersonalRecord[];
  todayWorkout: any;
  isLoading: boolean;
  error: string | null;

  loadWorkoutPlans: () => Promise<void>;
  selectWorkoutPlan: (planId: string) => Promise<void>;
  loadExercises: () => Promise<void>;
  addCustomExercise: (exercise: Partial<Exercise>) => Promise<void>;
  startWorkout: (planId?: string) => Promise<WorkoutLog>;
  logSet: (workoutLogId: string, exerciseId: string, setData: any) => Promise<void>;
  completeWorkout: (workoutLogId: string) => Promise<void>;
  getWorkoutHistory: (userId: string, days?: number) => Promise<void>;
  getPersonalRecords: (userId: string) => Promise<void>;
  getWorkoutProgress: () => Promise<void>;
}

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  workoutPlans: [],
  userWorkoutPlan: null,
  exercises: [],
  workoutLogs: [],
  personalRecords: [],
  todayWorkout: null,
  isLoading: false,
  error: null,

  loadWorkoutPlans: async () => {
    set({ isLoading: true, error: null });
    try {
      const plans = await workoutService.getWorkoutPlans();
      set({ workoutPlans: plans });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  selectWorkoutPlan: async (planId: string) => {
    set({ isLoading: true, error: null });
    try {
      const plan = await workoutService.getWorkoutPlan(planId);
      await workoutService.assignPlanToUser(planId);
      set({ userWorkoutPlan: plan });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadExercises: async () => {
    set({ isLoading: true, error: null });
    try {
      const exercises = await workoutService.getExercises();
      set({ exercises });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  addCustomExercise: async (exercise: Partial<Exercise>) => {
    set({ isLoading: true, error: null });
    try {
      const newExercise = await workoutService.createCustomExercise(exercise);
      set((state) => ({
        exercises: [...state.exercises, newExercise],
      }));
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  startWorkout: async (planId?: string) => {
    set({ isLoading: true, error: null });
    try {
      const workoutLog = await workoutService.startWorkout(planId);
      return workoutLog;
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logSet: async (workoutLogId: string, exerciseId: string, setData: any) => {
    try {
      await workoutService.logSet(workoutLogId, exerciseId, setData);
      const logs = get().workoutLogs;
      const logIndex = logs.findIndex((log) => log.id === workoutLogId);
      if (logIndex !== -1) {
        const updatedLog = { ...logs[logIndex] };
        const exerciseIndex = updatedLog.exercises.findIndex((ex) => ex.exerciseId === exerciseId);
        if (exerciseIndex !== -1) {
          updatedLog.exercises[exerciseIndex].sets.push(setData);
        }
        const updatedLogs = [...logs];
        updatedLogs[logIndex] = updatedLog;
        set({ workoutLogs: updatedLogs });
      }
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  completeWorkout: async (workoutLogId: string) => {
    set({ isLoading: true, error: null });
    try {
      const completedLog = await workoutService.completeWorkout(workoutLogId);
      const logs = get().workoutLogs;
      const updatedLogs = logs.map((log) =>
        log.id === workoutLogId ? completedLog : log
      );
      set({ workoutLogs: updatedLogs });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  getWorkoutHistory: async (userId: string, days: number = 30) => {
    set({ isLoading: true, error: null });
    try {
      const logs = await workoutService.getWorkoutHistory(userId, days);
      set({ workoutLogs: logs });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  getPersonalRecords: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const records = await workoutService.getPersonalRecords(userId);
      set({ personalRecords: records });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  getWorkoutProgress: async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayWorkout = await workoutService.getTodayWorkout(today);
      set({ todayWorkout });
    } catch (error: any) {
      console.error('Failed to get workout progress:', error);
    }
  },
}));