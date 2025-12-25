import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useNutrition } from '../../contexts/NutritionContext';
import {
  NutritionScreenNavigationProp,
  NutritionScreenRouteProp,
  MealTypeId,
} from '../../types/navigation.types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import NutritionInfoCard from '../../components/NutritionInfoCard';
import { useLanguage } from '../../contexts/LanguageContext';
import CustomHeader from '../../components/CustomHeader';
import { useTheme } from '../../contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import calorieTrackingService, { BurnedCalories } from '../../services/calorieTrackingService';
import { BRAND_COLORS } from '../../constants/brandColors';
import stepTrackingService from '../../services/stepTrackingService';
import { backfillTodayWorkoutCalories } from '../../utils/backfillWorkoutCalories';

// Helper function to format numbers with commas
const formatNumber = (num: number): string => {
  return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Constants for nutrition tracking
const NUTRITION_CONSTANTS = {
  // Target range: allows ±150 calories from target (e.g., 2000 cal target = 1850-2150 range)
  TARGET_RANGE_BUFFER: 150,

  // Progress bar shows 120% of target calories (provides room for overconsumption visualization)
  MAX_BAR_MULTIPLIER: 1.2,

  // Minimum allowed target calories (prevents division by zero and unrealistic goals)
  MIN_TARGET_CALORIES: 100,

  // Animation delay in ms - allows user to see screen before animation starts
  ANIMATION_DELAY: 800,

  // Default nutrition targets when user data is unavailable
  DEFAULT_TARGETS: {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 67,
  },
};

const FoodDiaryScreenNew = () => {
  const navigation = useNavigation<NutritionScreenNavigationProp<'NutritionMain'>>();
  const route = useRoute<NutritionScreenRouteProp<'NutritionMain'>>();
  const { user } = useAuth();
  const { currentDiary, removeFoodIntake } = useNutrition();
  const { t } = useLanguage();
  const { colors } = useTheme();

  // Generate styles with theme colors
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const scrollViewRef = useRef<ScrollView>(null);
  const logMealSectionRef = useRef<View>(null);

  const [targets, setTargets] = useState<any>(NUTRITION_CONSTANTS.DEFAULT_TARGETS);
  const [refreshing, setRefreshing] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [burnedCalories, setBurnedCalories] = useState<BurnedCalories>({ workouts: 0, steps: 0, total: 0 });
  const [showBurnedBreakdown, setShowBurnedBreakdown] = useState(false);
  const [addBurnedToGoal, setAddBurnedToGoal] = useState(false);

  // Animated values for progress bars
  const normalProgressAnim = useRef(new Animated.Value(0)).current;
  const overProgressAnim = useRef(new Animated.Value(0)).current;
  const previousConsumed = useRef(0);

  // Helper function to get meal items from diary based on meal type
  // Note: 'snack' meal type maps to 'snacks' property in diary (plural)
  const getMealItems = (diary: any, mealType: MealTypeId): any[] => {
    if (!diary) return [];

    switch (mealType) {
      case 'breakfast':
        return diary.breakfast || [];
      case 'lunch':
        return diary.lunch || [];
      case 'snack':
        // Special case: 'snack' type maps to 'snacks' property (plural)
        return diary.snacks || [];
      case 'dinner':
        return diary.dinner || [];
      default:
        // TypeScript should prevent this, but adding for safety
        console.warn(`Unknown meal type: ${mealType}`);
        return [];
    }
  };

  // Memoized meal calories calculation - only recalculates when currentDiary changes
  const meals = useMemo(() => {
    const calculateMealCalories = (mealItems: any[]) => {
      return mealItems.reduce((total, item) => total + (item.nutrition?.calories || 0), 0);
    };

    const mealTypes: Array<{ id: MealTypeId; name: string }> = [
      { id: 'breakfast', name: 'Breakfast' },
      { id: 'lunch', name: 'Lunch' },
      { id: 'snack', name: 'Snack' },
      { id: 'dinner', name: 'Dinner' },
    ];

    return mealTypes.map(mealType => ({
      ...mealType,
      calories: calculateMealCalories(getMealItems(currentDiary, mealType.id)),
    }));
  }, [currentDiary]);

  useEffect(() => {
    // Initial load with loading state
    loadNutritionData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Reload on focus, but don't show loading spinner (data already loaded once)
      const reloadData = async () => {
        try {
          if (!user?.id) return;

          // Load from Firebase (same source as home tab)
          const firebaseDailyDataService = (await import('../../services/firebaseDailyDataService')).default;
          const todayData = await firebaseDailyDataService.getTodayData(user.id);

          const newTargets = {
            calories: todayData.calories.target || NUTRITION_CONSTANTS.DEFAULT_TARGETS.calories,
            protein: todayData.protein.target || NUTRITION_CONSTANTS.DEFAULT_TARGETS.protein,
            carbs: todayData.carbs.target || NUTRITION_CONSTANTS.DEFAULT_TARGETS.carbs,
            fat: todayData.fat.target || NUTRITION_CONSTANTS.DEFAULT_TARGETS.fat,
          };

          setTargets(newTargets);
        } catch (error) {
          console.error('Error reloading nutrition data:', error);
        }
      };
      reloadData();

      // Reset bars to previous value when screen focuses (so we can animate from there)
      // Safety check for division
      const safeMaxValue = Math.max(targetCalories * NUTRITION_CONSTANTS.MAX_BAR_MULTIPLIER, 1);
      const prevNormalWidth = Math.min(previousConsumed.current, targetCalories + NUTRITION_CONSTANTS.TARGET_RANGE_BUFFER);
      const prevNormalPercent = Math.min(100, (prevNormalWidth / safeMaxValue) * 100);
      normalProgressAnim.setValue(prevNormalPercent);

      const prevOverWidth = Math.max(0, previousConsumed.current - (targetCalories + NUTRITION_CONSTANTS.TARGET_RANGE_BUFFER));
      const prevOverPercent = prevOverWidth > 0 ? Math.min(100 - ((targetCalories + NUTRITION_CONSTANTS.TARGET_RANGE_BUFFER) / safeMaxValue) * 100, (prevOverWidth / safeMaxValue) * 100) : 0;
      overProgressAnim.setValue(prevOverPercent);

      // Trigger animation after a brief delay
      setTimeout(() => {
        setShouldAnimate(true);
      }, 100);

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

      // Cleanup when screen unfocuses
      return () => {
        setShouldAnimate(false);
      };
    }, [route.params])
  );

  const loadNutritionData = async () => {
    try {
      setIsLoading(true);

      if (!user?.id) {
        console.log('No user ID, skipping nutrition data load');
        return;
      }

      // Load from Firebase (same source as home tab)
      const firebaseDailyDataService = (await import('../../services/firebaseDailyDataService')).default;
      const todayData = await firebaseDailyDataService.getTodayData(user.id);

      const newTargets = {
        calories: todayData.calories.target || NUTRITION_CONSTANTS.DEFAULT_TARGETS.calories,
        protein: todayData.protein.target || NUTRITION_CONSTANTS.DEFAULT_TARGETS.protein,
        carbs: todayData.carbs.target || NUTRITION_CONSTANTS.DEFAULT_TARGETS.carbs,
        fat: todayData.fat.target || NUTRITION_CONSTANTS.DEFAULT_TARGETS.fat,
      };

      console.log('Loaded targets from Firebase:', newTargets);
      setTargets(newTargets);
    } catch (error) {
      console.error('Error loading nutrition data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Pull-to-refresh handler (doesn't show full loading screen)
  const onRefresh = async () => {
    console.log('🔄 [NUTRITION TAB] Pull-to-refresh triggered');
    setRefreshing(true);
    try {
      if (!user?.id) return;

      // Load from Firebase (same source as home tab)
      const firebaseDailyDataService = (await import('../../services/firebaseDailyDataService')).default;
      const todayData = await firebaseDailyDataService.getTodayData(user.id);

      const newTargets = {
        calories: todayData.calories.target || NUTRITION_CONSTANTS.DEFAULT_TARGETS.calories,
        protein: todayData.protein.target || NUTRITION_CONSTANTS.DEFAULT_TARGETS.protein,
        carbs: todayData.carbs.target || NUTRITION_CONSTANTS.DEFAULT_TARGETS.carbs,
        fat: todayData.fat.target || NUTRITION_CONSTANTS.DEFAULT_TARGETS.fat,
      };

      console.log('Refreshed targets from Firebase:', newTargets);
      setTargets(newTargets);
      console.log('✅ [NUTRITION TAB] Refresh completed successfully');
    } catch (error) {
      console.error('❌ [NUTRITION TAB] Error refreshing nutrition data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Load burned calories and settings
  const loadBurnedCalories = async () => {
    try {
      console.log('🔥 [NUTRITION] Loading burned calories...');

      // Backfill calories for workouts completed today (before tracking was added)
      // This runs once per session
      await backfillTodayWorkoutCalories();

      // Sync steps first to get latest data
      const stepData = await stepTrackingService.syncTodaySteps();
      console.log('🔥 [NUTRITION] Step data:', stepData);

      // Get burned calories
      const burned = await calorieTrackingService.getBurnedCalories(new Date());
      console.log('🔥 [NUTRITION] Burned calories:', burned);
      setBurnedCalories(burned);

      // Get settings
      const settings = await calorieTrackingService.getSettings();
      console.log('🔥 [NUTRITION] Settings:', settings);
      setAddBurnedToGoal(settings.addBurnedToGoal);

      console.log('✅ [NUTRITION] Loaded burned calories successfully');
    } catch (error) {
      console.error('❌ [NUTRITION] Error loading burned calories:', error);
    }
  };

  // Load burned calories when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      loadBurnedCalories();
    }, [])
  );

  const totals = currentDiary?.totalNutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };
  const consumed = totals?.calories || 0;

  // Base target from settings
  const baseTarget = Math.max(
    targets?.calories || NUTRITION_CONSTANTS.DEFAULT_TARGETS.calories,
    NUTRITION_CONSTANTS.MIN_TARGET_CALORIES
  );

  // Calculate adjusted goal - if setting is enabled, add burned calories to target
  const adjustedGoal = addBurnedToGoal ? baseTarget + burnedCalories.total : baseTarget;

  // Use adjusted goal for all calculations
  const targetCalories = adjustedGoal;
  const remaining = Math.max(0, targetCalories - consumed);
  const netCalories = consumed - burnedCalories.total;

  // Check if user has logged any meals
  const hasLoggedMeals = meals.some(meal => meal.calories > 0);

  // Calculate progress bar segments - with safety checks
  const maxBarValue = targetCalories * NUTRITION_CONSTANTS.MAX_BAR_MULTIPLIER;
  const targetRangeEnd = targetCalories + NUTRITION_CONSTANTS.TARGET_RANGE_BUFFER;
  const isOverTarget = consumed > targetRangeEnd;
  const normalProgressWidth = Math.min(consumed, targetRangeEnd);
  const overProgressWidth = Math.max(0, consumed - targetRangeEnd);

  // Animate progress bars when consumed changes - ONLY when screen is focused
  useEffect(() => {
    // Safety check: prevent division by zero
    const safeMaxBarValue = maxBarValue > 0 ? maxBarValue : 1;
    const normalWidthPercent = Math.min(100, (normalProgressWidth / safeMaxBarValue) * 100);
    const overWidthPercent = isOverTarget ? Math.min(100 - (targetRangeEnd / safeMaxBarValue) * 100, (overProgressWidth / safeMaxBarValue) * 100) : 0;

    console.log('📊 Progress Bar Update:', {
      consumed,
      targetCalories,
      normalWidthPercent,
      overWidthPercent,
      maxBarValue,
      shouldAnimate
    });

    if (!shouldAnimate) {
      // Set immediately without animation when screen first loads
      normalProgressAnim.setValue(normalWidthPercent);
      overProgressAnim.setValue(overWidthPercent);
      return;
    }

    // Delay animation so user can see it when navigating back
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.spring(normalProgressAnim, {
          toValue: normalWidthPercent,
          useNativeDriver: false,
          tension: 20,
          friction: 10,
        }),
        Animated.spring(overProgressAnim, {
          toValue: overWidthPercent,
          useNativeDriver: false,
          tension: 20,
          friction: 10,
        }),
      ]).start(() => {
        // Update previous consumed after animation completes
        previousConsumed.current = consumed;
      });
    }, NUTRITION_CONSTANTS.ANIMATION_DELAY);

    return () => clearTimeout(timer);
  }, [consumed, normalProgressWidth, overProgressWidth, maxBarValue, targetRangeEnd, isOverTarget, shouldAnimate, targetCalories, burnedCalories.total, addBurnedToGoal]);

  const handleMealPress = (meal: { id: MealTypeId; name: string; calories: number }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('MealLog', {
      mealType: meal.id,
      mealName: meal.name
    });
  };

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
        <CustomHeader />

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryAction} />
          <Text style={styles.loadingText}>Loading nutrition data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={BRAND_COLORS.accent}
              colors={[BRAND_COLORS.accent]}
            />
          }
        >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ width: 40 }} />
          <Text style={styles.headerTitle}>Nutrition</Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('MealPlanSelection');
            }}
            onLongPress={() => {
              if (!currentDiary) return;
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

              // Show confirmation dialog
              Alert.alert(
                'Clear All Meals',
                'Are you sure you want to delete all meals for today? This action cannot be undone.',
                [
                  {
                    text: 'Cancel',
                    style: 'cancel',
                    onPress: () => {
                      console.log('Data deletion cancelled');
                    }
                  },
                  {
                    text: 'Delete All',
                    style: 'destructive',
                    onPress: async () => {
                      // Clear all meals
                      const allMeals = [
                        ...currentDiary.breakfast,
                        ...currentDiary.lunch,
                        ...currentDiary.dinner,
                        ...currentDiary.snacks,
                      ];

                      // Remove each food item
                      for (const meal of allMeals) {
                        if (meal.id) {
                          try {
                            await removeFoodIntake(meal.id);
                          } catch (error) {
                            console.log('Error removing food:', error);
                          }
                        }
                      }
                      console.log('✅ Cleared all nutrition data for today');
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                  }
                ],
                { cancelable: true }
              );
            }}
            style={styles.changePlanButton}
            activeOpacity={0.6}
          >
            <Ionicons name="settings-outline" size={24} color="#B0B0B0" />
          </TouchableOpacity>
        </View>

        {/* Calorie Progress Bar */}
        <View style={styles.calorieCard}>
          <Text style={styles.calorieNumber}>{formatNumber(consumed)} {t('nutrition.cal')}</Text>
          <View style={styles.targetLabelContainer}>
            <Text style={styles.targetLabel}>
              {t('nutrition.target')}: {formatNumber(targetCalories)} {t('nutrition.cal')}
            </Text>
            {addBurnedToGoal && burnedCalories.total > 0 && (
              <Text style={styles.targetAdjusted}>
                ({formatNumber(baseTarget)} + {formatNumber(burnedCalories.total)})
              </Text>
            )}
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              {/* Background bar */}
              <View style={styles.progressBarBackground} />

              {/* Consumed progress - normal (within or up to target range) */}
              <Animated.View
                style={[
                  styles.consumedProgress,
                  { width: normalProgressAnim.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }) }
                ]}
              />

              {/* Consumed progress - overflow (exceeds target range) */}
              {isOverTarget && (
                <Animated.View
                  style={[
                    styles.overProgressBar,
                    {
                      left: `${((targetRangeEnd / Math.max(maxBarValue, 1)) * 100).toFixed(2)}%` as any,
                      width: overProgressAnim.interpolate({
                        inputRange: [0, 100],
                        outputRange: ['0%', '100%'],
                      })
                    }
                  ]}
                />
              )}

              {/* Target range - rendered on top so always visible */}
              <View
                style={[
                  styles.targetRange,
                  {
                    left: `${(((targetCalories - NUTRITION_CONSTANTS.TARGET_RANGE_BUFFER) / Math.max(maxBarValue, 1)) * 100).toFixed(2)}%` as any,
                    width: `${(((NUTRITION_CONSTANTS.TARGET_RANGE_BUFFER * 2) / Math.max(maxBarValue, 1)) * 100).toFixed(2)}%` as any
                  }
                ]}
              />

              {/* Target line (dotted) */}
              <View style={[styles.targetLine, { left: `${((targetCalories / Math.max(maxBarValue, 1)) * 100).toFixed(2)}%` as any }]} />
            </View>

            {/* Bar labels */}
            <View style={styles.barLabels}>
              <Text style={styles.barLabel}>0</Text>
              <Text style={styles.barLabel}>{formatNumber(targetCalories * NUTRITION_CONSTANTS.MAX_BAR_MULTIPLIER)}</Text>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendBox} />
            <Text style={styles.legendLabel}>{t('nutrition.targetRange')}</Text>
            <View style={styles.legendDottedLine} />
            <Text style={styles.legendValue}>
              {formatNumber(targetCalories - NUTRITION_CONSTANTS.TARGET_RANGE_BUFFER)}-{formatNumber(targetCalories + NUTRITION_CONSTANTS.TARGET_RANGE_BUFFER)} {t('nutrition.cal')}
            </Text>
          </View>

          {/* Compact info row - Expandable */}
          <TouchableOpacity
            style={styles.compactBalanceRow}
            onPress={() => {
              if (burnedCalories.total > 0) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowBurnedBreakdown(!showBurnedBreakdown);
              }
            }}
            activeOpacity={burnedCalories.total > 0 ? 0.7 : 1}
            disabled={burnedCalories.total === 0}
          >
            {burnedCalories.total > 0 && (
              <>
                <Text style={styles.compactBalanceLabel}>{t('nutrition.burned')}: </Text>
                <Text style={styles.compactBalanceBurned}>-{formatNumber(burnedCalories.total)} cal</Text>
                <Ionicons
                  name={showBurnedBreakdown ? "chevron-up" : "chevron-down"}
                  size={16}
                  color={BRAND_COLORS.accent}
                  style={{ marginLeft: 4, marginRight: 4 }}
                />
                <Text style={styles.compactBalanceSeparator}> • </Text>
              </>
            )}
            <Text style={styles.compactBalanceLabel}>{t('nutrition.remaining')}: </Text>
            <Text style={[styles.compactBalanceRemaining, remaining < 0 && styles.overBudget]}>
              {formatNumber(remaining)} cal
            </Text>
          </TouchableOpacity>

          {/* Burned Calories Breakdown - Expandable */}
          {showBurnedBreakdown && burnedCalories.total > 0 && (
            <View style={styles.burnedBreakdownInCard}>
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownItem}>
                  <Ionicons name="barbell" size={18} color={BRAND_COLORS.accent} />
                  <Text style={styles.breakdownLabel}>{t('nutrition.workouts')}</Text>
                </View>
                <Text style={styles.breakdownValue}>{formatNumber(burnedCalories.workouts)} cal</Text>
              </View>
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownItem}>
                  <Ionicons name="walk" size={18} color="#9C27B0" />
                  <Text style={styles.breakdownLabel}>{t('nutrition.steps')}</Text>
                </View>
                <Text style={styles.breakdownValue}>{formatNumber(burnedCalories.steps)} cal</Text>
              </View>
            </View>
          )}
        </View>

        {/* Nutrition Info Card with Pie Charts */}
        <NutritionInfoCard
          carbsConsumed={totals?.carbs || 0}
          fatConsumed={totals?.fat || 0}
          proteinConsumed={totals?.protein || 0}
          carbsTarget={targets?.carbs || NUTRITION_CONSTANTS.DEFAULT_TARGETS.carbs}
          fatTarget={targets?.fat || NUTRITION_CONSTANTS.DEFAULT_TARGETS.fat}
          proteinTarget={targets?.protein || NUTRITION_CONSTANTS.DEFAULT_TARGETS.protein}
        />

        {/* Empty State */}
        {!hasLoggedMeals && (
          <TouchableOpacity
            style={styles.emptyStateContainer}
            activeOpacity={0.7}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              logMealSectionRef.current?.measureLayout(
                scrollViewRef.current as any,
                (x, y) => {
                  scrollViewRef.current?.scrollTo({ y, animated: true });
                },
                () => {}
              );
            }}
          >
            <View style={styles.emptyStateIcon}>
              <Ionicons name="restaurant-outline" size={48} color={colors.textSecondary} />
            </View>
            <Text style={styles.emptyStateTitle}>No Meals Logged Yet</Text>
            <Text style={styles.emptyStateSubtitle}>
              Start tracking your nutrition by logging a meal below
            </Text>
            <View style={styles.emptyStateArrow}>
              <Ionicons name="arrow-down" size={24} color={colors.primaryAction} />
            </View>
          </TouchableOpacity>
        )}

        {/* Log Meal Section */}
        <View ref={logMealSectionRef} style={styles.logMealSection}>
          <View style={styles.mealContainer}>
            <Text style={styles.sectionTitle}>Log Meal</Text>

            {meals.map((meal, index) => (
              <React.Fragment key={meal.id}>
                <TouchableOpacity
                  style={styles.mealItem}
                  onPress={() => handleMealPress(meal)}
                  activeOpacity={0.7}
                >
                  {/* Calorie Circle */}
                  <View style={[
                    styles.mealCalorieCircle,
                    meal.calories >= 1000 && {
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                    }
                  ]}>
                    <Text style={styles.mealCalorieNumber}>{formatNumber(meal.calories)}</Text>
                    <Text style={styles.mealCalorieLabel}>{t('nutrition.cal')}</Text>
                  </View>

                  {/* Meal Name */}
                  <Text style={styles.mealName}>{meal.name}</Text>

                  {/* Plus Icon */}
                  <Ionicons name="add" size={28} color={BRAND_COLORS.accent} />
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

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
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
    color: colors.text,
    flex: 1,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  changePlanButton: {
    padding: 8,
  },
  calorieCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  calorieNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  targetLabelContainer: {
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  targetLabel: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  targetAdjusted: {
    fontSize: 12,
    color: BRAND_COLORS.accent,
    textAlign: 'center',
    marginTop: 2,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  targetRange: {
    position: 'absolute',
    height: '100%',
    backgroundColor: `${colors.success}33`,
  },
  targetLine: {
    position: 'absolute',
    width: 2,
    height: '100%',
    borderLeftWidth: 2,
    borderLeftColor: colors.success,
    borderStyle: 'dotted',
    marginLeft: -1,
  },
  consumedProgress: {
    position: 'absolute',
    height: '100%',
    backgroundColor: BRAND_COLORS.accent,
  },
  overProgressBar: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#FF5252',
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  legendRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 16,
    height: 16,
    backgroundColor: `${colors.success}33`,
    borderRadius: 4,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 14,
    color: colors.text,
  },
  legendDottedLine: {
    flex: 1,
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderStyle: 'dotted',
    marginHorizontal: 8,
    alignSelf: 'center',
  },
  legendValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: 'bold',
  },
  logMealSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  mealContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  mealSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 82,
    marginRight: 16,
  },
  mealCalorieCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.backgroundDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1.5,
    borderColor: `${colors.border}60`,
  },
  mealCalorieNumber: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  mealCalorieLabel: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  verticalSeparator: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  mealName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateIcon: {
    marginBottom: 12,
    opacity: 0.6,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 8,
  },
  emptyStateArrow: {
    marginTop: 4,
  },
  // Compact Balance Row
  compactBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  compactBalanceLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  compactBalanceBurned: {
    fontSize: 12,
    color: BRAND_COLORS.accent,
    fontWeight: '600',
  },
  compactBalanceSeparator: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  compactBalanceRemaining: {
    fontSize: 12,
    color: BRAND_COLORS.accent,
    fontWeight: '600',
  },
  overBudget: {
    color: '#FF5252',
  },
  // Burned Calories Breakdown (in card)
  burnedBreakdownInCard: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});

export default FoodDiaryScreenNew;
