import AsyncStorage from '@react-native-async-storage/async-storage';
import calorieTrackingService from '../services/calorieTrackingService';
import { getSelectedWorkoutPlan } from '../services/workoutPlanService';
import { format, startOfDay } from 'date-fns';

/**
 * Backfill calories for workouts completed today that don't have calories logged yet
 * This is useful for workouts completed before calorie tracking was implemented
 */
export const backfillTodayWorkoutCalories = async () => {
  try {
    console.log('🔄 Starting workout calorie backfill...');

    // Get completed workouts from storage
    const stored = await AsyncStorage.getItem('completedWorkouts');
    if (!stored) {
      console.log('No completed workouts found');
      return;
    }

    const completedWorkouts: string[] = JSON.parse(stored);
    const today = format(startOfDay(new Date()), 'yyyy-MM-dd');

    // Get the current workout plan
    const selectedPlan = await getSelectedWorkoutPlan();
    if (!selectedPlan) {
      console.log('No workout plan selected');
      return;
    }

    // Get already logged workout calories for today
    const existingCalories = await calorieTrackingService.getBurnedCalories(new Date());
    console.log('Existing calories:', existingCalories);

    // Check if we already have workout calories for today
    if (existingCalories.workouts > 0) {
      console.log('✅ Workout calories already logged for today');
      return;
    }

    // Find workouts completed today from the current plan
    const planId = selectedPlan.id || selectedPlan.name || 'default';
    let totalCalories = 0;
    let workoutsProcessed = 0;

    for (const workoutKey of completedWorkouts) {
      // Check if this is from today and current plan
      if (workoutKey.startsWith(planId)) {
        // Parse the workout key: "planId-week-dayIndex"
        const parts = workoutKey.split('-');
        if (parts.length === 3) {
          const week = parseInt(parts[1]);
          const dayIndex = parseInt(parts[2]);

          // Get the workout from the plan
          const startIndex = (week - 1) * 7;
          const workout = selectedPlan.workouts[startIndex + dayIndex];

          if (workout && !workout.name.toLowerCase().includes('rest')) {
            // Parse duration
            const durationMatch = workout.duration.match(/(\d+)/);
            const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 45;

            // Determine intensity
            let intensity: 'light' | 'moderate' | 'vigorous' = 'moderate';
            const workoutName = workout.name.toLowerCase();
            const focusArea = workout.focusArea?.toLowerCase() || '';

            if (workoutName.includes('hiit') || workoutName.includes('intense') ||
                focusArea.includes('hiit') || focusArea.includes('cardio')) {
              intensity = 'vigorous';
            } else if (workoutName.includes('yoga') || workoutName.includes('stretch') ||
                       workoutName.includes('mobility') || focusArea.includes('recovery')) {
              intensity = 'light';
            }

            // Calculate calories
            const calories = calorieTrackingService.calculateWorkoutCalories(
              durationMinutes,
              intensity
            );

            // Log the calories
            await calorieTrackingService.logWorkoutCalories(
              workoutKey,
              calories,
              new Date()
            );

            totalCalories += calories;
            workoutsProcessed++;

            console.log(`✅ Backfilled ${calories} cal for: ${workout.name}`);
          }
        }
      }
    }

    if (workoutsProcessed > 0) {
      console.log(`✅ Backfill complete! Processed ${workoutsProcessed} workouts, ${totalCalories} total calories`);
    } else {
      console.log('No workouts to backfill');
    }

  } catch (error) {
    console.error('❌ Error backfilling workout calories:', error);
  }
};
