import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Text, Animated, Alert, Image, Vibration, Modal, RefreshControl, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getSelectedWorkoutPlan } from '../services/workoutPlanService';
import { SvgXml, Svg, Circle, G } from 'react-native-svg';

// Create AnimatedCircle for smooth progress animations
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
import CustomHeader from '../components/CustomHeader';
import { workoutService } from '../services/workoutService';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseWorkoutService from '../services/firebaseWorkoutService';
import firebaseDailyDataService from '../services/firebaseDailyDataService';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { updateWorkoutStreak } from '../services/progressTrackingService';
import { useLanguage } from '../contexts/LanguageContext';
import { useTour } from '../contexts/TourContext';
import { useTimer } from '../contexts/TimerContext';
import { CustomTourOverlay, TourStep } from '../components/tour/CustomTourOverlay';
import calorieTrackingService from '../services/calorieTrackingService';
import { BRAND_COLORS } from '../constants/brandColors';

const { width, height } = Dimensions.get('window');

// Workout logo imports (with correct path)
const workoutLogos = {
  chest: require('../../assets/workoutLogos/chest_day.png'),
  push: require('../../assets/workoutLogos/push_day.png'),
  back: require('../../assets/workoutLogos/back_day.png'),
  pull: require('../../assets/workoutLogos/pull_day.png'),
  legs: require('../../assets/workoutLogos/leg_day.png'),
  shoulders: require('../../assets/workoutLogos/shoulder_and_abs_day.png'),
  abs: require('../../assets/workoutLogos/abs_day.png'),
  arms: require('../../assets/workoutLogos/arms_day.png'),
  fullbody: require('../../assets/workoutLogos/full_body_day.png'),
  rest: require('../../assets/workoutLogos/rest_day.png'),
};

interface WorkoutDay {
  id: string;
  day: string;
  name: string;
  focusArea: string;
  duration: string;
  exercises: any[];
}

