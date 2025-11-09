export type UserRole = 'admin' | 'coach' | 'user';

export interface User {
  id: string;
  role: UserRole;
  gymId: string;
  coachId?: string;
  name: string;
  email: string;
  photo?: string;
  dob?: Date;
  height?: number;
  weight?: number;
  units: {
    weight: 'kg' | 'lb';
    height: 'cm' | 'in';
  };
  notificationPreferences: NotificationPreferences;
  lastActiveAt: Date;
  createdAt: Date;
  isActive: boolean;
}

export interface NotificationPreferences {
  workoutReminders: boolean;
  mealReminders: boolean;
  announcements: boolean;
  progressUpdates: boolean;
  reminderTime?: string;
}

export interface CoachProfile {
  id: string;
  userId: string;
  bio: string;
  specialties: string[];
  photo?: string;
  maxTrainees: number;
  currentTrainees: number;
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  equipment?: string;
  primaryMuscles: MuscleGroup[];
  secondaryMuscles?: MuscleGroup[];
  imageUrl?: string;
  videoUrl?: string;
  instructions?: string;
  owner: 'gym' | 'user';
  ownerUserId?: string;
  createdAt: Date;
}

export type ExerciseCategory =
  | 'strength'
  | 'cardio'
  | 'flexibility'
  | 'balance'
  | 'plyometric'
  | 'powerlifting'
  | 'olympic';

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'quadriceps'
  | 'hamstrings'
  | 'glutes'
  | 'calves';

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  owner: 'coach' | 'user' | 'gym';
  ownerId: string;
  version: number;
  weeks: number;
  daysPerWeek: number;
  workouts: WorkoutDay[];
  assignedUserIds?: string[];
  tags?: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutDay {
  dayNumber: number;
  name: string;
  exercises: WorkoutExercise[];
  restDay: boolean;
  notes?: string;
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  reps?: string;
  weight?: number;
  duration?: number;
  distance?: number;
  restSeconds?: number;
  tempo?: string;
  notes?: string;
  supersetWith?: string;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  planId?: string;
  date: Date;
  name: string;
  exercises: WorkoutLogEntry[];
  personalRecords: PersonalRecord[];
  duration: number;
  notes?: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  energy?: 1 | 2 | 3 | 4 | 5;
  usedRestTimer: boolean;
  completedAt?: Date;
  syncedAt?: Date;
}

export interface WorkoutLogEntry {
  exerciseId: string;
  exerciseName: string;
  sets: SetLog[];
  notes?: string;
}

export interface SetLog {
  setNumber: number;
  reps: number;
  weight?: number;
  duration?: number;
  distance?: number;
  completed: boolean;
  rpe?: number;
}

// Alias for backward compatibility
export type WorkoutSet = SetLog;

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  type: 'weight' | 'reps' | 'duration' | 'distance';
  value: number;
  previousValue?: number;
  date: Date;
}

export interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  barcode?: string;
  servingSize: number;
  servingUnit: string;
  macrosPer100g: Macros;
  category: FoodCategory;
  isCustom: boolean;
  userId?: string;
  verified: boolean;
  createdAt: Date;
}

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export type FoodCategory =
  | 'protein'
  | 'carbs'
  | 'fats'
  | 'vegetables'
  | 'fruits'
  | 'dairy'
  | 'grains'
  | 'beverages'
  | 'supplements'
  | 'other';

