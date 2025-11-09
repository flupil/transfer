import AsyncStorage from '@react-native-async-storage/async-storage';
import professionalPlans from '../data/professionalWorkoutPlans.json';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  duration?: string;
  rest: string;
  muscleGroup: string;
  equipment: string;
  alternatives?: Exercise[];
  instructions?: string;
  tips?: string;
}

export interface WorkoutDay {
  id: string;
  day: string;
  name: string;
  focusArea: string;
  duration: string;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  level: string;
  daysPerWeek: number;
  goal: string;
  workouts: WorkoutDay[];
}

const WORKOUT_PLANS: WorkoutPlan[] = [
  {
    id: 'strength',
    name: 'Strength Builder',
    description: 'Build maximum strength and muscle mass',
    level: 'Intermediate',
    daysPerWeek: 5,
    goal: 'Muscle & Strength',
    workouts: [
      {
        id: 'monday',
        day: 'Monday',
        name: 'Chest & Triceps',
        focusArea: 'Upper Body Push',
        duration: '60 min',
        exercises: [
          {
            id: 'bench-press',
            name: 'Barbell Bench Press',
            sets: 4,
            reps: '6-8',
            weight: 'Heavy',
            rest: '3 min',
            muscleGroup: 'Chest',
            equipment: 'Barbell',
            alternatives: [
              {
                id: 'db-bench',
                name: 'Dumbbell Bench Press',
                sets: 4,
                reps: '8-10',
                weight: 'Heavy',
                rest: '2.5 min',
                muscleGroup: 'Chest',
                equipment: 'Dumbbells'
              },
              {
                id: 'smith-bench',
                name: 'Smith Machine Bench Press',
                sets: 4,
                reps: '6-8',
                weight: 'Heavy',
                rest: '3 min',
                muscleGroup: 'Chest',
                equipment: 'Smith Machine'
              }
            ]
          },
          {
            id: 'incline-db',
            name: 'Incline Dumbbell Press',
            sets: 3,
            reps: '8-10',
            weight: 'Moderate',
            rest: '2 min',
            muscleGroup: 'Upper Chest',
            equipment: 'Dumbbells'
          },
          {
            id: 'cable-fly',
            name: 'Cable Flyes',
            sets: 3,
            reps: '12-15',
            weight: 'Light-Moderate',
            rest: '90 sec',
            muscleGroup: 'Chest',
            equipment: 'Cable Machine'
          },
          {
            id: 'dips',
            name: 'Weighted Dips',
            sets: 3,
            reps: '8-12',
            weight: 'Body + Weight',
            rest: '2 min',
            muscleGroup: 'Chest/Triceps',
            equipment: 'Dip Station'
          },
          {
            id: 'overhead-extension',
            name: 'Overhead Tricep Extension',
            sets: 3,
            reps: '10-12',
            weight: 'Moderate',
            rest: '90 sec',
            muscleGroup: 'Triceps',
            equipment: 'Dumbbell'
          },
          {
            id: 'pushdown',
            name: 'Cable Tricep Pushdown',
            sets: 3,
            reps: '12-15',
            weight: 'Moderate',
            rest: '60 sec',
            muscleGroup: 'Triceps',
            equipment: 'Cable Machine'
          }
        ]
      },
      {
        id: 'tuesday',
        day: 'Tuesday',
        name: 'Back & Biceps',
        focusArea: 'Upper Body Pull',
        duration: '60 min',
        exercises: [
          {
            id: 'deadlift',
            name: 'Conventional Deadlift',
            sets: 4,
            reps: '5-6',
            weight: 'Heavy',
            rest: '3-4 min',
            muscleGroup: 'Back/Full Body',
            equipment: 'Barbell'
          },
          {
            id: 'pullup',
            name: 'Pull-ups',
            sets: 4,
            reps: '8-12',
            weight: 'Body + Weight',
            rest: '2 min',
            muscleGroup: 'Lats',
            equipment: 'Pull-up Bar'
          },
          {
            id: 'bb-row',
            name: 'Barbell Row',
            sets: 3,
            reps: '8-10',
            weight: 'Moderate-Heavy',
            rest: '2 min',
            muscleGroup: 'Back',
            equipment: 'Barbell'
          },
          {
            id: 'cable-row',
            name: 'Seated Cable Row',
            sets: 3,
            reps: '10-12',
            weight: 'Moderate',
            rest: '90 sec',
            muscleGroup: 'Mid Back',
            equipment: 'Cable Machine'
          },
          {
            id: 'bb-curl',
            name: 'Barbell Curl',
            sets: 3,
            reps: '8-10',
            weight: 'Moderate',
            rest: '90 sec',
            muscleGroup: 'Biceps',
            equipment: 'Barbell'
          },
          {
            id: 'hammer-curl',
            name: 'Hammer Curls',
            sets: 3,
            reps: '10-12',
            weight: 'Moderate',
            rest: '60 sec',
            muscleGroup: 'Biceps/Forearms',
            equipment: 'Dumbbells'
          }
        ]
      },
      {
        id: 'wednesday',
        day: 'Wednesday',
        name: 'Rest Day',
        focusArea: 'Recovery',
        duration: '0 min',
        exercises: []
      },
      {
        id: 'thursday',
        day: 'Thursday',
        name: 'Legs',
        focusArea: 'Lower Body',
        duration: '75 min',
        exercises: [
          {
            id: 'squat',
            name: 'Back Squat',
            sets: 4,
            reps: '6-8',
            weight: 'Heavy',
            rest: '3-4 min',
            muscleGroup: 'Quads/Glutes',
            equipment: 'Barbell'
          },
          {
            id: 'front-squat',
            name: 'Front Squat',
            sets: 3,
            reps: '8-10',
            weight: 'Moderate-Heavy',
            rest: '2.5 min',
            muscleGroup: 'Quads',
            equipment: 'Barbell'
          },
          {
            id: 'rdl',
            name: 'Romanian Deadlift',
            sets: 3,
            reps: '8-10',
            weight: 'Moderate-Heavy',
            rest: '2 min',
            muscleGroup: 'Hamstrings/Glutes',
            equipment: 'Barbell'
          },
          {
            id: 'leg-press',
            name: 'Leg Press',
            sets: 3,
            reps: '12-15',
            weight: 'Heavy',
            rest: '2 min',
            muscleGroup: 'Quads',
            equipment: 'Leg Press Machine'
          },
          {
            id: 'leg-curl',
            name: 'Lying Leg Curl',
            sets: 3,
            reps: '10-12',
            weight: 'Moderate',
            rest: '90 sec',
            muscleGroup: 'Hamstrings',
            equipment: 'Machine'
          },
          {
            id: 'calf-raise',
            name: 'Standing Calf Raise',
            sets: 4,
            reps: '12-15',
            weight: 'Moderate',
            rest: '60 sec',
            muscleGroup: 'Calves',
            equipment: 'Machine'
          }
        ]
      },
      {
        id: 'friday',
        day: 'Friday',
        name: 'Shoulders & Abs',
        focusArea: 'Shoulders & Core',
        duration: '55 min',
        exercises: [
          {
            id: 'ohp',
            name: 'Overhead Press',
            sets: 4,
            reps: '6-8',
            weight: 'Heavy',
            rest: '2.5 min',
            muscleGroup: 'Shoulders',
            equipment: 'Barbell'
          },
          {
            id: 'db-press',
            name: 'Dumbbell Shoulder Press',
            sets: 3,
            reps: '8-10',
            weight: 'Moderate',
            rest: '2 min',
            muscleGroup: 'Shoulders',
            equipment: 'Dumbbells'
          },
          {
            id: 'lateral-raise',
            name: 'Lateral Raises',
            sets: 4,
            reps: '12-15',
            weight: 'Light',
            rest: '60 sec',
            muscleGroup: 'Side Delts',
            equipment: 'Dumbbells'
          },
          {
            id: 'rear-delt',
            name: 'Rear Delt Flyes',
            sets: 3,
            reps: '12-15',
            weight: 'Light',
            rest: '60 sec',
            muscleGroup: 'Rear Delts',
            equipment: 'Dumbbells'
          },
          {
            id: 'plank',
            name: 'Weighted Plank',
            sets: 3,
            reps: '1',
            duration: '45-60 sec',
            weight: 'Body + Weight',
            rest: '60 sec',
            muscleGroup: 'Core',
            equipment: 'None'
          },
          {
            id: 'hanging-raise',
            name: 'Hanging Leg Raise',
            sets: 3,
            reps: '10-15',
            weight: 'Bodyweight',
            rest: '60 sec',
            muscleGroup: 'Abs',
            equipment: 'Pull-up Bar'
          }
        ]
      }
    ]
  },
  {
    id: 'hypertrophy',
    name: 'Muscle Builder',
    description: 'High volume training for maximum muscle growth',
    level: 'Intermediate',
    daysPerWeek: 6,
    goal: 'Muscle Growth',
    workouts: [
      {
        id: 'push1',
        day: 'Monday',
        name: 'Push Day 1',
        focusArea: 'Chest Focus',
        duration: '70 min',
        exercises: [
          {
            id: 'incline-bb',
            name: 'Incline Barbell Press',
            sets: 4,
            reps: '8-10',
            weight: 'Moderate-Heavy',
            rest: '2 min',
            muscleGroup: 'Upper Chest',
            equipment: 'Barbell'
          },
          {
            id: 'flat-db',
            name: 'Flat Dumbbell Press',
            sets: 4,
            reps: '10-12',
            weight: 'Moderate',
            rest: '90 sec',
            muscleGroup: 'Chest',
            equipment: 'Dumbbells'
          },
          {
            id: 'decline-press',
            name: 'Decline Press',
            sets: 3,
            reps: '10-12',
            weight: 'Moderate',
            rest: '90 sec',
            muscleGroup: 'Lower Chest',
            equipment: 'Barbell'
          },
          {
            id: 'cable-cross',
            name: 'Cable Crossovers',
            sets: 3,
            reps: '12-15',
            weight: 'Light-Moderate',
            rest: '60 sec',
            muscleGroup: 'Chest',
            equipment: 'Cable Machine'
          },
          {
            id: 'db-shoulder',
            name: 'Seated Dumbbell Press',
            sets: 3,
            reps: '10-12',
            weight: 'Moderate',
            rest: '90 sec',
            muscleGroup: 'Shoulders',
            equipment: 'Dumbbells'
          },
          {
            id: 'skullcrusher',
            name: 'Skullcrushers',
            sets: 3,
            reps: '10-12',
            weight: 'Moderate',
            rest: '60 sec',
            muscleGroup: 'Triceps',
            equipment: 'EZ Bar'
          }
        ]
      },
      {
        id: 'pull1',
        day: 'Tuesday',
        name: 'Pull Day 1',
        focusArea: 'Back Width',
        duration: '70 min',
        exercises: [
          {
            id: 'wide-pullup',
            name: 'Wide Grip Pull-ups',
            sets: 4,
            reps: '8-12',
            weight: 'Bodyweight',
            rest: '2 min',
            muscleGroup: 'Lats',
            equipment: 'Pull-up Bar'
          },
          {
            id: 't-bar',
            name: 'T-Bar Row',
            sets: 4,
            reps: '8-10',
            weight: 'Moderate-Heavy',
            rest: '2 min',
            muscleGroup: 'Back',
            equipment: 'T-Bar'
          },
          {
            id: 'lat-pulldown',
            name: 'Lat Pulldown',
            sets: 3,
            reps: '10-12',
            weight: 'Moderate',
            rest: '90 sec',
            muscleGroup: 'Lats',
            equipment: 'Cable Machine'
          },
          {
            id: 'db-row',
            name: 'Single Arm DB Row',
            sets: 3,
            reps: '10-12',
            weight: 'Moderate',
            rest: '60 sec',
            muscleGroup: 'Back',
            equipment: 'Dumbbell'
          },
          {
            id: 'preacher',
            name: 'Preacher Curl',
            sets: 3,
            reps: '10-12',
            weight: 'Moderate',
            rest: '90 sec',
            muscleGroup: 'Biceps',
            equipment: 'EZ Bar'
          },
          {
            id: 'cable-curl',
            name: 'Cable Curl',
            sets: 3,
            reps: '12-15',
            weight: 'Light-Moderate',
            rest: '60 sec',
            muscleGroup: 'Biceps',
            equipment: 'Cable Machine'
          }
        ]
      },
      {
        id: 'legs1',
        day: 'Wednesday',
        name: 'Legs Day 1',
        focusArea: 'Quad Focus',
        duration: '75 min',
        exercises: [
          {
            id: 'front-squat',
            name: 'Front Squat',
            sets: 4,
            reps: '8-10',
            weight: 'Moderate-Heavy',
            rest: '2.5 min',
            muscleGroup: 'Quads',
            equipment: 'Barbell'
          },
          {
            id: 'hack-squat',
            name: 'Hack Squat',
            sets: 4,
            reps: '10-12',
            weight: 'Heavy',
            rest: '2 min',
            muscleGroup: 'Quads',
            equipment: 'Machine'
          },
          {
            id: 'bulgarian',
            name: 'Bulgarian Split Squat',
            sets: 3,
            reps: '10-12 each',
            weight: 'Moderate',
            rest: '90 sec',
            muscleGroup: 'Quads/Glutes',
            equipment: 'Dumbbells'
          },
          {
            id: 'leg-ext',
            name: 'Leg Extension',
            sets: 3,
            reps: '12-15',
            weight: 'Moderate',
            rest: '60 sec',
            muscleGroup: 'Quads',
            equipment: 'Machine'
          },
          {
            id: 'stiff-leg',
            name: 'Stiff Leg Deadlift',
            sets: 3,
            reps: '10-12',
            weight: 'Moderate',
            rest: '90 sec',
            muscleGroup: 'Hamstrings',
            equipment: 'Barbell'
          },
          {
            id: 'seated-calf',
            name: 'Seated Calf Raise',
            sets: 4,
            reps: '15-20',
            weight: 'Moderate',
            rest: '45 sec',
            muscleGroup: 'Calves',
            equipment: 'Machine'
          }
        ]
      },
      {
        id: 'push2',
        day: 'Thursday',
        name: 'Push Day 2',
        focusArea: 'Shoulder Focus',
        duration: '65 min',
        exercises: [
          {
            id: 'military',
            name: 'Military Press',
            sets: 4,
            reps: '8-10',
            weight: 'Moderate-Heavy',
            rest: '2 min',
            muscleGroup: 'Shoulders',
            equipment: 'Barbell'
          },
          {
            id: 'arnold',
            name: 'Arnold Press',
            sets: 3,
            reps: '10-12',
            weight: 'Moderate',
            rest: '90 sec',
            muscleGroup: 'Shoulders',
            equipment: 'Dumbbells'
          },
          {
            id: 'cable-lateral',
            name: 'Cable Lateral Raise',
            sets: 4,
            reps: '12-15',
            weight: 'Light',
            rest: '45 sec',
            muscleGroup: 'Side Delts',
            equipment: 'Cable Machine'
          },
          {
            id: 'face-pull',
            name: 'Face Pulls',
            sets: 3,
            reps: '15-20',
            weight: 'Light',
            rest: '45 sec',
            muscleGroup: 'Rear Delts',
            equipment: 'Cable Machine'
          },
          {
            id: 'close-grip',
            name: 'Close Grip Bench',
            sets: 3,
            reps: '8-10',
            weight: 'Moderate',
            rest: '90 sec',
            muscleGroup: 'Triceps',
            equipment: 'Barbell'
          },
          {
            id: 'diamond',
            name: 'Diamond Push-ups',
            sets: 3,
            reps: 'To Failure',
            weight: 'Bodyweight',
            rest: '60 sec',
            muscleGroup: 'Triceps',
            equipment: 'None'
          }
        ]
      },
      {
        id: 'pull2',
        day: 'Friday',
        name: 'Pull Day 2',
        focusArea: 'Back Thickness',
        duration: '65 min',
        exercises: [
          {
            id: 'rack-pull',
            name: 'Rack Pulls',
            sets: 4,
            reps: '6-8',
            weight: 'Heavy',
            rest: '3 min',
            muscleGroup: 'Back',
            equipment: 'Barbell'
          },
          {
            id: 'pendlay',
            name: 'Pendlay Row',
            sets: 4,
            reps: '8-10',
            weight: 'Moderate-Heavy',
            rest: '2 min',
            muscleGroup: 'Back',
            equipment: 'Barbell'
          },
          {
            id: 'chest-row',
            name: 'Chest Supported Row',
            sets: 3,
            reps: '10-12',
            weight: 'Moderate',
            rest: '90 sec',
            muscleGroup: 'Back',
            equipment: 'Machine'
          },
          {
            id: 'straight-pulldown',
            name: 'Straight Arm Pulldown',
            sets: 3,
            reps: '12-15',
            weight: 'Light-Moderate',
            rest: '60 sec',
            muscleGroup: 'Lats',
            equipment: 'Cable Machine'
          },
          {
            id: 'concentration',
            name: 'Concentration Curl',
            sets: 3,
            reps: '10-12',
            weight: 'Moderate',
            rest: '60 sec',
            muscleGroup: 'Biceps',
            equipment: 'Dumbbell'
          },
          {
            id: 'reverse-curl',
            name: 'Reverse Curl',
            sets: 3,
            reps: '12-15',
            weight: 'Light',
            rest: '45 sec',
            muscleGroup: 'Forearms',
            equipment: 'EZ Bar'
          }
        ]
      },
      {
        id: 'legs2',
        day: 'Saturday',
        name: 'Legs Day 2',
        focusArea: 'Hamstring/Glute Focus',
        duration: '70 min',
        exercises: [
          {
            id: 'sumo-dl',
            name: 'Sumo Deadlift',
            sets: 4,
            reps: '6-8',
            weight: 'Heavy',
            rest: '3 min',
            muscleGroup: 'Hamstrings/Glutes',
            equipment: 'Barbell'
          },
          {
            id: 'good-morning',
            name: 'Good Mornings',
            sets: 3,
            reps: '10-12',
            weight: 'Moderate',
            rest: '2 min',
            muscleGroup: 'Hamstrings',
            equipment: 'Barbell'
          },
          {
            id: 'walking-lunge',
            name: 'Walking Lunges',
            sets: 3,
            reps: '20 total',
            weight: 'Moderate',
            rest: '90 sec',
            muscleGroup: 'Glutes/Quads',
            equipment: 'Dumbbells'
          },
          {
            id: 'nordic',
            name: 'Nordic Curls',
            sets: 3,
            reps: '6-10',
            weight: 'Bodyweight',
            rest: '2 min',
            muscleGroup: 'Hamstrings',
            equipment: 'None'
          },
          {
            id: 'hip-thrust',
            name: 'Barbell Hip Thrust',
            sets: 3,
            reps: '12-15',
            weight: 'Heavy',
            rest: '90 sec',
            muscleGroup: 'Glutes',
            equipment: 'Barbell'
          },
          {
            id: 'donkey-calf',
            name: 'Donkey Calf Raise',
            sets: 4,
            reps: '15-20',
            weight: 'Moderate',
            rest: '45 sec',
            muscleGroup: 'Calves',
            equipment: 'Machine'
          }
        ]
      }
    ]
  },
  {
    id: 'beginner',
    name: 'Beginner Basics',
    description: 'Full body workouts to build foundation',
    level: 'Beginner',
    daysPerWeek: 3,
    goal: 'Foundation',
    workouts: [
      {
        id: 'fullbody1',
        day: 'Monday',
        name: 'Full Body A',
        focusArea: 'Total Body',
        duration: '45 min',
        exercises: [
          {
            id: 'goblet-squat',
            name: 'Goblet Squat',
            sets: 3,
            reps: '10-12',
            weight: 'Light-Moderate',
            rest: '90 sec',
            muscleGroup: 'Legs',
            equipment: 'Dumbbell'
          },
          {
            id: 'pushup',
            name: 'Push-ups',
            sets: 3,
            reps: '8-15',
            weight: 'Bodyweight',
            rest: '60 sec',
            muscleGroup: 'Chest',
            equipment: 'None'
          },
          {
            id: 'assisted-pullup',
            name: 'Assisted Pull-ups',
            sets: 3,
            reps: '8-12',
            weight: 'Assisted',
            rest: '90 sec',
            muscleGroup: 'Back',
            equipment: 'Machine'
          },
          {
            id: 'db-press-light',
            name: 'Dumbbell Shoulder Press',
            sets: 3,
            reps: '10-12',
            weight: 'Light',
            rest: '60 sec',
            muscleGroup: 'Shoulders',
            equipment: 'Dumbbells'
          },
          {
            id: 'plank-basic',
            name: 'Plank',
            sets: 3,
            reps: '1',
            duration: '30-45 sec',
            weight: 'Bodyweight',
            rest: '45 sec',
            muscleGroup: 'Core',
            equipment: 'None'
          }
        ]
      },
      {
        id: 'rest1',
        day: 'Tuesday',
        name: 'Rest Day',
        focusArea: 'Recovery',
        duration: '0 min',
        exercises: []
      },
      {
        id: 'fullbody2',
        day: 'Wednesday',
        name: 'Full Body B',
        focusArea: 'Total Body',
        duration: '45 min',
        exercises: [
          {
            id: 'leg-press-beginner',
            name: 'Leg Press',
            sets: 3,
            reps: '12-15',
            weight: 'Moderate',
            rest: '90 sec',
            muscleGroup: 'Legs',
            equipment: 'Machine'
          },
          {
            id: 'chest-press-machine',
            name: 'Chest Press Machine',
            sets: 3,
            reps: '10-12',
            weight: 'Light-Moderate',
            rest: '60 sec',
            muscleGroup: 'Chest',
            equipment: 'Machine'
          },
          {
            id: 'lat-pulldown-beginner',
            name: 'Lat Pulldown',
            sets: 3,
            reps: '10-12',
            weight: 'Light-Moderate',
            rest: '60 sec',
            muscleGroup: 'Back',
            equipment: 'Cable Machine'
          },
          {
            id: 'db-curl-beginner',
            name: 'Dumbbell Bicep Curl',
            sets: 3,
            reps: '10-12',
            weight: 'Light',
            rest: '45 sec',
            muscleGroup: 'Biceps',
            equipment: 'Dumbbells'
          },
          {
            id: 'tricep-ext-beginner',
            name: 'Overhead Tricep Extension',
            sets: 3,
            reps: '10-12',
            weight: 'Light',
            rest: '45 sec',
            muscleGroup: 'Triceps',
            equipment: 'Dumbbell'
          }
        ]
      },
      {
        id: 'rest2',
        day: 'Thursday',
        name: 'Rest Day',
        focusArea: 'Recovery',
        duration: '0 min',
        exercises: []
      },
      {
        id: 'fullbody3',
        day: 'Friday',
        name: 'Full Body C',
        focusArea: 'Total Body',
        duration: '45 min',
        exercises: [
          {
            id: 'deadlift-light',
            name: 'Romanian Deadlift',
            sets: 3,
            reps: '10-12',
            weight: 'Light-Moderate',
            rest: '90 sec',
            muscleGroup: 'Hamstrings/Back',
            equipment: 'Barbell'
          },
          {
            id: 'incline-pushup',
            name: 'Incline Push-ups',
            sets: 3,
            reps: '10-15',
            weight: 'Bodyweight',
            rest: '45 sec',
            muscleGroup: 'Chest',
            equipment: 'Bench'
          },
          {
            id: 'cable-row-beginner',
            name: 'Seated Cable Row',
            sets: 3,
            reps: '10-12',
            weight: 'Light-Moderate',
            rest: '60 sec',
            muscleGroup: 'Back',
            equipment: 'Cable Machine'
          },
          {
            id: 'lateral-raise-beginner',
            name: 'Lateral Raises',
            sets: 3,
            reps: '12-15',
            weight: 'Light',
            rest: '45 sec',
            muscleGroup: 'Shoulders',
            equipment: 'Dumbbells'
          },
          {
            id: 'bicycle',
            name: 'Bicycle Crunches',
            sets: 3,
            reps: '20-30',
            weight: 'Bodyweight',
            rest: '45 sec',
            muscleGroup: 'Core',
            equipment: 'None'
          }
        ]
      }
    ]
  }
];

