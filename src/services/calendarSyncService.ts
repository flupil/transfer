import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translate } from '../contexts/LanguageContext';

const CALENDAR_ID_KEY = 'fitness_app_calendar_id';

export interface CalendarEvent {
  id?: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  alarms?: { relativeOffset: number }[];
}

class CalendarSyncService {
  private calendarId: string | null = null;

  async requestCalendarPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === 'granted') {
        return true;
      }
      Alert.alert(
        'Permission Required',
        'Calendar access is required to sync your workouts and meals.'
      );
      return false;
    } catch (error) {
      Alert.alert('Error', 'Requesting calendar permissions. Please try again.');

      console.error('Error requesting calendar permissions:', error);
      return false;
    }
  }

  async getOrCreateCalendar(): Promise<string | null> {
    try {
      // Check if we already have a calendar ID stored
      const storedId = await AsyncStorage.getItem(CALENDAR_ID_KEY);
      if (storedId) {
        // Verify the calendar still exists
        try {
          const calendar = await Calendar.getCalendarAsync(storedId);
          if (calendar) {
            this.calendarId = storedId;
            return storedId;
          }
        } catch (error) {
          console.log('Stored calendar no longer exists, creating new one');
        }
      }

      // Create new calendar
      const hasPermission = await this.requestCalendarPermissions();
      if (!hasPermission) return null;

      const defaultCalendar = await this.getDefaultCalendar();
      if (!defaultCalendar) {
        // Create a new calendar if none exists
        const newCalendarId = await this.createAppCalendar();
        if (newCalendarId) {
          await AsyncStorage.setItem(CALENDAR_ID_KEY, newCalendarId);
          this.calendarId = newCalendarId;
          return newCalendarId;
        }
      } else {
        this.calendarId = defaultCalendar;
        await AsyncStorage.setItem(CALENDAR_ID_KEY, defaultCalendar);
        return defaultCalendar;
      }

      return null;
    } catch (error) {
      Alert.alert('Error', 'Getting or creating calendar. Please try again.');

      console.error('Error getting or creating calendar:', error);
      return null;
    }
  }

  private async getDefaultCalendar(): Promise<string | null> {
    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

      // Find the fitness app calendar if it exists
      const appCalendar = calendars.find(cal => cal.title === 'Fitness App');
      if (appCalendar) return appCalendar.id;

      // Otherwise, find the default calendar
      const defaultCalendar = calendars.find(cal => cal.isPrimary) || calendars[0];
      return defaultCalendar?.id || null;
    } catch (error) {
      Alert.alert('Error', 'Getting default calendar. Please try again.');

      console.error('Error getting default calendar:', error);
      return null;
    }
  }

  private async createAppCalendar(): Promise<string | null> {
    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find(cal => cal.allowsModifications) || calendars[0];

      if (!defaultCalendar) {
        console.error('No writable calendar found');
        return null;
      }

      const newCalendarId = await Calendar.createCalendarAsync({
        title: 'Fitness App',
        color: '#FF6B35',
        entityType: Calendar.EntityTypes.EVENT,
        sourceId: defaultCalendar.source.id,
        source: defaultCalendar.source,
        name: 'Fitness App Calendar',
        ownerAccount: defaultCalendar.source.name,
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      });

      return newCalendarId;
    } catch (error) {
      Alert.alert('Error', 'Creating calendar. Please try again.');

      console.error('Error creating calendar:', error);
      return null;
    }
  }

  async addWorkoutToCalendar(
    workoutTitle: string,
    startTime: Date,
    durationMinutes: number = 60,
    exercises?: string[],
    reminderMinutes: number = 30
  ): Promise<string | null> {
    try {
      const calendarId = await this.getOrCreateCalendar();
      if (!calendarId) return null;

      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

      let notes = 'Scheduled workout session';
      if (exercises && exercises.length > 0) {
        notes += '\n\nExercises:\n' + exercises.map(ex => `• ${ex}`).join('\n');
      }

      const eventId = await Calendar.createEventAsync(calendarId, {
        title: workoutTitle,
        startDate: startTime,
        endDate: endTime,
        notes,
        timeZone: 'GMT',
        alarms: [{ relativeOffset: -reminderMinutes }],
      });

      return eventId;
    } catch (error) {
      Alert.alert('Error', 'Adding workout to calendar. Please try again.');

      console.error('Error adding workout to calendar:', error);
      Alert.alert('Error', 'Failed to add workout to calendar');
      return null;
    }
  }

  async addMealToCalendar(
    mealName: string,
    mealTime: Date,
    foods?: string[],
    calories?: number,
    reminderMinutes: number = 15
  ): Promise<string | null> {
    try {
      const calendarId = await this.getOrCreateCalendar();
      if (!calendarId) return null;

      const endTime = new Date(mealTime.getTime() + 30 * 60000); // 30 min default duration

      let notes = 'Planned meal';
      if (calories) {
        notes += `\n\nCalories: ${calories}`;
      }
      if (foods && foods.length > 0) {
        notes += '\n\nFoods:\n' + foods.map(food => `• ${food}`).join('\n');
      }

      const eventId = await Calendar.createEventAsync(calendarId, {
        title: mealName,
        startDate: mealTime,
        endDate: endTime,
        notes,
        timeZone: 'GMT',
        alarms: [{ relativeOffset: -reminderMinutes }],
      });

      return eventId;
    } catch (error) {
      Alert.alert('Error', 'Adding meal to calendar. Please try again.');

      console.error('Error adding meal to calendar:', error);
      Alert.alert('Error', 'Failed to add meal to calendar');
      return null;
    }
  }

  async updateCalendarEvent(
    eventId: string,
    updates: {
      title?: string;
      startDate?: Date;
      endDate?: Date;
      notes?: string;
    }
  ): Promise<boolean> {
    try {
      const calendarId = await this.getOrCreateCalendar();
      if (!calendarId) return false;

      await Calendar.updateEventAsync(eventId, updates);
      return true;
    } catch (error) {
      Alert.alert('Error', 'Updating calendar event. Please try again.');

      console.error('Error updating calendar event:', error);
      return false;
    }
  }

  async deleteCalendarEvent(eventId: string): Promise<boolean> {
    try {
      await Calendar.deleteEventAsync(eventId);
      return true;
    } catch (error) {
      Alert.alert('Error', 'Deleting calendar event. Please try again.');

      console.error('Error deleting calendar event:', error);
      return false;
    }
  }

  async getUpcomingEvents(daysAhead: number = 7): Promise<Calendar.Event[]> {
    try {
      const calendarId = await this.getOrCreateCalendar();
      if (!calendarId) return [];

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);

      const events = await Calendar.getEventsAsync(
        [calendarId],
        startDate,
        endDate
      );

      return events;
    } catch (error) {
      Alert.alert('Error', 'Getting upcoming events. Please try again.');

      console.error('Error getting upcoming events:', error);
      return [];
    }
  }

  async syncWeeklyWorkoutPlan(
    workoutPlan: Array<{
      day: string;
      workoutName: string;
      exercises: string[];
      time: string; // Format: "HH:MM"
    }>
  ): Promise<number> {
    try {
      let syncedCount = 0;
      const today = new Date();
      const dayOfWeek = today.getDay();

      const dayMap: { [key: string]: number } = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
      };

      for (const workout of workoutPlan) {
        const targetDay = dayMap[workout.day.toLowerCase()];
        if (targetDay === undefined) continue;

        // Calculate the next occurrence of this day
        let daysUntilWorkout = targetDay - dayOfWeek;
        if (daysUntilWorkout < 0) {
          daysUntilWorkout += 7;
        }

        const workoutDate = new Date(today);
        workoutDate.setDate(today.getDate() + daysUntilWorkout);

        // Parse time
        const [hours, minutes] = workout.time.split(':').map(Number);
        workoutDate.setHours(hours, minutes, 0, 0);

        const eventId = await this.addWorkoutToCalendar(
          workout.workoutName,
          workoutDate,
          60,
          workout.exercises
        );

        if (eventId) syncedCount++;
      }

      return syncedCount;
    } catch (error) {
      Alert.alert('Error', 'Syncing weekly workout plan. Please try again.');

      console.error('Error syncing weekly workout plan:', error);
      return 0;
    }
  }

  async syncMealPlan(
    mealPlan: Array<{
      mealName: string;
      time: string; // Format: "HH:MM"
      foods?: string[];
      calories?: number;
    }>,
    daysToSync: number = 7
  ): Promise<number> {
    try {
      let syncedCount = 0;
      const today = new Date();

      for (let day = 0; day < daysToSync; day++) {
        const mealDate = new Date(today);
        mealDate.setDate(today.getDate() + day);

        for (const meal of mealPlan) {
          const [hours, minutes] = meal.time.split(':').map(Number);
          mealDate.setHours(hours, minutes, 0, 0);

          const eventId = await this.addMealToCalendar(
            meal.mealName,
            new Date(mealDate),
            meal.foods,
            meal.calories
          );

          if (eventId) syncedCount++;
        }
      }

      return syncedCount;
    } catch (error) {
      Alert.alert('Error', 'Syncing meal plan. Please try again.');

      console.error('Error syncing meal plan:', error);
      return 0;
    }
  }

  async clearAllFitnessEvents(): Promise<boolean> {
    try {
      const calendarId = await this.getOrCreateCalendar();
      if (!calendarId) return false;

      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1); // Look back 1 month
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3); // Look ahead 3 months

      const events = await Calendar.getEventsAsync(
        [calendarId],
        startDate,
        endDate
      );

      for (const event of events) {
        await Calendar.deleteEventAsync(event.id);
      }

      return true;
    } catch (error) {
      Alert.alert('Error', 'Clearing fitness events. Please try again.');

      console.error('Error clearing fitness events:', error);
      return false;
    }
  }
}

export default new CalendarSyncService();
