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

// Program 1: Explosive Power & Lower Body (10 workouts)
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
        { id: 'ep1_1', name: 'Jump Squats', nameHe: 'סקוואט קפיצה', duration: 40, notes: 'Soft landing, steady pace', notesHe: 'נחיתה רכה, קצב אחיד', category: 'power' },
        { id: 'ep1_2', name: 'Alternating Jumping Lunges', nameHe: 'לאנג\'ים לסירוגין עם קפיצה', duration: 40, notes: 'Maintain stability', notesHe: 'שמירה על יציבות', category: 'power' },
        { id: 'ep1_3', name: 'Sprint from Standing 10m', nameHe: 'ספרינט מהמקום 10 מטר', duration: 45, notes: 'Sharp forward start', notesHe: 'יציאה חדה קדימה', category: 'speed' },
        { id: 'ep1_4', name: 'Single-Leg Side Hops', nameHe: 'קפיצות צד על רגל אחת', duration: 20, notes: 'Focus on balance, 20s each leg', notesHe: 'עבודה על שיווי משקל, 20 שניות כל רגל', category: 'agility' },
        { id: 'ep1_5', name: 'Burpees (No Push-up)', nameHe: 'בורפיז ללא שכיבת סמיכה', duration: 45, notes: 'Include quick jump', notesHe: 'שילוב קפיצה מהירה', category: 'endurance' }
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
        { id: 'ep2_1', name: 'Short Sprint 5m × 8 reps', nameHe: 'ספרינט קצר 5 מטר × 8 חזרות', duration: 45, reps: 8, notes: 'Quick reaction', notesHe: 'תגובה מהירה', category: 'speed' },
        { id: 'ep2_2', name: 'Slow Descent Squat + Fast Jump', nameHe: 'סקוואט איטי + קפיצה מהירה', duration: 40, notes: 'Explosive power', notesHe: 'כוח מתפרץ', category: 'power' },
        { id: 'ep2_3', name: 'Dynamic Forward Lunge', nameHe: 'לאנג\' דינמי קדימה', duration: 45, notes: 'Stable front leg', notesHe: 'רגל קדמית יציבה', category: 'strength' },
        { id: 'ep2_4', name: 'Double Hops', nameHe: 'קפיצות כפולות', duration: 40, notes: 'Strong push', notesHe: 'דחיפה חזקה', category: 'power' },
        { id: 'ep2_5', name: 'Fast Mountain Climbers', nameHe: 'טיפוס הרים מהיר', duration: 45, notes: 'High pace', notesHe: 'קצב גבוה', category: 'endurance' }
      ]
    },
    {
      id: 'ep_workout_3',
      name: 'Control & Explosive Power',
      nameHe: 'שליטה וכוח מתפרץ',
      description: 'Develop control and explosive movements',
      descriptionHe: 'פיתוח שליטה ותנועות מתפרצות',
      category: 'explosive_power',
      difficulty: 'beginner',
      duration: 15,
      exercises: [
        { id: 'ep3_1', name: 'Narrow Squat + High Jump', nameHe: 'סקוואט צר + קפיצה לגובה', duration: 40, notes: 'Straight back', notesHe: 'גב ישר', category: 'power' },
        { id: 'ep3_2', name: 'Back-Forward Jumps', nameHe: 'קפיצות לאחור-קדימה', duration: 45, notes: 'Control movement', notesHe: 'שליטה בתנועה', category: 'agility' },
        { id: 'ep3_3', name: 'Sprint Gradual Acceleration', nameHe: 'ספרינט בהאצה הדרגתית', duration: 45, notes: 'Calm start, fast acceleration', notesHe: 'התחלה רגועה והאצה מהירה', category: 'speed' },
        { id: 'ep3_4', name: 'Side Lunges', nameHe: 'לאנג\' צידי', duration: 40, notes: 'Equal weight', notesHe: 'עומס שווה', category: 'strength' },
        { id: 'ep3_5', name: 'Plank Leg Jumps', nameHe: 'פלאנק עם קפיצת רגליים', duration: 40, notes: 'Core strength', notesHe: 'חיזוק ליבה', category: 'strength' }
      ]
    },
    {
      id: 'ep_workout_4',
      name: 'Sprint & Control',
      nameHe: 'ספרינט ושליטה',
      description: 'Master sprinting technique and body control',
      descriptionHe: 'שליטה בטכניקת ספרינט',
      category: 'explosive_power',
      difficulty: 'intermediate',
      duration: 15,
      exercises: [
        { id: 'ep4_1', name: 'Zigzag Sprint', nameHe: 'ספרינט בזיג-זג', duration: 45, notes: 'Fast direction changes', notesHe: 'שינויי כיוון מהירים', category: 'agility' },
        { id: 'ep4_2', name: 'Vertical Jump', nameHe: 'קפיצה אנכית', duration: 30, notes: 'Maximum height', notesHe: 'מקסימום גובה', category: 'power' },
        { id: 'ep4_3', name: 'Half Squat + Jump', nameHe: 'סקוואט חצי + קפיצה', duration: 40, notes: 'Exit speed', notesHe: 'מהירות יציאה', category: 'power' },
        { id: 'ep4_4', name: 'Lunges Back Push', nameHe: 'לאנג\'ים דחיפה אחורה', duration: 45, notes: 'Backward response', notesHe: 'תגובה אחורית', category: 'strength' },
        { id: 'ep4_5', name: 'Uphill Sprint', nameHe: 'ספרינט בעלייה', duration: 45, notes: 'Lower body strength', notesHe: 'חיזוק פלג תחתון', category: 'strength' }
      ]
    },
    {
      id: 'ep_workout_5',
      name: 'Fast Floor Push',
      nameHe: 'דחיפה מהירה מהרצפה',
      description: 'Develop fast push-off from ground',
      descriptionHe: 'פיתוח דחיפה מהירה',
      category: 'explosive_power',
      difficulty: 'intermediate',
      duration: 15,
      exercises: [
        { id: 'ep5_1', name: '180° Alternating Jumps', nameHe: 'קפיצות 180° לסירוגין', duration: 45, notes: 'Maintain balance', notesHe: 'שיווי משקל', category: 'agility' },
        { id: 'ep5_2', name: 'Static Squat + Jump', nameHe: 'סקוואט סטטי + קפיצה', duration: 40, notes: 'Concentrated power', notesHe: 'כוח מרוכז', category: 'power' },
        { id: 'ep5_3', name: 'Sprint Strong First Step', nameHe: 'ספרינט צעד ראשון חזק', duration: 45, notes: 'Focus on exit', notesHe: 'דגש על יציאה', category: 'speed' },
        { id: 'ep5_4', name: 'Front Lunge + Jump', nameHe: 'לאנג\' קדמי + קפיצה', duration: 45, notes: 'Full movement', notesHe: 'תנועה מלאה', category: 'power' },
        { id: 'ep5_5', name: 'Short Fast Jumps', nameHe: 'קפיצות קצרות מהירות', duration: 45, notes: 'Leg agility', notesHe: 'זריזות רגליים', category: 'agility' }
      ]
    },
    {
      id: 'ep_workout_6',
      name: 'Direction Change & Stop',
      nameHe: 'שינויי כיוון ועצירה',
      description: 'Master changing direction and stopping',
      descriptionHe: 'שליטה בשינוי כיוון',
      category: 'explosive_power',
      difficulty: 'intermediate',
      duration: 15,
      exercises: [
        { id: 'ep6_1', name: 'Shuttle Run 5-10-5m', nameHe: 'שאטל ראן 5-10-5 מטר', duration: 45, notes: 'Sharp stops', notesHe: 'עצירות חדות', category: 'agility' },
        { id: 'ep6_2', name: 'Narrow Squat + Wide Jump', nameHe: 'סקוואט צר + קפיצה רחבה', duration: 45, notes: 'Control', notesHe: 'שליטה', category: 'power' },
        { id: 'ep6_3', name: 'Side-to-Side Jumps', nameHe: 'קפיצות מצד לצד', duration: 45, notes: 'High pace', notesHe: 'קצב גבוה', category: 'agility' },
        { id: 'ep6_4', name: 'Back Lunges', nameHe: 'לאנג\'ים אחוריים', duration: 45, notes: 'Control movement', notesHe: 'שליטה בתנועה', category: 'strength' },
        { id: 'ep6_5', name: 'Sprint + Sudden Stop', nameHe: 'ספרינט + עצירה פתאומית', duration: 45, notes: 'Response', notesHe: 'תגובה', category: 'speed' }
      ]
    },
    {
      id: 'ep_workout_7',
      name: 'Advanced Explosive Power',
      nameHe: 'כוח מתפרץ מתקדם',
      description: 'Advanced explosive power training',
      descriptionHe: 'אימון כוח מתפרץ מתקדם',
      category: 'explosive_power',
      difficulty: 'advanced',
      duration: 15,
      exercises: [
        { id: 'ep7_1', name: 'High Jump Squat', nameHe: 'סקוואט קפיצה גבוה', duration: 40, notes: 'Soft landing', notesHe: 'נחיתה רכה', category: 'power' },
        { id: 'ep7_2', name: 'Fast Forward Lunges', nameHe: 'לאנג\'ים מהירים קדימה', duration: 45, notes: 'Continuous', notesHe: 'תנועה רציפה', category: 'strength' },
        { id: 'ep7_3', name: 'Sprint Gradual Deceleration', nameHe: 'ספרינט בהאטה הדרגתית', duration: 45, notes: 'End control', notesHe: 'שליטה בסיום', category: 'speed' },
        { id: 'ep7_4', name: 'Single-Leg Forward Jumps', nameHe: 'קפיצות על רגל אחת קדימה', duration: 20, notes: 'Balance, 20s each', notesHe: 'שיווי משקל', category: 'agility' },
        { id: 'ep7_5', name: 'Burpees High Jump', nameHe: 'בורפיז עם קפיצה גבוהה', duration: 45, notes: 'High load', notesHe: 'עומס גבוה', category: 'endurance' }
      ]
    },
    {
      id: 'ep_workout_8',
      name: 'Stability & Acceleration',
      nameHe: 'יציבות ותאוצה',
      description: 'Build stability and acceleration power',
      descriptionHe: 'בניית יציבות וכוח האצה',
      category: 'explosive_power',
      difficulty: 'advanced',
      duration: 15,
      exercises: [
        { id: 'ep8_1', name: 'Lateral Run', nameHe: 'ריצה צידית', duration: 45, notes: 'Low body', notesHe: 'גוף נמוך', category: 'agility' },
        { id: 'ep8_2', name: 'Slow Squat + Explosive Jump', nameHe: 'סקוואט איטי + קפיצה מתפרצת', duration: 45, notes: 'Control and push', notesHe: 'שליטה ודחיפה', category: 'power' },
        { id: 'ep8_3', name: 'Short Sprint 10m × 6', nameHe: 'ספרינט קצר 10 מטר × 6', duration: 45, reps: 6, notes: 'Fast from standing', notesHe: 'מהירות מהמקום', category: 'speed' },
        { id: 'ep8_4', name: 'Alternating Side Lunges', nameHe: 'לאנג\'ים צידיים לסירוגין', duration: 40, notes: 'Center of gravity', notesHe: 'מרכז כובד', category: 'strength' },
        { id: 'ep8_5', name: 'Small Forward-Back Jumps', nameHe: 'קפיצות קטנות קדימה-אחורה', duration: 45, notes: 'Agility', notesHe: 'זריזות', category: 'agility' }
      ]
    },
    {
      id: 'ep_workout_9',
      name: 'Sustained Leg Power',
      nameHe: 'כוח רגליים מתמשך',
      description: 'Build sustained leg power',
      descriptionHe: 'בניית כוח רגליים מתמשך',
      category: 'explosive_power',
      difficulty: 'advanced',
      duration: 15,
      exercises: [
        { id: 'ep9_1', name: 'Full Slow Squat + High Jump', nameHe: 'סקוואט מלא איטי + קפיצה גבוהה', duration: 45, notes: 'Power over time', notesHe: 'כוח לאורך זמן', category: 'power' },
        { id: 'ep9_2', name: 'Backward Lunges', nameHe: 'לאנג\'ים לאחור', duration: 45, notes: 'Control stability', notesHe: 'שליטה ביציבות', category: 'strength' },
        { id: 'ep9_3', name: 'Sprint 15m × 6', nameHe: 'ספרינט 15 מטר × 6', duration: 45, reps: 6, notes: 'Sustained load', notesHe: 'עומס מתמשך', category: 'speed' },
        { id: 'ep9_4', name: 'Fast Two-Leg Jumps', nameHe: 'קפיצות מהירות על שתי רגליים', duration: 45, notes: 'High pace', notesHe: 'קצב גבוה', category: 'power' },
        { id: 'ep9_5', name: 'Mountain Climbers High Pace', nameHe: 'טיפוס הרים בקצב גבוה', duration: 45, notes: 'Heart rate', notesHe: 'שיפור דופק', category: 'endurance' }
      ]
    },
    {
      id: 'ep_workout_10',
      name: 'Power & Sharp Exit',
      nameHe: 'עוצמה ויציאה חדה',
      description: 'Maximum power and sharp acceleration',
      descriptionHe: 'עוצמה מקסימלית ויציאה חדה',
      category: 'explosive_power',
      difficulty: 'advanced',
      duration: 15,
      exercises: [
        { id: 'ep10_1', name: 'Sprint 10m × 10 reps', nameHe: 'ספרינט 10 מטר × 10 חזרות', duration: 45, reps: 10, notes: 'Speed response', notesHe: 'מהירות תגובה', category: 'speed' },
        { id: 'ep10_2', name: 'Dynamic Squat + Jump', nameHe: 'סקוואט דינמי + קפיצה', duration: 45, notes: 'Explosive power', notesHe: 'כוח מתפרץ', category: 'power' },
        { id: 'ep10_3', name: 'Forward Lunges Knee Strike', nameHe: 'לאנג\'ים קדימה עם מכת ברך', duration: 40, notes: 'Offensive movement', notesHe: 'תנועה התקפית', category: 'strength' },
        { id: 'ep10_4', name: 'Long Jumps from Standing', nameHe: 'קפיצות רחוקות מהמקום', duration: 45, notes: 'Push power', notesHe: 'כוח דחיפה', category: 'power' },
        { id: 'ep10_5', name: 'Short Burpees Forward Jump', nameHe: 'בורפיז קצר עם קפיצה קדימה', duration: 45, notes: 'Acceleration', notesHe: 'תאוצה', category: 'endurance' }
      ]
    }
  ]
};

// Program 2: Agility & Speed (10 workouts)
export const agilitySpeedProgram: FootballProgram = {
  id: 'agility_speed',
  name: 'Agility & Speed',
  nameHe: 'זריזות ומהירות',
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
        { id: 'as1_1', name: 'Warm-up: Light running', nameHe: 'חימום: ריצה קלה', duration: 480, notes: 'Running technique, A-skip/B-skip', notesHe: 'טכניקת ריצה, A-skip/B-skip', category: 'endurance' },
        { id: 'as1_2', name: 'Activation: 70% Sprints 10m', nameHe: 'אקטיבציה: האצות 10 מטר ל-70%', duration: 300, reps: 6, notes: 'Sharp exit', notesHe: 'יציאה חדה', category: 'speed' },
        { id: 'as1_3', name: 'Sprint Acceleration 0-20m', nameHe: 'ספרינט האצה 0-20 מטר', duration: 360, reps: 5, notes: 'Body forward', notesHe: 'גוף נטוי קדימה', category: 'speed' },
        { id: 'as1_4', name: 'Controlled Deceleration 25→0m', nameHe: 'בלימה מבוקרת 25→0 מטר', duration: 360, reps: 5, notes: 'Short braking steps', notesHe: 'צעדי בלימה קצרים', category: 'agility' },
        { id: 'as1_5', name: '10-10m (Accel+Brake+Return)', nameHe: '10-10 מטר (האצה+בלימה+חזרה)', duration: 360, reps: 5, notes: 'Quick pivot', notesHe: 'סיבוב מהיר', category: 'agility' },
        { id: 'as1_6', name: 'Reactive Sprints 4×15"', nameHe: 'האצות ריאקטיביות 4×15"', duration: 240, sets: 4, notes: 'React to sound', notesHe: 'תגובה לקול', category: 'speed' },
        { id: 'as1_7', name: 'Cool-down: Walking', nameHe: 'קירור: הליכה', duration: 240, notes: 'Breathing', notesHe: 'נשימה', category: 'endurance' }
      ]
    },
    {
      id: 'as_workout_2',
      name: 'Short Direction Changes',
      nameHe: 'שינויי כיוון קצרים',
      description: 'Practice quick direction changes',
      descriptionHe: 'תרגול שינויי כיוון מהירים',
      category: 'agility_speed',
      difficulty: 'intermediate',
      duration: 40,
      exercises: [
        { id: 'as2_1', name: 'Warm-up: Light running', nameHe: 'חימום: ריצה קלה', duration: 480, notes: 'Mobility', notesHe: 'מוביליטי', category: 'endurance' },
        { id: 'as2_2', name: '70% Sprints 10m', nameHe: 'האצות 10 מטר ל-70%', duration: 300, reps: 6, notes: 'Sharp exit', notesHe: 'יציאה חדה', category: 'speed' },
        { id: 'as2_3', name: 'Sprint 0-20m', nameHe: 'ספרינט 0-20 מטר', duration: 360, reps: 5, notes: 'Body forward', notesHe: 'גוף נטוי קדימה', category: 'speed' },
        { id: 'as2_4', name: 'Controlled Braking', nameHe: 'בלימה מבוקרת', duration: 360, reps: 5, notes: 'Low gravity', notesHe: 'מרכז כובד נמוך', category: 'agility' },
        { id: 'as2_5', name: '10-10m Return', nameHe: '10-10 מטר חזרה', duration: 360, reps: 5, notes: 'Fast pivot', notesHe: 'סיבוב מהיר', category: 'agility' },
        { id: 'as2_6', name: 'Reactive Sprints', nameHe: 'האצות ריאקטיביות', duration: 240, sets: 4, notes: 'React to signal', notesHe: 'תגובה לאות', category: 'speed' }
      ]
    },
    {
      id: 'as_workout_3',
      name: 'Top Speed Training',
      nameHe: 'מהירות טופ-ספיד',
      description: 'Build maximum speed capacity',
      descriptionHe: 'בניית יכולת מהירות מקסימלית',
      category: 'agility_speed',
      difficulty: 'intermediate',
      duration: 40,
      exercises: [
        { id: 'as3_1', name: 'Warm-up: Light running', nameHe: 'חימום: ריצה קלה', duration: 480, notes: 'Mobility work', notesHe: 'עבודת מוביליטי', category: 'endurance' },
        { id: 'as3_2', name: '70% Activation', nameHe: 'אקטיבציה 70%', duration: 300, reps: 6, notes: 'Controlled speed', notesHe: 'מהירות מבוקרת', category: 'speed' },
        { id: 'as3_3', name: 'Sprint Acceleration', nameHe: 'ספרינט האצה', duration: 360, reps: 5, notes: 'Maximum effort', notesHe: 'מאמץ מקסימלי', category: 'speed' },
        { id: 'as3_4', name: 'Deceleration Drill', nameHe: 'תרגיל בלימה', duration: 360, reps: 5, notes: 'Controlled stop', notesHe: 'עצירה מבוקרת', category: 'agility' },
        { id: 'as3_5', name: 'Return Sprint', nameHe: 'ספרינט חזרה', duration: 360, reps: 5, notes: 'Quick turn', notesHe: 'סיבוב מהיר', category: 'agility' },
        { id: 'as3_6', name: 'Reactive Finisher', nameHe: 'פינישר ריאקטיבי', duration: 240, sets: 4, notes: 'Fast response', notesHe: 'תגובה מהירה', category: 'speed' }
      ]
    },
    {
      id: 'as_workout_4',
      name: 'Reactivity & Vision',
      nameHe: 'תגובתיות וראייה',
      description: 'Improve reaction time and peripheral vision',
      descriptionHe: 'שיפור זמן תגובה וראייה היקפית',
      category: 'agility_speed',
      difficulty: 'intermediate',
      duration: 40,
      exercises: [
        { id: 'as4_1', name: 'Dynamic Warm-up', nameHe: 'חימום דינמי', duration: 480, notes: 'Full body prep', notesHe: 'הכנת כל הגוף', category: 'endurance' },
        { id: 'as4_2', name: 'Activation Sprints', nameHe: 'ספרינטים אקטיבציה', duration: 300, reps: 6, notes: 'Build up speed', notesHe: 'בנייה של מהירות', category: 'speed' },
        { id: 'as4_3', name: 'Direction Reaction Drill', nameHe: 'תרגיל תגובה לכיוון', duration: 360, reps: 5, notes: 'React to cue', notesHe: 'תגובה לאות', category: 'agility' },
        { id: 'as4_4', name: 'Multi-Direction Sprint', nameHe: 'ספרינט רב-כיווני', duration: 360, reps: 5, notes: 'Change on signal', notesHe: 'שינוי על אות', category: 'agility' },
        { id: 'as4_5', name: 'Visual Tracking Sprint', nameHe: 'ספרינט עם מעקב ויזואלי', duration: 360, reps: 5, notes: 'Eyes up', notesHe: 'עיניים למעלה', category: 'speed' },
        { id: 'as4_6', name: 'Reactive Finish', nameHe: 'סיום ריאקטיבי', duration: 240, sets: 4, notes: 'Full speed', notesHe: 'מהירות מלאה', category: 'speed' }
      ]
    },
    {
      id: 'as_workout_5',
      name: 'COD 90°/180°',
      nameHe: 'שינויי כיוון 90°/180°',
      description: 'Master sharp angle direction changes',
      descriptionHe: 'שליטה בשינויי כיוון חדים',
      category: 'agility_speed',
      difficulty: 'advanced',
      duration: 40,
      exercises: [
        { id: 'as5_1', name: 'Warm-up Mobility', nameHe: 'חימום מוביליטי', duration: 480, notes: 'Joint prep', notesHe: 'הכנת מפרקים', category: 'endurance' },
        { id: 'as5_2', name: 'Activation Work', nameHe: 'עבודת אקטיבציה', duration: 300, reps: 6, notes: 'Gradual intensity', notesHe: 'עצימות הדרגתית', category: 'speed' },
        { id: 'as5_3', name: '90° Cuts', nameHe: 'חיתוכים 90°', duration: 360, reps: 5, notes: 'Plant and cut', notesHe: 'נעיצה וחיתוך', category: 'agility' },
        { id: 'as5_4', name: '180° Turns', nameHe: 'סיבובים 180°', duration: 360, reps: 5, notes: 'Fast pivot', notesHe: 'סיבוב מהיר', category: 'agility' },
        { id: 'as5_5', name: 'Mixed Angle Drill', nameHe: 'תרגיל זוויות מעורבות', duration: 360, reps: 5, notes: 'Variable angles', notesHe: 'זוויות משתנות', category: 'agility' },
        { id: 'as5_6', name: 'COD Finisher', nameHe: 'פינישר שינויי כיוון', duration: 240, sets: 4, notes: 'Maximum effort', notesHe: 'מאמץ מקסימלי', category: 'speed' }
      ]
    },
    {
      id: 'as_workout_6',
      name: 'Acceleration from Different Starts',
      nameHe: 'האצה ממצבי מוצא שונים',
      description: 'Practice acceleration from various starting positions',
      descriptionHe: 'תרגול האצה ממצבי התחלה שונים',
      category: 'agility_speed',
      difficulty: 'advanced',
      duration: 40,
      exercises: [
        { id: 'as6_1', name: 'Dynamic Prep', nameHe: 'הכנה דינמית', duration: 480, notes: 'Movement prep', notesHe: 'הכנת תנועה', category: 'endurance' },
        { id: 'as6_2', name: 'Standing Start Sprints', nameHe: 'ספרינטים מעמידה', duration: 300, reps: 6, notes: 'Explosive start', notesHe: 'יציאה מתפרצת', category: 'speed' },
        { id: 'as6_3', name: 'Prone Start Sprint', nameHe: 'ספרינט משכיבה', duration: 360, reps: 5, notes: 'Quick rise', notesHe: 'קימה מהירה', category: 'speed' },
        { id: 'as6_4', name: 'Seated Start Sprint', nameHe: 'ספרינט מישיבה', duration: 360, reps: 5, notes: 'Fast transition', notesHe: 'מעבר מהיר', category: 'speed' },
        { id: 'as6_5', name: 'Walking Start Sprint', nameHe: 'ספרינט מהליכה', duration: 360, reps: 5, notes: 'Build momentum', notesHe: 'בניית תנופה', category: 'speed' },
        { id: 'as6_6', name: 'Variable Start Drill', nameHe: 'תרגיל התחלות משתנות', duration: 240, sets: 4, notes: 'React and go', notesHe: 'תגובה ויציאה', category: 'agility' }
      ]
    },
    {
      id: 'as_workout_7',
      name: 'Quick Feet Frequency',
      nameHe: 'תדירות רגליים מהירה',
      description: 'Develop rapid foot movement',
      descriptionHe: 'פיתוח תנועת רגליים מהירה',
      category: 'agility_speed',
      difficulty: 'advanced',
      duration: 40,
      exercises: [
        { id: 'as7_1', name: 'Warm-up Footwork', nameHe: 'חימום עבודת רגליים', duration: 480, notes: 'Light and quick', notesHe: 'קל ומהיר', category: 'agility' },
        { id: 'as7_2', name: 'Fast Feet Drill', nameHe: 'תרגיל רגליים מהירות', duration: 300, reps: 6, notes: 'High frequency', notesHe: 'תדירות גבוהה', category: 'agility' },
        { id: 'as7_3', name: 'In-Out Quick Steps', nameHe: 'צעדים מהירים פנימה-חוצה', duration: 360, reps: 5, notes: 'Rapid movement', notesHe: 'תנועה מהירה', category: 'agility' },
        { id: 'as7_4', name: 'Lateral Quick Feet', nameHe: 'רגליים מהירות צידיות', duration: 360, reps: 5, notes: 'Side to side', notesHe: 'צד לצד', category: 'agility' },
        { id: 'as7_5', name: 'Forward-Back Quick Steps', nameHe: 'צעדים מהירים קדימה-אחורה', duration: 360, reps: 5, notes: 'Controlled speed', notesHe: 'מהירות מבוקרת', category: 'agility' },
        { id: 'as7_6', name: 'Quick Feet to Sprint', nameHe: 'רגליים מהירות לספרינט', duration: 240, sets: 4, notes: 'Transition fast', notesHe: 'מעבר מהיר', category: 'speed' }
      ]
    },
    {
      id: 'as_workout_8',
      name: 'Agility with Sound/Visual Cues',
      nameHe: 'זריזות עם אותות קול/ויזואליים',
      description: 'React to external cues for direction changes',
      descriptionHe: 'תגובה לאותות חיצוניים לשינוי כיוון',
      category: 'agility_speed',
      difficulty: 'advanced',
      duration: 40,
      exercises: [
        { id: 'as8_1', name: 'Reactive Warm-up', nameHe: 'חימום ריאקטיבי', duration: 480, notes: 'Prep nervous system', notesHe: 'הכנת מערכת עצבים', category: 'endurance' },
        { id: 'as8_2', name: 'Sound Reaction Sprint', nameHe: 'ספרינט תגובה לקול', duration: 300, reps: 6, notes: 'Fast response', notesHe: 'תגובה מהירה', category: 'speed' },
        { id: 'as8_3', name: 'Visual Cue Direction Change', nameHe: 'שינוי כיוון לאות ויזואלי', duration: 360, reps: 5, notes: 'Eyes and react', notesHe: 'ראייה ותגובה', category: 'agility' },
        { id: 'as8_4', name: 'Partner Reaction Drill', nameHe: 'תרגיל תגובה עם שותף', duration: 360, reps: 5, notes: 'Mirror movements', notesHe: 'שיקוף תנועות', category: 'agility' },
        { id: 'as8_5', name: 'Multi-Sensory Sprint', nameHe: 'ספרינט רב-חושי', duration: 360, reps: 5, notes: 'Various cues', notesHe: 'אותות שונים', category: 'speed' },
        { id: 'as8_6', name: 'Reactive Game Drill', nameHe: 'תרגיל משחק ריאקטיבי', duration: 240, sets: 4, notes: 'Random cues', notesHe: 'אותות אקראיים', category: 'agility' }
      ]
    },
    {
      id: 'as_workout_9',
      name: 'Acceleration with Backpedal',
      nameHe: 'האצה עם ריצה לאחור',
      description: 'Practice forward and backward running transitions',
      descriptionHe: 'תרגול מעברים בין ריצה קדימה ואחורה',
      category: 'agility_speed',
      difficulty: 'advanced',
      duration: 40,
      exercises: [
        { id: 'as9_1', name: 'Warm-up Forward-Back', nameHe: 'חימום קדימה-אחורה', duration: 480, notes: 'Prep both directions', notesHe: 'הכנה שני כיוונים', category: 'endurance' },
        { id: 'as9_2', name: 'Forward Sprint', nameHe: 'ספרינט קדימה', duration: 300, reps: 6, notes: 'Build speed', notesHe: 'בניית מהירות', category: 'speed' },
        { id: 'as9_3', name: 'Backpedal Sprint', nameHe: 'ספרינט אחורה', duration: 360, reps: 5, notes: 'Controlled backward', notesHe: 'אחורה מבוקר', category: 'agility' },
        { id: 'as9_4', name: 'Forward-Back Transition', nameHe: 'מעבר קדימה-אחורה', duration: 360, reps: 5, notes: 'Quick switch', notesHe: 'החלפה מהירה', category: 'agility' },
        { id: 'as9_5', name: 'Drop-Step to Sprint', nameHe: 'צעד נפילה לספרינט', duration: 360, reps: 5, notes: 'Fast transition', notesHe: 'מעבר מהיר', category: 'speed' },
        { id: 'as9_6', name: 'Mixed Direction Drill', nameHe: 'תרגיל כיוונים מעורבים', duration: 240, sets: 4, notes: 'Random directions', notesHe: 'כיוונים אקראיים', category: 'agility' }
      ]
    },
    {
      id: 'as_workout_10',
      name: 'Game-Speed Short Runs',
      nameHe: 'ריצות קצרות במהירות משחק',
      description: 'Simulate match-like speed and agility patterns',
      descriptionHe: 'סימולציה של דפוסי מהירות וזריזות במשחק',
      category: 'agility_speed',
      difficulty: 'advanced',
      duration: 40,
      exercises: [
        { id: 'as10_1', name: 'Game-Speed Warm-up', nameHe: 'חימום במהירות משחק', duration: 480, notes: 'Match intensity', notesHe: 'עצימות משחק', category: 'endurance' },
        { id: 'as10_2', name: 'Short Burst Sprints', nameHe: 'ספרינטים קצרים מתפרצים', duration: 300, reps: 6, notes: 'Game-like', notesHe: 'דמוי משחק', category: 'speed' },
        { id: 'as10_3', name: 'Direction Change at Speed', nameHe: 'שינוי כיוון במהירות', duration: 360, reps: 5, notes: 'Full speed cuts', notesHe: 'חיתוכים במהירות מלאה', category: 'agility' },
        { id: 'as10_4', name: 'Reactive Sprint Pattern', nameHe: 'דפוס ספרינט ריאקטיבי', duration: 360, reps: 5, notes: 'Unpredictable', notesHe: 'לא צפוי', category: 'agility' },
        { id: 'as10_5', name: 'Match Simulation Run', nameHe: 'ריצה סימולציית משחק', duration: 360, reps: 5, notes: 'Game scenarios', notesHe: 'תרחישי משחק', category: 'speed' },
        { id: 'as10_6', name: 'High-Intensity Finisher', nameHe: 'פינישר עצימות גבוהה', duration: 240, sets: 4, notes: 'Maximum effort', notesHe: 'מאמץ מקסימלי', category: 'endurance' }
      ]
    }
  ]
};

// Program 3: Cardiovascular Endurance (10 workouts)
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
        { id: 'ce1_1', name: 'Sprint 20m + Walk Back', nameHe: 'ספרינט 20 מטר + הליכה חזרה', duration: 45, notes: 'Fast start', notesHe: 'יציאה מהירה', category: 'endurance' },
        { id: 'ce1_2', name: 'Forward-Backward Run 5m', nameHe: 'ריצה קדימה-אחורה 5 מטר', duration: 60, notes: 'Sharp changes', notesHe: 'שינויי כיוון חדים', category: 'agility' },
        { id: 'ce1_3', name: 'Side Hops Over Line', nameHe: 'קפיצות צד לרוחב קו', duration: 45, notes: 'Agility and balance', notesHe: 'זריזות ושיווי משקל', category: 'agility' },
        { id: 'ce1_4', name: 'Plank Alternating Knee', nameHe: 'פלאנק עם מכת ברך', duration: 45, notes: 'Core strength', notesHe: 'חיזוק ליבה', category: 'strength' },
        { id: 'ce1_5', name: 'Burpee + Short Sprint', nameHe: 'בורפיז עם ספרינט קצר', duration: 30, notes: 'Reaction', notesHe: 'תגובה', category: 'endurance' }
      ]
    },
    {
      id: 'ce_workout_2',
      name: 'Interval Training',
      nameHe: 'אינטרוולים למשחק',
      description: 'Match-like interval work',
      descriptionHe: 'עבודת אינטרוולים דמוי משחק',
      category: 'cardio_endurance',
      difficulty: 'intermediate',
      duration: 25,
      exercises: [
        { id: 'ce2_1', name: 'Zigzag Sprints', nameHe: 'ספרינטים בזיג-זג', duration: 30, sets: 8, notes: 'Fast direction changes', notesHe: 'שינויי כיוון מהירים', category: 'agility' },
        { id: 'ce2_2', name: 'Forward-Back Run 10m', nameHe: 'ריצה קדימה-אחורה 10 מטר', duration: 30, sets: 8, notes: 'Control pace', notesHe: 'שליטה בקצב', category: 'endurance' },
        { id: 'ce2_3', name: 'Forward-Back Jumps', nameHe: 'קפיצות קדימה ואחורה', duration: 30, sets: 8, notes: 'Leg power', notesHe: 'כוח רגליים', category: 'power' },
        { id: 'ce2_4', name: 'Fast Mountain Climbers', nameHe: 'טיפוס הרים מהיר', duration: 30, sets: 8, notes: 'Core endurance', notesHe: 'סיבולת ליבה', category: 'endurance' },
        { id: 'ce2_5', name: 'Side Plank Rotation', nameHe: 'פלאנק צד עם סיבוב', duration: 30, sets: 8, notes: 'Core stability', notesHe: 'ייצוב ליבה', category: 'strength' }
      ]
    },
    {
      id: 'ce_workout_3',
      name: 'Station Training',
      nameHe: 'תחנות כדורגלנים',
      description: 'Circuit training for footballers',
      descriptionHe: 'אימון תחנות לכדורגלנים',
      category: 'cardio_endurance',
      difficulty: 'intermediate',
      duration: 25,
      exercises: [
        { id: 'ce3_1', name: 'Run Around Cones', nameHe: 'ריצה סביב קונוסים', duration: 45, notes: 'Variable pace', notesHe: 'קצב משתנה', category: 'endurance' },
        { id: 'ce3_2', name: 'Sprint 15m + Return', nameHe: 'ספרינט 15 מטר + חזרה', duration: 45, notes: 'Exit and recovery', notesHe: 'יציאה והתאוששות', category: 'speed' },
        { id: 'ce3_3', name: 'Shuttle Run 5/10/15m', nameHe: 'שאטל ראן 5/10/15 מטר', duration: 45, notes: 'Direction changes', notesHe: 'שינויי כיוון', category: 'agility' },
        { id: 'ce3_4', name: 'Dynamic Lunges', nameHe: 'לאנג\'ים דינמיים', duration: 45, notes: 'Leg strength', notesHe: 'חיזוק רגליים', category: 'strength' },
        { id: 'ce3_5', name: 'Lateral Running', nameHe: 'ריצה צידית', duration: 45, notes: 'Stability', notesHe: 'יציבות', category: 'agility' },
        { id: 'ce3_6', name: 'Burpees + Sprint', nameHe: 'בורפיז + ספרינט', duration: 45, notes: 'Explosive endurance', notesHe: 'סיבולת מתפרצת', category: 'endurance' }
      ]
    },
    {
      id: 'ce_workout_4',
      name: 'Explosive Movement',
      nameHe: 'תנועה מתפרצת',
      description: 'High-intensity explosive work',
      descriptionHe: 'עבודה מתפרצת עצימות גבוהה',
      category: 'cardio_endurance',
      difficulty: 'intermediate',
      duration: 20,
      exercises: [
        { id: 'ce4_1', name: 'Sprint from Standing 10m', nameHe: 'ספרינט מהמקום 10 מטר', duration: 45, notes: 'Sharp exit', notesHe: 'יציאה חדה', category: 'speed' },
        { id: 'ce4_2', name: 'Fast Side Hops on Line', nameHe: 'קפיצות צד מהירות על קו', duration: 45, notes: 'Agility', notesHe: 'זריזות', category: 'agility' },
        { id: 'ce4_3', name: 'Run + Drop Plank + Rise', nameHe: 'ריצה + נפילה לפלאנק + קימה', duration: 60, notes: 'Response', notesHe: 'תגובה', category: 'endurance' },
        { id: 'ce4_4', name: 'Dynamic Squat + Jump', nameHe: 'סקוואט דינמי + קפיצה', duration: 40, notes: 'Explosive power', notesHe: 'כוח מתפרץ', category: 'power' },
        { id: 'ce4_5', name: 'Plank with Knee Pull', nameHe: 'פלאנק עם משיכת ברך', duration: 45, notes: 'Body control', notesHe: 'שליטה בגוף', category: 'strength' }
      ]
    },
    {
      id: 'ce_workout_5',
      name: 'Direction Changes',
      nameHe: 'שינויי כיוון',
      description: 'Multi-directional endurance work',
      descriptionHe: 'עבודת סיבולת רב-כיוונית',
      category: 'cardio_endurance',
      difficulty: 'intermediate',
      duration: 25,
      exercises: [
        { id: 'ce5_1', name: 'Zigzag Run', nameHe: 'ריצה בזיג-זג', duration: 45, notes: 'Fast direction changes', notesHe: 'שינויי כיוון מהירים', category: 'agility' },
        { id: 'ce5_2', name: 'Sprint 15m + Backpedal', nameHe: 'ספרינט 15 מטר + ריצה אחורה', duration: 45, notes: 'Backward control', notesHe: 'שליטה אחורית', category: 'agility' },
        { id: 'ce5_3', name: 'Forward-Back Jumps', nameHe: 'קפיצות קדימה-אחורה', duration: 45, notes: 'Power and stability', notesHe: 'כוח ויציבות', category: 'power' },
        { id: 'ce5_4', name: 'Lateral Movement Right-Left', nameHe: 'תנועת צד ימינה-שמאלה', duration: 45, notes: 'Low movement', notesHe: 'תנועה נמוכה', category: 'agility' },
        { id: 'ce5_5', name: 'Plank Shoulder Taps', nameHe: 'פלאנק עם מכת כתף', duration: 45, notes: 'Core stability', notesHe: 'ייצוב ליבה', category: 'strength' },
        { id: 'ce5_6', name: 'Short Burpees + Sprint', nameHe: 'בורפיז קצר + ספרינט', duration: 45, notes: 'Fast recovery', notesHe: 'התאוששות מהירה', category: 'endurance' }
      ]
    },
    {
      id: 'ce_workout_6',
      name: 'Speed Games',
      nameHe: 'משחקי מהירות',
      description: 'Game-based speed endurance',
      descriptionHe: 'סיבולת מהירות מבוססת משחק',
      category: 'cardio_endurance',
      difficulty: 'intermediate',
      duration: 25,
      exercises: [
        { id: 'ce6_1', name: 'Sprint-Slow-Sprint 10-5-10m', nameHe: 'ספרינט-האטה-ספרינט 10-5-10', duration: 45, notes: 'Stop and acceleration', notesHe: 'עצירה והאצה', category: 'speed' },
        { id: 'ce6_2', name: '90° Side Jumps', nameHe: 'קפיצות 90° לצדדים', duration: 40, notes: 'Direction control', notesHe: 'שליטה בשינוי כיוון', category: 'agility' },
        { id: 'ce6_3', name: 'High Knees in Place', nameHe: 'ריצה במקום ברכיים גבוהות', duration: 45, notes: 'High pace', notesHe: 'קצב גבוה', category: 'endurance' },
        { id: 'ce6_4', name: 'Dynamic Plank', nameHe: 'פלאנק דינמי', duration: 40, notes: 'Strong core', notesHe: 'ליבה חזקה', category: 'strength' },
        { id: 'ce6_5', name: 'Fast Lunges', nameHe: 'לאנג\'ים מהירים', duration: 45, notes: 'Control', notesHe: 'שליטה', category: 'strength' },
        { id: 'ce6_6', name: 'Free Field Run', nameHe: 'ריצה חופשית סביב השטח', duration: 90, notes: 'Maintain pace', notesHe: 'שמירה על קצב', category: 'endurance' }
      ]
    },
    {
      id: 'ce_workout_7',
      name: 'Response & Acceleration',
      nameHe: 'תגובה והאצה',
      description: 'Reactive acceleration endurance',
      descriptionHe: 'סיבולת האצה ריאקטיבית',
      category: 'cardio_endurance',
      difficulty: 'advanced',
      duration: 20,
      exercises: [
        { id: 'ce7_1', name: 'Sprint by Direction Call', nameHe: 'ספרינט לפי קריאת כיוון', duration: 45, notes: 'Stimulus response', notesHe: 'תגובה לגירוי', category: 'speed' },
        { id: 'ce7_2', name: 'Forward + Backward Run', nameHe: 'ריצה קדימה + אחורה', duration: 60, notes: 'Pace change', notesHe: 'שינוי קצב', category: 'agility' },
        { id: 'ce7_3', name: 'Jumps from Standing', nameHe: 'קפיצות מהמקום', duration: 45, notes: 'Explosive power', notesHe: 'כוח מתפרץ', category: 'power' },
        { id: 'ce7_4', name: 'Plank Forward-Back Jump', nameHe: 'פלאנק עם קפיצה קדימה-אחורה', duration: 40, notes: 'Core and exit', notesHe: 'ליבה ויציאה', category: 'strength' },
        { id: 'ce7_5', name: 'Burpees + Sprint', nameHe: 'בורפיז + ספרינט', duration: 8, reps: 8, notes: 'Response and load', notesHe: 'תגובה ועומס', category: 'endurance' }
      ]
    },
    {
      id: 'ce_workout_8',
      name: 'Fast Recovery',
      nameHe: 'התאוששות מהירה',
      description: 'Recovery-focused endurance',
      descriptionHe: 'סיבולת ממוקדת התאוששות',
      category: 'cardio_endurance',
      difficulty: 'advanced',
      duration: 25,
      exercises: [
        { id: 'ce8_1', name: 'Short Sprint + Light Run Back', nameHe: 'ספרינט קצר + ריצה קלה חזרה', duration: 45, notes: 'Heart rate control', notesHe: 'שליטה בדופק', category: 'endurance' },
        { id: 'ce8_2', name: 'Lateral Run Right-Left', nameHe: 'ריצה צידית ימינה-שמאלה', duration: 45, notes: 'Low movement', notesHe: 'תנועה נמוכה', category: 'agility' },
        { id: 'ce8_3', name: 'Mountain Climbers High Pace', nameHe: 'טיפוס הרים בקצב גבוה', duration: 45, notes: 'Breathing', notesHe: 'נשימה', category: 'endurance' },
        { id: 'ce8_4', name: 'Squat + Forward Jump', nameHe: 'סקוואט + קפיצה קדימה', duration: 45, notes: 'Leg power', notesHe: 'כוח רגליים', category: 'power' },
        { id: 'ce8_5', name: 'Alternating Side Plank', nameHe: 'פלאנק צד לסירוגין', duration: 45, notes: 'Body control', notesHe: 'שליטה בגוף', category: 'strength' },
        { id: 'ce8_6', name: 'Fast Walk 30m', nameHe: 'הליכה מהירה 30 מטר', duration: 45, notes: 'Active recovery', notesHe: 'התאוששות אקטיבית', category: 'endurance' }
      ]
    },
    {
      id: 'ce_workout_9',
      name: 'Leg Power Endurance',
      nameHe: 'כוח סיבולת רגליים',
      description: 'Sustained leg power work',
      descriptionHe: 'עבודת כוח רגליים מתמשכת',
      category: 'cardio_endurance',
      difficulty: 'advanced',
      duration: 20,
      exercises: [
        { id: 'ce9_1', name: 'Uphill Sprint', nameHe: 'ספרינט בעלייה', duration: 45, notes: 'Leg strengthening', notesHe: 'חיזוק רגליים', category: 'strength' },
        { id: 'ce9_2', name: 'Forward Lunges', nameHe: 'לאנג\'ים קדימה', duration: 45, notes: 'Control and stability', notesHe: 'שליטה ויציבות', category: 'strength' },
        { id: 'ce9_3', name: 'Single-Leg Jumps', nameHe: 'קפיצות על רגל אחת', duration: 40, notes: 'Balance', notesHe: 'שיווי משקל', category: 'agility' },
        { id: 'ce9_4', name: 'Fast Squats', nameHe: 'סקוואט מהיר', duration: 45, notes: 'Pace improvement', notesHe: 'שיפור קצב', category: 'power' },
        { id: 'ce9_5', name: 'Dynamic Plank', nameHe: 'פלאנק דינמי', duration: 45, notes: 'Lower body control', notesHe: 'שליטה בגוף תחתון', category: 'strength' }
      ]
    },
    {
      id: 'ce_workout_10',
      name: 'Full Match Endurance',
      nameHe: 'סיבולת משחק מלאה',
      description: 'Complete match simulation endurance',
      descriptionHe: 'סיבולת סימולציית משחק מלאה',
      category: 'cardio_endurance',
      difficulty: 'advanced',
      duration: 30,
      exercises: [
        { id: 'ce10_1', name: 'Medium Pace Field Run', nameHe: 'ריצה בקצב בינוני מסביב לשטח', duration: 45, notes: 'Maintain heart rate', notesHe: 'שמירה על דופק', category: 'endurance' },
        { id: 'ce10_2', name: 'Sprint 10m + Stop', nameHe: 'ספרינט 10 מטר + עצירה', duration: 45, notes: 'Control and stop', notesHe: 'שליטה ועצירה', category: 'speed' },
        { id: 'ce10_3', name: 'Multi-Direction Changes', nameHe: 'שינויי כיוון קדימה/צד/אחורה', duration: 45, notes: 'Coordination', notesHe: 'קואורדינציה', category: 'agility' },
        { id: 'ce10_4', name: 'Lateral Jumps', nameHe: 'קפיצות צידיות', duration: 45, notes: 'Agility', notesHe: 'זריזות', category: 'agility' },
        { id: 'ce10_5', name: 'Mountain Climbers', nameHe: 'טיפוס הרים', duration: 45, notes: 'Endurance', notesHe: 'סיבולת', category: 'endurance' },
        { id: 'ce10_6', name: 'Static Plank', nameHe: 'פלאנק סטטי', duration: 45, notes: 'Core strengthening', notesHe: 'חיזוק ליבה', category: 'strength' },
        { id: 'ce10_7', name: 'Full Burpees', nameHe: 'בורפיז מלא', duration: 45, notes: 'Pace change', notesHe: 'שינוי קצב', category: 'endurance' },
        { id: 'ce10_8', name: 'Slow Release Run', nameHe: 'ריצה איטית לשחרור', duration: 60, notes: 'Gradual transition', notesHe: 'מעבר הדרגתי', category: 'endurance' }
      ]
    }
  ]
};

// Program 4: Strength & Endurance (10 workouts)
export const strengthEnduranceProgram: FootballProgram = {
  id: 'strength_endurance',
  name: 'Strength & Endurance',
  nameHe: 'כוח וסיבולת',
  description: 'Combined strength and endurance training for match fitness',
  descriptionHe: 'אימון משולב כוח וסיבולת לכושר משחק',
  workouts: [
    {
      id: 'se_workout_1',
      name: 'Explosive Power + Cardio',
      nameHe: 'כוח מתפרץ + סיבולת',
      description: 'Combine explosive power with cardio',
      descriptionHe: 'שילוב כוח מתפרץ וסיבולת',
      category: 'strength_endurance',
      difficulty: 'intermediate',
      duration: 20,
      exercises: [
        { id: 'se1_1', name: 'Sprint from Standing 15m × 8', nameHe: 'ספרינט מהמקום 15 מטר × 8', duration: 45, reps: 8, notes: 'Strong first step', notesHe: 'צעד ראשון חזק', category: 'speed' },
        { id: 'se1_2', name: 'Jump Squats', nameHe: 'סקוואט קפיצה', duration: 40, notes: 'Soft landing, straight back', notesHe: 'נחיתה רכה, גב ישר', category: 'power' },
        { id: 'se1_3', name: 'Forward-Back Run 10m', nameHe: 'ריצה קדימה-אחורה 10 מטר', duration: 45, notes: 'Fast direction changes', notesHe: 'שינויי כיוון מהירים', category: 'agility' },
        { id: 'se1_4', name: 'Dynamic Forward Lunges', nameHe: 'לאנג\'ים דינמיים קדימה', duration: 45, notes: 'Stability, proper depth', notesHe: 'יציבות, עומק נכון', category: 'strength' },
        { id: 'se1_5', name: 'Full Burpees', nameHe: 'בורפיז מלא', duration: 45, notes: 'Continuous movement', notesHe: 'תנועה רציפה', category: 'endurance' }
      ]
    },
    {
      id: 'se_workout_2',
      name: 'Explosive with Direction Changes',
      nameHe: 'כוח מתפרץ עם שינויי כיוון',
      description: 'Power work combined with agility',
      descriptionHe: 'עבודת כוח משולבת עם זריזות',
      category: 'strength_endurance',
      difficulty: 'intermediate',
      duration: 20,
      exercises: [
        { id: 'se2_1', name: 'Jump Squat + Back Lunge', nameHe: 'סקוואט קפיצה + לאנג\' אחורי', duration: 45, notes: 'Balance in transition', notesHe: 'איזון במעבר', category: 'power' },
        { id: 'se2_2', name: 'Forward-Back Run 10m', nameHe: 'ריצה קדימה-אחורה 10 מטר', duration: 45, notes: 'Fast acceleration and braking', notesHe: 'האצה ובלימה מהירה', category: 'agility' },
        { id: 'se2_3', name: 'Fast Lateral Jumps', nameHe: 'קפיצות צידיות מהירות', duration: 40, notes: 'High pace', notesHe: 'קצב גבוה', category: 'agility' },
        { id: 'se2_4', name: 'Dynamic Lunges with Jump', nameHe: 'לאנג\'ים דינמיים עם קפיצה', duration: 45, notes: 'Control and soft landing', notesHe: 'שליטה ונחיתה רכה', category: 'power' },
        { id: 'se2_5', name: 'Full Burpees', nameHe: 'בורפיז מלא', duration: 45, notes: 'Steady pace', notesHe: 'קצב קבוע', category: 'endurance' }
      ]
    },
    {
      id: 'se_workout_3',
      name: 'Explosive Endurance',
      nameHe: 'סיבולת מתפרצת',
      description: 'High-intensity explosive endurance',
      descriptionHe: 'סיבולת מתפרצת עצימות גבוהה',
      category: 'strength_endurance',
      difficulty: 'intermediate',
      duration: 20,
      exercises: [
        { id: 'se3_1', name: 'High Jump Squat', nameHe: 'סקוואט קפיצה גבוה', duration: 40, notes: 'Fast pace, controlled landing', notesHe: 'קצב מהיר, נחיתה מבוקרת', category: 'power' },
        { id: 'se3_2', name: 'Sprint 15m × 6', nameHe: 'ספרינט 15 מטר × 6', duration: 45, reps: 6, notes: 'Sharp exit', notesHe: 'יציאה חדה', category: 'speed' },
        { id: 'se3_3', name: 'Alternating Side Lunges', nameHe: 'לאנג\'ים צידיים לסירוגין', duration: 45, notes: 'Wide movement', notesHe: 'תנועה רחבה', category: 'strength' },
        { id: 'se3_4', name: 'Fast Mountain Climbers', nameHe: 'טיפוס הרים מהיר', duration: 45, notes: 'High pace', notesHe: 'קצב גבוה', category: 'endurance' },
        { id: 'se3_5', name: 'Burpees with Short Sprint', nameHe: 'בורפיז עם ספרינט קצר', duration: 45, notes: 'High pace', notesHe: 'קצב גבוה', category: 'endurance' }
      ]
    },
    {
      id: 'se_workout_4',
      name: 'Control & Response',
      nameHe: 'שליטה ותגובה',
      description: 'Controlled movements with reactive elements',
      descriptionHe: 'תנועות מבוקרות עם אלמנטים ריאקטיביים',
      category: 'strength_endurance',
      difficulty: 'intermediate',
      duration: 20,
      exercises: [
        { id: 'se4_1', name: 'Sprint by Direction Call', nameHe: 'ספרינט לפי קריאת כיוון', duration: 45, notes: 'Fast response', notesHe: 'תגובה מהירה', category: 'speed' },
        { id: 'se4_2', name: 'Squat + High Jump', nameHe: 'סקוואט + קפיצה לגובה', duration: 40, notes: 'Movement control', notesHe: 'שליטה בתנועה', category: 'power' },
        { id: 'se4_3', name: 'Lateral Run Right-Left', nameHe: 'ריצה צידית ימינה-שמאלה', duration: 45, notes: 'Low body', notesHe: 'גוף נמוך', category: 'agility' },
        { id: 'se4_4', name: 'Back-Forward Jumps', nameHe: 'קפיצות לאחור-קדימה', duration: 40, notes: 'Movement control', notesHe: 'שליטה בתנועה', category: 'agility' },
        { id: 'se4_5', name: 'Short Burpees + Forward Jump', nameHe: 'בורפיז קצר + קפיצה קדימה', duration: 45, notes: 'Continuous flow', notesHe: 'זרימה רציפה', category: 'endurance' }
      ]
    },
    {
      id: 'se_workout_5',
      name: 'Match Load',
      nameHe: 'עומס משחק',
      description: 'Simulate match-intensity load',
      descriptionHe: 'סימולציה של עומס בעצימות משחק',
      category: 'strength_endurance',
      difficulty: 'advanced',
      duration: 20,
      exercises: [
        { id: 'se5_1', name: 'Slow Descent Squat + Explosive Jump', nameHe: 'סקוואט איטי בירידה + פיצוץ בעלייה', duration: 45, notes: 'Movement control', notesHe: 'שליטה בתנועה', category: 'power' },
        { id: 'se5_2', name: 'Zigzag Sprint', nameHe: 'ספרינט בזיג-זג', duration: 45, notes: 'Sharp direction changes', notesHe: 'שינויי כיוון חדים', category: 'agility' },
        { id: 'se5_3', name: 'Forward Lunges with Jump', nameHe: 'לאנג\'ים קדימה עם קפיצה', duration: 45, notes: 'Full movement', notesHe: 'תנועה מלאה', category: 'power' },
        { id: 'se5_4', name: 'Short Continuous Jumps in Place', nameHe: 'קפיצות קצרות רציפות במקום', duration: 40, notes: 'High pace', notesHe: 'קצב גבוה', category: 'agility' },
        { id: 'se5_5', name: 'Sprint 20m + Stop', nameHe: 'ספרינט 20 מטר + עצירה', duration: 45, notes: 'Safe braking', notesHe: 'בלימה בטוחה', category: 'speed' }
      ]
    },
    {
      id: 'se_workout_6',
      name: 'Explosion & Response Speed',
      nameHe: 'פיצוץ ומהירות תגובה',
      description: 'Develop explosive response speed',
      descriptionHe: 'פיתוח מהירות תגובה מתפרצת',
      category: 'strength_endurance',
      difficulty: 'advanced',
      duration: 20,
      exercises: [
        { id: 'se6_1', name: 'Sprint from Standing 10m × 10', nameHe: 'ספרינט מהמקום 10 מטר × 10', duration: 45, reps: 10, notes: 'Sharp acceleration', notesHe: 'האצה חדה', category: 'speed' },
        { id: 'se6_2', name: 'High Jump Squat', nameHe: 'סקוואט קפיצה גבוה', duration: 40, notes: 'Soft landing', notesHe: 'נחיתה רכה', category: 'power' },
        { id: 'se6_3', name: 'Forward-Back Run 10m', nameHe: 'ריצה קדימה-אחורה 10 מטר', duration: 45, notes: 'Proper braking', notesHe: 'בלימה נכונה', category: 'agility' },
        { id: 'se6_4', name: 'Alternating Lunges with Jump', nameHe: 'לאנג\'ים לסירוגין עם קפיצה', duration: 45, notes: 'Control and stability', notesHe: 'שליטה ויציבות', category: 'power' },
        { id: 'se6_5', name: 'Fast Lateral Jumps', nameHe: 'קפיצות צידיות מהירות', duration: 40, notes: 'High pace', notesHe: 'קצב גבוה', category: 'agility' }
      ]
    },
    {
      id: 'se_workout_7',
      name: 'Explosive Match Endurance',
      nameHe: 'סיבולת משחק מתפרצת',
      description: 'Match-specific explosive endurance',
      descriptionHe: 'סיבולת מתפרצת ספציפית למשחק',
      category: 'strength_endurance',
      difficulty: 'advanced',
      duration: 25,
      exercises: [
        { id: 'se7_1', name: 'Narrow Squat + High Jump', nameHe: 'סקוואט צר + קפיצה לגובה', duration: 40, notes: 'Fast movement', notesHe: 'תנועה מהירה', category: 'power' },
        { id: 'se7_2', name: 'Short Sprint × 8', nameHe: 'ספרינט קצר × 8', duration: 45, reps: 8, notes: 'Strong first step', notesHe: 'צעד ראשון חזק', category: 'speed' },
        { id: 'se7_3', name: 'Forward Lunges', nameHe: 'לאנג\'ים קדימה', duration: 45, notes: 'Control and full descent', notesHe: 'שליטה וירידה מלאה', category: 'strength' },
        { id: 'se7_4', name: 'Full Burpees', nameHe: 'בורפיז מלא', duration: 45, notes: 'Steady breathing', notesHe: 'נשימה קבועה', category: 'endurance' },
        { id: 'se7_5', name: 'Field Run 2 minutes', nameHe: 'ריצה סביב השטח 2 דקות', duration: 120, notes: 'Medium-high pace', notesHe: 'קצב בינוני-גבוה', category: 'endurance' }
      ]
    },
    {
      id: 'se_workout_8',
      name: 'Braking & Acceleration',
      nameHe: 'בלימה והאצה',
      description: 'Master deceleration and re-acceleration',
      descriptionHe: 'שליטה בהאטה והאצה מחדש',
      category: 'strength_endurance',
      difficulty: 'advanced',
      duration: 20,
      exercises: [
        { id: 'se8_1', name: 'Short Sprint 10m + Stop', nameHe: 'ספרינט קצר 10 מטר + עצירה', duration: 45, notes: 'Precise braking', notesHe: 'בלימה מדויקת', category: 'speed' },
        { id: 'se8_2', name: 'Dynamic Squat + Jump', nameHe: 'סקוואט דינמי + קפיצה', duration: 40, notes: 'Soft landing', notesHe: 'נחיתה רכה', category: 'power' },
        { id: 'se8_3', name: 'Backward Lunges', nameHe: 'לאנג\'ים אחוריים', duration: 45, notes: 'Knee close to ground', notesHe: 'ברך קרובה לקרקע', category: 'strength' },
        { id: 'se8_4', name: 'Side-to-Side Jumps on Line', nameHe: 'קפיצות מצד לצד על קו', duration: 40, notes: 'High pace', notesHe: 'קצב גבוה', category: 'agility' },
        { id: 'se8_5', name: 'Short Burpees', nameHe: 'בורפיז קצר', duration: 45, notes: 'Even pace', notesHe: 'קצב אחיד', category: 'endurance' }
      ]
    },
    {
      id: 'se_workout_9',
      name: 'Continuous Explosion',
      nameHe: 'התפרצות רציפה',
      description: 'Sustained explosive movements',
      descriptionHe: 'תנועות מתפרצות מתמשכות',
      category: 'strength_endurance',
      difficulty: 'advanced',
      duration: 20,
      exercises: [
        { id: 'se9_1', name: 'Jump Squat + Forward Lunge', nameHe: 'סקוואט קפיצה + לאנג\' קדימה', duration: 45, notes: 'Smooth transition', notesHe: 'מעבר חלק', category: 'power' },
        { id: 'se9_2', name: 'Sprint from Standing 10m × 6', nameHe: 'ספרינט מהמקום 10 מטר × 6', duration: 45, reps: 6, notes: 'Strong first step', notesHe: 'צעד ראשון חזק', category: 'speed' },
        { id: 'se9_3', name: 'Single-Leg Forward Jumps', nameHe: 'קפיצות על רגל אחת קדימה', duration: 40, notes: 'Control on support leg', notesHe: 'שליטה ברגל תומכת', category: 'agility' },
        { id: 'se9_4', name: 'Burpees with High Jump', nameHe: 'בורפיז עם קפיצה לגובה', duration: 45, notes: 'Continuous movement', notesHe: 'תנועה רציפה', category: 'endurance' },
        { id: 'se9_5', name: 'Slow Squat + Fast Jump', nameHe: 'סקוואט איטי + קפיצה מהירה', duration: 40, notes: 'Controlled descent', notesHe: 'ירידה מבוקרת', category: 'power' }
      ]
    },
    {
      id: 'se_workout_10',
      name: 'Real Match Endurance',
      nameHe: 'סיבולת משחק אמיתית',
      description: 'Full match simulation',
      descriptionHe: 'סימולציית משחק מלאה',
      category: 'strength_endurance',
      difficulty: 'advanced',
      duration: 25,
      exercises: [
        { id: 'se10_1', name: 'Short Sprint 15m × 8', nameHe: 'ספרינט קצר 15 מטר × 8', duration: 45, reps: 8, notes: 'Sharp acceleration', notesHe: 'האצה חדה', category: 'speed' },
        { id: 'se10_2', name: 'Wide Squat + Jump', nameHe: 'סקוואט רחב + קפיצה', duration: 40, notes: 'Hip power', notesHe: 'כוח ירך', category: 'power' },
        { id: 'se10_3', name: 'Lateral Jumps Both Directions', nameHe: 'קפיצות צד לשני כיוונים', duration: 45, notes: 'Eyes forward', notesHe: 'מבט קדימה', category: 'agility' },
        { id: 'se10_4', name: 'Short Burpees', nameHe: 'בורפיז קצר', duration: 45, notes: 'Even pace', notesHe: 'קצב אחיד', category: 'endurance' },
        { id: 'se10_5', name: 'Slow Release Run', nameHe: 'ריצה איטית לשחרור', duration: 60, notes: 'Gradual heart rate drop', notesHe: 'ירידה הדרגתית בדופק', category: 'endurance' }
      ]
    }
  ]
};

