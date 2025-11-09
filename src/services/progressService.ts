import { databaseService } from './databaseService';
import { workoutService } from './workoutService';
import { nutritionService } from './nutritionService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProgressData {
  id?: string;
  userId: string;
  date: Date;
  type: 'weight' | 'measurement' | 'photo' | 'performance' | 'mood';
  value: any;
  unit?: string;
  notes?: string;
  metadata?: any;
}

interface BodyMeasurements {
  weight?: number;
  bodyFat?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  thighs?: number;
  arms?: number;
  neck?: number;
  shoulders?: number;
}

interface PerformanceMetrics {
  totalWorkouts: number;
  totalVolume: number;
  totalCaloriesBurned: number;
  averageWorkoutDuration: number;
  currentStreak: number;
  personalRecords: any[];
  consistencyScore: number;
}

class ProgressService {
  // Log weight
  async logWeight(userId: string, weight: number, unit: 'kg' | 'lbs' = 'kg'): Promise<void> {
    const progressData: ProgressData = {
      userId,
      date: new Date(),
      type: 'weight',
      value: weight,
      unit
    };

    await databaseService.create('progressData', progressData, 'progress_data');

    // Cache latest weight
    await AsyncStorage.setItem(`latest_weight_${userId}`, JSON.stringify({
      weight,
      unit,
      date: new Date().toISOString()
    }));
  }

  // Log body measurements
  async logMeasurements(
    userId: string,
    measurements: BodyMeasurements,
    unit: 'cm' | 'inches' = 'cm'
  ): Promise<void> {
    const progressData: ProgressData = {
      userId,
      date: new Date(),
      type: 'measurement',
      value: measurements,
      unit
    };

    await databaseService.create('progressData', progressData, 'progress_data');
  }

  // Log progress photo
  async logProgressPhoto(
    userId: string,
    photoUri: string,
    type: 'front' | 'side' | 'back',
    notes?: string
  ): Promise<void> {
    const progressData: ProgressData = {
      userId,
      date: new Date(),
      type: 'photo',
      value: photoUri,
      notes,
      metadata: { photoType: type }
    };

    await databaseService.create('progressData', progressData, 'progress_data');
  }

  // Get weight history
  async getWeightHistory(
    userId: string,
    days: number = 30
  ): Promise<{ date: Date; weight: number; unit: string }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data = await databaseService.list<ProgressData>(
      'progressData',
      [
        { field: 'userId', operator: '==', value: userId },
        { field: 'type', operator: '==', value: 'weight' },
        { field: 'date', operator: '>=', value: startDate.toISOString() }
      ],
      'progress_data'
    );

