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

    // All scenarios (using proper calorie deficits/surpluses)
    const maintainCalories = Math.round(tdee);
    const mildWeightLoss = Math.round(tdee - 250); // 0.25 kg/week loss (250 cal deficit)
    const weightLoss = Math.round(tdee - 500); // 0.5 kg/week loss (500 cal deficit)
    const extremeWeightLoss = Math.round(tdee - 1000); // 1 kg/week loss (1000 cal deficit)
    const mildWeightGain = Math.round(tdee + 250); // 0.25 kg/week gain (250 cal surplus)
    const weightGain = Math.round(tdee + 500); // 0.5 kg/week gain (500 cal surplus)

    // Determine recommended based on goal
    const weightDiff = weightKg - targetWeightKg;
    let recommendedCalories = maintainCalories;
    let recommendedType = 'maintain';

    if (onboardingData.goals?.includes('lose-weight') || weightDiff > 0) {
      if (weightDiff > 10) {
        recommendedCalories = extremeWeightLoss;
        recommendedType = 'extreme-loss';
      } else if (weightDiff > 5) {
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

    // Calculate time to reach goal for each option (in weeks)
    // 1 kg fat = ~7700 calories, time = (weight diff * 7700) / (weekly deficit)
    const calculateTimeToGoal = (dailyDeficit: number) => {
      if (weightDiff === 0 || dailyDeficit === 0) return 0;
      const weeklyDeficit = Math.abs(dailyDeficit * 7);
      const totalCaloriesNeeded = Math.abs(weightDiff) * 7700;
      return Math.ceil(totalCaloriesNeeded / weeklyDeficit);
    };

    setCalorieData({
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      maintainCalories,
      mildWeightLoss,
      weightLoss,
      extremeWeightLoss,
      mildWeightGain,
      weightGain,
      recommendedCalories,
      recommendedType,
      weightDiff: Math.abs(weightDiff),
      currentWeight: weightKg,
      targetWeight: targetWeightKg,
      activityLevel: activityLevel || 'moderately-active',
      // Time estimates in weeks
      extremeLossTime: calculateTimeToGoal(-1000),
      weightLossTime: calculateTimeToGoal(-500),
      mildLossTime: calculateTimeToGoal(-250),
      maintainTime: 0,
      mildGainTime: calculateTimeToGoal(250),
      weightGainTime: calculateTimeToGoal(500),
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
      'extreme-loss': calorieData.extremeWeightLoss,
      'mild-gain': calorieData.mildWeightGain,
      'weight-gain': calorieData.weightGain,
    };

    const selectedCalories = calorieMap[selectedCalorieTarget];
    console.log('🎯 User selected calorie target:', {
      type: selectedCalorieTarget,
      calories: selectedCalories
    });

    // Save to context
    updateOnboardingData({
      calorieTarget: selectedCalories,
      calorieTargetType: selectedCalorieTarget,
    });
    console.log('✅ Saved to onboarding context');

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

  const formatTimeEstimate = (weeks: number) => {
    if (weeks === 0) return 'Current weight';
    if (weeks < 4) return `~${weeks} week${weeks > 1 ? 's' : ''}`;
    const months = Math.round(weeks / 4);
    if (months < 12) return `~${months} month${months > 1 ? 's' : ''}`;
    const years = Math.round(months / 12);
    return `~${years} year${years > 1 ? 's' : ''}`;
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
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

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
          <Text style={styles.recommendedLabel}>
            {calorieData.recommendedType === 'maintain' ? 'Maintain Weight' : 'Recommended'}
          </Text>
          <Text style={styles.recommendedCalories}>{calorieData.recommendedCalories}</Text>
          <Text style={styles.recommendedSubtitle}>calories per day</Text>
        </View>

        <Text style={styles.sectionTitle}>Or choose a different goal</Text>

        <View style={styles.optionsGrid}>
          {/* Extreme Weight Loss */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedCalorieTarget === 'extreme-loss' && styles.optionCardSelected
            ]}
            onPress={() => handleSelectTarget('extreme-loss')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chevron-triple-down" size={24} color="#DC2626" />
            <Text style={styles.optionTitle}>Extreme Loss</Text>
            <Text style={styles.optionCalories}>{calorieData.extremeWeightLoss}</Text>
            <Text style={styles.optionSubtitle}>-1 kg/week</Text>
            {calorieData.extremeLossTime > 0 && (
              <Text style={styles.optionTime}>{formatTimeEstimate(calorieData.extremeLossTime)}</Text>
            )}
          </TouchableOpacity>

          {/* Weight Loss */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedCalorieTarget === 'weight-loss' && styles.optionCardSelected
            ]}
            onPress={() => handleSelectTarget('weight-loss')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chevron-double-down" size={24} color="#3B82F6" />
            <Text style={styles.optionTitle}>Weight Loss</Text>
            <Text style={styles.optionCalories}>{calorieData.weightLoss}</Text>
            <Text style={styles.optionSubtitle}>-0.5 kg/week</Text>
            {calorieData.weightLossTime > 0 && (
              <Text style={styles.optionTime}>{formatTimeEstimate(calorieData.weightLossTime)}</Text>
            )}
          </TouchableOpacity>

          {/* Mild Weight Loss */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedCalorieTarget === 'mild-loss' && styles.optionCardSelected
            ]}
            onPress={() => handleSelectTarget('mild-loss')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chevron-down" size={24} color="#60A5FA" />
            <Text style={styles.optionTitle}>Mild Loss</Text>
            <Text style={styles.optionCalories}>{calorieData.mildWeightLoss}</Text>
            <Text style={styles.optionSubtitle}>-0.25 kg/week</Text>
            {calorieData.mildLossTime > 0 && (
              <Text style={styles.optionTime}>{formatTimeEstimate(calorieData.mildLossTime)}</Text>
            )}
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
            <MaterialCommunityIcons name="equal" size={24} color="#10B981" />
            <Text style={styles.optionTitle}>Maintain</Text>
            <Text style={styles.optionCalories}>{calorieData.maintainCalories}</Text>
            <Text style={styles.optionSubtitle}>0 kg/week</Text>
            <Text style={styles.optionTime}>{formatTimeEstimate(calorieData.maintainTime)}</Text>
          </TouchableOpacity>

          {/* Mild Weight Gain */}
          <TouchableOpacity
            style={[
              styles.optionCard,
              selectedCalorieTarget === 'mild-gain' && styles.optionCardSelected
            ]}
            onPress={() => handleSelectTarget('mild-gain')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="chevron-up" size={24} color="#F59E0B" />
            <Text style={styles.optionTitle}>Mild Gain</Text>
            <Text style={styles.optionCalories}>{calorieData.mildWeightGain}</Text>
            <Text style={styles.optionSubtitle}>+0.25 kg/week</Text>
            {calorieData.mildGainTime > 0 && (
              <Text style={styles.optionTime}>{formatTimeEstimate(calorieData.mildGainTime)}</Text>
            )}
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
            <MaterialCommunityIcons name="chevron-double-up" size={24} color="#FF8C42" />
            <Text style={styles.optionTitle}>Weight Gain</Text>
            <Text style={styles.optionCalories}>{calorieData.weightGain}</Text>
            <Text style={styles.optionSubtitle}>+0.5 kg/week</Text>
            {calorieData.weightGainTime > 0 && (
              <Text style={styles.optionTime}>{formatTimeEstimate(calorieData.weightGainTime)}</Text>
            )}
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
    backgroundColor: '#2A2A2A',
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  optionCard: {
    width: '48%',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    padding: 16,
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
  optionTime: {
    fontSize: 11,
    color: '#6a7a8a',
    marginTop: 4,
    fontStyle: 'italic',
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
