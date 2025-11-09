import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { useNutrition } from '../../contexts/NutritionContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import NutritionOnboardingScreen from './NutritionOnboardingScreen';
import NutritionInfoCard from '../../components/NutritionInfoCard';
import { useLanguage } from '../../contexts/LanguageContext';
import CustomHeader from '../../components/CustomHeader';

const FoodDiaryScreenNew = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { currentDiary } = useNutrition();
  const { t } = useLanguage();

  const scrollViewRef = useRef<ScrollView>(null);
  const logMealSectionRef = useRef<View>(null);

  const [showNutritionOnboarding, setShowNutritionOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [targets, setTargets] = useState<any>({ calories: 2000, protein: 150, carbs: 200, fat: 67 });

  // Calculate calories for each meal from current diary
  const getMealCalories = (mealType: string) => {
    if (!currentDiary) return 0;

    let mealItems: any[] = [];

    if (mealType === 'breakfast') {
      mealItems = currentDiary.breakfast || [];
    } else if (mealType === 'lunch') {
      mealItems = currentDiary.lunch || [];
    } else if (mealType === 'dinner') {
      mealItems = currentDiary.dinner || [];
    } else if (mealType.includes('snack')) {
      // All snacks are in the same array
      mealItems = currentDiary.snacks || [];
    }

    return mealItems.reduce((total, item) => total + (item.nutrition?.calories || 0), 0);
  };

  // Meals list with calculated calories
  const totalSnackCalories = getMealCalories('snack'); // Gets all snacks
  const meals = [
    { id: 'breakfast', name: 'Breakfast', calories: getMealCalories('breakfast') },
    { id: 'lunch', name: 'Lunch', calories: getMealCalories('lunch') },
    { id: 'snack', name: 'Snack', calories: totalSnackCalories },
    { id: 'dinner', name: 'Dinner', calories: getMealCalories('dinner') },
  ];

  useEffect(() => {
    checkNutritionOnboarding();
    loadNutritionData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkNutritionOnboarding();
      loadNutritionData();

      // Check if we should scroll to log meal section
      const params = route.params as { scrollToLogMeal?: boolean } | undefined;
      if (params?.scrollToLogMeal && logMealSectionRef.current) {
        setTimeout(() => {
          logMealSectionRef.current?.measureLayout(
            scrollViewRef.current as any,
            (x, y) => {
              scrollViewRef.current?.scrollTo({ y: y - 20, animated: true });
            },
            () => console.log('Failed to measure log meal section')
          );
        }, 300);
      }
    }, [route.params])
  );

  const checkNutritionOnboarding = async () => {
    try {
      const nutritionOnboardingKey = `nutrition_onboarding_complete_${user?.id}`;
      const isComplete = await AsyncStorage.getItem(nutritionOnboardingKey);

      if (!isComplete) {
        setShowNutritionOnboarding(true);
      }
      setCheckingOnboarding(false);
    } catch (error) {
      console.error('Error checking nutrition onboarding:', error);
      setCheckingOnboarding(false);
    }
  };

  const loadNutritionData = async () => {
    try {
      const nutritionDataKey = `nutrition_data_${user?.id}`;
      const dataStr = await AsyncStorage.getItem(nutritionDataKey);

      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.targets) {
          setTargets(data.targets);
        }
      }
    } catch (error) {
      console.error('Error loading nutrition data:', error);
    }
  };

  const handleCompleteOnboarding = () => {
    setShowNutritionOnboarding(false);
    loadNutritionData();
  };

  if (checkingOnboarding) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (showNutritionOnboarding) {
    return <NutritionOnboardingScreen onComplete={handleCompleteOnboarding} />;
  }

  const totals = currentDiary?.totalNutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const consumed = totals?.calories || 0;
  const targetCalories = targets?.calories || 2000;
  const remaining = Math.max(0, targetCalories - consumed);

  const handleMealPress = (meal: any) => {
    navigation.navigate('MealLog' as never, {
      mealType: meal.id,
      mealName: meal.name
    } as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      <CustomHeader />

      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Nutrition</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('MealPlanSelection' as never)}
            style={styles.changePlanButton}
          >
            <Ionicons name="settings-outline" size={24} color="#B0B0B0" />
          </TouchableOpacity>
        </View>

        {/* Calorie Progress Bar */}
        <View style={styles.calorieCard}>
          <Text style={styles.calorieNumber}>{Math.round(consumed)} {t('nutrition.cal')}</Text>
          <Text style={styles.targetLabel}>{t('nutrition.target')}: {Math.round(targetCalories)} {t('nutrition.cal')}</Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              {/* Background bar */}
              <View style={styles.progressBarBackground} />

              {/* Target range */}
              <View
                style={[
                  styles.targetRange,
                  {
                    left: `${(((targetCalories - 150) / (targetCalories * 1.2)) * 100).toFixed(2)}%` as any,
                    width: `${((300 / (targetCalories * 1.2)) * 100).toFixed(2)}%` as any
                  }
                ]}
              />

              {/* Target line (dotted) */}
              <View style={[styles.targetLine, { left: `${((targetCalories / (targetCalories * 1.2)) * 100).toFixed(2)}%` as any }]} />

              {/* Consumed progress */}
              <View
                style={[
                  styles.consumedProgress,
                  { width: `${Math.min(100, (consumed / (targetCalories * 1.2)) * 100)}%` as any }
                ]}
              />
            </View>

            {/* Bar labels */}
            <View style={styles.barLabels}>
              <Text style={styles.barLabel}>0</Text>
              <Text style={styles.barLabel}>{Math.round(targetCalories * 1.2)}</Text>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendBox} />
            <Text style={styles.legendLabel}>{t('nutrition.targetRange')}</Text>
            <Text style={styles.legendDots}> . . . . . . </Text>
            <Text style={styles.legendValue}>
              {Math.round(targetCalories - 150)}-{Math.round(targetCalories + 150)} {t('nutrition.cal')}
            </Text>
          </View>
        </View>

        {/* Nutrition Info Card with Pie Charts */}
        <NutritionInfoCard
          carbsConsumed={totals?.carbs || 0}
          fatConsumed={totals?.fat || 0}
          proteinConsumed={totals?.protein || 0}
          carbsTarget={targets?.carbs || 200}
          fatTarget={targets?.fat || 67}
          proteinTarget={targets?.protein || 150}
        />

        {/* Log Meal Section */}
        <View ref={logMealSectionRef} style={styles.logMealSection}>
          <View style={styles.mealContainer}>
            <Text style={styles.sectionTitle}>Log Meal</Text>

            {meals.map((meal, index) => (
              <React.Fragment key={meal.id}>
                <TouchableOpacity
                  style={styles.mealItem}
                  onPress={() => handleMealPress(meal)}
                >
                  {/* Calorie Circle */}
                  <View style={styles.mealCalorieCircle}>
                    <Text style={styles.mealCalorieNumber}>{Math.round(meal.calories)}</Text>
                    <Text style={styles.mealCalorieLabel}>{t('nutrition.cal')}</Text>
                  </View>

                  {/* Meal Name */}
                  <Text style={styles.mealName}>{meal.name}</Text>

                  {/* Vertical Separator */}
                  <View style={styles.verticalSeparator} />

                  {/* Plus Icon */}
                  <Ionicons name="add" size={32} color="#fff" />
                </TouchableOpacity>
                {index < meals.length - 1 && <View style={styles.mealSeparator} />}
              </React.Fragment>
            ))}
          </View>
        </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  loadingText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  changePlanButton: {
    padding: 8,
  },
  calorieCard: {
    backgroundColor: '#2C2C2E',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  calorieNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  targetLabel: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 32,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#2A2A2A',
  },
  targetRange: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#4A5F3A',
  },
  targetLine: {
    position: 'absolute',
    width: 2,
    height: '100%',
    borderLeftWidth: 2,
    borderLeftColor: '#8BC34A',
    borderStyle: 'dotted',
    marginLeft: -1,
  },
  consumedProgress: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#1CB0F6',
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barLabel: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  legendRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 16,
    height: 16,
    backgroundColor: '#4A5F3A',
    borderRadius: 4,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 14,
    color: '#fff',
  },
  legendDots: {
    fontSize: 14,
    color: '#4A5568',
    flex: 1,
    letterSpacing: 3,
    marginLeft: 8,
    marginTop: -2,
  },
  legendValue: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
  logMealSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    padding: 20,
    paddingBottom: 12,
  },
  mealContainer: {
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    overflow: 'hidden',
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  mealSeparator: {
    height: 1,
    backgroundColor: '#4A5568',
    marginLeft: 82,
    marginRight: 16,
  },
  mealCalorieCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3A4A5A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mealCalorieNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mealCalorieLabel: {
    color: '#B0B0B0',
    fontSize: 10,
  },
  verticalSeparator: {
    width: 1,
    height: 28,
    backgroundColor: '#4A5568',
    marginHorizontal: 12,
  },
  mealName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});

export default FoodDiaryScreenNew;
