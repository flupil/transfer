import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useLanguage } from '../../contexts/LanguageContext';

const OnboardingWorkoutDaysScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const { t } = useLanguage();
  const [selectedDays, setSelectedDays] = useState<string[]>(onboardingData.workoutDays || []);

  const days = [
    { id: 'monday', label: t('onboarding.mon') },
    { id: 'tuesday', label: t('onboarding.tue') },
    { id: 'wednesday', label: t('onboarding.wed') },
    { id: 'thursday', label: t('onboarding.thu') },
    { id: 'friday', label: t('onboarding.fri') },
    { id: 'saturday', label: t('onboarding.sat') },
    { id: 'sunday', label: t('onboarding.sun') },
  ];

  const toggleDay = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter(id => id !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const handleNext = () => {
    if (selectedDays.length > 0) {
      updateOnboardingData({ workoutDays: selectedDays });
      navigation.navigate('OnboardingPlansWelcome' as never);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2a3a" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '83%' }]} />
          </View>
          <Text style={styles.progressText}>10/12</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('onboarding.workoutDays')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.createSchedule')}
        </Text>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#3b9eff" />
          <Text style={styles.infoText}>
            {t('onboarding.canChangeSettings')}
          </Text>
        </View>

        <View style={styles.daysContainer}>
          {days.map((day) => (
            <TouchableOpacity
              key={day.id}
              style={[
                styles.dayButton,
                selectedDays.includes(day.id) && styles.dayButtonSelected,
              ]}
              onPress={() => toggleDay(day.id)}
            >
              <Text
                style={[
                  styles.dayText,
                  selectedDays.includes(day.id) && styles.dayTextSelected,
                ]}
              >
                {day.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {selectedDays.length === 0
              ? t('onboarding.selectAtLeast1')
              : selectedDays.length === 1
              ? `1 ${t('onboarding.dayPerWeek')}`
              : `${selectedDays.length} ${t('onboarding.daysPerWeek')}`}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, selectedDays.length === 0 && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={selectedDays.length === 0}
        >
          <Text style={styles.buttonText}>{t('onboarding.next')}</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a2a3a',
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
    backgroundColor: '#2a3a4a',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b9eff',
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
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#8e9bab',
    marginBottom: 25,
    lineHeight: 24,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#1e2e3e',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    flex: 1,
    color: '#8e9bab',
    fontSize: 14,
    lineHeight: 20,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  dayButton: {
    width: '13%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e2e3e',
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#1e2e3e',
  },
  dayButtonSelected: {
    borderColor: '#3b9eff',
    backgroundColor: '#3b9eff',
  },
  dayText: {
    fontSize: 14,
    color: '#8e9bab',
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#fff',
  },
  summary: {
    marginTop: 30,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 18,
    color: '#3b9eff',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
  },
  button: {
    backgroundColor: '#3b9eff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingWorkoutDaysScreen;