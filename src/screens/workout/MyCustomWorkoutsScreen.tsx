import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CustomWorkout {
  id: string;
  name: string;
  description: string;
  exercises: any[];
  createdAt: string;
  lastModified: string;
  tags: string[];
}

const MyCustomWorkoutsScreen = () => {
  const navigation = useNavigation();
  const [customWorkouts, setCustomWorkouts] = useState<CustomWorkout[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadCustomWorkouts();
    }, [])
  );

  const loadCustomWorkouts = async () => {
    try {
      const data = await AsyncStorage.getItem('custom_workouts');
      const workouts = data ? JSON.parse(data) : [];
      setCustomWorkouts(workouts.sort((a: CustomWorkout, b: CustomWorkout) =>
        new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
      ));
    } catch (error) {
      console.error('Failed to load custom workouts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCustomWorkouts();
  };

  const deleteWorkout = (workoutId: string) => {
    Alert.alert(
      'Delete Workout',
      'Are you sure you want to delete this workout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = customWorkouts.filter(w => w.id !== workoutId);
              await AsyncStorage.setItem('custom_workouts', JSON.stringify(updated));
              setCustomWorkouts(updated);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete workout');
            }
          }
        }
      ]
    );
  };

  const startWorkout = (workout: CustomWorkout) => {
    (navigation as any).navigate('WorkoutDetail', {
      workout: {
        id: workout.id,
        name: workout.name,
        description: workout.description,
        exercises: workout.exercises,
      },
      planName: 'Custom Workout'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getWorkoutDuration = (exercises: any[]) => {
    const totalSets = exercises.reduce((sum, ex) => sum + (ex.sets || 3), 0);
    const avgTimePerSet = 1.5; // minutes
    const restTime = exercises.reduce((sum, ex) => sum + ((ex.rest || 60) * (ex.sets || 3) / 60), 0);
    return Math.round(totalSets * avgTimePerSet + restTime);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <MaterialCommunityIcons name="dumbbell" size={48} color="#FF6B35" />
        <Text style={styles.loadingText}>Loading workouts...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
            progressBackgroundColor="#FFFFFF"
          />
        }
      >
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
          <Text style={styles.headerTitle}>My Custom Workouts</Text>
          <Text style={styles.headerSubtitle}>
            {customWorkouts.length} {customWorkouts.length === 1 ? 'workout' : 'workouts'} created
          </Text>
        </LinearGradient>

        {/* Create New Button */}
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => (navigation as any).navigate('CustomWorkoutBuilder')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4CAF50', '#45B839']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createGradient}
          >
            <MaterialCommunityIcons name="plus-circle" size={24} color="white" />
            <Text style={styles.createButtonText}>Create New Workout</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Workouts List */}
        {customWorkouts.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={64} color="#E0E0E0" />
            <Text style={styles.emptyTitle}>No Custom Workouts Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create your first personalized workout routine
            </Text>
          </View>
        ) : (
          <View style={styles.workoutsList}>
            {customWorkouts.map((workout) => (
              <TouchableOpacity
                key={workout.id}
                style={styles.workoutCard}
                onPress={() => startWorkout(workout)}
                activeOpacity={0.8}
              >
                <View style={styles.workoutCardHeader}>
                  <View style={styles.workoutIcon}>
                    <MaterialCommunityIcons name="dumbbell" size={24} color="white" />
                  </View>
                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutName}>{workout.name}</Text>
                    <Text style={styles.workoutDate}>
                      Modified {formatDate(workout.lastModified)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteWorkout(workout.id)}
                  >
                    <MaterialCommunityIcons name="delete-outline" size={24} color="#E74C3C" />
                  </TouchableOpacity>
                </View>

                {workout.description ? (
                  <Text style={styles.workoutDescription} numberOfLines={2}>
                    {workout.description}
                  </Text>
                ) : null}

                <View style={styles.workoutStats}>
                  <View style={styles.stat}>
                    <MaterialCommunityIcons name="format-list-bulleted" size={16} color="#666" />
                    <Text style={styles.statText}>
                      {workout.exercises.length} exercises
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
                    <Text style={styles.statText}>
                      ~{getWorkoutDuration(workout.exercises)} min
                    </Text>
                  </View>
                </View>

                {workout.tags && workout.tags.length > 0 && (
                  <View style={styles.tags}>
                    {workout.tags.slice(0, 3).map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                    {workout.tags.length > 3 && (
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>+{workout.tags.length - 3}</Text>
                      </View>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => startWorkout(workout)}
                >
                  <Text style={styles.startButtonText}>Start Workout</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#FF6B35" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFD',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFBFD',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
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
  createButton: {
    margin: 20,
    marginBottom: 10,
  },
  createGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  workoutsList: {
    padding: 20,
    paddingTop: 10,
    gap: 16,
  },
  workoutCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  workoutCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  workoutDate: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
  },
  workoutDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  workoutStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF5F0',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MyCustomWorkoutsScreen;