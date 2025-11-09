import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import firebaseDailyDataService from './firebaseDailyDataService';
import progressPhotosService from './progressPhotosService';
import { workoutService } from './workoutService';
import measurementService from './measurementService';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

export type ExportFormat = 'json' | 'csv';
export type ExportDataType = 'workouts' | 'nutrition' | 'weight' | 'measurements' | 'photos' | 'all';

interface ExportOptions {
  userId: string;
  dataTypes: ExportDataType[];
  format: ExportFormat;
  startDate?: Date;
  endDate?: Date;
}

class ExportService {
  async exportData(options: ExportOptions): Promise<string> {
    const { userId, dataTypes, format, startDate, endDate } = options;

    try {
      // Gather data based on selected types
      const data: any = {};

      for (const dataType of dataTypes) {
        switch (dataType) {
          case 'workouts':
            data.workouts = await this.getWorkoutData(userId, startDate, endDate);
            break;
          case 'nutrition':
            data.nutrition = await this.getNutritionData(userId, startDate, endDate);
            break;
          case 'weight':
            data.weight = await this.getWeightData(userId, startDate, endDate);
            break;
          case 'measurements':
            data.measurements = await this.getMeasurementData(userId, startDate, endDate);
            break;
          case 'photos':
            data.photos = await this.getPhotoData(userId, startDate, endDate);
            break;
          case 'all':
            data.workouts = await this.getWorkoutData(userId, startDate, endDate);
            data.nutrition = await this.getNutritionData(userId, startDate, endDate);
            data.weight = await this.getWeightData(userId, startDate, endDate);
            data.measurements = await this.getMeasurementData(userId, startDate, endDate);
            data.photos = await this.getPhotoData(userId, startDate, endDate);
            break;
        }
      }

      // Add metadata
      const exportData = {
        exportDate: new Date().toISOString(),
        userId,
        dateRange: startDate && endDate ? {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
        } : null,
        data,
      };

      // Generate file based on format
      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        content = JSON.stringify(exportData, null, 2);
        filename = `fitness_data_${Date.now()}.json`;
        mimeType = 'application/json';
      } else {
        content = this.convertToCSV(exportData);
        filename = `fitness_data_${Date.now()}.csv`;
        mimeType = 'text/csv';
      }

      // Save to file
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType,
          dialogTitle: 'Export Fitness Data',
          UTI: format === 'json' ? 'public.json' : 'public.comma-separated-values-text',
        });
      }

      return fileUri;
    } catch (error) {
      Alert.alert('Error', 'Exporting data. Please try again.');

      console.error('Error exporting data:', error);
      throw error;
    }
  }

  private async getWorkoutData(userId: string, startDate?: Date, endDate?: Date) {
    try {
      const workouts = await workoutService.getWorkoutHistory(userId);

      let filtered = workouts;
      if (startDate && endDate) {
        filtered = workouts.filter(w => {
          const workoutDate = new Date(w.date);
          return workoutDate >= startDate && workoutDate <= endDate;
        });
      }

      return filtered.map(workout => ({
        id: workout.id,
        date: workout.date,
        exercises: workout.exercises.map(ex => ({
          name: ex.name,
          sets: ex.sets.map(set => ({
            reps: set.reps,
            weight: set.weight,
            completed: set.completed,
          })),
        })),
        duration: workout.duration,
        notes: workout.notes,
      }));
    } catch (error) {
      Alert.alert('Error', 'Getting workout data. Please try again.');

      console.error('Error getting workout data:', error);
      return [];
    }
  }

  private async getNutritionData(userId: string, startDate?: Date, endDate?: Date) {
    try {
      // Get daily data for date range
      const days = 90; // Default last 90 days
      const end = endDate || new Date();
      const start = startDate || new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

      const nutritionData = [];
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const data = await firebaseDailyDataService.getDailyData(
          userId,
          currentDate.toISOString().split('T')[0]
        );

        if (data && data.nutrition) {
          nutritionData.push({
            date: currentDate.toISOString().split('T')[0],
            calories: data.nutrition.calories || 0,
            protein: data.nutrition.protein || 0,
            carbs: data.nutrition.carbs || 0,
            fat: data.nutrition.fat || 0,
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return nutritionData;
    } catch (error) {
      Alert.alert('Error', 'Getting nutrition data. Please try again.');

      console.error('Error getting nutrition data:', error);
      return [];
    }
  }

  private async getWeightData(userId: string, startDate?: Date, endDate?: Date) {
    try {
      const days = 90;
      const end = endDate || new Date();
      const start = startDate || new Date(end.getTime() - days * 24 * 60 * 60 * 1000);

      const weightData = [];
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const data = await firebaseDailyDataService.getDailyData(
          userId,
          currentDate.toISOString().split('T')[0]
        );

        if (data && data.weight) {
          weightData.push({
            date: currentDate.toISOString().split('T')[0],
            weight: data.weight,
          });
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      return weightData;
    } catch (error) {
      Alert.alert('Error', 'Getting weight data. Please try again.');

      console.error('Error getting weight data:', error);
      return [];
    }
  }

  private async getMeasurementData(userId: string, startDate?: Date, endDate?: Date) {
    try {
      const allMeasurements = await measurementService.getMeasurements(userId);

      let filtered = allMeasurements;
      if (startDate && endDate) {
        filtered = allMeasurements.filter(m => {
          const measurementDate = new Date(m.date);
          return measurementDate >= startDate && measurementDate <= endDate;
        });
      }

      return filtered.map(m => ({
        date: m.date,
        chest: m.chest,
        waist: m.waist,
        hips: m.hips,
        biceps: m.biceps,
        thighs: m.thighs,
        calves: m.calves,
      }));
    } catch (error) {
      Alert.alert('Error', 'Getting measurement data. Please try again.');

      console.error('Error getting measurement data:', error);
      return [];
    }
  }

  private async getPhotoData(userId: string, startDate?: Date, endDate?: Date) {
    try {
      let photos;
      if (startDate && endDate) {
        photos = await progressPhotosService.getPhotosByDateRange(userId, startDate, endDate);
      } else {
        photos = await progressPhotosService.getPhotos(userId);
      }

      return photos.map(photo => ({
        id: photo.id,
        date: photo.date,
        type: photo.type,
        weight: photo.weight,
        notes: photo.notes,
        uri: photo.uri,
      }));
    } catch (error) {
      Alert.alert('Error', 'Getting photo data. Please try again.');

      console.error('Error getting photo data:', error);
      return [];
    }
  }

  private convertToCSV(exportData: any): string {
    const lines: string[] = [];

    // Add header
    lines.push('Fitness Data Export');
    lines.push(`Export Date: ${exportData.exportDate}`);
    lines.push(`User ID: ${exportData.userId}`);
    if (exportData.dateRange) {
      lines.push(`Date Range: ${exportData.dateRange.start} to ${exportData.dateRange.end}`);
    }
    lines.push('');

    // Add workouts
    if (exportData.data.workouts && exportData.data.workouts.length > 0) {
      lines.push('WORKOUTS');
      lines.push('Date,Exercise,Set,Reps,Weight,Duration,Notes');
      exportData.data.workouts.forEach((workout: any) => {
        workout.exercises.forEach((exercise: any, exIndex: number) => {
          exercise.sets.forEach((set: any, setIndex: number) => {
            const row = [
              workout.date,
              exercise.name,
              setIndex + 1,
              set.reps,
              set.weight,
              exIndex === 0 && setIndex === 0 ? workout.duration : '',
              exIndex === 0 && setIndex === 0 ? workout.notes || '' : '',
            ];
            lines.push(row.join(','));
          });
        });
      });
      lines.push('');
    }

    // Add nutrition
    if (exportData.data.nutrition && exportData.data.nutrition.length > 0) {
      lines.push('NUTRITION');
      lines.push('Date,Calories,Protein,Carbs,Fat');
      exportData.data.nutrition.forEach((entry: any) => {
        lines.push(`${entry.date},${entry.calories},${entry.protein},${entry.carbs},${entry.fat}`);
      });
      lines.push('');
    }

    // Add weight
    if (exportData.data.weight && exportData.data.weight.length > 0) {
      lines.push('WEIGHT');
      lines.push('Date,Weight');
      exportData.data.weight.forEach((entry: any) => {
        lines.push(`${entry.date},${entry.weight}`);
      });
      lines.push('');
    }

    // Add measurements
    if (exportData.data.measurements && exportData.data.measurements.length > 0) {
      lines.push('MEASUREMENTS');
      lines.push('Date,Chest,Waist,Hips,Biceps,Thighs,Calves');
      exportData.data.measurements.forEach((entry: any) => {
        lines.push(
          `${entry.date},${entry.chest || ''},${entry.waist || ''},${entry.hips || ''},${entry.biceps || ''},${entry.thighs || ''},${entry.calves || ''}`
        );
      });
      lines.push('');
    }

    // Add photos metadata (not actual images)
    if (exportData.data.photos && exportData.data.photos.length > 0) {
      lines.push('PROGRESS PHOTOS');
      lines.push('Date,Type,Weight,Notes');
      exportData.data.photos.forEach((photo: any) => {
        lines.push(`${photo.date},${photo.type},${photo.weight || ''},${photo.notes || ''}`);
      });
      lines.push('');
    }

    return lines.join('\n');
  }
}

export default new ExportService();
