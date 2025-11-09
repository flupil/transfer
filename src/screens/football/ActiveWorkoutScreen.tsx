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
import type { FootballWorkout, FootballExercise } from '../../data/footballWorkouts';

const { width, height } = Dimensions.get('window');

const ActiveWorkoutScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const workout = (route.params as any)?.workout as FootballWorkout;

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
    // Save workout completion
    // TODO: Integrate with progressTrackingService
    // - Add XP
    // - Update streak
    // - Save to workout history

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
      <View style={[styles.container, { backgroundColor: '#0A1628' }]}>
        <Text style={styles.errorText}>Workout not found</Text>
      </View>
    );
  }

  if (isCompleted) {
    return (
      <View style={[styles.container, styles.completedContainer]}>
        <MaterialCommunityIcons name="trophy" size={120} color="#FFB800" />
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
    <View style={[styles.container, { backgroundColor: '#0A1628' }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressInfo: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: '#8B9AA5',
    fontWeight: '500',
  },
  progressBarContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
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
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 8,
    borderColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCirclePaused: {
    borderColor: '#FFB800',
    backgroundColor: 'rgba(255, 184, 0, 0.1)',
  },
  timerText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: 'white',
  },
  timerSubtext: {
    fontSize: 16,
    color: '#8B9AA5',
    marginTop: 8,
  },
  exerciseInfoContainer: {
    alignItems: 'center',
    width: '100%',
  },
  exerciseName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 4,
  },
  exerciseNameHe: {
    fontSize: 20,
    color: '#8B9AA5',
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
    color: '#8B9AA5',
  },
  notesContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: 'rgba(30, 58, 95, 0.5)',
    borderRadius: 12,
    width: '100%',
  },
  notesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B9AA5',
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#B0B0B0',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#22C55E',
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
    color: '#8B9AA5',
    marginBottom: 4,
  },
  nextExerciseName: {
    fontSize: 16,
    color: 'white',
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
    color: 'white',
    marginTop: 24,
    marginBottom: 8,
  },
  completedSubtitle: {
    fontSize: 20,
    color: '#8B9AA5',
    marginBottom: 32,
    textAlign: 'center',
  },
  completedStats: {
    fontSize: 16,
    color: '#B0B0B0',
    marginBottom: 8,
  },
  doneButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 32,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  errorText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
});

export default ActiveWorkoutScreen;
