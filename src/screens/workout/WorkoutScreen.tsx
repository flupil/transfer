import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Dimensions,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Text, Card, Button, IconButton, Chip, FAB, Searchbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { format } from 'date-fns';
import firebaseWorkoutService, {
  WorkoutSession,
  WorkoutExercise,
  Exercise,
  EXERCISE_LIBRARY
} from '../../services/firebaseWorkoutService';
import CustomHeader from '../../components/CustomHeader';
import WorkoutTimer from '../../components/WorkoutTimer';

const { width } = Dimensions.get('window');

const WorkoutScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutSession[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({ target: 5, completed: 0 });
  const [loading, setLoading] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [showTimer, setShowTimer] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadWorkoutData();
    }, [user])
  );

  const loadWorkoutData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load recent workouts
      const workouts = await firebaseWorkoutService.getUserWorkouts(user.id, 5);
      setRecentWorkouts(workouts);

      // Check for active workout
      const activeWorkouts = workouts.filter(w => !w.completed);
      if (activeWorkouts.length > 0) {
        setActiveWorkout(activeWorkouts[0]);
      }

      // Load weekly stats (this would come from Firebase)
      // For now using mock data
      setWeeklyStats({ target: 5, completed: workouts.filter(w => {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        return new Date(w.date) >= weekStart && w.completed;
      }).length });
    } catch (error) {
      console.error('Failed to load workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuickWorkout = () => {
    setSelectedExercises([]);
    setShowExerciseModal(true);
  };

  const startWorkoutWithExercises = async () => {
    if (selectedExercises.length === 0) {
      Alert.alert(t('workouts.noExercises'), t('workouts.selectOneExercise'));
      return;
    }

    try {
      const workoutId = await firebaseWorkoutService.startWorkout(
        user!.id,
        'Quick Workout',
        selectedExercises
      );

      const newWorkout: WorkoutSession = {
        id: workoutId,
        userId: user!.id,
        name: 'Quick Workout',
        date: new Date(),
        startTime: new Date(),
        exercises: selectedExercises,
        completed: false
      };

      setActiveWorkout(newWorkout);
      setShowExerciseModal(false);
      Alert.alert(t('workouts.workoutStarted'), t('workouts.workoutBegun'));
    } catch (error) {
      Alert.alert(t('alert.error'), t('workouts.failedToStart'));
    }
  };

  const addExerciseToWorkout = (exercise: Exercise) => {
    const workoutExercise: WorkoutExercise = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: [
        { setNumber: 1, reps: 0, weight: 0, completed: false },
        { setNumber: 2, reps: 0, weight: 0, completed: false },
        { setNumber: 3, reps: 0, weight: 0, completed: false }
      ],
      restTime: 90
    };

    setSelectedExercises([...selectedExercises, workoutExercise]);
  };

  const removeExercise = (index: number) => {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index));
  };

  const updateSet = async (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight', value: number) => {
    if (!activeWorkout?.id) return;

    const updates = { [field]: value };
    await firebaseWorkoutService.updateSet(activeWorkout.id, exerciseIndex, setIndex, updates);

    // Update local state
    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises[exerciseIndex].sets[setIndex] = {
      ...updatedExercises[exerciseIndex].sets[setIndex],
      ...updates
    };

    setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  const toggleSetComplete = async (exerciseIndex: number, setIndex: number) => {
    if (!activeWorkout?.id) return;

    const currentSet = activeWorkout.exercises[exerciseIndex].sets[setIndex];
    const updates = { completed: !currentSet.completed };

    await firebaseWorkoutService.updateSet(activeWorkout.id, exerciseIndex, setIndex, updates);

    // Update local state
    const updatedExercises = [...activeWorkout.exercises];
    updatedExercises[exerciseIndex].sets[setIndex] = {
      ...updatedExercises[exerciseIndex].sets[setIndex],
      ...updates
    };

    setActiveWorkout({ ...activeWorkout, exercises: updatedExercises });
  };

  const completeWorkout = async () => {
    if (!activeWorkout?.id) return;

    Alert.alert(
      t('workouts.completeWorkout'),
      t('workouts.completeConfirm'),
      [
        { text: t('alert.cancel'), style: 'cancel' },
        {
          text: t('alert.complete'),
          onPress: async () => {
            try {
              await firebaseWorkoutService.completeWorkout(activeWorkout.id);
              setActiveWorkout(null);
              loadWorkoutData();
              Alert.alert(t('workouts.greatJob'), t('workouts.workoutCompleted'));
            } catch (error) {
              Alert.alert(t('alert.error'), t('workouts.failedToComplete'));
            }
          }
        }
      ]
    );
  };

  const getFilteredExercises = () => {
    return firebaseWorkoutService.searchExercises(
      searchQuery,
      selectedCategory === 'all' ? undefined : selectedCategory as any
    );
  };

  const categories = ['all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'];

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: '#2A2A2A' }]}>
        <ActivityIndicator size="large" color={BRAND_COLORS.accentLight} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#2A2A2A' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      <CustomHeader />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Active Workout Section */}
        {activeWorkout ? (
          <Card style={[styles.card, { backgroundColor: '#4E4E50' }]}>
            <Card.Content>
              <View style={styles.header}>
                <Text style={[styles.title, { color: '#F4F1EF' }]}>{t('workouts.activeWorkout')}</Text>
                <Button mode="contained" onPress={completeWorkout}>
                  {t('workouts.finishWorkout')}
                </Button>
              </View>

              {activeWorkout.exercises.map((exercise, exIndex) => (
                <View key={exIndex} style={styles.exerciseSection}>
                  <Text style={[styles.exerciseName, { color: '#F4F1EF' }]}>
                    {exercise.exerciseName}
                  </Text>

                  {exercise.sets.map((set, setIndex) => (
                    <View key={setIndex} style={styles.setRow}>
                      <Text style={[styles.setNumber, { color: '#C5C2BF' }]}>
                        {t('workout.set')} {set.setNumber}
                      </Text>

                      <TextInput
                        style={[styles.input, {
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          color: '#F4F1EF'
                        }]}
                        placeholder={t('placeholder.weight')}
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        value={set.weight ? set.weight.toString() : ''}
                        onChangeText={(text) => updateSet(exIndex, setIndex, 'weight', parseInt(text) || 0)}
                      />

                      <TextInput
                        style={[styles.input, {
                          backgroundColor: 'rgba(255,255,255,0.1)',
                          color: '#F4F1EF'
                        }]}
                        placeholder={t('placeholder.reps')}
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        value={set.reps ? set.reps.toString() : ''}
                        onChangeText={(text) => updateSet(exIndex, setIndex, 'reps', parseInt(text) || 0)}
                      />

                      <TouchableOpacity
                        onPress={() => toggleSetComplete(exIndex, setIndex)}
                        style={[styles.checkButton, set.completed && styles.checkButtonComplete]}
                      >
                        <MaterialCommunityIcons
                          name={set.completed ? "check-circle" : "circle-outline"}
                          size={24}
                          color={set.completed ? BRAND_COLORS.accent : colors.textSecondary}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ))}
            </Card.Content>
          </Card>
        ) : (
          /* Start Workout Section */
          <Card style={[styles.card, { backgroundColor: '#4E4E50' }]}>
            <Card.Content>
              <Text style={[styles.title, { color: '#F4F1EF' }]}>{t('workouts.readyToWorkout')}</Text>
              <Text style={[styles.subtitle, { color: '#C5C2BF' }]}>
                {t('workouts.startQuick')}
              </Text>

              <View style={styles.buttonRow}>
                <Button
                  mode="contained"
                  onPress={startQuickWorkout}
                  style={styles.mainButton}
                  icon="play"
                >
                  {t('workouts.quickWorkout')}
                </Button>

                <Button
                  mode="outlined"
                  onPress={() => navigation.navigate('WorkoutPlans' as never)}
                  style={styles.secondaryButton}
                >
                  {t('workouts.browsePlans')}
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Weekly Progress */}
        <Card style={[styles.card, { backgroundColor: '#4E4E50' }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: '#F4F1EF' }]}>{t('workouts.weeklyProgress')}</Text>
            <View style={styles.progressContainer}>
              <Text style={[styles.progressText, { color: '#F4F1EF' }]}>
                {weeklyStats.completed} / {weeklyStats.target} {t('workouts.workouts')}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(weeklyStats.completed / weeklyStats.target) * 100}%` }
                  ]}
                />
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Recent Workouts */}
        {recentWorkouts.length > 0 && (
          <Card style={[styles.card, { backgroundColor: '#4E4E50' }]}>
            <Card.Content>
              <View style={styles.header}>
                <Text style={[styles.sectionTitle, { color: '#F4F1EF' }]}>{t('workouts.recentWorkouts')}</Text>
                <Button mode="text" onPress={() => navigation.navigate('WorkoutHistory' as never)}>
                  {t('workouts.viewAll')}
                </Button>
              </View>

              {recentWorkouts.slice(0, 3).map((workout, index) => (
                <TouchableOpacity
                  key={workout.id || index}
                  style={styles.workoutItem}
                  onPress={() => (navigation as any).navigate('WorkoutDetail', { workoutId: workout.id })}
                >
                  <View style={styles.workoutInfo}>
                    <Text style={[styles.workoutName, { color: '#F4F1EF' }]}>
                      {workout.name}
                    </Text>
                    <Text style={[styles.workoutDate, { color: '#C5C2BF' }]}>
                      {format(new Date(workout.date), 'MMM dd')} • {workout.exercises.length} {t('common.exercises')}
                      {workout.duration && ` • ${workout.duration} ${t('common.mins')}`}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Quick Actions */}
        <Card style={[styles.card, { backgroundColor: '#4E4E50' }]}>
          <Card.Content>
            <Text style={[styles.sectionTitle, { color: '#F4F1EF' }]}>{t('workouts.quickActions')}</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('ExerciseLibrary' as never)}
              >
                <MaterialCommunityIcons name="dumbbell" size={24} color={BRAND_COLORS.accentLight} />
                <Text style={[styles.actionText, { color: '#F4F1EF' }]}>{t('workouts.exercises')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => navigation.navigate('PersonalRecords' as never)}
              >
                <MaterialCommunityIcons name="trophy" size={24} color="#FFD700" />
                <Text style={[styles.actionText, { color: '#F4F1EF' }]}>{t('workouts.records')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowTimer(true)}
              >
                <MaterialCommunityIcons name="timer" size={24} color={BRAND_COLORS.accent} />
                <Text style={[styles.actionText, { color: '#F4F1EF' }]}>{t('workouts.timer')}</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Exercise Selection Modal */}
      <Modal
        visible={showExerciseModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExerciseModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: '#4E4E50' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: '#F4F1EF' }]}>{t('workouts.selectExercises')}</Text>
              <IconButton
                icon="close"
                onPress={() => setShowExerciseModal(false)}
              />
            </View>

            <Searchbar
              placeholder={t('workouts.searchExercises')}
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
            />

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryContainer}>
              {categories.map(category => (
                <Chip
                  key={category}
                  selected={selectedCategory === category}
                  onPress={() => setSelectedCategory(category)}
                  style={styles.categoryChip}
                >
                  {t(`category.${category}`)}
                </Chip>
              ))}
            </ScrollView>

            {selectedExercises.length > 0 && (
              <View style={styles.selectedContainer}>
                <Text style={[styles.selectedTitle, { color: '#F4F1EF' }]}>
                  {t('workouts.selected')} ({selectedExercises.length})
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {selectedExercises.map((ex, index) => (
                    <Chip
                      key={index}
                      onClose={() => removeExercise(index)}
                      style={styles.selectedChip}
                    >
                      {ex.exerciseName}
                    </Chip>
                  ))}
                </ScrollView>
              </View>
            )}

            <FlatList
              data={getFilteredExercises()}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.exerciseItem}
                  onPress={() => addExerciseToWorkout(item)}
                >
                  <View style={styles.exerciseInfo}>
                    <Text style={[styles.exerciseName, { color: '#F4F1EF' }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.exerciseMuscles, { color: '#C5C2BF' }]}>
                      {item.primaryMuscles.join(', ')}
                      {item.equipment && ` • ${item.equipment}`}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="plus-circle" size={24} color={BRAND_COLORS.accentLight} />
                </TouchableOpacity>
              )}
            />

            <Button
              mode="contained"
              onPress={startWorkoutWithExercises}
              style={styles.startButton}
              disabled={selectedExercises.length === 0}
            >
              {t('workouts.startWorkout')} ({selectedExercises.length} {t('common.exercises')})
            </Button>
          </View>
        </View>
      </Modal>

      {/* Workout Timer Modal */}
      <WorkoutTimer
        visible={showTimer}
        onClose={() => setShowTimer(false)}
        initialSeconds={90}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  mainButton: {
    flex: 1,
    backgroundColor: BRAND_COLORS.accentLight,
  },
  secondaryButton: {
    flex: 1,
    borderColor: BRAND_COLORS.accentLight,
  },
  progressContainer: {
    gap: 8,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '500',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BRAND_COLORS.accentLight,
  },
  workoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '500',
  },
  workoutDate: {
    fontSize: 14,
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  actionText: {
    marginTop: 4,
    fontSize: 12,
  },
  exerciseSection: {
    marginVertical: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  setNumber: {
    width: 50,
    fontSize: 14,
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  checkButton: {
    padding: 8,
  },
  checkButtonComplete: {
    transform: [{ scale: 1.1 }],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchBar: {
    marginBottom: 12,
  },
  categoryContainer: {
    marginBottom: 12,
    maxHeight: 40,
  },
  categoryChip: {
    marginRight: 8,
  },
  selectedContainer: {
    marginBottom: 12,
  },
  selectedTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  selectedChip: {
    marginRight: 8,
  },
  exerciseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseMuscles: {
    fontSize: 12,
    marginTop: 2,
  },
  startButton: {
    marginTop: 16,
    backgroundColor: BRAND_COLORS.accentLight,
  },
});

export default WorkoutScreen;