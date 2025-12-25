import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Button, FAB, IconButton, TextInput, Chip, Dialog, Portal, List, Searchbar, Badge } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { workoutService } from '../../services/workoutService';
import { Exercise, WorkoutLog, WorkoutSet } from '../../types';
import { getSafeDatabase } from '../../database/databaseHelper';

export const WorkoutLogScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [currentSet, setCurrentSet] = useState<WorkoutSet>({
    setNumber: 1,
    reps: 0,
    weight: 0,
    completed: false,
  });
  const [restTimerSeconds, setRestTimerSeconds] = useState(0);
  const [isRestTimerRunning, setIsRestTimerRunning] = useState(false);
  const [showExerciseDialog, setShowExerciseDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [personalRecords, setPersonalRecords] = useState<any[]>([]);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date>(new Date());
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState(3);
  const [energy, setEnergy] = useState(3);

  useEffect(() => {
    loadExercises();
    setWorkoutStartTime(new Date());
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRestTimerRunning && restTimerSeconds > 0) {
      interval = setInterval(() => {
        setRestTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (restTimerSeconds === 0 && isRestTimerRunning) {
      setIsRestTimerRunning(false);
      Alert.alert(t('workoutLog.restComplete'), t('workoutLog.timeForNextSet'));
    }
    return () => clearInterval(interval);
  }, [isRestTimerRunning, restTimerSeconds]);

  const loadExercises = async () => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      const result = await db.getAllAsync(
        'SELECT * FROM exercises WHERE owner = ? OR owner = ? ORDER BY name',
        ['gym', user?.id || '']
      ) as Exercise[];
      setExercises(result);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    }
  };

  const addExercise = (exercise: Exercise) => {
    setSelectedExercises([...selectedExercises, {
      exercise,
      sets: [],
      personalRecord: null
    }]);
    setShowExerciseDialog(false);
    setSearchQuery('');
  };

  const startRestTimer = (seconds: number) => {
    setRestTimerSeconds(seconds);
    setIsRestTimerRunning(true);
  };

  const addSet = async () => {
    if (currentSet.reps === 0) {
      Alert.alert(t('workoutLog.invalidSet'), t('workoutLog.enterReps'));
      return;
    }

    const newSet = { ...currentSet, completed: true };
    const updatedSets = [...sets, newSet];
    setSets(updatedSets);

    // Check for personal record
    const isNewPR = await checkPersonalRecord(
      selectedExercises[currentExerciseIndex]?.exercise.id || '',
      currentSet.weight || 0,
      currentSet.reps
    );

    if (isNewPR) {
      setPersonalRecords([...personalRecords, {
        exerciseId: selectedExercises[currentExerciseIndex].exercise.id,
        weight: currentSet.weight,
        reps: currentSet.reps
      }]);
      Alert.alert(t('workoutLog.personalRecord'), `${currentSet.weight}kg x ${currentSet.reps} reps!`);
    }

    // Update selected exercises
    const updatedExercises = [...selectedExercises];
    updatedExercises[currentExerciseIndex].sets = updatedSets;
    setSelectedExercises(updatedExercises);

    // Reset for next set
    setCurrentSet({
      setNumber: updatedSets.length + 1,
      reps: 0,
      weight: currentSet.weight, // Keep same weight
      completed: false,
    });

    // Start rest timer
    startRestTimer(90); // Default 90 seconds rest
  };

  const checkPersonalRecord = async (exerciseId: string, weight: number, reps: number): Promise<boolean> => {
    try {
      const db = getSafeDatabase();
      if (!db) return false;

      const result = await db.getAllAsync(
        `SELECT MAX(weight) as maxWeight FROM workout_logs
         WHERE userId = ? AND JSON_EXTRACT(exercises, '$[*].exerciseId') LIKE ?`,
        [user?.id || '', `%${exerciseId}%`]
      ) as any[];

      return !(result[0] as any)?.maxWeight || weight > (result[0] as any).maxWeight;
    } catch (error) {
      console.error('Failed to check PR:', error);
      return false;
    }
  };

  const nextExercise = () => {
    if (currentExerciseIndex < selectedExercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
      setSets([]);
      setCurrentSet({
        setNumber: 1,
        reps: 0,
        weight: 0,
        completed: false,
      });
    }
  };

  const finishWorkout = async () => {
    const duration = Math.floor((new Date().getTime() - workoutStartTime.getTime()) / 1000);

    const workoutLog = {
      userId: user?.id || '',
      date: new Date(),
      name: `Workout - ${format(new Date(), 'MMM dd')}`,
      exercises: selectedExercises.map(ex => ({
        exerciseId: ex.exercise.id,
        exerciseName: ex.exercise.name,
        sets: ex.sets
      })),
      personalRecords: personalRecords,
      duration,
      notes,
      mood: mood as 1 | 2 | 3 | 4 | 5,
      energy: energy as 1 | 2 | 3 | 4 | 5,
      rating: mood as 1 | 2 | 3 | 4 | 5,
      weight: 0, // placeholder
      usedRestTimer: true,
      completedAt: new Date(),
    };

    try {
      await workoutService.logWorkout(workoutLog);
      Alert.alert(t('alert.success'), t('workoutLog.workoutSaved'), [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Failed to save workout:', error);
      Alert.alert(t('alert.error'), t('workoutLog.saveFailed'));
    }
  };

  const filteredExercises = exercises.filter(ex =>
    ex.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentExercise = selectedExercises[currentExerciseIndex];

  return (
    <View style={styles.container}>
      <ScrollView>
        {selectedExercises.length === 0 ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="headlineSmall" style={styles.centerText}>
                Start Your Workout
              </Text>
              <Text variant="bodyMedium" style={[styles.centerText, styles.subtitle]}>
                Add exercises to begin logging
              </Text>
              <Button
                mode="contained"
                onPress={() => setShowExerciseDialog(true)}
                style={styles.addButton}
                icon="plus"
              >
                Add Exercise
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <View style={styles.exerciseHeader}>
                  <View>
                    <Text variant="headlineSmall">{currentExercise?.exercise.name}</Text>
                    <Text variant="bodyMedium" style={styles.exerciseInfo}>
                      {currentExercise?.exercise.primaryMuscles?.join(', ')}
                    </Text>
                  </View>
                  {personalRecords.some(pr => pr.exerciseId === currentExercise?.exercise.id) && (
                    <Badge style={styles.prBadge}>PR!</Badge>
                  )}
                </View>

                <View style={styles.setInputContainer}>
                  <TextInput
                    label={t('workout.weight')}
                    value={(currentSet.weight || 0).toString()}
                    onChangeText={(text) => setCurrentSet({...currentSet, weight: parseFloat(text) || 0})}
                    keyboardType="numeric"
                    style={styles.input}
                    mode="outlined"
                  />
                  <TextInput
                    label={t('workout.reps')}
                    value={currentSet.reps.toString()}
                    onChangeText={(text) => setCurrentSet({...currentSet, reps: parseInt(text) || 0})}
                    keyboardType="numeric"
                    style={styles.input}
                    mode="outlined"
                  />
                </View>

                <Button
                  mode="contained"
                  onPress={addSet}
                  style={styles.addSetButton}
                >
                  {t('workout.addSet')} {currentSet.setNumber}
                </Button>

                {sets.length > 0 && (
                  <View style={styles.setsContainer}>
                    <Text variant="titleMedium" style={styles.setsTitle}>Completed Sets</Text>
                    {sets.map((set, index) => (
                      <Chip key={index} style={styles.setChip}>
                        Set {index + 1}: {set.weight}kg × {set.reps}
                      </Chip>
                    ))}
                  </View>
                )}

                {isRestTimerRunning && (
                  <Card style={styles.timerCard}>
                    <Card.Content>
                      <Text variant="headlineMedium" style={styles.timerText}>
                        Rest Timer: {Math.floor(restTimerSeconds / 60)}:{(restTimerSeconds % 60).toString().padStart(2, '0')}
                      </Text>
                      <Button onPress={() => setIsRestTimerRunning(false)}>Skip Rest</Button>
                    </Card.Content>
                  </Card>
                )}

                <View style={styles.navigationButtons}>
                  {currentExerciseIndex > 0 && (
                    <Button
                      mode="outlined"
                      onPress={() => setCurrentExerciseIndex(currentExerciseIndex - 1)}
                    >
                      Previous
                    </Button>
                  )}
                  {currentExerciseIndex < selectedExercises.length - 1 && (
                    <Button
                      mode="contained"
                      onPress={nextExercise}
                    >
                      Next Exercise
                    </Button>
                  )}
                </View>
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Text variant="titleMedium">Workout Notes</Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                  numberOfLines={3}
                  mode="outlined"
                  style={styles.notesInput}
                />
                <View style={styles.moodContainer}>
                  <Text>Mood: </Text>
                  {[1, 2, 3, 4, 5].map(i => (
                    <IconButton
                      key={i}
                      icon="emoticon"
                      size={24}
                      iconColor={mood >= i ? '#E94E1B' : '#ccc'}
                      onPress={() => setMood(i)}
                    />
                  ))}
                </View>
                <View style={styles.moodContainer}>
                  <Text>Energy: </Text>
                  {[1, 2, 3, 4, 5].map(i => (
                    <IconButton
                      key={i}
                      icon="lightning-bolt"
                      size={24}
                      iconColor={energy >= i ? '#E94E1B' : '#ccc'}
                      onPress={() => setEnergy(i)}
                    />
                  ))}
                </View>
              </Card.Content>
            </Card>

            <Button
              mode="contained"
              onPress={finishWorkout}
              style={styles.finishButton}
              buttonColor="#E94E1B"
            >
              {t('workoutLog.completeWorkout')}
            </Button>
          </>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setShowExerciseDialog(true)}
      />

      <Portal>
        <Dialog visible={showExerciseDialog} onDismiss={() => setShowExerciseDialog(false)}>
          <Dialog.Title>Select Exercise</Dialog.Title>
          <Dialog.Content>
            <Searchbar
              placeholder={t('placeholder.searchExercises')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchbar}
            />
            <ScrollView style={styles.exerciseList}>
              {filteredExercises.map((exercise) => (
                <List.Item
                  key={exercise.id}
                  title={exercise.name}
                  description={`${exercise.category} - ${exercise.equipment || 'No equipment'}`}
                  onPress={() => addExercise(exercise)}
                  left={props => <List.Icon {...props} icon="dumbbell" />}
                />
              ))}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowExerciseDialog(false)}>Cancel</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  centerText: {
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    color: '#666',
  },
  addButton: {
    marginTop: 16,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exerciseInfo: {
    color: '#666',
    marginTop: 4,
  },
  prBadge: {
    backgroundColor: '#FFD700',
  },
  setInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
  },
  addSetButton: {
    marginBottom: 16,
  },
  setsContainer: {
    marginTop: 16,
  },
  setsTitle: {
    marginBottom: 8,
  },
  setChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  timerCard: {
    marginTop: 16,
    backgroundColor: '#E3F2FD',
  },
  timerText: {
    textAlign: 'center',
    marginBottom: 8,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  notesInput: {
    marginTop: 8,
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  finishButton: {
    margin: 16,
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  searchbar: {
    marginBottom: 8,
  },
  exerciseList: {
    maxHeight: 400,
  },
});