const STORAGE_KEY = '@workout_plans';
const SELECTED_PLAN_KEY = '@selected_workout_plan';

export const getWorkoutPlans = async () => {
  return WORKOUT_PLANS;
};

export const selectWorkoutPlan = async (planId: string) => {
  try {
    await AsyncStorage.setItem(SELECTED_PLAN_KEY, planId);
    return true;
  } catch (error) {
    Alert.alert('Error', 'Selecting workout plan. Please try again.');

    console.error('Error selecting workout plan:', error);
    return false;
  }
};

export const getSelectedWorkoutPlan = async () => {
  try {
    const selectedId = await AsyncStorage.getItem(SELECTED_PLAN_KEY);
    if (selectedId) {
      // First try to find in hardcoded plans
      const hardcodedPlan = WORKOUT_PLANS.find(plan => plan.id === selectedId);
      if (hardcodedPlan) {
        return hardcodedPlan;
      }

      // Then try to find in professional plans (numeric IDs)
      const professionalPlan = (professionalPlans as any[]).find(plan => plan.id.toString() === selectedId);
      if (professionalPlan) {
        // Convert professional plan format to WorkoutPlan format
        return {
          id: professionalPlan.id.toString(),
          name: professionalPlan.name,
          description: professionalPlan.description,
          level: professionalPlan.experience,
          daysPerWeek: professionalPlan.daysPerWeek,
          goal: professionalPlan.goal,
          workouts: professionalPlan.days.map((day: any, index: number) => ({
            id: `day-${index}`,
            day: day.day,
            name: day.day,
            focusArea: professionalPlan.goal,
            duration: professionalPlan.duration,
            exercises: day.exercises.map((exerciseName: string, exIndex: number) => {
              const parts = exerciseName.split(' – ');
              const name = parts[0];
              const setReps = parts.length > 1 ? parts[1] : '3 × 10';

              return {
                id: `ex-${index}-${exIndex}`,
                name: name,
                sets: 3,
                reps: setReps.split(' × ')[1] || '10',
                rest: '90 sec',
                muscleGroup: professionalPlan.goal,
                equipment: professionalPlan.equipment || 'Various'
              };
            })
          }))
        };
      }
    }
    return null;
  } catch (error) {
    Alert.alert('Error', 'Getting selected workout plan. Please try again.');

    console.error('Error getting selected workout plan:', error);
    return null;
  }
};

