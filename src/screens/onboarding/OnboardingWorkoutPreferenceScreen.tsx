import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useLanguage } from '../../contexts/LanguageContext';

const OnboardingWorkoutPreferenceScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const { t } = useLanguage();
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>(onboardingData.workoutPreferences || []);

  const preferences = [
    {
      id: 'home',
      title: t('onboarding.homeWorkouts'),
      description: t('onboarding.noEquipment'),
      icon: 'home-outline',
    },
    {
      id: 'gym',
      title: t('onboarding.gymTraining'),
      description: t('onboarding.fullGymEquipment'),
      icon: 'barbell-outline',
    },
    {
      id: 'outdoor',
      title: t('onboarding.outdoorActivities'),
      description: t('onboarding.runningCycling'),
      icon: 'bicycle-outline',
    },
    {
      id: 'yoga',
      title: t('onboarding.yogaFlexibility'),
      description: t('onboarding.mindBodyConnection'),
      icon: 'body-outline',
    },
  ];

  const togglePreference = (id: string) => {
    if (selectedPreferences.includes(id)) {
      setSelectedPreferences(selectedPreferences.filter(p => p !== id));
    } else {
      setSelectedPreferences([...selectedPreferences, id]);
    }
  };

  const handleNext = () => {
    if (selectedPreferences.length > 0) {
      updateOnboardingData({ workoutPreferences: selectedPreferences });
      navigation.navigate('OnboardingWorkoutDays' as never);
    }
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
            <View style={[styles.progressFill, { width: '75%' }]} />
          </View>
          <Text style={styles.progressText}>9/12</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('onboarding.whereWorkout')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.selectAllApply')}
        </Text>

        <View style={styles.optionsContainer}>
          {preferences.map((pref) => (
            <TouchableOpacity
              key={pref.id}
              style={[
                styles.optionButton,
                selectedPreferences.includes(pref.id) && styles.optionButtonSelected,
              ]}
              onPress={() => togglePreference(pref.id)}
            >
              <Ionicons
                name={pref.icon as any}
                size={28}
                color={selectedPreferences.includes(pref.id) ? '#3B82F6' : '#8e9bab'}
              />
              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionTitle,
                    selectedPreferences.includes(pref.id) && styles.optionTitleSelected,
                  ]}
                >
                  {pref.title}
                </Text>
                <Text style={styles.optionDescription}>{pref.description}</Text>
              </View>
              {selectedPreferences.includes(pref.id) && (
                <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, selectedPreferences.length === 0 && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={selectedPreferences.length === 0}
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
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#8e9bab',
    marginBottom: 30,
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2A2A2A',
    gap: 15,
  },
  optionButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#1a3048',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 3,
  },
  optionTitleSelected: {
    color: '#3B82F6',
  },
  optionDescription: {
    fontSize: 14,
    color: '#8e9bab',
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
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingWorkoutPreferenceScreen;