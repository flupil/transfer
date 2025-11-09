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
  Alert,
} from 'react-native';
import { Card, FAB } from 'react-native-paper';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { getSafeDatabase } from '../database/databaseHelper';
import { workoutService } from '../services/workoutService';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

interface Exercise {
  id: string;
  name: string;
  sets: Set[];
  notes: string;
  completed: boolean;
  category: string;
  muscleGroup: string;
}

interface Set {
  id: string;
  weight: number;
  reps: number;
  completed: boolean;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: Exercise[];
  category: string;
}

const predefinedWorkouts: WorkoutTemplate[] = [
  {
    id: '1',
    name: 'Push Day (Chest, Shoulders, Triceps)',
    category: 'strength',
    exercises: [
      {
        id: '1',
        name: 'Bench Press',
        sets: [
          { id: '1', weight: 0, reps: 12, completed: false },
          { id: '2', weight: 0, reps: 10, completed: false },
          { id: '3', weight: 0, reps: 8, completed: false },
        ],
        notes: '',
        completed: false,
        category: 'strength',
        muscleGroup: 'chest'
      },
      {
        id: '2',
        name: 'Shoulder Press',
        sets: [
          { id: '1', weight: 0, reps: 12, completed: false },
          { id: '2', weight: 0, reps: 10, completed: false },
          { id: '3', weight: 0, reps: 8, completed: false },
        ],
        notes: '',
        completed: false,
        category: 'strength',
        muscleGroup: 'shoulders'
      },
      {
        id: '3',
        name: 'Incline Dumbbell Press',
        sets: [
          { id: '1', weight: 0, reps: 12, completed: false },
          { id: '2', weight: 0, reps: 10, completed: false },
          { id: '3', weight: 0, reps: 10, completed: false },
        ],
        notes: '',
        completed: false,
        category: 'strength',
        muscleGroup: 'chest'
      },
      {
        id: '4',
        name: 'Lateral Raises',
        sets: [
          { id: '1', weight: 0, reps: 15, completed: false },
          { id: '2', weight: 0, reps: 12, completed: false },
          { id: '3', weight: 0, reps: 12, completed: false },
        ],
        notes: '',
        completed: false,
        category: 'strength',
        muscleGroup: 'shoulders'
      },
      {
        id: '5',
        name: 'Tricep Dips',
        sets: [
          { id: '1', weight: 0, reps: 12, completed: false },
          { id: '2', weight: 0, reps: 10, completed: false },
          { id: '3', weight: 0, reps: 8, completed: false },
        ],
        notes: '',
        completed: false,
        category: 'strength',
        muscleGroup: 'triceps'
      }
    ]
  },
  {
    id: '2',
    name: 'Pull Day (Back, Biceps)',
    category: 'strength',
    exercises: [
      {
        id: '1',
        name: 'Pull-ups',
        sets: [
          { id: '1', weight: 0, reps: 10, completed: false },
          { id: '2', weight: 0, reps: 8, completed: false },
          { id: '3', weight: 0, reps: 6, completed: false },
        ],
        notes: '',
        completed: false,
        category: 'strength',
        muscleGroup: 'back'
      },
      {
        id: '2',
        name: 'Barbell Rows',
        sets: [
          { id: '1', weight: 0, reps: 12, completed: false },
          { id: '2', weight: 0, reps: 10, completed: false },
          { id: '3', weight: 0, reps: 8, completed: false },
        ],
        notes: '',
        completed: false,
        category: 'strength',
        muscleGroup: 'back'
      },
      {
        id: '3',
        name: 'Lat Pulldowns',
        sets: [
          { id: '1', weight: 0, reps: 12, completed: false },
          { id: '2', weight: 0, reps: 10, completed: false },
          { id: '3', weight: 0, reps: 10, completed: false },
        ],
        notes: '',
        completed: false,
        category: 'strength',
        muscleGroup: 'back'
      },
      {
        id: '4',
        name: 'Barbell Curls',
        sets: [
          { id: '1', weight: 0, reps: 12, completed: false },
          { id: '2', weight: 0, reps: 10, completed: false },
          { id: '3', weight: 0, reps: 8, completed: false },
        ],
        notes: '',
        completed: false,
        category: 'strength',
        muscleGroup: 'biceps'
      },
      {
        id: '5',
        name: 'Hammer Curls',
        sets: [
          { id: '1', weight: 0, reps: 12, completed: false },
          { id: '2', weight: 0, reps: 10, completed: false },
          { id: '3', weight: 0, reps: 10, completed: false },
        ],
        notes: '',
        completed: false,
        category: 'strength',
        muscleGroup: 'biceps'
      }
    ]
  },
  {
    id: '3',
    name: 'Leg Day',
    category: 'strength',
    exercises: [
      {
        id: '1',
        name: 'Squats',
        sets: [
          { id: '1', weight: 0, reps: 12, completed: false },
          { id: '2', weight: 0, reps: 10, completed: false },
          { id: '3', weight: 0, reps: 8, completed: false },
          { id: '4', weight: 0, reps: 6, completed: false },
        ],
        notes: '',
        completed: false,
        category: 'strength',
        muscleGroup: 'legs'
      },
      {
        id: '2',
        name: 'Romanian Deadlifts',
        sets: [
          { id: '1', weight: 0, reps: 12, completed: false },
          { id: '2', weight: 0, reps: 10, completed: false },
          { id: '3', weight: 0, reps: 8, completed: false },
        ],
        notes: '',
        completed: false,
        category: 'strength',
        muscleGroup: 'legs'
      },
      {
        id: '3',
        name: 'Leg Press',
        sets: [
          { id: '1', weight: 0, reps: 15, completed: false },
          { id: '2', weight: 0, reps: 12, completed: false },
          { id: '3', weight: 0, reps: 10, completed: false },
        ],
        notes: '',
        completed: false,
        category: 'strength',
        muscleGroup: 'legs'
      },
      {
        id: '4',
        name: 'Leg Curls',
        sets: [
          { id: '1', weight: 0, reps: 15, completed: false },
          { id: '2', weight: 0, reps: 12, completed: false },
          { id: '3', weight: 0, reps: 12, completed: false },
        ],
        notes: '',
        completed: false,
        category: 'strength',
        muscleGroup: 'legs'
      },
      {
        id: '5',
        name: 'Calf Raises',
        sets: [
          { id: '1', weight: 0, reps: 20, completed: false },
          { id: '2', weight: 0, reps: 15, completed: false },
          { id: '3', weight: 0, reps: 15, completed: false },
        ],
        notes: '',
        completed: false,
        category: 'strength',
        muscleGroup: 'calves'
      }
    ]
  },
  {
    id: '4',
    name: 'Full Body HIIT',
    category: 'cardio',
    exercises: [
      {
        id: '1',
        name: 'Burpees',
        sets: [
          { id: '1', weight: 0, reps: 30, completed: false },
        ],
        notes: '30 seconds',
        completed: false,
        category: 'cardio',
        muscleGroup: 'full-body'
      },
      {
        id: '2',
        name: 'Mountain Climbers',
        sets: [
          { id: '1', weight: 0, reps: 30, completed: false },
        ],
        notes: '30 seconds',
        completed: false,
        category: 'cardio',
        muscleGroup: 'core'
      },
      {
        id: '3',
        name: 'Jumping Jacks',
        sets: [
          { id: '1', weight: 0, reps: 30, completed: false },
        ],
        notes: '30 seconds',
        completed: false,
        category: 'cardio',
        muscleGroup: 'full-body'
      },
      {
        id: '4',
        name: 'High Knees',
        sets: [
          { id: '1', weight: 0, reps: 30, completed: false },
        ],
        notes: '30 seconds',
        completed: false,
        category: 'cardio',
        muscleGroup: 'legs'
      },
      {
        id: '5',
        name: 'Plank',
        sets: [
          { id: '1', weight: 0, reps: 60, completed: false },
        ],
        notes: '60 seconds',
        completed: false,
        category: 'cardio',
        muscleGroup: 'core'
      }
    ]
  },
  // Hebrew Full Body Workouts
  {
    id: 'heb1',
    name: 'תוכנית פול בודי 1 💪',
    category: 'strength',
    exercises: [
      {
        id: '1',
        name: 'סקווט (Squat)',
        sets: [
          { id: '1', weight: 0, reps: 12, completed: false },
          { id: '2', weight: 0, reps: 10, completed: false },
          { id: '3', weight: 0, reps: 10, completed: false },
          { id: '4', weight: 0, reps: 8, completed: false },
        ],
        notes: 'תרגיל בסיסי לרגליים',
        completed: false,
        category: 'strength',
        muscleGroup: 'legs'
      },
      {
        id: '2',
        name: 'לחיצת חזה (Bench Press)',
        sets: [
          { id: '1', weight: 0, reps: 10, completed: false },
          { id: '2', weight: 0, reps: 8, completed: false },
          { id: '3', weight: 0, reps: 8, completed: false },
        ],
        notes: 'עם משקולות או מוט',
        completed: false,
        category: 'strength',
        muscleGroup: 'chest'
      },
      {
        id: '3',
        name: 'חתירה בכבל (Cable Row)',
        sets: [
          { id: '1', weight: 0, reps: 15, completed: false },
          { id: '2', weight: 0, reps: 12, completed: false },
          { id: '3', weight: 0, reps: 12, completed: false },
        ],
        notes: 'לחיזוק הגב',
        completed: false,
        category: 'strength',
        muscleGroup: 'back'
      },
      {
        id: '4',
        name: 'לחיצת כתפיים (Shoulder Press)',
        sets: [
          { id: '1', weight: 0, reps: 12, completed: false },
          { id: '2', weight: 0, reps: 10, completed: false },
          { id: '3', weight: 0, reps: 10, completed: false },
        ],
        notes: 'עם משקולות',
        completed: false,
        category: 'strength',
        muscleGroup: 'shoulders'
      },
      {
        id: '5',
        name: 'כפיפות ביד (Bicep Curl)',
        sets: [
          { id: '1', weight: 0, reps: 15, completed: false },
          { id: '2', weight: 0, reps: 12, completed: false },
          { id: '3', weight: 0, reps: 12, completed: false },
        ],
        notes: 'לחיזוק הזרועות',
        completed: false,
        category: 'strength',
        muscleGroup: 'biceps'
      },
      {
        id: '6',
        name: 'פלאנק (Plank)',
        sets: [
          { id: '1', weight: 0, reps: 45, completed: false },
          { id: '2', weight: 0, reps: 60, completed: false },
          { id: '3', weight: 0, reps: 60, completed: false },
        ],
        notes: 'שניות - לחיזוק הליבה',
        completed: false,
        category: 'strength',
        muscleGroup: 'core'
      }
    ]
  },
  {
    id: 'heb2',
    name: 'תוכנית פול בודי 2 🔥',
    category: 'strength',
    exercises: [
      {
        id: '1',
        name: 'דדליפט (Deadlift)',
        sets: [
          { id: '1', weight: 0, reps: 10, completed: false },
          { id: '2', weight: 0, reps: 8, completed: false },
          { id: '3', weight: 0, reps: 6, completed: false },
          { id: '4', weight: 0, reps: 6, completed: false },
        ],
        notes: 'תרגיל מרכב לכל הגוף',
        completed: false,
        category: 'strength',
        muscleGroup: 'legs'
      },
      {
        id: '2',
        name: 'עליות מתח (Pull-ups)',
        sets: [
          { id: '1', weight: 0, reps: 10, completed: false },
          { id: '2', weight: 0, reps: 8, completed: false },
          { id: '3', weight: 0, reps: 6, completed: false },
        ],
        notes: 'אפשר עם סיוע אם צריך',
        completed: false,
        category: 'strength',
        muscleGroup: 'back'
      },
      {
        id: '3',
        name: 'לחיצת רגליים (Leg Press)',
        sets: [
          { id: '1', weight: 0, reps: 15, completed: false },
          { id: '2', weight: 0, reps: 12, completed: false },
          { id: '3', weight: 0, reps: 10, completed: false },
        ],
        notes: 'במכונה',
        completed: false,
        category: 'strength',
        muscleGroup: 'legs'
      },
      {
        id: '4',
        name: 'פרפר חזה (Chest Fly)',
        sets: [
          { id: '1', weight: 0, reps: 15, completed: false },
          { id: '2', weight: 0, reps: 12, completed: false },
          { id: '3', weight: 0, reps: 10, completed: false },
        ],
        notes: 'עם משקולות',
        completed: false,
        category: 'strength',
        muscleGroup: 'chest'
      },
      {
        id: '5',
        name: 'חתירה במשקולת (Dumbbell Row)',
        sets: [
          { id: '1', weight: 0, reps: 12, completed: false },
          { id: '2', weight: 0, reps: 10, completed: false },
          { id: '3', weight: 0, reps: 10, completed: false },
        ],
        notes: 'כל יד בנפרד',
        completed: false,
        category: 'strength',
        muscleGroup: 'back'
      }
    ]
  },
  {
    id: 'heb3',
    name: 'תוכנית פול בודי 3 🏋️',
    category: 'strength',
    exercises: [
      {
        id: '1',
        name: 'סקווט בולגרי (Bulgarian Split Squat)',
        sets: [
          { id: '1', weight: 0, reps: 12, completed: false },
          { id: '2', weight: 0, reps: 10, completed: false },
          { id: '3', weight: 0, reps: 10, completed: false },
        ],
        notes: 'כל רגל בנפרד',
        completed: false,
        category: 'strength',
        muscleGroup: 'legs'
      },
      {
        id: '2',
        name: 'שכיבות שמיכה (Push-ups)',
        sets: [
          { id: '1', weight: 0, reps: 20, completed: false },
          { id: '2', weight: 0, reps: 15, completed: false },
          { id: '3', weight: 0, reps: 15, completed: false },
          { id: '4', weight: 0, reps: 12, completed: false },
        ],
        notes: 'וריאציות שונות',
        completed: false,
        category: 'strength',
        muscleGroup: 'chest'
      },
      {
        id: '3',
        name: 'היפ ת׳ראסט (Hip Thrust)',
        sets: [
          { id: '1', weight: 0, reps: 15, completed: false },
          { id: '2', weight: 0, reps: 12, completed: false },
          { id: '3', weight: 0, reps: 12, completed: false },
        ],
        notes: 'לחיזוק הישבן',
        completed: false,
        category: 'strength',
        muscleGroup: 'glutes'
      },
      {
        id: '4',
        name: 'פשיטות ביד (Tricep Extension)',
        sets: [
          { id: '1', weight: 0, reps: 15, completed: false },
          { id: '2', weight: 0, reps: 12, completed: false },
          { id: '3', weight: 0, reps: 12, completed: false },
        ],
        notes: 'מעל הראש',
        completed: false,
        category: 'strength',
        muscleGroup: 'triceps'
      },
      {
        id: '5',
        name: 'כפיפות בטן (Crunches)',
        sets: [
          { id: '1', weight: 0, reps: 25, completed: false },
          { id: '2', weight: 0, reps: 20, completed: false },
          { id: '3', weight: 0, reps: 20, completed: false },
        ],
        notes: 'עם סיבובים',
        completed: false,
        category: 'strength',
        muscleGroup: 'core'
      }
    ]
  }
];

