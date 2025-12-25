import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Card } from 'react-native-paper';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTour } from '../../contexts/TourContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { CustomTourOverlay, TourStep } from '../../components/tour/CustomTourOverlay';
import { getSelectedMealPlan, getTodayMealProgress, clearTodayMealProgress } from '../../services/mealPlanService';
import { clearTodayMacros } from '../../services/macroTrackingService';
import firebaseDailyDataService from '../../services/firebaseDailyDataService';
import CustomHeader from '../../components/CustomHeader';
import { BRAND_COLORS } from '../../constants/brandColors';
import { generatePieChartColors } from '../../utils/colorUtils';

const { width } = Dimensions.get('window');

// Helper function to format numbers with commas
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const NutritionScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { isFirstVisit, markTourComplete } = useTour();
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [todayProgress, setTodayProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [trackedMeals, setTrackedMeals] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Generate dynamic pie chart colors
  const pieColors = React.useMemo(() => generatePieChartColors(BRAND_COLORS.accent), []);

  // Helper function to translate meal names
  const translateMealName = (mealName: string): string => {
    const mealNameLower = mealName.toLowerCase();
    if (mealNameLower.includes('breakfast')) return t('meals.breakfast');
    if (mealNameLower.includes('morning snack')) return t('meals.morningSnack');
    if (mealNameLower.includes('lunch')) return t('meals.lunch');
    if (mealNameLower.includes('afternoon snack')) return t('meals.afternoonSnack');
    if (mealNameLower.includes('dinner')) return t('meals.dinner');
    if (mealNameLower.includes('snack')) return t('meals.snack');
    return mealName; // Return original if no match
  };

  useFocusEffect(
    React.useCallback(() => {
      loadNutritionData();
      checkAndStartTour();
    }, [])
  );

  // Initialize tour - DISABLED
  const checkAndStartTour = async () => {
    return; // Tours disabled
  };

  // Tour steps
  const tourSteps: TourStep[] = [
    {
      id: 'calorie-tracker',
      title: t('tour.nutrition.step1Title'),
      description: t('tour.nutrition.step1Desc'),
      scrollToY: 200,
    },
    {
      id: 'meals',
      title: t('tour.nutrition.step2Title'),
      description: t('tour.nutrition.step2Desc'),
      scrollToY: 600,
    },
    {
      id: 'actions',
      title: t('tour.nutrition.step3Title'),
      description: t('tour.nutrition.step3Desc'),
      scrollToY: 1100,
    },
  ];

  const handleTourNext = () => {
    setTourStep(prev => prev + 1);
  };

  const handleTourPrevious = () => {
    setTourStep(prev => Math.max(0, prev - 1));
  };

  const handleTourSkip = () => {
    setShowTour(false);
    setTourStep(0);
  };

  const handleTourComplete = async () => {
    await markTourComplete('Nutrition');
    setShowTour(false);
    setTourStep(0);
  };

  const loadNutritionData = async () => {
    try {
      setLoading(true);
      const plan = await getSelectedMealPlan();

      if (plan && plan.totalCalories && plan.totalProtein && plan.totalCarbs && plan.totalFat) {
        setSelectedPlan(plan);

        // Get data from Firebase instead of SQLite
        if (user?.id) {
          try {
            const firebaseData = await firebaseDailyDataService.getTodayData(user.id);
            const consumed = {
              calories: firebaseData?.calories?.consumed || 0,
              protein: firebaseData?.protein?.consumed || 0,
              carbs: firebaseData?.carbs?.consumed || 0,
              fat: firebaseData?.fat?.consumed || 0
            };

            const remaining = {
              calories: Math.max(0, (plan.totalCalories || 0) - consumed.calories),
              protein: Math.max(0, (plan.totalProtein || 0) - consumed.protein),
              carbs: Math.max(0, (plan.totalCarbs || 0) - consumed.carbs),
              fat: Math.max(0, (plan.totalFat || 0) - consumed.fat)
            };

            const percentage = Math.round((consumed.calories / (plan.totalCalories || 1)) * 100);

            const progress = { consumed, remaining, percentage };
            console.log('Nutrition - Firebase Progress:', progress);
            setTodayProgress(progress);
          } catch (fbError) {
            console.log('Firebase error, falling back to SQLite:', fbError);
            // Fallback to SQLite if Firebase fails
            const progress = await getTodayMealProgress(plan.id, user?.id);
            setTodayProgress(progress);
          }
        } else {
          // No user, use SQLite
          const progress = await getTodayMealProgress(plan.id, user?.id);
          setTodayProgress(progress);
        }
      } else {
        setSelectedPlan(null);
        setTodayProgress(null);
      }
    } catch (error) {
      console.error('Failed to load nutrition data:', error);
      setSelectedPlan(null);
      setTodayProgress(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMealPress = (meal: any) => {
    if (!selectedPlan || !selectedPlan.id) {
      Alert.alert(t('nutrition.noPlanSelected'), t('nutrition.choosePlan'));
      return;
    }

    (navigation as any).navigate('MealDetail', {
      planId: selectedPlan.id,
      mealId: meal.id
    });
  };

  const handleBarcodeScan = async (foodData: any) => {
    if (foodData.manual) {
      // Navigate to manual food entry
      (navigation as any).navigate('FoodLog', {
        barcode: foodData.barcode,
        mealType: 'snack',
        date: new Date()
      });
    } else {
      // Add scanned food to today's log
      Alert.alert(
        t('nutrition.foodAdded'),
        `${foodData.name} has been added to your food diary`,
        [{ text: t('alert.ok') }]
      );
      await loadNutritionData();
    }
  };

  const handleResetToday = async () => {
    Alert.alert(
      t('nutrition.resetToday'),
      t('nutrition.resetConfirm'),
      [
        { text: t('alert.cancel'), style: 'cancel' },
        {
          text: t('alert.ok'),
          style: 'destructive',
          onPress: async () => {
            try {
              const today = format(new Date(), 'yyyy-MM-dd');
              // Clear from database
              await clearTodayMacros(user?.id);
              // Clear meal progress from AsyncStorage
              await clearTodayMealProgress(today);
              // Reload the data
              await loadNutritionData();
              Alert.alert(t('alert.success'), t('nutrition.resetSuccess'));
            } catch (error) {
              console.error('Reset error:', error);
              Alert.alert(t('alert.error'), t('nutrition.resetError'));
            }
          }
        }
      ]
    );
  };

  const renderNoPlanSelected = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="food-off" size={80} color="#DDD" />
      <Text style={styles.emptyTitle}>{t('nutrition.noPlanSelected')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('nutrition.choosePlan')}
      </Text>
      <TouchableOpacity
        style={styles.selectPlanButton}
        onPress={() => (navigation as any).navigate('MealPlanSelection')}
      >
        <MaterialCommunityIcons name="plus-circle" size={24} color="white" />
        <Text style={styles.selectPlanButtonText}>{t('nutrition.selectMealPlan')}</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: '#2A2A2A' }]}>
        <ActivityIndicator size="large" color={BRAND_COLORS.accentLight} />
        <Text style={[styles.loadingText, { color: '#F4F1EF' }]}>{t('nutrition.loading')}</Text>
      </View>
    );
  }

  if (!selectedPlan || !selectedPlan.totalCalories) {
    return (
      <View style={[styles.container, { backgroundColor: '#2A2A2A' }]}>
        <CustomHeader />
        <View style={{ flex: 1 }}>
          {renderNoPlanSelected()}
        </View>
      </View>
    );
  }

  const caloriesPercentage = todayProgress && selectedPlan?.totalCalories && selectedPlan.totalCalories > 0
    ? Math.min((todayProgress.consumed.calories / selectedPlan.totalCalories) * 100, 100)
    : 0;

  return (
    <View style={[styles.container, { backgroundColor: '#2A2A2A' }]}>
      <CustomHeader />

      <View style={{ flex: 1 }}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}>
          <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: '#F4F1EF' }]}>{t('nutrition.mealPlan')}</Text>
        </View>

        {/* Daily Progress Section */}
        <View style={[styles.dailySection, {
          borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#F0F0F0',
        }]}>
          <View style={styles.dailyHeader}>
            <Text style={[styles.dailyTitle, { color: '#F4F1EF' }]}>{t('nutrition.todaysProgress')}</Text>
            <View style={[styles.remainingBadge, { backgroundColor: BRAND_COLORS.accent }]}>
              <Text style={[styles.remainingText, { color: '#FFFFFF' }]}>
                {formatNumber(todayProgress?.remaining.calories || selectedPlan?.totalCalories || 0)} {t('nutrition.calLeft')}
              </Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.calorieCircleContainer}>
              <Svg width={120} height={120} style={{ position: 'absolute' }}>
                {/* Background ring */}
                <Circle
                  cx={60}
                  cy={60}
                  r={50}
                  stroke={`${BRAND_COLORS.accentLight}26`}
                  strokeWidth={16}
                  fill="none"
                />
                {/* Progress ring - only fills around the edge */}
                <Circle
                  cx={60}
                  cy={60}
                  r={50}
                  stroke={caloriesPercentage > 100 ? '#FF4444' : BRAND_COLORS.accentLight}
                  strokeWidth={16}
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 50}`}
                  strokeDashoffset={`${2 * Math.PI * 50 * (1 - Math.min(caloriesPercentage / 100, 1))}`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
              </Svg>
              <View style={styles.circleContent}>
                <MaterialCommunityIcons
                  name="fire"
                  size={32}
                  color={BRAND_COLORS.accentLight}
                  style={{ marginBottom: 4 }}
                />
                <Text style={[styles.consumedCalories, { color: '#F4F1EF' }]}>
                  {formatNumber(todayProgress?.consumed.calories || 0)}
                </Text>
                <Text style={[styles.caloriesLabel, { color: '#C5C2BF' }]}>{t('nutrition.calories')}</Text>
              </View>
            </View>

            <View style={styles.macrosContainer}>
              <View style={styles.macroItem}>
                <View style={[styles.macroIcon, { backgroundColor: 'rgba(66, 133, 244, 0.15)' }]}>
                  <MaterialCommunityIcons name="arm-flex" size={20} color="#3B82F6" />
                </View>
                <Text style={[styles.macroValue, { color: '#F4F1EF' }]}>
                  {todayProgress?.consumed.protein || 0}g
                </Text>
                <Text style={[styles.macroTarget, { color: '#C5C2BF' }]}>/ {selectedPlan?.totalProtein || 0}g</Text>
                <Text style={[styles.macroLabel, { color: '#C5C2BF' }]}>{t('nutrition.protein')}</Text>
                <View style={styles.macroProgress}>
                  <View
                    style={[
                      styles.macroProgressFill,
                      {
                        width: `${(selectedPlan?.totalProtein || 0) > 0 ? Math.min(
                          ((todayProgress?.consumed.protein || 0) / (selectedPlan?.totalProtein || 1)) * 100,
                          100
                        ) : 0}%`,
                        backgroundColor: '#3B82F6',
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.macroItem}>
                <View style={[styles.macroIcon, { backgroundColor: `${BRAND_COLORS.accentLight}26` }]}>
                  <MaterialCommunityIcons name="grain" size={20} color={BRAND_COLORS.accentLight} />
                </View>
                <Text style={[styles.macroValue, { color: '#F4F1EF' }]}>
                  {todayProgress?.consumed.carbs || 0}g
                </Text>
                <Text style={[styles.macroTarget, { color: '#C5C2BF' }]}>/ {selectedPlan?.totalCarbs || 0}g</Text>
                <Text style={[styles.macroLabel, { color: '#C5C2BF' }]}>{t('nutrition.carbs')}</Text>
                <View style={styles.macroProgress}>
                  <View
                    style={[
                      styles.macroProgressFill,
                      {
                        width: `${(selectedPlan?.totalCarbs || 0) > 0 ? Math.min(
                          ((todayProgress?.consumed.carbs || 0) / (selectedPlan?.totalCarbs || 1)) * 100,
                          100
                        ) : 0}%`,
                        backgroundColor: BRAND_COLORS.accentLight,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.macroItem}>
                <View style={[styles.macroIcon, { backgroundColor: '#E8FFE8' }]}>
                  <Ionicons name="water" size={20} color="#66BB6A" />
                </View>
                <Text style={[styles.macroValue, { color: '#F4F1EF' }]}>
                  {todayProgress?.consumed.fat || 0}g
                </Text>
                <Text style={[styles.macroTarget, { color: '#C5C2BF' }]}>/ {selectedPlan?.totalFat || 0}g</Text>
                <Text style={[styles.macroLabel, { color: '#C5C2BF' }]}>{t('nutrition.fat')}</Text>
                <View style={styles.macroProgress}>
                  <View
                    style={[
                      styles.macroProgressFill,
                      {
                        width: `${(selectedPlan?.totalFat || 0) > 0 ? Math.min(
                          ((todayProgress?.consumed.fat || 0) / (selectedPlan?.totalFat || 1)) * 100,
                          100
                        ) : 0}%`,
                        backgroundColor: '#3B82F6',
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Day/Week Toggle and Date Navigation */}
        <View style={styles.controlsSection}>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'day' && styles.toggleButtonActive,
                { backgroundColor: viewMode === 'day' ? colors.text : isDark ? '#4E4E50' : '#E5E5E5' }
              ]}
              onPress={() => setViewMode('day')}
            >
              <Text style={[
                styles.toggleButtonText,
                { color: viewMode === 'day' ? colors.background : colors.text }
              ]}>{t('nutrition.day')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'week' && styles.toggleButtonActive,
                { backgroundColor: viewMode === 'week' ? colors.text : isDark ? '#4E4E50' : '#E5E5E5' }
              ]}
              onPress={() => setViewMode('week')}
            >
              <Text style={[
                styles.toggleButtonText,
                { color: viewMode === 'week' ? colors.background : colors.text }
              ]}>{t('nutrition.week')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateNavigation}>
            <TouchableOpacity onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() - 1);
              setSelectedDate(newDate);
            }}>
              <MaterialCommunityIcons name="chevron-left" size={28} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.dateText, { color: '#F4F1EF' }]}>
              {format(selectedDate, 'MMMM d, yyyy') === format(new Date(), 'MMMM d, yyyy')
                ? t('nutrition.today') + ', ' + format(selectedDate, 'MMM d')
                : format(selectedDate, 'MMM d, yyyy')}
            </Text>
            <TouchableOpacity onPress={() => {
              const newDate = new Date(selectedDate);
              newDate.setDate(newDate.getDate() + 1);
              setSelectedDate(newDate);
            }}>
              <MaterialCommunityIcons name="chevron-right" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Card with Pie Chart */}
        <TouchableOpacity
          style={[styles.summaryCard, { backgroundColor: isDark ? '#4E4E50' : '#F5F5F5' }]}
          onPress={() => (navigation as any).navigate('MealPlanSelection')}
        >
          <View style={styles.pieChartContainer}>
            <Svg width={60} height={60}>
              {/* Pie chart segments */}
              <Circle cx={30} cy={30} r={25} fill={pieColors.carbs} />
              <Circle
                cx={30}
                cy={30}
                r={25}
                fill="transparent"
                stroke={pieColors.protein}
                strokeWidth={50}
                strokeDasharray={`${Math.PI * 50 * 0.3} ${Math.PI * 50 * 0.7}`}
                transform="rotate(-90 30 30)"
              />
              <Circle
                cx={30}
                cy={30}
                r={25}
                fill="transparent"
                stroke={pieColors.fat}
                strokeWidth={50}
                strokeDasharray={`${Math.PI * 50 * 0.25} ${Math.PI * 50 * 0.75}`}
                transform="rotate(18 30 30)"
              />
            </Svg>
          </View>
          <View style={styles.summaryInfo}>
            <Text style={[styles.summaryCalories, { color: '#F4F1EF' }]}>
              {formatNumber(selectedPlan?.totalCalories || 0)} {t('nutrition.calories')}
            </Text>
            <Text style={[styles.summaryMacros, { color: '#C5C2BF' }]}>
              {selectedPlan?.totalCarbs || 0}g {t('nutrition.carbs')}, {selectedPlan?.totalFat || 0}g {t('nutrition.fat')}, {selectedPlan?.totalProtein || 0}g {t('nutrition.protein')}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { backgroundColor: isDark ? '#4E4E50' : '#E5E5E5' }]}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${caloriesPercentage}%`,
                  backgroundColor: caloriesPercentage > 100 ? '#FF4444' : BRAND_COLORS.accent
                }
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: '#C5C2BF' }]}>
            {t('nutrition.tracked')} {trackedMeals}/{selectedPlan.meals?.length || 0} {t('nutrition.meals')}
          </Text>
        </View>

        {/* Timeline Meals Section */}
        <View style={styles.timelineSection}>
          {selectedPlan.meals && Array.isArray(selectedPlan.meals) && selectedPlan.meals.map((meal: any, mealIndex: number) => (
          <View key={meal.id} style={styles.timelineMeal}>
            {/* Timeline dot and line */}
            <View style={styles.timelineIndicator}>
              <View style={[
                styles.timelineDot,
                {
                  backgroundColor: trackedMeals > mealIndex ? BRAND_COLORS.accent : isDark ? '#4E4E50' : '#D1D1D6',
                  borderColor: trackedMeals > mealIndex ? BRAND_COLORS.accent : isDark ? '#4E4E50' : '#D1D1D6'
                }
              ]} />
              {mealIndex < selectedPlan.meals.length - 1 && (
                <View style={[styles.timelineLine, { backgroundColor: isDark ? '#4E4E50' : '#D1D1D6' }]} />
              )}
            </View>

            {/* Meal Content */}
            <View style={styles.mealContent}>
              <View style={styles.mealHeaderNew}>
                <View>
                  <Text style={[styles.mealNameNew, { color: '#F4F1EF' }]}>{translateMealName(meal.name)}</Text>
                  <Text style={[styles.mealCaloriesNew, { color: '#C5C2BF' }]}>
                    {formatNumber(meal.calories)} {t('nutrition.calories')}
                  </Text>
                </View>
                <TouchableOpacity>
                  <MaterialCommunityIcons name="dots-vertical" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Food Items */}
              {meal.foods && meal.foods.slice(0, 2).map((food: any, foodIndex: number) => (
                <TouchableOpacity
                  key={foodIndex}
                  style={[styles.foodItem, { backgroundColor: isDark ? '#4E4E50' : '#FFFFFF' }]}
                  onPress={() => handleMealPress(meal)}
                >
                  <View style={styles.foodImagePlaceholder}>
                    <MaterialCommunityIcons name="food-apple" size={32} color={BRAND_COLORS.accentLight} />
                  </View>
                  <View style={styles.foodDetails}>
                    <Text style={[styles.foodName, { color: '#F4F1EF' }]}>{food.name}</Text>
                    <Text style={[styles.foodServing, { color: '#C5C2BF' }]}>
                      {food.serving} • {formatNumber(food.calories)} {t('nutrition.calories')}
                    </Text>
                  </View>
                  <TouchableOpacity>
                    <MaterialCommunityIcons name="dots-vertical" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        </View>

        {/* Quick Actions - New Design */}
        <View style={styles.quickActionsNew}>
          <Text style={[styles.sectionTitle, { color: '#F4F1EF', marginBottom: 15 }]}>{t('nutrition.quickActions')}</Text>

        {/* Main Action Buttons */}
        <View style={styles.mainActionsRow}>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => (navigation as any).navigate('FoodSearch')}
          >
            <View style={styles.actionIconCircle}>
              <MaterialCommunityIcons name="magnify" size={28} color="#FFF" />
            </View>
            <Text style={styles.primaryActionText}>{t('nutrition.searchFoods')}</Text>
            <Text style={styles.primaryActionSubtext}>{t('nutrition.database')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.primaryActionButton, { backgroundColor: '#3B82F6' }]}
            onPress={() => (navigation as any).navigate('FoodDiary')}
          >
            <View style={[styles.actionIconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <MaterialCommunityIcons name="book-open-variant" size={28} color="#FFF" />
            </View>
            <Text style={styles.primaryActionText}>{t('nutrition.foodDiary')}</Text>
            <Text style={styles.primaryActionSubtext}>{t('nutrition.viewLogs')}</Text>
          </TouchableOpacity>
        </View>

        {/* Secondary Actions */}
        <TouchableOpacity
          style={[styles.secondaryActionButton, { borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0' }]}
          onPress={() => (navigation as any).navigate('AINutritionAdvisor')}
        >
          <Ionicons name="sparkles" size={20} color={BRAND_COLORS.accent} />
          <Text style={[styles.secondaryActionText, { color: '#F4F1EF' }]}>AI Nutrition Advisor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryActionButton, { borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E0E0E0' }]}
          onPress={handleResetToday}
        >
          <MaterialCommunityIcons name="delete-sweep" size={20} color="#F44336" />
          <Text style={[styles.secondaryActionText, { color: '#F4F1EF' }]}>{t('nutrition.resetToday')}</Text>
        </TouchableOpacity>
        </View>
        </ScrollView>
      </View>

      {/* Custom Tour Overlay */}
      <CustomTourOverlay
        visible={showTour}
        steps={tourSteps}
        currentStep={tourStep}
        onNext={handleTourNext}
        onPrevious={handleTourPrevious}
        onSkip={handleTourSkip}
        onComplete={handleTourComplete}
        scrollViewRef={scrollViewRef}
      />

      {/* Barcode Scanner Modal */}
      {/* <BarcodeScanner
        visible={showBarcodeScanner}
        onClose={() => setShowBarcodeScanner(false)}
        onScan={handleBarcodeScan}
      /> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  actionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  actionsButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: BRAND_COLORS.accent,
    borderRadius: 16,
    gap: 4,
  },
  addFoodButtonText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  changePlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'transparent',
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: BRAND_COLORS.accentLight,
  },
  changePlanText: {
    fontSize: 14,
    color: BRAND_COLORS.accentLight,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  selectPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND_COLORS.accentLight,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  selectPlanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dailySection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dailyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dailyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  remainingBadge: {
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  remainingText: {
    fontSize: 12,
    color: BRAND_COLORS.accentLight,
    fontWeight: '600',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 30,
  },
  calorieCircleContainer: {
    width: 120,
    height: 120,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieCircleOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'transparent',
    overflow: 'hidden',
    position: 'absolute',
    borderWidth: 2,
  },
  calorieCircleInner: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: BRAND_COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 10,
  },
  calorieIcon: {
    opacity: 0.9,
  },
  circleContent: {
    alignItems: 'center',
    zIndex: 1,
  },
  consumedCalories: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: -4,
  },
  targetCalories: {
    fontSize: 12,
    color: '#666',
  },
  caloriesLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  macrosContainer: {
    flex: 1,
    gap: 12,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  macroIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  macroTarget: {
    fontSize: 12,
    color: '#666',
  },
  macroLabel: {
    fontSize: 12,
    color: '#999',
    marginLeft: 'auto',
  },
  macroProgress: {
    position: 'absolute',
    bottom: -2,
    left: 40,
    right: 0,
    height: 2,
    backgroundColor: '#F0F0F0',
    borderRadius: 1,
  },
  macroProgressFill: {
    height: '100%',
    borderRadius: 1,
  },
  mealsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  mealCard: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  mealTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  mealCalories: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mealCaloriesText: {
    fontSize: 13,
    color: BRAND_COLORS.accent,
    fontWeight: '500',
  },
  mealMacros: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  mealMacroItem: {
    flex: 1,
    alignItems: 'center',
  },
  mealMacroLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 2,
  },
  mealMacroValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  mealMacroDivider: {
    width: 1,
    backgroundColor: '#F0F0F0',
  },
  mealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  mealFoodCount: {
    fontSize: 12,
    color: '#666',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  // New styles for improved buttons
  quickActionsNew: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginTop: 10,
  },
  mainActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: BRAND_COLORS.accentLight,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  primaryActionSubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // New styles for timeline design
  controlsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 4,
    alignSelf: 'flex-start',
  },
  toggleButton: {
    paddingHorizontal: 32,
    paddingVertical: 8,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  toggleButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    minWidth: 180,
    textAlign: 'center',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
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
    marginBottom: 4,
  },
  summaryMacros: {
    fontSize: 13,
    lineHeight: 18,
  },
  progressBarContainer: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  timelineSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  timelineMeal: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: 16,
    paddingTop: 4,
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    marginBottom: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 60,
  },
  mealContent: {
    flex: 1,
  },
  mealHeaderNew: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  mealNameNew: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mealCaloriesNew: {
    fontSize: 14,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  foodImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#FFF5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodDetails: {
    flex: 1,
  },
  foodName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  foodServing: {
    fontSize: 13,
  },
});

export default NutritionScreen;