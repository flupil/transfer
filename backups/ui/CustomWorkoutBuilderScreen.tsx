import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getExerciseDatabase } from '../../services/exerciseService';
import { useLanguage } from '../../contexts/LanguageContext';

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  sets?: number;
  reps?: number;
  duration?: number;
  rest?: number;
}

interface CustomWorkout {
  id: string;
  name: string;
  description: string;
  exercises: Exercise[];
  createdAt: string;
  lastModified: string;
  tags: string[];
}

const CustomWorkoutBuilderScreen = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const [workoutName, setWorkoutName] = useState('');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [exerciseDatabase, setExerciseDatabase] = useState<any[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('All');
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showExerciseConfig, setShowExerciseConfig] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    loadExerciseDatabase();
  }, []);

  const loadExerciseDatabase = async () => {
    const db = await getExerciseDatabase();
    setExerciseDatabase(db);
    setFilteredExercises(db);
  };

  const filterExercises = () => {
    let filtered = exerciseDatabase;

    if (selectedMuscleGroup !== 'All') {
      filtered = filtered.filter(ex => ex.muscleGroup === selectedMuscleGroup);
    }

    if (searchQuery) {
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredExercises(filtered);
  };

  useEffect(() => {
    filterExercises();
  }, [searchQuery, selectedMuscleGroup]);

  const addExercise = (exercise: any) => {
    const newExercise: Exercise = {
      ...exercise,
      id: `${exercise.id}_${Date.now()}`,
      sets: 3,
      reps: 10,
      rest: 60,
    };
    setEditingExercise(newExercise);
    setShowExerciseConfig(true);
    setShowExercisePicker(false);
  };

  const confirmExerciseConfig = () => {
    if (editingExercise) {
      setSelectedExercises([...selectedExercises, editingExercise]);
      setEditingExercise(null);
      setShowExerciseConfig(false);
    }
  };

  const updateExercise = (exerciseId: string, field: string, value: number) => {
    setSelectedExercises(exercises =>
      exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, [field]: value } : ex
      )
    );
  };

  const removeExercise = (exerciseId: string) => {
    setSelectedExercises(exercises =>
      exercises.filter(ex => ex.id !== exerciseId)
    );
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newExercises = [...selectedExercises];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < newExercises.length) {
      [newExercises[index], newExercises[newIndex]] =
      [newExercises[newIndex], newExercises[index]];
      setSelectedExercises(newExercises);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const saveWorkout = async () => {
    if (!workoutName.trim()) {
      Alert.alert(t('alert.error'), t('builder.enterName'));
      return;
    }

    if (selectedExercises.length === 0) {
      Alert.alert(t('alert.error'), t('builder.addAtLeastOne'));
      return;
    }

    const customWorkout: CustomWorkout = {
      id: Date.now().toString(),
      name: workoutName.trim(),
      description: workoutDescription.trim(),
      exercises: selectedExercises,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      tags,
    };

    try {
      const existingWorkouts = await AsyncStorage.getItem('custom_workouts');
      const workouts = existingWorkouts ? JSON.parse(existingWorkouts) : [];
      workouts.push(customWorkout);
      await AsyncStorage.setItem('custom_workouts', JSON.stringify(workouts));

      Alert.alert(
        t('builder.workoutCreated'),
        'Your custom workout has been saved successfully.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(t('alert.error'), t('builder.createFailed'));
    }
  };

  const muscleGroups = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio'];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <LinearGradient
            colors={['#FF6B35', '#FF8E53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Custom Workout</Text>
            <Text style={styles.headerSubtitle}>
              Build your personalized workout routine
            </Text>
          </LinearGradient>

          {/* Workout Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Workout Details</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('builder.workoutName')}</Text>
              <TextInput
                style={styles.input}
                value={workoutName}
                onChangeText={setWorkoutName}
                placeholder={t('placeholder.workoutName')}
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>{t('form.description')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={workoutDescription}
                onChangeText={setWorkoutDescription}
                placeholder={t('builder.describeWorkout')}
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Tags */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tags</Text>
              <View style={styles.tagInput}>
                <TextInput
                  style={styles.tagTextInput}
                  value={newTag}
                  onChangeText={setNewTag}
                  placeholder={t('builder.addTag')}
                  placeholderTextColor="#999"
                  onSubmitEditing={addTag}
                />
                <TouchableOpacity onPress={addTag} style={styles.addTagButton}>
                  <MaterialCommunityIcons name="plus" size={24} color="#FF6B35" />
                </TouchableOpacity>
              </View>
              <View style={styles.tagsContainer}>
                {tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity onPress={() => removeTag(tag)}>
                      <MaterialCommunityIcons name="close" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Exercises */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Exercises ({selectedExercises.length})</Text>
              <TouchableOpacity
                style={styles.addExerciseButton}
                onPress={() => setShowExercisePicker(true)}
              >
                <MaterialCommunityIcons name="plus" size={20} color="white" />
                <Text style={styles.addExerciseText}>{t('builder.addExercise')}</Text>
              </TouchableOpacity>
            </View>

            {selectedExercises.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="dumbbell" size={48} color="#E0E0E0" />
                <Text style={styles.emptyStateText}>
                  No exercises added yet
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Tap "Add Exercise" to get started
                </Text>
              </View>
            ) : (
              <View style={styles.exercisesList}>
                {selectedExercises.map((exercise, index) => (
                  <View key={exercise.id} style={styles.exerciseCard}>
                    <View style={styles.exerciseNumber}>
                      <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                    </View>

                    <View style={styles.exerciseContent}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      <View style={styles.exerciseDetails}>
                        <View style={styles.exerciseDetail}>
                          <Text style={styles.detailLabel}>Sets</Text>
                          <TextInput
                            style={styles.detailInput}
                            value={exercise.sets?.toString()}
                            onChangeText={(val) => updateExercise(exercise.id, 'sets', parseInt(val) || 0)}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.exerciseDetail}>
                          <Text style={styles.detailLabel}>Reps</Text>
                          <TextInput
                            style={styles.detailInput}
                            value={exercise.reps?.toString()}
                            onChangeText={(val) => updateExercise(exercise.id, 'reps', parseInt(val) || 0)}
                            keyboardType="numeric"
                          />
                        </View>
                        <View style={styles.exerciseDetail}>
                          <Text style={styles.detailLabel}>Rest (s)</Text>
                          <TextInput
                            style={styles.detailInput}
                            value={exercise.rest?.toString()}
                            onChangeText={(val) => updateExercise(exercise.id, 'rest', parseInt(val) || 0)}
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                    </View>

                    <View style={styles.exerciseActions}>
                      {index > 0 && (
                        <TouchableOpacity onPress={() => moveExercise(index, 'up')}>
                          <MaterialCommunityIcons name="chevron-up" size={24} color="#666" />
                        </TouchableOpacity>
                      )}
                      {index < selectedExercises.length - 1 && (
                        <TouchableOpacity onPress={() => moveExercise(index, 'down')}>
                          <MaterialCommunityIcons name="chevron-down" size={24} color="#666" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity onPress={() => removeExercise(exercise.id)}>
                        <MaterialCommunityIcons name="delete-outline" size={24} color="#E74C3C" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveWorkout}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#4CAF50', '#45B839']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              <MaterialCommunityIcons name="check" size={24} color="white" />
              <Text style={styles.saveButtonText}>{t('builder.workoutSaved')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        {/* Exercise Picker Modal */}
        <Modal
          visible={showExercisePicker}
          animationType="slide"
          transparent
          onRequestClose={() => setShowExercisePicker(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Exercise</Text>
                <TouchableOpacity onPress={() => setShowExercisePicker(false)}>
                  <MaterialCommunityIcons name="close" size={28} color="#333" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('placeholder.searchExercises')}
                placeholderTextColor="#999"
              />

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
                {muscleGroups.map((group) => (
                  <TouchableOpacity
                    key={group}
                    style={[
                      styles.filterTab,
                      selectedMuscleGroup === group && styles.filterTabActive
                    ]}
                    onPress={() => setSelectedMuscleGroup(group)}
                  >
                    <Text style={[
                      styles.filterTabText,
                      selectedMuscleGroup === group && styles.filterTabTextActive
                    ]}>
                      {group}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView style={styles.exerciseList}>
                {filteredExercises.map((exercise) => (
                  <TouchableOpacity
                    key={exercise.id}
                    style={styles.exerciseOption}
                    onPress={() => addExercise(exercise)}
                  >
                    <View style={styles.exerciseOptionContent}>
                      <Text style={styles.exerciseOptionName}>{exercise.name}</Text>
                      <View style={styles.exerciseOptionTags}>
                        <Text style={styles.exerciseOptionTag}>{exercise.muscleGroup}</Text>
                        <Text style={styles.exerciseOptionTag}>{exercise.equipment}</Text>
                      </View>
                    </View>
                    <MaterialCommunityIcons name="plus-circle" size={24} color="#FF6B35" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Exercise Configuration Modal */}
        <Modal
          visible={showExerciseConfig}
          animationType="slide"
          transparent
          onRequestClose={() => setShowExerciseConfig(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.configModal}>
              <Text style={styles.modalTitle}>Configure Exercise</Text>
              {editingExercise && (
                <>
                  <Text style={styles.configExerciseName}>{editingExercise.name}</Text>

                  <View style={styles.configRow}>
                    <Text style={styles.configLabel}>Sets</Text>
                    <View style={styles.configInputContainer}>
                      <TouchableOpacity
                        onPress={() => setEditingExercise({
                          ...editingExercise,
                          sets: Math.max(1, (editingExercise.sets || 3) - 1)
                        })}
                      >
                        <MaterialCommunityIcons name="minus-circle" size={32} color="#FF6B35" />
                      </TouchableOpacity>
                      <Text style={styles.configValue}>{editingExercise.sets || 3}</Text>
                      <TouchableOpacity
                        onPress={() => setEditingExercise({
                          ...editingExercise,
                          sets: (editingExercise.sets || 3) + 1
                        })}
                      >
                        <MaterialCommunityIcons name="plus-circle" size={32} color="#FF6B35" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.configRow}>
                    <Text style={styles.configLabel}>Reps</Text>
                    <View style={styles.configInputContainer}>
                      <TouchableOpacity
                        onPress={() => setEditingExercise({
                          ...editingExercise,
                          reps: Math.max(1, (editingExercise.reps || 10) - 1)
                        })}
                      >
                        <MaterialCommunityIcons name="minus-circle" size={32} color="#FF6B35" />
                      </TouchableOpacity>
                      <Text style={styles.configValue}>{editingExercise.reps || 10}</Text>
                      <TouchableOpacity
                        onPress={() => setEditingExercise({
                          ...editingExercise,
                          reps: (editingExercise.reps || 10) + 1
                        })}
                      >
                        <MaterialCommunityIcons name="plus-circle" size={32} color="#FF6B35" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.configRow}>
                    <Text style={styles.configLabel}>Rest (seconds)</Text>
                    <View style={styles.configInputContainer}>
                      <TouchableOpacity
                        onPress={() => setEditingExercise({
                          ...editingExercise,
                          rest: Math.max(0, (editingExercise.rest || 60) - 15)
                        })}
                      >
                        <MaterialCommunityIcons name="minus-circle" size={32} color="#FF6B35" />
                      </TouchableOpacity>
                      <Text style={styles.configValue}>{editingExercise.rest || 60}</Text>
                      <TouchableOpacity
                        onPress={() => setEditingExercise({
                          ...editingExercise,
                          rest: (editingExercise.rest || 60) + 15
                        })}
                      >
                        <MaterialCommunityIcons name="plus-circle" size={32} color="#FF6B35" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.configButtons}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => {
                        setEditingExercise(null);
                        setShowExerciseConfig(false);
                      }}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={confirmExerciseConfig}
                    >
                      <Text style={styles.confirmButtonText}>{t('builder.addExercise')}</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFD',
  },
  header: {
    padding: 20,
    paddingTop: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1F36',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagInput: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  tagTextInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#333',
  },
  addTagButton: {
    padding: 16,
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  addExerciseText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#B0B0B0',
    marginTop: 8,
  },
  exercisesList: {
    gap: 12,
  },
  exerciseCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  exerciseNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseNumberText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  exerciseDetail: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  detailInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 50,
    textAlign: 'center',
  },
  exerciseActions: {
    flexDirection: 'column',
    gap: 4,
    marginLeft: 12,
  },
  saveButton: {
    margin: 20,
    marginTop: 0,
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
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
    color: '#333',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 16,
    maxHeight: 40,
  },
  filterTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  filterTabActive: {
    backgroundColor: '#FF6B35',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTabTextActive: {
    color: 'white',
  },
  exerciseList: {
    maxHeight: 400,
  },
  exerciseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  exerciseOptionContent: {
    flex: 1,
  },
  exerciseOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  exerciseOptionTags: {
    flexDirection: 'row',
    gap: 8,
  },
  exerciseOptionTag: {
    fontSize: 12,
    color: '#999',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  configModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  configExerciseName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  configLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  configInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  configValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    minWidth: 50,
    textAlign: 'center',
  },
  configButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default CustomWorkoutBuilderScreen;