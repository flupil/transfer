// Temporary script to set streak to 2
const AsyncStorage = require('@react-native-async-storage/async-storage');

async function setStreak() {
  const streakData = {
    workoutStreak: 2,
    nutritionStreak: 0,
    lastWorkoutDate: new Date().toISOString(),
    lastNutritionLogDate: null,
    longestWorkoutStreak: 2,
    longestNutritionStreak: 0,
    totalWorkouts: 2,
    availableFreezes: 0
  };
  
  console.log('Setting streak to:', JSON.stringify(streakData, null, 2));
  // This would set it in the app - but we can't run this from here
}

setStreak();
