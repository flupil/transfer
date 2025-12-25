import * as Calendar from 'expo-calendar';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSelectedWorkoutPlan, WorkoutDay } from './workoutPlanService';
import { startOfDay, addDays, setHours, setMinutes, addWeeks, format } from 'date-fns';

interface SyncSettings {
  enabled: boolean;
  calendarId: string | null;
  lastSyncDate: string | null;
  weeksToSync: number; // How many weeks ahead to sync
}

class DeviceCalendarSyncService {
  private static SETTINGS_KEY = '@calendar_sync_settings';
  private static CALENDAR_NAME = 'Fitness Workouts';
  private static CALENDAR_COLOR = '#E94E1B'; // Orange theme

  /**
   * Request calendar permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();

      if (status === 'granted') {
        console.log('✅ Calendar permissions granted');
        return true;
      } else {
        console.log('❌ Calendar permissions denied');
        Alert.alert(
          'Calendar Access Required',
          'Please enable calendar access in your device settings to sync workouts.',
          [{ text: 'OK' }]
        );
        return false;
      }
    } catch (error) {
      console.error('Error requesting calendar permissions:', error);
      return false;
    }
  }

  /**
   * Get or create the workout calendar
   */
  async getOrCreateWorkoutCalendar(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      // Get all calendars
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      console.log('📅 Available calendars:', calendars.map(c => ({ id: c.id, title: c.title })));

      // Check if our workout calendar already exists
      let workoutCalendar = calendars.find(cal => cal.title === DeviceCalendarSyncService.CALENDAR_NAME);

      if (workoutCalendar) {
        console.log('✅ Found existing workout calendar:', workoutCalendar.id);
        return workoutCalendar.id;
      }

      // Create new calendar
      if (Platform.OS === 'ios') {
        // On iOS, we need to find the default calendar source
        const defaultCalendar = await Calendar.getDefaultCalendarAsync();
        const source = defaultCalendar.source;

        const newCalendarId = await Calendar.createCalendarAsync({
          title: DeviceCalendarSyncService.CALENDAR_NAME,
          color: DeviceCalendarSyncService.CALENDAR_COLOR,
          entityType: Calendar.EntityTypes.EVENT,
          sourceId: source.id,
          source: source,
          name: DeviceCalendarSyncService.CALENDAR_NAME,
          ownerAccount: 'personal',
          accessLevel: Calendar.CalendarAccessLevel.OWNER,
        });

        console.log('✅ Created new iOS calendar:', newCalendarId);
        return newCalendarId;
      } else {
        // Android
        const newCalendarId = await Calendar.createCalendarAsync({
          title: DeviceCalendarSyncService.CALENDAR_NAME,
          color: DeviceCalendarSyncService.CALENDAR_COLOR,
          entityType: Calendar.EntityTypes.EVENT,
          name: DeviceCalendarSyncService.CALENDAR_NAME,
          ownerAccount: 'personal',
          accessLevel: Calendar.CalendarAccessLevel.OWNER,
        });

        console.log('✅ Created new Android calendar:', newCalendarId);
        return newCalendarId;
      }
    } catch (error) {
      console.error('❌ Error getting/creating calendar:', error);
      Alert.alert('Calendar Error', 'Failed to create workout calendar. Please try again.');
      return null;
    }
  }

  /**
   * Convert workout to calendar event
   */
  private convertWorkoutToEvent(
    workout: WorkoutDay,
    date: Date,
    week: number,
    dayIndex: number
  ): {
    title: string;
    startDate: Date;
    endDate: Date;
    notes: string;
    alarms: Calendar.Alarm[];
  } {
    // Parse duration (e.g., "60 min" -> 60)
    const durationMatch = workout.duration.match(/(\d+)/);
    const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 60;

    // Set start time to 9 AM by default
    const startDate = setMinutes(setHours(startOfDay(date), 9), 0);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000);

    // Build description with exercises
    let notes = `${workout.focusArea}\n\n`;
    notes += 'Exercises:\n';

    if (workout.exercises && workout.exercises.length > 0) {
      workout.exercises.forEach((exercise, index) => {
        notes += `${index + 1}. ${exercise.name} - ${exercise.sets}x${exercise.reps}\n`;
      });
    }

    notes += `\n📱 Track your progress in the Fitness app`;

    return {
      title: `💪 ${workout.name}`,
      startDate,
      endDate,
      notes,
      alarms: [
        { relativeOffset: -60 }, // 1 hour before
        { relativeOffset: -15 },  // 15 minutes before
      ],
    };
  }

  /**
   * Sync workout plan to device calendar
   */
  async syncWorkoutPlan(weeksToSync: number = 4): Promise<boolean> {
    try {
      console.log('🔄 Starting workout calendar sync...');

      // Get calendar ID
      const calendarId = await this.getOrCreateWorkoutCalendar();
      if (!calendarId) {
        throw new Error('Failed to get calendar ID');
      }

      // Get workout plan
      const plan = await getSelectedWorkoutPlan();
      if (!plan) {
        Alert.alert('No Workout Plan', 'Please select a workout plan first.');
        return false;
      }

      // Get user's selected workout days from profile
      const userDataStr = await AsyncStorage.getItem('@user_workout_days');
      let userWorkoutDays: string[] = [];
      if (userDataStr) {
        userWorkoutDays = JSON.parse(userDataStr);
      }

      // Map day names to numbers
      const dayNameToNumber: { [key: string]: number } = {
        'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
        'thursday': 4, 'friday': 5, 'saturday': 6,
        'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
        'Thursday': 4, 'Friday': 5, 'Saturday': 6,
      };

      const userWorkoutDayNumbers = userWorkoutDays.map(day =>
        dayNameToNumber[day.toLowerCase()]
      ).filter(n => n !== undefined);

      // Clear existing workout events from this calendar
      const now = new Date();
      const endDate = addWeeks(now, weeksToSync);
      const existingEvents = await Calendar.getEventsAsync(
        [calendarId],
        now,
        endDate
      );

      console.log(`🗑️ Removing ${existingEvents.length} old events...`);
      for (const event of existingEvents) {
        await Calendar.deleteEventAsync(event.id);
      }

      // Add new events
      let eventsCreated = 0;
      const firstWorkoutDay = plan.workouts[0]?.day;
      const isDayNumberPlan = firstWorkoutDay?.startsWith('Day ');

      if (isDayNumberPlan) {
        // Handle "Day 1, Day 2" style plans
        let currentDate = startOfDay(now);
        const syncEndDate = addWeeks(currentDate, weeksToSync);
        let workoutIndex = 0;

        while (currentDate <= syncEndDate) {
          const dayOfWeek = currentDate.getDay();
          const isUserWorkoutDay = userWorkoutDayNumbers.length === 0 ||
                                   userWorkoutDayNumbers.includes(dayOfWeek);

          if (isUserWorkoutDay && workoutIndex < plan.workouts.length) {
            const workout = plan.workouts[workoutIndex % plan.workouts.length];

            // Skip rest days
            if (!workout.name.toLowerCase().includes('rest')) {
              const event = this.convertWorkoutToEvent(
                workout,
                currentDate,
                Math.floor(workoutIndex / plan.daysPerWeek) + 1,
                workoutIndex % plan.daysPerWeek
              );

              await Calendar.createEventAsync(calendarId, event);
              eventsCreated++;
            }

            workoutIndex++;
          }

          currentDate = addDays(currentDate, 1);
        }
      } else {
        // Handle named day plans (Monday, Tuesday, etc.)
        for (let week = 0; week < weeksToSync; week++) {
          for (const workout of plan.workouts) {
            const dayNumber = dayNameToNumber[workout.day];
            if (dayNumber === undefined) continue;

            // Skip rest days
            if (workout.name.toLowerCase().includes('rest')) continue;

            // Calculate date for this workout
            const weekStart = addWeeks(startOfDay(now), week);
            const daysUntilWorkout = (dayNumber - weekStart.getDay() + 7) % 7;
            const workoutDate = addDays(weekStart, daysUntilWorkout);

            const event = this.convertWorkoutToEvent(workout, workoutDate, week + 1, dayNumber);
            await Calendar.createEventAsync(calendarId, event);
            eventsCreated++;
          }
        }
      }

      // Save sync settings
      const settings: SyncSettings = {
        enabled: true,
        calendarId,
        lastSyncDate: new Date().toISOString(),
        weeksToSync,
      };
      await AsyncStorage.setItem(DeviceCalendarSyncService.SETTINGS_KEY, JSON.stringify(settings));

      console.log(`✅ Sync complete! Created ${eventsCreated} events`);

      Alert.alert(
        'Sync Successful',
        `${eventsCreated} workouts have been added to your ${Platform.OS === 'ios' ? 'Apple' : 'Google'} Calendar!`,
        [{ text: 'OK' }]
      );

      return true;
    } catch (error) {
      console.error('❌ Error syncing workout plan:', error);
      Alert.alert('Sync Failed', 'Failed to sync workouts to calendar. Please try again.');
      return false;
    }
  }

  /**
   * Remove all synced workouts from device calendar
   */
  async unsyncWorkouts(): Promise<boolean> {
    try {
      const settings = await this.getSyncSettings();
      if (!settings.calendarId) {
        Alert.alert('Not Synced', 'Workouts are not currently synced to your calendar.');
        return false;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return false;

      // Get all events from the workout calendar
      const now = new Date();
      const futureDate = addWeeks(now, 52); // 1 year ahead
      const events = await Calendar.getEventsAsync(
        [settings.calendarId],
        now,
        futureDate
      );

      console.log(`🗑️ Removing ${events.length} synced events...`);

      for (const event of events) {
        await Calendar.deleteEventAsync(event.id);
      }

      // Update settings
      const updatedSettings: SyncSettings = {
        ...settings,
        enabled: false,
        lastSyncDate: null,
      };
      await AsyncStorage.setItem(DeviceCalendarSyncService.SETTINGS_KEY, JSON.stringify(updatedSettings));

      console.log('✅ Workouts removed from calendar');
      Alert.alert('Unsync Complete', 'Workouts have been removed from your calendar.');

      return true;
    } catch (error) {
      console.error('❌ Error removing synced workouts:', error);
      Alert.alert('Unsync Failed', 'Failed to remove workouts from calendar.');
      return false;
    }
  }

  /**
   * Get current sync settings
   */
  async getSyncSettings(): Promise<SyncSettings> {
    try {
      const data = await AsyncStorage.getItem(DeviceCalendarSyncService.SETTINGS_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error getting sync settings:', error);
    }

    return {
      enabled: false,
      calendarId: null,
      lastSyncDate: null,
      weeksToSync: 4,
    };
  }

  /**
   * Check if calendar sync is enabled
   */
  async isSyncEnabled(): Promise<boolean> {
    const settings = await this.getSyncSettings();
    return settings.enabled;
  }
}

export default new DeviceCalendarSyncService();
