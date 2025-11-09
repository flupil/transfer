import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Vibration,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import {
  Card,
  Button,
  IconButton,
  Chip,
  FAB,
  Portal,
  Dialog,
  Paragraph,
  DataTable,
  ProgressBar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { workoutService } from '../../services/workoutService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');

interface Exercise {
  id: string;
  name: string;
  primaryMuscles: string[];
  equipment?: string;
}

interface WorkoutExercise {
  exerciseId: string;
  exerciseName: string;
  sets: SetData[];
  notes?: string;
  restTime?: number; // seconds
}

interface SetData {
  setNumber: number;
  reps: number;
  weight: number;
  completed: boolean;
  rpe?: number; // Rate of Perceived Exertion 1-10
  notes?: string;
}

interface PersonalRecord {
  exerciseId: string;
  type: 'weight' | 'reps' | 'volume';
  value: number;
  previousValue?: number;
}

export const CompleteWorkoutLogScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Workout state
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date>(new Date());
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([]);

  // Rest timer state
  const [restTime, setRestTime] = useState(90); // Default 90 seconds
  const [isResting, setIsResting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  // Exercise selection modal
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState('');

  // Settings modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [autoStartRest, setAutoStartRest] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Previous workout data for progressive overload
  const [previousWorkoutData, setPreviousWorkoutData] = useState<any>({});

  // Sound for timer completion
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  useEffect(() => {
    loadWorkout();
    loadExercises();
    loadSettings();
    setupSound();

    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const loadWorkout = async () => {
    try {
      // Check if continuing an existing workout
      const existingWorkout = await AsyncStorage.getItem('activeWorkout');
      if (existingWorkout) {
        const workout = JSON.parse(existingWorkout);
        setWorkoutName(workout.name || 'Workout');
        setExercises(workout.exercises || []);
        setWorkoutStartTime(new Date(workout.startTime || Date.now()));
      } else {
        // Starting a new workout
        const newWorkout = {
          name: `Workout - ${new Date().toLocaleDateString()}`,
          exercises: [],
          startTime: new Date(),
        };
        await AsyncStorage.setItem('activeWorkout', JSON.stringify(newWorkout));
        setWorkoutName(newWorkout.name);
      }

      // Check if an exercise was passed from navigation
      if (route.params?.exerciseToAdd) {
        addExercise(route.params.exerciseToAdd);
      }
    } catch (error) {
      console.error('Failed to load workout:', error);
    }
  };

  const loadExercises = async () => {
    try {
      const exerciseList = await workoutService.getExercises();
      setAvailableExercises(exerciseList);
    } catch (error) {
      console.error('Failed to load exercises:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('workoutSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        setAutoStartRest(parsed.autoStartRest ?? true);
        setVibrationEnabled(parsed.vibrationEnabled ?? true);
        setSoundEnabled(parsed.soundEnabled ?? true);
        setRestTime(parsed.defaultRestTime || 90);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        autoStartRest,
        vibrationEnabled,
        soundEnabled,
        defaultRestTime: restTime,
      };
      await AsyncStorage.setItem('workoutSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  const setupSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' }
      );
      setSound(sound);
    } catch (error) {
      console.error('Failed to load sound:', error);
    }
  };

  const addExercise = (exercise: Exercise) => {
    const newExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: [
        { setNumber: 1, reps: 0, weight: 0, completed: false },
        { setNumber: 2, reps: 0, weight: 0, completed: false },
        { setNumber: 3, reps: 0, weight: 0, completed: false },
      ],
      restTime: restTime,
    };

    setExercises([...exercises, newExercise]);
    saveWorkoutToStorage();
  };

  const addSet = (exerciseIndex: number) => {
    const updatedExercises = [...exercises];
    const exercise = updatedExercises[exerciseIndex];
    const lastSet = exercise.sets[exercise.sets.length - 1] || { reps: 0, weight: 0 };

    exercise.sets.push({
      setNumber: exercise.sets.length + 1,
      reps: lastSet.reps,
      weight: lastSet.weight,
      completed: false,
    });

    setExercises(updatedExercises);
    saveWorkoutToStorage();
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].sets.splice(setIndex, 1);

    // Update set numbers
    updatedExercises[exerciseIndex].sets.forEach((set, index) => {
      set.setNumber = index + 1;
    });

    setExercises(updatedExercises);
    saveWorkoutToStorage();
  };

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: 'reps' | 'weight',
    value: string
  ) => {
    const updatedExercises = [...exercises];
    const numValue = parseFloat(value) || 0;
    updatedExercises[exerciseIndex].sets[setIndex][field] = numValue;
    setExercises(updatedExercises);
    saveWorkoutToStorage();
  };

  const completeSet = (exerciseIndex: number, setIndex: number) => {
    const updatedExercises = [...exercises];
    const set = updatedExercises[exerciseIndex].sets[setIndex];
    set.completed = !set.completed;

    // Check for personal records
    if (set.completed) {
      checkForPR(exerciseIndex, setIndex);

      // Auto-start rest timer if enabled
      if (autoStartRest && !isResting) {
        startRestTimer();
      }
    }

    setExercises(updatedExercises);
    saveWorkoutToStorage();
  };

  const checkForPR = async (exerciseIndex: number, setIndex: number) => {
    const exercise = exercises[exerciseIndex];
    const set = exercise.sets[setIndex];

    // Get previous records
    const history = await workoutService.getWorkoutHistory(user?.id || '1', 365);
    let maxWeight = 0;
    let maxReps = 0;
    let maxVolume = 0;

    history.forEach(workout => {
      workout.exercises?.forEach(ex => {
        if (ex.exerciseId === exercise.exerciseId) {
          ex.sets.forEach(s => {
            maxWeight = Math.max(maxWeight, s.weight);
            maxReps = Math.max(maxReps, s.reps);
            maxVolume = Math.max(maxVolume, s.weight * s.reps);
          });
        }
      });
    });

    const currentVolume = set.weight * set.reps;
    const newPRs: PersonalRecord[] = [];

    if (set.weight > maxWeight) {
      newPRs.push({
        exerciseId: exercise.exerciseId,
        type: 'weight',
        value: set.weight,
        previousValue: maxWeight,
      });
    }

    if (set.reps > maxReps) {
      newPRs.push({
        exerciseId: exercise.exerciseId,
        type: 'reps',
        value: set.reps,
        previousValue: maxReps,
      });
    }

    if (currentVolume > maxVolume) {
      newPRs.push({
        exerciseId: exercise.exerciseId,
        type: 'volume',
        value: currentVolume,
        previousValue: maxVolume,
      });
    }

    if (newPRs.length > 0) {
      setPersonalRecords([...personalRecords, ...newPRs]);
      if (vibrationEnabled) Vibration.vibrate(500);
      Alert.alert(t('workoutLog.personalRecord'), t('workoutLog.newPR'));
    }
  };

  const startRestTimer = () => {
    setTimeRemaining(restTime);
    setIsResting(true);

    timerInterval.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          completeRestTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopRestTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    setIsResting(false);
    setTimeRemaining(0);
  };

  const completeRestTimer = async () => {
    stopRestTimer();

    if (vibrationEnabled) {
      Vibration.vibrate([0, 200, 100, 200]);
    }

    if (soundEnabled && sound) {
      await sound.replayAsync();
    }

    Alert.alert(t('workoutLog.restComplete'), t('workoutLog.timeForNextSet'));
  };

  const saveWorkoutToStorage = async () => {
    try {
      const workout = {
        name: workoutName,
        exercises,
        startTime: workoutStartTime,
        notes: workoutNotes,
      };
      await AsyncStorage.setItem('activeWorkout', JSON.stringify(workout));
    } catch (error) {
      console.error('Failed to save workout:', error);
    }
  };

  const completeWorkout = async () => {
    Alert.alert(
      t('workoutLog.completeWorkout'),
      'Are you sure you want to finish this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: t('button.complete'),
          onPress: async () => {
            try {
              const duration = Math.floor(
                (Date.now() - workoutStartTime.getTime()) / 1000 / 60
              ); // minutes

              // Calculate total volume and calories
              let totalVolume = 0;
              let totalSets = 0;

              exercises.forEach(exercise => {
                exercise.sets.forEach(set => {
                  if (set.completed) {
                    totalVolume += set.weight * set.reps;
                    totalSets++;
                  }
                });
              });

              // Estimate calories (rough estimate)
              const caloriesBurned = Math.round(duration * 5 + totalSets * 3);

              const workoutLog = {
                userId: user?.id || '1',
                name: workoutName,
                date: new Date(),
                exercises,
                duration,
                totalVolume,
                totalCalories: caloriesBurned,
                personalRecords,
                notes: workoutNotes,
                completedAt: new Date(),
              };

              await workoutService.logWorkout(workoutLog);
              await AsyncStorage.removeItem('activeWorkout');

              Alert.alert(
                t('workoutLog.workoutComplete'),
                `Duration: ${duration} min\nVolume: ${totalVolume.toLocaleString()} kg\nCalories: ${caloriesBurned}\nPRs: ${personalRecords.length}`,
                [
                  {
                    text: 'View Summary',
                    onPress: () => navigation.navigate('WorkoutSummary' as never, { workoutLog }),
                  },
                  {
                    text: 'Done',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error) {
              console.error('Failed to complete workout:', error);
              Alert.alert(t('alert.error'), t('workoutLog.saveFailed'));
            }
          },
        },
      ]
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderExercise = (exercise: WorkoutExercise, index: number) => (
    <Card key={index} style={styles.exerciseCard}>
      <Card.Title
        title={exercise.exerciseName}
        subtitle={`${exercise.sets.length} sets`}
        right={(props) => (
          <IconButton
            {...props}
            icon="delete"
            onPress={() => {
              setExercises(exercises.filter((_, i) => i !== index));
              saveWorkoutToStorage();
            }}
          />
        )}
      />
      <Card.Content>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title style={styles.setColumn}>{t('workout.sets')}</DataTable.Title>
            <DataTable.Title style={styles.previousColumn}>Previous</DataTable.Title>
            <DataTable.Title numeric style={styles.weightColumn}>{t('workout.weight')}</DataTable.Title>
            <DataTable.Title numeric style={styles.repsColumn}>{t('workout.reps')}</DataTable.Title>
            <DataTable.Title style={styles.checkColumn}>✓</DataTable.Title>
          </DataTable.Header>

          {exercise.sets.map((set, setIndex) => (
            <DataTable.Row key={setIndex}>
              <DataTable.Cell style={styles.setColumn}>
                <Text style={styles.setNumber}>{set.setNumber}</Text>
              </DataTable.Cell>
              <DataTable.Cell style={styles.previousColumn}>
                <Text style={styles.previousText}>
                  {previousWorkoutData[exercise.exerciseId]?.[setIndex]
                    ? `${previousWorkoutData[exercise.exerciseId][setIndex].weight}kg × ${previousWorkoutData[exercise.exerciseId][setIndex].reps}`
                    : '-'
                  }
                </Text>
              </DataTable.Cell>
              <DataTable.Cell numeric style={styles.weightColumn}>
                <TextInput
                  style={[styles.input, set.completed && styles.completedInput]}
                  value={set.weight.toString()}
                  onChangeText={(value) => updateSet(index, setIndex, 'weight', value)}
                  keyboardType="numeric"
                  editable={!set.completed}
                />
              </DataTable.Cell>
              <DataTable.Cell numeric style={styles.repsColumn}>
                <TextInput
                  style={[styles.input, set.completed && styles.completedInput]}
                  value={set.reps.toString()}
                  onChangeText={(value) => updateSet(index, setIndex, 'reps', value)}
                  keyboardType="numeric"
                  editable={!set.completed}
                />
              </DataTable.Cell>
              <DataTable.Cell style={styles.checkColumn}>
                <TouchableOpacity onPress={() => completeSet(index, setIndex)}>
                  <MaterialCommunityIcons
                    name={set.completed ? 'check-circle' : 'checkbox-blank-circle-outline'}
                    size={24}
                    color={set.completed ? '#4CAF50' : '#999'}
                  />
                </TouchableOpacity>
              </DataTable.Cell>
            </DataTable.Row>
          ))}
        </DataTable>

        <View style={styles.exerciseActions}>
          <Button
            mode="text"
            onPress={() => addSet(index)}
            icon="plus"
            compact
          >
            Add Set
          </Button>
          <Button
            mode="text"
            onPress={() => {
              // Add notes functionality
            }}
            icon="note"
            compact
          >
            Notes
          </Button>
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.workoutNameInput}
          value={workoutName}
          onChangeText={setWorkoutName}
          placeholder={t('placeholder.workoutName')}
        />
        <View style={styles.headerStats}>
          <Chip icon="clock" compact>
            {Math.floor((Date.now() - workoutStartTime.getTime()) / 1000 / 60)} min
          </Chip>
          <Chip icon="dumbbell" compact>
            {exercises.length} exercises
          </Chip>
          {personalRecords.length > 0 && (
            <Chip icon="trophy" compact style={styles.prChip}>
              {personalRecords.length} PRs
            </Chip>
          )}
        </View>
      </View>

      {/* Rest Timer */}
      {isResting && (
        <Card style={styles.restTimerCard}>
          <Card.Content>
            <Text style={styles.restTimerTitle}>Rest Timer</Text>
            <Text style={styles.restTimerTime}>{formatTime(timeRemaining)}</Text>
            <ProgressBar
              progress={1 - timeRemaining / restTime}
              color="#4CAF50"
              style={styles.restTimerProgress}
            />
            <View style={styles.restTimerActions}>
              <Button onPress={() => setTimeRemaining(timeRemaining + 30)}>+30s</Button>
              <Button onPress={stopRestTimer} mode="contained">Skip</Button>
            </View>
          </Card.Content>
        </Card>
      )}

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {exercises.map((exercise, index) => renderExercise(exercise, index))}

        {exercises.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="dumbbell" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No exercises added yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add an exercise</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.bottomActions}>
        <FAB
          icon="plus"
          style={[styles.fab, { left: 16 }]}
          onPress={() => setShowExerciseModal(true)}
          small
        />
        {!isResting && exercises.length > 0 && (
          <FAB
            icon="timer"
            style={[styles.fab, { left: 70 }]}
            onPress={startRestTimer}
            small
          />
        )}
        <FAB
          icon="cog"
          style={[styles.fab, { right: 70 }]}
          onPress={() => setShowSettingsModal(true)}
          small
        />
        {exercises.length > 0 && (
          <FAB
            icon="check"
            style={[styles.fab, { right: 16, backgroundColor: '#4CAF50' }]}
            onPress={completeWorkout}
          />
        )}
      </View>

      {/* Exercise Selection Modal */}
      <Modal
        visible={showExerciseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Exercise</Text>
              <IconButton
                icon="close"
                onPress={() => setShowExerciseModal(false)}
              />
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder={t('placeholder.searchExercises')}
              value={exerciseSearch}
              onChangeText={setExerciseSearch}
            />
            <FlatList
              data={availableExercises.filter(ex =>
                ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())
              )}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.exerciseItem}
                  onPress={() => {
                    addExercise(item);
                    setShowExerciseModal(false);
                    setExerciseSearch('');
                  }}
                >
                  <Text style={styles.exerciseName}>{item.name}</Text>
                  <Text style={styles.exerciseMuscles}>
                    {item.primaryMuscles.join(', ')}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Workout Settings</Text>
              <IconButton
                icon="close"
                onPress={() => {
                  setShowSettingsModal(false);
                  saveSettings();
                }}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Default Rest Time</Text>
              <View style={styles.restTimeSelector}>
                <IconButton
                  icon="minus"
                  onPress={() => setRestTime(Math.max(30, restTime - 15))}
                />
                <Text style={styles.restTimeText}>{restTime}s</Text>
                <IconButton
                  icon="plus"
                  onPress={() => setRestTime(Math.min(300, restTime + 15))}
                />
              </View>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Auto-start Rest Timer</Text>
              <TouchableOpacity onPress={() => setAutoStartRest(!autoStartRest)}>
                <MaterialCommunityIcons
                  name={autoStartRest ? 'toggle-switch' : 'toggle-switch-off'}
                  size={48}
                  color={autoStartRest ? '#4CAF50' : '#999'}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Vibration</Text>
              <TouchableOpacity onPress={() => setVibrationEnabled(!vibrationEnabled)}>
                <MaterialCommunityIcons
                  name={vibrationEnabled ? 'toggle-switch' : 'toggle-switch-off'}
                  size={48}
                  color={vibrationEnabled ? '#4CAF50' : '#999'}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Sound</Text>
              <TouchableOpacity onPress={() => setSoundEnabled(!soundEnabled)}>
                <MaterialCommunityIcons
                  name={soundEnabled ? 'toggle-switch' : 'toggle-switch-off'}
                  size={48}
                  color={soundEnabled ? '#4CAF50' : '#999'}
                />
              </TouchableOpacity>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  workoutNameInput: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  headerStats: {
    flexDirection: 'row',
    gap: 10,
  },
  prChip: {
    backgroundColor: '#FFD700',
  },
  restTimerCard: {
    margin: 10,
    backgroundColor: '#4CAF50',
  },
  restTimerTitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
  },
  restTimerTime: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginVertical: 10,
  },
  restTimerProgress: {
    height: 8,
    borderRadius: 4,
    marginVertical: 10,
  },
  restTimerActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  scrollView: {
    flex: 1,
    padding: 10,
  },
  exerciseCard: {
    marginBottom: 10,
  },
  setColumn: { flex: 0.5 },
  previousColumn: { flex: 1.5 },
  weightColumn: { flex: 1 },
  repsColumn: { flex: 1 },
  checkColumn: { flex: 0.5 },
  setNumber: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  previousText: {
    fontSize: 11,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 5,
    textAlign: 'center',
    fontSize: 16,
  },
  completedInput: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  exerciseActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'transparent',
  },
  fab: {
    position: 'absolute',
    bottom: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
  },
  exerciseItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseMuscles: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    flex: 1,
  },
  restTimeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restTimeText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
});