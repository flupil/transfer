import { Platform } from 'react-native';
import { User, Exercise, WorkoutPlan, WorkoutLog, FoodItem, NutritionLog, CalendarEvent, Attendance } from '../types';

// Only import SQLite on native platforms
let SQLite: any = null;
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
}

let db: any = null;

export const initializeDatabase = async () => {
  // Skip database initialization on web
  if (Platform.OS === 'web') {
    console.log('Skipping SQLite initialization on web platform');
    return;
  }

  try {
    // Open or create the database - use sync version for better stability
    db = SQLite.openDatabaseSync('fitgym.db');
    console.log('Database opened successfully');

    // Create tables
    await createTables();

    // Seed initial data only if needed
    await seedInitialData();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    // Try async version as fallback
    try {
      db = await SQLite.openDatabaseAsync('fitgym.db');
      console.log('Database opened with async method');
      await createTables();
      await seedInitialData();
    } catch (asyncError) {
      console.error('Both database methods failed:', asyncError);
    }
  }
};

const createTables = async () => {
  if (!db) {
    console.error('Database not initialized for createTables');
    throw new Error('Database not initialized');
  }

  const tableQueries = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      gymId TEXT NOT NULL,
      coachId TEXT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      photo TEXT,
      dob TEXT,
      height REAL,
      weight REAL,
      units TEXT,
      notificationPreferences TEXT,
      lastActiveAt TEXT,
      createdAt TEXT,
      isActive INTEGER DEFAULT 1,
      syncStatus TEXT DEFAULT 'synced',
      lastSyncedAt TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      equipment TEXT,
      primaryMuscles TEXT,
      secondaryMuscles TEXT,
      imageUrl TEXT,
      videoUrl TEXT,
      instructions TEXT,
      owner TEXT NOT NULL,
      ownerUserId TEXT,
      createdAt TEXT,
      syncStatus TEXT DEFAULT 'synced',
      lastSyncedAt TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS workout_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      owner TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      version INTEGER DEFAULT 1,
      weeks INTEGER,
      daysPerWeek INTEGER,
      workouts TEXT,
      assignedUserIds TEXT,
      tags TEXT,
      difficulty TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      syncStatus TEXT DEFAULT 'synced',
      lastSyncedAt TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS workout_logs (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      planId TEXT,
      date TEXT NOT NULL,
      name TEXT,
      exercises TEXT,
      personalRecords TEXT,
      duration INTEGER,
      notes TEXT,
      mood INTEGER,
      energy INTEGER,
      usedRestTimer INTEGER,
      completedAt TEXT,
      syncStatus TEXT DEFAULT 'pending',
      lastSyncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    );`,

    `CREATE TABLE IF NOT EXISTS food_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT,
      barcode TEXT,
      servingSize REAL,
      servingUnit TEXT,
      macrosPer100g TEXT,
      category TEXT,
      isCustom INTEGER,
      userId TEXT,
      verified INTEGER,
      createdAt TEXT,
      syncStatus TEXT DEFAULT 'synced',
      lastSyncedAt TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS meal_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      owner TEXT NOT NULL,
      ownerId TEXT NOT NULL,
      days TEXT,
      targets TEXT,
      assignedUserIds TEXT,
      tags TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      syncStatus TEXT DEFAULT 'synced',
      lastSyncedAt TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS nutrition_logs (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      date TEXT NOT NULL,
      meals TEXT,
      water REAL,
      totals TEXT,
      targets TEXT,
      notes TEXT,
      totalCalories REAL,
      totalProtein REAL,
      totalCarbs REAL,
      totalFat REAL,
      mealStatus TEXT,
      mealComments TEXT,
      syncStatus TEXT DEFAULT 'pending',
      lastSyncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    );`,

    `CREATE TABLE IF NOT EXISTS food_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      date TEXT NOT NULL,
      mealType TEXT NOT NULL,
      foodData TEXT,
      calories REAL,
      protein REAL,
      carbs REAL,
      fat REAL,
      quantity REAL,
      unit TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      syncStatus TEXT DEFAULT 'pending',
      lastSyncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    );`,

    `CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      startTime TEXT NOT NULL,
      endTime TEXT NOT NULL,
      location TEXT,
      recurring TEXT,
      externalCalendarId TEXT,
      reminderMinutes INTEGER,
      syncStatus TEXT DEFAULT 'pending',
      lastSyncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    );`,

    `CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      date TEXT NOT NULL,
      checkInTime TEXT NOT NULL,
      checkOutTime TEXT,
      method TEXT NOT NULL,
      locationVerified INTEGER,
      createdAt TEXT,
      syncStatus TEXT DEFAULT 'pending',
      lastSyncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    );`,

    `CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      authorId TEXT NOT NULL,
      authorRole TEXT NOT NULL,
      audience TEXT NOT NULL,
      specificUserIds TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      priority TEXT,
      expiresAt TEXT,
      createdAt TEXT,
      readBy TEXT,
      syncStatus TEXT DEFAULT 'synced',
      lastSyncedAt TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS progress_metrics (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      date TEXT NOT NULL,
      weight REAL,
      bodyFat REAL,
      muscleMass REAL,
      measurements TEXT,
      photos TEXT,
      notes TEXT,
      createdAt TEXT,
      syncStatus TEXT DEFAULT 'pending',
      lastSyncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    );`,

    `CREATE TABLE IF NOT EXISTS monthly_summaries (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      month TEXT NOT NULL,
      year INTEGER NOT NULL,
      stats TEXT,
      achievements TEXT,
      createdAt TEXT,
      syncStatus TEXT DEFAULT 'synced',
      lastSyncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    );`,

    `CREATE TABLE IF NOT EXISTS water_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      date TEXT NOT NULL,
      amount INTEGER NOT NULL,
      timestamp TEXT NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      syncStatus TEXT DEFAULT 'pending',
      lastSyncedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    );`,

    `CREATE TABLE IF NOT EXISTS user_preferences (
      userId TEXT PRIMARY KEY,
      waterGoal INTEGER DEFAULT 2000,
      stepsGoal INTEGER DEFAULT 10000,
      sleepGoal INTEGER DEFAULT 8,
      restGoal INTEGER DEFAULT 1,
      workoutReminders TEXT,
      mealReminders TEXT,
      theme TEXT DEFAULT 'light',
      units TEXT DEFAULT 'metric',
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    );`,

    `CREATE TABLE IF NOT EXISTS health_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      value REAL NOT NULL,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT,
      syncStatus TEXT DEFAULT 'pending',
      FOREIGN KEY (userId) REFERENCES users(id),
      UNIQUE(userId, date, type)
    );`,

    `CREATE TABLE IF NOT EXISTS wearable_data (
      userId TEXT NOT NULL,
      date TEXT NOT NULL,
      steps INTEGER,
      heartRate TEXT,
      calories INTEGER,
      activeMinutes INTEGER,
      distance REAL,
      floors INTEGER,
      sleep TEXT,
      source TEXT,
      lastSyncedAt TEXT,
      PRIMARY KEY (userId, date, source),
      FOREIGN KEY (userId) REFERENCES users(id)
    );`,

    `CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tableName TEXT NOT NULL,
      operation TEXT NOT NULL,
      data TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      attempts INTEGER DEFAULT 0,
      lastAttemptAt TEXT,
      error TEXT
    );`
  ];

  const indexQueries = [
    `CREATE INDEX IF NOT EXISTS idx_workout_logs_user ON workout_logs(userId);`,
    `CREATE INDEX IF NOT EXISTS idx_nutrition_logs_user ON nutrition_logs(userId);`,
    `CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON calendar_events(userId);`,
    `CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(userId);`,
    `CREATE INDEX IF NOT EXISTS idx_sync_queue_created ON sync_queue(createdAt);`
  ];

  // Execute table creation queries with error handling
  for (const query of tableQueries) {
    try {
      // Check if db has execAsync (async database) or execute (sync database)
      if ('execAsync' in db) {
        await db.execAsync(query);
      } else if ('execute' in db) {
        (db as any).execute(query);
      } else {
        console.error('Unknown database type');
      }
    } catch (error) {
      console.error('Error creating table:', error);
      // Continue with other tables
    }
  }

  // Execute index creation queries with error handling
  for (const query of indexQueries) {
    try {
      if ('execAsync' in db) {
        await db.execAsync(query);
      } else if ('execute' in db) {
        (db as any).execute(query);
      }
    } catch (error) {
      console.error('Error creating index:', error);
      // Continue with other indexes
    }
  }
};

const seedInitialData = async () => {
  if (!db) {
    console.log('Database not initialized - skipping seed data');
    return;
  }

  // Check if we already have seed data
  try {
    const existingExercises = await db.getAllAsync('SELECT COUNT(*) as count FROM exercises WHERE owner = "gym"') as { count: number }[];
    if (existingExercises && existingExercises[0]?.count > 0) {
      console.log('Seed data already exists - skipping');
      return;
    }
  } catch (error) {
    console.log('Could not check existing data, proceeding with seed:', error);
  }

  const gymExercises = [
    // Chest Exercises
    { name: 'Barbell Bench Press', category: 'strength', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'shoulders'], equipment: 'barbell', instructions: 'Lie on bench, lower bar to chest, press up explosively' },
    { name: 'Dumbbell Bench Press', category: 'strength', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'shoulders'], equipment: 'dumbbells', instructions: 'Lie on bench with dumbbells, press up in controlled motion' },
    { name: 'Incline Barbell Press', category: 'strength', primaryMuscles: ['chest'], secondaryMuscles: ['shoulders', 'triceps'], equipment: 'barbell', instructions: 'Set bench to 30-45 degrees, press barbell from chest' },
    { name: 'Dumbbell Flyes', category: 'strength', primaryMuscles: ['chest'], equipment: 'dumbbells', instructions: 'Lie on bench, arc dumbbells out and back together' },
    { name: 'Push-ups', category: 'strength', primaryMuscles: ['chest'], secondaryMuscles: ['triceps', 'shoulders'], equipment: 'none', instructions: 'Start in plank, lower chest to ground, push back up' },
    { name: 'Cable Crossover', category: 'strength', primaryMuscles: ['chest'], equipment: 'cable machine', instructions: 'Set cables high, bring handles together in front of chest' },

    // Back Exercises
    { name: 'Deadlift', category: 'strength', primaryMuscles: ['back', 'hamstrings'], secondaryMuscles: ['glutes', 'traps'], equipment: 'barbell', instructions: 'Hip hinge movement, keep bar close to body' },
    { name: 'Pull-ups', category: 'strength', primaryMuscles: ['back', 'biceps'], equipment: 'pull-up bar', instructions: 'Hang from bar, pull chin over bar, lower controlled' },
    { name: 'Barbell Rows', category: 'strength', primaryMuscles: ['back'], secondaryMuscles: ['biceps'], equipment: 'barbell', instructions: 'Bend at hips, pull bar to lower chest' },
    { name: 'Lat Pulldown', category: 'strength', primaryMuscles: ['back'], secondaryMuscles: ['biceps'], equipment: 'cable machine', instructions: 'Pull bar down to chest, squeeze shoulder blades' },
    { name: 'T-Bar Row', category: 'strength', primaryMuscles: ['back'], equipment: 'T-bar', instructions: 'Straddle bar, pull handle to chest' },
    { name: 'Cable Rows', category: 'strength', primaryMuscles: ['back'], equipment: 'cable machine', instructions: 'Sit upright, pull handle to abdomen' },

    // Leg Exercises
    { name: 'Squat', category: 'strength', primaryMuscles: ['quadriceps', 'glutes'], secondaryMuscles: ['hamstrings', 'calves'], equipment: 'barbell', instructions: 'Lower hips back and down, drive through heels to stand' },
    { name: 'Leg Press', category: 'strength', primaryMuscles: ['quadriceps'], secondaryMuscles: ['glutes'], equipment: 'leg press machine', instructions: 'Lower platform to 90 degrees, press through heels' },
    { name: 'Lunges', category: 'strength', primaryMuscles: ['quadriceps', 'glutes'], equipment: 'dumbbells', instructions: 'Step forward, lower back knee, return to standing' },
    { name: 'Romanian Deadlift', category: 'strength', primaryMuscles: ['hamstrings'], secondaryMuscles: ['glutes', 'back'], equipment: 'barbell', instructions: 'Hip hinge with slight knee bend, feel hamstring stretch' },
    { name: 'Leg Curls', category: 'strength', primaryMuscles: ['hamstrings'], equipment: 'leg curl machine', instructions: 'Curl heels toward glutes, control the negative' },
    { name: 'Calf Raises', category: 'strength', primaryMuscles: ['calves'], equipment: 'calf raise machine', instructions: 'Rise onto toes, pause at top, lower slowly' },

    // Shoulder Exercises
    { name: 'Dumbbell Shoulder Press', category: 'strength', primaryMuscles: ['shoulders'], secondaryMuscles: ['triceps'], equipment: 'dumbbells', instructions: 'Press dumbbells overhead, full range of motion' },
    { name: 'Lateral Raises', category: 'strength', primaryMuscles: ['shoulders'], equipment: 'dumbbells', instructions: 'Raise arms out to sides until parallel to floor' },
    { name: 'Front Raises', category: 'strength', primaryMuscles: ['shoulders'], equipment: 'dumbbells', instructions: 'Raise one arm forward to shoulder height' },
    { name: 'Rear Delt Flyes', category: 'strength', primaryMuscles: ['shoulders'], equipment: 'dumbbells', instructions: 'Bend forward, raise arms out behind you' },
    { name: 'Upright Rows', category: 'strength', primaryMuscles: ['shoulders'], equipment: 'barbell', instructions: 'Pull bar up along body to chest level' },

    // Arm Exercises
    { name: 'Dumbbell Bicep Curl', category: 'strength', primaryMuscles: ['biceps'], equipment: 'dumbbells', instructions: 'Curl dumbbells up, squeeze biceps at top' },
    { name: 'Hammer Curls', category: 'strength', primaryMuscles: ['biceps'], equipment: 'dumbbells', instructions: 'Curl with neutral grip, targets different bicep head' },
    { name: 'Tricep Dips', category: 'strength', primaryMuscles: ['triceps'], equipment: 'dip bars', instructions: 'Lower body by bending elbows, press back up' },
    { name: 'Close-Grip Bench Press', category: 'strength', primaryMuscles: ['triceps'], equipment: 'barbell', instructions: 'Narrow grip bench press, focus on triceps' },
    { name: 'Tricep Pushdowns', category: 'strength', primaryMuscles: ['triceps'], equipment: 'cable machine', instructions: 'Push cable down, keep elbows tucked' },
    { name: 'Preacher Curls', category: 'strength', primaryMuscles: ['biceps'], equipment: 'preacher bench', instructions: 'Curl over preacher pad, full range of motion' },

    // Core Exercises
    { name: 'Plank', category: 'strength', primaryMuscles: ['abs'], equipment: 'none', instructions: 'Hold straight line from head to heels' },
    { name: 'Crunches', category: 'strength', primaryMuscles: ['abs'], equipment: 'none', instructions: 'Curl upper body toward knees' },
    { name: 'Russian Twists', category: 'strength', primaryMuscles: ['abs'], equipment: 'none', instructions: 'Rotate torso side to side while seated' },
    { name: 'Mountain Climbers', category: 'cardio', primaryMuscles: ['abs'], equipment: 'none', instructions: 'Alternate bringing knees to chest in plank position' },
    { name: 'Leg Raises', category: 'strength', primaryMuscles: ['abs'], equipment: 'none', instructions: 'Lift legs up while lying on back' },

    // Cardio Exercises
    { name: 'Treadmill Running', category: 'cardio', primaryMuscles: [], equipment: 'treadmill', instructions: 'Maintain steady pace, proper running form' },
    { name: 'Cycling', category: 'cardio', primaryMuscles: [], equipment: 'bike', instructions: 'Pedal at consistent cadence, adjust resistance' },
    { name: 'Rowing', category: 'cardio', primaryMuscles: ['back'], equipment: 'rowing machine', instructions: 'Drive with legs, pull with arms, reverse to return' },
    { name: 'Elliptical', category: 'cardio', primaryMuscles: [], equipment: 'elliptical', instructions: 'Smooth stride motion, use arms for full body workout' },
    { name: 'Stair Climber', category: 'cardio', primaryMuscles: ['legs'], equipment: 'stair climber', instructions: 'Step continuously, maintain upright posture' },

    // Functional/Plyometric
    { name: 'Box Jumps', category: 'plyometric', primaryMuscles: ['quadriceps'], equipment: 'box', instructions: 'Jump onto box, land softly, step down' },
    { name: 'Burpees', category: 'cardio', primaryMuscles: [], equipment: 'none', instructions: 'Squat, jump back to plank, push-up, jump forward, jump up' },
    { name: 'Battle Ropes', category: 'cardio', primaryMuscles: ['arms', 'core'], equipment: 'battle ropes', instructions: 'Alternate arm waves with heavy ropes' },
    { name: 'Kettlebell Swings', category: 'strength', primaryMuscles: ['glutes', 'hamstrings'], equipment: 'kettlebell', instructions: 'Hip hinge movement, swing kettlebell to shoulder height' },
    { name: 'Medicine Ball Slams', category: 'plyometric', primaryMuscles: ['core'], equipment: 'medicine ball', instructions: 'Lift ball overhead, slam down with full force' }
  ];

  for (const exercise of gymExercises) {
    const id = `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
      await db.runAsync(
        `INSERT OR IGNORE INTO exercises (id, name, category, equipment, primaryMuscles, secondaryMuscles, instructions, owner, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'gym', datetime('now'))`,
        [
          id,
          exercise.name,
          exercise.category,
          exercise.equipment || '',
          JSON.stringify(exercise.primaryMuscles),
          JSON.stringify(exercise.secondaryMuscles || []),
          exercise.instructions || '',
        ]
      );
    } catch (error) {
      console.log('Exercise already exists:', exercise.name);
    }
  }

  const sampleFoods = [
    // Protein Sources
    { name: 'Chicken Breast', category: 'protein', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 165, protein: 31, carbs: 0, fat: 3.6 } },
    { name: 'Salmon', category: 'protein', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 208, protein: 20, carbs: 0, fat: 13 } },
    { name: 'Lean Ground Beef', category: 'protein', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 250, protein: 26, carbs: 0, fat: 15 } },
    { name: 'Eggs', category: 'protein', brand: '', servingSize: 50, servingUnit: 'g', macros: { calories: 155, protein: 13, carbs: 1.1, fat: 11 } },
    { name: 'Tuna', category: 'protein', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 144, protein: 30, carbs: 0, fat: 1 } },
    { name: 'Turkey Breast', category: 'protein', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 135, protein: 30, carbs: 0, fat: 1 } },
    { name: 'Tilapia', category: 'protein', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 129, protein: 26, carbs: 0, fat: 3 } },
    { name: 'Shrimp', category: 'protein', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 99, protein: 24, carbs: 0, fat: 0.3 } },
    { name: 'Lean Pork', category: 'protein', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 242, protein: 27, carbs: 0, fat: 14 } },
    { name: 'Cod', category: 'protein', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 105, protein: 23, carbs: 0, fat: 0.9 } },

    // Dairy Products
    { name: 'Greek Yogurt', category: 'dairy', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 100, protein: 17, carbs: 6, fat: 0.7 } },
    { name: 'Cottage Cheese', category: 'dairy', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 98, protein: 11, carbs: 3.4, fat: 4.3 } },
    { name: 'Milk (2%)', category: 'dairy', brand: '', servingSize: 240, servingUnit: 'ml', macros: { calories: 122, protein: 8, carbs: 12, fat: 4.8 } },
    { name: 'Cheddar Cheese', category: 'dairy', brand: '', servingSize: 28, servingUnit: 'g', macros: { calories: 113, protein: 7, carbs: 1, fat: 9 } },
    { name: 'Mozzarella', category: 'dairy', brand: '', servingSize: 28, servingUnit: 'g', macros: { calories: 85, protein: 6, carbs: 1, fat: 6 } },

    // Carbohydrates
    { name: 'Brown Rice', category: 'carbs', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 112, protein: 2.6, carbs: 23.5, fat: 0.9 } },
    { name: 'White Rice', category: 'carbs', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 } },
    { name: 'Quinoa', category: 'carbs', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 120, protein: 4.4, carbs: 22, fat: 1.9 } },
    { name: 'Sweet Potato', category: 'carbs', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 86, protein: 1.6, carbs: 20.1, fat: 0.1 } },
    { name: 'Oatmeal', category: 'grains', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 68, protein: 2.4, carbs: 12, fat: 1.4 } },
    { name: 'Whole Wheat Bread', category: 'grains', brand: '', servingSize: 28, servingUnit: 'g', macros: { calories: 69, protein: 3.6, carbs: 12, fat: 1.2 } },
    { name: 'Pasta', category: 'carbs', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 131, protein: 5, carbs: 25, fat: 1.1 } },
    { name: 'Potato', category: 'carbs', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 77, protein: 2, carbs: 17, fat: 0.1 } },

    // Vegetables
    { name: 'Broccoli', category: 'vegetables', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4 } },
    { name: 'Spinach', category: 'vegetables', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 } },
    { name: 'Carrots', category: 'vegetables', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 41, protein: 0.9, carbs: 9.6, fat: 0.2 } },
    { name: 'Bell Peppers', category: 'vegetables', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 31, protein: 1, carbs: 7, fat: 0.3 } },
    { name: 'Asparagus', category: 'vegetables', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1 } },
    { name: 'Green Beans', category: 'vegetables', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 31, protein: 1.8, carbs: 7, fat: 0.2 } },
    { name: 'Zucchini', category: 'vegetables', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 } },
    { name: 'Cauliflower', category: 'vegetables', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 25, protein: 1.9, carbs: 5, fat: 0.3 } },

    // Fruits
    { name: 'Banana', category: 'fruits', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3 } },
    { name: 'Apple', category: 'fruits', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 } },
    { name: 'Orange', category: 'fruits', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 47, protein: 0.9, carbs: 12, fat: 0.1 } },
    { name: 'Strawberries', category: 'fruits', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 } },
    { name: 'Blueberries', category: 'fruits', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 57, protein: 0.7, carbs: 14, fat: 0.3 } },
    { name: 'Grapes', category: 'fruits', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 62, protein: 0.6, carbs: 16, fat: 0.2 } },

    // Fats and Nuts
    { name: 'Almonds', category: 'fats', brand: '', servingSize: 28, servingUnit: 'g', macros: { calories: 161, protein: 6, carbs: 6, fat: 14 } },
    { name: 'Walnuts', category: 'fats', brand: '', servingSize: 28, servingUnit: 'g', macros: { calories: 185, protein: 4.3, carbs: 3.9, fat: 18.5 } },
    { name: 'Peanut Butter', category: 'fats', brand: '', servingSize: 32, servingUnit: 'g', macros: { calories: 188, protein: 8, carbs: 8, fat: 16 } },
    { name: 'Avocado', category: 'fats', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 160, protein: 2, carbs: 9, fat: 15 } },
    { name: 'Olive Oil', category: 'fats', brand: '', servingSize: 15, servingUnit: 'ml', macros: { calories: 119, protein: 0, carbs: 0, fat: 13.5 } },
    { name: 'Cashews', category: 'fats', brand: '', servingSize: 28, servingUnit: 'g', macros: { calories: 157, protein: 5.2, carbs: 8.6, fat: 12.4 } },

    // Legumes
    { name: 'Black Beans', category: 'legumes', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 132, protein: 8.9, carbs: 23, fat: 0.5 } },
    { name: 'Chickpeas', category: 'legumes', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 164, protein: 8.9, carbs: 27, fat: 2.6 } },
    { name: 'Lentils', category: 'legumes', brand: '', servingSize: 100, servingUnit: 'g', macros: { calories: 116, protein: 9, carbs: 20, fat: 0.4 } },

    // Snacks and Others
    { name: 'Protein Powder (Whey)', category: 'supplements', brand: '', servingSize: 30, servingUnit: 'g', macros: { calories: 110, protein: 25, carbs: 2, fat: 1 } },
    { name: 'Dark Chocolate', category: 'treats', brand: '', servingSize: 28, servingUnit: 'g', macros: { calories: 155, protein: 2, carbs: 13, fat: 12 } },
    { name: 'Honey', category: 'sweeteners', brand: '', servingSize: 21, servingUnit: 'g', macros: { calories: 64, protein: 0.1, carbs: 17, fat: 0 } }
  ];

  for (const food of sampleFoods) {
    const id = `food_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
      await db.runAsync(
        `INSERT OR IGNORE INTO food_items (id, name, brand, category, servingSize, servingUnit, macrosPer100g, isCustom, verified, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, datetime('now'))`,
        [id, food.name, food.brand, food.category, food.servingSize, food.servingUnit, JSON.stringify(food.macros)]
      );
    } catch (error) {
      console.log('Food already exists:', food.name);
    }
  }

  // Add sample workout plans
  await seedWorkoutPlans();

  // Add sample meal plans
  await seedMealPlans();

  // Add demo users
  await seedDemoUsers();
};

const seedWorkoutPlans = async () => {
  if (!db) return;

  const samplePlans = [
    {
      name: 'Beginner Full Body',
      description: 'A 3-day full body workout plan perfect for beginners',
      owner: 'gym',
      ownerId: 'gym_admin',
      weeks: 4,
      daysPerWeek: 3,
      difficulty: 'beginner',
      tags: ['full-body', 'beginner', 'strength'],
      workouts: [
        {
          day: 1,
          name: 'Full Body A',
          exercises: [
            { exerciseId: 'squat', sets: 3, reps: 12, weight: 0, restTime: 60 },
            { exerciseId: 'push-ups', sets: 3, reps: 10, weight: 0, restTime: 60 },
            { exerciseId: 'plank', sets: 3, duration: 30, restTime: 60 }
          ]
        },
        {
          day: 2,
          name: 'Full Body B',
          exercises: [
            { exerciseId: 'deadlift', sets: 3, reps: 10, weight: 0, restTime: 90 },
            { exerciseId: 'pull-ups', sets: 3, reps: 8, weight: 0, restTime: 60 },
            { exerciseId: 'lunges', sets: 3, reps: 12, weight: 0, restTime: 60 }
          ]
        }
      ]
    },
    {
      name: 'Upper/Lower Split',
      description: 'A 4-day upper/lower body split for intermediate lifters',
      owner: 'gym',
      ownerId: 'gym_admin',
      weeks: 6,
      daysPerWeek: 4,
      difficulty: 'intermediate',
      tags: ['upper-lower', 'intermediate', 'strength'],
      workouts: [
        {
          day: 1,
          name: 'Upper Body',
          exercises: [
            { exerciseId: 'bench-press', sets: 4, reps: 8, weight: 0, restTime: 120 },
            { exerciseId: 'barbell-rows', sets: 4, reps: 8, weight: 0, restTime: 120 },
            { exerciseId: 'shoulder-press', sets: 3, reps: 10, weight: 0, restTime: 90 }
          ]
        },
        {
          day: 2,
          name: 'Lower Body',
          exercises: [
            { exerciseId: 'squat', sets: 4, reps: 8, weight: 0, restTime: 120 },
            { exerciseId: 'romanian-deadlift', sets: 3, reps: 10, weight: 0, restTime: 90 },
            { exerciseId: 'leg-press', sets: 3, reps: 12, weight: 0, restTime: 90 }
          ]
        }
      ]
    }
  ];

  for (const plan of samplePlans) {
    const id = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
      await db.runAsync(
        `INSERT OR IGNORE INTO workout_plans (id, name, description, owner, ownerId, weeks, daysPerWeek, difficulty, tags, workouts, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [id, plan.name, plan.description, plan.owner, plan.ownerId, plan.weeks, plan.daysPerWeek, plan.difficulty, JSON.stringify(plan.tags), JSON.stringify(plan.workouts)]
      );
    } catch (error) {
      console.log('Workout plan already exists:', plan.name);
    }
  }
};

