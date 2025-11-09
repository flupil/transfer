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
  Platform,
} from 'react-native';
import { Card, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { useNutrition } from '../contexts/NutritionContext';
import { useFocusEffect } from '@react-navigation/native';
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
import { Pedometer } from 'expo-sensors';
import firebaseDailyDataService from '../services/firebaseDailyDataService';
import CustomRefreshControl from '../components/CustomRefreshControl';
import { useTour } from '../contexts/TourContext';
import { CustomTourOverlay, TourStep } from '../components/tour/CustomTourOverlay';

const { width } = Dimensions.get('window');


const TryScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { preferences } = useUserPreferences();
  const { currentDiary } = useNutrition();
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  // Helper function to translate workout day names
  const translateWorkoutName = (name: string) => {
    if (!name) return '';
    // Replace "Day" with translated version
    return name.replace(/^Day\s+(\d+)/i, `${t('common.day')} $1`);
  };

  // Animation states for collapsing header
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = useRef(new Animated.Value(120)).current;
  const headerOpacity = useRef(new Animated.Value(1)).current;

  // Nutrition data
  const [calories, setCalories] = useState({ consumed: 0, target: 2000, breakfast: 0, lunch: 0, snack: 0, dinner: 0 });
  const [protein, setProtein] = useState({ consumed: 0, target: 150 });
  const [carbs, setCarbs] = useState({ consumed: 0, target: 250 });
  const [fat, setFat] = useState({ consumed: 0, target: 65 });
  const [water, setWater] = useState(0);

  // Food modal state
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [foodDatabase] = useState(getFoodDatabase());
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('snack');

  // Workout data
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [selectedWorkoutPlan, setSelectedWorkoutPlan] = useState<any>(null);
  const [todayIndex, setTodayIndex] = useState<number>(0);

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

  // Pedometer subscription
  const [pedometerSubscription, setPedometerSubscription] = useState<any>(null);
  const [isPedometerAvailable, setIsPedometerAvailable] = useState('checking');

  // Tour state
  const { isFirstVisit, markTourComplete } = useTour();

  // Weekly goals state
  const [weeklyGoalsData, setWeeklyGoalsData] = useState<Array<{
    date: string;
    caloriesProgress: number;
    stepsProgress: number;
    achieved: boolean;
  }>>([]);
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  // Carousel state
  const [carouselIndex, setCarouselIndex] = useState(0);
  const carouselScrollRef = useRef<ScrollView>(null);


  // Weight chart data
  const [weightData, setWeightData] = useState({
    labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    datasets: [{
      data: [96.5, 95.8, 95.2, 94.8, 94.5, 94.0, 93.4]
    }]
  });

  // Log preferences when they change
  useEffect(() => {
    console.log('TryScreen: preferences loaded:', preferences);
    console.log('TryScreen: appInterest:', preferences?.appInterest);
  }, [preferences]);

  useEffect(() => {
    if (user?.id) {
      waterTrackingService.setUserId(user.id);
      workoutService.setUserId(user.id);
      loadDashboardData(); // Load from Firebase
      // loadMacroData(); // DISABLED - uses SQLite
      loadWorkoutData();
      loadStreakData();
      initializePedometer();
    }

    // Set up periodic refresh for step count
    const stepInterval = setInterval(() => {
      refreshStepCount();
    }, 30000); // Refresh every 30 seconds

    return () => {
      // Cleanup pedometer subscription
      if (pedometerSubscription && pedometerSubscription.remove) {
        pedometerSubscription.remove();
      }
      // Clear interval
      clearInterval(stepInterval);
    };
  }, [user?.id]);

  // Calculate meal-specific calories from currentDiary
  useEffect(() => {
    if (currentDiary) {
      const breakfastCal = (currentDiary.breakfast || []).reduce((sum: number, item: any) => sum + (item.nutrition?.calories || 0), 0);
      const lunchCal = (currentDiary.lunch || []).reduce((sum: number, item: any) => sum + (item.nutrition?.calories || 0), 0);
      const snackCal = (currentDiary.snacks || []).reduce((sum: number, item: any) => sum + (item.nutrition?.calories || 0), 0);
      const dinnerCal = (currentDiary.dinner || []).reduce((sum: number, item: any) => sum + (item.nutrition?.calories || 0), 0);

      setCalories(prev => ({
        ...prev,
        breakfast: breakfastCal,
        lunch: lunchCal,
        snack: snackCal,
        dinner: dinnerCal
      }));
    }
  }, [currentDiary]);

  // Reload macro data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('TryScreen: useFocusEffect triggered');
      if (user?.id) {
        loadDashboardData(); // Reload Firebase data
        loadWorkoutData(); // Reload workout data to check completion status
      }
      loadStreakData(); // Also reload streak data
      resetDailySteps(); // Check if we need to reset daily steps

      // Refresh step count when screen gains focus
      refreshStepCount();
    }, [])
  );

  const loadStreakData = async () => {
    try {
      // Load streak data from the proper service
      const streakData = await getStreakData();
      setCurrentStreak(streakData.workoutStreak);
      setHasWorkedOutToday(!!streakData.lastWorkoutDate && new Date(streakData.lastWorkoutDate).toDateString() === new Date().toDateString());

      // Load completed workouts from AsyncStorage (for checking today's workout)
      const stored = await AsyncStorage.getItem('completedWorkouts');
      if (stored) {
        const completedArray = JSON.parse(stored);
        const today = new Date();
        const todayKey = `1-${today.getDay() === 0 ? 6 : today.getDay() - 1}`;

        if (completedArray.includes(todayKey)) {
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
      console.error('Error loading streak data:', error);
      // Set defaults
      setCurrentStreak(0);
      setUserLevel(1);
      setUserXP(110);
    }
  };

  const initializePedometer = async () => {
    try {
      // Check if pedometer is available
      const isAvailable = await Pedometer.isAvailableAsync();
      console.log('=== PEDOMETER INIT ===');
      console.log('Platform:', Platform.OS);
      console.log('Pedometer available:', isAvailable);
      setIsPedometerAvailable(isAvailable ? 'available' : 'manual');

      if (isAvailable) {
        console.log('Pedometer is available but may not work in Expo Go');
        // Request permissions
        if (Platform.OS === 'ios') {
          const { status } = await Pedometer.requestPermissionsAsync();
          if (status !== 'granted') {
            console.log('iOS pedometer permission not granted');
            setIsPedometerAvailable('manual');
            loadManualSteps();
            return;
          }
        } else if (Platform.OS === 'android') {
          // Android may need permissions too
          try {
            const { status } = await Pedometer.requestPermissionsAsync();
            console.log('Android permission status:', status);

            if (status !== 'granted') {
              console.log('Android permission denied - using simulated mode');
              // Even if permission is denied, we can still track manually
              setIsPedometerAvailable('manual');
            }
          } catch (e) {
            console.log('Android permission request error:', e);
            setIsPedometerAvailable('manual');
          }
        }

        // Load saved steps first
        const today = new Date().toDateString();
        const savedStepsKey = `steps_${today}`;
        const savedSteps = await AsyncStorage.getItem(savedStepsKey);

        if (savedSteps) {
          setSteps(parseInt(savedSteps) || 0);
          console.log('Loaded saved steps:', savedSteps);
        } else {
          // Start fresh if no saved steps
          setSteps(0);
          await AsyncStorage.setItem(savedStepsKey, '0');
        }

        // Get initial steps if iOS
        if (Platform.OS === 'ios') {
          await getTodaySteps();
        }

        // Subscribe to step updates (works on both iOS and Android)
        const subscription = Pedometer.watchStepCount(result => {
          console.log('Step update received:', result.steps, 'steps since last update');
          setSteps(prevSteps => {
            const newSteps = prevSteps + result.steps;
            // Save to AsyncStorage
            const today = new Date().toDateString();
            const savedStepsKey = `steps_${today}`;
            AsyncStorage.setItem(savedStepsKey, newSteps.toString());
            console.log('Total steps now:', newSteps);
            return newSteps;
          });
        });

        setPedometerSubscription(subscription);
        console.log('Step counter subscription started');
      } else {
        // Load saved steps if pedometer not available
        console.log('Pedometer not available, loading saved steps');
        loadManualSteps();
      }
    } catch (error) {
      console.error('Error initializing pedometer:', error);
      setIsPedometerAvailable('manual');
      loadManualSteps();
    }
  };

  const getTodaySteps = async () => {
    try {
      // Android doesn't support getStepCountAsync with date range
      if (Platform.OS === 'android') {
        console.log('Android detected, loading from saved steps');
        await loadManualSteps();
        return;
      }

      // iOS supports getting steps for date range
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();

      console.log('Getting steps from', start.toISOString(), 'to', end.toISOString());
      const pastStepCount = await Pedometer.getStepCountAsync(start, end);
      console.log('Got step count:', pastStepCount);

      if (pastStepCount) {
        setSteps(pastStepCount.steps);

        // Save to storage
        const today = new Date().toDateString();
        const savedStepsKey = `steps_${today}`;
        await AsyncStorage.setItem(savedStepsKey, pastStepCount.steps.toString());
      }
    } catch (error) {
      console.log('Error getting today steps:', error);
      // Load from storage as fallback
      loadManualSteps();
    }
  };

  const loadManualSteps = async () => {
    try {
      const today = new Date().toDateString();
      const savedStepsKey = `steps_${today}`;
      const savedSteps = await AsyncStorage.getItem(savedStepsKey);
      if (savedSteps) {
        setSteps(parseInt(savedSteps) || 0);
      } else {
        setSteps(0);
      }
    } catch (error) {
      console.log('Error loading saved steps:', error);
      setSteps(0);
    }
  };


  const refreshStepCount = async () => {
    console.log('Refreshing step count, pedometer status:', isPedometerAvailable);

    // Always try to load saved steps first
    const today = new Date().toDateString();
    const savedStepsKey = `steps_${today}`;
    const savedSteps = await AsyncStorage.getItem(savedStepsKey);

    console.log('Saved steps from storage:', savedSteps);

    if (savedSteps) {
      const stepCount = parseInt(savedSteps) || 0;
      setSteps(stepCount);
      console.log('Set steps to:', stepCount);
    } else {
      console.log('No saved steps found');
      if (isPedometerAvailable === 'available' && Platform.OS === 'ios') {
        await getTodaySteps();
      }
    }
  };

  const resetDailySteps = async () => {
    // Reset steps at midnight
    const today = new Date().toDateString();
    const lastResetKey = 'lastStepReset';
    const lastReset = await AsyncStorage.getItem(lastResetKey);

    if (lastReset !== today) {
      setSteps(0);
      await AsyncStorage.setItem(lastResetKey, today);
      await AsyncStorage.setItem(`steps_${today}`, '0');
    }
  };

  const loadWorkoutData = async () => {
    try {
      const plan = await getSelectedWorkoutPlan();
      if (plan) {
        setSelectedWorkoutPlan(plan);

        // Get current progression through the plan
        const currentDayIndex = await AsyncStorage.getItem('currentWorkoutDayIndex');

        const workoutDays = plan.workouts.filter((w: any) => w.exercises && w.exercises.length > 0);

        if (workoutDays.length > 0) {
          let index = 0;

          // If we have saved progress, use it
          if (currentDayIndex !== null) {
            index = parseInt(currentDayIndex) % workoutDays.length;
          }

          setTodayWorkout(workoutDays[index]);
          setTodayIndex(index);
        }
      }

      // Check if user has worked out today from AsyncStorage (source of truth)
      const lastWorkoutDate = await AsyncStorage.getItem('lastWorkoutCompletionDate');
      const today = new Date().toDateString();
      setHasWorkedOutToday(lastWorkoutDate === today);
    } catch (error) {
      console.error('Failed to load workout data:', error);
    }
  };

  const loadMacroData = async () => {
    try {
      console.log('Loading macro data for user:', user?.id);

      // Get selected meal plan targets
      const selectedPlan = await getSelectedMealPlan();
      let targets = {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 65
      };

      if (selectedPlan) {
        // Calculate targets from meal plan
        const meals = selectedPlan.meals || [];
        targets = meals.reduce((acc: any, meal: any) => ({
          calories: acc.calories + (meal.calories || 0),
          protein: acc.protein + (meal.protein || 0),
          carbs: acc.carbs + (meal.carbs || 0),
          fat: acc.fat + (meal.fat || 0)
        }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

        // Use plan's total values if available
        if (selectedPlan.totalCalories) targets.calories = selectedPlan.totalCalories;
        if (selectedPlan.totalProtein) targets.protein = selectedPlan.totalProtein;
        if (selectedPlan.totalCarbs) targets.carbs = selectedPlan.totalCarbs;
        if (selectedPlan.totalFat) targets.fat = selectedPlan.totalFat;
      }

      // Direct database query to bypass any service issues
      const db = getSafeDatabase();
      if (db && user?.id) {
        try {
          const today = format(new Date(), 'yyyy-MM-dd');
          console.log('Checking for food logs on date:', today, 'for user:', user.id);

          // First check all food logs
          const allLogs = await db.getAllAsync(`SELECT * FROM food_logs`) as any[];
          console.log('Total food logs in database:', allLogs.length);
          if (allLogs.length > 0) {
            console.log('Sample log:', allLogs[0]);
            console.log('All log dates:', allLogs.map(log => log.date));
          }

          // Check all logs for this user
          const userLogs = await db.getAllAsync(
            `SELECT * FROM food_logs WHERE userId = ?`,
            [user.id]
          ) as any[];
          console.log('All food logs for user:', userLogs.length);

          // Now check for today's logs
          const todayLogs = await db.getAllAsync(
            `SELECT * FROM food_logs WHERE date = ? AND userId = ?`,
            [today, user.id]
          ) as any[];
          console.log('Food logs for today:', todayLogs.length);

          // Calculate totals directly
          let totalCalories = 0;
          let totalProtein = 0;
          let totalCarbs = 0;
          let totalFat = 0;

          for (const log of todayLogs) {
            totalCalories += log.calories || 0;
            totalProtein += log.protein || 0;
            totalCarbs += log.carbs || 0;
            totalFat += log.fat || 0;
          }

          console.log('Direct calculation - Calories:', totalCalories, 'Protein:', totalProtein);

          // Set the values with meal plan targets
          setCalories({
            consumed: totalCalories,
            target: targets.calories || 2100
          });
          setProtein({
            consumed: totalProtein,
            target: targets.protein || 140
          });
          setCarbs({
            consumed: totalCarbs,
            target: targets.carbs || 255
          });
          setFat({
            consumed: totalFat,
            target: targets.fat || 58
          });

          if (todayLogs.length > 0) {
            return; // Exit early if we found data
          }
        } catch (dbError) {
          console.error('Database error:', dbError);
        }
      }

      // Fallback to service method
      const macroData = await getTodayMacros(user?.id);
      console.log('Service macro data:', macroData);

      // Use meal plan targets if available, otherwise use defaults
      console.log('Dashboard - Meal plan targets:', targets);
      console.log('Dashboard - Consumed:', macroData.consumed);
      console.log('Dashboard - Remaining:', targets.calories - macroData.consumed.calories);

      setCalories({
        consumed: macroData.consumed.calories,
        target: targets.calories || macroData.targets.calories,
      });
      setProtein({
        consumed: macroData.consumed.protein,
        target: targets.protein || macroData.targets.protein,
      });
      setCarbs({
        consumed: macroData.consumed.carbs,
        target: targets.carbs || macroData.targets.carbs,
      });
      setFat({
        consumed: macroData.consumed.fat,
        target: targets.fat || macroData.targets.fat,
      });
    } catch (error) {
      console.error('Failed to load macro data:', error);
    }
  };

  const loadWeeklyGoalsData = async () => {
    if (!user?.id) return;

    try {
      console.log('🔥 Loading weekly goals data...');

      // Get last 7 days including today
      const last7Days = [];
      const todayStr = new Date().toISOString().split('T')[0];

      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        try {
          // Fetch data for each day individually
          const dayData = await firebaseDailyDataService.getDailyDiary(user.id, dateStr);

          console.log(`📅 Day ${dateStr}: calories=${dayData.calories.consumed}/${dayData.calories.target}, steps=${dayData.steps.count}/${dayData.steps.target}`);

          const caloriesProgress = dayData.calories.target > 0
            ? dayData.calories.consumed / dayData.calories.target
            : 0;
          const stepsProgress = dayData.steps.target > 0
            ? dayData.steps.count / dayData.steps.target
            : 0;

          // Achieved if both calories and steps reach at least 100% of target
          const achieved = caloriesProgress >= 1.0 && stepsProgress >= 1.0;

          last7Days.push({
            date: dateStr,
            caloriesProgress: Math.min(caloriesProgress, 1),
            stepsProgress: Math.min(stepsProgress, 1),
            achieved
          });
        } catch (dayError) {
          console.error(`Error loading data for ${dateStr}:`, dayError);
          // No data for this day
          last7Days.push({
            date: dateStr,
            caloriesProgress: 0,
            stepsProgress: 0,
            achieved: false
          });
        }
      }

      console.log('✅ Weekly goals data loaded:', last7Days.map(d => `${d.caloriesProgress.toFixed(2)}`).join(', '));
      setWeeklyGoalsData(last7Days);
    } catch (error) {
      console.error('❌ Error loading weekly goals data:', error);
      // Set empty data on error
      setWeeklyGoalsData(Array(7).fill({
        date: '',
        caloriesProgress: 0,
        stepsProgress: 0,
        achieved: false
      }));
    }
  };

  const loadDashboardData = async () => {
    if (!user?.id) return;

    // Load from Firebase first
    try {
      console.log('TryScreen: Loading from Firebase for user:', user.id);
      const todayData = await firebaseDailyDataService.getTodayData(user.id);

      // Set nutrition data from Firebase
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
      setWater(todayData.water.consumed * 250); // Convert glasses to ml
      setSteps(todayData.steps.count);

      console.log('TryScreen: Set calories from Firebase:', todayData.calories.consumed);

      // Load weekly goals data
      await loadWeeklyGoalsData();

      return; // Exit early - don't load SQLite data
    } catch (error) {
      console.error('TryScreen: Error loading from Firebase:', error);
    }

    // SQLite code removed - using Firebase only
  };

  const onRefresh = async () => {
    console.log('Pull to refresh triggered!');
    console.log('Current steps before refresh:', steps);
    try {
      setRefreshing(true);

      // Reload all data
      await loadDashboardData(); // Use Firebase instead
      await loadStreakData();

      // Force reload step count from storage
      const today = new Date().toDateString();
      const savedStepsKey = `steps_${today}`;
      const savedSteps = await AsyncStorage.getItem(savedStepsKey);
      console.log('Refreshing - saved steps from storage:', savedSteps);

      if (savedSteps) {
        const stepCount = parseInt(savedSteps) || 0;
        setSteps(stepCount);
        console.log('Refreshed steps to:', stepCount);
      } else {
        await refreshStepCount();
      }

      // Simulate other data refresh
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.log('Refresh error:', error);
    } finally {
      setRefreshing(false);
      console.log('Refresh complete, final steps:', steps);
    }
  };

  const addWater = async () => {
    try {
      if (user?.id) {
        // Add 1 glass (250ml) to Firebase
        await firebaseDailyDataService.addWater(user.id, 1);
        // Update local state
        setWater(water + 250);
      } else {
        // Fallback for no user
        setWater(water + 250);
      }
    } catch (error) {
      console.error('Failed to add water to Firebase:', error);
      // Still update UI even if Firebase fails
      setWater(water + 250);
    }
  };

  const handleQuickAddFood = async (foodName: string) => {
    try {
      const result = await quickAddMacro(foodName, selectedMeal);
      if (result) {
        await loadDashboardData(); // Refresh from Firebase
        Alert.alert(t('common.success'), `${t('common.added')} ${foodName} ${t('common.to')} ${selectedMeal}`);
        setShowFoodModal(false);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('common.failedToAddFood'));
    }
  };

  const openFoodModal = (meal: 'breakfast' | 'lunch' | 'dinner' | 'snack') => {
    navigation.navigate('Nutrition' as never);
  };

  // Tour functions
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

  // TEST: Force show tour after 2 seconds
  useEffect(() => {
    console.log('🔥 TryScreen: FORCING TOUR TO SHOW IN 2 SECONDS!');
    const timer = setTimeout(() => {
      console.log('🔥 TryScreen: SHOWING TOUR NOW!');
      setShowTour(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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
        style={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: 120 }}
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

      {/* Calories Section - No Border/Card */}
      <View style={styles.newCaloriesSection}>
        {/* Top Row - Eaten, Remaining */}
        <View style={styles.caloriesTopRow}>
          <View style={styles.caloriesStat}>
            <Text style={[styles.caloriesStatValue, { color: isDark ? 'white' : '#333' }]}>{calories.consumed}</Text>
            <Text style={[styles.caloriesStatLabel, { color: isDark ? '#B0B0B0' : '#666' }]}>{t('home.eaten')}</Text>
          </View>

          <View style={styles.centralCircle}>
            {/* SVG Progress Rings */}
            <Svg width={160} height={160} style={{ position: 'absolute' }}>
              {/* Outer Ring Background - Calories */}
              <Circle
                cx={80}
                cy={80}
                r={75}
                stroke={isDark ? 'rgba(255, 107, 53, 0.2)' : 'rgba(255, 107, 53, 0.15)'}
                strokeWidth={6}
                fill="none"
              />
              {/* Outer Ring Progress - Calories */}
              <Circle
                cx={80}
                cy={80}
                r={75}
                stroke={isDark ? 'rgba(255, 107, 53, 0.7)' : 'rgba(255, 107, 53, 0.6)'}
                strokeWidth={6}
                fill="none"
                strokeDasharray={`${2 * Math.PI * 75}`}
                strokeDashoffset={`${2 * Math.PI * 75 * (1 - Math.min(calories.consumed / calories.target, 1))}`}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
              />
              {/* Inner Ring Background - Steps */}
              <Circle
                cx={80}
                cy={80}
                r={60}
                stroke={isDark ? 'rgba(66, 133, 244, 0.2)' : 'rgba(66, 133, 244, 0.15)'}
                strokeWidth={6}
                fill="none"
              />
              {/* Inner Ring Progress - Steps */}
              <Circle
                cx={80}
                cy={80}
                r={60}
                stroke={isDark ? 'rgba(66, 133, 244, 0.7)' : 'rgba(66, 133, 244, 0.6)'}
                strokeWidth={6}
                fill="none"
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - Math.min(steps / 10000, 1))}`}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
              />
            </Svg>
            {/* Logo in Center with Liquid Fill Effect */}
            <View style={styles.logoContainer}>
              {/* Background Logo (grayscale/faded) */}
              <Image
                source={require('../assets/logotransparent.png')}
                style={[styles.circleLogo, { opacity: 0.3 }]}
                resizeMode="contain"
              />
              {/* Filled Logo (clips from bottom to top based on calorie progress) */}
              <View style={[
                styles.logoFillMask,
                {
                  height: `${Math.min((calories.consumed / calories.target) * 100, 100)}%`,
                  bottom: 0,
                }
              ]}>
                <Image
                  source={require('../assets/logotransparent.png')}
                  style={[styles.circleLogo, {
                    position: 'absolute',
                    bottom: 0,
                  }]}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>

          <View style={styles.caloriesStat}>
            <Text style={[styles.caloriesStatValue, { color: isDark ? 'white' : '#333' }]}>
              {calories.target - calories.consumed}
            </Text>
            <Text style={[styles.caloriesStatLabel, { color: isDark ? '#B0B0B0' : '#666' }]}>{t('home.remaining')}</Text>
          </View>
        </View>

        {/* Activity Stats Row */}
        <View style={styles.activityStatsRow}>
          <View style={styles.activityStatItem}>
            <Image
              source={require('../assets/calories-icon.png')}
              style={[styles.activityIcon, { tintColor: '#FF6B35' }]}
            />
            <Text style={[styles.activityStatValue, { color: isDark ? 'white' : '#333' }]}>{calories.consumed}</Text>
            <Text style={[styles.activityStatLabel, { color: isDark ? '#B0B0B0' : '#666' }]}>{t('nutrition.calories')}</Text>
          </View>
          <View style={styles.activityStatItem}>
            <Image
              source={require('../assets/steps-icon.png')}
              style={[styles.activityIcon, { tintColor: '#4285F4' }]}
            />
            <Text style={[styles.activityStatValue, { color: isDark ? 'white' : '#333' }]}>{steps.toLocaleString()}</Text>
            <Text style={[styles.activityStatLabel, { color: isDark ? '#B0B0B0' : '#666' }]}>
              {t('home.steps')}
            </Text>
          </View>
        </View>

        {/* Bottom Row - Macro Numbers */}
        <View style={styles.macrosBottomSection}>
          <View style={styles.macroItem}>
            <Text style={[styles.macroNumber, { color: '#66B2FF' }]}>
              {Math.round(carbs.consumed)}
            </Text>
            <Text style={[styles.macroLabel, { color: isDark ? 'white' : 'white' }]}>{t('nutrition.carbs')}</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={[styles.macroNumber, { color: '#66B2FF' }]}>
              {Math.round(protein.consumed)}
            </Text>
            <Text style={[styles.macroLabel, { color: isDark ? 'white' : 'white' }]}>{t('nutrition.protein')}</Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={[styles.macroNumber, { color: '#66B2FF' }]}>
              {Math.round(fat.consumed)}
            </Text>
            <Text style={[styles.macroLabel, { color: isDark ? 'white' : 'white' }]}>{t('nutrition.fat')}</Text>
          </View>
        </View>
      </View>

      {/* Weekly Goals Tracker */}
      <TouchableOpacity
        style={[styles.weeklyGoalsCard, { backgroundColor: '#2C2C2E' }]}
        onPress={() => navigation.navigate('MyActivity' as never)}
        activeOpacity={0.7}
      >
        <View style={styles.weeklyGoalsHeader}>
          <Text style={[styles.weeklyGoalsTitle, { color: isDark ? 'white' : '#333' }]}>
            {t('home.yourDailyGoals')}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={24} color={isDark ? '#B0B0B0' : '#666'} />
        </View>

        <Text style={[styles.weeklyGoalsSubtitle, { color: isDark ? '#B0B0B0' : '#666' }]}>
          {t('home.last7Days')}
        </Text>

        <View style={styles.weeklyGoalsContent}>
          {/* Left side - Achievement count */}
          <View style={styles.achievementCount}>
            <Text style={[styles.achievementNumber, { color: '#4285F4' }]}>
              {weeklyGoalsData.filter(d => d.achieved).length}/7
            </Text>
            <Text style={[styles.achievementLabel, { color: isDark ? '#B0B0B0' : '#666' }]}>
              {t('home.achieved')}
            </Text>
          </View>

          {/* Right side - 7 day rings with dual progress (calories + steps) */}
          <View style={styles.weeklyRingsContainer}>
            {[t('days.sunShort'), t('days.monShort'), t('days.tueShort'), t('days.wedShort'), t('days.thuShort'), t('days.friShort'), t('days.satShort')].map((day, index) => {
              const dayData = weeklyGoalsData[index] || { caloriesProgress: 0, stepsProgress: 0, achieved: false };
              return (
                <View key={`day-${index}`} style={styles.dayRingColumn}>
                  <Svg width={32} height={32}>
                    {/* Outer Ring Background - Calories */}
                    <Circle
                      cx={16}
                      cy={16}
                      r={13}
                      stroke={isDark ? 'rgba(255, 107, 53, 0.2)' : 'rgba(255, 107, 53, 0.15)'}
                      strokeWidth={2}
                      fill="none"
                    />
                    {/* Outer Ring Progress - Calories */}
                    <Circle
                      cx={16}
                      cy={16}
                      r={13}
                      stroke={isDark ? 'rgba(255, 107, 53, 0.7)' : 'rgba(255, 107, 53, 0.6)'}
                      strokeWidth={2}
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 13}`}
                      strokeDashoffset={`${2 * Math.PI * 13 * (1 - dayData.caloriesProgress)}`}
                      strokeLinecap="round"
                      transform="rotate(-90 16 16)"
                    />
                    {/* Inner Ring Background - Steps */}
                    <Circle
                      cx={16}
                      cy={16}
                      r={9}
                      stroke={isDark ? 'rgba(66, 133, 244, 0.2)' : 'rgba(66, 133, 244, 0.15)'}
                      strokeWidth={2}
                      fill="none"
                    />
                    {/* Inner Ring Progress - Steps */}
                    <Circle
                      cx={16}
                      cy={16}
                      r={9}
                      stroke="#4285F4"
                      strokeWidth={2}
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 9}`}
                      strokeDashoffset={`${2 * Math.PI * 9 * (1 - dayData.stepsProgress)}`}
                      strokeLinecap="round"
                      transform="rotate(-90 16 16)"
                    />
                  </Svg>
                  <Text style={[styles.dayRingLabel, { color: isDark ? '#B0B0B0' : '#666' }]}>
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>

      {/* Swipeable Carousel for Workout/Nutrition */}
      <View style={{ marginBottom: 16, position: 'relative' }}>
        <ScrollView
          ref={carouselScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            const offsetX = event.nativeEvent.contentOffset.x;
            const index = Math.round(offsetX / width);
            setCarouselIndex(index);
          }}
          scrollEventThrottle={16}
          snapToInterval={width}
          decelerationRate="fast"
          contentContainerStyle={{ paddingHorizontal: 0 }}
        >
          {/* Show workout card if app interest includes workouts or football */}
          {(preferences?.appInterest === 'workouts' || preferences?.appInterest === 'football' || preferences?.appInterest === 'both') && (
            <View style={{ width: width, position: 'relative' }}>
              <TouchableOpacity
                style={[styles.workoutBlock, { backgroundColor: '#2C2C2E', marginHorizontal: 16, position: 'relative' }]}
                activeOpacity={0.7}
                onPress={() => {
                  console.log('Workout block tapped - navigating to Workout tab');
                  (navigation as any).navigate('Workout', {
                    screen: 'WorkoutMain'
                  });
                }}
                accessibilityLabel="View today's workout"
              >
        {/* Week Calendar */}
        <View style={styles.weekCalendar}>
          {[t('days.sun'), t('days.mon'), t('days.tue'), t('days.wed'), t('days.thu'), t('days.fri'), t('days.sat')].map((day, index) => {
            const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
            const isToday = index === today;
            return (
              <View key={day} style={styles.dayColumn}>
                <View style={[
                  styles.dayDot,
                  isToday && { backgroundColor: '#4285F4' },
                  !isToday && { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                ]} />
                <Text style={[
                  styles.dayText,
                  { color: isToday ? '#4285F4' : (isDark ? '#B0B0B0' : '#999') }
                ]}>
                  {day}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Session Label */}
        <Text style={[styles.sessionLabel, { color: isDark ? '#B0B0B0' : '#999' }]}>
          {t('home.todaysWorkout')}
        </Text>

        {/* Workout Title with Completion Status */}
        <View style={styles.workoutTitleSection}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.workoutMainTitle, { color: isDark ? 'white' : '#1a1a1a' }]}>
              {translateWorkoutName(todayWorkout?.name || todayWorkout?.day || '') || t('home.restDay')}
            </Text>
          </View>
          {hasWorkedOutToday && (
            <View style={{
              backgroundColor: '#34C759',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4
            }}>
              <Ionicons name="checkmark-circle" size={16} color="white" />
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                {t('home.completed')}
              </Text>
            </View>
          )}
        </View>

        {/* Workout Info Summary */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={[styles.workoutCategory, { color: isDark ? '#B0B0B0' : '#666', fontSize: 12 }]}>
              {selectedWorkoutPlan?.difficulty?.toUpperCase() || t('home.strength').toUpperCase()}
            </Text>
            {todayWorkout?.exercises && (
              <>
                <Text style={{ color: isDark ? '#666' : '#999', fontSize: 12 }}>•</Text>
                <Text style={[styles.workoutCategory, { color: isDark ? '#B0B0B0' : '#666', fontSize: 12 }]}>
                  {todayWorkout.exercises.length} {t('home.exercises')}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Workout Info Pills */}
        <View style={styles.workoutInfoRow}>
          <View style={styles.infoPill}>
            <Ionicons name="time-outline" size={16} color="#4285F4" />
            <Text style={[styles.infoPillText, { color: isDark ? 'white' : '#333' }]} numberOfLines={1}>
              {todayWorkout?.duration || '35-45 min'}
            </Text>
          </View>
          {todayWorkout?.exercises && todayWorkout.exercises.length > 0 && (
            <View style={[styles.infoPill, { flex: 1 }]}>
              <Ionicons name="barbell-outline" size={16} color="#FF6B35" />
              <Text
                style={[styles.infoPillText, { color: isDark ? 'white' : '#333', flex: 1 }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {todayWorkout.exercises.slice(0, 2).map((ex: any) => ex.name).join(', ')}
                {todayWorkout.exercises.length > 2 ? '...' : ''}
              </Text>
            </View>
          )}
        </View>

                {/* Carousel dots - show both dots on workout card (only in 'both' mode) */}
                {preferences?.appInterest === 'both' && (
                  <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                    <View style={[
                      styles.carouselDot,
                      { backgroundColor: carouselIndex === 0 ? '#4285F4' : 'rgba(255, 255, 255, 0.3)' }
                    ]} />
                    <View style={[
                      styles.carouselDot,
                      { backgroundColor: carouselIndex === 1 ? '#4285F4' : 'rgba(255, 255, 255, 0.3)' }
                    ]} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Show nutrition card if app interest includes nutrition */}
          {(preferences?.appInterest === 'nutrition' || preferences?.appInterest === 'both') && (
            <View style={{ width: width, position: 'relative' }}>
              <TouchableOpacity
                style={[styles.workoutBlock, { backgroundColor: '#2C2C2E', marginHorizontal: 16, position: 'relative' }]}
                activeOpacity={0.7}
                onPress={() => {
                  console.log('Nutrition block tapped - navigating to Nutrition tab');
                  (navigation as any).navigate('Nutrition');
                }}
                accessibilityLabel="View nutrition plan"
              >
              {/* Week Calendar */}
              <View style={styles.weekCalendar}>
                {[t('days.sun'), t('days.mon'), t('days.tue'), t('days.wed'), t('days.thu'), t('days.fri'), t('days.sat')].map((day, index) => {
                  const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
                  const isToday = index === today;
                  return (
                    <View key={day} style={styles.dayColumn}>
                      <View style={[
                        styles.dayDot,
                        isToday && { backgroundColor: '#4285F4' },
                        !isToday && { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                      ]} />
                      <Text style={[
                        styles.dayText,
                        { color: isToday ? '#4285F4' : (isDark ? '#B0B0B0' : '#999') }
                      ]}>
                        {day}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Session Label with Log Meal Button */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={[styles.sessionLabel, { color: isDark ? '#B0B0B0' : '#999', marginBottom: 0 }]}>
                  TODAY'S NUTRITION
                </Text>

                {/* Log Meal Button */}
                <TouchableOpacity
                  style={{
                    backgroundColor: '#4285F4',
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6
                  }}
                  onPress={() => {
                    console.log('Log meal tapped - navigating to NutritionMain');
                    (navigation as any).navigate('Nutrition', {
                      screen: 'NutritionMain',
                      params: { scrollToLogMeal: true }
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="plus" size={16} color="white" />
                  <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>
                    Log Meal
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Meal Calorie Circles */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
                {/* Breakfast */}
                <View style={{ alignItems: 'center' }}>
                  <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: '#3A4A5A',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 4
                  }}>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                      {Math.round(calories.breakfast || 0)}
                    </Text>
                    <Text style={{ color: '#B0B0B0', fontSize: 9 }}>
                      {t('nutrition.cal')}
                    </Text>
                  </View>
                  <Text style={{ color: isDark ? '#B0B0B0' : '#999', fontSize: 10 }}>
                    {t('nutrition.breakfast')}
                  </Text>
                </View>

                {/* Lunch */}
                <View style={{ alignItems: 'center' }}>
                  <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: '#3A4A5A',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 4
                  }}>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                      {Math.round(calories.lunch || 0)}
                    </Text>
                    <Text style={{ color: '#B0B0B0', fontSize: 9 }}>
                      {t('nutrition.cal')}
                    </Text>
                  </View>
                  <Text style={{ color: isDark ? '#B0B0B0' : '#999', fontSize: 10 }}>
                    {t('nutrition.lunch')}
                  </Text>
                </View>

                {/* Snack */}
                <View style={{ alignItems: 'center' }}>
                  <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: '#3A4A5A',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 4
                  }}>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                      {Math.round(calories.snack || 0)}
                    </Text>
                    <Text style={{ color: '#B0B0B0', fontSize: 9 }}>
                      {t('nutrition.cal')}
                    </Text>
                  </View>
                  <Text style={{ color: isDark ? '#B0B0B0' : '#999', fontSize: 10 }}>
                    {t('nutrition.snack')}
                  </Text>
                </View>

                {/* Dinner */}
                <View style={{ alignItems: 'center' }}>
                  <View style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: '#3A4A5A',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 4
                  }}>
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
                      {Math.round(calories.dinner || 0)}
                    </Text>
                    <Text style={{ color: '#B0B0B0', fontSize: 9 }}>
                      {t('nutrition.cal')}
                    </Text>
                  </View>
                  <Text style={{ color: isDark ? '#B0B0B0' : '#999', fontSize: 10 }}>
                    {t('nutrition.dinner')}
                  </Text>
                </View>
              </View>

                {/* Carousel dots - show both dots on nutrition card (only in 'both' mode) */}
                {preferences?.appInterest === 'both' && (
                  <View style={{ position: 'absolute', bottom: 12, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
                    <View style={[
                      styles.carouselDot,
                      { backgroundColor: carouselIndex === 0 ? '#4285F4' : 'rgba(255, 255, 255, 0.3)' }
                    ]} />
                    <View style={[
                      styles.carouselDot,
                      { backgroundColor: carouselIndex === 1 ? '#4285F4' : 'rgba(255, 255, 255, 0.3)' }
                    ]} />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>

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
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('nutrition.addTo')} {selectedMeal.charAt(0).toUpperCase() + selectedMeal.slice(1)}</Text>
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
                      {item.calories} {t('nutrition.cal')}
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
    flexGrow: 1,
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
    backgroundColor: '#2C2C2E',
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
    backgroundColor: '#2C2C2E',
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
    backgroundColor: '#2C2C2E',
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
    backgroundColor: '#2C2C2E',
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
    backgroundColor: '#2C2C2E',
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
    padding: 8,
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
    backgroundColor: '#FF6B6B',
  },
  carbsBar: {
    backgroundColor: '#4ECDC4',
  },
  fatBar: {
    backgroundColor: '#FFD93D',
  },
  newCaloriesSection: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    padding: 20,
  },
  caloriesTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginHorizontal: -10,
  },
  caloriesStat: {
    alignItems: 'center',
    width: 70,
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
    justifyContent: 'center',
    position: 'relative',
    width: 160,
    height: 160,
  },
  ringOuter: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 6,
    position: 'absolute',
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  ringProgressOuter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 75,
  },
  dotIndicatorOuter: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00BCD4',
    zIndex: 10,
  },
  ringInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 6,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  ringProgressInner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 60,
  },
  dotIndicatorInner: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4285F4',
    zIndex: 10,
  },
  logoContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: 45,
    height: 45,
  },
  logoFillMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'hidden',
    width: 45,
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
    width: 45,
    height: 45,
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
  activityStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: -5,
    gap: 40,
  },
  activityStatItem: {
    alignItems: 'center',
    gap: 4,
  },
  activityIcon: {
    width: 36,
    height: 36,
  },
  activityStatLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  activityStatValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  macrosBottomSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    gap: 40,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroNumber: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Weekly Goals Tracker styles
  weeklyGoalsCard: {
    margin: 16,
    marginTop: 8,
    borderRadius: 20,
    padding: 16,
    paddingVertical: 14,
  },
  weeklyGoalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  weeklyGoalsTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  weeklyGoalsSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  weeklyGoalsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  achievementCount: {
    alignItems: 'center',
    marginRight: 20,
  },
  achievementNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  achievementLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  weeklyRingsContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
  },
  dayRingColumn: {
    alignItems: 'center',
  },
  dayRingLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  weeklyMacrosSection: {
    gap: 12,
  },
  weeklyMacroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weeklyMacroBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  weeklyMacroProgress: {
    height: '100%',
    borderRadius: 4,
  },
  weeklyMacroValue: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 80,
    textAlign: 'right',
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
    backgroundColor: '#2C2C2E',
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
  workoutBlock: {
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderRadius: 20,
    height: 220,
  },
  weekCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  dayColumn: {
    alignItems: 'center',
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  dayText: {
    fontSize: 11,
    fontWeight: '500',
  },
  sessionLabel: {
    fontSize: 12,
    marginBottom: 12,
  },
  workoutTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  workoutMainTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  workoutCategory: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  sessionCounter: {
    fontSize: 13,
  },
  workoutInfoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 20,
    flexWrap: 'wrap',
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoPillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  equipmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 20,
  },
  equipmentText: {
    fontSize: 13,
  },
  warmupSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },
  warmupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  warmupTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  warmupSubtitle: {
    fontSize: 13,
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
    backgroundColor: '#2C2C2E',
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
    backgroundColor: '#2C2C2E',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  statCardLarge: {
    flex: 1.5,
    backgroundColor: '#2C2C2E',
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
    backgroundColor: '#2C2C2E',
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
    backgroundColor: '#2C2C2E',
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
    padding: 8,
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
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  carouselDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default TryScreen;