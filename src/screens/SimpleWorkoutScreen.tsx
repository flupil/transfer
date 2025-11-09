import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { getSelectedWorkoutPlan } from '../services/workoutPlanService';
import CustomHeader from '../components/CustomHeader';

const SimpleWorkoutScreen: React.FC = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [todayWorkout, setTodayWorkout] = useState<any>(null);

  useEffect(() => {
    console.log('SimpleWorkoutScreen mounted');
    loadWorkoutPlan();
  }, []);

  const loadWorkoutPlan = async () => {
    try {
      const plan = await getSelectedWorkoutPlan();
      if (plan) {
        setSelectedPlan(plan);
        // Get today's workout (simplified logic)
        const dayOfWeek = new Date().getDay();
        const workoutDays = plan.workouts.filter((w: any) => w.exercises.length > 0);
        if (workoutDays.length > 0) {
          const todayWorkoutIndex = dayOfWeek % workoutDays.length;
          setTodayWorkout(workoutDays[todayWorkoutIndex]);
        }
      }
    } catch (error) {
      console.error('Failed to load workout plan:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWorkoutPlan();
    setTimeout(() => {
      setRefreshing(false);
    }, 500);
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'strength':
        return 'weight-lifter';
      case 'hypertrophy':
        return 'arm-flex';
      case 'beginner':
        return 'run';
      default:
        return 'dumbbell';
    }
  };

  const getPlanGradient = (planId: string) => {
    switch (planId) {
      case 'strength':
        return ['#E74C3C', '#C0392B'] as const;
      case 'hypertrophy':
        return ['#3498DB', '#2980B9'] as const;
      case 'beginner':
        return ['#2ECC71', '#27AE60'] as const;
      default:
        return ['#95E77E', '#68B684'] as const;
    }
  };

  return (
    <View style={styles.container}>
      {/* App Header with Logo, Streak, etc. */}
      <CustomHeader />

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
        }>

      {/* Main Workout Plan Section */}
      {selectedPlan ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Plan</Text>
            <TouchableOpacity
              onPress={() => (navigation as any).navigate('WorkoutPlanSelection')}
            >
              <Text style={styles.changePlanLink}>Change</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.currentPlanCard}
            onPress={() => {
              if (todayWorkout) {
                (navigation as any).navigate('WorkoutDetail', {
                  workout: todayWorkout,
                  planName: selectedPlan.name
                });
              }
            }}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={getPlanGradient(selectedPlan.id)}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.planGradient}
            >
              <View style={styles.planContent}>
                <MaterialCommunityIcons
                  name={getPlanIcon(selectedPlan.id) as any}
                  size={40}
                  color="white"
                />
                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{selectedPlan.name}</Text>
                  <Text style={styles.planDescription}>{selectedPlan.description}</Text>
                </View>
              </View>
            </LinearGradient>

            {todayWorkout && (
              <View style={styles.todayWorkoutSection}>
                <Text style={styles.todayLabel}>TODAY'S WORKOUT</Text>
                <Text style={styles.todayWorkoutName}>{todayWorkout.name}</Text>
                <View style={styles.todayStats}>
                  <View style={styles.todayStatItem}>
                    <MaterialCommunityIcons name="dumbbell" size={16} color="#666" />
                    <Text style={styles.todayStatText}>{todayWorkout.exercises.length} exercises</Text>
                  </View>
                  <View style={styles.todayStatItem}>
                    <MaterialCommunityIcons name="clock-outline" size={16} color="#666" />
                    <Text style={styles.todayStatText}>~45 min</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.startButton}
                  onPress={() => {
                    (navigation as any).navigate('WorkoutDetail', {
                      workout: todayWorkout,
                      planName: selectedPlan.name
                    });
                  }}
                >
                  <Text style={styles.startButtonText}>Start Workout</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.noPlanCard}
          onPress={() => (navigation as any).navigate('WorkoutPlanSelection')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="target" size={60} color="#FF6B35" />
          <Text style={styles.noPlanTitle}>No Workout Plan Selected</Text>
          <Text style={styles.noPlanSubtitle}>
            Choose from our expertly designed workout programs
          </Text>
          <View style={styles.selectPlanButton}>
            <Text style={styles.selectPlanButtonText}>Select Workout Plan</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
          </View>
        </TouchableOpacity>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => (navigation as any).navigate('WorkoutLog')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E8F5E9' }]}>
              <MaterialCommunityIcons name="pencil" size={24} color="#4CAF50" />
            </View>
            <Text style={styles.actionText}>Log Workout</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => (navigation as any).navigate('PersonalRecords')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
              <MaterialCommunityIcons name="trophy" size={24} color="#FF9800" />
            </View>
            <Text style={styles.actionText}>Personal Records</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => (navigation as any).navigate('ExerciseLibrary')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
              <MaterialCommunityIcons name="book-open-variant" size={24} color="#2196F3" />
            </View>
            <Text style={styles.actionText}>Exercise Library</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => (navigation as any).navigate('MyCustomWorkouts')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#F3E5F5' }]}>
              <MaterialCommunityIcons name="playlist-plus" size={24} color="#9C27B0" />
            </View>
            <Text style={styles.actionText}>Custom Workouts</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <View style={styles.activityIcon}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
          </View>
          <View style={styles.activityContent}>
            <Text style={styles.activityTitle}>Great job!</Text>
            <Text style={styles.activityText}>You've completed 3 workouts this week</Text>
          </View>
        </View>
      </View>
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFD',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1F36',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1F36',
  },
  changePlanLink: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  currentPlanCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  planGradient: {
    padding: 20,
  },
  planContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planInfo: {
    marginLeft: 16,
    flex: 1,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  todayWorkoutSection: {
    padding: 20,
    backgroundColor: 'white',
  },
  todayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 1,
    marginBottom: 8,
  },
  todayWorkoutName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1A1F36',
    marginBottom: 12,
  },
  todayStats: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  todayStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  todayStatText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  startButton: {
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  noPlanCard: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  noPlanTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1F36',
    marginTop: 20,
    marginBottom: 8,
  },
  noPlanSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  selectPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  selectPlanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
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
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
    textAlign: 'center',
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1F36',
    marginBottom: 4,
  },
  activityText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default SimpleWorkoutScreen;