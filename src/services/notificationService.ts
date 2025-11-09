import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translate } from '../contexts/LanguageContext';

const NOTIFICATION_SETTINGS_KEY = 'notification_settings';
const PUSH_TOKEN_KEY = 'expo_push_token';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationSettings {
  enabled: boolean;
  workoutReminders: boolean;
  mealReminders: boolean;
  streakReminders: boolean;
  achievementNotifications: boolean;
  dailyMotivation: boolean;
  restDayReminders: boolean;
  waterReminders: boolean;
  workoutTime: string; // "HH:MM"
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
  motivationTime: string;
  waterInterval: number; // minutes
}

const defaultSettings: NotificationSettings = {
  enabled: false,
  workoutReminders: true,
  mealReminders: true,
  streakReminders: true,
  achievementNotifications: true,
  dailyMotivation: false,
  restDayReminders: false,
  waterReminders: false,
  workoutTime: '08:00',
  breakfastTime: '08:00',
  lunchTime: '13:00',
  dinnerTime: '19:00',
  motivationTime: '07:00',
  waterInterval: 120, // every 2 hours
};

class NotificationService {
  private pushToken: string | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return false;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      // Setup Android channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B35',
        });
      }

      // Get push token (optional, may fail in Expo Go)
      try {
        const token = await Notifications.getExpoPushTokenAsync();
        this.pushToken = token.data;
        await AsyncStorage.setItem(PUSH_TOKEN_KEY, token.data);
      } catch (tokenError) {
        console.log('Push token not available - this is normal in Expo Go');
      }

      return true;
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('notification.requestPermissionsFailed'));

      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async getSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
      }
      return defaultSettings;
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('notification.getSettingsFailed'));

      console.error('Error getting notification settings:', error);
      return defaultSettings;
    }
  }

  async saveSettings(settings: NotificationSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));

      // Cancel all existing notifications and reschedule based on new settings
      await this.cancelAllNotifications();
      if (settings.enabled) {
        await this.scheduleAllNotifications(settings);
      }
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('notification.saveSettingsFailed'));

      console.error('Error saving notification settings:', error);
    }
  }

  private async scheduleAllNotifications(settings: NotificationSettings): Promise<void> {
    if (settings.workoutReminders) {
      await this.scheduleWorkoutReminder(settings.workoutTime);
    }

    if (settings.mealReminders) {
      await this.scheduleMealReminders(
        settings.breakfastTime,
        settings.lunchTime,
        settings.dinnerTime
      );
    }

    if (settings.streakReminders) {
      await this.scheduleStreakReminder();
    }

    if (settings.dailyMotivation) {
      await this.scheduleDailyMotivation(settings.motivationTime);
    }

    if (settings.waterReminders) {
      await this.scheduleWaterReminders(settings.waterInterval);
    }
  }

  async scheduleWorkoutReminder(time: string): Promise<string | null> {
    try {
      const [hours, minutes] = time.split(':').map(Number);

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '💪 Time to Work Out!',
          body: "Don't skip today's workout. Your future self will thank you!",
          data: { type: 'workout_reminder' },
          sound: true,
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });

      return id;
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('notification.scheduleWorkoutFailed'));

      console.error('Error scheduling workout reminder:', error);
      return null;
    }
  }

  async scheduleMealReminders(
    breakfastTime: string,
    lunchTime: string,
    dinnerTime: string
  ): Promise<void> {
    try {
      const meals = [
        { name: 'Breakfast', time: breakfastTime, emoji: '🍳' },
        { name: 'Lunch', time: lunchTime, emoji: '🥗' },
        { name: 'Dinner', time: dinnerTime, emoji: '🍽️' },
      ];

      for (const meal of meals) {
        const [hours, minutes] = meal.time.split(':').map(Number);

        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${meal.emoji} ${meal.name} Time!`,
            body: `Don't forget to log your ${meal.name.toLowerCase()} and track your nutrition.`,
            data: { type: 'meal_reminder', meal: meal.name.toLowerCase() },
            sound: true,
          },
          trigger: {
            hour: hours,
            minute: minutes,
            repeats: true,
          },
        });
      }
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('notification.scheduleMealFailed'));

      console.error('Error scheduling meal reminders:', error);
    }
  }

  async scheduleStreakReminder(): Promise<string | null> {
    try {
      // Daily reminder at 8 PM to maintain streak
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🔥 Keep Your Streak Alive!',
          body: "You haven't completed today's goals yet. Don't break your streak!",
          data: { type: 'streak_reminder' },
          sound: true,
        },
        trigger: {
          hour: 20,
          minute: 0,
          repeats: true,
        },
      });

      return id;
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('notification.scheduleStreakFailed'));

      console.error('Error scheduling streak reminder:', error);
      return null;
    }
  }

  async scheduleDailyMotivation(time: string): Promise<string | null> {
    try {
      const [hours, minutes] = time.split(':').map(Number);

      const motivationalQuotes = [
        "The only bad workout is the one that didn't happen.",
        "Your body can stand almost anything. It's your mind you have to convince.",
        "Success is the sum of small efforts repeated day in and day out.",
        "The pain you feel today will be the strength you feel tomorrow.",
        "Don't stop when you're tired. Stop when you're done.",
      ];

      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: '✨ Daily Motivation',
          body: randomQuote,
          data: { type: 'motivation' },
          sound: true,
        },
        trigger: {
          hour: hours,
          minute: minutes,
          repeats: true,
        },
      });

      return id;
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('notification.scheduleMotivationFailed'));

      console.error('Error scheduling daily motivation:', error);
      return null;
    }
  }

  async scheduleWaterReminders(intervalMinutes: number): Promise<void> {
    try {
      // Schedule water reminders from 8 AM to 10 PM
      const startHour = 8;
      const endHour = 22;
      const reminderCount = Math.floor(((endHour - startHour) * 60) / intervalMinutes);

      for (let i = 0; i < reminderCount; i++) {
        const totalMinutes = startHour * 60 + i * intervalMinutes;
        const hour = Math.floor(totalMinutes / 60);
        const minute = totalMinutes % 60;

        if (hour >= endHour) break;

        await Notifications.scheduleNotificationAsync({
          content: {
            title: '💧 Hydration Time!',
            body: 'Remember to drink some water. Stay hydrated!',
            data: { type: 'water_reminder' },
            sound: true,
          },
          trigger: {
            hour,
            minute,
            repeats: true,
          },
        });
      }
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('notification.scheduleWaterFailed'));

      console.error('Error scheduling water reminders:', error);
    }
  }

  async sendImmediateNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<string | null> {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Immediate
      });

      return id;
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('notification.sendImmediateFailed'));

      console.error('Error sending immediate notification:', error);
      return null;
    }
  }

  async sendAchievementNotification(
    achievementTitle: string,
    achievementDescription: string
  ): Promise<void> {
    await this.sendImmediateNotification(
      `🏆 Achievement Unlocked!`,
      `${achievementTitle}: ${achievementDescription}`,
      { type: 'achievement' }
    );
  }

  async sendStreakMilestoneNotification(streakDays: number): Promise<void> {
    await this.sendImmediateNotification(
      `🔥 ${streakDays} Day Streak!`,
      `Amazing! You've maintained your streak for ${streakDays} days straight!`,
      { type: 'streak_milestone', days: streakDays }
    );
  }

  async sendPersonalRecordNotification(exercise: string, record: string): Promise<void> {
    await this.sendImmediateNotification(
      `💪 New Personal Record!`,
      `Congratulations! You set a new PR for ${exercise}: ${record}`,
      { type: 'personal_record', exercise }
    );
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('notification.cancelAllFailed'));

      console.error('Error canceling notifications:', error);
    }
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('notification.cancelOneFailed'));

      console.error('Error canceling notification:', error);
    }
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('notification.getScheduledFailed'));

      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('notification.getBadgeCountFailed'));

      console.error('Error getting badge count:', error);
      return 0;
    }
  }

  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      Alert.alert(translate('alert.error'), translate('notification.setBadgeCountFailed'));

      console.error('Error setting badge count:', error);
    }
  }

  async clearBadge(): Promise<void> {
    await this.setBadgeCount(0);
  }

  // Setup notification listeners
  setupNotificationListeners(
    onNotificationReceived?: (notification: Notifications.Notification) => void,
    onNotificationTapped?: (response: Notifications.NotificationResponse) => void
  ): () => void {
    const receivedSubscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      }
    );

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification tapped:', response);
        if (onNotificationTapped) {
          onNotificationTapped(response);
        }
      }
    );

    // Return cleanup function
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }
}

export default new NotificationService();
