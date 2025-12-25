import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { selectWorkoutPlan } from '../../services/planSelectionService';

const OnboardingPlansWelcomeScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-select workout plan only - meal plans are optional
    const selectedWorkoutPlan = selectWorkoutPlan(onboardingData);

    setWorkoutPlan(selectedWorkoutPlan);

    // Store selected workout plan in onboarding context
    updateOnboardingData({
      selectedWorkoutPlanId: selectedWorkoutPlan?.id,
    });

    setLoading(false);
  }, []);

  const getGoalIcon = (goal: string) => {
    switch (goal) {
      case 'muscle_building': return 'arm-flex';
      case 'fat_loss': return 'fire';
      case 'strength': return 'weight-lifter';
      case 'tone': return 'heart-pulse';
      case 'general_fitness': return 'run';
      case 'endurance': return 'run-fast';
      case 'flexibility': return 'yoga';
      case 'sport_performance': return 'medal';
      default: return 'dumbbell';
    }
  };

  const getGoalColor = (goal: string) => {
    switch (goal) {
      case 'muscle_building': return '#3B82F6';
      case 'fat_loss': return '#FF6B35';
      case 'strength': return '#E94E1B';
      case 'tone': return '#EC4899';
      case 'general_fitness': return '#10B981';
      case 'endurance': return '#F59E0B';
      case 'flexibility': return '#06B6D4';
      case 'sport_performance': return '#F97316';
      default: return '#6B7280';
    }
  };

  const getExperienceBadge = (experience: string) => {
    const badges = {
      beginner: { label: 'Beginner', color: '#10B981' },
      intermediate: { label: 'Intermediate', color: '#F59E0B' },
      advanced: { label: 'Advanced', color: '#E94E1B' }
    };
    return badges[experience as keyof typeof badges] || badges.beginner;
  };

  const handleChangeWorkoutPlan = () => {
    navigation.navigate('WorkoutPlanSelection' as never);
  };

  const handleContinue = () => {
    navigation.navigate('OnboardingNotifications' as never);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FF6B35" style={{ marginTop: 100 }} />
      </SafeAreaView>
    );
  }

  const goalColor = workoutPlan ? getGoalColor(workoutPlan.goal) : '#FF6B35';
  const badge = workoutPlan ? getExperienceBadge(workoutPlan.experience) : { label: 'Beginner', color: '#10B981' };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '92%' }]} />
          </View>
          <Text style={styles.progressText}>11/12</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="party-popper" size={48} color="#FF6B35" />
          </View>
          <Text style={styles.title}>Your Workout Plan Is Ready!</Text>
          <Text style={styles.subtitle}>
            Based on your goals and preferences, we've selected this workout plan for you
          </Text>
        </View>

        {/* Workout Plan Card */}
        {workoutPlan && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Your Workout Plan</Text>
            <View style={styles.planCard}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: goalColor + '15' }]}>
                  <MaterialCommunityIcons
                    name={getGoalIcon(workoutPlan.goal)}
                    size={28}
                    color={goalColor}
                  />
                </View>
                <View style={styles.cardTitleSection}>
                  <Text style={styles.planName}>{workoutPlan.name}</Text>
                  <View style={styles.pillsRow}>
                    <View style={[styles.pill, { backgroundColor: badge.color + '15' }]}>
                      <Text style={[styles.pillText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>
                    <View style={styles.pill}>
                      <MaterialCommunityIcons name="calendar" size={12} color="#8e9bab" />
                      <Text style={[styles.pillText, { color: '#8e9bab' }]}>
                        {workoutPlan.daysPerWeek}x/week
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <Text style={styles.planDescription}>{workoutPlan.description}</Text>
              <TouchableOpacity style={styles.changeButton} onPress={handleChangeWorkoutPlan}>
                <Text style={styles.changeButtonText}>Change Plan</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#FF6B35" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information-outline" size={20} color="#3B82F6" />
          <Text style={styles.infoText}>
            You can always change your workout plan later in the app settings. For nutrition, you can browse meal plans from the nutrition tab if you want pre-planned meals.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Continue</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
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
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  progressContainer: {
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
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  progressText: {
    color: '#8e9bab',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8e9bab',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    color: '#8e9bab',
    marginBottom: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planCard: {
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 18,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardTitleSection: {
    flex: 1,
    justifyContent: 'center',
  },
  planName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  planDescription: {
    fontSize: 14,
    color: '#8e9bab',
    lineHeight: 20,
    marginBottom: 14,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  changeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FF6B35',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 158, 255, 0.1)',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#8e9bab',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
  },
  button: {
    backgroundColor: '#FF6B35',
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

export default OnboardingPlansWelcomeScreen;
