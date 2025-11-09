import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import type { FootballWorkout, FootballExercise } from '../../data/footballWorkouts';

const { width } = Dimensions.get('window');

const FootballWorkoutDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDark } = useTheme();
  const workout = (route.params as any)?.workout as FootballWorkout;
  const [isFavorite, setIsFavorite] = useState(false);

  if (!workout) {
    return (
      <View style={[styles.container, { backgroundColor: '#0A1628' }]}>
        <Text style={styles.errorText}>Workout not found</Text>
      </View>
    );
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#22C55E';
      case 'intermediate': return '#FFB800';
      case 'advanced': return '#FF6B35';
      default: return '#8B9AA5';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'power': return 'flash';
      case 'speed': return 'run-fast';
      case 'agility': return 'zigzag';
      case 'endurance': return 'heart-pulse';
      case 'strength': return 'dumbbell';
      default: return 'dumbbell';
    }
  };

  const startWorkout = () => {
    (navigation as any).navigate('ActiveWorkout', { workout });
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Save to AsyncStorage/Firebase
  };

  const totalDuration = workout.exercises.reduce((sum, ex) => sum + ex.duration, 0);

  return (
    <View style={[styles.container, { backgroundColor: '#0A1628' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.favoriteButton}
          onPress={toggleFavorite}
        >
          <MaterialCommunityIcons
            name={isFavorite ? "heart" : "heart-outline"}
            size={24}
            color={isFavorite ? "#FF6B35" : "white"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Workout Info Card */}
        <View style={[styles.infoCard, { backgroundColor: '#1E3A5F' }]}>
          <Text style={styles.workoutTitle}>{workout.name}</Text>
          <Text style={styles.workoutTitleHe}>{workout.nameHe}</Text>

          <View style={styles.metaRow}>
            <View style={[styles.difficultyBadge, {
              backgroundColor: `${getDifficultyColor(workout.difficulty)}20`
            }]}>
              <Text style={[styles.difficultyText, {
                color: getDifficultyColor(workout.difficulty)
              }]}>
                {workout.difficulty.toUpperCase()}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#8B9AA5" />
              <Text style={styles.metaText}>{workout.duration} min</Text>
            </View>

            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="dumbbell" size={16} color="#8B9AA5" />
              <Text style={styles.metaText}>{workout.exercises.length} exercises</Text>
            </View>
          </View>

          <Text style={styles.descriptionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{workout.description}</Text>
          <Text style={[styles.descriptionText, { fontFamily: 'System' }]}>{workout.descriptionHe}</Text>
        </View>

        {/* Exercises List */}
        <View style={styles.exercisesSection}>
          <Text style={styles.sectionTitle}>
            Exercises ({workout.exercises.length})
          </Text>

          {workout.exercises.map((exercise, index) => (
            <View
              key={exercise.id}
              style={[styles.exerciseCard, { backgroundColor: '#1E3A5F' }]}
            >
              <View style={styles.exerciseHeader}>
                <View style={[styles.exerciseNumber, {
                  backgroundColor: `${getDifficultyColor(workout.difficulty)}20`
                }]}>
                  <Text style={[styles.exerciseNumberText, {
                    color: getDifficultyColor(workout.difficulty)
                  }]}>
                    {index + 1}
                  </Text>
                </View>

                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseNameHe}>{exercise.nameHe}</Text>
                </View>

                <View style={[styles.categoryIcon, {
                  backgroundColor: `${getDifficultyColor(workout.difficulty)}20`
                }]}>
                  <MaterialCommunityIcons
                    name={getCategoryIcon(exercise.category) as any}
                    size={20}
                    color={getDifficultyColor(workout.difficulty)}
                  />
                </View>
              </View>

              <View style={styles.exerciseDetails}>
                <View style={styles.exerciseDetailItem}>
                  <MaterialCommunityIcons name="timer-outline" size={16} color="#8B9AA5" />
                  <Text style={styles.exerciseDetailText}>
                    {Math.floor(exercise.duration / 60)}:{(exercise.duration % 60).toString().padStart(2, '0')}
                  </Text>
                </View>

                {exercise.reps && (
                  <View style={styles.exerciseDetailItem}>
                    <MaterialCommunityIcons name="counter" size={16} color="#8B9AA5" />
                    <Text style={styles.exerciseDetailText}>{exercise.reps} reps</Text>
                  </View>
                )}

                {exercise.sets && (
                  <View style={styles.exerciseDetailItem}>
                    <MaterialCommunityIcons name="format-list-numbered" size={16} color="#8B9AA5" />
                    <Text style={styles.exerciseDetailText}>{exercise.sets} sets</Text>
                  </View>
                )}
              </View>

              {exercise.notes && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesLabel}>Notes:</Text>
                  <Text style={styles.notesText}>{exercise.notes}</Text>
                  <Text style={[styles.notesText, { fontFamily: 'System' }]}>{exercise.notesHe}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Start Workout Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={startWorkout}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="play" size={24} color="white" />
          <Text style={styles.startButtonText}>Start Workout</Text>
        </TouchableOpacity>
      </View>
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 58, 95, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 58, 95, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  workoutTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  workoutTitleHe: {
    fontSize: 20,
    color: '#8B9AA5',
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: '#8B9AA5',
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#B0B0B0',
    lineHeight: 20,
    marginBottom: 4,
  },
  exercisesSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  exerciseCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  exerciseNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 2,
  },
  exerciseNameHe: {
    fontSize: 13,
    color: '#8B9AA5',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  exerciseDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  exerciseDetailText: {
    fontSize: 13,
    color: '#8B9AA5',
  },
  notesSection: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(139, 154, 165, 0.1)',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8B9AA5',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: '#B0B0B0',
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#0D1B2A',
    borderTopWidth: 1,
    borderTopColor: '#1E3A5F',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  errorText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginTop: 100,
  },
});

export default FootballWorkoutDetailScreen;
