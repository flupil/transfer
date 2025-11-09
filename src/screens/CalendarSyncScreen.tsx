import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import calendarSyncService from '../services/calendarSyncService';

const SYNC_SETTINGS_KEY = 'calendar_sync_settings';

interface SyncSettings {
  enabled: boolean;
  syncWorkouts: boolean;
  syncMeals: boolean;
  workoutReminderMinutes: number;
  mealReminderMinutes: number;
  autoSync: boolean;
}

const CalendarSyncScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [settings, setSettings] = useState<SyncSettings>({
    enabled: false,
    syncWorkouts: true,
    syncMeals: true,
    workoutReminderMinutes: 30,
    mealReminderMinutes: 15,
    autoSync: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(SYNC_SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading sync settings:', error);
    }
  };

  const saveSettings = async (newSettings: SyncSettings) => {
    try {
      await AsyncStorage.setItem(SYNC_SETTINGS_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving sync settings:', error);
    }
  };

  const handleEnableSync = async (value: boolean) => {
    if (value) {
      const hasPermission = await calendarSyncService.requestCalendarPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable calendar permissions in your device settings to use this feature.'
        );
        return;
      }

      const calendarId = await calendarSyncService.getOrCreateCalendar();
      if (!calendarId) {
        Alert.alert('Error', 'Failed to access calendar');
        return;
      }
    }

    saveSettings({ ...settings, enabled: value });
  };

  const handleSyncNow = async () => {
    if (!settings.enabled) {
      Alert.alert('Calendar Sync Disabled', 'Please enable calendar sync first');
      return;
    }

    setSyncing(true);
    try {
      let syncedCount = 0;

      // This is a placeholder - in real implementation, you'd fetch actual workout/meal plans
      if (settings.syncWorkouts) {
        // Example: Sync a sample workout plan
        const workoutPlan = [
          {
            day: 'monday',
            workoutName: 'Upper Body Workout',
            exercises: ['Bench Press', 'Pull-ups', 'Shoulder Press'],
            time: '08:00',
          },
          {
            day: 'wednesday',
            workoutName: 'Lower Body Workout',
            exercises: ['Squats', 'Deadlifts', 'Leg Press'],
            time: '08:00',
          },
          {
            day: 'friday',
            workoutName: 'Full Body Workout',
            exercises: ['Deadlifts', 'Bench Press', 'Squats'],
            time: '08:00',
          },
        ];

        const count = await calendarSyncService.syncWeeklyWorkoutPlan(workoutPlan);
        syncedCount += count;
      }

      if (settings.syncMeals) {
        // Example: Sync a sample meal plan
        const mealPlan = [
          { mealName: 'Breakfast', time: '08:00', calories: 500 },
          { mealName: 'Lunch', time: '13:00', calories: 700 },
          { mealName: 'Dinner', time: '19:00', calories: 600 },
        ];

        const count = await calendarSyncService.syncMealPlan(mealPlan, 7);
        syncedCount += count;
      }

      Alert.alert('Success', `Synced ${syncedCount} events to your calendar`);
    } catch (error) {
      console.error('Error syncing:', error);
      Alert.alert('Error', 'Failed to sync calendar events');
    } finally {
      setSyncing(false);
    }
  };

  const handleClearEvents = async () => {
    Alert.alert(
      'Clear All Events',
      'Are you sure you want to remove all fitness events from your calendar?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const success = await calendarSyncService.clearAllFitnessEvents();
            setLoading(false);

            if (success) {
              Alert.alert('Success', 'All fitness events have been removed');
            } else {
              Alert.alert('Error', 'Failed to clear events');
            }
          },
        },
      ]
    );
  };

  const reminderOptions = [
    { label: '5 minutes', value: 5 },
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
    { label: '1 day', value: 1440 },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#202124" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calendar Sync</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="calendar" size={32} color="#4ECDC4" />
          <Text style={styles.infoText}>
            Sync your workouts and meals to your device calendar to stay organized and get reminders
          </Text>
        </View>

        {/* Enable Sync */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Enable Calendar Sync</Text>
              <Text style={styles.settingDescription}>
                Add fitness events to your calendar
              </Text>
            </View>
            <Switch
              value={settings.enabled}
              onValueChange={handleEnableSync}
              trackColor={{ false: '#3C3C3E', true: '#4ECDC4' }}
              thumbColor={settings.enabled ? '#fff' : '#B0B0B0'}
            />
          </View>
        </View>

        {settings.enabled && (
          <>
            {/* What to Sync */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What to Sync</Text>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Sync Workouts</Text>
                  <Text style={styles.settingDescription}>
                    Add workout sessions to calendar
                  </Text>
                </View>
                <Switch
                  value={settings.syncWorkouts}
                  onValueChange={(value) =>
                    saveSettings({ ...settings, syncWorkouts: value })
                  }
                  trackColor={{ false: '#3C3C3E', true: '#4ECDC4' }}
                  thumbColor={settings.syncWorkouts ? '#fff' : '#B0B0B0'}
                />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Sync Meals</Text>
                  <Text style={styles.settingDescription}>
                    Add meal times to calendar
                  </Text>
                </View>
                <Switch
                  value={settings.syncMeals}
                  onValueChange={(value) =>
                    saveSettings({ ...settings, syncMeals: value })
                  }
                  trackColor={{ false: '#3C3C3E', true: '#4ECDC4' }}
                  thumbColor={settings.syncMeals ? '#fff' : '#B0B0B0'}
                />
              </View>
            </View>

            {/* Reminders */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Reminders</Text>

              {settings.syncWorkouts && (
                <View style={styles.reminderSection}>
                  <Text style={styles.reminderLabel}>Workout Reminders</Text>
                  <View style={styles.reminderOptions}>
                    {reminderOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.reminderChip,
                          settings.workoutReminderMinutes === option.value &&
                            styles.reminderChipActive,
                        ]}
                        onPress={() =>
                          saveSettings({
                            ...settings,
                            workoutReminderMinutes: option.value,
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.reminderChipText,
                            settings.workoutReminderMinutes === option.value &&
                              styles.reminderChipTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {settings.syncMeals && (
                <View style={styles.reminderSection}>
                  <Text style={styles.reminderLabel}>Meal Reminders</Text>
                  <View style={styles.reminderOptions}>
                    {reminderOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.reminderChip,
                          settings.mealReminderMinutes === option.value &&
                            styles.reminderChipActive,
                        ]}
                        onPress={() =>
                          saveSettings({
                            ...settings,
                            mealReminderMinutes: option.value,
                          })
                        }
                      >
                        <Text
                          style={[
                            styles.reminderChipText,
                            settings.mealReminderMinutes === option.value &&
                              styles.reminderChipTextActive,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Auto Sync */}
            <View style={styles.section}>
              <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>Auto Sync</Text>
                  <Text style={styles.settingDescription}>
                    Automatically sync when plans change
                  </Text>
                </View>
                <Switch
                  value={settings.autoSync}
                  onValueChange={(value) =>
                    saveSettings({ ...settings, autoSync: value })
                  }
                  trackColor={{ false: '#3C3C3E', true: '#4ECDC4' }}
                  thumbColor={settings.autoSync ? '#fff' : '#B0B0B0'}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.section}>
              <TouchableOpacity
                style={[styles.actionButton, styles.syncButton]}
                onPress={handleSyncNow}
                disabled={syncing}
              >
                {syncing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="sync" size={24} color="#fff" />
                    <Text style={styles.actionButtonText}>Sync Now</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.clearButton]}
                onPress={handleClearEvents}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FF6B6B" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
                    <Text style={[styles.actionButtonText, { color: '#FF6B6B' }]}>
                      Clear All Events
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202124',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3A47',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#B0B0B0',
    lineHeight: 20,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  reminderSection: {
    marginBottom: 20,
  },
  reminderLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 12,
  },
  reminderOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reminderChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#3C3C3E',
  },
  reminderChipActive: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  reminderChipText: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  reminderChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
  },
  syncButton: {
    backgroundColor: '#4ECDC4',
  },
  clearButton: {
    backgroundColor: '#2C2C2E',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default CalendarSyncScreen;