export interface MealPlan {
  id: string;
  name: string;
  description?: string;
  owner: 'coach' | 'user' | 'gym';
  ownerId: string;
  days: MealDay[];
  targets: MacroTargets;
  assignedUserIds?: string[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MealDay {
  dayNumber: number;
  meals: Meal[];
  targets?: MacroTargets;
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  items: MealItem[];
  notes?: string;
}

export interface MealItem {
  foodId: string;
  quantity: number;
  unit: string;
  customMacros?: Macros;
}

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  proteinPercent?: number;
  carbsPercent?: number;
  fatPercent?: number;
}

export interface NutritionLog {
  id: string;
  userId: string;
  date: Date;
  meals: NutritionLogEntry[];
  water?: number;
  totals: Macros;
  targets: MacroTargets;
  notes?: string;
  syncedAt?: Date;
}

export interface NutritionLogEntry {
  id: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'pre-workout' | 'post-workout';
  time: string;
  items: LoggedFood[];
}

export interface LoggedFood {
  foodId?: string;
  foodName: string;
  quantity: number;
  unit: string;
  macros: Macros;
  isQuickAdd: boolean;
}

export interface CalendarEvent {
  id: string;
  userId: string;
  type: 'workout' | 'class' | 'appointment' | 'measurement';
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  recurring?: RecurringPattern;
  externalCalendarId?: string;
  lastSyncedAt?: Date;
  reminderMinutes?: number;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  endDate?: Date;
  occurrences?: number;
}

export interface Attendance {
  id: string;
  userId: string;
  date: Date;
  checkInTime: Date;
  checkOutTime?: Date;
  method: 'manual' | 'nfc' | 'qr';
  locationVerified: boolean;
  createdAt: Date;
}

export interface Announcement {
  id: string;
  authorId: string;
  authorRole: UserRole;
  audience: 'all' | 'coaches' | 'users' | 'specific';
  specificUserIds?: string[];
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  expiresAt?: Date;
  createdAt: Date;
  readBy?: string[];
}

export interface ProgressMetric {
  id: string;
  userId: string;
  date: Date;
  weight?: number;
  bodyFat?: number;
  muscleMass?: number;
  measurements?: BodyMeasurements;
  photos?: ProgressPhoto[];
  notes?: string;
  createdAt: Date;
}

export interface BodyMeasurements {
  neck?: number;
  shoulders?: number;
  chest?: number;
  waist?: number;
  hips?: number;
  leftBicep?: number;
  rightBicep?: number;
  leftThigh?: number;
  rightThigh?: number;
  leftCalf?: number;
  rightCalf?: number;
}

export interface ProgressPhoto {
  id: string;
  url: string;
  type: 'front' | 'side' | 'back';
  takenAt: Date;
}

export interface MonthlySummary {
  id: string;
  userId: string;
  month: string;
  year: number;
  stats: {
    totalWorkouts: number;
    totalDuration: number;
    attendanceDays: number;
    avgCalories: number;
    avgProtein: number;
    avgCarbs: number;
    avgFat: number;
    weightChange?: number;
    bodyFatChange?: number;
    personalRecords: number;
    mostUsedExercises: { exerciseId: string; count: number }[];
    completionRate: number;
  };
  achievements?: Achievement[];
  createdAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  category: 'workout' | 'nutrition' | 'consistency' | 'milestone';
}

export interface WearableData {
  userId: string;
  date: Date;
  steps?: number;
  heartRate?: HeartRateData;
  calories?: number;
  activeMinutes?: number;
  distance?: number;
  floors?: number;
  sleep?: SleepData;
  source: 'apple_health' | 'google_fit' | 'fitbit' | 'garmin';
  lastSyncedAt: Date;
}

export interface HeartRateData {
  resting: number;
  average?: number;
  max?: number;
  zones?: HeartRateZone[];
}

export interface HeartRateZone {
  name: string;
  minBpm: number;
  maxBpm: number;
  minutes: number;
}

export interface SleepData {
  duration: number;
  quality?: number;
  stages?: {
    deep: number;
    light: number;
    rem: number;
    awake: number;
  };
}

export interface GymSettings {
  id: string;
  name: string;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  operatingHours?: DaySchedule[];
  features: {
    nfcCheckIn: boolean;
    barcodeScanning: boolean;
    wearableIntegration: boolean;
    calendarSync: boolean;
  };
}

export interface DaySchedule {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export interface ExportData {
  type: 'users' | 'workouts' | 'nutrition' | 'attendance' | 'analytics';
  filters?: {
    startDate?: Date;
    endDate?: Date;
    userIds?: string[];
    coachIds?: string[];
  };
  format: 'csv' | 'json';
  columns?: string[];
}