const WorkoutScreen: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeWorkout, setActiveWorkout] = useState<WorkoutTemplate | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [restTimer, setRestTimer] = useState(90);
  const [timerActive, setTimerActive] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseSets, setNewExerciseSets] = useState('3');
  const [newExerciseReps, setNewExerciseReps] = useState('10');

  useEffect(() => {
    if (user?.id) {
      workoutService.setUserId(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (workoutStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date().getTime() - workoutStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [workoutStartTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            Alert.alert(t('workouts.restComplete'), t('workouts.timeForNextSet'));
            return 90;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive, restTimer]);

  const startWorkout = (template: WorkoutTemplate) => {
    setActiveWorkout(template);
    setExercises(JSON.parse(JSON.stringify(template.exercises))); // Deep copy
    setWorkoutStartTime(new Date());
    setShowTemplateModal(false);
  };

  const updateSet = (exerciseId: string, setId: string, field: 'weight' | 'reps', value: string) => {
    setExercises(exercises.map(exercise => {
      if (exercise.id === exerciseId) {
        return {
          ...exercise,
          sets: exercise.sets.map(set =>
            set.id === setId ? { ...set, [field]: parseFloat(value) || 0 } : set
          )
        };
      }
      return exercise;
    }));
  };

  const toggleSetComplete = (exerciseId: string, setId: string) => {
    setExercises(exercises.map(exercise => {
      if (exercise.id === exerciseId) {
        return {
          ...exercise,
          sets: exercise.sets.map(set =>
            set.id === setId ? { ...set, completed: !set.completed } : set
          )
        };
      }
      return exercise;
    }));

    // Auto-start rest timer
    setRestTimer(90);
    setTimerActive(true);
    setShowTimerModal(true);
  };

  const addSet = (exerciseId: string) => {
    setExercises(exercises.map(exercise => {
      if (exercise.id === exerciseId) {
        const lastSet = exercise.sets[exercise.sets.length - 1];
        const newSet: Set = {
          id: Date.now().toString(),
          weight: lastSet?.weight || 0,
          reps: lastSet?.reps || 10,
          completed: false
        };
        return {
          ...exercise,
          sets: [...exercise.sets, newSet]
        };
      }
      return exercise;
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(exercises.map(exercise => {
      if (exercise.id === exerciseId) {
        return {
          ...exercise,
          sets: exercise.sets.filter(set => set.id !== setId)
        };
      }
      return exercise;
    }));
  };

  const addExercise = () => {
    if (!newExerciseName.trim()) return;

    const sets: Set[] = [];
    for (let i = 0; i < parseInt(newExerciseSets); i++) {
      sets.push({
        id: `${Date.now()}_${i}`,
        weight: 0,
        reps: parseInt(newExerciseReps),
        completed: false
      });
    }

    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: newExerciseName,
      sets,
      notes: '',
      completed: false,
      category: 'strength',
      muscleGroup: 'custom'
    };

    setExercises([...exercises, newExercise]);
    setShowAddExerciseModal(false);
    setNewExerciseName('');
    setNewExerciseSets('3');
    setNewExerciseReps('10');
  };

  const removeExercise = (exerciseId: string) => {
    Alert.alert(
      t('workouts.removeExercise'),
      t('workouts.removeExerciseConfirm'),
      [
        { text: t('general.cancel'), style: 'cancel' },
        {
          text: t('general.delete'),
          style: 'destructive',
          onPress: () => setExercises(exercises.filter(e => e.id !== exerciseId))
        }
      ]
    );
  };

  const finishWorkout = async () => {
    if (!workoutStartTime) return;

    const duration = Math.floor((new Date().getTime() - workoutStartTime.getTime()) / 1000 / 60); // in minutes
    const totalSets = exercises.reduce((acc, ex) => acc + ex.sets.filter(s => s.completed).length, 0);
    const totalReps = exercises.reduce((acc, ex) =>
      acc + ex.sets.filter(s => s.completed).reduce((sum, s) => sum + s.reps, 0), 0
    );
    const totalWeight = exercises.reduce((acc, ex) =>
      acc + ex.sets.filter(s => s.completed).reduce((sum, s) => sum + (s.weight * s.reps), 0), 0
    );

    // Save to database using workout service
    try {
      const workoutLogEntries = exercises.map(exercise => ({
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sets: exercise.sets.map((set, index) => ({
          setNumber: index + 1,
          reps: set.reps,
          weight: set.weight,
          completed: set.completed
        }))
      }));

      const workoutData = {
        userId: user?.id,
        planId: activeWorkout?.id,
        date: new Date(),
        name: activeWorkout?.name || t('workouts.customWorkout'),
        exercises: workoutLogEntries,
        duration,
        notes: '',
        mood: 3 as 1 | 2 | 3 | 4 | 5,
        energy: 3 as 1 | 2 | 3 | 4 | 5,
        usedRestTimer: timerActive,
        completedAt: new Date(),
      };

      await workoutService.logWorkout(workoutData);

      Alert.alert(
        t('workouts.workoutCompleteEmoji'),
        `${t('workouts.durationLabel')}: ${Math.floor(duration / 60)}h ${duration % 60}min\n${t('workouts.totalSets')}: ${totalSets}\n${t('workouts.totalReps')}: ${totalReps}\n${t('workouts.totalWeight')}: ${totalWeight}kg`,
        [{ text: 'OK', onPress: resetWorkout }]
      );
    } catch (error) {
      console.error('Failed to save workout:', error);
      Alert.alert(t('workouts.error'), t('workouts.failedToSave'));
    }
  };

  const resetWorkout = () => {
    setActiveWorkout(null);
    setExercises([]);
    setWorkoutStartTime(null);
    setElapsedTime(0);
  };

  const cancelWorkout = () => {
    Alert.alert(
      t('workouts.cancelWorkout'),
      t('workouts.cancelWorkoutConfirm'),
      [
        { text: t('workouts.keepGoing'), style: 'cancel' },
        {
          text: t('workouts.cancelWorkout'),
          style: 'destructive',
          onPress: resetWorkout
        }
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getMuscleGroupIcon = (muscleGroup: string) => {
    const icons: { [key: string]: string } = {
      'chest': 'human',
      'back': 'human-handsup',
      'shoulders': 'arm-flex',
      'biceps': 'arm-flex',
      'triceps': 'arm-flex',
      'legs': 'run',
      'calves': 'run',
      'core': 'human',
      'full-body': 'human',
      'custom': 'dumbbell'
    };
    return icons[muscleGroup] || 'dumbbell';
  };

  if (!activeWorkout) {
    const navigation = useNavigation();
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('workouts.startWorkout')}</Text>
          <Text style={styles.headerSubtitle}>{t('workouts.chooseTemplate')}</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => (navigation as any).navigate('WorkoutPlans')}
            >
              <MaterialCommunityIcons name="clipboard-list" size={32} color="#4ECDC4" />
              <Text style={styles.quickActionTitle}>{t('workouts.workoutPrograms')}</Text>
              <Text style={styles.quickActionSubtitle}>{t('workouts.browsePlansSubtitle')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => (navigation as any).navigate('ExerciseLibrary')}
            >
              <MaterialCommunityIcons name="book-open-variant" size={32} color="#4ECDC4" />
              <Text style={styles.quickActionTitle}>{t('workouts.exerciseLibrary')}</Text>
              <Text style={styles.quickActionSubtitle}>{t('workouts.learnTechniques')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.customWorkoutCard}
            onPress={() => {
              setActiveWorkout({ id: 'custom', name: t('workouts.customWorkout'), exercises: [], category: 'custom' });
              setExercises([]);
              setWorkoutStartTime(new Date());
            }}
          >
            <MaterialCommunityIcons name="plus-circle" size={48} color="#4ECDC4" />
            <Text style={styles.customWorkoutTitle}>{t('workouts.startCustomWorkout')}</Text>
            <Text style={styles.customWorkoutSubtitle}>{t('workouts.buildYourOwn')}</Text>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>{t('workouts.workoutTemplates')}</Text>
          {predefinedWorkouts.map(template => (
            <TouchableOpacity
              key={template.id}
              style={styles.templateCard}
              onPress={() => startWorkout(template)}
            >
              <View style={styles.templateHeader}>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templateExercises}>
                    {template.exercises.length} {t('common.exercises')}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name={template.category === 'strength' ? 'dumbbell' : 'run-fast'}
                  size={32}
                  color={template.category === 'strength' ? '#4ECDC4' : '#FF6B35'}
                />
              </View>
              <View style={styles.templateExercisesList}>
                {template.exercises.slice(0, 3).map((ex, idx) => (
                  <Text key={idx} style={styles.templateExerciseItem}>• {ex.name}</Text>
                ))}
                {template.exercises.length > 3 && (
                  <Text style={styles.templateExerciseMore}>
                    +{template.exercises.length - 3} {t('workouts.moreExercises')}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Active Workout Header */}
      <View style={styles.activeHeader}>
        <View style={styles.activeHeaderTop}>
          <View>
            <Text style={styles.activeWorkoutName}>{activeWorkout.name}</Text>
            <Text style={styles.workoutTimer}>{formatTime(elapsedTime)}</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={cancelWorkout}
            >
              <MaterialCommunityIcons name="close" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.timerButton}
              onPress={() => setShowTimerModal(true)}
            >
              <MaterialCommunityIcons name="timer" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.finishButton}
              onPress={finishWorkout}
            >
              <Text style={styles.finishButtonText}>{t('workouts.finishButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Exercises List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {exercises.map((exercise, exerciseIndex) => (
          <Card key={exercise.id} style={styles.exerciseCard}>
            <Card.Content>
              <View style={styles.exerciseHeader}>
                <MaterialCommunityIcons
                  name={getMuscleGroupIcon(exercise.muscleGroup) as any}
                  size={24}
                  color="#4ECDC4"
                />
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <TouchableOpacity onPress={() => removeExercise(exercise.id)}>
                  <MaterialCommunityIcons name="close" size={24} color="#FF6B35" />
                </TouchableOpacity>
              </View>

              {/* Sets */}
              <View style={styles.setsHeader}>
                <Text style={styles.setLabel}>{t('workouts.setLabel')}</Text>
                <Text style={styles.weightLabel}>{t('workouts.kg')}</Text>
                <Text style={styles.repsLabel}>{t('workouts.repsLabel')}</Text>
                <Text style={styles.doneLabel}>✓</Text>
              </View>

              {exercise.sets.map((set, setIndex) => (
                <View key={set.id} style={styles.setRow}>
                  <Text style={styles.setNumber}>{setIndex + 1}</Text>
                  <TextInput
                    style={styles.weightInput}
                    value={set.weight.toString()}
                    onChangeText={(value) => updateSet(exercise.id, set.id, 'weight', value)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <TextInput
                    style={styles.repsInput}
                    value={set.reps.toString()}
                    onChangeText={(value) => updateSet(exercise.id, set.id, 'reps', value)}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <TouchableOpacity
                    style={[styles.checkButton, set.completed && styles.checkButtonCompleted]}
                    onPress={() => toggleSetComplete(exercise.id, set.id)}
                  >
                    <MaterialCommunityIcons
                      name={set.completed ? "check-circle" : "check-circle-outline"}
                      size={24}
                      color={set.completed ? "white" : "#4ECDC4"}
                    />
                  </TouchableOpacity>
                  {exercise.sets.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeSetButton}
                      onPress={() => removeSet(exercise.id, set.id)}
                    >
                      <MaterialCommunityIcons name="minus-circle" size={20} color="#FF6B35" />
                    </TouchableOpacity>
                  )}
                </View>
              ))}

              <TouchableOpacity
                style={styles.addSetButton}
                onPress={() => addSet(exercise.id)}
              >
                <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#4ECDC4" />
                <Text style={styles.addSetText}>{t('workouts.addSet')}</Text>
              </TouchableOpacity>
            </Card.Content>
          </Card>
        ))}

        <TouchableOpacity
          style={styles.addExerciseButton}
          onPress={() => setShowAddExerciseModal(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#4ECDC4" />
          <Text style={styles.addExerciseText}>{t('workouts.addExercise')}</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Rest Timer Modal */}
      <Modal
        visible={showTimerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTimerModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.timerModalContent}>
            <Text style={styles.timerModalTitle}>{t('workouts.restTimer')}</Text>
            <Text style={styles.timerDisplay}>{formatTime(restTimer)}</Text>
            <View style={styles.timerButtons}>
              <TouchableOpacity
                style={styles.timerControlButton}
                onPress={() => setRestTimer(prev => Math.max(0, prev - 30))}
              >
                <Text style={styles.timerControlText}>-30s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.timerControlButton, styles.timerPlayButton]}
                onPress={() => setTimerActive(!timerActive)}
              >
                <MaterialCommunityIcons
                  name={timerActive ? "pause" : "play"}
                  size={32}
                  color="white"
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.timerControlButton}
                onPress={() => setRestTimer(prev => prev + 30)}
              >
                <Text style={styles.timerControlText}>+30s</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.closeTimerButton}
              onPress={() => setShowTimerModal(false)}
            >
              <Text style={styles.closeTimerText}>{t('workouts.closeButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Exercise Modal */}
      <Modal
        visible={showAddExerciseModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddExerciseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('workouts.addExercise')}</Text>
            <TextInput
              style={styles.modalInput}
              value={newExerciseName}
              onChangeText={setNewExerciseName}
              placeholder={t('workouts.exerciseNamePlaceholder')}
            />
            <View style={styles.modalRow}>
              <View style={styles.modalInputContainer}>
                <Text style={styles.modalInputLabel}>{t('workouts.setsPlaceholder')}</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalInputSmall]}
                  value={newExerciseSets}
                  onChangeText={setNewExerciseSets}
                  keyboardType="numeric"
                  placeholder="3"
                />
              </View>
              <View style={styles.modalInputContainer}>
                <Text style={styles.modalInputLabel}>{t('workouts.repsPlaceholder')}</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalInputSmall]}
                  value={newExerciseReps}
                  onChangeText={setNewExerciseReps}
                  keyboardType="numeric"
                  placeholder="10"
                />
              </View>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowAddExerciseModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('general.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={addExercise}
              >
                <Text style={styles.saveButtonText}>{t('general.add')}</Text>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  customWorkoutCard: {
    backgroundColor: 'white',
    margin: 16,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4ECDC4',
    borderStyle: 'dashed',
  },
  customWorkoutTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  customWorkoutSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 10,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 2,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 10,
  },
  templateCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  templateExercises: {
    fontSize: 12,
    color: '#666',
  },
  templateExercisesList: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  templateExerciseItem: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  templateExerciseMore: {
    fontSize: 13,
    color: '#4ECDC4',
    fontStyle: 'italic',
    marginTop: 4,
  },
  activeHeader: {
    backgroundColor: '#4ECDC4',
    padding: 16,
    paddingTop: 20,
  },
  activeHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeWorkoutName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  workoutTimer: {
    fontSize: 16,
    color: 'white',
    marginTop: 4,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    backgroundColor: 'rgba(255,107,53,0.3)',
    padding: 10,
    borderRadius: 10,
  },
  timerButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 10,
    borderRadius: 10,
  },
  finishButton: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  finishButtonText: {
    color: '#4ECDC4',
    fontWeight: 'bold',
  },
  exerciseCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  setsHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 8,
  },
  setLabel: {
    width: 40,
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  weightLabel: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  repsLabel: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  doneLabel: {
    width: 40,
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  setNumber: {
    width: 40,
    fontSize: 14,
    fontWeight: 'bold',
  },
  weightInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 4,
    textAlign: 'center',
    fontSize: 14,
  },
  repsInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 4,
    textAlign: 'center',
    fontSize: 14,
  },
  checkButton: {
    width: 40,
    alignItems: 'center',
  },
  checkButtonCompleted: {
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    padding: 2,
  },
  removeSetButton: {
    marginLeft: 8,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  addSetText: {
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: '500',
  },
  addExerciseButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4ECDC4',
    borderStyle: 'dashed',
  },
  addExerciseText: {
    color: '#4ECDC4',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: width - 40,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  modalInputContainer: {
    flex: 1,
  },
  modalInputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modalInputSmall: {
    marginBottom: 0,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#F5F5F5',
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  timerModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: width - 60,
    maxWidth: 350,
  },
  timerModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  timerDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 30,
  },
  timerButtons: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  timerControlButton: {
    backgroundColor: '#F5F5F5',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerPlayButton: {
    backgroundColor: '#4ECDC4',
  },
  timerControlText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  closeTimerButton: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
  },
  closeTimerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
});

export default WorkoutScreen;