const TestingScreenContent: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { isFirstVisit, markTourComplete } = useTour();
  const { startTimer: startGlobalTimer, setExpanded: setTimerExpanded } = useTimer();
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const [totalXP, setTotalXP] = useState(110);
  const [streak, setStreak] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [todayIndex, setTodayIndex] = useState<number>(-1);
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<string>>(new Set());
  const [timeOfDay, setTimeOfDay] = useState('morning');
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievementText, setAchievementText] = useState('');
  const [nextWorkoutTime, setNextWorkoutTime] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [weeklyChallenge, setWeeklyChallenge] = useState<{title: string, target: number, current: number} | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'honeycomb' | 'list'>('honeycomb'); // Toggle between honeycomb and list view

  // Generate styles with theme colors
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  // Helper function to get short day name using translations
  const getShortDayName = (dayName: string): string => {
    const dayMap: { [key: string]: string } = {
      'Monday': t('days.mon'),
      'Tuesday': t('days.tue'),
      'Wednesday': t('days.wed'),
      'Thursday': t('days.thu'),
      'Friday': t('days.fri'),
      'Saturday': t('days.sat'),
      'Sunday': t('days.sun')
    };
    return dayMap[dayName] || dayName.substring(0, 3).toUpperCase();
  };

  const getDayName = (dayName: string): string => {
    const dayMap: { [key: string]: string } = {
      'Monday': t('days.monday'),
      'Tuesday': t('days.tuesday'),
      'Wednesday': t('days.wednesday'),
      'Thursday': t('days.thursday'),
      'Friday': t('days.friday'),
      'Saturday': t('days.saturday'),
      'Sunday': t('days.sunday')
    };
    return dayMap[dayName] || dayName;
  };

  // Animation for today's workout pulse
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Animations for workout completion
  const completionAnims = useRef(
    Array.from({ length: 7 }, () => new Animated.Value(1))
  ).current;
  // Animation for achievement badge
  const achievementAnim = useRef(new Animated.Value(0)).current;
  // Animation for progress ring
  const progressAnim = useRef(new Animated.Value(0)).current;
  // ScrollView ref for tour
  const scrollViewRef = useRef<ScrollView>(null);

  const showAchievementBadge = (text: string) => {
    setAchievementText(text);
    setShowAchievement(true);

    Animated.sequence([
      Animated.spring(achievementAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.delay(2000),
      Animated.timing(achievementAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start(() => setShowAchievement(false));
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };


  const generateWeeklyChallenge = () => {
    if (!completedWorkouts) return;

    const challenges = [
      { title: 'Complete 5 Workouts', target: 5 },
      { title: 'Burn 1500 Calories', target: 1500 },
      { title: 'Exercise 200 Minutes', target: 200 },
      { title: '7-Day Streak', target: 7 },
    ];

    const randomChallenge = challenges[Math.floor(Math.random() * challenges.length)];
    const current = randomChallenge.title.includes('Workout') ? completedWorkouts.size :
                   randomChallenge.title.includes('Calorie') ? completedWorkouts.size * 300 :
                   randomChallenge.title.includes('Minute') ? completedWorkouts.size * 45 :
                   streak;

    setWeeklyChallenge({ ...randomChallenge, current });
  };


  // Load actual workout plan on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadWorkoutPlan();
        await loadCompletedWorkoutsFromStorage();
        if (user?.id) {
          workoutService.setUserId(user.id);
          await loadCompletedWorkouts();
        }

        // Set time of day for gradient
        const hour = new Date().getHours();
        if (hour < 12) {
          setTimeOfDay('morning');
        } else if (hour < 17) {
          setTimeOfDay('afternoon');
        } else if (hour < 20) {
          setTimeOfDay('evening');
        } else {
          setTimeOfDay('night');
        }
      } catch (error) {
        console.error('Error loading workout data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  // Generate weekly challenge when completed workouts or streak changes
  useEffect(() => {
    if (completedWorkouts && completedWorkouts.size >= 0) {
      generateWeeklyChallenge();
    }
  }, [completedWorkouts, streak]);

  // Reset currentWeek if it exceeds the new plan's max week
  useEffect(() => {
    if (selectedPlan) {
      const maxWeek = getMaxWeek();
      if (currentWeek > maxWeek) {
        setCurrentWeek(maxWeek);
      }
    }
  }, [selectedPlan]);

  // Initialize tour - DISABLED
  // Tours are disabled globally

  // Tour steps - positions are ABSOLUTE on screen (after scrolling)
  // The highlightArea.y is the position on screen AFTER scrolling to scrollToY
  const tourSteps: TourStep[] = [
    {
      id: 'plan',
      title: t('tour.workout.step1'),
      description: t('tour.workout.step1Desc'),
      scrollToY: 0,
      highlightArea: { x: 20, y: 100, width: width - 40, height: 65, borderRadius: 12 },
    },
    {
      id: 'week',
      title: t('tour.workout.step2'),
      description: t('tour.workout.step2Desc'),
      scrollToY: 0,
      highlightArea: { x: 30, y: 177, width: width - 60, height: 43, borderRadius: 12 },
    },
    {
      id: 'honeycomb',
      title: t('tour.workout.step3'),
      description: t('tour.workout.step3Desc'),
      scrollToY: 0,
      highlightArea: { x: (width - 315) / 2, y: 215, width: 315, height: 315, borderRadius: 157.5 },
    },
    {
      id: 'actions',
      title: t('tour.workout.step4'),
      description: t('tour.workout.step4Desc'),
      scrollToY: 400,
      highlightArea: { x: 20, y: 308, width: width - 40, height: 97, borderRadius: 16 },
    },
    {
      id: 'challenge',
      title: t('tour.workout.step5'),
      description: t('tour.workout.step5Desc'),
      scrollToY: 450,
      highlightArea: { x: 20, y: 384, width: width - 40, height: 160, borderRadius: 16 },
    },
    {
      id: 'timer',
      title: t('tour.workout.step6'),
      description: t('tour.workout.step6Desc'),
      scrollToY: 450,
      highlightArea: { x: 20, y: 570, width: width - 40, height: 59, borderRadius: 16 },
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
    await markTourComplete('TestingScreen');
    setShowTour(false);
    setTourStep(0);
  };

  // Pulse animation for today's workout
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  // Reload workout plan when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadWorkoutPlan();
      loadCompletedWorkoutsFromStorage();
      loadCompletedWorkouts();
    }, [])
  );


  const loadWorkoutPlan = async () => {
    const plan = await getSelectedWorkoutPlan();
    if (plan) {
      setSelectedPlan(plan);
      // Calculate today's workout index (0 = Monday, 6 = Sunday)
      const today = new Date().getDay();
      const todayAdjusted = today === 0 ? 6 : today - 1; // Convert Sunday from 0 to 6
      setTodayIndex(todayAdjusted);
    }
  };

  const loadCompletedWorkoutsFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem('completedWorkouts');
      if (stored) {
        const completedArray = JSON.parse(stored);

        // Migrate old format (week-day) to new format (planId-week-day)
        // Use 'legacy' as plan ID for old data so it persists across plan changes
        let needsMigration = false;
        const migratedArray = completedArray.map((key: string) => {
          const parts = key.split('-');
          // If it's old format (2 parts: week-day), convert to legacy format
          if (parts.length === 2) {
            needsMigration = true;
            return `legacy-${key}`;
          }
          // Already in new format (3 parts: planId-week-day)
          return key;
        });

        setCompletedWorkouts(new Set(migratedArray));

        // Save migrated data back to storage only if migration occurred
        if (needsMigration) {
          await AsyncStorage.setItem('completedWorkouts', JSON.stringify(migratedArray));
        }
      }

      // Load and calculate streak
      await calculateCurrentStreak();
    } catch (error) {
      console.error('Error loading completed workouts from storage:', error);
    }
  };

  const calculateCurrentStreak = async () => {
    const lastWorkoutDate = await AsyncStorage.getItem('lastWorkoutDate');
    const streakStartDate = await AsyncStorage.getItem('streakStartDate');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!streakStartDate) {
      setStreak(0);
      return;
    }

    const startDate = new Date(streakStartDate);
    const lastWorkout = lastWorkoutDate ? new Date(lastWorkoutDate) : null;

    // Check if streak is broken
    if (lastWorkout) {
      const daysSince = Math.floor((today.getTime() - lastWorkout.getTime()) / (1000 * 60 * 60 * 24));

      // Check if we missed a workout day (not counting rest days)
      const weekWorkouts = getWeekWorkouts();
      let missedWorkout = false;

      for (let i = 1; i <= daysSince; i++) {
        const checkDate = new Date(lastWorkout);
        checkDate.setDate(checkDate.getDate() + i);
        const checkDay = checkDate.getDay() === 0 ? 6 : checkDate.getDay() - 1;
        const dayWorkout = weekWorkouts[checkDay];

        if (!dayWorkout?.name?.toLowerCase().includes('rest')) {
          missedWorkout = true;
          break;
        }
      }

      if (missedWorkout) {
        setStreak(0);
        await AsyncStorage.removeItem('streakStartDate');
        return;
      }
    }

    // Calculate streak in days
    const streakDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    setStreak(streakDays);
  };

  const saveCompletedWorkoutsToStorage = async (completed: Set<string>) => {
    try {
      const completedArray = Array.from(completed);
      await AsyncStorage.setItem('completedWorkouts', JSON.stringify(completedArray));
    } catch (error) {
      console.error('Error saving completed workouts to storage:', error);
    }
  };

  const loadCompletedWorkouts = async () => {
    if (!user?.id) return;
    try {
      // For now, just load from AsyncStorage
      await loadCompletedWorkoutsFromStorage();
    } catch (error) {
      console.error('Error loading completed workouts:', error);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = async () => {
    console.log('🔄 [WORKOUT TAB] Pull-to-refresh triggered');
    setRefreshing(true);
    try {
      await Promise.all([
        loadWorkoutPlan(),
        loadCompletedWorkoutsFromStorage(),
        loadCompletedWorkouts()
      ]);
      console.log('✅ [WORKOUT TAB] Refresh completed successfully');
    } catch (error) {
      console.error('❌ [WORKOUT TAB] Error refreshing workout data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Get workout intensity level
  const getWorkoutIntensity = (workoutName: string) => {
    const nameLower = workoutName.toLowerCase();
    if (nameLower.includes('rest')) return 0;
    if (nameLower.includes('leg') || nameLower.includes('full')) return 3;
    if (nameLower.includes('chest') || nameLower.includes('back')) return 2;
    if (nameLower.includes('arm') || nameLower.includes('shoulder')) return 2;
    if (nameLower.includes('abs') || nameLower.includes('core')) return 1;
    return 2;
  };

  // Get progress ring color based on completion percentage
  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return colors.border; // Light gray for 0%
    return colors.primaryAction; // Use gym primary color for any progress
  };

  // Calculate calories for a workout based on duration and intensity
  const getWorkoutCalories = (workout: WorkoutDay) => {
    if (workout.name.toLowerCase().includes('rest')) return 0;

    // Parse duration from string like "60 min" or "75 min"
    const durationMatch = workout.duration.match(/\d+/);
    const duration = durationMatch ? parseInt(durationMatch[0]) : 45;

    const intensity = getWorkoutIntensity(workout.name);
    const baseCaloriesPerMin = 5;

    return Math.round(duration * baseCaloriesPerMin * intensity);
  };

  // Get total minutes from completed workouts
  const getTotalMinutes = () => {
    if (!selectedPlan || !completedWorkouts) return 0;
    const weekWorkouts = getWeekWorkouts();
    const planId = selectedPlan?.id || selectedPlan?.name || 'default';

    return weekWorkouts.reduce((total, workout, index) => {
      const workoutKey = `${planId}-${currentWeek}-${index}`;
      if (completedWorkouts.has(workoutKey)) {
        const durationMatch = workout.duration.match(/\d+/);
        const duration = durationMatch ? parseInt(durationMatch[0]) : 45;
        return total + duration;
      }
      return total;
    }, 0);
  };

  // Get total calories from completed workouts
  const getTotalCalories = () => {
    if (!selectedPlan || !completedWorkouts) return 0;
    const weekWorkouts = getWeekWorkouts();
    const planId = selectedPlan?.id || selectedPlan?.name || 'default';

    return weekWorkouts.reduce((total, workout, index) => {
      const workoutKey = `${planId}-${currentWeek}-${index}`;
      if (completedWorkouts.has(workoutKey)) {
        return total + getWorkoutCalories(workout);
      }
      return total;
    }, 0);
  };

  // Get maximum week for the selected plan
  const getMaxWeek = () => {
    if (!selectedPlan) return 8; // Default fallback

    // If plan has a weeks property, use it
    if (selectedPlan.weeks) return selectedPlan.weeks;

    // Otherwise calculate from total workouts
    if (selectedPlan.workouts && selectedPlan.workouts.length > 0) {
      return Math.ceil(selectedPlan.workouts.length / 7);
    }

    return 8; // Default fallback
  };

  // Map workout names to logo assets
  const getWorkoutLogo = (workoutName: string) => {
    const nameLower = workoutName.toLowerCase();

    // Check for specific workout types
    if (nameLower.includes('chest') && nameLower.includes('tricep')) return workoutLogos.chest;
    if (nameLower.includes('back') && nameLower.includes('bicep')) return workoutLogos.back;
    if (nameLower.includes('push')) return workoutLogos.push;
    if (nameLower.includes('pull')) return workoutLogos.pull;
    if (nameLower.includes('leg')) return workoutLogos.legs;
    if (nameLower.includes('shoulder') && nameLower.includes('ab')) return workoutLogos.shoulders;
    if (nameLower.includes('shoulder')) return workoutLogos.shoulders;
    if (nameLower.includes('abs') || nameLower.includes('core')) return workoutLogos.abs;
    if (nameLower.includes('arm')) return workoutLogos.arms;
    if (nameLower.includes('full body') || nameLower.includes('total')) return workoutLogos.fullbody;
    if (nameLower.includes('rest') || nameLower.includes('recovery')) return workoutLogos.rest;

    // Default to full body
    return workoutLogos.fullbody;
  };

  const handleWorkoutPress = (workout: WorkoutDay, dayIndex: number) => {
    const planId = selectedPlan?.id || selectedPlan?.name || 'default';
    const workoutKey = `${planId}-${currentWeek}-${dayIndex}`;

    // Light haptic feedback on press
    Vibration.vibrate(10);

    // Only prevent if completed on CURRENT plan
    if (completedWorkouts.has(workoutKey)) {
      Alert.alert(
        'Workout Completed',
        'You already completed this workout on this plan! Great job!',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Prevent completing future workouts (only for current week)
    if (currentWeek === 1 && todayIndex >= 0) {
      // Check if this workout is in the future
      if (dayIndex > todayIndex) {
        Alert.alert(
          'Future Workout',
          `This workout is scheduled for ${workout.day}. You can complete it when that day arrives!`,
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }
    }

    if (workout.name.toLowerCase().includes('rest')) {
      const restMessages = [
        'Rest Day! Your muscles grow during recovery. Stay hydrated! 💧',
        'Recovery time! Light stretching and good nutrition today! 🧘',
        'Rest Day! Your body is rebuilding stronger. Enjoy the break! 💪',
        'Recovery mode! Focus on mobility and relaxation today! 🌟'
      ];

      // Automatically mark rest day as complete
      markWorkoutComplete(dayIndex);

      Alert.alert(
        'Rest Day 🛌',
        restMessages[Math.floor(Math.random() * restMessages.length)],
        [
          { text: 'OK', style: 'cancel' }
        ]
      );
      return;
    } else if (workout.exercises && workout.exercises.length > 0) {
      // Navigate to workout detail screen with callback to mark as complete
      (navigation as any).navigate('WorkoutDetail', {
        workout,
        planName: selectedPlan?.name || 'Workout Plan',
        dayIndex,
        onComplete: () => {
          markWorkoutComplete(dayIndex);
        }
      });
    } else {
      Alert.alert('Workout Day', `${workout.name}\nFocus: ${workout.focusArea}\nDuration: ${workout.duration}`);
    }
  };

  const resetCompletedWorkouts = async () => {
    Alert.alert(
      'Reset Week',
      'This will clear all completed workouts for this week. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear UI state
              setCompletedWorkouts(new Set());

              // Clear ALL workout-related AsyncStorage keys
              await AsyncStorage.removeItem('completedWorkouts');
              await AsyncStorage.removeItem('lastWorkoutDate');
              await AsyncStorage.removeItem('lastWorkoutCompletionDate');

              // Note: We can't easily delete Firebase workout history without a delete function
              // The dashboard will check AsyncStorage first, so clearing that should be enough

              Alert.alert('Reset Complete', 'All workouts have been reset for this week!');
            } catch (error) {
              console.error('Error resetting workouts:', error);
              Alert.alert('Error', 'Failed to reset workouts. Please try again.');
            }
          }
        }
      ]
    );
  };

  const markWorkoutComplete = async (dayIndex: number) => {
    const planId = selectedPlan?.id || selectedPlan?.name || 'default';
    const workoutKey = `${planId}-${currentWeek}-${dayIndex}`;
    const newCompleted = new Set(completedWorkouts);
    newCompleted.add(workoutKey);
    setCompletedWorkouts(newCompleted);

    // Save to Firebase
    try {
      const weekWorkouts = getWeekWorkouts();
      const workout = weekWorkouts[dayIndex];
      if (user && workout) {
        const workoutData = {
          userId: user.id,
          workoutName: workout.name,
          focusArea: workout.focusArea,
          duration: workout.duration,
          week: currentWeek,
          dayIndex: dayIndex,
          completedAt: serverTimestamp(),
          date: new Date().toISOString(),
          exercises: workout.exercises || [],
          isRestDay: workout.name.toLowerCase().includes('rest')
        };

        // Save to Firestore
        const docRef = doc(collection(db, 'completedWorkouts'));
        await setDoc(docRef, workoutData);
        console.log('Workout saved to Firebase!');

        // Increment daily workout count
        await firebaseDailyDataService.incrementWorkoutCount(user.id);

        // Log calories burned for this workout
        if (!workout.name.toLowerCase().includes('rest')) {
          // Parse duration (e.g., "60 min" -> 60)
          const durationMatch = workout.duration.match(/(\d+)/);
          const durationMinutes = durationMatch ? parseInt(durationMatch[1]) : 45;

          // Determine intensity based on workout name/focus area
          let intensity: 'light' | 'moderate' | 'vigorous' = 'moderate';
          const workoutName = workout.name.toLowerCase();
          const focusArea = workout.focusArea?.toLowerCase() || '';

          if (workoutName.includes('hiit') || workoutName.includes('intense') ||
              focusArea.includes('hiit') || focusArea.includes('cardio')) {
            intensity = 'vigorous';
          } else if (workoutName.includes('yoga') || workoutName.includes('stretch') ||
                     workoutName.includes('mobility') || focusArea.includes('recovery')) {
            intensity = 'light';
          }

          // Calculate and log calories
          const calories = calorieTrackingService.calculateWorkoutCalories(
            durationMinutes,
            intensity
          );

          await calorieTrackingService.logWorkoutCalories(
            workoutKey,
            calories,
            new Date()
          );

          console.log(`✅ Logged ${calories} calories for workout: ${workout.name}`);
        }
      }
    } catch (error) {
      console.error('Failed to save workout to Firebase:', error);
      // Still continue with local saving even if Firebase fails
    }

    // Update streak tracking using the proper service
    await updateWorkoutStreak();

    // Update streak tracking (legacy code for compatibility)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    await AsyncStorage.setItem('lastWorkoutDate', todayStr);

    // Start or maintain streak
    const streakStart = await AsyncStorage.getItem('streakStartDate');
    if (!streakStart || streak === 0) {
      await AsyncStorage.setItem('streakStartDate', todayStr);
      setStreak(1);
    } else {
      await calculateCurrentStreak();
    }

    // Haptic feedback for completion
    Vibration.vibrate([0, 50, 100, 50]);

    // Animate the completion with bounce effect
    Animated.sequence([
      Animated.timing(completionAnims[dayIndex], {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(completionAnims[dayIndex], {
        toValue: 1.15,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(completionAnims[dayIndex], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();

    // Check for achievements
    const weekCompleted = Array.from(newCompleted).filter(key =>
      key.startsWith(`${planId}-${currentWeek}-`)
    ).length;

    if (weekCompleted === 1 && currentWeek === 1) {
      showAchievementBadge('First Workout!');
    } else if (weekCompleted === 3) {
      showAchievementBadge('Halfway There!');
    } else if (weekCompleted === 5) {
      showAchievementBadge('Almost Done!');
    } else if (weekCompleted === 7) {
      showAchievementBadge('Week Complete!');
      triggerConfetti();
    }

    // Save to AsyncStorage
    await saveCompletedWorkoutsToStorage(newCompleted);

    // Save to database if user is logged in
    if (user?.id) {
      try {
        const weekWorkouts = getWeekWorkouts();
        const workout = weekWorkouts[dayIndex];
        if (workout && workoutService.logWorkout) {
          await workoutService.logWorkout({
            name: workout.name,
            exercises: workout.exercises || [],
            duration: 45, // Default duration
            caloriesBurned: 300, // Default calories
            date: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Error saving workout to database:', error);
      }
    }

  };

  // Get completed count for current week and plan
  const getCompletedCount = () => {
    if (!selectedPlan || !completedWorkouts) return 0;
    const weekWorkouts = getWeekWorkouts();
    const planId = selectedPlan?.id || selectedPlan?.name || 'default';
    return weekWorkouts.filter((_, index) => {
      const workoutKey = `${planId}-${currentWeek}-${index}`;
      // Only count current plan completions
      return completedWorkouts.has(workoutKey);
    }).length;
  };

  // Get the workouts for the current week
  const getWeekWorkouts = () => {
    // Always return 7 days for a complete week
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    if (selectedPlan?.workouts && selectedPlan.workouts.length > 0) {
      const startIndex = (currentWeek - 1) * 7;
      const weekWorkouts = selectedPlan.workouts.slice(startIndex, startIndex + 7);

      // Ensure we always have 7 days, fill with rest days if needed
      while (weekWorkouts.length < 7) {
        const dayIndex = weekWorkouts.length;
        weekWorkouts.push({
          id: `rest-${dayIndex}`,
          day: weekDays[dayIndex],
          name: 'Rest Day',
          focusArea: 'Recovery',
          duration: '0 min',
          exercises: []
        });
      }

      // Ensure all workouts have proper day names set
      return weekWorkouts.map((workout, index) => ({
        ...workout,
        day: weekDays[index]
      }));
    }

    // Default workouts if no plan selected
    return [
      { id: '1', day: 'Monday', name: 'Chest & Triceps', focusArea: 'Upper Body Push', duration: '60 min', exercises: [] },
      { id: '2', day: 'Tuesday', name: 'Back & Biceps', focusArea: 'Upper Body Pull', duration: '60 min', exercises: [] },
      { id: '3', day: 'Wednesday', name: 'Rest Day', focusArea: 'Recovery', duration: '0 min', exercises: [] },
      { id: '4', day: 'Thursday', name: 'Legs', focusArea: 'Lower Body', duration: '75 min', exercises: [] },
      { id: '5', day: 'Friday', name: 'Shoulders & Abs', focusArea: 'Shoulders & Core', duration: '55 min', exercises: [] },
      { id: '6', day: 'Saturday', name: 'Arms', focusArea: 'Arms', duration: '45 min', exercises: [] },
      { id: '7', day: 'Sunday', name: 'Rest Day', focusArea: 'Recovery', duration: '0 min', exercises: [] },
    ];
  };

  const renderHoneycomb = () => {
    const weekWorkouts = getWeekWorkouts();
    const planId = selectedPlan?.id || selectedPlan?.name || 'default';

    // Calculate weekly progress
    const completedCount = getCompletedCount();
    const progressPercentage = (completedCount / 7) * 100;

    // Animate progress ring
    Animated.timing(progressAnim, {
      toValue: progressPercentage,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Function to generate SVG with filled hexagons for completed workouts
    const getHoneycombSvg = () => {
      // Create separate paths for filled hexagons (completed) vs outlined hexagons
      const hexagonPaths = [
        { id: 6, path: "M 331.429688 191.875 L 222.234375 191.875 L 166.136719 96.324219 L 221.234375 0.773438 L 331.429688 0.773438 L 386.527344 96.324219 Z", innerPath: "M 225.550781 184.386719 L 327.109375 184.386719 L 377.886719 96.324219 L 327.109375 8.261719 L 225.550781 8.261719 L 174.773438 96.324219 Z" }, // Sunday (top)
        { id: 0, path: "M 496.761719 287.394531 L 386.566406 287.394531 L 331.46875 191.839844 L 386.566406 96.289062 L 496.761719 96.289062 L 551.859375 191.839844 Z", innerPath: "M 390.886719 279.902344 L 492.445312 279.902344 L 543.222656 191.839844 L 492.445312 103.777344 L 390.886719 103.777344 L 340.109375 191.839844 Z" }, // Monday (right upper)
        { id: 4, path: "M 166.496094 287.394531 L 56.300781 287.394531 L 1.203125 191.839844 L 56.300781 96.289062 L 166.496094 96.289062 L 221.59375 191.839844 Z", innerPath: "M 60.617188 279.902344 L 162.175781 279.902344 L 212.953125 191.839844 L 162.175781 103.777344 L 60.617188 103.777344 L 9.839844 191.839844 Z" }, // Friday (left upper)
        { id: 5, path: "M 331.230469 381.328125 L 222.03125 381.328125 L 165.933594 285.773438 L 221.03125 190.222656 L 331.226562 190.222656 L 386.324219 285.773438 Z", innerPath: "M 225.351562 373.835938 L 326.910156 373.835938 L 377.6875 285.773438 L 326.910156 197.710938 L 225.351562 197.710938 L 174.574219 285.773438 Z" }, // Saturday (center middle)
        { id: 1, path: "M 496.5625 476.84375 L 386.367188 476.84375 L 331.269531 381.292969 L 386.367188 285.738281 L 496.5625 285.738281 L 551.660156 381.292969 Z", innerPath: "M 390.6875 469.355469 L 492.242188 469.355469 L 543.023438 381.292969 L 492.242188 293.230469 L 390.6875 293.230469 L 339.90625 381.292969 Z" }, // Tuesday (right lower)
        { id: 3, path: "M 166.296875 476.84375 L 56.097656 476.84375 L 1 381.292969 L 56.097656 285.738281 L 166.292969 285.738281 L 221.390625 381.292969 Z", innerPath: "M 60.417969 469.355469 L 161.976562 469.355469 L 212.753906 381.292969 L 161.976562 293.230469 L 60.417969 293.230469 L 9.640625 381.292969 Z" }, // Thursday (left lower)
        { id: 2, path: "M 331.429688 572.359375 L 222.234375 572.359375 L 166.136719 476.808594 L 221.234375 381.257812 L 331.429688 381.257812 L 386.527344 476.808594 Z", innerPath: "M 225.550781 564.871094 L 327.109375 564.871094 L 377.886719 476.808594 L 327.109375 388.746094 L 225.550781 388.746094 L 174.773438 476.808594 Z" } // Wednesday (bottom)
      ];

      let svgPaths = '';
      hexagonPaths.forEach(hex => {
        const workoutKey = `${planId}-${currentWeek}-${hex.id}`;
        const isCompletedCurrentPlan = completedWorkouts?.has(workoutKey) || false;

        // Check if completed in other plans (legacy or different plan)
        const isCompletedOtherPlan = !isCompletedCurrentPlan && completedWorkouts && Array.from(completedWorkouts).some(key => {
          const parts = key.split('-');
          if (parts.length === 3) {
            const [keyPlanId, week, day] = parts;
            return parseInt(week) === currentWeek && parseInt(day) === hex.id && keyPlanId !== planId;
          }
          return false;
        });

        // Always add a subtle darker fill first
        svgPaths += `<path fill="#000000" d="${hex.innerPath}" fill-opacity="0.08"/>`;

        if (isCompletedCurrentPlan) {
          // Teal fill for current plan completions
          svgPaths += `<path fill="#5B8FA3" d="${hex.innerPath}" fill-opacity="0.3"/>`;
        } else if (isCompletedOtherPlan) {
          // Gray fill for other plan completions
          svgPaths += `<path fill="${colors.textSecondary}" d="${hex.innerPath}" fill-opacity="0.2"/>`;
        }

        // Draw clean stroke border
        svgPaths += `<path fill="none" stroke="${colors.border}" stroke-width="2" d="${hex.innerPath}"/>`;
      });

      return `<svg xmlns="http://www.w3.org/2000/svg" width="315" height="315" viewBox="0 0 595.5 585" preserveAspectRatio="xMidYMid meet" version="1.0"><g transform="matrix(0.88, 0, 0, 0.88, 60, 52)">${svgPaths}</g></svg>`;
    };

    const honeycombSvg = getHoneycombSvg();

    // Hexagon positions matching the actual SVG layout (adjusted for centered 315x315 container with 0.88 scale)
    // Clockwise from top: Sun, Mon, Tue, Wed, Thu, Fri, and Sat in middle
    const hexPositions = [
      { x: 235, y: 110 },   // Monday - Right upper
      { x: 235, y: 194 },   // Tuesday - Right lower
      { x: 158, y: 242 },   // Wednesday - Bottom center
      { x: 85, y: 194 },    // Thursday - Left lower
      { x: 85, y: 110 },    // Friday - Left upper
      { x: 158, y: 151 },   // Saturday - Center middle
      { x: 158, y: 62 },    // Sunday - Top center
    ];

    return (
      <View
        style={styles.honeycombContainer}
        onLayout={(event) => {
          event.target.measure((x, y, width, height, pageX, pageY) => {
            console.log('📍 HONEYCOMB Y:', pageY, 'HEIGHT:', height);
          });
        }}
      >
        {/* Progress Ring */}
        <View style={styles.progressRingContainer}>
          <Svg width="315" height="315" style={styles.progressRingSvg}>
            {/* Full gray background circle */}
            <Circle
              cx="157.5"
              cy="157.5"
              r="147"
              stroke={colors.border}
              strokeWidth="6"
              fill="none"
              strokeOpacity={0.3}
            />
            {/* Animated progress circle on top */}
            <G transform="rotate(-90 157.5 157.5)">
              <AnimatedCircle
                cx="157.5"
                cy="157.5"
                r="147"
                stroke={getProgressColor(progressPercentage)}
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 147}`}
                strokeDashoffset={progressAnim.interpolate({
                  inputRange: [0, 100],
                  outputRange: [2 * Math.PI * 147, 0],
                })}
                strokeLinecap="round"
              />
            </G>
          </Svg>
        </View>

        {/* Background honeycomb structure */}
        <SvgXml
          key={`honeycomb-${selectedPlan?.id || 'default'}-${currentWeek}`}
          xml={honeycombSvg}
          width="315"
          height="315"
        />

        {/* Workout logo overlays */}
        {hexPositions.map((pos, index) => {
          const workout = weekWorkouts[index];
          if (!workout) return null;
          const isToday = index === todayIndex && currentWeek === 1;
          const isCompletedCurrentPlan = completedWorkouts?.has(`${planId}-${currentWeek}-${index}`) || false;

          // Check if completed in other plans (legacy or different plan)
          const isCompletedOtherPlan = !isCompletedCurrentPlan && completedWorkouts && Array.from(completedWorkouts).some(key => {
            const parts = key.split('-');
            if (parts.length === 3) {
              const [keyPlanId, week, day] = parts;
              return parseInt(week) === currentWeek && parseInt(day) === index && keyPlanId !== planId;
            }
            return false;
          });

          return (
            <Animated.View
              key={`workout-${index}`}
              style={[
                styles.hexOverlay,
                { left: pos.x - 40, top: pos.y - 40 },
                {
                  transform: [{ scale: completionAnims[index] }],
                }
              ]}
            >
              <TouchableOpacity
                onPress={() => handleWorkoutPress(workout, index)}
                activeOpacity={0.7}
                style={styles.hexTouchable}
              >
                {isToday && !isCompletedCurrentPlan && !isCompletedOtherPlan && (
                  <Animated.View
                    style={[
                      styles.todayGlow,
                      {
                        transform: [{ scale: pulseAnim }],
                      }
                    ]}
                  />
                )}
                <Image
                  source={getWorkoutLogo(workout.name)}
                  style={[
                    styles.workoutLogo,
                    (isCompletedCurrentPlan || isCompletedOtherPlan) && styles.completedLogo,
                    !(isCompletedCurrentPlan || isCompletedOtherPlan) && { tintColor: colors.primaryAction }
                  ]}
                  resizeMode="contain"
                />
                <Text style={[
                  styles.dayLabel,
                  isToday && !isCompletedCurrentPlan && !isCompletedOtherPlan && styles.todayLabel,
                  isCompletedCurrentPlan && styles.completedLabel,
                  isCompletedOtherPlan && styles.otherPlanLabel
                ]}>
                  {isCompletedCurrentPlan ? '✓' : isCompletedOtherPlan ? '•' : isToday ? 'TODAY' : getShortDayName(workout.day)}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>
    );
  };

  // Loading State
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <CustomHeader />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryAction} />
          <Text style={styles.loadingText}>Loading your workout plan...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Achievement Badge */}
      {showAchievement && (
        <Animated.View
          style={[
            styles.achievementBadge,
            {
              transform: [
                {
                  translateY: achievementAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-100, 0],
                  })
                },
                { scale: achievementAnim }
              ],
              opacity: achievementAnim,
            }
          ]}
        >
          <Text style={styles.achievementText}>{achievementText}</Text>
        </Animated.View>
      )}

      {/* Confetti Effect */}
      {showConfetti && (
        <View style={styles.confettiContainer}>
          {[...Array(20)].map((_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confetti,
                {
                  left: `${Math.random() * 100}%`,
                  backgroundColor: [colors.accent, colors.info][Math.floor(Math.random() * 2)],
                  transform: [
                    {
                      translateY: new Animated.Value(0).interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 500]
                      })
                    },
                    { rotate: `${Math.random() * 360}deg` }
                  ]
                }
              ]}
            />
          ))}
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primaryAction}
            colors={[colors.primaryAction]}
          />
        }
      >
        {/* Screen Title */}
        <View style={styles.headerSection}>
          <View style={{ width: 40 }} />
          <View style={styles.titleContainer}>
            <Text style={styles.screenTitle}>Workouts</Text>
            {selectedPlan && (
              <TouchableOpacity
                onPress={() => (navigation as any).navigate('WorkoutPlanSelection')}
                activeOpacity={0.7}
                style={styles.planSubtitle}
              >
                <Text style={styles.planSubtitleText}>{selectedPlan.name}</Text>
                <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            {!selectedPlan && (
              <TouchableOpacity
                onPress={() => (navigation as any).navigate('WorkoutPlanSelection')}
                activeOpacity={0.7}
                style={styles.planSubtitle}
              >
                <Text style={styles.planSubtitleText}>No plan selected</Text>
                <MaterialCommunityIcons name="chevron-down" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            onPress={() => (navigation as any).navigate('EditWeek', { currentWeek })}
            style={styles.settingsButton}
            activeOpacity={0.6}
          >
            <MaterialCommunityIcons name="pencil" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* View Mode Toggle */}
        <View style={styles.viewModeToggle}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'honeycomb' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('honeycomb')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="hexagon-multiple"
              size={20}
              color={viewMode === 'honeycomb' ? colors.text : colors.textSecondary}
            />
            <Text style={[styles.viewModeText, viewMode === 'honeycomb' && styles.viewModeTextActive]}>
              Honeycomb
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
            onPress={() => setViewMode('list')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={20}
              color={viewMode === 'list' ? colors.text : colors.textSecondary}
            />
            <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>
              List
            </Text>
          </TouchableOpacity>
        </View>

        {/* Empty State - No Plan Selected */}
        {!selectedPlan && (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateIconContainer}>
              <MaterialCommunityIcons name="dumbbell" size={64} color={colors.textSecondary} />
            </View>
            <Text style={styles.emptyStateTitle}>No Workout Plan Selected</Text>
            <Text style={styles.emptyStateSubtitle}>
              Choose a professional workout plan tailored to your goals and fitness level
            </Text>
            <TouchableOpacity
              style={styles.emptyStateCTA}
              onPress={() => (navigation as any).navigate('WorkoutPlanSelection')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="compass-outline" size={20} color={colors.text} />
              <Text style={styles.emptyStateCTAText}>Browse Workout Plans</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* HONEYCOMB VIEW */}
        {viewMode === 'honeycomb' && (
          <>
            {/* Honeycomb Card Container */}
            <View style={styles.honeycombCard}>
              {/* Week Label with Navigation */}
              <View style={styles.weekLabel}>
                <View style={styles.weekHeader}>
                  <TouchableOpacity
                    style={styles.resetButton}
                    onPress={resetCompletedWorkouts}
                  >
                    <MaterialCommunityIcons name="refresh" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.weekArrowButton, currentWeek === 1 && styles.disabledButton]}
                    onPress={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
                    disabled={currentWeek === 1}
                  >
                    <MaterialCommunityIcons name="chevron-left" size={24} color={currentWeek === 1 ? colors.border : colors.text} />
                  </TouchableOpacity>
                  <Text style={styles.weekText}>{t('workouts.week')} {currentWeek}</Text>
                  <TouchableOpacity
                    style={[styles.weekArrowButton, currentWeek === getMaxWeek() && styles.disabledButton]}
                    onPress={() => setCurrentWeek(Math.min(getMaxWeek(), currentWeek + 1))}
                    disabled={currentWeek === getMaxWeek()}
                  >
                    <MaterialCommunityIcons name="chevron-right" size={24} color={currentWeek === getMaxWeek() ? colors.border : colors.text} />
                  </TouchableOpacity>
                </View>
                <View style={styles.weekLine} />
              </View>

              {/* Honeycomb with workout logos */}
              {!selectedPlan ? (
                <View style={styles.honeycombLoadingContainer}>
                  <ActivityIndicator size="large" color={colors.textSecondary} />
                  <Text style={styles.honeycombLoadingText}>Loading workouts...</Text>
                </View>
              ) : (
                renderHoneycomb()
              )}
            </View>

            {/* Start Today's Workout Button */}
            {currentWeek === 1 && todayIndex >= 0 && todayIndex < 7 && (
              <TouchableOpacity
                style={styles.startTodayButton}
                onPress={() => {
                  const weekWorkouts = getWeekWorkouts();
                  const todayWorkout = weekWorkouts[todayIndex];
                  if (todayWorkout) {
                    handleWorkoutPress(todayWorkout, todayIndex);
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={styles.startButtonInner}>
                  <MaterialCommunityIcons name="play-circle-outline" size={20} color={colors.text} />
                  <Text style={styles.startButtonText}>{t('workouts.startTodaysWorkout')}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.text} />
                </View>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* LIST VIEW */}
        {viewMode === 'list' && (
          <>
            {/* Weekly Progress Card */}
            <View style={styles.weeklyProgressCard}>
              {/* Week Navigation */}
              <View style={styles.weekNavigation}>
                <TouchableOpacity
                  style={[styles.weekArrowButton, currentWeek === 1 && styles.disabledButton]}
                  onPress={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
                  disabled={currentWeek === 1}
                >
                  <MaterialCommunityIcons name="chevron-left" size={24} color={currentWeek === 1 ? colors.border : colors.text} />
                </TouchableOpacity>
                <Text style={styles.weekTitle}>Week {currentWeek}</Text>
                <TouchableOpacity
                  style={[styles.weekArrowButton, currentWeek === getMaxWeek() && styles.disabledButton]}
                  onPress={() => setCurrentWeek(Math.min(getMaxWeek(), currentWeek + 1))}
                  disabled={currentWeek === getMaxWeek()}
                >
                  <MaterialCommunityIcons name="chevron-right" size={24} color={currentWeek === getMaxWeek() ? colors.border : colors.text} />
                </TouchableOpacity>
              </View>

              {/* Progress Summary */}
              <View style={styles.progressSummary}>
                <Text style={styles.progressNumber}>{getCompletedCount()}/7</Text>
                <Text style={styles.progressLabel}>Workouts Completed</Text>
              </View>

              {/* Progress Bar */}
              <View style={styles.weekProgressBar}>
                <View style={[styles.weekProgressFill, { width: `${(getCompletedCount() / 7) * 100}%` }]} />
              </View>

              {/* Daily Workout List */}
              <View style={styles.dailyWorkoutList}>
                {getWeekWorkouts().map((workout, index) => {
                  const planId = selectedPlan?.id || 'unknown';
                  const workoutKey = `${planId}-${currentWeek}-${index}`;
                  const isCompleted = completedWorkouts?.has(workoutKey) || false;
                  const isToday = index === todayIndex && currentWeek === 1;

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dailyWorkoutItem,
                        isCompleted && styles.completedWorkoutItem,
                        isToday && styles.todayWorkoutItem
                      ]}
                      onPress={() => handleWorkoutPress(workout, index)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.workoutDayInfo}>
                        <Text style={[styles.workoutDay, isCompleted && styles.completedText]}>
                          {isToday ? 'Today' : getDayName(workout.day)}
                        </Text>
                        <Text style={[styles.workoutName, isCompleted && styles.completedText]} numberOfLines={1}>
                          {workout.name}
                        </Text>
                      </View>
                      {isCompleted ? (
                        <MaterialCommunityIcons name="check-circle" size={24} color={colors.primaryAction} />
                      ) : isToday ? (
                        <MaterialCommunityIcons name="play-circle" size={24} color={colors.primaryAction} />
                      ) : (
                        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Weekly Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="timer" size={20} color={BRAND_COLORS.secondaryMuted} />
                  <Text style={styles.statItemValue}>{getTotalMinutes()}</Text>
                  <Text style={styles.statItemLabel}>min</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="lightning-bolt" size={20} color={colors.primaryAction} />
                  <Text style={styles.statItemValue}>{getTotalCalories()}</Text>
                  <Text style={styles.statItemLabel}>cal</Text>
                </View>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="calendar-check" size={20} color={colors.info} />
                  <Text style={styles.statItemValue}>{7 - getCompletedCount()}</Text>
                  <Text style={styles.statItemLabel}>left</Text>
                </View>
              </View>
            </View>

            {/* Today's Workout Card */}
            {currentWeek === 1 && todayIndex >= 0 && todayIndex < 7 && (
              <TouchableOpacity
                style={styles.todayWorkoutCard}
                onPress={() => {
                  const weekWorkouts = getWeekWorkouts();
                  const todayWorkout = weekWorkouts[todayIndex];
                  if (todayWorkout) {
                    handleWorkoutPress(todayWorkout, todayIndex);
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={styles.todayHeader}>
                  <MaterialCommunityIcons name="fire" size={24} color={colors.primaryAction} />
                  <Text style={styles.todayTitle}>Ready to Workout?</Text>
                </View>
                <Text style={styles.todayWorkoutName}>
                  {getWeekWorkouts()[todayIndex]?.name}
                </Text>
                <View style={styles.startWorkoutButton}>
                  <Text style={styles.startWorkoutButtonText}>Start Workout</Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Workout Timer */}
        <TouchableOpacity
          style={styles.timerButton}
          onPress={() => {
            startGlobalTimer(60);
            setTimerExpanded(true);
          }}
        >
          <MaterialCommunityIcons name="timer" size={24} color={BRAND_COLORS.secondaryMuted} />
          <Text style={styles.timerButtonText}>Workout Timer</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.quickActionsTitle}>Quick Actions</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10 }}
          >
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => (navigation as any).navigate('WorkoutLog')}
            >
              <MaterialCommunityIcons name="pencil" size={24} color={colors.textSecondary} />
              <Text style={styles.actionText}>Log</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => (navigation as any).navigate('PersonalRecords')}
            >
              <MaterialCommunityIcons name="trophy" size={24} color={colors.textSecondary} />
              <Text style={styles.actionText}>Records</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => (navigation as any).navigate('EditWeek', { currentWeek })}
            >
              <MaterialCommunityIcons name="calendar-edit" size={24} color={colors.textSecondary} />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Weekly Challenge & Stats Combined */}
        <View style={styles.weekStatsCard}>
          {/* Weekly Challenge */}
          {weeklyChallenge && (
            <View style={styles.challengeSectionInCard}>
              <View style={styles.challengeHeader}>
                <MaterialCommunityIcons name="trophy" size={24} color={colors.textSecondary} />
                <Text style={styles.challengeTitle}>Weekly Challenge</Text>
              </View>
              <View style={styles.challengeCardInner}>
                <Text style={styles.challengeName}>{weeklyChallenge.title}</Text>
                <View style={styles.challengeProgress}>
                  <View style={styles.challengeProgressBar}>
                    <View
                      style={[
                        styles.challengeProgressFill,
                        { width: `${(weeklyChallenge.current / weeklyChallenge.target) * 100}%` }
                      ]}
                    />
                  </View>
                  <Text style={styles.challengeProgressText}>
                    {weeklyChallenge.current} / {weeklyChallenge.target}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.challengeRefresh}
                  onPress={generateWeeklyChallenge}
                >
                  <MaterialCommunityIcons name="refresh" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.sectionDivider} />
            </View>
          )}

          {/* This Week's Stats */}
          <View>
            <Text style={styles.weekStatsTitle}>This Week's Stats</Text>
            <View style={styles.weekStatsRow}>
              <View style={styles.weekStatItem}>
                <MaterialCommunityIcons name="clock-outline" size={32} color={BRAND_COLORS.secondaryMuted} />
                <Text style={styles.weekStatValue}>{getTotalMinutes()}</Text>
                <Text style={styles.weekStatLabel}>minutes</Text>
              </View>
              <View style={styles.weekStatDivider} />
              <View style={styles.weekStatItem}>
                <MaterialCommunityIcons name="fire" size={32} color={colors.primaryAction} />
                <Text style={styles.weekStatValue}>{getTotalCalories()}</Text>
                <Text style={styles.weekStatLabel}>calories</Text>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>

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

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 12,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    color: colors.text,
  },
  planSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  planSubtitleText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 200,
  },
  quickFeaturesCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pathContainer: {
    position: 'relative',
    marginTop: 8,
  },
  planSection: {
    marginHorizontal: 16,
    marginTop: 0,
    marginBottom: 16,
    padding: 12,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  currentPlan: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  planWeek: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  emptyStateContainer: {
    marginHorizontal: 16,
    marginTop: 60,
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyStateIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyStateCTA: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  emptyStateCTAText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 0.3,
  },
  quoteContainer: {
    paddingHorizontal: 30,
    marginBottom: 16,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  quoteAuthor: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  honeycombCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginTop: 0,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  weekLabel: {
    alignItems: 'center',
    marginBottom: 16,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  weekArrowButton: {
    padding: 4,
  },
  resetButton: {
    padding: 4,
    marginRight: 10,
  },
  weekText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    letterSpacing: 0.5,
    marginBottom: 0,
  },
  weekLine: {
    width: '80%',
    height: 2,
    backgroundColor: colors.border,
    marginTop: 8,
    borderRadius: 1,
  },
  honeycombContainer: {
    width: 315,
    height: 315,
    alignSelf: 'center',
    position: 'relative',
    marginTop: 0,
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  honeycombLoadingContainer: {
    width: 315,
    height: 315,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: 0,
    gap: 12,
  },
  honeycombLoadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
  },
  progressRingContainer: {
    position: 'absolute',
    width: 315,
    height: 315,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingSvg: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },
  progressTextContainer: {
    position: 'absolute',
    top: 157.5,
    left: 157.5,
    transform: [{ translateX: -50 }, { translateY: -20 }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text,
    lineHeight: 52,
  },
  progressTotal: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: -4,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '500',
  },
  hexOverlay: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hexTouchable: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementBadge: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    backgroundColor: colors.primaryAction,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#2A2A2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  achievementText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  workoutLogo: {
    width: 35,
    height: 35,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    pointerEvents: 'none',
    zIndex: 999,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  featuresSection: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 15,
    gap: 10,
  },
  featureCard: {
    flex: 1,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  featureCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureCardText: {
    alignItems: 'center',
  },
  featureCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  featureCardSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 350,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  reminderToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  reminderToggleLabel: {
    fontSize: 16,
    color: colors.text,
  },
  timePickerSection: {
    marginTop: 20,
  },
  timePickerLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  timeOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeOption: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
  },
  timeOptionActive: {
    backgroundColor: colors.primaryAction,
  },
  timeOptionText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  timeOptionTextActive: {
    color: colors.text,
  },
  modalButton: {
    marginTop: 30,
    backgroundColor: colors.primaryAction,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  videoPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
  },
  videoPlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  exerciseTips: {
    marginTop: 20,
  },
  exerciseTipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  exerciseTip: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    minHeight: 150,
    color: colors.text,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  dayLabel: {
    position: 'absolute',
    bottom: -8,
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  todayLabel: {
    color: colors.primaryAction,
    fontWeight: 'bold',
    fontSize: 14,
  },
  todayGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryAction,
    opacity: 0.3,
  },
  completedLogo: {
    tintColor: '#2A2A2A',
    opacity: 0.8,
  },
  completedLabel: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 16,
  },
  otherPlanLabel: {
    color: colors.textSecondary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 70,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginVertical: 2,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  startTodayButton: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 0,
    backgroundColor: 'transparent',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  startButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  startButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginTop: 0,
    paddingHorizontal: 20,
  },
  weekNavButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
  },
  disabledButton: {
    opacity: 0.5,
  },
  weekNavText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  quickActionsSection: {
    marginHorizontal: 16,
    paddingBottom: 16,
    marginTop: 16,
  },
  quickActionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },
  challengeSection: {
    marginTop: 16,
    marginHorizontal: 16,
    paddingBottom: 16,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  challengeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  challengeCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  challengeName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  challengeProgress: {
    marginTop: 8,
  },
  challengeProgressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: 8,
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: colors.primaryAction,
    borderRadius: 4,
  },
  challengeProgressText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  challengeRefresh: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  timerButton: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 0,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  timerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
  },
  timerDisplay: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.info,
    fontVariant: ['tabular-nums'],
  },
  timerControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 24,
  },
  timerControl: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  presetTimers: {
    borderTopWidth: 1,
    borderTopColor: `${colors.textSecondary}33`,
    paddingTop: 16,
  },
  presetTitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  presetButton: {
    backgroundColor: `${colors.textSecondary}33`,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  presetText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  // New redesigned styles
  weeklyProgressCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  weekNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weekTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  progressSummary: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.text,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  weekProgressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    marginBottom: 16,
    overflow: 'hidden',
  },
  weekProgressFill: {
    height: '100%',
    backgroundColor: colors.primaryAction,
    borderRadius: 4,
  },
  dailyWorkoutList: {
    marginBottom: 16,
  },
  dailyWorkoutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  completedWorkoutItem: {
    opacity: 0.6,
  },
  todayWorkoutItem: {
    backgroundColor: `${colors.primaryAction}10`,
    marginHorizontal: -20,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  workoutDayInfo: {
    flex: 1,
  },
  workoutDay: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statItemValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  statItemLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  todayWorkoutCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  todayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  todayWorkoutName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  startWorkoutButton: {
    backgroundColor: colors.primaryAction,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startWorkoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickActionsCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primaryAction}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  quickActionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  // View Mode Toggle Styles
  viewModeToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    gap: 12,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  viewModeButtonActive: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.text,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  viewModeTextActive: {
    color: colors.text,
  },
  // Weekly Summary Styles
  weeklySummary: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  // This Week's Stats Card (now combined with challenge)
  weekStatsCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  challengeSectionInCard: {
    marginBottom: 20,
  },
  challengeCardInner: {
    position: 'relative',
    paddingTop: 8,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 20,
  },
  weekStatsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  weekStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  weekStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  weekStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  weekStatLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'lowercase',
  },
  weekStatDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
});

// Export TestingScreenContent directly (TourGuideProvider is in App.js)
const TestingScreen: React.FC = () => {
  return <TestingScreenContent />;
};

export default TestingScreen;