export const getWorkoutForDay = async (dayId: string) => {
  const selectedPlan = await getSelectedWorkoutPlan();
  if (selectedPlan) {
    return selectedPlan.workouts.find(workout => workout.id === dayId);
  }
  return null;
};

export const replaceExercise = async (workout: WorkoutDay, exerciseId: string, replacementId: string) => {
  const exerciseIndex = workout.exercises.findIndex(ex => ex.id === exerciseId);
  if (exerciseIndex !== -1) {
    const originalExercise = workout.exercises[exerciseIndex];
    const replacement = originalExercise.alternatives?.find(alt => alt.id === replacementId);

    if (replacement) {
      const updatedWorkout = { ...workout };
      updatedWorkout.exercises[exerciseIndex] = {
        ...replacement,
        alternatives: [...(originalExercise.alternatives || []), originalExercise]
          .filter(ex => ex.id !== replacementId)
      };
      return updatedWorkout;
    }
  }
  return workout;
};

export const markExerciseComplete = async (workoutId: string, exerciseId: string) => {
  try {
    const key = `@exercise_complete_${workoutId}_${exerciseId}_${new Date().toDateString()}`;
    await AsyncStorage.setItem(key, 'true');
    return true;
  } catch (error) {
    Alert.alert('Error', 'Marking exercise complete. Please try again.');

    console.error('Error marking exercise complete:', error);
    return false;
  }
};

export const getCompletedExercises = async (workoutId: string) => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const todayKey = `@exercise_complete_${workoutId}_`;
    const todayDate = new Date().toDateString();
    const completedKeys = keys.filter(key =>
      key.startsWith(todayKey) && key.includes(todayDate)
    );

    return completedKeys.map(key => {
      const parts = key.split('_');
      return parts[parts.length - 2];
    });
  } catch (error) {
    Alert.alert('Error', 'Getting completed exercises. Please try again.');

    console.error('Error getting completed exercises:', error);
    return [];
  }
};