import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useLanguage } from '../../contexts/LanguageContext';

const OnboardingGoalsScreen = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const [selectedGoals, setSelectedGoals] = useState<string[]>(onboardingData.goals || []);

  const goals = [
    {
      id: 'lose-weight',
      title: t('onboarding.loseWeight'),
      icon: 'trending-down-outline',
    },
    {
      id: 'gain-muscle',
      title: t('onboarding.gainMuscle'),
      icon: 'barbell-outline',
    },
    {
      id: 'get-stronger',
      title: t('onboarding.getStronger'),
      icon: 'fitness-outline',
    },
    {
      id: 'improve-endurance',
      title: t('onboarding.improveEndurance'),
      icon: 'heart-outline',
    },
    {
      id: 'stay-active',
      title: t('onboarding.stayActive'),
      icon: 'walk-outline',
    },
    {
      id: 'improve-flexibility',
      title: t('onboarding.improveFlexibility'),
      icon: 'body-outline',
    },
    {
      id: 'reduce-stress',
      title: t('onboarding.reduceStress'),
      icon: 'happy-outline',
    },
    {
      id: 'sport-performance',
      title: t('onboarding.sportPerformance'),
      icon: 'trophy-outline',
    },
  ];

  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter(id => id !== goalId));
    } else {
      if (selectedGoals.length < 3) {
        setSelectedGoals([...selectedGoals, goalId]);
      }
    }
  };

  const handleNext = () => {
    if (selectedGoals.length > 0) {
      updateOnboardingData({ goals: selectedGoals });
      navigation.navigate('OnboardingTargetWeight' as never);
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
            <View style={[styles.progressFill, { width: '58%' }]} />
          </View>
          <Text style={styles.progressText}>7/12</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('onboarding.mainGoals')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.selectUpTo3')}
        </Text>

        <View style={styles.selectionInfo}>
          <Text style={styles.selectionText}>
            {selectedGoals.length}/3 {t('onboarding.selectedGoals')}
          </Text>
        </View>

        <View style={styles.optionsGrid}>
          {goals.map((goal) => (
            <TouchableOpacity
              key={goal.id}
              style={[
                styles.goalCard,
                selectedGoals.includes(goal.id) && styles.goalCardSelected,
                selectedGoals.length >= 3 && !selectedGoals.includes(goal.id) && styles.goalCardDisabled,
              ]}
              onPress={() => toggleGoal(goal.id)}
              disabled={selectedGoals.length >= 3 && !selectedGoals.includes(goal.id)}
            >
              <Ionicons
                name={goal.icon as any}
                size={32}
                color={selectedGoals.includes(goal.id) ? '#3B82F6' : '#8e9bab'}
              />
              <Text
                style={[
                  styles.goalTitle,
                  selectedGoals.includes(goal.id) && styles.goalTitleSelected,
                ]}
              >
                {goal.title}
              </Text>
              {selectedGoals.includes(goal.id) && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, selectedGoals.length === 0 && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={selectedGoals.length === 0}
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
    marginBottom: 20,
    lineHeight: 24,
  },
  selectionInfo: {
    marginBottom: 20,
  },
  selectionText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  goalCard: {
    width: '48%',
    padding: 20,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2A2A2A',
    alignItems: 'center',
    position: 'relative',
  },
  goalCardSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#1a3048',
  },
  goalCardDisabled: {
    opacity: 0.5,
  },
  goalTitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
  goalTitleSelected: {
    color: '#3B82F6',
  },
  checkmark: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
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

export default OnboardingGoalsScreen;