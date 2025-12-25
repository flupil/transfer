import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getStreakData, getUserLevel, getWorkoutHistory } from '../services/progressTrackingService';
import { getFriends, getFriendLeaderboard } from '../services/friendStreakService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BRAND_COLORS } from '../constants/brandColors';

const { width } = Dimensions.get('window');

const StreakScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'personal' | 'friends'>('personal');
  const [currentStreak, setCurrentStreak] = useState(0);
  const [hasWorkedOutToday, setHasWorkedOutToday] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(new Set());
  const [availableFreezes, setAvailableFreezes] = useState(0);
  const [friends, setFriends] = useState<any[]>([]);

  useEffect(() => {
    loadStreakData();
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const friendsList = await getFriendLeaderboard();
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadStreakData = async () => {
    try {
      const streakData = await getStreakData();
      setCurrentStreak(streakData.workoutStreak);
      setHasWorkedOutToday(!!streakData.lastWorkoutDate && new Date(streakData.lastWorkoutDate).toDateString() === new Date().toDateString());
      setAvailableFreezes(streakData.availableFreezes || 0);

      // Load workout history to show on calendar
      const workoutHistory = await getWorkoutHistory();
      const dates = new Set<string>();
      workoutHistory.forEach(workout => {
        const date = new Date(workout.date);
        dates.add(date.toDateString());
      });

      // Also check completedWorkouts from AsyncStorage
      const stored = await AsyncStorage.getItem('completedWorkouts');
      if (stored) {
        const completedArray = JSON.parse(stored);
        // These are in format like "1-0", "1-1", etc. for week-day pairs
        // We need to mark dates when workouts were completed
        // For now, just use the workout history
      }

      setWorkoutDates(dates);
    } catch (error) {
      console.error('Error loading streak data:', error);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const isWorkoutDay = (day: number | null) => {
    if (!day) return false;

    // Create date for the selected day in the selected month
    const checkDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    const checkDateString = checkDate.toDateString();

    // Check if this date exists in the workout dates set
    return workoutDates.has(checkDateString);
  };

  const renderCalendarDay = (day: number | null, index: number) => {
    if (!day) {
      return <View key={`empty-${index}`} style={styles.emptyDay} />;
    }

    const isToday = day === new Date().getDate() &&
                    selectedMonth.getMonth() === new Date().getMonth();
    const hasWorkout = isWorkoutDay(day);

    return (
      <TouchableOpacity
        key={`day-${selectedMonth.getFullYear()}-${selectedMonth.getMonth()}-${day}`}
        style={[
          styles.calendarDay,
          hasWorkout && styles.workoutDay,
          isToday && styles.today,
        ]}
        disabled
      >
        <Text style={[
          styles.dayText,
          hasWorkout && styles.workoutDayText,
          isToday && styles.todayText,
          { color: hasWorkout || isToday ? 'white' : colors.text }
        ]}>
          {day}
        </Text>
        {hasWorkout && (
          <MaterialCommunityIcons
            name="fire"
            size={12}
            color="#FF6B35"
            style={styles.fireIcon}
          />
        )}
      </TouchableOpacity>
    );
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(selectedMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setSelectedMonth(newMonth);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#2A2A2A' }]}>
      <View style={[styles.header, { backgroundColor: '#4A4A4A', marginTop: 20 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={30} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: '#F4F1EF' }]}>Streak</Text>
        <TouchableOpacity>
          <Ionicons name="share-outline" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: '#4A4A4A' }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'personal' && styles.activeTab]}
          onPress={() => setActiveTab('personal')}
        >
          <Text style={[styles.tabText, activeTab === 'personal' && styles.activeTabText]}>
            PERSONAL
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
          onPress={() => setActiveTab('friends')}
        >
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
            FRIENDS
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'personal' ? (
          <>
            {/* Streak Society Card */}
            <View style={[styles.streakCard, {
              backgroundColor: '#4A4A4A',
              borderWidth: 2,
              borderColor: isDark ? '#2a2a2a' : '#e5e5e5'
            }]}>
              <View style={[styles.streakBadge, { backgroundColor: isDark ? '#3a3a3a' : '#f0f0f0' }]}>
                <Text style={[styles.streakBadgeText, { color: '#F4F1EF' }]}>STREAK SOCIETY</Text>
              </View>
              <View style={styles.streakInfo}>
                <Text style={[styles.streakNumber, { color: '#F4F1EF' }]}>{currentStreak}</Text>
                <Text style={[styles.streakLabel, { color: '#F4F1EF' }]}>day streak!</Text>
                <View style={styles.fireContainer}>
                  <MaterialCommunityIcons name="fire" size={120} color={BRAND_COLORS.accent} />
                </View>
              </View>

              {!hasWorkedOutToday && (
                <View style={[styles.lessonPrompt, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]}>
                  <View style={styles.clockIcon}>
                    <MaterialCommunityIcons name="clock-outline" size={40} color="#FF9500" />
                  </View>
                  <Text style={[styles.lessonText, { color: '#F4F1EF' }]}>
                    Do a workout today to extend your streak!
                  </Text>
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => navigation.navigate('Workout' as never)}
                  >
                    <Text style={styles.startButtonText}>START WORKOUT</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Streak Calendar */}
            <View style={styles.calendarSection}>
              <Text style={[styles.sectionTitle, { color: '#F4F1EF' }]}>Streak Calendar</Text>
              <View style={[styles.calendarCard, {
                backgroundColor: '#4A4A4A',
                borderWidth: 2,
                borderColor: isDark ? '#2a2a2a' : '#e5e5e5'
              }]}>
                <View style={styles.monthSelector}>
                  <TouchableOpacity onPress={() => changeMonth('prev')}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.monthText, { color: '#F4F1EF' }]}>
                    {selectedMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Text>
                  <TouchableOpacity onPress={() => changeMonth('next')}>
                    <Ionicons name="chevron-forward" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.weekDays}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                    <Text key={day} style={styles.weekDayText}>{day}</Text>
                  ))}
                </View>

                <View style={styles.calendar}>
                  {getDaysInMonth(selectedMonth).map((day, index) => renderCalendarDay(day, index))}
                </View>
              </View>
            </View>

            {/* Streak Goal */}
            <View style={styles.goalSection}>
              <Text style={[styles.sectionTitle, { color: '#F4F1EF' }]}>Streak Goal</Text>
              <View style={[styles.goalCard, {
                backgroundColor: '#4A4A4A',
                borderWidth: 2,
                borderColor: isDark ? '#2a2a2a' : '#e5e5e5'
              }]}>
                <View style={styles.goalProgress}>
                  <View style={styles.goalMilestones}>
                    <View style={[styles.milestone, styles.milestoneReached]}>
                      <MaterialCommunityIcons name="check" size={20} color="white" />
                    </View>
                    <View style={styles.progressLine}>
                      <View style={[styles.progressFill, { width: `${Math.min((currentStreak / 30) * 100, 100)}%` }]} />
                    </View>
                    <View style={[styles.milestone, currentStreak >= 30 && styles.milestoneReached]}>
                      <Text style={styles.milestoneText}>30</Text>
                    </View>
                    <View style={styles.progressLine}>
                      <View style={[styles.progressFill, { width: `${Math.max(0, Math.min((currentStreak - 30) / 30, 1) * 100)}%` }]} />
                    </View>
                    <View style={[styles.milestone, currentStreak >= 60 && styles.milestoneReached]}>
                      <Text style={styles.milestoneText}>60</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.goalText}>{currentStreak} / 60 DAYS</Text>
              </View>
            </View>

            {/* Streak Society Benefits */}
            <View style={styles.societySection}>
              <Text style={[styles.sectionTitle, { color: '#F4F1EF' }]}>Streak Society</Text>

              <View style={[styles.benefitCard, {
                backgroundColor: '#4A4A4A',
                borderWidth: 2,
                borderColor: isDark ? '#2a2a2a' : '#e5e5e5'
              }]}>
                <View style={styles.benefitIcon}>
                  <MaterialCommunityIcons name="snowflake" size={40} color="#4FC3F7" />
                </View>
                <View style={styles.benefitInfo}>
                  <Text style={[styles.benefitTitle, { color: '#F4F1EF' }]}>
                    {availableFreezes} {availableFreezes === 1 ? 'Freeze' : 'Freezes'} Available
                  </Text>
                  <Text style={[styles.benefitDescription, { color: '#F4F1EF' }]}>
                    Automatically protects your streak if you miss a workout day.
                  </Text>
                  <Text style={styles.refillText}>
                    {currentStreak > 0 ? `NEXT IN ${7 - (currentStreak % 7)} DAYS` : 'EARN BY BUILDING STREAK'}
                  </Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.friendsTab}>
            {friends.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { color: '#F4F1EF', marginBottom: 20 }]}>Friend Leaderboard</Text>
                {friends.map((friend, index) => (
                  <View
                    key={friend.id}
                    style={[styles.friendCard, {
                      backgroundColor: '#4A4A4A',
                      borderWidth: 2,
                      borderColor: isDark ? '#2a2a2a' : '#e5e5e5'
                    }]}
                  >
                    <View style={styles.friendRank}>
                      <Text style={[styles.rankNumber, { color: index === 0 ? '#FFD700' : colors.text }]}>
                        #{index + 1}
                      </Text>
                    </View>
                    <View style={styles.friendAvatar}>
                      <Text style={styles.avatarEmoji}>{friend.avatar}</Text>
                    </View>
                    <View style={styles.friendInfo}>
                      <Text style={[styles.friendName, { color: '#F4F1EF' }]}>{friend.name}</Text>
                      <View style={styles.friendStats}>
                        <MaterialCommunityIcons name="fire" size={16} color={BRAND_COLORS.accent} />
                        <Text style={[styles.friendStreak, { color: '#F4F1EF' }]}>{friend.streak} day streak</Text>
                      </View>
                    </View>
                    <View style={styles.friendXP}>
                      <MaterialCommunityIcons name="diamond" size={20} color="#1CB0F6" />
                      <Text style={[styles.xpText, { color: '#F4F1EF' }]}>{friend.xp}</Text>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={styles.inviteButton}>
                  <Text style={styles.inviteButtonText}>INVITE MORE FRIENDS</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="account-group" size={100} color="#666" />
                <Text style={[styles.noFriendsText, { color: '#F4F1EF' }]}>Connect with friends to see their streaks!</Text>
                <TouchableOpacity style={styles.inviteButton}>
                  <Text style={styles.inviteButtonText}>INVITE FRIENDS</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingBottom: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#1CB0F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#1CB0F6',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  streakCard: {
    borderRadius: 25,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  streakBadge: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  streakBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  streakInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  streakNumber: {
    fontSize: 80,
    fontWeight: 'bold',
    color: 'white',
  },
  streakLabel: {
    fontSize: 24,
    color: '#999',
    marginTop: -10,
  },
  fireContainer: {
    position: 'absolute',
    right: -60,
    top: -20,
    opacity: 0.3,
  },
  lessonPrompt: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 15,
    width: '100%',
    marginTop: 10,
  },
  clockIcon: {
    marginBottom: 10,
  },
  lessonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  startButton: {
    backgroundColor: '#1CB0F6',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  calendarSection: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  calendarCard: {
    borderRadius: 25,
    padding: 20,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  weekDayText: {
    color: '#666',
    fontSize: 14,
    width: (width - 80) / 7,
    textAlign: 'center',
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: (width - 80) / 7,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  emptyDay: {
    width: (width - 80) / 7,
    height: 40,
  },
  dayText: {
    color: '#666',
    fontSize: 16,
  },
  workoutDay: {
    backgroundColor: '#FF9500',
    borderRadius: 20,
  },
  workoutDayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  today: {
    borderWidth: 2,
    borderColor: '#FF9500',
    borderRadius: 20,
  },
  todayText: {
    color: 'white',
    fontWeight: 'bold',
  },
  fireIcon: {
    position: 'absolute',
    top: -5,
    right: -5,
  },
  goalSection: {
    marginBottom: 15,
  },
  goalCard: {
    borderRadius: 25,
    padding: 20,
  },
  goalProgress: {
    marginBottom: 15,
  },
  goalMilestones: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  milestone: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#3a3a3a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneReached: {
    backgroundColor: '#FF9500',
  },
  milestoneText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressLine: {
    flex: 1,
    height: 4,
    backgroundColor: '#3a3a3a',
    marginHorizontal: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF9500',
  },
  goalText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
  },
  societySection: {
    marginBottom: 15,
  },
  benefitCard: {
    borderRadius: 25,
    padding: 20,
    flexDirection: 'row',
    marginBottom: 15,
  },
  benefitIcon: {
    marginRight: 15,
  },
  benefitInfo: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  benefitDescription: {
    fontSize: 14,
    color: '#999',
    marginBottom: 10,
  },
  refillText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  friendsTab: {
    flex: 1,
    paddingTop: 20,
  },
  noFriendsText: {
    color: '#999',
    fontSize: 16,
    marginTop: 20,
    marginBottom: 30,
    textAlign: 'center',
  },
  inviteButton: {
    backgroundColor: '#1CB0F6',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
    alignSelf: 'center',
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 20,
    marginBottom: 12,
  },
  friendRank: {
    width: 40,
    alignItems: 'center',
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  friendStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  friendStreak: {
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
  },
  friendXP: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  xpText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default StreakScreen;