import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';

const OnboardingNotificationsScreen = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const [workoutReminders, setWorkoutReminders] = useState(true);
  const [progressUpdates, setProgressUpdates] = useState(true);
  const [motivationalMessages, setMotivationalMessages] = useState(false);

  const handleNext = () => {
    navigation.navigate('OnboardingComplete' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '91%' }]} />
          </View>
          <Text style={styles.progressText}>11/12</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="notifications-outline" size={48} color="#3B82F6" />
        </View>

        <Text style={styles.title}>{t('onboarding.notificationsTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.notificationsSubtitle')}
        </Text>

        <View style={styles.notificationOptions}>
          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Ionicons name="alarm-outline" size={24} color="#3B82F6" />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{t('onboarding.workoutReminders')}</Text>
                <Text style={styles.optionDescription}>
                  {t('onboarding.workoutRemindersDesc')}
                </Text>
              </View>
            </View>
            <Switch
              value={workoutReminders}
              onValueChange={setWorkoutReminders}
              trackColor={{ false: '#2A2A2A', true: '#3B82F6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Ionicons name="trending-up-outline" size={24} color="#3B82F6" />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{t('onboarding.progressUpdates')}</Text>
                <Text style={styles.optionDescription}>
                  {t('onboarding.progressUpdatesDesc')}
                </Text>
              </View>
            </View>
            <Switch
              value={progressUpdates}
              onValueChange={setProgressUpdates}
              trackColor={{ false: '#2A2A2A', true: '#3B82F6' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.optionRow}>
            <View style={styles.optionInfo}>
              <Ionicons name="happy-outline" size={24} color="#3B82F6" />
              <View style={styles.optionText}>
                <Text style={styles.optionTitle}>{t('onboarding.motivationalMessages')}</Text>
                <Text style={styles.optionDescription}>
                  {t('onboarding.motivationalMessagesDesc')}
                </Text>
              </View>
            </View>
            <Switch
              value={motivationalMessages}
              onValueChange={setMotivationalMessages}
              trackColor={{ false: '#2A2A2A', true: '#3B82F6' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <Text style={styles.privacyNote}>
          {t('onboarding.changeSettingsAnytime')}
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>{t('onboarding.continue')}</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    marginRight: 15,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  progressText: {
    color: '#8e9bab',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8e9bab',
    marginBottom: 35,
    lineHeight: 24,
    textAlign: 'center',
  },
  notificationOptions: {
    gap: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2A2A2A',
    padding: 16,
    borderRadius: 12,
  },
  optionInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
    alignItems: 'flex-start',
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#8e9bab',
    lineHeight: 18,
  },
  privacyNote: {
    fontSize: 13,
    color: '#6a7a8a',
    textAlign: 'center',
    marginTop: 30,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingNotificationsScreen;