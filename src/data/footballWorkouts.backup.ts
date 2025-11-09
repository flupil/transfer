// Football Training Programs for Footballers (Soccer)
// Hebrew training content translated and structured for the app

export interface FootballExercise {
  id: string;
  name: string;
  nameHe: string;
  duration: number; // in seconds
  reps?: number;
  sets?: number;
  rest?: number;
  notes: string;
  notesHe: string;
  category: 'power' | 'speed' | 'agility' | 'endurance' | 'strength';
}

export interface FootballWorkout {
  id: string;
  name: string;
  nameHe: string;
  description: string;
  descriptionHe: string;
  category: 'explosive_power' | 'agility_speed' | 'cardio_endurance' | 'strength_endurance' | 'leg_power';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // total duration in minutes
  exercises: FootballExercise[];
}

export interface FootballProgram {
  id: string;
  name: string;
  nameHe: string;
  description: string;
  descriptionHe: string;
  workouts: FootballWorkout[];
}

// Program 1: Explosive Power & Lower Body
export const explosivePowerProgram: FootballProgram = {
  id: 'explosive_power',
  name: 'Explosive Power & Lower Body',
  nameHe: 'כוח מתפרץ ופלג גוף תחתון',
  description: 'Build explosive power and lower body strength for quick bursts and acceleration',
  descriptionHe: 'פיתוח כוח מתפרץ וחיזוק פלג גוף תחתון ליציאה מהירה והאצה',
  workouts: [
    {
      id: 'ep_workout_1',
      name: 'Basic Explosive Power',
      nameHe: 'כוח מתפרץ בסיסי',
      description: 'Foundation workout for explosive movements',
      descriptionHe: 'אימון בסיס לתנועות מתפרצות',
      category: 'explosive_power',
      difficulty: 'beginner',
      duration: 15,
      exercises: [
        {
          id: 'ep1_1',
          name: 'Jump Squats',
          nameHe: 'סקוואט קפיצה',
          duration: 40,
          notes: 'Soft landing, steady pace',
          notesHe: 'נחיתה רכה, קצב אחיד',
          category: 'power'
        },
        {
          id: 'ep1_2',
          name: 'Alternating Jumping Lunges',
          nameHe: 'לאנג\'ים לסירוגין עם קפיצה',
          duration: 40,
          notes: 'Maintain stability',
          notesHe: 'שמירה על יציבות',
          category: 'power'
        },
        {
          id: 'ep1_3',
          name: 'Sprint from Standing 10m',
          nameHe: 'ספרינט מהמקום 10 מטר',
          duration: 45,
          notes: 'Sharp forward start',
          notesHe: 'יציאה חדה קדימה',
          category: 'speed'
        },
        {
          id: 'ep1_4',
          name: 'Single-Leg Side Hops',
          nameHe: 'קפיצות צד על רגל אחת',
          duration: 20,
          notes: 'Focus on balance, 20s each leg',
          notesHe: 'עבודה על שיווי משקל, 20 שניות כל רגל',
          category: 'agility'
        },
        {
          id: 'ep1_5',
          name: 'Burpees (No Push-up)',
          nameHe: 'בורפיז ללא שכיבת סמיכה',
          duration: 45,
          notes: 'Include quick jump from standing',
          notesHe: 'שילוב קפיצה מהירה מהמקום',
          category: 'endurance'
        }
      ]
    },
    {
      id: 'ep_workout_2',
      name: 'Start & Leg Power',
      nameHe: 'יציאה מהמקום וכוח רגליים',
      description: 'Improve starting acceleration and leg strength',
      descriptionHe: 'שיפור יציאה מהמקום וכוח רגליים',
      category: 'explosive_power',
      difficulty: 'beginner',
      duration: 15,
      exercises: [
        {
          id: 'ep2_1',
          name: 'Short Sprint 5m × 8 reps',
          nameHe: 'ספרינט קצר 5 מטר × 8 חזרות',
          duration: 45,
          reps: 8,
          notes: 'Focus on quick reaction',
          notesHe: 'דגש על תגובה מהירה',
          category: 'speed'
        },
        {
          id: 'ep2_2',
          name: 'Slow Descent Squat + Fast Jump',
          nameHe: 'סקוואט איטי בירידה + קפיצה מהירה בעלייה',
          duration: 40,
          notes: 'Develop explosive power',
          notesHe: 'פיתוח כוח מתפרץ',
          category: 'power'
        },
        {
          id: 'ep2_3',
          name: 'Dynamic Forward Lunge',
          nameHe: 'לאנג\' דינמי קדימה',
          duration: 45,
          notes: 'Front leg stable',
          notesHe: 'רגל קדמית יציבה',
          category: 'strength'
        },
        {
          id: 'ep2_4',
          name: 'Double Hops',
          nameHe: 'קפיצות כפולות',
          duration: 40,
          notes: 'Focus on strong push',
          notesHe: 'עבודה על דחיפה חזקה',
          category: 'power'
        },
        {
          id: 'ep2_5',
          name: 'Fast Mountain Climbers',
          nameHe: 'טיפוס הרים מהיר',
          duration: 45,
          notes: 'Maintain high pace',
          notesHe: 'שמירה על קצב גבוה',
          category: 'endurance'
        }
      ]
    }
    // Additional workouts 3-10 would follow the same structure
  ]
};

// Program 2: Agility & Speed (No Equipment)
export const agilitySpeedProgram: FootballProgram = {
  id: 'agility_speed',
  name: 'Agility & Speed (No Equipment)',
  nameHe: 'זריזות ומהירות ללא אביזרים',
  description: 'Improve acceleration, deceleration, and change of direction',
  descriptionHe: 'שיפור האצה, בלימה ושינויי כיוון',
  workouts: [
    {
      id: 'as_workout_1',
      name: 'Acceleration & Deceleration',
      nameHe: 'האצה ובלימה',
      description: 'Master starting and stopping',
      descriptionHe: 'שליטה ביציאה ועצירה',
      category: 'agility_speed',
      difficulty: 'intermediate',
      duration: 40,
      exercises: [
        {
          id: 'as1_warmup',
          name: 'Warm-up: Light running, mobility',
          nameHe: 'חימום: ריצה קלה, מוביליטי',
          duration: 480, // 8 minutes
          notes: 'Running technique, active arms, A-skip/B-skip',
          notesHe: 'טכניקת ריצה, ידיים פעילות, A-skip/B-skip',
          category: 'endurance'
        },
        {
          id: 'as1_activation',
          name: 'Activation: 70% Sprints 10m',
          nameHe: 'אקטיבציה: האצות 10 מטר ל-70%',
          duration: 300, // 5 minutes
          reps: 6,
          notes: 'Sharp exit from standing',
          notesHe: 'יציאה חדה ממצב עמידה',
          category: 'speed'
        },
        {
          id: 'as1_drill1',
          name: 'Sprint Acceleration 0-20m',
          nameHe: 'ספרינט האצה 0-20 מטר',
          duration: 360, // 6 minutes
          reps: 5,
          notes: 'Body leaning forward first 10m',
          notesHe: 'גוף נטוי קדימה 10 מטר ראשונים',
          category: 'speed'
        },
        {
          id: 'as1_drill2',
          name: 'Controlled Deceleration 25→0m',
          nameHe: 'בלימה מבוקרת 25→0 מטר',
          duration: 360, // 6 minutes
          reps: 5,
          notes: 'Short braking steps, low center of gravity',
          notesHe: 'צעדי בלימה קצרים, מרכז כובד נמוך',
          category: 'agility'
        },
        {
          id: 'as1_drill3',
          name: '10-10m (Accel+Brake+Return)',
          nameHe: '10-10 מטר (האצה+בלימה+חזרה)',
          duration: 360, // 6 minutes
          reps: 5,
          notes: 'Quick pivot on front foot',
          notesHe: 'סיבוב מהיר על כף רגל קדמית',
          category: 'agility'
        },
        {
          id: 'as1_finisher',
          name: 'Reactive Sprints 4×15"',
          nameHe: 'האצות ריאקטיביות 4×15"',
          duration: 240, // 4 minutes
          sets: 4,
          duration: 15,
          notes: 'React to clap/sound',
          notesHe: 'תגובה לקול/תנועה',
          category: 'speed'
        },
        {
          id: 'as1_cooldown',
          name: 'Cool-down: Walking & stretches',
          nameHe: 'קירור: הליכה ומתיחות',
          duration: 240, // 4 minutes
          notes: 'Breathing and relaxation',
          notesHe: 'נשימה ורגיעה',
          category: 'endurance'
        }
      ]
    }
  ]
};

// Program 3: Cardiovascular Endurance
export const cardioEnduranceProgram: FootballProgram = {
  id: 'cardio_endurance',
  name: 'Cardiovascular Endurance',
  nameHe: 'סיבולת לב-ריאה',
  description: 'Build stamina and cardiovascular fitness for match endurance',
  descriptionHe: 'בניית סיבולת וכושר לב-ריאה למשחק ממושך',
  workouts: [
    {
      id: 'ce_workout_1',
      name: 'Basic Endurance & Speed',
      nameHe: 'סיבולת ומהירות בסיסית',
      description: 'Foundation cardio workout',
      descriptionHe: 'אימון סיבולת בסיס',
      category: 'cardio_endurance',
      difficulty: 'beginner',
      duration: 20,
      exercises: [
        {
          id: 'ce1_1',
          name: 'Sprint 20m + Walk Back',
          nameHe: 'ספרינט 20 מטר + הליכה חזרה',
          duration: 45,
          notes: 'Fast start from standing',
          notesHe: 'יציאה מהירה מהמקום',
          category: 'endurance'
        },
        {
          id: 'ce1_2',
          name: 'Forward-Backward Run (5m)',
          nameHe: 'ריצה קדימה-אחורה (5 מטר הלוך-חזור)',
          duration: 60,
          notes: 'Sharp direction changes',
          notesHe: 'שינויי כיוון חדים',
          category: 'agility'
        },
        {
          id: 'ce1_3',
          name: 'Side Hops Over Line',
          nameHe: 'קפיצות צד לרוחב קו',
          duration: 45,
          notes: 'Agility and balance',
          notesHe: 'זריזות ושיווי משקל',
          category: 'agility'
        },
        {
          id: 'ce1_4',
          name: 'Plank with Alternating Knee Strikes',
          nameHe: 'פלאנק עם מכת ברך לסירוגין',
          duration: 45,
          notes: 'Core strengthening',
          notesHe: 'חיזוק ליבה',
          category: 'strength'
        },
        {
          id: 'ce1_5',
          name: 'Burpee + Short Sprint',
          nameHe: 'בורפיז עם יציאה לספרינט קצר',
          duration: 30,
          notes: 'Reaction and intensity',
          notesHe: 'תגובה ואינטנסיביות',
          category: 'endurance'
        }
      ]
    }
  ]
};

// Combined export of all programs
export const footballPrograms: FootballProgram[] = [
  explosivePowerProgram,
  agilitySpeedProgram,
  cardioEnduranceProgram
];

// Helper functions
export const getWorkoutById = (id: string): FootballWorkout | undefined => {
  for (const program of footballPrograms) {
    const workout = program.workouts.find(w => w.id === id);
    if (workout) return workout;
  }
  return undefined;
};

export const getWorkoutsByCategory = (category: FootballWorkout['category']): FootballWorkout[] => {
  const workouts: FootballWorkout[] = [];
  for (const program of footballPrograms) {
    workouts.push(...program.workouts.filter(w => w.category === category));
  }
  return workouts;
};

export const getWorkoutsByDifficulty = (difficulty: FootballWorkout['difficulty']): FootballWorkout[] => {
  const workouts: FootballWorkout[] = [];
  for (const program of footballPrograms) {
    workouts.push(...program.workouts.filter(w => w.difficulty === difficulty));
  }
  return workouts;
};
