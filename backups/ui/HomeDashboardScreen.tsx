import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { firebaseDailyDataService, DailyData } from '../services/firebaseDailyDataService';
import { waterTrackingService } from '../services/waterTrackingService';
import { workoutService } from '../services/workoutService';
import { getSelectedWorkoutPlan } from '../services/workoutPlanService';
import { getStreakData, StreakData } from '../services/progressTrackingService';
import { getFriends } from '../services/friendStreakService';

// Helper type for water tracking snapshot
type WaterSnapshot = Awaited<ReturnType<typeof waterTrackingService.getTodayData>>;

interface QuickAction {
  icon: string;
  label: string;
  colors: [string, string];
  onPress: () => Promise<void> | void;
}

const HomeDashboardScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const [dailyData, setDailyData] = useState<DailyData | null>(null);
  const [waterData, setWaterData] = useState<WaterSnapshot | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [friends, setFriends] = useState<any[]>([]);
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const [hasWorkedOutToday, setHasWorkedOutToday] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  const loadDashboard = useCallback(async () => {
    if (!user?.id) {
      return;
    }

    setLoading(true);
    workoutService.setUserId(user.id);
    waterTrackingService.setUserId(user.id);

    try {
      const [daily, water, streak, friendList] = await Promise.all([
        firebaseDailyDataService.getTodayData(user.id),
        waterTrackingService.getTodayData(),
        getStreakData(),
        getFriends().catch(() => []),
      ]);

      setDailyData(daily);
      setWaterData(water);
      setStreakData(streak);
      setFriends(friendList.slice(0, 3));

      const selectedPlan = await getSelectedWorkoutPlan();
      if (selectedPlan && selectedPlan.workouts?.length) {
        const workoutsWithExercises = selectedPlan.workouts.filter((day: any) => day.exercises && day.exercises.length > 0);
        if (workoutsWithExercises.length) {
          const todayIndex = new Date().getDay() % workoutsWithExercises.length;
          setTodayWorkout(workoutsWithExercises[todayIndex]);
        }
      } else {
        setTodayWorkout(null);
      }

      const history = await workoutService.getWorkoutHistory(user.id, 1);
      if (history.length > 0) {
        const lastWorkoutDate = new Date(history[0].date).toDateString();
        setHasWorkedOutToday(lastWorkoutDate === new Date().toDateString());
      } else {
        setHasWorkedOutToday(false);
      }
    } catch (error) {
      console.error('Failed to load dashboard summary:', error);
      Alert.alert('Error', 'Unable to load your dashboard right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboard();
    setRefreshing(false);
  }, [loadDashboard]);

  const handleAddWater = useCallback(async () => {
    if (!user?.id) return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await waterTrackingService.addWater(250);
      const updatedWater = await waterTrackingService.getTodayData();
      setWaterData(updatedWater);
    } catch (error) {
      Alert.alert('Error', 'Could not log water right now.');
      console.error('Quick water log failed:', error);
    }
  }, [user?.id]);

  const quickActions: QuickAction[] = useMemo(() => [
    {
      icon: 'dumbbell',
      label: hasWorkedOutToday ? 'Review Workout' : 'Start Workout',
      colors: ['#f56565', '#e53e3e'],
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate('Workout');
      },
    },
    {
      icon: 'food-apple',
      label: 'Add Food',
      colors: ['#48bb78', '#38a169'],
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate('Nutrition');
      },
    },
    {
      icon: 'cup-water',
      label: 'Log Water',
      colors: ['#4299e1', '#3182ce'],
      onPress: handleAddWater,
    },
    {
      icon: 'calendar-check',
      label: 'Schedule',
      colors: ['#ed8936', '#dd6b20'],
      onPress: () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        navigation.navigate('Calendar');
      },
    },
  ], [handleAddWater, hasWorkedOutToday, navigation]);

  const macroProgress = useMemo(() => {
    if (!dailyData) return [];
    return [
      { label: 'Calories', consumed: dailyData.calories.consumed, target: dailyData.calories.target, color: '#667eea' },
      { label: 'Protein', consumed: dailyData.protein.consumed, target: dailyData.protein.target, color: '#f56565', unit: 'g' },
      { label: 'Carbs', consumed: dailyData.carbs.consumed, target: dailyData.carbs.target, color: '#48bb78', unit: 'g' },
      { label: 'Fat', consumed: dailyData.fat.consumed, target: dailyData.fat.target, color: '#ed8936', unit: 'g' },
    ];
  }, [dailyData]);

  const streakSummary = useMemo(() => {
    if (!streakData) {
      return [
        { icon: 'fire', label: 'Workout Streak', value: '0 days' },
        { icon: 'silverware', label: 'Nutrition Streak', value: '0 days' },
      ];
    }

    return [
      { icon: 'fire', label: 'Workout Streak', value: `${streakData.workoutStreak} days` },
      { icon: 'silverware', label: 'Nutrition Streak', value: `${streakData.nutritionStreak} days` },
    ];
  }, [streakData]);

  const renderMacroBar = (item: typeof macroProgress[number]) => {
    const percent = item.target ? Math.min(100, Math.round((item.consumed / item.target) * 100)) : 0;
    return (
      <View key={item.label} style={styles.macroRow}>
        <View style={styles.macroLabelRow}>
          <Text style={styles.macroLabel}>{item.label}</Text>
          <Text style={styles.macroValue}>
            {Math.round(item.consumed)}
            {item.unit ?? ''} / {Math.round(item.target)}{item.unit ?? ''}
          </Text>
        </View>
        <View style={styles.macroBarBackground}>
          <View style={[styles.macroBarFill, { width: `${percent}%`, backgroundColor: item.color }]} />
        </View>
      </View>
    );
  };

  const renderFriendCard = (friend: any, index: number) => (
    <View key={friend.id ?? index} style={styles.friendCard}>
      <View style={styles.friendAvatar}>
        <MaterialCommunityIcons name="account" size={20} color="#fff" />
      </View>
      <View style={styles.friendInfo}>
        <Text style={styles.friendName}>{friend.name ?? 'Training Buddy'}</Text>
        <Text style={styles.friendStreak}>{friend.streak ? `${friend.streak} day streak` : 'Cheering you on!'}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#cbd5e1" />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <LinearGradient
          colors={isDark ? ['#2a2f45', '#1f2335'] : ['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.userName}>{user?.name ?? 'Athlete'}</Text>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <MaterialCommunityIcons name="account" size={28} color="#667eea" />
            </TouchableOpacity>
          </View>

          <View style={styles.streakRow}>
            {streakSummary.map((streak) => (
              <View key={streak.label} style={styles.streakCard}>
                <MaterialCommunityIcons name={streak.icon as any} size={24} color="#FFD700" />
                <Text style={styles.streakLabel}>{streak.label}</Text>
                <Text style={styles.streakValue}>{streak.value}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Today's Plan</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Calendar')}>
                <Text style={styles.linkText}>View schedule</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.planSection}>
              <View style={styles.planIcon}>
                <Ionicons name="barbell" size={24} color="#fff" />
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>
                  {todayWorkout?.name ?? 'Your next workout'}
                </Text>
                <Text style={styles.planSubtitle}>
                  {todayWorkout
                    ? `${todayWorkout.focusArea ?? ''} • ${todayWorkout.duration ?? `${todayWorkout.exercises?.length ?? 0} exercises`}`
                    : 'No workout assigned today'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.planCTA}
                onPress={() => navigation.navigate('Workout')}
              >
                <Text style={styles.planCTALabel}>{hasWorkedOutToday ? 'Review' : 'Start'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.planSection}>
              <View style={[styles.planIcon, { backgroundColor: '#48bb78' }]}>
                <MaterialCommunityIcons name="food-apple" size={24} color="#fff" />
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>Nutrition Targets</Text>
                <Text style={styles.planSubtitle}>
                  {dailyData
                    ? `${Math.round(dailyData.calories.consumed)} / ${Math.round(dailyData.calories.target)} kcal`
                    : 'Loading...'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.planCTA}
                onPress={() => navigation.navigate('Nutrition')}
              >
                <Text style={styles.planCTALabel}>Log</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.planSection}>
              <View style={[styles.planIcon, { backgroundColor: '#4299e1' }]}>
                <MaterialCommunityIcons name="cup-water" size={24} color="#fff" />
              </View>
              <View style={styles.planInfo}>
                <Text style={styles.planTitle}>Hydration</Text>
                <Text style={styles.planSubtitle}>
                  {waterData
                    ? `${Math.round(waterData.consumed)} ml / ${waterData.target} ml`
                    : 'Keep sipping!'}
                </Text>
              </View>
              <TouchableOpacity style={styles.planCTA} onPress={handleAddWater}>
                <Text style={styles.planCTALabel}>+250</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsRow}>
              {quickActions.map(({ icon, label, colors: gradientColors, onPress }) => (
                <TouchableOpacity key={label} style={styles.actionButton} onPress={onPress}>
                  <LinearGradient colors={gradientColors} style={styles.actionGradient}>
                    <MaterialCommunityIcons name={icon as any} size={28} color="#fff" />
                    <Text style={styles.actionLabel}>{label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Macros Overview</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Nutrition')}>
                <Text style={styles.linkText}>View diary</Text>
              </TouchableOpacity>
            </View>
            <View>
              {macroProgress.map(renderMacroBar)}
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.card, styles.smallCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Steps</Text>
              </View>
              <Text style={styles.highlightText}>
                {dailyData?.steps.count ?? 0}
              </Text>
              <Text style={styles.subtitleText}>
                of {dailyData?.steps.target ?? 10000} goal
              </Text>
            </View>

            <View style={[styles.card, styles.smallCard]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Workouts</Text>
              </View>
              <Text style={styles.highlightText}>
                {dailyData?.workoutsCompleted ?? 0}
              </Text>
              <Text style={styles.subtitleText}>
                completed today
              </Text>
            </View>
          </View>

          {friends.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Accountability Crew</Text>
              <Text style={styles.subtitleText}>Keep each other on track!</Text>
              <View style={styles.friendList}>
                {friends.map(renderFriendCard)}
              </View>
            </View>
          )}

          <TouchableOpacity
            style={styles.coachCTA}
            onPress={() => navigation.navigate('Progress')}
          >
            <View>
              <Text style={styles.coachTitle}>Coach Feedback</Text>
              <Text style={styles.coachSubtitle}>
                Share today’s wins and challenges in your progress log.
              </Text>
            </View>
            <MaterialCommunityIcons name="arrow-right" size={22} color="#1f2933" />
          </TouchableOpacity>
        </View>
      </ScrollView>
      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Updating your plan...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    marginBottom: 4,
  },
  userName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
  },
  profileButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  streakRow: {
    flexDirection: 'row',
    marginTop: 24,
    justifyContent: 'space-between',
  },
  streakCard: {
    flex: 1,
    marginHorizontal: 4,
    padding: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  streakLabel: {
    color: '#fff',
    marginTop: 12,
    fontSize: 12,
    opacity: 0.85,
  },
  streakValue: {
    color: '#fff',
    fontWeight: '600',
    marginTop: 6,
    fontSize: 16,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 18,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2933',
  },
  linkText: {
    color: '#667eea',
    fontSize: 13,
    fontWeight: '600',
  },
  planSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#f56565',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2933',
  },
  planSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  planCTA: {
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  planCTALabel: {
    color: '#4c51bf',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2933',
    marginBottom: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
  },
  actionLabel: {
    color: '#fff',
    marginTop: 10,
    fontWeight: '600',
    fontSize: 14,
  },
  macroRow: {
    marginBottom: 14,
  },
  macroLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  macroLabel: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 14,
  },
  macroValue: {
    color: '#475569',
    fontSize: 13,
  },
  macroBarBackground: {
    backgroundColor: '#e2e8f0',
    height: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallCard: {
    flex: 1,
    marginBottom: 18,
    marginHorizontal: 4,
  },
  highlightText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1f2933',
  },
  subtitleText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
  },
  friendList: {
    marginTop: 12,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  friendAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1f2933',
  },
  friendStreak: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  coachCTA: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    borderRadius: 18,
    padding: 18,
    marginBottom: 30,
  },
  coachTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2933',
  },
  coachSubtitle: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
  },
  loadingOverlay: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: '#1f2933',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default HomeDashboardScreen;
