import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSelectedWorkoutPlan } from '../services/workoutPlanService';
import { useLanguage } from '../contexts/LanguageContext';

interface WorkoutDay {
  id: string;
  day: string;
  name: string;
  focusArea: string;
  duration: string;
  exercises: any[];
}

const EditWeekScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();
  const { currentWeek = 1 } = route.params as any || {};

  const [weekWorkouts, setWeekWorkouts] = useState<WorkoutDay[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [swapMode, setSwapMode] = useState(false);
  const [firstSwapDay, setFirstSwapDay] = useState<number | null>(null);

  useEffect(() => {
    loadWeekWorkouts();
  }, [currentWeek]);

  const loadWeekWorkouts = async () => {
    try {
      // Load custom week arrangement if exists
      const customWeek = await AsyncStorage.getItem(`customWeek_${currentWeek}`);
      if (customWeek) {
        setWeekWorkouts(JSON.parse(customWeek));
        return;
      }

      // Otherwise load from workout plan
      const plan = await getSelectedWorkoutPlan();
      if (plan?.workouts) {
        const startIndex = (currentWeek - 1) * 7;
        const weekDays = [
          t('days.monday'),
          t('days.tuesday'),
          t('days.wednesday'),
          t('days.thursday'),
          t('days.friday'),
          t('days.saturday'),
          t('days.sunday')
        ];
        const weekWorkouts = plan.workouts.slice(startIndex, startIndex + 7);

        // Ensure we have 7 days
        while (weekWorkouts.length < 7) {
          const dayIndex = weekWorkouts.length;
          weekWorkouts.push({
            id: `rest-${dayIndex}`,
            day: weekDays[dayIndex],
            name: t('workouts.restDay'),
            focusArea: t('workouts.recovery'),
            duration: '0 min',
            exercises: []
          });
        }

        setWeekWorkouts(weekWorkouts);
      }
    } catch (error) {
      console.error('Error loading week workouts:', error);
    }
  };

  const handleDayPress = (dayIndex: number) => {
    if (swapMode) {
      if (firstSwapDay === null) {
        setFirstSwapDay(dayIndex);
        setSelectedDay(dayIndex);
      } else if (firstSwapDay === dayIndex) {
        // Cancel swap if same day selected
        setFirstSwapDay(null);
        setSelectedDay(null);
        setSwapMode(false);
      } else {
        // Perform swap
        swapDays(firstSwapDay, dayIndex);
      }
    } else {
      setSelectedDay(dayIndex === selectedDay ? null : dayIndex);
    }
  };

  const swapDays = async (day1: number, day2: number) => {
    const newWeekWorkouts = [...weekWorkouts];
    const temp = newWeekWorkouts[day1];
    newWeekWorkouts[day1] = newWeekWorkouts[day2];
    newWeekWorkouts[day2] = temp;

    // Keep original day names
    const day1Name = weekWorkouts[day1].day;
    const day2Name = weekWorkouts[day2].day;
    newWeekWorkouts[day1].day = day1Name;
    newWeekWorkouts[day2].day = day2Name;

    setWeekWorkouts(newWeekWorkouts);

    // Save to AsyncStorage
    await AsyncStorage.setItem(`customWeek_${currentWeek}`, JSON.stringify(newWeekWorkouts));

    // Reset swap mode
    setFirstSwapDay(null);
    setSelectedDay(null);
    setSwapMode(false);

    Alert.alert('Success', 'Workouts swapped successfully!');
  };

  const resetWeek = async () => {
    Alert.alert(
      'Reset Week',
      'This will restore the original workout schedule for this week. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem(`customWeek_${currentWeek}`);
            loadWeekWorkouts();
            Alert.alert('Success', 'Week reset to original schedule');
          }
        }
      ]
    );
  };

  const getWorkoutIcon = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('rest')) return 'bed';
    if (nameLower.includes('chest') || nameLower.includes('push')) return 'arm-flex';
    if (nameLower.includes('back') || nameLower.includes('pull')) return 'human-handsup';
    if (nameLower.includes('leg')) return 'run';
    if (nameLower.includes('shoulder')) return 'weight-lifter';
    if (nameLower.includes('arm')) return 'arm-flex-outline';
    if (nameLower.includes('core') || nameLower.includes('abs')) return 'ab-testing';
    if (nameLower.includes('full')) return 'human';
    return 'dumbbell';
  };

  const getWorkoutColor = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('rest')) return '#9CA3AF';
    if (nameLower.includes('chest') || nameLower.includes('push')) return '#FF6B35';
    if (nameLower.includes('back') || nameLower.includes('pull')) return '#4ECDC4';
    if (nameLower.includes('leg')) return '#95E77E';
    if (nameLower.includes('shoulder')) return '#FFD700';
    if (nameLower.includes('arm')) return '#FF69B4';
    if (nameLower.includes('core') || nameLower.includes('abs')) return '#9B59B6';
    if (nameLower.includes('full')) return '#3498DB';
    return '#FF6B35';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#E0E0E0" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('workouts.editWeek')} {currentWeek}</Text>
        <TouchableOpacity onPress={resetWeek} style={styles.resetButton}>
          <MaterialCommunityIcons name="restore" size={24} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionText}>
          {swapMode
            ? firstSwapDay !== null
              ? 'Select another day to swap with'
              : 'Select first day to swap'
            : 'Tap days to view details or use swap mode to rearrange'
          }
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.weekContainer}>
          {weekWorkouts.map((workout, index) => {
            const isSelected = selectedDay === index;
            const isFirstSwap = firstSwapDay === index;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayCard,
                  isSelected && styles.selectedCard,
                  isFirstSwap && styles.swapCard,
                ]}
                onPress={() => handleDayPress(index)}
                activeOpacity={0.7}
              >
                <View style={styles.dayHeader}>
                  <Text style={styles.dayLabel}>{workout.day}</Text>
                  {isFirstSwap && (
                    <View style={styles.swapBadge}>
                      <Text style={styles.swapBadgeText}>SWAP</Text>
                    </View>
                  )}
                </View>

                <View style={styles.workoutInfo}>
                  <View
                    style={[
                      styles.workoutIcon,
                      { backgroundColor: `${getWorkoutColor(workout.name)}20` }
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={getWorkoutIcon(workout.name) as any}
                      size={24}
                      color={getWorkoutColor(workout.name)}
                    />
                  </View>

                  <View style={styles.workoutDetails}>
                    <Text style={styles.workoutName}>{workout.name}</Text>
                    <Text style={styles.workoutFocus}>{workout.focusArea}</Text>
                    <View style={styles.workoutStats}>
                      <MaterialCommunityIcons name="clock-outline" size={14} color="#9CA3AF" />
                      <Text style={styles.workoutDuration}>{workout.duration}</Text>
                      {workout.exercises.length > 0 && (
                        <>
                          <MaterialCommunityIcons name="dumbbell" size={14} color="#9CA3AF" />
                          <Text style={styles.workoutExercises}>
                            {workout.exercises.length} {t('workouts.exercises')}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>

                  <MaterialCommunityIcons
                    name={swapMode ? "swap-vertical" : "chevron-right"}
                    size={24}
                    color="#9CA3AF"
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <TouchableOpacity
          style={[styles.actionButton, swapMode && styles.activeButton]}
          onPress={() => {
            setSwapMode(!swapMode);
            setFirstSwapDay(null);
            setSelectedDay(null);
          }}
        >
          <MaterialCommunityIcons
            name="swap-horizontal"
            size={24}
            color={swapMode ? "white" : "#FF6B35"}
          />
          <Text style={[styles.actionButtonText, swapMode && styles.activeButtonText]}>
            {swapMode ? t('workouts.cancelSwap') : t('workouts.swapDays')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2B3648',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  resetButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
  instructions: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  instructionText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  weekContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  dayCard: {
    backgroundColor: '#37445C',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#4ECDC4',
  },
  swapCard: {
    borderColor: '#FF6B35',
    backgroundColor: '#3F4759',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  swapBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  swapBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  workoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workoutIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  workoutDetails: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E0E0E0',
    marginBottom: 4,
  },
  workoutFocus: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  workoutStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  workoutDuration: {
    fontSize: 11,
    color: '#9CA3AF',
    marginRight: 8,
  },
  workoutExercises: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#2B3648',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: '#37445C',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#37445C',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  activeButton: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  actionButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  activeButtonText: {
    color: 'white',
  },
});

export default EditWeekScreen;