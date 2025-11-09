import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

export interface Measurement {
  id: string;
  userId: string;
  date: string;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  biceps?: number;
  thighs?: number;
  calves?: number;
  neck?: number;
  shoulders?: number;
  forearms?: number;
  notes?: string;
}

const STORAGE_KEY = '@measurements';

class MeasurementService {
  async getMeasurements(userId: string): Promise<Measurement[]> {
    try {
      const data = await AsyncStorage.getItem(`${STORAGE_KEY}_${userId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      Alert.alert('Error', 'Getting measurements. Please try again.');

      console.error('Error getting measurements:', error);
      return [];
    }
  }

  async addMeasurement(userId: string, measurement: Omit<Measurement, 'id'>): Promise<Measurement> {
    try {
      const measurements = await this.getMeasurements(userId);
      const newMeasurement: Measurement = {
        ...measurement,
        id: Date.now().toString(),
        userId,
      };
      measurements.push(newMeasurement);
      await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(measurements));
      return newMeasurement;
    } catch (error) {
      Alert.alert('Error', 'Adding measurement. Please try again.');

      console.error('Error adding measurement:', error);
      throw error;
    }
  }

  async updateMeasurement(userId: string, measurementId: string, updates: Partial<Measurement>): Promise<void> {
    try {
      const measurements = await this.getMeasurements(userId);
      const index = measurements.findIndex(m => m.id === measurementId);
      if (index !== -1) {
        measurements[index] = { ...measurements[index], ...updates };
        await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(measurements));
      }
    } catch (error) {
      Alert.alert('Error', 'Updating measurement. Please try again.');

      console.error('Error updating measurement:', error);
      throw error;
    }
  }

  async deleteMeasurement(userId: string, measurementId: string): Promise<void> {
    try {
      const measurements = await this.getMeasurements(userId);
      const filtered = measurements.filter(m => m.id !== measurementId);
      await AsyncStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(filtered));
    } catch (error) {
      Alert.alert('Error', 'Deleting measurement. Please try again.');

      console.error('Error deleting measurement:', error);
      throw error;
    }
  }

  async getLatestMeasurement(userId: string): Promise<Measurement | null> {
    try {
      const measurements = await this.getMeasurements(userId);
      if (measurements.length === 0) return null;

      return measurements.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0];
    } catch (error) {
      Alert.alert('Error', 'Getting latest measurement. Please try again.');

      console.error('Error getting latest measurement:', error);
      return null;
    }
  }

  async getMeasurementsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<Measurement[]> {
    try {
      const measurements = await this.getMeasurements(userId);
      return measurements.filter(m => {
        const date = new Date(m.date);
        return date >= new Date(startDate) && date <= new Date(endDate);
      });
    } catch (error) {
      Alert.alert('Error', 'Getting measurements by date range. Please try again.');

      console.error('Error getting measurements by date range:', error);
      return [];
    }
  }
}

export default new MeasurementService();
