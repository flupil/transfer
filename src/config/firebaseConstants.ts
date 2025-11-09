/**
 * Firebase Collection Names
 * Centralized constants for all Firestore collection names
 */
export const COLLECTIONS = {
  USERS: 'users',
  WORKOUTS: 'workouts',
  DAILY_DATA: 'dailyData',
  WORKOUT_PLANS: 'workoutPlans',
  EXERCISES: 'exercises',
  MEALS: 'meals',
  PROGRESS_PHOTOS: 'progressPhotos',
  CHALLENGES: 'challenges',
  NOTIFICATIONS: 'notifications',
} as const;

/**
 * Firebase Storage Paths
 * Centralized constants for Firebase Storage paths
 */
export const STORAGE_PATHS = {
  PROFILE_PICTURES: 'profile-pictures',
  PROGRESS_PHOTOS: 'progress-photos',
  MEAL_PHOTOS: 'meal-photos',
} as const;

/**
 * Firebase Error Codes
 * Common Firebase error codes for better error handling
 */
export const FIREBASE_ERRORS = {
  PERMISSION_DENIED: 'permission-denied',
  NOT_FOUND: 'not-found',
  ALREADY_EXISTS: 'already-exists',
  UNAUTHENTICATED: 'unauthenticated',
  RESOURCE_EXHAUSTED: 'resource-exhausted',
  FAILED_PRECONDITION: 'failed-precondition',
  ABORTED: 'aborted',
  OUT_OF_RANGE: 'out-of-range',
  UNIMPLEMENTED: 'unimplemented',
  INTERNAL: 'internal',
  UNAVAILABLE: 'unavailable',
  DATA_LOSS: 'data-loss',
} as const;
