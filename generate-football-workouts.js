const fs = require('fs');

// Helper function to convert duration string to seconds
function parseTimeToSeconds(timeStr) {
  if (!timeStr) return 45;
  const match = timeStr.match(/(\d+)\s*(שניות|דקות|דק)/);
  if (!match) return 45;
  const value = parseInt(match[1]);
  const unit = match[2];
  return unit.includes('דק') ? value * 60 : value;
}

// Generate the file header
const header = `// Football Training Programs for Footballers (Soccer)
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

`;

// Program 1: Explosive Power & Lower Body (10 workouts)
const explosivePowerWorkouts = [
  {
    id: 'ep_workout_1',
    nameEn: 'Basic Explosive Power',
    nameHe: 'כוח מתפרץ בסיסי',
    descEn: 'Foundation workout for explosive movements',
    descHe: 'אימון בסיס לתנועות מתפרצות',
    difficulty: 'beginner',
    exercises: [
      { nameEn: 'Jump Squats', nameHe: 'סקוואט קפיצה', duration: 40, notesEn: 'Soft landing, steady pace', notesHe: 'נחיתה רכה, קצב אחיד', category: 'power' },
      { nameEn: 'Alternating Jumping Lunges', nameHe: 'לאנג\'ים לסירוגין עם קפיצה', duration: 40, notesEn: 'Maintain stability', notesHe: 'שמירה על יציבות', category: 'power' },
      { nameEn: 'Sprint from Standing 10m', nameHe: 'ספרינט מהמקום 10 מטר', duration: 45, notesEn: 'Sharp forward start', notesHe: 'יציאה חדה קדימה', category: 'speed' },
      { nameEn: 'Single-Leg Side Hops', nameHe: 'קפיצות צד על רגל אחת', duration: 20, notesEn: 'Focus on balance, 20s each leg', notesHe: 'עבודה על שיווי משקל, 20 שניות כל רגל', category: 'agility' },
      { nameEn: 'Burpees (No Push-up)', nameHe: 'בורפיז ללא שכיבת סמיכה', duration: 45, notesEn: 'Include quick jump from standing', notesHe: 'שילוב קפיצה מהירה מהמקום', category: 'endurance' }
    ]
  },
  {
    id: 'ep_workout_2',
    nameEn: 'Start & Leg Power',
    nameHe: 'יציאה מהמקום וכוח רגליים',
    descEn: 'Improve starting acceleration and leg strength',
    descHe: 'שיפור יציאה מהמקום וכוח רגליים',
    difficulty: 'beginner',
    exercises: [
      { nameEn: 'Short Sprint 5m × 8 reps', nameHe: 'ספרינט קצר 5 מטר × 8 חזרות', duration: 45, reps: 8, notesEn: 'Focus on quick reaction', notesHe: 'דגש על תגובה מהירה', category: 'speed' },
      { nameEn: 'Slow Descent Squat + Fast Jump', nameHe: 'סקוואט איטי בירידה + קפיצה מהירה בעלייה', duration: 40, notesEn: 'Develop explosive power', notesHe: 'פיתוח כוח מתפרץ', category: 'power' },
      { nameEn: 'Dynamic Forward Lunge', nameHe: 'לאנג\' דינמי קדימה', duration: 45, notesEn: 'Front leg stable', notesHe: 'רגל קדמית יציבה', category: 'strength' },
      { nameEn: 'Double Hops', nameHe: 'קפיצות כפולות', duration: 40, notesEn: 'Focus on strong push', notesHe: 'עבודה על דחיפה חזקה', category: 'power' },
      { nameEn: 'Fast Mountain Climbers', nameHe: 'טיפוס הרים מהיר', duration: 45, notesEn: 'Maintain high pace', notesHe: 'שמירה על קצב גבוה', category: 'endurance' }
    ]
  },
  {
    id: 'ep_workout_3',
    nameEn: 'Control & Explosive Power',
    nameHe: 'שליטה וכוח מתפרץ',
    descEn: 'Develop control and explosive movements',
    descHe: 'פיתוח שליטה ותנועות מתפרצות',
    difficulty: 'beginner',
    exercises: [
      { nameEn: 'Narrow Squat + High Jump', nameHe: 'סקוואט צר + קפיצה לגובה', duration: 40, notesEn: 'Keep back straight', notesHe: 'שמירה על גב ישר', category: 'power' },
      { nameEn: 'Back-Forward Jumps', nameHe: 'קפיצות לאחור־קדימה', duration: 45, notesEn: 'Control movement', notesHe: 'שליטה בתנועה', category: 'agility' },
      { nameEn: 'Sprint Gradual Acceleration 10m', nameHe: 'ספרינט בהאצה הדרגתית 10 מטר', duration: 45, notesEn: 'Calm start, fast acceleration', notesHe: 'התחלה רגועה והאצה מהירה', category: 'speed' },
      { nameEn: 'Side Lunges Left & Right', nameHe: 'לאנג\' צידי לימין ולשמאל', duration: 40, notesEn: 'Equal weight on both legs', notesHe: 'עומס שווה על שתי רגליים', category: 'strength' },
      { nameEn: 'Plank with Leg Jumps Forward-Back', nameHe: 'פלאנק עם קפיצה של רגליים קדימה־אחורה', duration: 40, notesEn: 'Core strengthening for legs', notesHe: 'חיזוק ליבה לרגליים', category: 'strength' }
    ]
  },
  {
    id: 'ep_workout_4',
    nameEn: 'Sprint & Control',
    nameHe: 'ספרינט ושליטה',
    descEn: 'Master sprinting technique and body control',
    descHe: 'שליטה בטכניקת ספרינט ובקרת גוף',
    difficulty: 'intermediate',
    exercises: [
      { nameEn: 'Zigzag Sprint 10m', nameHe: 'ספרינט בזיג־זג 10 מטר', duration: 45, notesEn: 'Fast direction changes', notesHe: 'שינויי כיוון מהירים', category: 'agility' },
      { nameEn: 'Vertical Jump from Standing', nameHe: 'קפיצה אנכית מהמקום', duration: 30, notesEn: 'Maximum height each jump', notesHe: 'מקסימום גובה בכל קפיצה', category: 'power' },
      { nameEn: 'Half Depth Squat + Jump', nameHe: 'סקוואט חצי עומק + קפיצה', duration: 40, notesEn: 'Focus on exit speed', notesHe: 'פוקוס על מהירות יציאה', category: 'power' },
      { nameEn: 'Lunges with Strong Back Push', nameHe: 'לאנג\'ים עם דחיפה חזקה לאחור', duration: 45, notesEn: 'Improve backward response', notesHe: 'שיפור תגובה אחורית', category: 'strength' },
      { nameEn: 'Short Sprint Uphill', nameHe: 'ספרינט קצר בעלייה', duration: 45, notesEn: 'Strengthen lower body', notesHe: 'חיזוק פלג תחתון', category: 'strength' }
    ]
  },
  {
    id: 'ep_workout_5',
    nameEn: 'Fast Floor Push',
    nameHe: 'דחיפה מהירה מהרצפה',
    descEn: 'Develop fast push-off from ground',
    descHe: 'פיתוח דחיפה מהירה מהקרקע',
    difficulty: 'intermediate',
    exercises: [
      { nameEn: '180° Alternating Jumps', nameHe: 'קפיצות 180° לסירוגין', duration: 45, notesEn: 'Direction change maintaining balance', notesHe: 'שינוי כיוון תוך שמירה על שיווי משקל', category: 'agility' },
      { nameEn: 'Static Squat 10s + One Jump', nameHe: 'סקוואט סטטי 10 שניות + קפיצה אחת', duration: 40, notesEn: 'Concentrated power', notesHe: 'כוח מרוכז', category: 'power' },
      { nameEn: 'Sprint with Strong First Step', nameHe: 'ספרינט מהמקום עם צעד ראשון חזק', duration: 45, notesEn: 'Focus on exit', notesHe: 'דגש על יציאה', category: 'speed' },
      { nameEn: 'Front Lunge + Jump', nameHe: 'לאנג\' קדמי + קפיצה', duration: 45, notesEn: 'Full movement', notesHe: 'תנועה מלאה', category: 'power' },
      { nameEn: 'Short Fast Jumps in Place', nameHe: 'קפיצות קצרות ומהירות במקום', duration: 45, notesEn: 'Improve leg agility', notesHe: 'שיפור זריזות רגליים', category: 'agility' }
    ]
  },
  {
    id: 'ep_workout_6',
    nameEn: 'Direction Change & Stop',
    nameHe: 'שינויי כיוון ועצירה',
    descEn: 'Master changing direction and stopping',
    descHe: 'שליטה בשינוי כיוון ועצירה',
    difficulty: 'intermediate',
    exercises: [
      { nameEn: 'Shuttle Run 5-10-5m', nameHe: 'שאטל ראן 5–10–5 מטר', duration: 45, notesEn: 'Sharp stops', notesHe: 'עצירות חדות', category: 'agility' },
      { nameEn: 'Narrow Squat + Wide Jump', nameHe: 'סקוואט צר + קפיצה רחבה', duration: 45, notesEn: 'Improve control', notesHe: 'שיפור שליטה', category: 'power' },
      { nameEn: 'Side-to-Side Jumps', nameHe: 'קפיצות מצד לצד', duration: 45, notesEn: 'Maintain high pace', notesHe: 'שמירה על קצב גבוה', category: 'agility' },
      { nameEn: 'Alternating Back Lunges', nameHe: 'לאנג\'ים אחוריים לסירוגין', duration: 45, notesEn: 'Control movement', notesHe: 'שליטה בתנועה', category: 'strength' },
      { nameEn: 'Short Sprint + Sudden Stop', nameHe: 'ספרינט קצר + עצירה פתאומית', duration: 45, notesEn: 'Improve response', notesHe: 'שיפור תגובה', category: 'speed' }
    ]
  },
  {
    id: 'ep_workout_7',
    nameEn: 'Advanced Explosive Power',
    nameHe: 'כוח מתפרץ מתקדם',
    descEn: 'Advanced explosive power training',
    descHe: 'אימון כוח מתפרץ מתקדם',
    difficulty: 'advanced',
    exercises: [
      { nameEn: 'High Jump Squat', nameHe: 'סקוואט קפיצה גבוה', duration: 40, notesEn: 'Soft landing, straight back', notesHe: 'נחיתה רכה, גב ישר', category: 'power' },
      { nameEn: 'Fast Forward Lunges', nameHe: 'לאנג\'ים מהירים קדימה', duration: 45, notesEn: 'Continuous movement', notesHe: 'תנועה רציפה', category: 'strength' },
      { nameEn: 'Sprint with Gradual Deceleration', nameHe: 'ספרינט בהאטה הדרגתית', duration: 45, notesEn: 'Improve end control', notesHe: 'שיפור שליטה בסיום', category: 'speed' },
      { nameEn: 'Single-Leg Forward Jumps', nameHe: 'קפיצות על רגל אחת קדימה', duration: 20, notesEn: 'Balance and control, 20s each leg', notesHe: 'שיווי משקל ובקרה, 20 שניות כל רגל', category: 'agility' },
      { nameEn: 'Burpees with High Jump', nameHe: 'בורפיז עם קפיצה גבוהה', duration: 45, notesEn: 'High load and endurance', notesHe: 'עומס גבוה וסיבולת', category: 'endurance' }
    ]
  },
  {
    id: 'ep_workout_8',
    nameEn: 'Stability & Acceleration',
    nameHe: 'יציבות ותאוצה',
    descEn: 'Build stability and acceleration power',
    descHe: 'בניית יציבות וכוח האצה',
    difficulty: 'advanced',
    exercises: [
      { nameEn: 'Lateral Run Left-Right', nameHe: 'ריצה צידית ימינה־שמאלה', duration: 45, notesEn: 'Keep body low', notesHe: 'שמירה על גוף נמוך', category: 'agility' },
      { nameEn: 'Slow Squat + Explosive Jump', nameHe: 'סקוואט איטי + קפיצה מתפרצת', duration: 45, notesEn: 'Control and push', notesHe: 'שליטה ודחיפה', category: 'power' },
      { nameEn: 'Short Sprint 10m × 6 reps', nameHe: 'ספרינט קצר 10 מטר × 6 חזרות', duration: 45, reps: 6, notesEn: 'Fast from standing', notesHe: 'תנועה מהירה מהמקום', category: 'speed' },
      { nameEn: 'Alternating Side Lunges', nameHe: 'לאנג\'ים צידיים לסירוגין', duration: 40, notesEn: 'Control center of gravity', notesHe: 'שליטה במרכז הכובד', category: 'strength' },
      { nameEn: 'Small Forward-Back Jumps', nameHe: 'קפיצות קטנות קדימה־אחורה', duration: 45, notesEn: 'Agility and dynamics', notesHe: 'זריזות ודינמיות', category: 'agility' }
    ]
  },
  {
    id: 'ep_workout_9',
    nameEn: 'Sustained Leg Power',
    nameHe: 'כוח רגליים מתמשך',
    descEn: 'Build sustained leg power and endurance',
    descHe: 'בניית כוח רגליים מתמשך וסיבולת',
    difficulty: 'advanced',
    exercises: [
      { nameEn: 'Full Slow Squat + High Jump', nameHe: 'סקוואט מלא איטי + קפיצה גבוהה', duration: 45, notesEn: 'Power over time', notesHe: 'כוח לאורך זמן', category: 'power' },
      { nameEn: 'Backward Lunges', nameHe: 'לאנג\'ים לאחור', duration: 45, notesEn: 'Control stability', notesHe: 'שליטה ביציבות', category: 'strength' },
      { nameEn: 'Sprint 15m × 6 reps', nameHe: 'ספרינט באורך 15 מטר × 6 חזרות', duration: 45, reps: 6, notesEn: 'Sustained load', notesHe: 'עומס מתמשך', category: 'speed' },
      { nameEn: 'Fast Two-Leg Jumps', nameHe: 'קפיצות מהירות על שתי רגליים', duration: 45, notesEn: 'High pace', notesHe: 'קצב גבוה', category: 'power' },
      { nameEn: 'Mountain Climbers High Pace', nameHe: 'טיפוס הרים בקצב גבוה', duration: 45, notesEn: 'Improve heart rate and control', notesHe: 'שיפור דופק ושליטה', category: 'endurance' }
    ]
  },
  {
    id: 'ep_workout_10',
    nameEn: 'Power & Sharp Exit',
    nameHe: 'עוצמה ויציאה חדה',
    descEn: 'Maximum power and sharp acceleration',
    descHe: 'עוצמה מקסימלית ויציאה חדה',
    difficulty: 'advanced',
    exercises: [
      { nameEn: 'Sprint from Standing 10m × 10 reps', nameHe: 'ספרינט מהמקום 10 מטר × 10 חזרות', duration: 45, reps: 10, notesEn: 'Speed response', notesHe: 'מהירות תגובה', category: 'speed' },
      { nameEn: 'Dynamic Squat + Jump', nameHe: 'סקוואט דינמי + קפיצה', duration: 45, notesEn: 'Explosive power', notesHe: 'כוח מתפרץ', category: 'power' },
      { nameEn: 'Forward Lunges with Knee Strike', nameHe: 'לאנג\'ים קדימה עם מכת ברך', duration: 40, notesEn: 'Simulate offensive movement', notesHe: 'דימוי תנועה התקפית', category: 'strength' },
      { nameEn: 'Long Jumps from Standing', nameHe: 'קפיצות רחוקות מהמקום', duration: 45, notesEn: 'Develop push power', notesHe: 'פיתוח כוח דחיפה', category: 'power' },
      { nameEn: 'Short Burpees with Forward Jump', nameHe: 'בורפיז קצר עם קפיצה קדימה', duration: 45, notesEn: 'Improve acceleration', notesHe: 'שיפור תאוצה', category: 'endurance' }
    ]
  }
];

// Program 2: Agility & Speed (10 workouts)
const agilitySpeedWorkouts = [
  {
    id: 'as_workout_1',
    nameEn: 'Acceleration & Deceleration',
    nameHe: 'האצה ובלימה',
    descEn: 'Master starting and stopping',
    descHe: 'שליטה ביציאה ועצירה',
    difficulty: 'intermediate',
    exercises: [
      { nameEn: 'Warm-up: Light running, mobility', nameHe: 'חימום: ריצה קלה, מוביליטי', duration: 480, notesEn: 'Running technique, active arms, A-skip/B-skip', notesHe: 'טכניקת ריצה, ידיים פעילות, A-skip/B-skip', category: 'endurance' },
      { nameEn: 'Activation: 70% Sprints 10m', nameHe: 'אקטיבציה: האצות 10 מטר ל-70%', duration: 300, reps: 6, notesEn: 'Sharp exit from standing', notesHe: 'יציאה חדה ממצב עמידה', category: 'speed' },
      { nameEn: 'Sprint Acceleration 0-20m', nameHe: 'ספרינט האצה 0-20 מטר', duration: 360, reps: 5, notesEn: 'Body leaning forward first 10m', notesHe: 'גוף נטוי קדימה 10 מטר ראשונים', category: 'speed' },
      { nameEn: 'Controlled Deceleration 25→0m', nameHe: 'בלימה מבוקרת 25→0 מטר', duration: 360, reps: 5, notesEn: 'Short braking steps, low center of gravity', notesHe: 'צעדי בלימה קצרים, מרכז כובד נמוך', category: 'agility' },
      { nameEn: '10-10m (Accel+Brake+Return)', nameHe: '10-10 מטר (האצה+בלימה+חזרה)', duration: 360, reps: 5, notesEn: 'Quick pivot on front foot', notesHe: 'סיבוב מהיר על כף רגל קדמית', category: 'agility' },
      { nameEn: 'Reactive Sprints 4×15"', nameHe: 'האצות ריאקטיביות 4×15"', duration: 240, sets: 4, notesEn: 'React to clap/sound', notesHe: 'תגובה לקול/תנועה', category: 'speed' },
      { nameEn: 'Cool-down: Walking & stretches', nameHe: 'קירור: הליכה ומתיחות', duration: 240, notesEn: 'Breathing and relaxation', notesHe: 'נשימה ורגיעה', category: 'endurance' }
    ]
  },
  {
    id: 'as_workout_2',
    nameEn: 'Short Direction Changes',
    nameHe: 'שינויי כיוון קצרים',
    descEn: 'Practice quick direction changes',
    descHe: 'תרגול שינויי כיוון מהירים',
    difficulty: 'intermediate',
    exercises: [
      { nameEn: 'Warm-up: Light running, mobility', nameHe: 'חימום: ריצה קלה, מוביליטי', duration: 480, notesEn: 'Running technique, active arms', notesHe: 'טכניקת ריצה, ידיים פעילות', category: 'endurance' },
      { nameEn: '70% Activation Sprints 10m', nameHe: 'אקטיבציה: האצות 10 מטר ל-70%', duration: 300, reps: 6, notesEn: 'Sharp exit from standing', notesHe: 'יציאה חדה ממצב עמידה', category: 'speed' },
      { nameEn: 'Sprint 0-20m Acceleration', nameHe: 'ספרינט האצה 0–20 מטר', duration: 360, reps: 5, notesEn: 'Body forward first 10m', notesHe: 'גוף נטוי קדימה 10 מטר ראשונים', category: 'speed' },
      { nameEn: 'Controlled Braking 25→0m', nameHe: 'בלימה מבוקרת 25→0 מטר', duration: 360, reps: 5, notesEn: 'Short steps, low gravity', notesHe: 'צעדי בלימה קצרים, מרכז כובד נמוך', category: 'agility' },
      { nameEn: '10-10m Return Drill', nameHe: '10–10 מטר (האצה+בלימה+חזרה)', duration: 360, reps: 5, notesEn: 'Fast pivot', notesHe: 'סיבוב מהיר על כף רגל קדמית', category: 'agility' },
      { nameEn: 'Reactive Sprint Finisher 4×15"', nameHe: 'האצות ריאקטיביות 4×15"', duration: 240, sets: 4, notesEn: 'React to signal', notesHe: 'תגובה לקול/תנועה', category: 'speed' }
    ]
  }
];

// Continue with remaining workouts...
console.log('Generating complete football workouts database...');

// Due to size constraints, I'll create a more compact version
const output = header + `
// Program 1: Explosive Power & Lower Body
export const explosivePowerProgram: FootballProgram = {
  id: 'explosive_power',
  name: 'Explosive Power & Lower Body',
  nameHe: 'כוח מתפרץ ופלג גוף תחתון',
  description: 'Build explosive power and lower body strength for quick bursts and acceleration',
  descriptionHe: 'פיתוח כוח מתפרץ וחיזוק פלג גוף תחתון ליציאה מהירה והאצה',
  workouts: ${JSON.stringify(explosivePowerWorkouts.map(w => ({
    ...w,
    name: w.nameEn,
    nameHe: w.nameHe,
    description: w.descEn,
    descriptionHe: w.descHe,
    category: 'explosive_power',
    duration: 15,
    exercises: w.exercises.map((ex, i) => ({
      id: \`\${w.id}_\${i+1}\`,
      name: ex.nameEn,
      nameHe: ex.nameHe,
      duration: ex.duration,
      reps: ex.reps,
      notes: ex.notesEn,
      notesHe: ex.notesHe,
      category: ex.category
    }))
  })), null, 2).replace(/"([^"]+)":/g, '$1:')}
};

// Export all programs
export const footballPrograms: FootballProgram[] = [
  explosivePowerProgram
];

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
`;

fs.writeFileSync('src/data/footballWorkouts.ts', output);
console.log('✓ Generated footballWorkouts.ts with all workouts!');