const seedMealPlans = async () => {
  if (!db) return;

  const sampleMealPlans = [
    {
      name: 'High Protein Cut',
      description: 'A high protein meal plan for cutting weight',
      owner: 'gym',
      ownerId: 'gym_admin',
      tags: ['high-protein', 'cutting', 'fat-loss'],
      targets: { calories: 1800, protein: 150, carbs: 150, fat: 60 },
      days: [
        {
          day: 1,
          meals: [
            {
              name: 'Breakfast',
              foods: [
                { foodId: 'eggs', quantity: 3, unit: 'whole' },
                { foodId: 'oatmeal', quantity: 50, unit: 'g' },
                { foodId: 'banana', quantity: 1, unit: 'medium' }
              ]
            },
            {
              name: 'Lunch',
              foods: [
                { foodId: 'chicken-breast', quantity: 150, unit: 'g' },
                { foodId: 'brown-rice', quantity: 100, unit: 'g' },
                { foodId: 'broccoli', quantity: 150, unit: 'g' }
              ]
            },
            {
              name: 'Dinner',
              foods: [
                { foodId: 'salmon', quantity: 120, unit: 'g' },
                { foodId: 'sweet-potato', quantity: 150, unit: 'g' },
                { foodId: 'asparagus', quantity: 100, unit: 'g' }
              ]
            }
          ]
        }
      ]
    }
  ];

  for (const plan of sampleMealPlans) {
    const id = `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    try {
      await db.runAsync(
        `INSERT OR IGNORE INTO meal_plans (id, name, description, owner, ownerId, tags, targets, days, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [id, plan.name, plan.description, plan.owner, plan.ownerId, JSON.stringify(plan.tags), JSON.stringify(plan.targets), JSON.stringify(plan.days)]
      );
    } catch (error) {
      console.log('Meal plan already exists:', plan.name);
    }
  }
};

