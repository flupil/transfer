import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  FlatList,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Card, Chip, IconButton, Button, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { workoutService } from '../../services/workoutService';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

interface Exercise {
  id: string;
  name: string;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  equipment?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  imageUrl?: string;
  videoUrl?: string;
  instructions?: string;
  tips?: string[];
  owner?: 'system' | 'gym' | 'user';
  ownerUserId?: string;
}

// Exercise images mapping
const exerciseImages: { [key: string]: any } = {
  'bench-press': require('../../assets/exercises/bench-press.png'),
  'squat': require('../../assets/exercises/squat.png'),
  'deadlift': require('../../assets/exercises/deadlift.png'),
  // Add more as needed
};

export const EnhancedExerciseLibraryScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('All');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [isAddingToWorkout, setIsAddingToWorkout] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState<any>(null);

  // Form state for creating custom exercise
  const [newExercise, setNewExercise] = useState({
    name: '',
    category: 'strength',
    primaryMuscles: [] as string[],
    equipment: '',
    instructions: '',
  });

  const categories = ['All', 'Strength', 'Cardio', 'Flexibility', 'Balance', 'Power'];
  const muscleGroups = [
    'All', 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
    'Quadriceps', 'Hamstrings', 'Glutes', 'Calves', 'Core', 'Full Body'
  ];

  const equipmentList = [
    'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight',
    'Kettlebell', 'Resistance Band', 'Medicine Ball', 'TRX', 'None'
  ];

  useEffect(() => {
    loadExercises();
    checkActiveWorkout();
  }, []);

  const loadExercises = async () => {
    try {
      setLoading(true);
      const exerciseList = await workoutService.getExercises();

      // If no exercises in database, load default exercises
      if (exerciseList.length === 0) {
        await loadDefaultExercises();
      } else {
        setExercises(exerciseList);
      }
    } catch (error) {
      console.error('Failed to load exercises:', error);
      Alert.alert(t('alert.error'), t('exercises.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultExercises = async () => {
    const defaultExercises = [
      {
        id: '1',
        name: 'Barbell Bench Press',
        category: 'strength',
        primaryMuscles: ['Chest'],
        secondaryMuscles: ['Triceps', 'Shoulders'],
        equipment: 'Barbell',
        difficulty: 'intermediate' as const,
        instructions: 'Lie on bench, grip bar slightly wider than shoulders, lower to chest, press up.',
        tips: ['Keep feet flat on floor', 'Maintain arch in back', 'Control the descent'],
        owner: 'system' as const
      },
      {
        id: '2',
        name: 'Barbell Squat',
        category: 'strength',
        primaryMuscles: ['Quadriceps', 'Glutes'],
        secondaryMuscles: ['Hamstrings', 'Core'],
        equipment: 'Barbell',
        difficulty: 'intermediate' as const,
        instructions: 'Bar on upper back, feet shoulder-width, squat down keeping knees over toes.',
        tips: ['Keep chest up', 'Drive through heels', 'Maintain neutral spine'],
        owner: 'system' as const
      },
      {
        id: '3',
        name: 'Deadlift',
        category: 'strength',
        primaryMuscles: ['Back', 'Glutes', 'Hamstrings'],
        secondaryMuscles: ['Core', 'Traps'],
        equipment: 'Barbell',
        difficulty: 'advanced' as const,
        instructions: 'Stand with feet hip-width, grip bar, lift by extending hips and knees.',
        tips: ['Keep bar close to body', 'Engage lats', 'Drive through heels'],
        owner: 'system' as const
      },
      {
        id: '4',
        name: 'Pull-ups',
        category: 'strength',
        primaryMuscles: ['Back', 'Biceps'],
        secondaryMuscles: ['Core'],
        equipment: 'Bodyweight',
        difficulty: 'intermediate' as const,
        instructions: 'Hang from bar with overhand grip, pull body up until chin over bar.',
        tips: ['Full range of motion', 'Control the descent', 'Engage core'],
        owner: 'system' as const
      },
      {
        id: '5',
        name: 'Push-ups',
        category: 'strength',
        primaryMuscles: ['Chest'],
        secondaryMuscles: ['Triceps', 'Shoulders', 'Core'],
        equipment: 'Bodyweight',
        difficulty: 'beginner' as const,
        instructions: 'Start in plank position, lower chest to floor, push back up.',
        tips: ['Keep body straight', 'Full range of motion', 'Breathe consistently'],
        owner: 'system' as const
      },
      {
        id: '6',
        name: 'Dumbbell Shoulder Press',
        category: 'strength',
        primaryMuscles: ['Shoulders'],
        secondaryMuscles: ['Triceps'],
        equipment: 'Dumbbell',
        difficulty: 'beginner' as const,
        instructions: 'Hold dumbbells at shoulder level, press overhead until arms extended.',
        tips: ['Control the weight', 'Don\'t lock out elbows', 'Keep core engaged'],
        owner: 'system' as const
      },
      {
        id: '7',
        name: 'Plank',
        category: 'strength',
        primaryMuscles: ['Core'],
        secondaryMuscles: ['Shoulders'],
        equipment: 'Bodyweight',
        difficulty: 'beginner' as const,
        instructions: 'Hold push-up position on forearms, keep body straight.',
        tips: ['Don\'t let hips sag', 'Breathe normally', 'Engage glutes'],
        owner: 'system' as const
      },
      {
        id: '8',
        name: 'Lunges',
        category: 'strength',
        primaryMuscles: ['Quadriceps', 'Glutes'],
        secondaryMuscles: ['Hamstrings', 'Calves'],
        equipment: 'Bodyweight',
        difficulty: 'beginner' as const,
        instructions: 'Step forward, lower back knee toward ground, push back to start.',
        tips: ['Keep front knee over ankle', 'Maintain upright torso', 'Control the movement'],
        owner: 'system' as const
      }
    ];

    setExercises(defaultExercises);
  };

  const checkActiveWorkout = async () => {
    try {
      const workoutStr = await AsyncStorage.getItem('activeWorkout');
      if (workoutStr) {
        setActiveWorkout(JSON.parse(workoutStr));
        setIsAddingToWorkout(true);
      }
    } catch (error) {
      console.error('Failed to check active workout:', error);
    }
  };

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' ||
      exercise.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesMuscle = selectedMuscle === 'All' ||
      exercise.primaryMuscles.some(muscle =>
        muscle.toLowerCase() === selectedMuscle.toLowerCase()
      );

    return matchesSearch && matchesCategory && matchesMuscle;
  });

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return '#E94E1B';
      case 'intermediate': return '#E94E1B';
      case 'advanced': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const handleExercisePress = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setModalVisible(true);
  };

  const handleAddToWorkout = async (exercise: Exercise) => {
    if (!activeWorkout) {
      Alert.alert(
        t('exercises.noActiveWorkout'),
        t('exercises.startWorkoutFirst'),
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Workout',
            onPress: () => navigation.navigate('WorkoutLog' as never)
          }
        ]
      );
      return;
    }

    try {
      // Add exercise to active workout
      const updatedWorkout = {
        ...activeWorkout,
        exercises: [...(activeWorkout.exercises || []), {
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          sets: []
        }]
      };

      await AsyncStorage.setItem('activeWorkout', JSON.stringify(updatedWorkout));
      setModalVisible(false);

      Alert.alert(
        t('exercises.addedToWorkout'),
        `${exercise.name} has been added to your workout.`,
        [
          { text: 'Continue', style: 'cancel' },
          {
            text: 'Go to Workout',
            onPress: () => navigation.navigate('WorkoutLog' as never)
          }
        ]
      );
    } catch (error) {
      console.error('Failed to add exercise to workout:', error);
      Alert.alert(t('alert.error'), t('exercises.addFailed'));
    }
  };

  const handleCreateExercise = async () => {
    if (!newExercise.name || newExercise.primaryMuscles.length === 0) {
      Alert.alert(t('alert.error'), t('exercises.fillAllFields'));
      return;
    }

    try {
      const created = await workoutService.createCustomExercise({
        ...newExercise,
        owner: 'user',
        ownerUserId: user?.id
      });

      setExercises([...exercises, created]);
      setCreateModalVisible(false);
      setNewExercise({
        name: '',
        category: 'strength',
        primaryMuscles: [],
        equipment: '',
        instructions: '',
      });

      Alert.alert(t('alert.success'), t('exercises.exerciseCreated'));
    } catch (error) {
      console.error('Failed to create exercise:', error);
      Alert.alert(t('alert.error'), t('exercises.createFailed'));
    }
  };

  const renderExerciseCard = ({ item }: { item: Exercise }) => (
    <TouchableOpacity onPress={() => handleExercisePress(item)}>
      <Card style={styles.exerciseCard}>
        <View style={styles.cardContent}>
          <View style={styles.exerciseImageContainer}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.exerciseImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <MaterialCommunityIcons name="dumbbell" size={32} color="#999" />
              </View>
            )}
          </View>

          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{item.name}</Text>

            <View style={styles.muscleChips}>
              {item.primaryMuscles.slice(0, 2).map((muscle, index) => (
                <Chip key={index} compact style={styles.muscleChip}>
                  {muscle}
                </Chip>
              ))}
              {item.primaryMuscles.length > 2 && (
                <Text style={styles.moreText}>+{item.primaryMuscles.length - 2}</Text>
              )}
            </View>

            <View style={styles.exerciseMeta}>
              {item.equipment && (
                <View style={styles.metaItem}>
                  <MaterialCommunityIcons name="dumbbell" size={14} color="#666" />
                  <Text style={styles.metaText}>{item.equipment}</Text>
                </View>
              )}

              {item.difficulty && (
                <Chip
                  compact
                  style={[styles.difficultyChip, { backgroundColor: getDifficultyColor(item.difficulty) }]}
                >
                  <Text style={styles.difficultyText}>
                    {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
                  </Text>
                </Chip>
              )}

              {item.owner === 'user' && (
                <Chip compact style={styles.customChip}>
                  <Text style={styles.customText}>Custom</Text>
                </Chip>
              )}
            </View>
          </View>

          {isAddingToWorkout && (
            <IconButton
              icon="plus-circle"
              size={28}
              iconColor="#E94E1B"
              onPress={() => handleAddToWorkout(item)}
            />
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E94E1B" />
        <Text style={styles.loadingText}>Loading exercises...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchBar}
          placeholder={t('placeholder.searchExercises')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />

        {isAddingToWorkout && (
          <View style={styles.activeWorkoutBadge}>
            <MaterialCommunityIcons name="dumbbell" size={16} color="white" />
            <Text style={styles.activeWorkoutText}>Adding to Workout</Text>
          </View>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
      >
        {muscleGroups.map(muscle => (
          <Chip
            key={muscle}
            selected={selectedMuscle === muscle}
            onPress={() => setSelectedMuscle(muscle)}
            style={styles.filterChip}
          >
            {muscle}
          </Chip>
        ))}
      </ScrollView>

      <FlatList
        data={filteredExercises}
        renderItem={renderExerciseCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="dumbbell" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No exercises found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters or create a custom exercise</Text>
          </View>
        }
      />

      {/* Exercise Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedExercise && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedExercise.name}</Text>
                    <IconButton
                      icon="close"
                      size={24}
                      onPress={() => setModalVisible(false)}
                    />
                  </View>

                  {selectedExercise.videoUrl ? (
                    <View style={styles.videoSection}>
                      <Text style={styles.videoPlaceholder}>Video Player Here</Text>
                    </View>
                  ) : (
                    <View style={styles.videoSection}>
                      <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        style={styles.videoPlaceholderLarge}
                      >
                        <MaterialCommunityIcons name="play-circle-outline" size={60} color="white" />
                        <Text style={styles.videoTextLarge}>Video Coming Soon</Text>
                      </LinearGradient>
                    </View>
                  )}

                  <View style={styles.modalBody}>
                    <View style={styles.muscleSection}>
                      <Text style={styles.sectionTitle}>Primary Muscles</Text>
                      <View style={styles.muscleChips}>
                        {selectedExercise.primaryMuscles.map((muscle, index) => (
                          <Chip key={index} style={styles.muscleChipLarge}>
                            {muscle}
                          </Chip>
                        ))}
                      </View>
                    </View>

                    {selectedExercise.secondaryMuscles && selectedExercise.secondaryMuscles.length > 0 && (
                      <View style={styles.muscleSection}>
                        <Text style={styles.sectionTitle}>Secondary Muscles</Text>
                        <View style={styles.muscleChips}>
                          {selectedExercise.secondaryMuscles.map((muscle, index) => (
                            <Chip key={index} style={styles.secondaryMuscleChip}>
                              {muscle}
                            </Chip>
                          ))}
                        </View>
                      </View>
                    )}

                    {selectedExercise.instructions && (
                      <>
                        <Text style={styles.sectionTitle}>Instructions</Text>
                        <Text style={styles.instructionText}>{selectedExercise.instructions}</Text>
                      </>
                    )}

                    {selectedExercise.tips && selectedExercise.tips.length > 0 && (
                      <>
                        <Text style={styles.sectionTitle}>Tips</Text>
                        {selectedExercise.tips.map((tip, index) => (
                          <View key={index} style={styles.tipItem}>
                            <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#E94E1B" />
                            <Text style={styles.tipText}>{tip}</Text>
                          </View>
                        ))}
                      </>
                    )}

                    <View style={styles.modalActions}>
                      {isAddingToWorkout ? (
                        <Button
                          mode="contained"
                          onPress={() => handleAddToWorkout(selectedExercise)}
                          style={styles.actionButton}
                          icon="plus"
                        >
                          {t('exercises.addToWorkout')}
                        </Button>
                      ) : (
                        <Button
                          mode="contained"
                          onPress={() => {
                            setModalVisible(false);
                            navigation.navigate('WorkoutLog' as never, {
                              exerciseToAdd: selectedExercise
                            });
                          }}
                          style={styles.actionButton}
                          icon="play"
                        >
                          Start Workout with This Exercise
                        </Button>
                      )}
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Create Custom Exercise Modal */}
      <Modal
        visible={createModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('exercises.customExercise')}</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setCreateModalVisible(false)}
              />
            </View>

            <ScrollView style={styles.modalBody}>
              <TextInput
                style={styles.input}
                placeholder={t('placeholder.exerciseName')}
                value={newExercise.name}
                onChangeText={(text) => setNewExercise({...newExercise, name: text})}
              />

              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {categories.slice(1).map(cat => (
                  <Chip
                    key={cat}
                    selected={newExercise.category === cat.toLowerCase()}
                    onPress={() => setNewExercise({...newExercise, category: cat.toLowerCase()})}
                    style={styles.categoryChip}
                  >
                    {cat}
                  </Chip>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Primary Muscles *</Text>
              <View style={styles.muscleGrid}>
                {muscleGroups.slice(1).map(muscle => (
                  <Chip
                    key={muscle}
                    selected={newExercise.primaryMuscles.includes(muscle)}
                    onPress={() => {
                      const muscles = newExercise.primaryMuscles.includes(muscle)
                        ? newExercise.primaryMuscles.filter(m => m !== muscle)
                        : [...newExercise.primaryMuscles, muscle];
                      setNewExercise({...newExercise, primaryMuscles: muscles});
                    }}
                    style={styles.muscleSelectChip}
                  >
                    {muscle}
                  </Chip>
                ))}
              </View>

              <Text style={styles.inputLabel}>Equipment</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {equipmentList.map(equip => (
                  <Chip
                    key={equip}
                    selected={newExercise.equipment === equip}
                    onPress={() => setNewExercise({...newExercise, equipment: equip})}
                    style={styles.equipmentChip}
                  >
                    {equip}
                  </Chip>
                ))}
              </ScrollView>

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('placeholder.instructions')}
                value={newExercise.instructions}
                onChangeText={(text) => setNewExercise({...newExercise, instructions: text})}
                multiline
                numberOfLines={4}
              />

              <Button
                mode="contained"
                onPress={handleCreateExercise}
                style={styles.createButton}
              >
                {t('exercises.createCustom')}
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setCreateModalVisible(true)}
        label={t('exercises.customExercise')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
  },
  activeWorkoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E94E1B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  activeWorkoutText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 5,
    fontWeight: '600',
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterChip: {
    marginHorizontal: 5,
  },
  listContainer: {
    padding: 10,
  },
  exerciseCard: {
    marginBottom: 10,
    elevation: 2,
    backgroundColor: 'white',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 15,
    alignItems: 'center',
  },
  exerciseImageContainer: {
    marginRight: 15,
  },
  exerciseImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  imagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  muscleChips: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  muscleChip: {
    height: 24,
    backgroundColor: '#E3F2FD',
    marginRight: 5,
  },
  moreText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  difficultyChip: {
    height: 24,
    marginRight: 5,
  },
  difficultyText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  customChip: {
    height: 24,
    backgroundColor: '#9C27B0',
  },
  customText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
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
    textAlign: 'center',
    paddingHorizontal: 40,
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
    maxHeight: height * 0.9,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  videoSection: {
    padding: 20,
  },
  videoPlaceholder: {
    height: 200,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    color: 'white',
  },
  videoPlaceholderLarge: {
    height: 200,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTextLarge: {
    fontSize: 16,
    color: 'white',
    marginTop: 10,
  },
  modalBody: {
    padding: 20,
  },
  muscleSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  muscleChipLarge: {
    marginRight: 8,
    marginBottom: 8,
  },
  secondaryMuscleChip: {
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#2A2A2A',
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  modalActions: {
    marginTop: 20,
  },
  actionButton: {
    marginVertical: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  categoryChip: {
    marginRight: 10,
    marginBottom: 10,
  },
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  muscleSelectChip: {
    marginRight: 8,
    marginBottom: 8,
  },
  equipmentChip: {
    marginRight: 10,
    marginBottom: 15,
  },
  createButton: {
    marginTop: 20,
    marginBottom: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: '#E94E1B',
  },
});