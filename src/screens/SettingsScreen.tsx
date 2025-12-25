import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, Switch, TouchableOpacity } from 'react-native';
import { Text, Card, List, Button, Dialog, Portal, RadioButton, Provider, SegmentedButtons } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTour } from '../contexts/TourContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TextInput } from 'react-native-paper';
import { freeAIService } from '../services/freeAIService';
import { aiService } from '../services/aiService';
import calorieTrackingService from '../services/calorieTrackingService';
import deviceCalendarSyncService from '../services/deviceCalendarSyncService';
import { BRAND_COLORS } from '../constants/brandColors';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, signOut, setBiometricAuth } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const { preferences, updatePreferences } = useUserPreferences();
  const { language: currentLanguage, setLanguage: updateLanguage, t } = useLanguage();
  const { resetAllTours } = useTour();
  const [notifications, setNotifications] = useState({
    workouts: true,
    meals: true,
    water: true,
    progress: true,
  });
  const [units, setUnits] = useState('metric');
  const [tempLanguage, setTempLanguage] = useState(currentLanguage);
  const [showUnitsDialog, setShowUnitsDialog] = useState(false);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showAboutDialog, setShowAboutDialog] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [showAnthropicKeyDialog, setShowAnthropicKeyDialog] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [anthropicApiKey, setAnthropicApiKey] = useState('');
  const [hfToken, setHfToken] = useState('');
  const [hasApiKey, setHasApiKey] = useState(false);
  const [hasAnthropicKey, setHasAnthropicKey] = useState(false);
  const [appPurpose, setAppPurpose] = useState<'gym' | 'football'>('gym');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [addBurnedToGoal, setAddBurnedToGoal] = useState(false);
  const [calendarSyncEnabled, setCalendarSyncEnabled] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<string | null>(null);
  const [weeksToSync, setWeeksToSync] = useState(4);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadSettings();
    checkApiKey();
    checkAnthropicKey();
    loadAppPurpose();
    loadCalorieSettings();
    loadCalendarSyncSettings();
  }, []);

  const checkApiKey = async () => {
    const storedKey = await AsyncStorage.getItem('huggingface_token');
    setHasApiKey(!!storedKey);
    if (storedKey) {
      setApiKey(storedKey);
    }
  };

  const checkAnthropicKey = async () => {
    const storedKey = await AsyncStorage.getItem('anthropic_api_key');
    setHasAnthropicKey(!!storedKey);
    if (storedKey) {
      setAnthropicApiKey(storedKey);
    }
  };

  const loadSettings = async () => {
    try {
      const savedUnits = await AsyncStorage.getItem('units');
      const savedNotifications = await AsyncStorage.getItem('notifications');
      const savedBiometric = await AsyncStorage.getItem('biometricEnabled');

      if (savedUnits) setUnits(savedUnits);
      if (savedNotifications) setNotifications(JSON.parse(savedNotifications));
      setBiometricEnabled(savedBiometric === 'true');
      setTempLanguage(currentLanguage);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    try {
      await setBiometricAuth(enabled);
      setBiometricEnabled(enabled);
      Alert.alert(
        t('alert.success'),
        enabled ? t('settings.fingerprintEnabled') : t('settings.fingerprintDisabled')
      );
    } catch (error: any) {
      Alert.alert(t('alert.error'), error.message || t('settings.fingerprintUpdateFailed'));
    }
  };

  const loadAppPurpose = async () => {
    try {
      const savedPurpose = await AsyncStorage.getItem('appPurpose');
      if (savedPurpose === 'gym' || savedPurpose === 'football') {
        setAppPurpose(savedPurpose);
      }
    } catch (error) {
      console.error('Failed to load app purpose:', error);
    }
  };

  const saveAppPurpose = async (purpose: 'gym' | 'football') => {
    try {
      await AsyncStorage.setItem('appPurpose', purpose);
      setAppPurpose(purpose);
      Alert.alert(
        t('settings.trainingModeUpdated'),
        t('settings.trainingModeUpdatedMessage', { mode: purpose === 'gym' ? t('settings.gymFitness') : t('settings.footballTraining') }),
        [{
          text: t('alert.ok'),
          onPress: () => {
            // Navigate to home to trigger refresh
            navigation.navigate('Main' as never);
          }
        }]
      );
    } catch (error) {
      console.error('Failed to save app purpose:', error);
      Alert.alert(t('alert.error'), t('settings.trainingModeUpdateFailed'));
    }
  };

  const loadCalorieSettings = async () => {
    try {
      const settings = await calorieTrackingService.getSettings();
      setAddBurnedToGoal(settings.addBurnedToGoal);
    } catch (error) {
      console.error('Failed to load calorie settings:', error);
    }
  };

  const handleCalorieSettingToggle = async (value: boolean) => {
    try {
      await calorieTrackingService.updateSettings({ addBurnedToGoal: value });
      setAddBurnedToGoal(value);
      Alert.alert(
        t('alert.success'),
        value
          ? t('settings.burnedCaloriesAddedToGoal')
          : t('settings.burnedCaloriesNotAddedToGoal')
      );
    } catch (error) {
      console.error('Failed to update calorie settings:', error);
      Alert.alert(t('alert.error'), t('settings.calorieSettingsUpdateFailed'));
    }
  };

  const loadCalendarSyncSettings = async () => {
    try {
      const settings = await deviceCalendarSyncService.getSyncSettings();
      setCalendarSyncEnabled(settings.enabled);
      setLastSyncDate(settings.lastSyncDate);
      setWeeksToSync(settings.weeksToSync);
    } catch (error) {
      console.error('Failed to load calendar sync settings:', error);
    }
  };

  const handleSyncWorkouts = async () => {
    setSyncing(true);
    try {
      const success = await deviceCalendarSyncService.syncWorkoutPlan(weeksToSync);
      if (success) {
        await loadCalendarSyncSettings();
      }
    } catch (error) {
      console.error('Error syncing workouts:', error);
      Alert.alert(t('alert.error'), t('settings.calendarSyncFailed'));
    } finally {
      setSyncing(false);
    }
  };

  const handleUnsyncWorkouts = async () => {
    Alert.alert(
      t('settings.unsyncWorkouts'),
      t('settings.unsyncWorkoutsConfirmation'),
      [
        { text: t('alert.cancel'), style: 'cancel' },
        {
          text: t('settings.unsync'),
          style: 'destructive',
          onPress: async () => {
            setSyncing(true);
            try {
              const success = await deviceCalendarSyncService.unsyncWorkouts();
              if (success) {
                await loadCalendarSyncSettings();
              }
            } catch (error) {
              console.error('Error unsyncing workouts:', error);
              Alert.alert(t('alert.error'), t('settings.calendarUnsyncFailed'));
            } finally {
              setSyncing(false);
            }
          }
        }
      ]
    );
  };

  // Dark mode is now handled by ThemeContext

  const updateNotificationSetting = async (key: string, value: boolean) => {
    const newNotifications = { ...notifications, [key]: value };
    setNotifications(newNotifications);
    await AsyncStorage.setItem('notifications', JSON.stringify(newNotifications));
  };

  const changeUnits = async () => {
    await AsyncStorage.setItem('units', units);
    setShowUnitsDialog(false);
  };

  const changeLanguage = async () => {
    await updateLanguage(tempLanguage);
    setShowLanguageDialog(false);
    Alert.alert(
      t('settings.languageChanged'),
      t('settings.languageChangedDescription'),
      [{ text: t('alert.ok') }]
    );
  };

  const exportData = async () => {
    Alert.alert(t('settings.exportData'), t('settings.dataExported'));
  };

  const clearCache = async () => {
    Alert.alert(
      t('settings.clearCache'),
      t('settings.clearCacheConfirmation'),
      [
        { text: t('alert.cancel'), style: 'cancel' },
        {
          text: t('settings.clear'),
          onPress: () => {
            Alert.alert(t('alert.success'), t('settings.cacheCleared'));
          }
        }
      ]
    );
  };

  const resetNutritionOnboarding = async () => {
    Alert.alert(
      t('settings.resetNutritionOnboarding'),
      t('settings.resetNutritionOnboardingConfirmation'),
      [
        { text: t('alert.cancel'), style: 'cancel' },
        {
          text: t('settings.reset'),
          style: 'destructive',
          onPress: async () => {
            try {
              const nutritionOnboardingKey = `nutrition_onboarding_complete_${user?.id}`;
              const preferencesKey = `nutrition_preferences_${user?.id}`;
              await AsyncStorage.removeItem(nutritionOnboardingKey);
              await AsyncStorage.removeItem(preferencesKey);
              Alert.alert(t('alert.success'), t('settings.nutritionOnboardingReset'));
            } catch (error) {
              Alert.alert(t('alert.error'), t('settings.resetNutritionOnboardingError'));
            }
          }
        }
      ]
    );
  };

  const resetProgress = async () => {
    setShowResetDialog(false);
    Alert.alert(t('alert.success'), t('settings.progressReset'));
  };

  const deleteAccount = async () => {
    setShowDeleteDialog(false);
    Alert.alert(t('settings.accountDeleted'), t('settings.accountDeletedMessage'), [
      { text: t('alert.ok'), onPress: () => signOut() }
    ]);
  };

  const contactSupport = () => {
    Alert.alert(t('settings.support'), t('settings.contactSupportMessage'));
  };

  const handleResetTours = async () => {
    try {
      await resetAllTours();
      Alert.alert(
        t('settings.tourReset'),
        t('settings.tourResetSuccess'),
        [{ text: t('alert.ok') }]
      );
    } catch (error) {
      console.error('Error resetting tours:', error);
      Alert.alert(
        t('alert.error'),
        'Failed to reset tours. Please try again.',
        [{ text: t('alert.ok') }]
      );
    }
  };

  const saveApiKey = async () => {
    // For Hugging Face token instead
    await freeAIService.setHuggingFaceToken(apiKey);
    setHasApiKey(!!apiKey);
    setShowApiKeyDialog(false);
    Alert.alert(
      t('alert.success'),
      apiKey ? t('settings.tokenSaved') : t('settings.tokenRemoved'),
      [{ text: t('alert.ok') }]
    );
  };

  const saveAnthropicKey = async () => {
    try {
      await aiService.setApiKey(anthropicApiKey, 'anthropic');
      setHasAnthropicKey(!!anthropicApiKey);
      setShowAnthropicKeyDialog(false);
      Alert.alert(
        t('alert.success'),
        anthropicApiKey ? t('settings.anthropicKeySaved') : t('settings.anthropicKeyRemoved'),
        [{ text: t('alert.ok') }]
      );
    } catch (error) {
      console.error('Error saving Anthropic API key:', error);
      Alert.alert(t('alert.error'), t('settings.apiKeySaveFailed'));
    }
  };

  return (
    <Provider>
      <ScrollView style={[styles.container, { backgroundColor: '#2A2A2A' }]} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <Card style={styles.userCard}>
          <Card.Content>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user?.name || t('settings.user')}</Text>
                <Text style={styles.userEmail}>{user?.email || t('settings.userEmailPlaceholder')}</Text>
                <Text style={styles.memberSince}>{t('settings.memberSince')} {new Date().getFullYear()}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Subscription */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.subscription')}
            </Text>

            <List.Item
              title={t('settings.manageSubscription')}
              description={t('settings.viewPlansAndBilling')}
              left={props => <List.Icon {...props} icon="crown" color="#FFD700" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => (navigation as any).navigate('Subscription')}
            />
          </Card.Content>
        </Card>

        {/* General Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.general')}
            </Text>

            <List.Item
              title={t('settings.darkMode')}
              description={isDark ? t('settings.enabled') : t('settings.disabled')}
              left={props => <List.Icon {...props} icon="brightness-6" />}
              right={() => (
                <Switch
                  value={isDark}
                  onValueChange={toggleTheme}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={isDark ? BRAND_COLORS.accent : '#f4f3f4'}
                />
              )}
            />

            <List.Item
              title={t('settings.units')}
              description={units === 'metric' ? t('settings.metricUnits') : t('settings.imperialUnits')}
              left={props => <List.Icon {...props} icon="ruler" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowUnitsDialog(true)}
            />

            <List.Item
              title={t('settings.language')}
              description={currentLanguage === 'en' ? t('settings.english') : t('settings.hebrew')}
              left={props => <List.Icon {...props} icon="translate" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                setTempLanguage(currentLanguage);
                setShowLanguageDialog(true);
              }}
            />
          </Card.Content>
        </Card>

        {/* AI Assistant */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.aiAssistant')}
            </Text>

            <List.Item
              title={t('settings.openaiApiKey')}
              description={hasApiKey ? t('settings.apiKeyConfigured') : t('settings.useLocalAI')}
              left={props => <List.Icon {...props} icon="robot" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowApiKeyDialog(true)}
            />

            <List.Item
              title={t('settings.anthropicApiKey')}
              description={hasAnthropicKey ? t('settings.apiKeyConfigured') : t('settings.noApiKeyConfigured')}
              left={props => <List.Icon {...props} icon="key-variant" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowAnthropicKeyDialog(true)}
            />

            <List.Item
              title={t('settings.aiPreferences')}
              description={t('settings.customizeAI')}
              left={props => <List.Icon {...props} icon="tune" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert(t('settings.comingSoon'), t('settings.aiPreferencesComingSoon'))}
            />
          </Card.Content>
        </Card>

        {/* Training Mode */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.trainingMode')}
            </Text>
            <Text style={styles.modeDescription}>
              {t('settings.trainingModeDescription')}
            </Text>
            <SegmentedButtons
              value={appPurpose}
              onValueChange={(value) => saveAppPurpose(value as 'gym' | 'football')}
              buttons={[
                {
                  value: 'gym',
                  label: t('settings.gymFitness'),
                  icon: 'dumbbell',
                },
                {
                  value: 'football',
                  label: t('settings.football'),
                  icon: 'soccer',
                },
              ]}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* App Mode */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.appMode')}
            </Text>
            <Text style={styles.modeDescription}>
              {t('settings.appModeDescription')}
            </Text>
            <SegmentedButtons
              value={preferences?.appInterest || 'both'}
              onValueChange={(value) => {
                updatePreferences({ appInterest: value as 'workouts' | 'nutrition' | 'both' });
                Alert.alert(
                  t('settings.appModeChanged'),
                  t('settings.appModeChangedDescription'),
                  [{ text: t('alert.ok') }]
                );
              }}
              buttons={[
                {
                  value: 'workouts',
                  label: t('settings.workouts'),
                  icon: 'dumbbell',
                },
                {
                  value: 'nutrition',
                  label: t('settings.nutrition'),
                  icon: 'food-apple',
                },
                {
                  value: 'both',
                  label: t('settings.both'),
                  icon: 'heart',
                },
              ]}
              style={styles.segmentedButtons}
            />
          </Card.Content>
        </Card>

        {/* Nutrition & Calories */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.nutritionCalories')}
            </Text>

            <List.Item
              title={t('settings.addExerciseToGoal')}
              description={t('settings.addExerciseToGoalDescription')}
              left={props => <List.Icon {...props} icon="fire" />}
              right={() => (
                <Switch
                  value={addBurnedToGoal}
                  onValueChange={handleCalorieSettingToggle}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={addBurnedToGoal ? BRAND_COLORS.accent : '#f4f3f4'}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Calendar Sync */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.calendarSync')}
            </Text>

            {calendarSyncEnabled && lastSyncDate && (
              <Text style={styles.syncInfoText}>
                {t('settings.lastSynced')}: {new Date(lastSyncDate).toLocaleDateString()}
              </Text>
            )}

            <List.Item
              title={t('settings.syncToDeviceCalendar')}
              description={t('settings.syncToDeviceCalendarDescription')}
              left={props => <List.Icon {...props} icon="calendar-sync" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleSyncWorkouts}
              disabled={syncing}
            />

            {calendarSyncEnabled && (
              <List.Item
                title={t('settings.removeFromCalendar')}
                description={t('settings.removeFromCalendarDescription')}
                left={props => <List.Icon {...props} icon="calendar-remove" color="#f44336" />}
                right={props => <List.Icon {...props} icon="chevron-right" />}
                onPress={handleUnsyncWorkouts}
                disabled={syncing}
                titleStyle={{ color: '#f44336' }}
              />
            )}

            {syncing && (
              <View style={styles.syncingContainer}>
                <Text style={styles.syncingText}>{t('settings.syncing')}</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Notifications */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.notifications')}
            </Text>

            <List.Item
              title={t('settings.workoutReminders')}
              description={t('settings.workoutRemindersDescription')}
              left={props => <List.Icon {...props} icon="dumbbell" />}
              right={() => (
                <Switch
                  value={notifications.workouts}
                  onValueChange={(value) => updateNotificationSetting('workouts', value)}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={notifications.workouts ? BRAND_COLORS.accent : '#f4f3f4'}
                />
              )}
            />

            <List.Item
              title={t('settings.mealReminders')}
              description={t('settings.mealRemindersDescription')}
              left={props => <List.Icon {...props} icon="food" />}
              right={() => (
                <Switch
                  value={notifications.meals}
                  onValueChange={(value) => updateNotificationSetting('meals', value)}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={notifications.meals ? BRAND_COLORS.accent : '#f4f3f4'}
                />
              )}
            />

            <List.Item
              title={t('settings.waterReminders')}
              description={t('settings.waterRemindersDescription')}
              left={props => <List.Icon {...props} icon="water" />}
              right={() => (
                <Switch
                  value={notifications.water}
                  onValueChange={(value) => updateNotificationSetting('water', value)}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={notifications.water ? BRAND_COLORS.accent : '#f4f3f4'}
                />
              )}
            />

            <List.Item
              title={t('settings.progressUpdates')}
              description={t('settings.progressUpdatesDescription')}
              left={props => <List.Icon {...props} icon="chart-line" />}
              right={() => (
                <Switch
                  value={notifications.progress}
                  onValueChange={(value) => updateNotificationSetting('progress', value)}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={notifications.progress ? BRAND_COLORS.accent : '#f4f3f4'}
                />
              )}
            />
          </Card.Content>
        </Card>

        {/* Privacy & Data */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.privacyAndData')}
            </Text>

            <List.Item
              title={t('settings.fingerprintLogin')}
              description={t('settings.fingerprintLoginDescription')}
              left={props => <List.Icon {...props} icon="fingerprint" />}
              right={() => (
                <Switch
                  value={biometricEnabled}
                  onValueChange={handleBiometricToggle}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  thumbColor={biometricEnabled ? BRAND_COLORS.accent : '#f4f3f4'}
                />
              )}
            />

            <List.Item
              title={t('settings.testOnboarding')}
              description={t('settings.testOnboardingDescription')}
              left={props => <List.Icon {...props} icon="palette" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('TestOnboarding' as never)}
            />

            <List.Item
              title={t('settings.exportData')}
              description={t('settings.exportDataDescription')}
              left={props => <List.Icon {...props} icon="download" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={exportData}
            />

            <List.Item
              title={t('settings.clearCache')}
              description={t('settings.clearCacheDescription')}
              left={props => <List.Icon {...props} icon="cached" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={clearCache}
            />

            <List.Item
              title={t('settings.resetOnboarding')}
              description={t('settings.resetOnboardingDescription')}
              left={props => <List.Icon {...props} icon="refresh" color={BRAND_COLORS.accent} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                Alert.alert(
                  t('settings.resetOnboarding'),
                  t('settings.resetOnboardingConfirmMessage'),
                  [
                    { text: t('alert.cancel'), style: 'cancel' },
                    {
                      text: t('settings.reset'),
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          await AsyncStorage.removeItem(`onboarding_complete_${user?.id}`);
                          Alert.alert(t('alert.success'), t('settings.resetOnboardingSuccess'));
                        } catch (error) {
                          Alert.alert(t('alert.error'), t('settings.resetOnboardingFailed'));
                        }
                      }
                    }
                  ]
                );
              }}
            />

            <List.Item
              title={t('settings.resetTours')}
              description={t('settings.resetToursDescription')}
              left={props => <List.Icon {...props} icon="map-marker-path" color={BRAND_COLORS.accent} />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleResetTours}
            />

            <List.Item
              title={t('settings.resetNutritionOnboarding')}
              description={t('settings.resetNutritionOnboardingDescription')}
              left={props => <List.Icon {...props} icon="food-apple" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={resetNutritionOnboarding}
            />

            <List.Item
              title={t('settings.resetProgress')}
              description={t('settings.resetProgressDescription')}
              left={props => <List.Icon {...props} icon="backup-restore" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowResetDialog(true)}
            />

            <List.Item
              title={t('settings.deleteAccount')}
              description={t('settings.deleteAccountDescription')}
              left={props => <List.Icon {...props} icon="delete-forever" color="#f44336" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowDeleteDialog(true)}
              titleStyle={{ color: '#f44336' }}
            />
          </Card.Content>
        </Card>

        {/* Support */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              {t('settings.help')}
            </Text>

            <List.Item
              title={t('settings.showTour')}
              description={t('settings.showTourDesc')}
              left={props => <List.Icon {...props} icon="map-marker-path" color="#3B82F6" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleResetTours}
            />

            <List.Item
              title={t('settings.contactSupport')}
              description={t('settings.contactSupportDescription')}
              left={props => <List.Icon {...props} icon="help-circle" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={contactSupport}
            />

            <List.Item
              title={t('settings.privacyPolicy')}
              description={t('settings.privacyPolicyDescription')}
              left={props => <List.Icon {...props} icon="shield-check" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('PrivacyPolicy' as never)}
            />

            <List.Item
              title={t('settings.about')}
              description={t('settings.aboutDescription')}
              left={props => <List.Icon {...props} icon="information" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => setShowAboutDialog(true)}
            />

            <List.Item
              title={t('settings.rateApp')}
              description={t('settings.rateAppDescription')}
              left={props => <List.Icon {...props} icon="star" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert(t('settings.thankYou'), t('settings.thanksForRating'))}
            />
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={signOut}
          style={styles.signOutButton}
          buttonColor="#f44336"
        >
          {t('settings.signOut')}
        </Button>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('settings.version')} 1.0.0</Text>
        </View>

        {/* Dialogs */}
        <Portal>
          {/* Units Dialog */}
          <Dialog visible={showUnitsDialog} onDismiss={() => setShowUnitsDialog(false)}>
            <Dialog.Title>{t('settings.selectUnits')}</Dialog.Title>
            <Dialog.Content>
              <RadioButton.Group value={units} onValueChange={setUnits}>
                <RadioButton.Item label={t('settings.metricUnits')} value="metric" />
                <RadioButton.Item label={t('settings.imperialUnits')} value="imperial" />
              </RadioButton.Group>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowUnitsDialog(false)}>{t('general.cancel')}</Button>
              <Button onPress={changeUnits}>{t('general.save')}</Button>
            </Dialog.Actions>
          </Dialog>

          {/* Language Dialog */}
          <Dialog visible={showLanguageDialog} onDismiss={() => setShowLanguageDialog(false)}>
            <Dialog.Title>{t('settings.selectLanguage')}</Dialog.Title>
            <Dialog.Content>
              <RadioButton.Group value={tempLanguage} onValueChange={setTempLanguage}>
                <RadioButton.Item label={t('settings.english')} value="en" />
                <RadioButton.Item label={t('settings.hebrew')} value="he" />
              </RadioButton.Group>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowLanguageDialog(false)}>{t('general.cancel')}</Button>
              <Button onPress={changeLanguage}>{t('general.save')}</Button>
            </Dialog.Actions>
          </Dialog>

          {/* Reset Dialog */}
          <Dialog visible={showResetDialog} onDismiss={() => setShowResetDialog(false)}>
            <Dialog.Title>{t('settings.resetProgress')}</Dialog.Title>
            <Dialog.Content>
              <Text>{t('settings.resetProgressConfirmation')}</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowResetDialog(false)}>{t('alert.cancel')}</Button>
              <Button onPress={resetProgress} textColor="#f44336">{t('settings.reset')}</Button>
            </Dialog.Actions>
          </Dialog>

          {/* Delete Dialog */}
          <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
            <Dialog.Title>{t('settings.deleteAccount')}</Dialog.Title>
            <Dialog.Content>
              <Text>{t('settings.deleteAccountConfirmation')}</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowDeleteDialog(false)}>{t('alert.cancel')}</Button>
              <Button onPress={deleteAccount} textColor="#f44336">{t('settings.delete')}</Button>
            </Dialog.Actions>
          </Dialog>

          {/* About Dialog */}
          <Dialog visible={showAboutDialog} onDismiss={() => setShowAboutDialog(false)}>
            <Dialog.Title>{t('settings.aboutFitApp')}</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.aboutText}>{t('settings.version')}: 1.0.0</Text>
              <Text style={styles.aboutText}>{t('settings.build')}: 2024.01</Text>
              <Text style={styles.aboutText}>{t('settings.copyright')}</Text>
              <Text style={styles.aboutText}>{t('settings.allRightsReserved')}</Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowAboutDialog(false)}>{t('settings.close')}</Button>
            </Dialog.Actions>
          </Dialog>

          {/* API Key Dialog */}
          <Dialog visible={showApiKeyDialog} onDismiss={() => setShowApiKeyDialog(false)}>
            <Dialog.Title>{t('settings.openaiApiKey')}</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.apiKeyDescription}>
                {t('settings.apiKeyInstructions')}
              </Text>
              <TextInput
                label={t('settings.apiKey')}
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry
                placeholder="sk-..."
                style={styles.apiKeyInput}
                mode="outlined"
                outlineColor={BRAND_COLORS.accent}
                activeOutlineColor={BRAND_COLORS.accent}
              />
              <Text style={styles.apiKeyNote}>
                {t('settings.getApiKeyFrom')}
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowApiKeyDialog(false)}>{t('alert.cancel')}</Button>
              <Button onPress={() => { setApiKey(''); saveApiKey(); }} textColor="#f44336">{t('settings.remove')}</Button>
              <Button onPress={saveApiKey} textColor={BRAND_COLORS.accent}>{t('general.save')}</Button>
            </Dialog.Actions>
          </Dialog>

          {/* Anthropic API Key Dialog */}
          <Dialog visible={showAnthropicKeyDialog} onDismiss={() => setShowAnthropicKeyDialog(false)}>
            <Dialog.Title>{t('settings.anthropicApiKey')}</Dialog.Title>
            <Dialog.Content>
              <Text style={styles.apiKeyDescription}>
                {t('settings.anthropicApiKeyDescription')}
              </Text>
              <TextInput
                label={t('settings.anthropicApiKey')}
                value={anthropicApiKey}
                onChangeText={setAnthropicApiKey}
                secureTextEntry
                placeholder="sk-ant-api03-..."
                style={styles.apiKeyInput}
                mode="outlined"
                outlineColor={BRAND_COLORS.accent}
                activeOutlineColor={BRAND_COLORS.accent}
              />
              <Text style={styles.apiKeyNote}>
                {t('settings.getAnthropicKeyFrom')}
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowAnthropicKeyDialog(false)}>{t('alert.cancel')}</Button>
              <Button onPress={() => { setAnthropicApiKey(''); saveAnthropicKey(); }} textColor="#f44336">{t('settings.remove')}</Button>
              <Button onPress={saveAnthropicKey} textColor={BRAND_COLORS.accent}>{t('general.save')}</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  userCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: BRAND_COLORS.accent,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  memberSince: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 8,
    color: BRAND_COLORS.accent,
    fontWeight: 'bold',
  },
  modeDescription: {
    marginBottom: 16,
    opacity: 0.7,
    fontSize: 14,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  signOutButton: {
    margin: 16,
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    color: '#999',
    fontSize: 12,
  },
  aboutText: {
    marginVertical: 4,
    fontSize: 14,
    color: '#666',
  },
  apiKeyDescription: {
    marginBottom: 16,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  apiKeyInput: {
    marginVertical: 8,
  },
  apiKeyNote: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  syncInfoText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    marginLeft: 16,
  },
  syncingContainer: {
    padding: 12,
    alignItems: 'center',
  },
  syncingText: {
    fontSize: 14,
    color: BRAND_COLORS.accent,
    fontStyle: 'italic',
  },
});

export default SettingsScreen;