// Program 5: Agility, Speed & Leg Power (5 workouts)
export const legPowerProgram: FootballProgram = {
  id: 'leg_power',
  name: 'Agility, Speed & Leg Power',
  nameHe: 'זריזות, מהירות וכוח רגליים',
  description: 'Comprehensive training for agility, speed, and leg power',
  descriptionHe: 'אימון מקיף לזריזות, מהירות וכוח רגליים',
  workouts: [
    {
      id: 'lp_workout_1',
      name: 'Neural Control & Leg Power',
      nameHe: 'שליטה עצבית וכוח רגליים',
      description: 'Develop neuromuscular control and leg strength',
      descriptionHe: 'פיתוח שליטה עצבית-שרירית וכוח רגליים',
      category: 'leg_power',
      difficulty: 'intermediate',
      duration: 25,
      exercises: [
        { id: 'lp1_1', name: 'Sprint from Standing 10m × 8', nameHe: 'ספרינט מהמקום 10 מטר × 8 חזרות', duration: 45, reps: 8, notes: 'Strong first step, forward momentum', notesHe: 'צעד ראשון חזק, תנופה קדימה', category: 'speed' },
        { id: 'lp1_2', name: 'Sprint 15m + Sudden Stop', nameHe: 'ספרינט 15 מטר + עצירה פתאומית', duration: 45, notes: 'Controlled braking', notesHe: 'בלימה נשלטת', category: 'agility' },
        { id: 'lp1_3', name: 'Sprint by Direction Call', nameHe: 'ספרינט לפי קריאת כיוון', duration: 45, notes: 'Fast stimulus response', notesHe: 'תגובה מהירה לגירוי', category: 'speed' },
        { id: 'lp1_4', name: 'Sprint 10m × 6 Pace Variation', nameHe: 'ספרינט 10 מטר × 6 עם שינוי קצב', duration: 45, reps: 6, notes: 'Acceleration and braking', notesHe: 'האצה ובלימה', category: 'speed' },
        { id: 'lp1_5', name: 'Lateral Run Right-Left', nameHe: 'ריצה צידית ימינה-שמאלה', duration: 45, notes: 'Low body, eyes forward', notesHe: 'גוף נמוך, מבט קדימה', category: 'agility' },
        { id: 'lp1_6', name: 'Zigzag Sprint Around Imaginary Cones', nameHe: 'ספרינט בזיג-זג סביב דמיון קונוסים', duration: 45, notes: 'Sharp direction changes', notesHe: 'שינויי כיוון חדים', category: 'agility' },
        { id: 'lp1_7', name: 'Single-Leg Lateral Jumps', nameHe: 'קפיצות צידיות על רגל אחת', duration: 40, notes: 'Balance and control', notesHe: 'שיווי משקל ושליטה', category: 'agility' },
        { id: 'lp1_8', name: 'Forward-Backward Run', nameHe: 'ריצה קדימה-אחורה', duration: 45, notes: 'Stop and acceleration', notesHe: 'עצירה והאצה', category: 'agility' },
        { id: 'lp1_9', name: 'High Jump Squat', nameHe: 'סקוואט קפיצה גבוה', duration: 40, notes: 'Strong push, soft landing', notesHe: 'דחיפה חזקה, נחיתה רכה', category: 'power' },
        { id: 'lp1_10', name: 'Alternating Lunges with Jump', nameHe: 'לאנג\'ים קדימה לסירוגין עם קפיצה', duration: 45, notes: 'Stability', notesHe: 'יציבות', category: 'power' },
        { id: 'lp1_11', name: 'Long Jumps from Standing', nameHe: 'קפיצות רחוקות מהמקום', duration: 40, notes: 'Floor explosion', notesHe: 'פיצוץ מהרצפה', category: 'power' },
        { id: 'lp1_12', name: 'Slow Descent Squat + Fast Jump', nameHe: 'סקוואט איטי בירידה + קפיצה מהירה', duration: 45, notes: 'Control and strong exit', notesHe: 'שליטה ויציאה חזקה', category: 'power' }
      ]
    },
    {
      id: 'lp_workout_2',
      name: 'Response Speed & Leg Coordination',
      nameHe: 'מהירות תגובה ותיאום רגליים',
      description: 'Improve reaction speed and leg coordination',
      descriptionHe: 'שיפור מהירות תגובה ותיאום רגליים',
      category: 'leg_power',
      difficulty: 'intermediate',
      duration: 25,
      exercises: [
        { id: 'lp2_1', name: 'Sprint from Standing by Call', nameHe: 'ספרינט מהמקום לפי קריאה', duration: 45, notes: 'External stimulus response', notesHe: 'תגובה לגירוי חיצוני', category: 'speed' },
        { id: 'lp2_2', name: 'Short Sprint 10m × 6', nameHe: 'ספרינט קצר 10 מטר × 6 חזרות', duration: 45, reps: 6, notes: 'Sharp first step', notesHe: 'צעד ראשון חד', category: 'speed' },
        { id: 'lp2_3', name: 'Sprint 20m Gradual Deceleration', nameHe: 'ספרינט 20 מטר עם האטה הדרגתית', duration: 45, notes: 'Movement control', notesHe: 'שליטה בתנועה', category: 'speed' },
        { id: 'lp2_4', name: 'Short Sprint + Sudden Stop', nameHe: 'ספרינט קצר + עצירה פתאומית', duration: 45, notes: 'Precise braking', notesHe: 'בלימה מדויקת', category: 'agility' },
        { id: 'lp2_5', name: 'Square Run', nameHe: 'ריצה בצורת ריבוע', duration: 45, notes: 'Sharp direction changes', notesHe: 'שינויי כיוון חדים', category: 'agility' },
        { id: 'lp2_6', name: 'Lateral Run Right-Left', nameHe: 'ריצה צידית ימינה-שמאלה', duration: 45, notes: 'Movement control', notesHe: 'שליטה בתנועה', category: 'agility' },
        { id: 'lp2_7', name: 'Single-Leg Forward-Back Jumps', nameHe: 'קפיצות על רגל אחת קדימה-אחורה', duration: 40, notes: 'Balance', notesHe: 'שיווי משקל', category: 'agility' },
        { id: 'lp2_8', name: 'Double Lateral Jumps', nameHe: 'קפיצות צידיות כפולות', duration: 40, notes: 'High pace', notesHe: 'קצב גבוה', category: 'agility' },
        { id: 'lp2_9', name: 'High Jump Squat', nameHe: 'סקוואט קפיצה גבוה', duration: 40, notes: 'Soft landing', notesHe: 'נחיתה רכה', category: 'power' },
        { id: 'lp2_10', name: 'Alternating Lunges with Jump', nameHe: 'לאנג\'ים עם קפיצה לסירוגין', duration: 45, notes: 'Proper depth', notesHe: 'עומק נכון', category: 'power' },
        { id: 'lp2_11', name: 'Long Jumps from Standing', nameHe: 'קפיצות רחוקות מהמקום', duration: 40, notes: 'Floor explosion', notesHe: 'פיצוץ מהרצפה', category: 'power' },
        { id: 'lp2_12', name: 'Static Squat 10s + One Jump', nameHe: 'סקוואט סטטי 10 שניות + קפיצה אחת', duration: 45, notes: 'Full control', notesHe: 'שליטה מלאה', category: 'power' }
      ]
    },
    {
      id: 'lp_workout_3',
      name: 'Direction Changes & Acceleration',
      nameHe: 'שינויי כיוון ותאוצה',
      description: 'Master direction changes and acceleration patterns',
      descriptionHe: 'שליטה בשינויי כיוון ודפוסי האצה',
      category: 'leg_power',
      difficulty: 'intermediate',
      duration: 25,
      exercises: [
        { id: 'lp3_1', name: 'Sprint 10m × 8', nameHe: 'ספרינט 10 מטר × 8 חזרות', duration: 45, reps: 8, notes: 'Sharp acceleration', notesHe: 'האצה חדה', category: 'speed' },
        { id: 'lp3_2', name: 'Sprint by Call', nameHe: 'ספרינט לפי קריאה', duration: 45, notes: 'Fast response', notesHe: 'תגובה מהירה', category: 'speed' },
        { id: 'lp3_3', name: 'Sprint 15m + Braking', nameHe: 'ספרינט 15 מטר + בלימה', duration: 45, notes: 'Stop control', notesHe: 'שליטה בעצירה', category: 'agility' },
        { id: 'lp3_4', name: 'Zigzag Sprint', nameHe: 'ספרינט בזיג-זג', duration: 45, notes: 'Direction change control', notesHe: 'שליטה בשינוי כיוון', category: 'agility' },
        { id: 'lp3_5', name: 'Forward-Back Run 10m', nameHe: 'ריצה קדימה-אחורה 10 מטר', duration: 45, notes: 'Direction changes', notesHe: 'שינויי כיוון', category: 'agility' },
        { id: 'lp3_6', name: 'Fast Side Hops on Line', nameHe: 'קפיצות צד מהירות על קו', duration: 40, notes: 'Leg coordination', notesHe: 'תיאום רגליים', category: 'agility' },
        { id: 'lp3_7', name: 'T-Pattern Run', nameHe: 'ריצה בצורת T', duration: 45, notes: 'Precise work', notesHe: 'עבודה מדויקת', category: 'agility' },
        { id: 'lp3_8', name: 'Single-Leg Lateral Jumps', nameHe: 'קפיצות על רגל אחת לצדדים', duration: 40, notes: 'Balance', notesHe: 'שיווי משקל', category: 'agility' },
        { id: 'lp3_9', name: 'High Jump Squat', nameHe: 'סקוואט קפיצה גבוה', duration: 40, notes: 'Maximum height', notesHe: 'גובה מקסימלי', category: 'power' },
        { id: 'lp3_10', name: 'Dynamic Lunges', nameHe: 'לאנג\'ים דינמיים', duration: 45, notes: 'Control and continuous movement', notesHe: 'שליטה ותנועה רציפה', category: 'power' },
        { id: 'lp3_11', name: 'Double Forward Jumps', nameHe: 'קפיצות כפולות קדימה', duration: 40, notes: 'Floor explosion', notesHe: 'פיצוץ מהרצפה', category: 'power' },
        { id: 'lp3_12', name: 'Slow Squat + Fast Jump', nameHe: 'סקוואט איטי + קפיצה מהירה', duration: 45, notes: 'Precise pace', notesHe: 'קצב מדויק', category: 'power' }
      ]
    },
    {
      id: 'lp_workout_4',
      name: 'Leg Control & Response Under Load',
      nameHe: 'שליטה ברגליים ותגובה תחת עומס',
      description: 'Maintain control and response under fatigue',
      descriptionHe: 'שמירה על שליטה ותגובה תחת עייפות',
      category: 'leg_power',
      difficulty: 'advanced',
      duration: 25,
      exercises: [
        { id: 'lp4_1', name: 'Sprint from Standing × 10', nameHe: 'ספרינט מהמקום × 10 חזרות', duration: 45, reps: 10, notes: 'Strong acceleration', notesHe: 'האצה חזקה', category: 'speed' },
        { id: 'lp4_2', name: 'Short Zigzag Sprint', nameHe: 'ספרינט בזיג-זג קצר', duration: 45, notes: 'Coordination', notesHe: 'קואורדינציה', category: 'agility' },
        { id: 'lp4_3', name: 'Sprint by Clap', nameHe: 'ספרינט לפי מחיאת כף', duration: 45, notes: 'Fast response', notesHe: 'תגובה מהירה', category: 'speed' },
        { id: 'lp4_4', name: 'Sprint 10m + Stop on Command', nameHe: 'ספרינט 10 מטר + עצירה בפקודה', duration: 45, notes: 'Controlled braking', notesHe: 'בלימה נשלטת', category: 'agility' },
        { id: 'lp4_5', name: 'Lateral Run Around Imaginary Area', nameHe: 'ריצה צידית סביב אזור דמיון', duration: 45, notes: 'Accuracy and control', notesHe: 'דיוק ושליטה', category: 'agility' },
        { id: 'lp4_6', name: 'Forward-Side-Back Run', nameHe: 'ריצה קדימה-צד-אחורה', duration: 45, notes: 'Coordination', notesHe: 'קואורדינציה', category: 'agility' },
        { id: 'lp4_7', name: 'Small Quick Jumps in Place', nameHe: 'קפיצות קטנות במקום', duration: 40, notes: 'High pace', notesHe: 'קצב גבוה', category: 'agility' },
        { id: 'lp4_8', name: 'Wide Lateral Jumps', nameHe: 'קפיצות רחבות לצדדים', duration: 40, notes: 'Maintain stability', notesHe: 'שמירה על יציבות', category: 'agility' },
        { id: 'lp4_9', name: 'Jump Squat + 180° Turn', nameHe: 'סקוואט קפיצה + 180° סיבוב', duration: 40, notes: 'Control and precise turn', notesHe: 'שליטה וסיבוב מדויק', category: 'power' },
        { id: 'lp4_10', name: 'Forward Lunges with Jump', nameHe: 'לאנג\'ים קדימה עם קפיצה', duration: 45, notes: 'Deep descent', notesHe: 'ירידה עמוקה', category: 'power' },
        { id: 'lp4_11', name: 'Single-Leg Forward Jumps', nameHe: 'קפיצות על רגל אחת קדימה', duration: 40, notes: 'Support leg control', notesHe: 'שליטה ברגל תומכת', category: 'power' },
        { id: 'lp4_12', name: 'Slow Descent Squat + Explosion Up', nameHe: 'סקוואט איטי בירידה + פיצוץ בעלייה', duration: 45, notes: 'Complete control', notesHe: 'שליטה מוחלטת', category: 'power' }
      ]
    },
    {
      id: 'lp_workout_5',
      name: 'Coordinative Speed & Explosive Power',
      nameHe: 'מהירות קואורדינטיבית וכוח מתפרץ',
      description: 'Advanced coordination and explosive power work',
      descriptionHe: 'עבודת קואורדינציה וכוח מתפרץ מתקדמת',
      category: 'leg_power',
      difficulty: 'advanced',
      duration: 25,
      exercises: [
        { id: 'lp5_1', name: 'Sprint from Standing by Audio Cue', nameHe: 'ספרינט מהמקום לפי אות קולי', duration: 45, notes: 'Fast auditory response', notesHe: 'תגובה שמיעתית מהירה', category: 'speed' },
        { id: 'lp5_2', name: 'Short Sprint 15m × 6', nameHe: 'ספרינט קצר 15 מטר × 6 חזרות', duration: 45, reps: 6, notes: 'Maximum acceleration', notesHe: 'האצה מקסימלית', category: 'speed' },
        { id: 'lp5_3', name: 'Sprint 10m + Braking', nameHe: 'ספרינט 10 מטר + בלימה', duration: 45, notes: 'Precise stop', notesHe: 'עצירה מדויקת', category: 'agility' },
        { id: 'lp5_4', name: 'Zigzag Sprint Small Area', nameHe: 'ספרינט בזיג-זג סביב אזור קטן', duration: 45, notes: 'High coordination', notesHe: 'קואורדינציה גבוהה', category: 'agility' },
        { id: 'lp5_5', name: 'Lateral Run Right-Left', nameHe: 'ריצה צידית ימינה-שמאלה', duration: 45, notes: 'Low body', notesHe: 'גוף נמוך', category: 'agility' },
        { id: 'lp5_6', name: 'Lateral Jumps Both Legs', nameHe: 'קפיצות צידיות על שתי רגליים', duration: 40, notes: 'High pace', notesHe: 'קצב גבוה', category: 'agility' },
        { id: 'lp5_7', name: 'Back-Forward Jumps', nameHe: 'קפיצות לאחור-קדימה', duration: 40, notes: 'Balance', notesHe: 'שיווי משקל', category: 'agility' },
        { id: 'lp5_8', name: 'Square Run', nameHe: 'ריצה בצורת ריבוע', duration: 45, notes: 'Sharp direction changes', notesHe: 'שינויי כיוון חדים', category: 'agility' },
        { id: 'lp5_9', name: 'High Jump Squat', nameHe: 'סקוואט קפיצה גבוה', duration: 40, notes: 'Strong push', notesHe: 'דחיפה חזקה', category: 'power' },
        { id: 'lp5_10', name: 'Side Lunges with Jump', nameHe: 'לאנג\'ים צידיים עם קפיצה', duration: 45, notes: 'Precise load', notesHe: 'עומס מדויק', category: 'power' },
        { id: 'lp5_11', name: 'Long Jumps from Standing', nameHe: 'קפיצות רחוקות מהמקום', duration: 40, notes: 'Floor explosion', notesHe: 'פיצוץ מהרצפה', category: 'power' },
        { id: 'lp5_12', name: 'Slow Squat + Strong Jump', nameHe: 'סקוואט איטי + קפיצה חזקה', duration: 45, notes: 'Control and pace', notesHe: 'שליטה וקצב', category: 'power' }
      ]
    }
  ]
};

// Combined export of all programs
export const footballPrograms: FootballProgram[] = [
  explosivePowerProgram,
  agilitySpeedProgram,
  cardioEnduranceProgram,
  strengthEnduranceProgram,
  legPowerProgram
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
