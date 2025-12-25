import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useOnboarding } from '../../contexts/OnboardingContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { selectWorkoutPlan } from '../../services/planSelectionService';
import { selectWorkoutPlan as saveWorkoutPlan } from '../../services/workoutPlanService';
import { saveMealPlan, selectMealPlan as setSelectedMealPlan } from '../../services/mealPlanService';
import { useLanguage } from '../../contexts/LanguageContext';

const OnboardingCompleteScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { onboardingData, updateOnboardingData, saveOnboardingData, calculateTargets } = useOnboarding();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [workoutPlan, setWorkoutPlan] = useState<any>(null);
  const [mealPlan, setMealPlan] = useState<any>(null);

  useEffect(() => {
    const selectAndSavePlans = async () => {
      // Only select workout plan if user chose workouts, football, or both
      const includesWorkouts = onboardingData.appInterest === 'workouts' || onboardingData.appInterest === 'football' || onboardingData.appInterest === 'both';
      let selectedWorkoutPlan = null;

      if (includesWorkouts) {
        selectedWorkoutPlan = selectWorkoutPlan(onboardingData);
      }

      // Only select meal plan if user chose nutrition or both
      const includesNutrition = onboardingData.appInterest === 'nutrition' || onboardingData.appInterest === 'both';
      let selectedMealPlan = null;

      if (includesNutrition) {
        // Get calorie target from onboarding data, or calculate it if not set
        let calorieTarget = onboardingData.calorieTarget;
        console.log('🎯 Calorie target from onboarding data:', calorieTarget);

        // If no calorie target set, calculate it based on user's profile
        if (!calorieTarget) {
          const targets = calculateTargets();
          calorieTarget = targets.calories;
          console.log('✓ Auto-calculated calorie target:', calorieTarget);
        } else {
          console.log('✓ Using calorie target from onboarding:', calorieTarget);
        }

        // Calculate macros based on goals (same logic as OnboardingContext)
        const goals = onboardingData.goals || [];
        let proteinRatio = 0.25;
        let carbRatio = 0.45;
        let fatRatio = 0.30;

        if (goals.includes('gain-muscle') || goals.includes('get-stronger')) {
          proteinRatio = 0.30;
          carbRatio = 0.45;
          fatRatio = 0.25;
        } else if (goals.includes('lose-weight')) {
          proteinRatio = 0.35;
          carbRatio = 0.35;
          fatRatio = 0.30;
        } else if (goals.includes('improve-endurance')) {
          proteinRatio = 0.20;
          carbRatio = 0.55;
          fatRatio = 0.25;
        }

        const totalProtein = Math.round((calorieTarget * proteinRatio) / 4);
        const totalCarbs = Math.round((calorieTarget * carbRatio) / 4);
        const totalFat = Math.round((calorieTarget * fatRatio) / 9);

        // Create custom plan object with all required fields
        selectedMealPlan = {
          id: 'custom-onboarding-' + Date.now(), // Unique ID to avoid conflicts
          name: 'Your Custom Plan',
          totalCalories: calorieTarget,
          totalProtein,
          totalCarbs,
          totalFat,
          description: `Personalized ${calorieTarget} cal/day plan based on your goals`,
          isCustom: true,
          meals: [] // Empty meals array - required by MealPlan interface
        };
        console.log('Created custom meal plan:', selectedMealPlan);
      }

      setWorkoutPlan(selectedWorkoutPlan);
      setMealPlan(selectedMealPlan);

      // Store selected plans in onboarding context
      const updates: any = {};

      if (selectedWorkoutPlan?.id) {
        updates.selectedWorkoutPlanId = selectedWorkoutPlan.id;
      }

      if (selectedMealPlan) {
        updates.selectedMealPlanId = selectedMealPlan.id;
      }

      updateOnboardingData(updates);

      // CRITICAL: Also save to AsyncStorage so TryScreen (home) can read them
      if (selectedWorkoutPlan?.id) {
        await saveWorkoutPlan(selectedWorkoutPlan.id.toString());
        console.log('Saved workout plan to AsyncStorage:', selectedWorkoutPlan.id);
      } else {
        console.log('Skipped workout plan (user selected nutrition only)');
      }

      if (selectedMealPlan?.id) {
        // If it's a custom plan, save the full plan object
        if (selectedMealPlan.isCustom) {
          await saveMealPlan(selectedMealPlan, user?.id);
          console.log('✓ Saved custom meal plan to AsyncStorage:', {
            id: selectedMealPlan.id,
            calories: selectedMealPlan.totalCalories,
            protein: selectedMealPlan.totalProtein,
            carbs: selectedMealPlan.totalCarbs,
            fat: selectedMealPlan.totalFat
          });
        } else {
          // Pre-made plan, just select it by ID
          await setSelectedMealPlan(selectedMealPlan.id);
          console.log('✓ Selected pre-made meal plan:', selectedMealPlan.id);
        }
      } else {
        console.log('⊘ Skipped meal plan (user selected workouts/football only)');
      }
    };

    selectAndSavePlans();
  }, []);

  useEffect(() => {
    // Save onboarding data and mark as complete
    if (user) {
      saveOnboardingData().then(() => {
        AsyncStorage.setItem(`onboarding_complete_${user.id}`, 'true');
      });
    }
  }, [user]);

  const handleGetStarted = async () => {
    setIsLoading(true);
    try {
      // Make sure onboarding is marked as complete
      if (user) {
        await AsyncStorage.setItem(`onboarding_complete_${user.id}`, 'true');
      }

      // Small delay to ensure AsyncStorage write is complete
      await new Promise(resolve => setTimeout(resolve, 500));

      // Navigate back to the main app - the UserNavigator will detect the completion
      // and show the main app instead of onboarding
      navigation.navigate('Profile' as never);
    } catch (error) {
      console.error('Navigation error:', error);
      setIsLoading(false);
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '100%' }]} />
          </View>
          <Text style={styles.progressText}>12/12</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.successIcon}>
          <View style={styles.iconCircle}>
            <Ionicons name="checkmark" size={64} color="#fff" />
          </View>
        </View>

        <Text style={styles.title}>{t('onboarding.completeTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.completeSubtitle')}
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>{t('onboarding.yourPlans')}</Text>

          {/* Workout Plan */}
          {workoutPlan && (
            <View style={styles.planSection}>
              <View style={styles.planHeader}>
                <MaterialCommunityIcons
                  name="dumbbell"
                  size={18}
                  color="#FF6B35"
                />
                <Text style={styles.planLabel}>{t('onboarding.workoutPlan')}</Text>
              </View>
              <Text style={styles.planName}>{workoutPlan.name}</Text>
              <View style={styles.planMeta}>
                <Text style={styles.planMetaText}>
                  {workoutPlan.experience.charAt(0).toUpperCase() + workoutPlan.experience.slice(1)} • {workoutPlan.daysPerWeek}x/week
                </Text>
              </View>
            </View>
          )}

          {/* Meal Plan */}
          {mealPlan && (
            <View style={[styles.planSection, { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2A2A2A' }]}>
              <View style={styles.planHeader}>
                <MaterialCommunityIcons
                  name="food-apple"
                  size={18}
                  color="#10B981"
                />
                <Text style={styles.planLabel}>{t('onboarding.mealPlan')}</Text>
              </View>
              <Text style={styles.planName}>{mealPlan.name || 'Your Daily Meal Plan'}</Text>
              <View style={styles.planMeta}>
                <Text style={styles.planMetaText}>
                  {mealPlan.totalCalories ? `${mealPlan.totalCalories} cal/day` : mealPlan.calorieRange || 'Custom Plan'}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.infoNote}>
            <MaterialCommunityIcons name="information-outline" size={16} color="#8e9bab" />
            <Text style={styles.infoNoteText}>
              {t('onboarding.changePlansAnytime')}
            </Text>
          </View>
        </View>

        <Text style={styles.motivationalText}>
          {t('onboarding.journeyQuote')}
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleGetStarted}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>{t('onboarding.letsGo')}</Text>
              <Ionicons name="rocket-outline" size={20} color="#fff" />
            </>
          )}
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
    paddingTop: 20,
  },
  successIcon: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#8e9bab',
    marginBottom: 30,
    textAlign: 'center',
  },
  summaryCard: {
    backgroundColor: '#2A2A2A',
    padding: 20,
    borderRadius: 12,
    marginBottom: 25,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  planSection: {
    gap: 8,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8e9bab',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  planMeta: {
    marginBottom: 4,
  },
  planMetaText: {
    fontSize: 14,
    color: '#8e9bab',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
  },
  infoNoteText: {
    flex: 1,
    fontSize: 12,
    color: '#8e9bab',
  },
  summaryList: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  summaryText: {
    flex: 1,
    fontSize: 15,
    color: '#8e9bab',
    lineHeight: 22,
  },
  motivationalText: {
    fontSize: 16,
    color: '#6a7a8a',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
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
  buttonDisabled: {
    opacity: 0.7,
  },
});

export default OnboardingCompleteScreen;