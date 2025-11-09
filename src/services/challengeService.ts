import AsyncStorage from '@react-native-async-storage/async-storage';
import { addExperience } from './progressTrackingService';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly';
  category: 'workout' | 'nutrition' | 'steps' | 'water' | 'mindfulness';
  target: number;
  current: number;
  unit: string;
  reward: {
    xp: number;
    badge?: string;
  };
  startDate: string;
  endDate: string;
  completed: boolean;
  icon: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface ChallengeProgress {
  challengeId: string;
  userId: string;
  progress: number;
  lastUpdated: string;
  completed: boolean;
  completedAt?: string;
}

const STORAGE_KEYS = {
  ACTIVE_CHALLENGES: '@active_challenges',
  CHALLENGE_HISTORY: '@challenge_history',
  CHALLENGE_PROGRESS: '@challenge_progress',
};

// Predefined weekly challenges that rotate
const WEEKLY_CHALLENGES: Omit<Challenge, 'id' | 'startDate' | 'endDate' | 'current' | 'completed'>[] = [
  {
    title: 'Workout Warrior',
    description: 'Complete 5 workouts this week',
    type: 'weekly',
    category: 'workout',
    target: 5,
    unit: 'workouts',
    reward: { xp: 500, badge: 'warrior' },
    icon: 'dumbbell',
    difficulty: 'medium',
  },
  {
    title: 'Cardio Champion',
    description: 'Do 150 minutes of cardio this week',
    type: 'weekly',
    category: 'workout',
    target: 150,
    unit: 'minutes',
    reward: { xp: 400 },
    icon: 'run',
    difficulty: 'hard',
  },
  {
    title: 'Protein Power',
    description: 'Hit your protein goal every day this week',
    type: 'weekly',
    category: 'nutrition',
    target: 7,
    unit: 'days',
    reward: { xp: 350 },
    icon: 'food-steak',
    difficulty: 'medium',
  },
  {
    title: 'Step Master',
    description: 'Walk 70,000 steps this week',
    type: 'weekly',
    category: 'steps',
    target: 70000,
    unit: 'steps',
    reward: { xp: 300 },
    icon: 'walk',
    difficulty: 'easy',
  },
  {
    title: 'Hydration Hero',
    description: 'Drink 8 glasses of water daily for 7 days',
    type: 'weekly',
    category: 'water',
    target: 56,
    unit: 'glasses',
    reward: { xp: 250 },
    icon: 'water',
    difficulty: 'easy',
  },
  {
    title: 'Early Bird',
    description: 'Complete 3 morning workouts (before 9 AM)',
    type: 'weekly',
    category: 'workout',
    target: 3,
    unit: 'workouts',
    reward: { xp: 400, badge: 'early-bird' },
    icon: 'weather-sunset-up',
    difficulty: 'hard',
  },
  {
    title: 'Consistency King',
    description: 'Log your meals every day this week',
    type: 'weekly',
    category: 'nutrition',
    target: 7,
    unit: 'days',
    reward: { xp: 300 },
    icon: 'calendar-check',
    difficulty: 'easy',
  },
  {
    title: 'Strength Builder',
    description: 'Complete 3 strength training sessions',
    type: 'weekly',
    category: 'workout',
    target: 3,
    unit: 'sessions',
    reward: { xp: 350 },
    icon: 'weight-lifter',
    difficulty: 'medium',
  },
];

// Daily challenges
const DAILY_CHALLENGES: Omit<Challenge, 'id' | 'startDate' | 'endDate' | 'current' | 'completed'>[] = [
  {
    title: 'Morning Motivation',
    description: 'Complete a workout before noon',
    type: 'daily',
    category: 'workout',
    target: 1,
    unit: 'workout',
    reward: { xp: 100 },
    icon: 'white-balance-sunny',
    difficulty: 'easy',
  },
  {
    title: 'Perfect Nutrition',
    description: 'Stay within your calorie goal',
    type: 'daily',
    category: 'nutrition',
    target: 1,
    unit: 'day',
    reward: { xp: 80 },
    icon: 'food-apple',
    difficulty: 'medium',
  },
  {
    title: 'Step Goal',
    description: 'Walk 10,000 steps today',
    type: 'daily',
    category: 'steps',
    target: 10000,
    unit: 'steps',
    reward: { xp: 50 },
    icon: 'shoe-print',
    difficulty: 'easy',
  },
  {
    title: 'Hydration Check',
    description: 'Drink 8 glasses of water',
    type: 'daily',
    category: 'water',
    target: 8,
    unit: 'glasses',
    reward: { xp: 40 },
    icon: 'cup-water',
    difficulty: 'easy',
  },
  {
    title: 'Mindful Minutes',
    description: 'Do 10 minutes of stretching or meditation',
    type: 'daily',
    category: 'mindfulness',
    target: 10,
    unit: 'minutes',
    reward: { xp: 60 },
    icon: 'meditation',
    difficulty: 'easy',
  },
];

