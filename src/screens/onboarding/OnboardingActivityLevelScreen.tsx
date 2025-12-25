import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';

const OnboardingActivityLevelScreen = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  const activityLevels = [
    {
      id: 'sedentary',
      title: t('onboarding.sedentary'),
      description: t('onboarding.littleNoExercise'),
      icon: 'bed-outline',
    },
    {
      id: 'lightly-active',
      title: t('onboarding.lightlyActive'),
      description: t('onboarding.exercise1to3'),
      icon: 'walk-outline',
    },
    {
      id: 'moderately-active',
      title: t('onboarding.moderatelyActive'),
      description: t('onboarding.exercise3to5'),
      icon: 'bicycle-outline',
    },
    {
      id: 'very-active',
      title: t('onboarding.veryActive'),
      description: t('onboarding.exercise6to7'),
      icon: 'fitness-outline',
    },
    {
      id: 'extra-active',
      title: t('onboarding.extraActive'),
      description: t('onboarding.veryHardDaily'),
      icon: 'barbell-outline',
    },
  ];

  const handleNext = () => {
    if (selectedLevel) {
      navigation.navigate('OnboardingFitnessLevel' as never);
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
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
          <Text style={styles.progressText}>6/12</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('onboarding.activityLevel')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.beHonest')}
        </Text>

        <View style={styles.optionsContainer}>
          {activityLevels.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={[
                styles.optionButton,
                selectedLevel === level.id && styles.optionButtonSelected,
              ]}
              onPress={() => setSelectedLevel(level.id)}
            >
              <Ionicons
                name={level.icon as any}
                size={28}
                color={selectedLevel === level.id ? '#3B82F6' : '#8e9bab'}
              />
              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionTitle,
                    selectedLevel === level.id && styles.optionTitleSelected,
                  ]}
                >
                  {level.title}
                </Text>
                <Text style={styles.optionDescription}>{level.description}</Text>
              </View>
              {selectedLevel === level.id && (
                <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !selectedLevel && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!selectedLevel}
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

export default OnboardingActivityLevelScreen;