    return data.map(d => ({
      date: new Date(d.date),
      weight: d.value,
      unit: d.unit || 'kg'
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Get measurement history
  async getMeasurementHistory(
    userId: string,
    days: number = 90
  ): Promise<{ date: Date; measurements: BodyMeasurements; unit: string }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const data = await databaseService.list<ProgressData>(
      'progressData',
      [
        { field: 'userId', operator: '==', value: userId },
        { field: 'type', operator: '==', value: 'measurement' },
        { field: 'date', operator: '>=', value: startDate.toISOString() }
      ],
      'progress_data'
    );

    return data.map(d => ({
      date: new Date(d.date),
      measurements: d.value,
      unit: d.unit || 'cm'
    })).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Get progress photos
  async getProgressPhotos(userId: string): Promise<any[]> {
    const data = await databaseService.list<ProgressData>(
      'progressData',
      [
        { field: 'userId', operator: '==', value: userId },
        { field: 'type', operator: '==', value: 'photo' }
      ],
      'progress_data'
    );

    return data.map(d => ({
      id: d.id,
      date: new Date(d.date),
      photoUri: d.value,
      type: d.metadata?.photoType,
      notes: d.notes
    })).sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  // Calculate performance metrics
  async getPerformanceMetrics(userId: string): Promise<PerformanceMetrics> {
    const workoutLogs = await workoutService.getWorkoutHistory(userId, 365);
    const workoutStreak = await streakService.getUserStreak(userId);

    const metrics: PerformanceMetrics = {
      totalWorkouts: workoutLogs.length,
      totalVolume: 0,
      totalCaloriesBurned: 0,
      averageWorkoutDuration: 0,
      currentStreak: workoutStreak,
      personalRecords: [],
      consistencyScore: 0
    };

    // Calculate total volume and calories
    workoutLogs.forEach(log => {
      metrics.totalCaloriesBurned += log.totalCalories || 0;

      // Calculate volume
      log.exercises?.forEach(exercise => {
        exercise.sets.forEach(set => {
          metrics.totalVolume += (set.weight * set.reps);
        });
      });

      // Add to duration
      metrics.averageWorkoutDuration += log.duration || 0;
    });

    // Calculate averages
    if (workoutLogs.length > 0) {
      metrics.averageWorkoutDuration = metrics.averageWorkoutDuration / workoutLogs.length;

      // Calculate consistency score (workouts per week average)
      const weeksSpan = 52; // Last year
      const expectedWorkouts = weeksSpan * 3; // 3 workouts per week target
      metrics.consistencyScore = Math.min(100, (workoutLogs.length / expectedWorkouts) * 100);
    }

    // Get personal records
    metrics.personalRecords = await workoutService.getPersonalRecords(userId);

    return metrics;
  }

  // Get overall progress summary
  async getProgressSummary(userId: string, period: 'week' | 'month' | 'year' = 'month'): Promise<any> {
    let days = 7;
    if (period === 'month') days = 30;
    if (period === 'year') days = 365;

    const [
      weightHistory,
      measurementHistory,
      performanceMetrics,
      nutritionStreak,
      workoutStreak
    ] = await Promise.all([
      this.getWeightHistory(userId, days),
      this.getMeasurementHistory(userId, days),
      this.getPerformanceMetrics(userId),
      nutritionService.getNutritionStreak(userId),
      workoutService.getUserStreak(userId)
    ]);

    // Calculate weight change
    let weightChange = 0;
    if (weightHistory.length >= 2) {
      const latest = weightHistory[weightHistory.length - 1];
      const oldest = weightHistory[0];
      weightChange = latest.weight - oldest.weight;
    }

    // Calculate measurement changes
    let measurementChanges: any = {};
    if (measurementHistory.length >= 2) {
      const latest = measurementHistory[measurementHistory.length - 1];
      const oldest = measurementHistory[0];

      Object.keys(latest.measurements).forEach(key => {
        const latestVal = (latest.measurements as any)[key];
        const oldestVal = (oldest.measurements as any)[key];
        if (latestVal && oldestVal) {
          measurementChanges[key] = latestVal - oldestVal;
        }
      });
    }

    return {
      period,
      weightChange,
      currentWeight: weightHistory[weightHistory.length - 1]?.weight,
      measurementChanges,
      currentMeasurements: measurementHistory[measurementHistory.length - 1]?.measurements,
      performanceMetrics,
      streaks: {
        workout: workoutStreak,
        nutrition: nutritionStreak
      },
      lastUpdated: new Date()
    };
  }

  // Calculate BMI
  calculateBMI(weight: number, height: number, weightUnit: 'kg' | 'lbs' = 'kg', heightUnit: 'cm' | 'inches' = 'cm'): number {
    // Convert to metric if needed
    const weightKg = weightUnit === 'lbs' ? weight * 0.453592 : weight;
    const heightM = heightUnit === 'inches' ? height * 0.0254 : height / 100;

    return weightKg / (heightM * heightM);
  }

  // Get BMI category
  getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }

  // Calculate body fat percentage (Navy method)
  calculateBodyFat(
    gender: 'male' | 'female',
    waist: number,
    neck: number,
    height: number,
    hips?: number,
    unit: 'cm' | 'inches' = 'cm'
  ): number {
    // Convert to cm if needed
    const waistCm = unit === 'inches' ? waist * 2.54 : waist;
    const neckCm = unit === 'inches' ? neck * 2.54 : neck;
    const heightCm = unit === 'inches' ? height * 2.54 : height;
    const hipsCm = hips && unit === 'inches' ? hips * 2.54 : hips;

    if (gender === 'male') {
      // Navy formula for men
      return 495 / (1.0324 - 0.19077 * Math.log10(waistCm - neckCm) + 0.15456 * Math.log10(heightCm)) - 450;
    } else {
      // Navy formula for women (requires hips measurement)
      if (!hipsCm) return 0;
      return 495 / (1.29579 - 0.35004 * Math.log10(waistCm + hipsCm - neckCm) + 0.221 * Math.log10(heightCm)) - 450;
    }
  }

  // Export progress data
  async exportProgressData(userId: string, format: 'json' | 'csv' = 'json'): Promise<string> {
    const [
      weightHistory,
      measurementHistory,
      photos,
      performanceMetrics
    ] = await Promise.all([
      this.getWeightHistory(userId, 365),
      this.getMeasurementHistory(userId, 365),
      this.getProgressPhotos(userId),
      this.getPerformanceMetrics(userId)
    ]);

    const data = {
      userId,
      exportDate: new Date().toISOString(),
      weightHistory,
      measurementHistory,
      progressPhotos: photos.map(p => ({
        date: p.date,
        type: p.type,
        notes: p.notes
      })),
      performanceMetrics
    };

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Convert to CSV
      let csv = 'Date,Type,Value,Unit,Notes\n';

      weightHistory.forEach(w => {
        csv += `${w.date.toISOString()},weight,${w.weight},${w.unit},\n`;
      });

      measurementHistory.forEach(m => {
        Object.entries(m.measurements).forEach(([key, value]) => {
          csv += `${m.date.toISOString()},measurement_${key},${value},${m.unit},\n`;
        });
      });

      return csv;
    }
  }

  // Sync progress data
  async syncProgress(): Promise<void> {
    await databaseService.syncWithCloud();
  }
}

export const progressService = new ProgressService();