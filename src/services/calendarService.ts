import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translate } from '../contexts/LanguageContext';
import { BRAND_COLORS } from '../constants/brandColors';

interface CalendarEvent {
  id?: string;
  title: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  notes?: string;
  alarms?: number[]; // Minutes before event
  allDay?: boolean;
  color?: string;
  type: 'workout' | 'meal' | 'measurement' | 'challenge';
}

const STORAGE_KEY = '@calendar_settings';
const CALENDAR_NAME = 'Fit&Power Calendar';

export class CalendarService {
  private static calendarId: string | null = null;

  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      Alert.alert('Error', 'Requesting calendar permissions. Please try again.');

      console.error('Error requesting calendar permissions:', error);
      return false;
    }
  }

  static async getDefaultCalendarId(): Promise<string | null> {
    if (this.calendarId) return this.calendarId;

    try {
      // Try to get saved calendar ID
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const { calendarId } = JSON.parse(saved);
        if (calendarId) {
          this.calendarId = calendarId;
          // Update calendar color to match current branding
          await this.updateCalendarColor(calendarId);
          return calendarId;
        }
      }

      // Check permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Calendar Permission Required',
          'Please enable calendar access to sync your workouts and meals.'
        );
        return null;
      }

      // Get or create calendar
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

      // Look for existing Fit&Power calendar
      const existingCalendar = calendars.find(cal => cal.title === CALENDAR_NAME);
      if (existingCalendar) {
        this.calendarId = existingCalendar.id;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ calendarId: existingCalendar.id }));
        // Update calendar color to match current branding
        await this.updateCalendarColor(existingCalendar.id);
        return existingCalendar.id;
      }

      // Create new calendar
      const newCalendarId = await this.createCalendar();
      this.calendarId = newCalendarId;
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ calendarId: newCalendarId }));
      return newCalendarId;
    } catch (error) {
      Alert.alert('Error', 'Getting calendar ID. Please try again.');

      console.error('Error getting calendar ID:', error);
      return null;
    }
  }

  private static async createCalendar(): Promise<string | null> {
    try {
      const defaultCalendarSource =
        Platform.OS === 'ios'
          ? await this.getDefaultCalendarSource()
          : { isLocalAccount: true, name: CALENDAR_NAME };

      if (!defaultCalendarSource) return null;

      const newCalendarID = await Calendar.createCalendarAsync({
        title: CALENDAR_NAME,
        color: BRAND_COLORS.accent,
        entityType: Calendar.EntityTypes.EVENT,
        sourceId: defaultCalendarSource.id,
        source: defaultCalendarSource as any,
        name: CALENDAR_NAME,
        ownerAccount: 'personal',
        accessLevel: Calendar.CalendarAccessLevel.OWNER,
      });

      return newCalendarID;
    } catch (error) {
      Alert.alert('Error', 'Creating calendar. Please try again.');

      console.error('Error creating calendar:', error);
      return null;
    }
  }

  private static async getDefaultCalendarSource() {
    const sources = await Calendar.getSourcesAsync();
    const defaultSource = sources.find(
      source => source.type === Calendar.SourceType.LOCAL
    );
    return defaultSource;
  }

  private static async updateCalendarColor(calendarId: string): Promise<void> {
    try {
      // Update calendar color to match current branding
      await Calendar.updateCalendarAsync(calendarId, {
        color: BRAND_COLORS.accent,
      });
      console.log('Calendar color updated to:', BRAND_COLORS.accent);
    } catch (error) {
      console.log('Could not update calendar color (may not be supported on this platform):', error);
      // Don't show alert - this is not critical and may not be supported on all platforms
    }
  }

  static async addWorkoutEvent(
    workoutName: string,
    date: Date,
    duration: number = 60, // minutes
    location?: string
  ): Promise<string | null> {
    try {
      const calendarId = await this.getDefaultCalendarId();
      if (!calendarId) return null;

      const startDate = new Date(date);
      const endDate = new Date(startDate.getTime() + duration * 60000);

      const eventId = await Calendar.createEventAsync(calendarId, {
        title: `🏋️ ${workoutName}`,
        startDate,
        endDate,
        location,
        notes: `Fit&Power workout session: ${workoutName}`,
        alarms: [{ relativeOffset: -30 }], // 30 min before
      });

      return eventId;
    } catch (error) {
      Alert.alert('Error', 'Adding workout event. Please try again.');

      console.error('Error adding workout event:', error);
      return null;
    }
  }

  static async addMealEvent(
    mealName: string,
    date: Date,
    notes?: string
  ): Promise<string | null> {
    try {
      const calendarId = await this.getDefaultCalendarId();
      if (!calendarId) return null;

      const startDate = new Date(date);
      const endDate = new Date(startDate.getTime() + 30 * 60000); // 30 min duration

      const eventId = await Calendar.createEventAsync(calendarId, {
        title: `🍽️ ${mealName}`,
        startDate,
        endDate,
        notes: notes || `Fit&Power meal: ${mealName}`,
        alarms: [{ relativeOffset: -15 }], // 15 min before
      });

      return eventId;
    } catch (error) {
      Alert.alert('Error', 'Adding meal event. Please try again.');

      console.error('Error adding meal event:', error);
      return null;
    }
  }

  static async addMeasurementReminder(
    date: Date
  ): Promise<string | null> {
    try {
      const calendarId = await this.getDefaultCalendarId();
      if (!calendarId) return null;

      const startDate = new Date(date);
      const endDate = new Date(startDate.getTime() + 15 * 60000); // 15 min duration

      const eventId = await Calendar.createEventAsync(calendarId, {
        title: '📏 Progress Check-In',
        startDate,
        endDate,
        notes: 'Time to log your weight and measurements!',
        alarms: [{ relativeOffset: 0 }], // At time of event
      });

      return eventId;
    } catch (error) {
      Alert.alert('Error', 'Adding measurement reminder. Please try again.');

      console.error('Error adding measurement reminder:', error);
      return null;
    }
  }

  static async addChallengeDeadline(
    challengeName: string,
    deadline: Date
  ): Promise<string | null> {
    try {
      const calendarId = await this.getDefaultCalendarId();
      if (!calendarId) return null;

      const eventId = await Calendar.createEventAsync(calendarId, {
        title: `🎯 Challenge: ${challengeName}`,
        startDate: deadline,
        endDate: new Date(deadline.getTime() + 30 * 60000),
        notes: `Complete your ${challengeName} challenge today!`,
        alarms: [{ relativeOffset: -60 }], // 1 hour before
      });

      return eventId;
    } catch (error) {
      Alert.alert('Error', 'Adding challenge deadline. Please try again.');

      console.error('Error adding challenge deadline:', error);
      return null;
    }
  }

  static async getUpcomingEvents(
    startDate: Date = new Date(),
    endDate: Date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
  ): Promise<Calendar.Event[]> {
    try {
      const calendarId = await this.getDefaultCalendarId();
      if (!calendarId) return [];

      const events = await Calendar.getEventsAsync(
        [calendarId],
        startDate,
        endDate
      );

      return events.filter(event => 
        event.title.includes('🏋️') ||
        event.title.includes('🍽️') ||
        event.title.includes('📏') ||
        event.title.includes('🎯')
      );
    } catch (error) {
      Alert.alert('Error', 'Getting upcoming events. Please try again.');

      console.error('Error getting upcoming events:', error);
      return [];
    }
  }

  static async updateEvent(
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<boolean> {
    try {
      const calendarId = await this.getDefaultCalendarId();
      if (!calendarId) return false;

      const eventUpdates: any = {};
      
      if (updates.title) eventUpdates.title = updates.title;
      if (updates.startDate) eventUpdates.startDate = updates.startDate;
      if (updates.endDate) eventUpdates.endDate = updates.endDate;
      if (updates.location) eventUpdates.location = updates.location;
      if (updates.notes) eventUpdates.notes = updates.notes;
      if (updates.alarms) {
        eventUpdates.alarms = updates.alarms.map(minutes => ({
          relativeOffset: -minutes,
        }));
      }

      await Calendar.updateEventAsync(eventId, eventUpdates);
      return true;
    } catch (error) {
      Alert.alert('Error', 'Updating event. Please try again.');

      console.error('Error updating event:', error);
      return false;
    }
  }

  static async deleteEvent(eventId: string): Promise<boolean> {
    try {
      await Calendar.deleteEventAsync(eventId);
      return true;
    } catch (error) {
      Alert.alert('Error', 'Deleting event. Please try again.');

      console.error('Error deleting event:', error);
      return false;
    }
  }

  static async resetCalendar(): Promise<boolean> {
    try {
      // Clear cached calendar ID
      this.calendarId = null;

      // Clear stored calendar ID
      await AsyncStorage.removeItem(STORAGE_KEY);

      // Get all calendars and find Fit&Power calendar
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const existingCalendar = calendars.find(cal => cal.title === CALENDAR_NAME);

      if (existingCalendar) {
        // Delete the old calendar
        await Calendar.deleteCalendarAsync(existingCalendar.id);
        console.log('Old calendar deleted');
      }

      // Create new calendar with correct color
      const newCalendarId = await this.createCalendar();
      if (newCalendarId) {
        this.calendarId = newCalendarId;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ calendarId: newCalendarId }));
        Alert.alert('Success', 'Calendar has been reset with the new branding color. Please sync your workouts again.');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error resetting calendar:', error);
      Alert.alert('Error', 'Failed to reset calendar. Please try again.');
      return false;
    }
  }

  static async syncAllWorkouts(workouts: any[]): Promise<void> {
    try {
      const calendarId = await this.getDefaultCalendarId();
      if (!calendarId) return;

      // Clear existing workout events for the next 30 days
      const startDate = new Date();
      const endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      const existingEvents = await this.getUpcomingEvents(startDate, endDate);
      
      const workoutEvents = existingEvents.filter(e => e.title.includes('🏋️'));
      for (const event of workoutEvents) {
        await this.deleteEvent(event.id);
      }

      // Add new workout events
      for (const workout of workouts) {
        if (workout.scheduledDate) {
          await this.addWorkoutEvent(
            workout.name,
            new Date(workout.scheduledDate),
            workout.estimatedDuration || 60,
            workout.location
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Syncing workouts. Please try again.');

      console.error('Error syncing workouts:', error);
    }
  }

  static async syncMealPlan(meals: any[]): Promise<void> {
    try {
      const calendarId = await this.getDefaultCalendarId();
      if (!calendarId) return;

      // Clear existing meal events for the next 7 days
      const startDate = new Date();
      const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const existingEvents = await this.getUpcomingEvents(startDate, endDate);
      
      const mealEvents = existingEvents.filter(e => e.title.includes('🍽️'));
      for (const event of mealEvents) {
        await this.deleteEvent(event.id);
      }

      // Add new meal events
      for (const meal of meals) {
        if (meal.scheduledTime) {
          await this.addMealEvent(
            meal.name,
            new Date(meal.scheduledTime),
            meal.notes
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Syncing meal plan. Please try again.');

      console.error('Error syncing meal plan:', error);
    }
  }
}

export default CalendarService;