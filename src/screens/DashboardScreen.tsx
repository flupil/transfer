import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Image,
  Modal,
  FlatList,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Card, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LineChart } from 'react-native-chart-kit';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNutrition } from '../contexts/NutritionContext';
import { useTour } from '../contexts/TourContext';
import { useFocusEffect } from '@react-navigation/native';
import { CustomTourOverlay, TourStep } from '../components/tour/CustomTourOverlay';
import { getSafeDatabase } from '../database/databaseHelper';
import { format } from 'date-fns';
import SimpleHealthTracking from '../components/SimpleHealthTracking';
import { getTodayMacros, quickAddMacro, getFoodDatabase } from '../services/macroTrackingService';
import { waterTrackingService } from '../services/waterTrackingService';
import { workoutService } from '../services/workoutService';
import { getSelectedWorkoutPlan } from '../services/workoutPlanService';
import { getSelectedMealPlan } from '../services/mealPlanService';
import { getStreakData, getUserLevel } from '../services/progressTrackingService';
import FriendStreakCard from '../components/FriendStreakCard';
import { getFriends } from '../services/friendStreakService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseDailyDataService from '../services/firebaseDailyDataService';
import { ErrorBoundary } from '../components/ErrorBoundary';
import CustomRefreshControl from '../components/CustomRefreshControl';
import { logger } from '../utils/logger';

const { width } = Dimensions.get('window');

const DashboardScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const nutrition = useNutrition();
  const { isFirstVisit, markTourComplete } = useTour();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingNutrition, setLoadingNutrition] = useState(true);
  const [loadingWorkout, setLoadingWorkout] = useState(true);
  const [loadingStreak, setLoadingStreak] = useState(true);
  const [pullDistance, setPullDistance] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Error states
  const [nutritionError, setNutritionError] = useState<string | null>(null);
  const [workoutError, setWorkoutError] = useState<string | null>(null);
  const [streakError, setStreakError] = useState<string | null>(null);

  // Animation states for collapsing header
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = useRef(new Animated.Value(120)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;

  // Nutrition data
  const [calories, setCalories] = useState({ consumed: 0, target: 2000 });
  const [protein, setProtein] = useState({ consumed: 0, target: 150 });
  const [carbs, setCarbs] = useState({ consumed: 0, target: 250 });
  const [fat, setFat] = useState({ consumed: 0, target: 65 });
  const [water, setWater] = useState(0);
  const [targets, setTargets] = useState<any>({ calories: 2000, protein: 150, carbs: 200, fat: 67 });

  // Food modal state
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [foodDatabase] = useState(getFoodDatabase());
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('snack');

  // Workout data
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [selectedWorkoutPlan, setSelectedWorkoutPlan] = useState<any>(null);

  // Progress data
  const [bmi, setBmi] = useState({ value: 28.0, change: -3.5 });
  const [weight, setWeight] = useState({ current: 85.7, change: -10.8 });
  const [bodyFatPercent, setBodyFatPercent] = useState({ value: 0, change: 0.0 });
  const [steps, setSteps] = useState(0);
  const [weeklyWorkouts, setWeeklyWorkouts] = useState(1);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);
  const [showFriendStreak, setShowFriendStreak] = useState(false);
  const [friendsData, setFriendsData] = useState<any[]>([]);
  const [hasWorkedOutToday, setHasWorkedOutToday] = useState(false);

  // Celebration state
  const [celebrationShown, setCelebrationShown] = useState<Set<string>>(new Set());

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Weight chart data
  const [weightData, setWeightData] = useState({
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [{
      data: [96.5, 95.8, 95.2, 94.8, 94.5, 94.0, 93.4]
    }]
  });

  useEffect(() => {
    if (user?.id) {
      waterTrackingService.setUserId(user.id);
      workoutService.setUserId(user.id);
      loadData();
    }

    // Cleanup debounce timer on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [user?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDashboardData(), // Load from Firebase (includes targets from AsyncStorage)
        loadWorkoutData(),
        loadStreakData()
      ]);
    } finally {
      setLoading(false);
      // Check and start tour after loading completes
      checkAndStartTour();
    }
  };

  // Tour functions
  const checkAndStartTour = async () => {
    try {
      const hasSeenTour = await isFirstVisit('Dashboard');
      if (hasSeenTour) {
        setShowTour(true);
      }
    } catch (error) {
      logger.error('Tour init error:', error);
    }
  };

  const tourSteps: TourStep[] = [
    {
      id: 'calories',
      title: t('tour.dashboard.step1'),
      description: t('tour.dashboard.step1Desc'),
      scrollToY: 0,
      highlightArea: { x: 20, y: 180, width: width - 40, height: 280, borderRadius: 16 },
    },
    {
      id: 'nextMeal',
      title: t('tour.dashboard.step2'),
      description: t('tour.dashboard.step2Desc'),
      scrollToY: 0,
      highlightArea: { x: 20, y: 480, width: (width - 50) / 2, height: 120, borderRadius: 12 },
    },
    {
      id: 'nextWorkout',
      title: t('tour.dashboard.step3'),
      description: t('tour.dashboard.step3Desc'),
      scrollToY: 0,
      highlightArea: { x: (width / 2) + 5, y: 480, width: (width - 50) / 2, height: 120, borderRadius: 12 },
    },
  ];

  const handleTourNext = () => setTourStep(prev => prev + 1);
  const handleTourPrevious = () => setTourStep(prev => Math.max(0, prev - 1));
  const handleTourSkip = () => {
    setShowTour(false);
    setTourStep(0);
  };
  const handleTourComplete = async () => {
    await markTourComplete('Dashboard');
    setShowTour(false);
    setTourStep(0);
  };

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadData();
      }
    }, [user?.id])
  );

  const loadNutritionTargets = async () => {
    try {
      const nutritionDataKey = `nutrition_data_${user?.id}`;
      const dataStr = await AsyncStorage.getItem(nutritionDataKey);

      if (dataStr) {
        const data = JSON.parse(dataStr);
        if (data.targets) {
          setTargets(data.targets);
          // Also set the target values in state
          setCalories(prev => ({ ...prev, target: data.targets.calories }));
          setProtein(prev => ({ ...prev, target: data.targets.protein }));
          setCarbs(prev => ({ ...prev, target: data.targets.carbs }));
          setFat(prev => ({ ...prev, target: data.targets.fat }));
          logger.log('Home tab loaded targets:', data.targets);
        }
      }
    } catch (error) {
      logger.error('Error loading nutrition targets:', error);
    }
  };

  const loadStreakData = async () => {
    setLoadingStreak(true);
    setStreakError(null);
    try {
      // Load streak data from service (same as CustomHeader)
      const streakData = await getStreakData();
      logger.debug('🔥', 'DashboardScreen streak data:', streakData);
      setCurrentStreak(streakData.workoutStreak || 0);

      const lastWorkoutDate = streakData.lastWorkoutDate ? new Date(streakData.lastWorkoutDate).toDateString() : null;
      const todayDate = new Date().toDateString();
      const workedOutToday = !!streakData.lastWorkoutDate && lastWorkoutDate === todayDate;

      logger.debug('🔥', 'DashboardScreen lastWorkoutDate:', lastWorkoutDate);
      logger.debug('🔥', 'DashboardScreen todayDate:', todayDate);
      logger.debug('🔥', 'DashboardScreen workedOutToday (from service):', workedOutToday);

      setHasWorkedOutToday(workedOutToday);

      // Also check completed workouts from AsyncStorage (same as CustomHeader)
      const stored = await AsyncStorage.getItem('completedWorkouts');
      logger.debug('🔥', 'DashboardScreen completedWorkouts:', stored);
      if (stored) {
        const completedArray = JSON.parse(stored);
        const today = new Date();
        const todayKey = `1-${today.getDay() === 0 ? 6 : today.getDay() - 1}`;

        logger.debug('🔥', 'DashboardScreen todayKey:', todayKey);
        logger.debug('🔥', 'DashboardScreen completedArray:', completedArray);
        logger.debug('🔥', 'DashboardScreen includes todayKey:', completedArray.includes(todayKey));

        if (completedArray.includes(todayKey)) {
          logger.debug('🔥', 'DashboardScreen Setting hasWorkedOutToday to TRUE from AsyncStorage');
          setHasWorkedOutToday(true);
        }
      }

      // Try to load level data
      try {
        const levelData = await getUserLevel();
        if (levelData) {
          setUserLevel(levelData.level);
          setUserXP(levelData.experience);
        }
      } catch (e) {
        // Use defaults
        setUserLevel(1);
        setUserXP(110);
      }

      // Load friends data
      try {
        const friends = await getFriends();
        setFriendsData(friends);
      } catch (e) {
        setFriendsData([]);
      }
    } catch (error) {
      logger.error('Error loading streak data:', error);
      setStreakError(t('error.loadStreakData'));
      // Set defaults
      setCurrentStreak(0);
      setUserLevel(1);
      setUserXP(110);
    } finally {
      setLoadingStreak(false);
    }
  };

  const loadWorkoutData = async () => {
    setLoadingWorkout(true);
    setWorkoutError(null);
    try {
      const plan = await getSelectedWorkoutPlan();
      if (plan) {
        setSelectedWorkoutPlan(plan);
        // Get today's workout (simplified logic - in real app you'd track actual day)
        const dayOfWeek = new Date().getDay();
        const workoutDays = plan.workouts.filter((w: any) => w.exercises.length > 0);
        if (workoutDays.length > 0) {
          const todayWorkoutIndex = dayOfWeek % workoutDays.length;
          setTodayWorkout(workoutDays[todayWorkoutIndex]);
        }
      }

      // Check if user has worked out today
      if (user?.id) {
        const today = new Date().toDateString();
        const workoutHistory = await workoutService.getWorkoutHistory(user.id, 1);
        if (workoutHistory.length > 0) {
          const lastWorkout = new Date(workoutHistory[0].date).toDateString();
          setHasWorkedOutToday(lastWorkout === today);
        }
      }
    } catch (error) {
      logger.error('Failed to load workout data:', error);
      setWorkoutError(t('error.loadWorkoutData'));
    } finally {
      setLoadingWorkout(false);
    }
  };

  const loadMacroData = async () => {
    // This function is now deprecated - we use loadDashboardData instead
    // Keep it empty to avoid conflicts
    logger.log('loadMacroData called - using Firebase data from loadDashboardData instead');
  };

  const loadDashboardData = async () => {
    if (!user?.id) {
      logger.log('No user ID for loading dashboard data');
      return;
    }

    setLoadingNutrition(true);
    setNutritionError(null);
    try {
      logger.log('Loading dashboard data from Firebase for user:', user.id);
      // Load today's data from Firebase (now includes correct targets from AsyncStorage)
      const todayData = await firebaseDailyDataService.getTodayData(user.id);
      logger.log('Firebase data:', todayData.calories);

      // Set nutrition data with consumed and target values from Firebase
      setCalories({
        consumed: todayData.calories.consumed,
        target: todayData.calories.target
      });
      setProtein({
        consumed: todayData.protein.consumed,
        target: todayData.protein.target
      });
      setCarbs({
        consumed: todayData.carbs.consumed,
        target: todayData.carbs.target
      });
      setFat({
        consumed: todayData.fat.consumed,
        target: todayData.fat.target
      });
      setTargets({
        calories: todayData.calories.target,
        protein: todayData.protein.target,
        carbs: todayData.carbs.target,
        fat: todayData.fat.target
      });
      setWater(todayData.water.consumed * 250); // Convert glasses to ml
      setSteps(todayData.steps.count);

      logger.log('Dashboard state updated - Calories:', todayData.calories.consumed, '/', todayData.calories.target);

      // Check for goal achievements and celebrate
      checkGoalAchievements(todayData);

      // Set sleep if available
      if (todayData.sleep.hours > 0) {
        // Sleep data exists
      }

      // Load weekly data for charts
      const weeklyData = await firebaseDailyDataService.getWeeklyData(user.id);
      if (weeklyData.length > 0) {
        // Update weight chart with real data
        const labels = weeklyData.map(d => {
          const date = new Date(d.date);
          return date.toLocaleDateString('en-US', { weekday: 'short' });
        }).reverse();

        const weights = weeklyData.map(d => d.weight || 0).reverse();

        if (weights.some(w => w > 0)) {
          setWeightData({
            labels,
            datasets: [{ data: weights }]
          });
        }
      }
    } catch (error) {
      logger.error('Error loading dashboard data from Firebase:', error);
      setNutritionError(t('error.loadNutritionData'));
    } finally {
      setLoadingNutrition(false);
    }

    // REMOVED SQLite loading - we only use Firebase now
    // The SQLite data was overwriting the Firebase data!
  };

  // Debounced version of loadDashboardData to prevent duplicate rapid-fire calls
  const loadDashboardDataDebounced = () => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set a new timer to call loadDashboardData after 400ms
    debounceTimerRef.current = setTimeout(() => {
      loadDashboardData();
    }, 400);
  };

  // Check goal achievements and show celebrations
  const checkGoalAchievements = async (data: any) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const achievements: string[] = [];

    // Check calorie goal
    if (data.calories.consumed >= data.calories.target &&
        !celebrationShown.has(`calories-${today}`)) {
      achievements.push('🎯 ' + t('dashboard.calorieGoalReached'));
      celebrationShown.add(`calories-${today}`);
    }

    // Check protein goal
    if (data.protein.consumed >= data.protein.target &&
        !celebrationShown.has(`protein-${today}`)) {
      achievements.push('💪 ' + t('dashboard.proteinGoalReached'));
      celebrationShown.add(`protein-${today}`);
    }

    // Check carbs goal
    if (data.carbs.consumed >= data.carbs.target &&
        !celebrationShown.has(`carbs-${today}`)) {
      achievements.push('🌾 ' + t('dashboard.carbsGoalReached'));
      celebrationShown.add(`carbs-${today}`);
    }

    // Check fat goal
    if (data.fat.consumed >= data.fat.target &&
        !celebrationShown.has(`fat-${today}`)) {
      achievements.push('🥑 ' + t('dashboard.fatGoalReached'));
      celebrationShown.add(`fat-${today}`);
    }

    // Show celebration if any achievements
    if (achievements.length > 0) {
      // Success haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        '🎉 ' + t('dashboard.goalsAchieved'),
        achievements.join('\n') + '\n\n' + t('dashboard.greatJobTracking'),
        [{ text: t('dashboard.awesome'), style: 'default' }]
      );

      setCelebrationShown(new Set(celebrationShown));
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadData();
    } catch (error) {
      logger.log('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const addWater = async () => {
    try {
      // Haptic feedback on water addition
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Update local state immediately for responsive UI
      setWater(water + 250);

      // Use NutritionContext as single entry point (consolidation)
      await nutrition.addWater(250); // Add 250ml (1 glass)

      // Use debounced reload to prevent multiple rapid calls
      loadDashboardDataDebounced();
    } catch (error) {
      logger.error('Failed to add water:', error);
      // Error alert is already handled by NutritionContext
    }
  };

  const handleQuickAddFood = async (foodName: string) => {
    try {
      const result = await quickAddMacro(foodName, selectedMeal);
      if (result) {
        await loadMacroData(); // Refresh macro data
        Alert.alert(t('alert.success'), t('dashboard.addedFood', { foodName, meal: selectedMeal }));
        setShowFoodModal(false);
      }
    } catch (error) {
      Alert.alert(t('alert.error'), t('dashboard.addFailed'));
    }
  };

  const openFoodModal = (meal: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    navigation.navigate('Nutrition' as never);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#1A1A1A' }]}>
      {/* Custom Refresh Indicator with Logo */}
      {(refreshing || pullDistance > 0) && (
        <Animated.View
          style={[
            styles.customRefreshContainer,
            {
              transform: [
                {
                  translateY: refreshing ? 130 : Math.min(70 + pullDistance, 130),
                }
              ]
            }
          ]}
        >
          <CustomRefreshControl refreshing={refreshing} size={60} color="#FF6B35" />
        </Animated.View>
      )}

      {/* Collapsible Header with Logo - Bar Hides but Icons Stay */}
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            height: 120,
          }
        ]}
        pointerEvents="box-none"
      >
        {/* Background that shrinks in height */}
        <Animated.View
          style={[
            styles.headerBackground,
            {
              backgroundColor: '#000',
              height: scrollY.interpolate({
                inputRange: [0, 120],
                outputRange: [120, 100],
                extrapolate: 'clamp',
              })
            }
          ]}
          pointerEvents="none"
        />

        {/* Icons stay in place */}
        <View style={styles.duolingoTopBar}>
        {/* Left Side - Streak and Workout Icon */}
        <View style={[styles.topBarLeft, { marginTop: 15 }]}>
          <TouchableOpacity
            style={styles.duolingoItem}
            onPress={() => navigation.navigate('Streak' as never)}
            activeOpacity={0.7}
            accessibilityLabel={`Workout streak: ${currentStreak} days`}
          >
            <MaterialCommunityIcons
              name="fire"
              size={30}
              color={hasWorkedOutToday ? "#FF6B35" : "#999999"}
            />
            <Text style={[
              styles.duolingoItemText,
              { color: hasWorkedOutToday ? colors.text : '#999999' }
            ]}>
              {currentStreak}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.workoutIcon}
            onPress={() => navigation.navigate('Workout' as never)}
            accessibilityLabel="Go to workout"
          >
            <MaterialCommunityIcons name="dumbbell" size={28} color="#FF6B6B" />
          </TouchableOpacity>
        </View>

        {/* Center - Logo */}
        <TouchableOpacity
          style={styles.topBarCenter}
          onPress={() => navigation.navigate('Settings' as never)}
          activeOpacity={0.7}
          accessibilityLabel="Open settings"
        >
          <Image
            source={require('../assets/logotransparent.png')}
            style={styles.topBarLogo}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Right Side - XP and Account */}
        <View style={[styles.topBarRight, { marginTop: 15 }]}>
          <TouchableOpacity
            style={styles.duolingoItem}
            onPress={() => navigation.navigate('Progress' as never)}
            activeOpacity={0.7}
            accessibilityLabel={`Experience points: ${userXP}`}
          >
            <MaterialCommunityIcons
              name="diamond"
              size={30}
              color="#1CB0F6"
            />
            <Text style={[styles.duolingoItemText, { color: colors.text }]}>
              {userXP}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.duolingoItem}
            onPress={() => setShowFriendStreak(true)}
            activeOpacity={0.7}
            accessibilityLabel="View friend streaks"
          >
            <MaterialCommunityIcons
              name="account-group"
              size={30}
              color="#FFB800"
            />
          </TouchableOpacity>
        </View>
        </View>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['transparent']}
            tintColor="transparent"
            progressBackgroundColor="transparent"
            progressViewOffset={-1000}
          />
        }
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          {
            useNativeDriver: false,
            listener: (event: any) => {
              const offsetY = event.nativeEvent.contentOffset.y;
              if (offsetY < 0 && !refreshing) {
                setPullDistance(Math.abs(offsetY));
              } else if (offsetY >= 0) {
                setPullDistance(0);
              }
            }
          }
        )}
        scrollEventThrottle={16}
        bounces={true} // Ensure bounce is enabled for pull-to-refresh
      >
      {/* Add padding to compensate for header */}
      <View style={{ height: 120 }} />

      {/* Calories Card - Matches Nutrition Tab Style */}
      <ErrorBoundary componentName="Nutrition Card">
        <View style={[styles.newCaloriesCard, { backgroundColor: '#2C2C2E' }]}>
          {loadingNutrition ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#1CB0F6" />
              <Text style={[styles.loadingText, { color: isDark ? '#B0B0B0' : '#666' }]}>
                {t('dashboard.loadingNutritionData')}
              </Text>
            </View>
          ) : nutritionError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
              <Text style={[styles.errorText, { color: isDark ? '#B0B0B0' : '#666' }]}>
                {nutritionError}
              </Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadDashboardData}
                accessibilityLabel="Retry loading nutrition data"
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Main Circle - 75% Arc with Remaining Calories */}
              <View style={styles.calorieMain}>
              <Svg width={200} height={200} style={styles.circleSvg}>
                {/* Background arc - 75% closed */}
                <Circle
                  cx={100}
                  cy={100}
                  r={85}
                  stroke={isDark ? '#4A5568' : '#5B7FA6'}
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
                  strokeDashoffset={`${2 * Math.PI * 85 * 0.75 * (calories.consumed / calories.target)}`}
                  strokeLinecap="round"
                  transform="rotate(135 100 100)"
                />
              </Svg>
              <View style={styles.calorieTextContainer}>
                <Text style={[styles.calorieNumber, { color: isDark ? 'white' : '#000' }]}>
                  {Math.round(Math.max(0, calories.target - calories.consumed))}
                </Text>
                <Text style={[styles.calorieLabel, { color: isDark ? '#B0B0B0' : '#666' }]}>{t('dashboard.kcalLeft')}</Text>
              </View>
            </View>

            {/* Bottom Row - Macro Bars */}
            <View style={styles.macrosBarsContainer}>
              <View style={styles.macroLabelsRow}>
                <View style={styles.macroLabelWithDot}>
                  <View style={[styles.macroDot, { backgroundColor: colors.carbsColor }]} />
                  <Text style={[styles.macroBarLabel, { color: colors.textSecondary }]}>{t('nutrition.carbs')}</Text>
                </View>
                <View style={styles.macroLabelWithDot}>
                  <View style={[styles.macroDot, { backgroundColor: colors.proteinColor }]} />
                  <Text style={[styles.macroBarLabel, { color: colors.textSecondary }]}>{t('nutrition.protein')}</Text>
                </View>
                <View style={styles.macroLabelWithDot}>
                  <View style={[styles.macroDot, { backgroundColor: colors.fatColor }]} />
                  <Text style={[styles.macroBarLabel, { color: colors.textSecondary }]}>{t('nutrition.fat')}</Text>
                </View>
              </View>

              <View style={styles.macroBarsRow}>
                <View style={[styles.macroProgressBar, { backgroundColor: isDark ? '#4A5568' : '#e0e0e0' }]}>
                  <View style={[styles.macroProgressFill, { backgroundColor: colors.carbsColor, width: `${Math.min((carbs.consumed / carbs.target) * 100, 100)}%` }]} />
                </View>
                <View style={[styles.macroProgressBar, { backgroundColor: isDark ? '#4A5568' : '#e0e0e0' }]}>
                  <View style={[styles.macroProgressFill, { backgroundColor: colors.proteinColor, width: `${Math.min((protein.consumed / protein.target) * 100, 100)}%` }]} />
                </View>
                <View style={[styles.macroProgressBar, { backgroundColor: isDark ? '#4A5568' : '#e0e0e0' }]}>
                  <View style={[styles.macroProgressFill, { backgroundColor: colors.fatColor, width: `${Math.min((fat.consumed / fat.target) * 100, 100)}%` }]} />
                </View>
              </View>

              <View style={styles.macroValuesRow}>
                <Text style={[styles.macroBarValue, { color: isDark ? 'white' : '#333' }]}>
                  {Math.round(carbs.consumed)} / {carbs.target} g
                </Text>
                <Text style={[styles.macroBarValue, { color: isDark ? 'white' : '#333' }]}>
                  {Math.round(protein.consumed)} / {protein.target} g
                </Text>
                <Text style={[styles.macroBarValue, { color: isDark ? 'white' : '#333' }]}>
                  {Math.round(fat.consumed)} / {fat.target} g
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
      </ErrorBoundary>

      {/* Health Tracking Section */}
      <ErrorBoundary componentName="Health Tracking">
        <SimpleHealthTracking />
      </ErrorBoundary>

      {/* Next Meal & Next Workout Row */}
      <ErrorBoundary componentName="Workout Cards">
        <View style={styles.nextActionsRow}>
          {/* Next Meal Card */}
          <TouchableOpacity
            style={[styles.nextActionCard, {
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              borderColor: '#4CAF50'
            }]}
            onPress={() => openFoodModal('lunch')}
            accessibilityLabel="Log lunch meal"
          >
            <View style={[styles.nextActionIconContainer, { backgroundColor: 'rgba(76, 175, 80, 0.2)' }]}>
              <MaterialCommunityIcons name="food-apple" size={24} color="#4CAF50" />
            </View>
            <View style={styles.nextActionContent}>
              <Text style={[styles.nextActionLabel, { color: '#4CAF50' }]}>{t('dashboard.nextMeal').toUpperCase()}</Text>
              <Text style={[styles.nextActionTitle, { color: colors.text }]}>{t('dashboard.lunch')}</Text>
              <Text style={[styles.nextActionTime, { color: colors.textSecondary }]}>12:30 PM</Text>
            </View>
          </TouchableOpacity>

        {/* Next Workout Card */}
        {loadingWorkout ? (
          <View style={[styles.nextActionCard, {
            backgroundColor: 'rgba(255, 107, 53, 0.1)',
            borderColor: '#FF6B35',
            justifyContent: 'center',
            alignItems: 'center'
          }]}>
            <ActivityIndicator size="small" color="#FF6B35" />
          </View>
        ) : workoutError ? (
          <View style={[styles.nextActionCard, {
            backgroundColor: 'rgba(255, 107, 53, 0.1)',
            borderColor: '#FF6B35',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8
          }]}>
            <Ionicons name="alert-circle-outline" size={24} color="#FF6B6B" />
            <TouchableOpacity
              style={styles.smallRetryButton}
              onPress={loadWorkoutData}
              accessibilityLabel="Retry loading workout data"
            >
              <Ionicons name="refresh" size={16} color="#fff" />
              <Text style={styles.smallRetryButtonText}>{t('common.retry')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.nextActionCard, {
              backgroundColor: 'rgba(255, 107, 53, 0.1)',
              borderColor: '#FF6B35'
            }]}
            onPress={() => {
              if (todayWorkout) {
                navigation.navigate('Workout', {
                  screen: 'WorkoutDetail',
                  params: {
                    workout: todayWorkout,
                    planName: selectedWorkoutPlan?.name || 'Workout'
                  }
                });
              } else {
                navigation.navigate('Workout', {
                  screen: 'WorkoutPlanSelection'
                });
              }
            }}
            accessibilityLabel={todayWorkout ? `Start workout: ${todayWorkout.name}` : 'Select workout plan'}
          >
            <View style={[styles.nextActionIconContainer, { backgroundColor: 'rgba(255, 107, 53, 0.2)' }]}>
              <MaterialCommunityIcons name="dumbbell" size={24} color="#FF6B35" />
            </View>
            <View style={styles.nextActionContent}>
              <Text style={[styles.nextActionLabel, { color: '#FF6B35' }]}>{t('dashboard.nextWorkout').toUpperCase()}</Text>
              <Text style={[styles.nextActionTitle, { color: colors.text }]}>
                {todayWorkout ? todayWorkout.name : t('dashboard.selectPlan')}
              </Text>
              <Text style={[styles.nextActionTime, { color: colors.textSecondary }]}>
                {todayWorkout ? `${todayWorkout.exercises.length} ${t('dashboard.exercises')}` : t('dashboard.chooseWorkoutPlan')}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        </View>
      </ErrorBoundary>


    </Animated.ScrollView>

      {/* Food Selection Modal */}
      <Modal
        visible={showFoodModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFoodModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add to {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)}</Text>
              <TouchableOpacity onPress={() => setShowFoodModal(false)} accessibilityLabel="Close modal">
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.mealTypeSelector}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((meal) => (
                <TouchableOpacity
                  key={meal}
                  style={[
                    styles.mealTypeButton,
                    selectedMeal === meal && styles.mealTypeButtonActive,
                    { borderColor: colors.border }
                  ]}
                  onPress={() => setSelectedMeal(meal)}
                  accessibilityLabel={`Select ${meal} meal type`}
                >
                  <Text
                    style={[
                      styles.mealTypeText,
                      { color: colors.textSecondary },
                      selectedMeal === meal && { color: '#FF6B35', fontWeight: '600' }
                    ]}
                  >
                    {meal.charAt(0).toUpperCase() + meal.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <FlatList
              data={foodDatabase}
              keyExtractor={(item) => item.name}
              initialNumToRender={10}
              maxToRenderPerBatch={10}
              windowSize={5}
              removeClippedSubviews={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.foodItem, { borderBottomColor: colors.border }]}
                  onPress={() => handleQuickAddFood(item.name)}
                  accessibilityLabel={`Add ${item.name} to ${selectedMeal}`}
                >
                  <View style={styles.foodInfo}>
                    <Text style={[styles.foodName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.foodServing, { color: colors.textSecondary }]}>
                      {item.serving}
                    </Text>
                  </View>
                  <View style={styles.foodMacros}>
                    <Text style={[styles.foodCalories, { color: colors.text }]}>
                      {item.calories} cal
                    </Text>
                    <View style={styles.foodMacroRow}>
                      <Text style={styles.macroText}>P: {parseFloat(item.protein.toFixed(1))}g</Text>
                      <Text style={styles.macroText}>C: {parseFloat(item.carbs.toFixed(1))}g</Text>
                      <Text style={styles.macroText}>F: {parseFloat(item.fat.toFixed(1))}g</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              style={styles.foodList}
            />
          </View>
        </View>
      </Modal>

      {/* Friend Streak Modal */}
      <FriendStreakCard
        visible={showFriendStreak}
        onClose={() => setShowFriendStreak(false)}
      />

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

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    marginTop: 0,
    paddingTop: 0,
  },
  customRefreshContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    overflow: 'hidden',
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'white',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 15,
    marginTop: 20,
    marginBottom: 10,
  },
  trackingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  topRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  waterCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    height: 140,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    position: 'relative',
    alignItems: 'center',
  },
  waterCardTop: {
    alignItems: 'center',
  },
  waterValue: {
    fontSize: 28,
    fontWeight: '400',
    color: '#000',
    marginTop: 8,
  },
  waterLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  plusButton: {
    position: 'absolute',
    bottom: 15,
    right: 15,
  },
  plusCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#64B5F6',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#64B5F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  plusIcon: {
    fontSize: 28,
    color: 'white',
    fontWeight: '400',
    lineHeight: 30,
  },
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: 120,
    height: 140,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#B3E5FC',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  progressText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000',
  },
  bottomRow: {
    flexDirection: 'row',
    gap: 12,
  },
  distanceCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: 120,
    height: 100,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginTop: 6,
  },
  stepsCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingLeft: 20,
    paddingRight: 12,
    paddingVertical: 20,
    height: 100,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepsInfo: {
    flex: 1,
    marginLeft: 12,
  },
  stepsValue: {
    fontSize: 28,
    fontWeight: '500',
    color: '#000',
  },
  stepsLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 1,
  },
  menuDots: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    alignItems: 'center',
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFA726',
  },
  logoHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginBottom: 20,
    marginTop: -20,  // Pull it up a bit to get closer to top
  },
  logo: {
    width: width,
    height: 150,
  },
  caloriesCard: {
    margin: 16,
    borderRadius: 25,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  caloriesLeft: {
    flex: 1,
    alignItems: 'center',
  },
  logoContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  progressBorderBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 4,
    borderColor: '#E5E5E5',
    borderRadius: 16,
  },
  progressBorderFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF6B35',
    borderRadius: 16,
    opacity: 0.3,
  },
  logoContent: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  logoBackground: {
    position: 'absolute',
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoFillContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  liquidLogo: {
    width: 180,
    height: 180,
    marginTop: 80,
  },
  liquidLogoInner: {
    position: 'absolute',
    width: 130,
    height: 130,
  },
  logoLiquidFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    opacity: 0.4,
    borderRadius: 20,
  },
  liquidCaloriesTop: {
    position: 'absolute',
    top: 25,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    zIndex: 10,
  },
  liquidLabelBottom: {
    position: 'absolute',
    bottom: 15,
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  caloriesInfo: {
    marginTop: 15,
    alignItems: 'center',
  },
  caloriesTarget: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  addFoodButton: {
    borderWidth: 1,
    borderColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addFoodText: {
    color: 'white',
    fontSize: 14,
  },
  macrosContainer: {
    flex: 0.8,
    justifyContent: 'space-around',
    paddingLeft: 20,
  },
  macroCard: {
    padding: 12,
    borderRadius: 20,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    marginHorizontal: 2,
  },
  macroTextContainer: {
    flex: 1,
  },
  macroTitle: {
    color: '#000',
    fontSize: 14,
    marginBottom: 4,
  },
  macroValue: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  macroProgressBarVertical: {
    width: 8,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    marginLeft: 12,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  macroProgressFillVertical: {
    width: '100%',
    borderRadius: 4,
  },
  proteinBar: {
    // backgroundColor defined dynamically via colors.proteinColor
  },
  carbsBar: {
    // backgroundColor defined dynamically via colors.carbsColor
  },
  fatBar: {
    // backgroundColor defined dynamically via colors.fatColor
  },
  newCaloriesCard: {
    margin: 16,
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  calorieMain: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  circleSvg: {
    position: 'relative',
  },
  calorieTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#000',
  },
  calorieLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 4,
  },
  caloriesTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  caloriesStat: {
    alignItems: 'center',
    flex: 1,
  },
  caloriesStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  caloriesStatLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  centralCircle: {
    alignItems: 'center',
    flex: 2,
    position: 'relative',
  },
  progressCircleContainer: {
    width: 140,
    height: 140,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  circleContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  circleValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  circleLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  circleLogo: {
    width: 60,
    height: 60,
  },
  progressDot: {
    position: 'absolute',
    top: 25,
    left: 70,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4ECDC4',
  },
  remainingValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  remainingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  macrosBarsContainer: {
    gap: 12,
  },
  macroLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  macroLabelWithDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  macroDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ECDC4',
  },
  macroBarLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  macroBarsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  macroProgressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  macroProgressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 4,
  },
  macroValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroBarValue: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  waterLeft: {
    flex: 1,
  },
  waterText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  addWaterButton: {
    backgroundColor: '#2196F3',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterProgress: {
    alignItems: 'center',
    marginLeft: 20,
  },
  waterPercent: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  waterCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  waterFill: {
    backgroundColor: '#2196F3',
    width: '100%',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickActionText: {
    fontSize: 14,
    color: '#666',
  },
  quickActionValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  workoutInfo: {
    flex: 1,
  },
  nextActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  nextActionCard: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  nextActionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nextActionContent: {
    flex: 1,
  },
  nextActionLabel: {
    fontSize: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  nextActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  nextActionTime: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressSection: {
    backgroundColor: 'white',
    marginTop: 16,
    paddingTop: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 20,
  },
  coachButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 15,
  },
  coachButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  personalText: {
    fontSize: 14,
    color: '#666',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  statCardLarge: {
    flex: 1.5,
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  statChange: {
    fontSize: 14,
    marginTop: 4,
  },
  chartContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  mealButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  mealButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mealButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  mealTypeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
  },
  mealTypeButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  mealTypeButtonActive: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  mealTypeText: {
    fontSize: 13,
  },
  mealTypeTextActive: {
    fontWeight: '600',
  },
  foodList: {
    padding: 20,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  foodServing: {
    fontSize: 14,
    color: '#666',
  },
  foodMacros: {
    alignItems: 'flex-end',
  },
  foodCalories: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  foodMacroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  macroText: {
    fontSize: 12,
    color: '#666',
  },

  // Duolingo-style Streak Styles
  streakContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  streakCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakIconContainer: {
    position: 'relative',
    marginRight: 16,
  },
  streakBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  streakBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  streakTextContainer: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  streakSubtitle: {
    fontSize: 14,
  },
  levelContainer: {
    alignItems: 'center',
  },
  levelBadge: {
    backgroundColor: '#FFB800',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 4,
  },
  levelText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  xpText: {
    fontSize: 12,
    fontWeight: '600',
  },
  streakProgressContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  streakProgressBar: {
    height: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  streakProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  streakProgressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  friendStreakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  friendPreview: {
    paddingTop: 4,
  },
  friendPreviewText: {
    fontSize: 14,
    fontWeight: '500',
  },
  duolingoTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    height: 120,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  topBarCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  topBarLogo: {
    width: 80,
    height: 80,
  },
  workoutIcon: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  duolingoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  duolingoItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  errorContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 12,
    marginBottom: 16,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1CB0F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  smallRetryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  smallRetryButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default DashboardScreen;