import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

export interface ProgressPhoto {
  id: string;
  userId: string;
  uri: string;
  date: Date;
  weight?: number;
  notes?: string;
  type: 'front' | 'side' | 'back' | 'other';
}

const PHOTOS_KEY = 'progress_photos';

class ProgressPhotosService {
  async savePhoto(photo: Omit<ProgressPhoto, 'id'>): Promise<string> {
    try {
      const id = `photo_${Date.now()}`;
      const newPhoto: ProgressPhoto = {
        ...photo,
        id,
        date: new Date(photo.date),
      };

      // Get existing photos
      const photos = await this.getPhotos(photo.userId);

      // Add new photo
      photos.push(newPhoto);

      // Save to AsyncStorage
      const key = `${PHOTOS_KEY}_${photo.userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(photos));

      return id;
    } catch (error) {
      Alert.alert('Error', 'Saving progress photo. Please try again.');

      console.error('Error saving progress photo:', error);
      throw error;
    }
  }

  async getPhotos(userId: string): Promise<ProgressPhoto[]> {
    try {
      const key = `${PHOTOS_KEY}_${userId}`;
      const data = await AsyncStorage.getItem(key);

      if (!data) return [];

      const photos = JSON.parse(data);
      return photos.map((photo: any) => ({
        ...photo,
        date: new Date(photo.date),
      })).sort((a: ProgressPhoto, b: ProgressPhoto) =>
        b.date.getTime() - a.date.getTime()
      );
    } catch (error) {
      Alert.alert('Error', 'Getting progress photos. Please try again.');

      console.error('Error getting progress photos:', error);
      return [];
    }
  }

  async getPhotosByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ProgressPhoto[]> {
    try {
      const allPhotos = await this.getPhotos(userId);
      return allPhotos.filter(photo =>
        photo.date >= startDate && photo.date <= endDate
      );
    } catch (error) {
      Alert.alert('Error', 'Getting photos by date range. Please try again.');

      console.error('Error getting photos by date range:', error);
      return [];
    }
  }

  async getPhotosByType(
    userId: string,
    type: ProgressPhoto['type']
  ): Promise<ProgressPhoto[]> {
    try {
      const allPhotos = await this.getPhotos(userId);
      return allPhotos.filter(photo => photo.type === type);
    } catch (error) {
      Alert.alert('Error', 'Getting photos by type. Please try again.');

      console.error('Error getting photos by type:', error);
      return [];
    }
  }

  async deletePhoto(userId: string, photoId: string): Promise<void> {
    try {
      const photos = await this.getPhotos(userId);
      const photoToDelete = photos.find(p => p.id === photoId);

      if (photoToDelete) {
        // Delete the file
        try {
          await FileSystem.deleteAsync(photoToDelete.uri, { idempotent: true });
        } catch (fileError) {
          console.log('File might not exist:', fileError);
        }

        // Remove from storage
        const updatedPhotos = photos.filter(p => p.id !== photoId);
        const key = `${PHOTOS_KEY}_${userId}`;
        await AsyncStorage.setItem(key, JSON.stringify(updatedPhotos));
      }
    } catch (error) {
      Alert.alert('Error', 'Deleting progress photo. Please try again.');

      console.error('Error deleting progress photo:', error);
      throw error;
    }
  }

  async updatePhotoNotes(
    userId: string,
    photoId: string,
    notes: string
  ): Promise<void> {
    try {
      const photos = await this.getPhotos(userId);
      const photoIndex = photos.findIndex(p => p.id === photoId);

      if (photoIndex !== -1) {
        photos[photoIndex].notes = notes;
        const key = `${PHOTOS_KEY}_${userId}`;
        await AsyncStorage.setItem(key, JSON.stringify(photos));
      }
    } catch (error) {
      Alert.alert('Error', 'Updating photo notes. Please try again.');

      console.error('Error updating photo notes:', error);
      throw error;
    }
  }

  async comparePhotos(
    userId: string,
    photoId1: string,
    photoId2: string
  ): Promise<{ photo1: ProgressPhoto | null; photo2: ProgressPhoto | null }> {
    try {
      const photos = await this.getPhotos(userId);
      const photo1 = photos.find(p => p.id === photoId1) || null;
      const photo2 = photos.find(p => p.id === photoId2) || null;

      return { photo1, photo2 };
    } catch (error) {
      Alert.alert('Error', 'Comparing photos. Please try again.');

      console.error('Error comparing photos:', error);
      return { photo1: null, photo2: null };
    }
  }

  async getLatestPhotoByType(
    userId: string,
    type: ProgressPhoto['type']
  ): Promise<ProgressPhoto | null> {
    try {
      const photos = await this.getPhotosByType(userId, type);
      return photos.length > 0 ? photos[0] : null;
    } catch (error) {
      Alert.alert('Error', 'Getting latest photo. Please try again.');

      console.error('Error getting latest photo:', error);
      return null;
    }
  }
}

export default new ProgressPhotosService();
