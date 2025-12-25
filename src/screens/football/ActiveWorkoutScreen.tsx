import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Vibration,
  Dimensions
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Audio } from 'expo-av';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import type { FootballWorkout, FootballExercise } from '../../data/footballWorkouts';
import { logWorkoutPerformance, addExperience, updateWorkoutStreak } from '../../services/progressTrackingService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const ActiveWorkoutScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { colors } = useTheme();
  const workout = (route.params as any)?.workout as FootballWorkout;

  // Generate styles with theme colors
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentExercise = workout?.exercises[currentExerciseIndex];

  useEffect(() => {
    if (currentExercise && !isPaused && !isCompleted) {
      setTimeRemaining(currentExercise.duration);
      startTimer();
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentExerciseIndex, isPaused]);

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleExerciseComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleExerciseComplete = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Play sound and vibrate
    Vibration.vibrate(500);

    if (currentExerciseIndex < workout.exercises.length - 1) {
      // Move to next exercise
      setTimeout(() => {
        setCurrentExerciseIndex(currentExerciseIndex + 1);
      }, 1000);
    } else {
      // Workout completed
      setIsCompleted(true);
      handleWorkoutComplete();
    }
  };

  const handleWorkoutComplete = async () => {
    try {
      // Save workout to history
      await logWorkoutPerformance({
        workoutId: workout.id,
        workoutName: workout.name,
        exercises: workout.exercises.map(exercise => ({
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          sets: exercise.sets || 1,
          reps: exercise.reps || 0,
          duration: exercise.duration,
          notes: exercise.notes,
        })),
        duration: workout.duration,
        caloriesBurned: Math.round(workout.duration * 8), // Rough estimate
      });

      // Add XP based on workout difficulty and duration
      const xpAmount = workout.difficulty === 'beginner' ? 50 :
                      workout.difficulty === 'intermediate' ? 75 : 100;
      await addExperience(xpAmount);

      // Save to workout history for weekly stats
      const workoutHistoryKey = `workout_history_${user?.id}`;
      const historyStr = await AsyncStorage.getItem(workoutHistoryKey);
      const history = historyStr ? JSON.parse(historyStr) : [];
      history.push({
        date: new Date().toISOString(),
        workoutId: workout.id,
        workoutName: workout.name,
        type: 'football',
      });
      await AsyncStorage.setItem(workoutHistoryKey, JSON.stringify(history));

      Alert.alert(
        'Workout Complete!',
        `Great job! You completed ${workout.name}\n\n+${xpAmount} XP earned!`,
        [
          {
            text: 'Done',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error saving workout:', error);
      Alert.alert(
        'Workout Complete!',
        `Great job! You completed ${workout.name}`,
        [
          {
            text: 'Done',
            onPress: () => navigation.goBack()
          }
        ]
      );
    }
  };

  const handlePause = () => {
    if (isPaused) {
      setIsPaused(false);
      startTimer();
    } else {
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleSkip = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const handleQuit = () => {
    Alert.alert(
      'Quit Workout?',
      'Are you sure you want to quit? Your progress will not be saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Quit',
          style: 'destructive',
          onPress: () => {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            navigation.goBack();
          }
        }
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((currentExerciseIndex + 1) / workout.exercises.length) * 100;

  if (!workout || !currentExercise) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Workout not found</Text>
      </View>
    );
  }

  if (isCompleted) {
    return (
      <View style={[styles.container, styles.completedContainer]}>
        <MaterialCommunityIcons name="trophy" size={120} color="#E94E1B" />
        <Text style={styles.completedTitle}>Workout Complete!</Text>
        <Text style={styles.completedSubtitle}>{workout.name}</Text>
        <Text style={styles.completedStats}>
          {workout.exercises.length} exercises completed
        </Text>
        <Text style={styles.completedStats}>
          {workout.duration} minutes
        </Text>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleQuit}>
          <MaterialCommunityIcons name="close" size={28} color="white" />
        </TouchableOpacity>

        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            Exercise {currentExerciseIndex + 1} of {workout.exercises.length}
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Timer Circle */}
        <View style={styles.timerContainer}>
          <View style={[styles.timerCircle, isPaused && styles.timerCirclePaused]}>
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            <Text style={styles.timerSubtext}>
              {isPaused ? 'Paused' : 'Remaining'}
            </Text>
          </View>
        </View>

        {/* Exercise Info */}
        <View style={styles.exerciseInfoContainer}>
          <Text style={styles.exerciseName}>{currentExercise.name}</Text>
          <Text style={styles.exerciseNameHe}>{currentExercise.nameHe}</Text>

          {currentExercise.reps && (
            <View style={styles.exerciseMeta}>
              <MaterialCommunityIcons name="counter" size={20} color="#8B9AA5" />
              <Text style={styles.exerciseMetaText}>{currentExercise.reps} reps</Text>
            </View>
          )}

          {currentExercise.sets && (
            <View style={styles.exerciseMeta}>
              <MaterialCommunityIcons name="format-list-numbered" size={20} color="#8B9AA5" />
              <Text style={styles.exerciseMetaText}>{currentExercise.sets} sets</Text>
            </View>
          )}

          {currentExercise.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesTitle}>Instructions:</Text>
              <Text style={styles.notesText}>{currentExercise.notes}</Text>
              <Text style={[styles.notesText, { marginTop: 4 }]}>{currentExercise.notesHe}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, currentExerciseIndex === 0 && styles.controlButtonDisabled]}
          onPress={handlePrevious}
          disabled={currentExerciseIndex === 0}
        >
          <MaterialCommunityIcons
            name="skip-previous"
            size={32}
            color={currentExerciseIndex === 0 ? '#444' : 'white'}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
          <MaterialCommunityIcons
            name={isPaused ? "play" : "pause"}
            size={48}
            color="white"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, currentExerciseIndex === workout.exercises.length - 1 && styles.controlButtonDisabled]}
          onPress={handleSkip}
          disabled={currentExerciseIndex === workout.exercises.length - 1}
        >
          <MaterialCommunityIcons
            name="skip-next"
            size={32}
            color={currentExerciseIndex === workout.exercises.length - 1 ? '#444' : 'white'}
          />
        </TouchableOpacity>
      </View>

      {/* Next Exercise Preview */}
      {currentExerciseIndex < workout.exercises.length - 1 && (
        <View style={styles.nextExerciseContainer}>
          <Text style={styles.nextExerciseLabel}>Next:</Text>
          <Text style={styles.nextExerciseName}>
            {workout.exercises[currentExerciseIndex + 1].name}
          </Text>
        </View>
      )}
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressInfo: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  progressBarContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  timerCircle: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: `${colors.success}1A`,
    borderWidth: 8,
    borderColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCirclePaused: {
    borderColor: colors.warning,
    backgroundColor: `${colors.warning}1A`,
  },
  timerText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: colors.text,
  },
  timerSubtext: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 8,
  },
  exerciseInfoContainer: {
    alignItems: 'center',
    width: '100%',
  },
  exerciseName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  exerciseNameHe: {
    fontSize: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  exerciseMetaText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  notesContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    width: '100%',
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 24,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlButtonDisabled: {
    opacity: 0.3,
  },
  pauseButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  nextExerciseContainer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  nextExerciseLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  nextExerciseName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  completedContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  completedTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 20,
    color: colors.textSecondary,
    marginBottom: 32,
    textAlign: 'center',
  },
  completedStats: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  doneButton: {
    backgroundColor: colors.success,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 32,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  errorText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
  },
});

export default ActiveWorkoutScreen;
