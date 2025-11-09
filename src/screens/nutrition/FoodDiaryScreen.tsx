import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { format, addDays, subDays } from 'date-fns';
import { useNutrition } from '../../contexts/NutritionContext';
import { FoodIntake, MealType } from '../../types/nutrition.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import NutritionOnboardingScreen from './NutritionOnboardingScreen';
import Svg, { Circle } from 'react-native-svg';
import { getSelectedMealPlan } from '../../services/mealPlanService';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const FoodDiaryScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const {
    currentDiary,
    selectedDate,
    setSelectedDate,
    removeFoodIntake,
    getRemainingCalories,
  } = useNutrition();

  const [showNutritionOnboarding, setShowNutritionOnboarding] = useState(false);
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [selectedMealPlan, setSelectedMealPlan] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [nutritionData, setNutritionData] = useState<any>(null);
  const [targets, setTargets] = useState<any>({ calories: 2000, protein: 150, carbs: 200, fat: 67 });

  useEffect(() => {
    checkNutritionOnboarding();
    loadMealPlan();
    loadNutritionData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      checkNutritionOnboarding();
      loadMealPlan();
      loadNutritionData();
    }, [])
  );

  const loadNutritionData = async () => {
    try {
      const nutritionDataKey = `nutrition_data_${user?.id}`;
      const dataStr = await AsyncStorage.getItem(nutritionDataKey);

      if (dataStr) {
        const data = JSON.parse(dataStr);
        setNutritionData(data);
        if (data.targets) {
          setTargets(data.targets);
          console.log('Loaded targets:', data.targets);
        }
      }
    } catch (error) {
      console.error('Error loading nutrition data:', error);
    }
  };

  const loadMealPlan = async () => {
    const plan = await getSelectedMealPlan();
    setSelectedMealPlan(plan);
  };

  const checkNutritionOnboarding = async () => {
    try {
      const nutritionOnboardingKey = `nutrition_onboarding_complete_${user?.id}`;
      const completed = await AsyncStorage.getItem(nutritionOnboardingKey);
      setShowNutritionOnboarding(completed !== 'true');
    } catch (error) {
      console.error('Error checking nutrition onboarding:', error);
    } finally {
      setCheckingOnboarding(false);
    }
  };

  const handleNutritionOnboardingComplete = () => {
    setShowNutritionOnboarding(false);
  };

  const handlePreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const getMealFoods = (mealType: MealType): FoodIntake[] => {
    if (!currentDiary || !currentDiary.meals) return [];
    return currentDiary.meals
      .filter((meal) => meal.mealType === mealType)
      .flatMap((meal) => meal.foods || []);
  };

  const getMealCalories = (mealType: MealType): number => {
    const foods = getMealFoods(mealType);
    return foods.reduce((sum, food) => sum + food.nutrition.calories, 0);
  };

  const isMealComplete = (mealType: MealType): boolean => {
    return getMealFoods(mealType).length > 0;
  };

  const getCompletedMealsCount = (): number => {
    const mealTypes = [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER, MealType.SNACK];
    return mealTypes.filter(type => isMealComplete(type)).length;
  };

  // Swipe gesture for date navigation
  const swipeGesture = Gesture.Pan()
    .onEnd((event) => {
      const SWIPE_THRESHOLD = 50; // Minimum distance to trigger swipe

      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        if (event.translationX > 0) {
          // Swipe right - go to previous day
          handlePreviousDay();
        } else {
          // Swipe left - go to next day
          handleNextDay();
        }
      }
    })
    .runOnJS(true);

  if (checkingOnboarding) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (showNutritionOnboarding) {
    return <NutritionOnboardingScreen onComplete={handleNutritionOnboardingComplete} />;
  }

  if (!currentDiary) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  const totals = currentDiary.totalNutrition;

  // Calculate remaining calories and percentage
  const consumed = totals.calories || 0;
  const targetCalories = targets.calories || 2000;
  const remaining = Math.max(0, targetCalories - consumed);
  const percentage = Math.min((consumed / targetCalories) * 100, 100);

  console.log('Calorie display:', { consumed, targetCalories, remaining, percentage });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#202124" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meal Plan</Text>
        <TouchableOpacity style={styles.actionsButton} accessibilityLabel="Actions menu">
          <Text style={styles.actionsButtonText}>Actions</Text>
          <MaterialCommunityIcons name="dots-vertical" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <GestureDetector gesture={swipeGesture}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calorie Summary - ORIGINAL FIRST BLOCK */}
        <View style={styles.calorieCard}>
          {/* Main Circle - 75% */}
          <View style={styles.calorieMain}>
            <Svg width={200} height={200} style={styles.circleSvg}>
              {/* Background arc - 75% closed */}
              <Circle
                cx={100}
                cy={100}
                r={85}
                stroke="#5B7FA6"
                strokeWidth={16}
                fill="none"
                strokeDasharray={`${2 * Math.PI * 85 * 0.75} ${2 * Math.PI * 85 * 0.25}`}
                transform="rotate(135 100 100)"
                strokeLinecap="round"
              />
              {/* Progress arc - bright blue - Shows REMAINING calories */}
              <Circle
                cx={100}
                cy={100}
                r={85}
                stroke="#1CB0F6"
                strokeWidth={16}
                fill="none"
                strokeDasharray={`${2 * Math.PI * 85 * 0.75}`}
                strokeDashoffset={`${2 * Math.PI * 85 * 0.75 * (consumed / targetCalories)}`}
                strokeLinecap="round"
                transform="rotate(135 100 100)"
              />
            </Svg>
            <View style={styles.calorieTextContainer}>
              <Text style={styles.calorieNumber}>{Math.round(remaining)}</Text>
              <Text style={styles.calorieLabel}>kcal left</Text>
            </View>
          </View>

          {/* Compact Macro Rings with labels */}
          <View style={styles.macroRingsInline}>
            <View style={styles.macroRingWithLabel}>
              <Svg width={35} height={35}>
                <Circle cx={17.5} cy={17.5} r={14} stroke="#5B7FA6" strokeWidth={6} fill="none" />
                <Circle
                  cx={17.5}
                  cy={17.5}
                  r={14}
                  stroke="#4ECDC4"
                  strokeWidth={6}
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 14}`}
                  strokeDashoffset={`${2 * Math.PI * 14 * (1 - Math.min((totals.carbs || 0) / (targets.carbs || 1), 1))}`}
                  strokeLinecap="round"
                  transform="rotate(-90 17.5 17.5)"
                />
              </Svg>
              <View style={styles.macroLabelContainer}>
                <Text style={styles.macroValues}>{Math.round(totals.carbs)}/{targets.carbs}g</Text>
                <Text style={styles.macroName}>Carbs</Text>
              </View>
            </View>

            <View style={styles.macroRingWithLabel}>
              <Svg width={35} height={35}>
                <Circle cx={17.5} cy={17.5} r={14} stroke="#5B7FA6" strokeWidth={6} fill="none" />
                <Circle
                  cx={17.5}
                  cy={17.5}
                  r={14}
                  stroke="#FFD93D"
                  strokeWidth={6}
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 14}`}
                  strokeDashoffset={`${2 * Math.PI * 14 * (1 - Math.min((totals.fat || 0) / (targets.fat || 1), 1))}`}
                  strokeLinecap="round"
                  transform="rotate(-90 17.5 17.5)"
                />
              </Svg>
              <View style={styles.macroLabelContainer}>
                <Text style={styles.macroValues}>{Math.round(totals.fat)}/{targets.fat}g</Text>
                <Text style={styles.macroName}>Fat</Text>
              </View>
            </View>

            <View style={styles.macroRingWithLabel}>
              <Svg width={35} height={35}>
                <Circle cx={17.5} cy={17.5} r={14} stroke="#5B7FA6" strokeWidth={6} fill="none" />
                <Circle
                  cx={17.5}
                  cy={17.5}
                  r={14}
                  stroke="#FF6B6B"
                  strokeWidth={6}
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 14}`}
                  strokeDashoffset={`${2 * Math.PI * 14 * (1 - Math.min((totals.protein || 0) / (targets.protein || 1), 1))}`}
                  strokeLinecap="round"
                  transform="rotate(-90 17.5 17.5)"
                />
              </Svg>
              <View style={styles.macroLabelContainer}>
                <Text style={styles.macroValues}>{Math.round(totals.protein)}/{targets.protein}g</Text>
                <Text style={styles.macroName}>Protein</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Day/Week Toggle */}
        <View style={styles.toggleSection}>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'day' && styles.toggleButtonActive]}
            onPress={() => setViewMode('day')}
            accessibilityLabel="View day mode"
          >
            <Text style={[styles.toggleText, viewMode === 'day' && styles.toggleTextActive]}>Day</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, viewMode === 'week' && styles.toggleButtonActive]}
            onPress={() => setViewMode('week')}
            accessibilityLabel="View week mode"
          >
            <Text style={[styles.toggleText, viewMode === 'week' && styles.toggleTextActive]}>Week</Text>
          </TouchableOpacity>
        </View>

        {/* Date Navigation */}
        <View style={styles.dateNavigation}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handlePreviousDay}
            accessibilityLabel="Previous day"
          >
            <MaterialCommunityIcons name="chevron-left" size={32} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.dateText}>
            {format(selectedDate, 'MMMM d, yyyy') === format(new Date(), 'MMMM d, yyyy')
              ? `Today, ${format(selectedDate, 'MMM d')}`
              : format(selectedDate, 'MMM d, yyyy')}
          </Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleNextDay}
            accessibilityLabel="Next day"
          >
            <MaterialCommunityIcons name="chevron-right" size={32} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Summary Card with Pie Chart - Shows Daily Targets */}
        <TouchableOpacity
          style={styles.summaryCard}
          onPress={() => navigation.navigate('MealPlanSelection' as never)}
          accessibilityLabel="View meal plan selection"
        >
          <View style={styles.pieChartContainer}>
            <Svg width={60} height={60}>
              {/* Pie chart showing macro distribution */}
              <Circle cx={30} cy={30} r={25} fill="#FFA726" />
              <Circle
                cx={30}
                cy={30}
                r={25}
                fill="transparent"
                stroke="#4285F4"
                strokeWidth={50}
                strokeDasharray={`${Math.PI * 50 * 0.3} ${Math.PI * 50 * 0.7}`}
                transform="rotate(-90 30 30)"
              />
              <Circle
                cx={30}
                cy={30}
                r={25}
                fill="transparent"
                stroke="#66BB6A"
                strokeWidth={50}
                strokeDasharray={`${Math.PI * 50 * 0.25} ${Math.PI * 50 * 0.75}`}
                transform="rotate(18 30 30)"
              />
            </Svg>
          </View>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryCalories}>
              {targets.calories} Calories
            </Text>
            <Text style={styles.summaryMacros}>
              {targets.carbs}g Carbs, {targets.fat}g Fat, {targets.protein}g Protein
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#888" />
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min((getCompletedMealsCount() / 4) * 100, 100)}%` }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Tracked {getCompletedMealsCount()}/4 meals
          </Text>
        </View>

        {/* Timeline */}
        <View style={styles.timeline}>
          {/* Breakfast */}
          <View style={styles.mealSection}>
            <View style={styles.mealHeader}>
              <View style={styles.timelineNode}>
                <View style={styles.timelineLine} />
                <View style={[
                  styles.circle,
                  isMealComplete(MealType.BREAKFAST) && styles.circleComplete
                ]} />
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.mealTitleContainer}>
                <Text style={styles.mealTitle}>Breakfast</Text>
                <Text style={styles.mealCalories}>{Math.round(getMealCalories(MealType.BREAKFAST))} Calories</Text>
              </View>
              <TouchableOpacity
                style={styles.menuButton}
                accessibilityLabel="Breakfast meal options"
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#888" />
              </TouchableOpacity>
            </View>

            {getMealFoods(MealType.BREAKFAST).map((food, index) => (
              <View key={`breakfast-${food.name}-${food.quantity}-${index}`} style={styles.foodItem}>
                <View style={styles.foodItemLeft}>
                  <View style={styles.timelineLine} />
                  <View style={[styles.circle, styles.circleSmall]} />
                  <View style={styles.timelineLine} />
                </View>
                <View style={styles.foodThumbnail}>
                  <MaterialCommunityIcons name="food-apple" size={32} color="#FF8C42" />
                </View>
                <View style={styles.foodInfo}>
                  <Text style={styles.name}>{food.name}</Text>
                  <Text style={styles.foodDetails}>
                    {food.servingSize} • {Math.round(food.nutrition.calories)} Calories
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.menuButton}
                  accessibilityLabel={`Options for ${food.name}`}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="#888" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Lunch */}
          <View style={styles.mealSection}>
            <View style={styles.mealHeader}>
              <View style={styles.timelineNode}>
                <View style={styles.timelineLine} />
                <View style={[
                  styles.circle,
                  isMealComplete(MealType.LUNCH) && styles.circleComplete
                ]} />
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.mealTitleContainer}>
                <Text style={styles.mealTitle}>Lunch</Text>
                <Text style={styles.mealCalories}>{Math.round(getMealCalories(MealType.LUNCH))} Calories</Text>
              </View>
              <TouchableOpacity
                style={styles.menuButton}
                accessibilityLabel="Lunch meal options"
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#888" />
              </TouchableOpacity>
            </View>

            {getMealFoods(MealType.LUNCH).map((food, index) => (
              <View key={`lunch-${food.name}-${food.servingSize}-${index}`} style={styles.foodItem}>
                <View style={styles.foodItemLeft}>
                  <View style={styles.timelineLine} />
                  <View style={[styles.circle, styles.circleSmall]} />
                  <View style={styles.timelineLine} />
                </View>
                <View style={styles.foodThumbnail}>
                  <MaterialCommunityIcons name="food" size={32} color="#FF8C42" />
                </View>
                <View style={styles.foodInfo}>
                  <Text style={styles.name}>{food.name}</Text>
                  <Text style={styles.foodDetails}>
                    {food.servingSize} • {Math.round(food.nutrition.calories)} Calories
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.menuButton}
                  accessibilityLabel={`Options for ${food.name}`}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="#888" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Dinner */}
          <View style={styles.mealSection}>
            <View style={styles.mealHeader}>
              <View style={styles.timelineNode}>
                <View style={styles.timelineLine} />
                <View style={[
                  styles.circle,
                  isMealComplete(MealType.DINNER) && styles.circleComplete
                ]} />
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.mealTitleContainer}>
                <Text style={styles.mealTitle}>Dinner</Text>
                <Text style={styles.mealCalories}>{Math.round(getMealCalories(MealType.DINNER))} Calories</Text>
              </View>
              <TouchableOpacity
                style={styles.menuButton}
                accessibilityLabel="Dinner meal options"
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#888" />
              </TouchableOpacity>
            </View>

            {getMealFoods(MealType.DINNER).map((food, index) => (
              <View key={`dinner-${food.name}-${food.servingSize}-${index}`} style={styles.foodItem}>
                <View style={styles.foodItemLeft}>
                  <View style={styles.timelineLine} />
                  <View style={[styles.circle, styles.circleSmall]} />
                  <View style={styles.timelineLine} />
                </View>
                <View style={styles.foodThumbnail}>
                  <MaterialCommunityIcons name="silverware-fork-knife" size={32} color="#FF8C42" />
                </View>
                <View style={styles.foodInfo}>
                  <Text style={styles.name}>{food.name}</Text>
                  <Text style={styles.foodDetails}>
                    {food.servingSize} • {Math.round(food.nutrition.calories)} Calories
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.menuButton}
                  accessibilityLabel={`Options for ${food.name}`}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="#888" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Snack */}
          <View style={styles.mealSection}>
            <View style={styles.mealHeader}>
              <View style={styles.timelineNode}>
                <View style={styles.timelineLine} />
                <View style={[
                  styles.circle,
                  isMealComplete(MealType.SNACK) && styles.circleComplete
                ]} />
                <View style={styles.timelineLine} />
              </View>
              <View style={styles.mealTitleContainer}>
                <Text style={styles.mealTitle}>Snack</Text>
                <Text style={styles.mealCalories}>{Math.round(getMealCalories(MealType.SNACK))} Calories</Text>
              </View>
              <TouchableOpacity
                style={styles.menuButton}
                accessibilityLabel="Snack meal options"
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#888" />
              </TouchableOpacity>
            </View>

            {getMealFoods(MealType.SNACK).map((food, index) => (
              <View key={`snack-${food.name}-${food.servingSize}-${index}`} style={styles.foodItem}>
                <View style={styles.foodItemLeft}>
                  <View style={styles.timelineLine} />
                  <View style={[styles.circle, styles.circleSmall]} />
                  <View style={styles.timelineLine} />
                </View>
                <View style={styles.foodThumbnail}>
                  <MaterialCommunityIcons name="food-variant" size={32} color="#FF8C42" />
                </View>
                <View style={styles.foodInfo}>
                  <Text style={styles.name}>{food.name}</Text>
                  <Text style={styles.foodDetails}>
                    {food.servingSize} • {Math.round(food.nutrition.calories)} Calories
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.menuButton}
                  accessibilityLabel={`Options for ${food.name}`}
                >
                  <Ionicons name="ellipsis-vertical" size={20} color="#888" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
        </ScrollView>
      </GestureDetector>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202124',
  },
  loadingText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#444',
    gap: 4,
  },
  actionsButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  calorieCard: {
    backgroundColor: '#2a2d31',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  calorieMain: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  circleSvg: {
    transform: [{ rotate: '0deg' }],
  },
  calorieTextContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calorieNumber: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
  },
  calorieLabel: {
    fontSize: 14,
    color: '#8e9bab',
  },
  macroRingsInline: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  macroRingWithLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroLabelContainer: {
    alignItems: 'flex-start',
  },
  macroValues: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  macroName: {
    fontSize: 12,
    color: '#8e9bab',
  },
  timeline: {
    paddingLeft: 20,
  },
  mealSection: {
    marginBottom: 20,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timelineNode: {
    alignItems: 'center',
    marginRight: 15,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#555',
    backgroundColor: 'transparent',
  },
  circleComplete: {
    backgroundColor: '#FF8C42',
    borderColor: '#FF8C42',
  },
  circleSmall: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#555',
    marginLeft: 11,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#333',
    minHeight: 20,
    marginVertical: -2,
  },
  mealTitleContainer: {
    flex: 1,
  },
  mealTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  mealCalories: {
    color: '#888',
    fontSize: 14,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  foodItemLeft: {
    alignItems: 'center',
    marginRight: 15,
  },
  foodThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  foodDetails: {
    color: '#888',
    fontSize: 14,
  },
  bottomSpacer: {
    height: 100,
  },
  toggleSection: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 4,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#555',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#888',
  },
  toggleTextActive: {
    color: '#fff',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 24,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    minWidth: 200,
    textAlign: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#2a2d31',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  pieChartContainer: {
    width: 60,
    height: 60,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryCalories: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  summaryMacros: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333',
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  iconButton: {
    padding: 6,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FoodDiaryScreen;
