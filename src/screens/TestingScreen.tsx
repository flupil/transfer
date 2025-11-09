import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Text, Animated, Alert, Image, Vibration, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getSelectedWorkoutPlan } from '../services/workoutPlanService';
import { SvgXml, Svg, Circle, G } from 'react-native-svg';
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
import { CustomTourOverlay, TourStep } from '../components/tour/CustomTourOverlay';

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
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [weeklyChallenge, setWeeklyChallenge] = useState<{title: string, target: number, current: number} | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
  // Timer interval ref
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
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

  const startTimer = (duration: number) => {
    // Clear any existing interval first
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }

    setTimerSeconds(duration);
    setIsTimerRunning(true);

    timerInterval.current = setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          stopTimer();
          Alert.alert('Timer Complete!', 'Time to move to the next exercise!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    setIsTimerRunning(false);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  // Load actual workout plan on mount
  useEffect(() => {
    loadWorkoutPlan();
    loadCompletedWorkoutsFromStorage();
    if (user?.id) {
      workoutService.setUserId(user.id);
      loadCompletedWorkouts();
    }


    // Generate weekly challenge
    generateWeeklyChallenge();


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
  }, [user?.id]);

  // Initialize tour
  useEffect(() => {
    const initTour = async () => {
      try {
        console.log('🎯 TestingScreen: Checking if first visit for tour...');
        const isFirst = await isFirstVisit('TestingScreen');
        console.log('🎯 TestingScreen: Is first visit?', isFirst);
        if (isFirst) {
          console.log('🎯 TestingScreen: Starting tour in 1 second...');
          setTimeout(() => {
            console.log('🎯 TestingScreen: SHOWING TOUR NOW!');
            setShowTour(true);
          }, 1000);
        } else {
          console.log('🎯 TestingScreen: Tour already completed, skipping');
        }
      } catch (error) {
        console.error('Tour init error:', error);
      }
    };

    initTour();
  }, []);

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
      highlightArea: { x: (width - 340) / 2, y: 215, width: 340, height: 340, borderRadius: 170 },
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
      // Force refresh when returning to screen
      setRefreshKey(prev => prev + 1);
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

              // Force refresh
              setRefreshKey(prev => prev + 1);

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

    // Force immediate UI update
    setRefreshKey(prev => prev + 1);

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
      showAchievementBadge('First Workout! ðŸ”¥');
    } else if (weekCompleted === 3) {
      showAchievementBadge('Halfway There! ðŸ’ª');
    } else if (weekCompleted === 5) {
      showAchievementBadge('Almost Done! ðŸŽ¯');
    } else if (weekCompleted === 7) {
      showAchievementBadge('Week Complete! ðŸ†');
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
        const isCompletedCurrentPlan = completedWorkouts.has(workoutKey);

        // Check if completed in other plans (legacy or different plan)
        const isCompletedOtherPlan = !isCompletedCurrentPlan && Array.from(completedWorkouts).some(key => {
          const parts = key.split('-');
          if (parts.length === 3) {
            const [keyPlanId, week, day] = parts;
            return parseInt(week) === currentWeek && parseInt(day) === hex.id && keyPlanId !== planId;
          }
          return false;
        });

        if (isCompletedCurrentPlan) {
          // Blue fill for current plan completions
          svgPaths += `<path fill="#4285F4" d="${hex.innerPath}" fill-opacity="0.3"/>`;
        } else if (isCompletedOtherPlan) {
          // Gray fill for other plan completions
          svgPaths += `<path fill="#9CA3AF" d="${hex.innerPath}" fill-opacity="0.2"/>`;
        }

        // Draw clean stroke border
        svgPaths += `<path fill="none" stroke="#4A5568" stroke-width="2" d="${hex.innerPath}"/>`;
      });

      return `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 595.5 585" preserveAspectRatio="xMidYMid meet" version="1.0"><g transform="matrix(1, 0, 0, 1, 21, 11)">${svgPaths}</g></svg>`;
    };

    const honeycombSvg = getHoneycombSvg();

    // Hexagon positions matching the actual SVG layout (adjusted for centered 340x340 container)
    // Clockwise from top: Sun, Mon, Tue, Wed, Thu, Fri, and Sat in middle
    const hexPositions = [
      { x: 252, y: 116 },   // Monday - Right upper
      { x: 252, y: 211 },   // Tuesday - Right lower
      { x: 170, y: 259 },   // Wednesday - Bottom center
      { x: 88, y: 211 },    // Thursday - Left lower
      { x: 88, y: 116 },    // Friday - Left upper
      { x: 170, y: 163 },   // Saturday - Center middle
      { x: 170, y: 68 },    // Sunday - Top center
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
          <Svg width="340" height="340" style={styles.progressRingSvg}>
            {/* Full gray background circle */}
            <Circle
              cx="170"
              cy="170"
              r="160"
              stroke="#4A5568"
              strokeWidth="6"
              fill="none"
              strokeOpacity={0.3}
            />
            {/* Blue progress circle on top */}
            <G transform="rotate(-90 170 170)">
              <Circle
                cx="170"
                cy="170"
                r="160"
                stroke="#4285F4"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 160}`}
                strokeDashoffset={`${2 * Math.PI * 160 * (1 - progressPercentage / 100)}`}
                strokeLinecap="round"
              />
            </G>
          </Svg>
        </View>

        {/* Background honeycomb structure */}
        <SvgXml
          key={`honeycomb-${refreshKey}`}
          xml={honeycombSvg}
          width="300"
          height="300"
        />

        {/* Workout logo overlays */}
        {hexPositions.map((pos, index) => {
          const workout = weekWorkouts[index];
          if (!workout) return null;
          const isToday = index === todayIndex && currentWeek === 1;
          const isCompletedCurrentPlan = completedWorkouts.has(`${planId}-${currentWeek}-${index}`);

          // Check if completed in other plans (legacy or different plan)
          const isCompletedOtherPlan = !isCompletedCurrentPlan && Array.from(completedWorkouts).some(key => {
            const parts = key.split('-');
            if (parts.length === 3) {
              const [keyPlanId, week, day] = parts;
              return parseInt(week) === currentWeek && parseInt(day) === index && keyPlanId !== planId;
            }
            return false;
          });

          return (
            <Animated.View
              key={`workout-${index}-${refreshKey}`}
              style={[
                styles.hexOverlay,
                { left: pos.x - 30, top: pos.y - 30 },
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
                    (isCompletedCurrentPlan || isCompletedOtherPlan) && styles.completedLogo
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

  return (
    <View style={[styles.container, { backgroundColor: '#1A1A1A' }]}>
      {/* App Header with Logo, Streak, etc. */}
      <CustomHeader />

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
                  backgroundColor: ['#FF6B35', 'rgba(66, 133, 244, 0.7)'][Math.floor(Math.random() * 2)],
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

      {/* Current Plan Section - Slim Design */}
      <TouchableOpacity
        style={styles.planSection}
        onPress={() => (navigation as any).navigate('WorkoutPlanSelection')}
        activeOpacity={0.8}
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout;
          console.log('📍 PLAN SECTION Y:', y, 'HEIGHT:', height);
        }}
      >
      {selectedPlan ? (
        <View style={styles.currentPlan}>
          <View style={styles.planIconContainer}>
            <MaterialCommunityIcons name="dumbbell" size={18} color="#FF6B35" />
          </View>
          <View style={styles.planInfo}>
            <Text style={styles.planName}>{selectedPlan.name}</Text>
            <Text style={styles.planWeek}>{t('workoutPlans.changePlan')}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
        </View>
      ) : (
        <View style={styles.noPlanContainer}>
          <MaterialCommunityIcons name="plus-circle" size={20} color="#FF6B35" />
          <Text style={styles.noPlanTitle}>{t('workoutPlans.selectWorkoutPlan')}</Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
        </View>
      )}
      </TouchableOpacity>


      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.pathContainer}>
          {/* Week Label with Navigation */}
          <View
            style={styles.weekLabel}
            onLayout={(event) => {
              event.target.measure((x, y, width, height, pageX, pageY) => {
                console.log('📍 WEEK LABEL Y:', pageY, 'HEIGHT:', height);
              });
            }}
          >
            <View style={styles.weekHeader}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={resetCompletedWorkouts}
            >
              <MaterialCommunityIcons name="refresh" size={24} color="#FF6B35" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.weekArrowButton, currentWeek === 1 && styles.disabledButton]}
              onPress={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
              disabled={currentWeek === 1}
            >
              <MaterialCommunityIcons name="chevron-left" size={24} color={currentWeek === 1 ? '#4A5568' : 'rgba(66, 133, 244, 0.7)'} />
            </TouchableOpacity>
            <Text style={styles.weekText}>{t('workouts.week')} {currentWeek}</Text>
            <TouchableOpacity
              style={[styles.weekArrowButton, currentWeek === 8 && styles.disabledButton]}
              onPress={() => setCurrentWeek(Math.min(8, currentWeek + 1))}
              disabled={currentWeek === 8}
            >
              <MaterialCommunityIcons name="chevron-right" size={24} color={currentWeek === 8 ? '#4A5568' : 'rgba(66, 133, 244, 0.7)'} />
            </TouchableOpacity>
          </View>
          <View style={styles.weekLine} />
          </View>

          {/* Honeycomb with workout logos */}
          {renderHoneycomb()}

          {/* Weekly Stats */}
          <View style={styles.weeklyStats}>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="dumbbell" size={20} color="#FF6B35" />
              <Text style={styles.statValue}>{getCompletedCount()}</Text>
              <Text style={styles.statLabel}>{t('workouts.done')}</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="calendar-check" size={20} color="rgba(66, 133, 244, 0.7)" />
              <Text style={styles.statValue}>{7 - getCompletedCount()}</Text>
              <Text style={styles.statLabel}>{t('workouts.left')}</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="timer" size={20} color="rgba(66, 133, 244, 0.7)" />
              <Text style={styles.statValue}>{getCompletedCount() * 45}</Text>
              <Text style={styles.statLabel}>Min</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color="#FF6B35" />
              <Text style={styles.statValue}>{getCompletedCount() * 250}</Text>
              <Text style={styles.statLabel}>Cal</Text>
            </View>
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
                <MaterialCommunityIcons name="fire" size={20} color="#FF6B35" />
                <Text style={styles.startButtonText}>{t('workouts.startTodaysWorkout')}</Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#FF6B35" />
              </View>
            </TouchableOpacity>
          )}

        </View>

        {/* Quick Actions */}
        <View
          style={styles.quickActionsSection}
          onLayout={(event) => {
            event.target.measure((x, y, width, height, pageX, pageY) => {
              console.log('📍 QUICK ACTIONS Y:', pageY, 'HEIGHT:', height);
            });
          }}
        >
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
            <MaterialCommunityIcons name="pencil" size={20} color="#B0B0B0" />
            <Text style={styles.actionText}>Log</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => (navigation as any).navigate('PersonalRecords')}
          >
            <MaterialCommunityIcons name="trophy" size={20} color="#B0B0B0" />
            <Text style={styles.actionText}>Records</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => (navigation as any).navigate('ExerciseLibrary')}
          >
            <MaterialCommunityIcons name="book-open-variant" size={20} color="#B0B0B0" />
            <Text style={styles.actionText}>Library</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => (navigation as any).navigate('EditWeek', { currentWeek })}
          >
            <MaterialCommunityIcons name="calendar-edit" size={20} color="#B0B0B0" />
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        </ScrollView>
        </View>

        {/* Weekly Challenge */}
        {weeklyChallenge && (
          <View style={styles.challengeSection}>
          <View style={styles.challengeHeader}>
            <MaterialCommunityIcons name="trophy" size={24} color="rgba(66, 133, 244, 0.7)" />
            <Text style={styles.challengeTitle}>Weekly Challenge</Text>
          </View>
          <View
            style={styles.challengeCard}
            onLayout={(event) => {
              event.target.measure((x, y, width, height, pageX, pageY) => {
                console.log('📍 CHALLENGE CARD Y:', pageY, 'HEIGHT:', height);
              });
            }}
          >
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
              <MaterialCommunityIcons name="refresh" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          </View>
        )}

        {/* Workout Timer */}
        <TouchableOpacity
          style={styles.timerButton}
          onPress={() => setShowTimerModal(true)}
          onLayout={(event) => {
            event.target.measure((x, y, width, height, pageX, pageY) => {
              console.log('📍 TIMER BUTTON Y:', pageY, 'HEIGHT:', height);
            });
          }}
        >
          <MaterialCommunityIcons name="timer" size={24} color="rgba(66, 133, 244, 0.7)" />
          <Text style={styles.timerButtonText}>Workout Timer</Text>
        </TouchableOpacity>

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

      {/* Timer Modal */}
      <Modal
        visible={showTimerModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTimerModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowTimerModal(false)}
            >
              <MaterialCommunityIcons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Workout Timer</Text>

            <View style={styles.timerDisplay}>
              <Text style={styles.timerText}>{formatTimer(timerSeconds)}</Text>
            </View>

            <View style={styles.timerControls}>
              {!isTimerRunning ? (
                <TouchableOpacity
                  style={[styles.timerControl, { backgroundColor: 'rgba(66, 133, 244, 0.7)' }]}
                  onPress={() => startTimer(30)}
                >
                  <MaterialCommunityIcons name="play" size={32} color="white" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.timerControl, { backgroundColor: '#FF6B35' }]}
                  onPress={stopTimer}
                >
                  <MaterialCommunityIcons name="pause" size={32} color="white" />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.timerControl, { backgroundColor: '#4A5568' }]}
                onPress={() => setTimerSeconds(0)}
              >
                <MaterialCommunityIcons name="restart" size={32} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.presetTimers}>
              <Text style={styles.presetTitle}>Rest Presets</Text>
              <View style={styles.presetRow}>
                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={() => {
                    setTimerSeconds(30);
                    startTimer(30);
                  }}
                >
                  <Text style={styles.presetText}>30s</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={() => {
                    setTimerSeconds(60);
                    startTimer(60);
                  }}
                >
                  <Text style={styles.presetText}>1m</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={() => {
                    setTimerSeconds(90);
                    startTimer(90);
                  }}
                >
                  <Text style={styles.presetText}>1.5m</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.presetButton}
                  onPress={() => {
                    setTimerSeconds(120);
                    startTimer(120);
                  }}
                >
                  <Text style={styles.presetText}>2m</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  scrollContent: {
    paddingBottom: 200,
  },
  pathContainer: {
    position: 'relative',
    marginTop: 8,
  },
  planSection: {
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  currentPlan: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  planWeek: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  noPlanContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  noPlanTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#E0E0E0',
    marginLeft: 12,
  },
  quoteContainer: {
    paddingHorizontal: 30,
    marginBottom: 20,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 20,
  },
  quoteAuthor: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  weekLabel: {
    alignItems: 'center',
    marginBottom: 10,
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
    color: '#E0E0E0',
    marginBottom: 0,
  },
  weekLine: {
    width: '80%',
    height: 2,
    backgroundColor: '#4B5563',
    marginTop: 8,
    borderRadius: 1,
  },
  honeycombContainer: {
    width: 340,
    height: 340,
    alignSelf: 'center',
    position: 'relative',
    marginTop: -10,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingContainer: {
    position: 'absolute',
    width: 340,
    height: 340,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingSvg: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  progressLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    letterSpacing: 1,
    marginTop: 2,
  },
  hexOverlay: {
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 5,
  },
  hexTouchable: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementBadge: {
    position: 'absolute',
    top: 140,
    alignSelf: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  achievementText: {
    color: 'white',
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
    marginHorizontal: 20,
    marginTop: 15,
    gap: 10,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#2C2C2E',
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
    color: '#E0E0E0',
    marginBottom: 2,
  },
  featureCardSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#2C2C2E',
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
    color: '#E0E0E0',
    textAlign: 'center',
    marginBottom: 24,
  },
  reminderToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#37445C',
  },
  reminderToggleLabel: {
    fontSize: 16,
    color: '#E0E0E0',
  },
  timePickerSection: {
    marginTop: 20,
  },
  timePickerLabel: {
    fontSize: 14,
    color: '#9CA3AF',
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
    backgroundColor: '#2C2C2E',
  },
  timeOptionActive: {
    backgroundColor: '#FF6B35',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  timeOptionTextActive: {
    color: '#FFF',
  },
  modalButton: {
    marginTop: 30,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  videoPlaceholder: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: 'rgba(255, 107, 53, 0.05)',
    borderRadius: 12,
  },
  videoPlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
  exerciseTips: {
    marginTop: 20,
  },
  exerciseTipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E0E0E0',
    marginBottom: 12,
  },
  exerciseTip: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    minHeight: 150,
    color: '#E0E0E0',
    fontSize: 14,
    textAlignVertical: 'top',
  },
  dayLabel: {
    position: 'absolute',
    bottom: -15,
    fontSize: 10,
    fontWeight: '600',
    color: '#E0E0E0',
    textAlign: 'center',
  },
  todayLabel: {
    color: '#FF6B35',
    fontWeight: 'bold',
    fontSize: 11,
  },
  todayGlow: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6B35',
    opacity: 0.3,
  },
  completedLogo: {
    tintColor: '#000000',
    opacity: 0.8,
  },
  completedLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  otherPlanLabel: {
    color: '#9CA3AF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  weeklyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 30,
    marginTop: -10,
    marginBottom: 15,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 65,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E0E0E0',
    marginVertical: 2,
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  startTodayButton: {
    marginHorizontal: 50,
    marginTop: -5,
    marginBottom: 10,
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  startButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  startButtonText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
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
    backgroundColor: '#2C2C2E',
  },
  disabledButton: {
    opacity: 0.5,
  },
  weekNavText: {
    color: '#E0E0E0',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: 5,
  },
  quickActionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E0E0E0',
    marginBottom: 12,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    minWidth: 100,
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
    color: '#E0E0E0',
    fontWeight: '500',
  },
  challengeSection: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    color: '#E0E0E0',
  },
  challengeCard: {
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.3)',
  },
  challengeName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(66, 133, 244, 0.7)',
    marginBottom: 12,
  },
  challengeProgress: {
    marginTop: 8,
  },
  challengeProgressBar: {
    height: 8,
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
    borderRadius: 4,
    marginBottom: 8,
  },
  challengeProgressFill: {
    height: '100%',
    backgroundColor: 'rgba(66, 133, 244, 0.7)',
    borderRadius: 4,
  },
  challengeProgressText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  challengeRefresh: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
  },
  timerButton: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(66, 133, 244, 0.3)',
  },
  timerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(66, 133, 244, 0.7)',
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
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'rgba(66, 133, 244, 0.7)',
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
    borderTopColor: 'rgba(156, 163, 175, 0.2)',
    paddingTop: 16,
  },
  presetTitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
    textAlign: 'center',
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  presetButton: {
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  presetText: {
    color: '#E0E0E0',
    fontSize: 14,
    fontWeight: '600',
  },
});

// Export TestingScreenContent directly (TourGuideProvider is in App.js)
const TestingScreen: React.FC = () => {
  return <TestingScreenContent />;
};

export default TestingScreen;