export const generateWeeklyChallenges = async (): Promise<Challenge[]> => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Start on Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Select 3 random weekly challenges
  const shuffled = [...WEEKLY_CHALLENGES].sort(() => Math.random() - 0.5);
  const selectedChallenges = shuffled.slice(0, 3);

  return selectedChallenges.map((challenge, index) => ({
    ...challenge,
    id: `weekly_${startOfWeek.getTime()}_${index}`,
    startDate: startOfWeek.toISOString(),
    endDate: endOfWeek.toISOString(),
    current: 0,
    completed: false,
  }));
};

export const generateDailyChallenges = async (): Promise<Challenge[]> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  // Select 2 random daily challenges
  const shuffled = [...DAILY_CHALLENGES].sort(() => Math.random() - 0.5);
  const selectedChallenges = shuffled.slice(0, 2);

  return selectedChallenges.map((challenge, index) => ({
    ...challenge,
    id: `daily_${today.getTime()}_${index}`,
    startDate: today.toISOString(),
    endDate: tomorrow.toISOString(),
    current: 0,
    completed: false,
  }));
};

export const getActiveChallenges = async (): Promise<Challenge[]> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_CHALLENGES);
    const challenges: Challenge[] = stored ? JSON.parse(stored) : [];

    const now = new Date();
    const activeChallenges = challenges.filter(
      c => new Date(c.endDate) > now && !c.completed
    );

    // Generate new challenges if needed
    const hasWeeklyChallenges = activeChallenges.some(c => c.type === 'weekly');
    const hasDailyChallenges = activeChallenges.some(c => c.type === 'daily');

    let newChallenges = [...activeChallenges];

    if (!hasWeeklyChallenges) {
      const weeklyChallenges = await generateWeeklyChallenges();
      newChallenges.push(...weeklyChallenges);
    }

    if (!hasDailyChallenges) {
      const dailyChallenges = await generateDailyChallenges();
      newChallenges.push(...dailyChallenges);
    }

    if (newChallenges.length !== activeChallenges.length) {
      await AsyncStorage.setItem(
        STORAGE_KEYS.ACTIVE_CHALLENGES,
        JSON.stringify(newChallenges)
      );
    }

    return newChallenges;
  } catch (error) {
    Alert.alert('Error', 'Failed to get active challenges. Please try again.');

    console.error('Failed to get active challenges:', error);
    return [];
  }
};

export const updateChallengeProgress = async (
  challengeId: string,
  progress: number
): Promise<void> => {
  try {
    const challenges = await getActiveChallenges();
    const challengeIndex = challenges.findIndex(c => c.id === challengeId);

    if (challengeIndex === -1) return;

    const challenge = challenges[challengeIndex];
    challenge.current = Math.min(progress, challenge.target);

    if (challenge.current >= challenge.target && !challenge.completed) {
      challenge.completed = true;
      
      // Award XP
      await addExperience(challenge.reward.xp);

      // Move to history
      const historyData = await AsyncStorage.getItem(STORAGE_KEYS.CHALLENGE_HISTORY);
      const history = historyData ? JSON.parse(historyData) : [];
      history.push({
        ...challenge,
        completedAt: new Date().toISOString(),
      });
      await AsyncStorage.setItem(
        STORAGE_KEYS.CHALLENGE_HISTORY,
        JSON.stringify(history)
      );
    }

    await AsyncStorage.setItem(
      STORAGE_KEYS.ACTIVE_CHALLENGES,
      JSON.stringify(challenges)
    );
  } catch (error) {
    Alert.alert('Error', 'Failed to update challenge progress. Please try again.');

    console.error('Failed to update challenge progress:', error);
  }
};

export const getChallengeHistory = async (): Promise<Challenge[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CHALLENGE_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    Alert.alert('Error', 'Failed to get challenge history. Please try again.');

    console.error('Failed to get challenge history:', error);
    return [];
  }
};

export const getChallengeStats = async () => {
  try {
    const history = await getChallengeHistory();
    const active = await getActiveChallenges();

    const totalCompleted = history.length;
    const totalActive = active.length;
    const totalXpEarned = history.reduce((sum, c) => sum + c.reward.xp, 0);

    const completionByCategory = history.reduce((acc: any, challenge) => {
      acc[challenge.category] = (acc[challenge.category] || 0) + 1;
      return acc;
    }, {});

    const currentStreak = calculateStreak(history);

    return {
      totalCompleted,
      totalActive,
      totalXpEarned,
      completionByCategory,
      currentStreak,
      completionRate: history.length > 0 
        ? Math.round((history.filter(c => c.completed).length / history.length) * 100)
        : 0,
    };
  } catch (error) {
    Alert.alert('Error', 'Failed to get challenge stats. Please try again.');

    console.error('Failed to get challenge stats:', error);
    return {
      totalCompleted: 0,
      totalActive: 0,
      totalXpEarned: 0,
      completionByCategory: {},
      currentStreak: 0,
      completionRate: 0,
    };
  }
};

const calculateStreak = (history: Challenge[]): number => {
  if (history.length === 0) return 0;

  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.completedAt || b.endDate).getTime() - 
             new Date(a.completedAt || a.endDate).getTime()
  );

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const challenge of sortedHistory) {
    const completedDate = new Date(challenge.completedAt || challenge.endDate);
    completedDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor(
      (currentDate.getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= 1) {
      streak++;
      currentDate = completedDate;
    } else {
      break;
    }
  }

  return streak;
};