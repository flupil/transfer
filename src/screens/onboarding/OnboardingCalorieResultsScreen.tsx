import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useLanguage } from '../../contexts/LanguageContext';

const OnboardingCalorieResultsScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const { t } = useLanguage();
  const [calorieData, setCalorieData] = useState<any>(null);
  const [selectedCalorieTarget, setSelectedCalorieTarget] = useState<string>('');

  useEffect(() => {
    calculateCalories();
  }, []);

  const calculateCalories = () => {
    const { currentWeight, weightUnit, height, heightUnit, age, gender, activityLevel, targetWeight, targetWeightUnit } = onboardingData;

    // Convert to metric (height is already stored in cm)
    const weightKg = weightUnit === 'lb' ? (currentWeight || 0) / 2.20462 : (currentWeight || 0);
    const heightCm = height || 0; // Height is stored in cm
    const targetWeightKg = targetWeightUnit === 'lb' ? (targetWeight || weightKg) / 2.20462 : (targetWeight || weightKg);

    // Calculate BMR
    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * (age || 25) + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * (age || 25) - 161;
    }

    // Activity multiplier
    const activityMultipliers: Record<string, number> = {
      'sedentary': 1.2,
      'lightly-active': 1.375,
      'moderately-active': 1.55,
      'very-active': 1.725,
      'extra-active': 1.9
    };

    const activityMultiplier = activityMultipliers[activityLevel || 'moderately-active'] || 1.55;
    const tdee = bmr * activityMultiplier;

    // All scenarios (removed extreme weight loss)
    const maintainCalories = Math.round(tdee);
    const mildWeightLoss = Math.round(tdee * 0.90);
    const weightLoss = Math.round(tdee * 0.79);
    const mildWeightGain = Math.round(tdee * 1.10);
    const weightGain = Math.round(tdee * 1.21);

    // Determine recommended based on goal
    const weightDiff = weightKg - targetWeightKg;
    let recommendedCalories = maintainCalories;
    let recommendedType = 'maintain';

    if (onboardingData.goals?.includes('lose-weight') || weightDiff > 0) {
      if (weightDiff > 5) {
        recommendedCalories = weightLoss;
        recommendedType = 'weight-loss';
      } else {
        recommendedCalories = mildWeightLoss;
        recommendedType = 'mild-loss';
      }
    } else if (onboardingData.goals?.includes('gain-muscle') || weightDiff < 0) {
      const absWeightDiff = Math.abs(weightDiff);
      if (absWeightDiff > 5) {
        recommendedCalories = weightGain;
        recommendedType = 'weight-gain';
      } else {
        recommendedCalories = mildWeightGain;
        recommendedType = 'mild-gain';
      }
    }

    setCalorieData({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      maintainCalories,
      mildWeightLoss,
      weightLoss,
      mildWeightGain,
      weightGain,
      recommendedCalories,
      recommendedType,
      weightDiff: Math.abs(weightDiff),
      currentWeight: weightKg,
      targetWeight: targetWeightKg,
      activityLevel: activityLevel || 'moderately-active',
    });

    // Auto-select the recommended calorie target
    setSelectedCalorieTarget(recommendedType);
  };

  const handleSelectTarget = (targetType: string) => {
    setSelectedCalorieTarget(targetType);
  };

  const handleContinue = () => {
    if (!selectedCalorieTarget || !calorieData) return;

    // Get the selected calorie amount
    const calorieMap: Record<string, number> = {
      'maintain': calorieData.maintainCalories,
      'mild-loss': calorieData.mildWeightLoss,
      'weight-loss': calorieData.weightLoss,
      'mild-gain': calorieData.mildWeightGain,
      'weight-gain': calorieData.weightGain,
    };

    const selectedCalories = calorieMap[selectedCalorieTarget];

    // Save to context
    updateOnboardingData({
      calorieTarget: selectedCalories,
      calorieTargetType: selectedCalorieTarget,
    });

    // Route based on user's interest
    if (onboardingData.appInterest === 'nutrition') {
      // Nutrition only - skip workout days
      navigation.navigate('OnboardingPlansWelcome' as never);
    } else {
      // Workouts or both - go to workout days
      navigation.navigate('OnboardingWorkoutDays' as never);
    }
  };

  const getActivityLabel = (level: string) => {
    const labels: Record<string, string> = {
      'sedentary': t('onboarding.sedentary'),
      'lightly-active': t('onboarding.lightlyActive'),
      'moderately-active': t('onboarding.moderatelyActive'),
      'very-active': t('onboarding.veryActive'),
      'extra-active': t('onboarding.extraActive')
    };
    return labels[level] || level;
  };

  if (!calorieData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>{t('onboarding.calculating')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2a3a" />

      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '67%' }]} />
          </View>
          <Text style={styles.progressText}>8/12</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Your Daily Calorie Goal</Text>
        <Text style={styles.subtitle}>
          Based on your profile, we recommend this daily calorie intake
        </Text>

        {/* Recommended Calorie */}
        <View style={styles.recommendedCard}>
          <MaterialCommunityIcons name="fire" size={40} color="#FF8C42" />
          <Text style={styles.recommendedLabel}>Recommended</Text>
          <Text style={styles.recommendedCalories}>{calorieData.recommendedCalories}</Text>
          <Text style={styles.recommendedSubtitle}>calories per day</Text>
        </View>

        <Text style={styles.sectionTitle}>Or choose a different goal</Text>

        <View style={styles.optionsList}>
          {/* Weight Loss */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedCalorieTarget === 'weight-loss' && styles.optionCardSelected
            ]}
            onPress={() => handleSelectTarget('weight-loss')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-down" size={24} color="#3b9eff" />
            <Text style={styles.optionTitle}>Lose Weight</Text>
            <Text style={styles.optionCalories}>{calorieData.weightLoss}</Text>
            <Text style={styles.optionSubtitle}>cal/day</Text>
          </TouchableOpacity>

          {/* Maintain */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedCalorieTarget === 'maintain' && styles.optionCardSelected
            ]}
            onPress={() => handleSelectTarget('maintain')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="equal" size={24} color="#22C55E" />
            <Text style={styles.optionTitle}>Maintain Weight</Text>
            <Text style={styles.optionCalories}>{calorieData.maintainCalories}</Text>
            <Text style={styles.optionSubtitle}>cal/day</Text>
          </TouchableOpacity>

          {/* Weight Gain */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedCalorieTarget === 'weight-gain' && styles.optionCardSelected
            ]}
            onPress={() => handleSelectTarget('weight-gain')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="arrow-up" size={24} color="#FF8C42" />
            <Text style={styles.optionTitle}>Gain Weight</Text>
            <Text style={styles.optionCalories}>{calorieData.weightGain}</Text>
            <Text style={styles.optionSubtitle}>cal/day</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !selectedCalorieTarget && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!selectedCalorieTarget}
        >
          <Text style={styles.buttonText}>Continue</Text>
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
    backgroundColor: '#2a3a4a',
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
  contentContainer: {
    paddingTop: 30,
    paddingBottom: 20,
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#a0b0c0',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  recommendedCard: {
    backgroundColor: '#1e2e3e',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 3,
    borderColor: '#FF8C42',
  },
  recommendedLabel: {
    fontSize: 14,
    color: '#a0b0c0',
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  recommendedCalories: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FF8C42',
    marginBottom: 4,
  },
  recommendedSubtitle: {
    fontSize: 16,
    color: '#a0b0c0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8e9bab',
    marginBottom: 16,
    textAlign: 'center',
  },
  optionsList: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#1e2e3e',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    borderColor: '#FF8C42',
    backgroundColor: '#FF8C4210',
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  optionCalories: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF8C42',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#8e9bab',
  },
  footer: {
    padding: 20,
  },
  button: {
    backgroundColor: '#FF8C42',
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
    opacity: 0.5,
  },
});

export default OnboardingCalorieResultsScreen;