const seedDemoUsers = async () => {
  if (!db) return;

  const demoUsers = [
    {
      id: 'admin_demo',
      role: 'admin',
      gymId: 'demo_gym',
      name: 'Admin Demo',
      email: 'admin@demo.com',
      height: 175,
      weight: 70,
      units: 'metric',
      isActive: 1
    },
    {
      id: 'coach_demo',
      role: 'coach',
      gymId: 'demo_gym',
      name: 'Coach Demo',
      email: 'coach@demo.com',
      height: 180,
      weight: 80,
      units: 'metric',
      isActive: 1
    },
    {
      id: 'user_demo1',
      role: 'user',
      gymId: 'demo_gym',
      coachId: 'coach_demo',
      name: 'John Doe',
      email: 'john@demo.com',
      height: 178,
      weight: 75,
      units: 'metric',
      isActive: 1
    },
    {
      id: 'user_demo2',
      role: 'user',
      gymId: 'demo_gym',
      coachId: 'coach_demo',
      name: 'Jane Smith',
      email: 'jane@demo.com',
      height: 165,
      weight: 60,
      units: 'metric',
      isActive: 1
    }
  ];

  for (const user of demoUsers) {
    try {
      await db.runAsync(
        `INSERT OR IGNORE INTO users (id, role, gymId, coachId, name, email, height, weight, units, isActive, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [user.id, user.role, user.gymId, user.coachId || null, user.name, user.email, user.height, user.weight, user.units, user.isActive]
      );
    } catch (error) {
      console.log('Demo user already exists:', user.name);
    }
  }
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};

export const clearDatabase = async () => {
  if (!db) throw new Error('Database not initialized');

  const tables = [
    'users', 'exercises', 'workout_plans', 'workout_logs',
    'food_items', 'meal_plans', 'nutrition_logs', 'calendar_events',
    'attendance', 'announcements', 'progress_metrics', 'monthly_summaries',
    'wearable_data', 'sync_queue'
  ];

  for (const table of tables) {
    await db.execAsync(`DELETE FROM ${table}`);
  }
};