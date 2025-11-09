import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { translate } from '../contexts/LanguageContext';

export interface Friend {
  id: string;
  name: string;
  avatar?: string;
  streak: number;
  lastActivity?: string;
  totalWorkouts?: number;
  xp?: number;
}

export interface FriendStreak {
  friendId: string;
  streakCount: number;
  lastInteraction: string;
  sharedWorkouts: string[];
  nudgesLeft: number;
  nudgesSent: number;
}

export interface StreakActivity {
  id: string;
  type: 'workout' | 'challenge' | 'nudge';
  friendId: string;
  timestamp: string;
  details?: any;
}

const STORAGE_KEYS = {
  FRIENDS_LIST: '@friends_list',
  FRIEND_STREAKS: '@friend_streaks',
  STREAK_ACTIVITIES: '@streak_activities',
  PENDING_NUDGES: '@pending_nudges',
};

class FriendStreakService {
  // Get all friends
  async getFriends(): Promise<Friend[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FRIENDS_LIST);
      if (!data) {
        // Return mock friends for demo
        return this.getMockFriends();
      }
      return JSON.parse(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to get friends. Please try again.');

      console.error('Failed to get friends:', error);
      return this.getMockFriends();
    }
  }

  // Get mock friends for demo
  private getMockFriends(): Friend[] {
    return [
      {
        id: '1',
        name: 'Zari',
        avatar: '👩‍💻',
        streak: 266,
        lastActivity: new Date().toISOString(),
        totalWorkouts: 450,
        xp: 15420,
      },
      {
        id: '2',
        name: 'Luis',
        avatar: '👨',
        streak: 149,
        lastActivity: new Date().toISOString(),
        totalWorkouts: 312,
        xp: 12300,
      },
      {
        id: '3',
        name: 'Cem',
        avatar: '🧔',
        streak: 128,
        lastActivity: new Date(Date.now() - 86400000).toISOString(),
        totalWorkouts: 289,
        xp: 10500,
      },
      {
        id: '4',
        name: 'Hexi',
        avatar: '👩',
        streak: 123,
        lastActivity: new Date().toISOString(),
        totalWorkouts: 245,
        xp: 9800,
      },
      {
        id: '5',
        name: 'Lily',
        avatar: '👱‍♀️',
        streak: 114,
        lastActivity: new Date(Date.now() - 7200000).toISOString(),
        totalWorkouts: 198,
        xp: 8900,
      },
    ];
  }

  // Add a new friend
  async addFriend(friend: Friend): Promise<void> {
    try {
      const friends = await this.getFriends();
      friends.push(friend);
      await AsyncStorage.setItem(STORAGE_KEYS.FRIENDS_LIST, JSON.stringify(friends));
    } catch (error) {
      Alert.alert('Error', 'Failed to add friend. Please try again.');

      console.error('Failed to add friend:', error);
    }
  }

  // Get friend streaks
  async getFriendStreaks(): Promise<FriendStreak[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FRIEND_STREAKS);
      if (!data) {
        return this.initializeFriendStreaks();
      }
      return JSON.parse(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to get friend streaks. Please try again.');

      console.error('Failed to get friend streaks:', error);
      return [];
    }
  }

  // Initialize friend streaks
  private async initializeFriendStreaks(): Promise<FriendStreak[]> {
    const friends = await this.getFriends();
    const streaks = friends.map(friend => ({
      friendId: friend.id,
      streakCount: Math.floor(Math.random() * 30), // Random initial streaks
      lastInteraction: new Date().toISOString(),
      sharedWorkouts: [],
      nudgesLeft: 3,
      nudgesSent: 0,
    }));

    await AsyncStorage.setItem(STORAGE_KEYS.FRIEND_STREAKS, JSON.stringify(streaks));
    return streaks;
  }

  // Update friend streak when you both complete workouts
  async updateFriendStreak(friendId: string, workoutId: string): Promise<number> {
    try {
      const streaks = await this.getFriendStreaks();
      const streakIndex = streaks.findIndex(s => s.friendId === friendId);

      if (streakIndex === -1) {
        // Create new streak
        const newStreak: FriendStreak = {
          friendId,
          streakCount: 1,
          lastInteraction: new Date().toISOString(),
          sharedWorkouts: [workoutId],
          nudgesLeft: 3,
          nudgesSent: 0,
        };
        streaks.push(newStreak);
      } else {
        const streak = streaks[streakIndex];
        const lastInteraction = new Date(streak.lastInteraction);
        const today = new Date();
        const daysDiff = Math.floor(
          (today.getTime() - lastInteraction.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff === 1) {
          // Consecutive day - extend streak
          streak.streakCount++;
        } else if (daysDiff > 1) {
          // Streak broken - reset
          streak.streakCount = 1;
        }
        // Same day - don't increment

        streak.lastInteraction = today.toISOString();
        streak.sharedWorkouts.push(workoutId);
        streaks[streakIndex] = streak;
      }

      await AsyncStorage.setItem(STORAGE_KEYS.FRIEND_STREAKS, JSON.stringify(streaks));

      // Record activity
      await this.recordActivity({
        id: `activity_${Date.now()}`,
        type: 'workout',
        friendId,
        timestamp: new Date().toISOString(),
        details: { workoutId },
      });

      return streaks.find(s => s.friendId === friendId)?.streakCount || 0;
    } catch (error) {
      Alert.alert('Error', 'Failed to update friend streak. Please try again.');

      console.error('Failed to update friend streak:', error);
      return 0;
    }
  }

  // Send a nudge to a friend
  async sendNudge(friendId: string): Promise<boolean> {
    try {
      const streaks = await this.getFriendStreaks();
      const streakIndex = streaks.findIndex(s => s.friendId === friendId);

      if (streakIndex === -1) return false;

      const streak = streaks[streakIndex];
      if (streak.nudgesLeft <= 0) return false;

      streak.nudgesLeft--;
      streak.nudgesSent++;
      streaks[streakIndex] = streak;

      await AsyncStorage.setItem(STORAGE_KEYS.FRIEND_STREAKS, JSON.stringify(streaks));

      // Record nudge activity
      await this.recordActivity({
        id: `nudge_${Date.now()}`,
        type: 'nudge',
        friendId,
        timestamp: new Date().toISOString(),
      });

      // Store pending nudge for the friend
      const pendingNudges = await this.getPendingNudges();
      pendingNudges[friendId] = (pendingNudges[friendId] || 0) + 1;
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_NUDGES, JSON.stringify(pendingNudges));

      return true;
    } catch (error) {
      Alert.alert('Error', 'Failed to send nudge. Please try again.');

      console.error('Failed to send nudge:', error);
      return false;
    }
  }

  // Get pending nudges received
  async getPendingNudges(): Promise<{ [friendId: string]: number }> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_NUDGES);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      Alert.alert('Error', 'Failed to get pending nudges. Please try again.');

      console.error('Failed to get pending nudges:', error);
      return {};
    }
  }

  // Clear nudges for a friend after responding
  async clearNudges(friendId: string): Promise<void> {
    try {
      const pendingNudges = await this.getPendingNudges();
      delete pendingNudges[friendId];
      await AsyncStorage.setItem(STORAGE_KEYS.PENDING_NUDGES, JSON.stringify(pendingNudges));
    } catch (error) {
      Alert.alert('Error', 'Failed to clear nudges. Please try again.');

      console.error('Failed to clear nudges:', error);
    }
  }

  // Record activity
  private async recordActivity(activity: StreakActivity): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_ACTIVITIES);
      const activities = data ? JSON.parse(data) : [];
      activities.push(activity);

      // Keep only last 100 activities
      if (activities.length > 100) {
        activities.splice(0, activities.length - 100);
      }

      await AsyncStorage.setItem(STORAGE_KEYS.STREAK_ACTIVITIES, JSON.stringify(activities));
    } catch (error) {
      Alert.alert('Error', 'Failed to record activity. Please try again.');

      console.error('Failed to record activity:', error);
    }
  }

  // Get recent activities
  async getRecentActivities(limit: number = 20): Promise<StreakActivity[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_ACTIVITIES);
      const activities = data ? JSON.parse(data) : [];
      return activities.slice(-limit).reverse();
    } catch (error) {
      Alert.alert('Error', 'Failed to get activities. Please try again.');

      console.error('Failed to get activities:', error);
      return [];
    }
  }

  // Check if friends are active today
  async checkFriendsActiveToday(): Promise<string[]> {
    try {
      const friends = await this.getFriends();
      const today = new Date().toDateString();

      return friends
        .filter(friend => {
          if (!friend.lastActivity) return false;
          const activityDate = new Date(friend.lastActivity).toDateString();
          return activityDate === today;
        })
        .map(friend => friend.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to check active friends. Please try again.');

      console.error('Failed to check active friends:', error);
      return [];
    }
  }

  // Get leaderboard
  async getFriendLeaderboard(): Promise<Friend[]> {
    try {
      const friends = await this.getFriends();
      return friends.sort((a, b) => b.streak - a.streak);
    } catch (error) {
      Alert.alert('Error', 'Failed to get leaderboard. Please try again.');

      console.error('Failed to get leaderboard:', error);
      return [];
    }
  }

  // Reset daily nudges
  async resetDailyNudges(): Promise<void> {
    try {
      const streaks = await this.getFriendStreaks();
      streaks.forEach(streak => {
        streak.nudgesLeft = 3;
        streak.nudgesSent = 0;
      });
      await AsyncStorage.setItem(STORAGE_KEYS.FRIEND_STREAKS, JSON.stringify(streaks));
    } catch (error) {
      Alert.alert('Error', 'Failed to reset nudges. Please try again.');

      console.error('Failed to reset nudges:', error);
    }
  }

  // Get friend by ID
  async getFriendById(friendId: string): Promise<Friend | null> {
    try {
      const friends = await this.getFriends();
      return friends.find(f => f.id === friendId) || null;
    } catch (error) {
      Alert.alert('Error', 'Failed to get friend. Please try again.');

      console.error('Failed to get friend:', error);
      return null;
    }
  }

  // Update friend activity
  async updateFriendActivity(friendId: string): Promise<void> {
    try {
      const friends = await this.getFriends();
      const friendIndex = friends.findIndex(f => f.id === friendId);

      if (friendIndex !== -1) {
        friends[friendIndex].lastActivity = new Date().toISOString();
        if (friends[friendIndex].totalWorkouts) {
          friends[friendIndex].totalWorkouts!++;
        }
        await AsyncStorage.setItem(STORAGE_KEYS.FRIENDS_LIST, JSON.stringify(friends));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update friend activity. Please try again.');

      console.error('Failed to update friend activity:', error);
    }
  }
}

// Create singleton instance
const friendStreakService = new FriendStreakService();

// Export functions
export const getFriends = () => friendStreakService.getFriends();
export const addFriend = (friend: Friend) => friendStreakService.addFriend(friend);
export const getFriendStreaks = () => friendStreakService.getFriendStreaks();
export const updateFriendStreak = (friendId: string, workoutId: string) =>
  friendStreakService.updateFriendStreak(friendId, workoutId);
export const sendNudge = (friendId: string) => friendStreakService.sendNudge(friendId);
export const getPendingNudges = () => friendStreakService.getPendingNudges();
export const clearNudges = (friendId: string) => friendStreakService.clearNudges(friendId);
export const getRecentActivities = (limit?: number) =>
  friendStreakService.getRecentActivities(limit);
export const checkFriendsActiveToday = () => friendStreakService.checkFriendsActiveToday();
export const getFriendLeaderboard = () => friendStreakService.getFriendLeaderboard();
export const resetDailyNudges = () => friendStreakService.resetDailyNudges();
export const getFriendById = (friendId: string) => friendStreakService.getFriendById(friendId);
export const updateFriendActivity = (friendId: string) =>
  friendStreakService.updateFriendActivity(friendId);

export default friendStreakService;