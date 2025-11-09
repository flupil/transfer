import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseDailyDataService from '../../services/firebaseDailyDataService';
import { getUserLevel, getStreakData } from '../../services/progressTrackingService';

const { width } = Dimensions.get('window');

const FootballHomeScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);

  // Animation states
  const scrollY = useRef(new Animated.Value(0)).current;

  // Nutrition data
  const [calories, setCalories] = useState({ consumed: 0, target: 2000 });
  const [protein, setProtein] = useState({ consumed: 0, target: 150 });
  const [carbs, setCarbs] = useState({ consumed: 0, target: 250 });
  const [fat, setFat] = useState({ consumed: 0, target: 65 });
  const [water, setWater] = useState(0);

  // Football-specific data
  const [steps, setSteps] = useState(0);
  const [weeklyTrainingSessions, setWeeklyTrainingSessions] = useState(1);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);
  const [hasTrainedToday, setHasTrainedToday] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) {
        loadDashboardData();
      }
    }, [user?.id])
  );

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      const todayData = await firebaseDailyDataService.getTodayData(user.id);

      setCalories({
        consumed: todayData.calories.consumed,
        target: todayData.calories.target
      });
      setProtein({
        consumed: todayData.protein.consumed,
        target: todayData.protein.target
      });
      setCarbs({
        consumed: todayData.carbs.consumed,
        target: todayData.carbs.target
      });
      setFat({
        consumed: todayData.fat.consumed,
        target: todayData.fat.target
      });
      setWater(todayData.water.consumed * 250);
      setSteps(todayData.steps.count);

      // Load streak from progressTrackingService (supports freezes)
      const streakData = await getStreakData();
      setCurrentStreak(streakData.workoutStreak);

      const today = new Date().toDateString();
      const lastWorkout = streakData.lastWorkoutDate ? new Date(streakData.lastWorkoutDate).toDateString() : null;
      setHasTrainedToday(lastWorkout === today);

      // Load XP
      try {
        const { experience } = await getUserLevel();
        setUserXP(experience);
      } catch {
        setUserXP(0);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadDashboardData();
    } catch (error) {
      console.log('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const addWater = async () => {
    try {
      if (user?.id) {
        await firebaseDailyDataService.addWater(user.id, 1);
        setWater(water + 250);
      }
    } catch (error) {
      console.error('Failed to add water:', error);
      setWater(water + 250);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#0A1628' }]}>
      {/* Collapsible Header with Football Branding */}
      <Animated.View style={styles.stickyHeader}>
        <Animated.View style={[styles.headerBackground, { backgroundColor: '#0D1B2A' }]} />

        <View style={styles.duolingoTopBar}>
          {/* Left Side - Streak */}
          <View style={[styles.topBarLeft, { marginTop: 15 }]}>
            <TouchableOpacity
              style={styles.duolingoItem}
              onPress={() => navigation.navigate('Streak' as never)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="fire"
                size={30}
                color={hasTrainedToday ? "#22C55E" : "#999999"}
              />
              <Text style={[
                styles.duolingoItemText,
                { color: hasTrainedToday ? colors.text : '#999999' }
              ]}>
                {currentStreak}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.workoutIcon}
              onPress={() => navigation.navigate('Workout' as never)}
            >
              <MaterialCommunityIcons name="soccer" size={28} color="#22C55E" />
            </TouchableOpacity>
          </View>

          {/* Center - Football Logo/Text */}
          <TouchableOpacity
            style={styles.topBarCenter}
            onPress={() => navigation.navigate('Settings' as never)}
            activeOpacity={0.7}
          >
            <Text style={styles.footballTitle}>FOOTBALL</Text>
            <Text style={styles.footballSubtitle}>TRAINING</Text>
          </TouchableOpacity>

          {/* Right Side - XP and Account */}
          <View style={[styles.topBarRight, { marginTop: 15 }]}>
            <TouchableOpacity
              style={styles.duolingoItem}
              onPress={() => navigation.navigate('Progress' as never)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="diamond" size={30} color="#FFB800" />
              <Text style={[styles.duolingoItemText, { color: colors.text }]}>
                {userXP}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.duolingoItem}
              onPress={() => {}}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="account-group" size={30} color="#22C55E" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Scrollable Content */}
      <Animated.ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
            progressBackgroundColor={colors.surface}
          />
        }
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        <View style={{ height: 120 }} />

        {/* Calories Section - Football themed (Green instead of Orange) */}
        <View style={styles.newCaloriesSection}>
          <View style={styles.caloriesTopRow}>
            <View style={styles.caloriesStat}>
              <Text style={[styles.caloriesStatValue, { color: isDark ? 'white' : '#333' }]}>{calories.consumed}</Text>
              <Text style={[styles.caloriesStatLabel, { color: isDark ? '#B0B0B0' : '#666' }]}>Eaten</Text>
            </View>

            <View style={styles.centralCircle}>
              <Svg width={160} height={160} style={{ position: 'absolute' }}>
                {/* Outer Ring - Calories (Green for football) */}
                <Circle
                  cx={80}
                  cy={80}
                  r={75}
                  stroke={isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(34, 197, 94, 0.15)'}
                  strokeWidth={6}
                  fill="none"
                />
                <Circle
                  cx={80}
                  cy={80}
                  r={75}
                  stroke={isDark ? 'rgba(34, 197, 94, 0.7)' : 'rgba(34, 197, 94, 0.6)'}
                  strokeWidth={6}
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 75}`}
                  strokeDashoffset={`${2 * Math.PI * 75 * (1 - Math.min(calories.consumed / calories.target, 1))}`}
                  strokeLinecap="round"
                  transform="rotate(-90 80 80)"
                />
                {/* Inner Ring - Steps */}
                <Circle
                  cx={80}
                  cy={80}
                  r={60}
                  stroke={isDark ? 'rgba(66, 133, 244, 0.2)' : 'rgba(66, 133, 244, 0.15)'}
                  strokeWidth={6}
                  fill="none"
                />
                <Circle
                  cx={80}
                  cy={80}
                  r={60}
                  stroke={isDark ? 'rgba(66, 133, 244, 0.7)' : 'rgba(66, 133, 244, 0.6)'}
                  strokeWidth={6}
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 60}`}
                  strokeDashoffset={`${2 * Math.PI * 60 * (1 - Math.min(steps / 10000, 1))}`}
                  strokeLinecap="round"
                  transform="rotate(-90 80 80)"
                />
              </Svg>
              {/* Football Icon in Center */}
              <View style={styles.logoContainer}>
                <MaterialCommunityIcons name="soccer" size={45} color="#22C55E" />
              </View>
            </View>

            <View style={styles.caloriesStat}>
              <Text style={[styles.caloriesStatValue, { color: isDark ? 'white' : '#333' }]}>
                {calories.target - calories.consumed}
              </Text>
              <Text style={[styles.caloriesStatLabel, { color: isDark ? '#B0B0B0' : '#666' }]}>Remaining</Text>
            </View>
          </View>

          {/* Activity Stats Row */}
          <View style={styles.activityStatsRow}>
            <View style={styles.activityStatItem}>
              <Image
                source={require('../../assets/calories-icon.png')}
                style={[styles.activityIcon, { tintColor: '#22C55E' }]}
              />
              <Text style={[styles.activityStatValue, { color: isDark ? 'white' : '#333' }]}>{calories.consumed}</Text>
              <Text style={[styles.activityStatLabel, { color: isDark ? '#B0B0B0' : '#666' }]}>Calories</Text>
            </View>
            <View style={styles.activityStatItem}>
              <Image
                source={require('../../assets/steps-icon.png')}
                style={[styles.activityIcon, { tintColor: '#4285F4' }]}
              />
              <Text style={[styles.activityStatValue, { color: isDark ? 'white' : '#333' }]}>{steps.toLocaleString()}</Text>
              <Text style={[styles.activityStatLabel, { color: isDark ? '#B0B0B0' : '#666' }]}>Steps</Text>
            </View>
          </View>

          {/* Macros */}
          <View style={styles.macrosBottomSection}>
            <View style={styles.macroItem}>
              <Text style={[styles.macroNumber, { color: '#66B2FF' }]}>
                {Math.round(carbs.consumed)}
              </Text>
              <Text style={[styles.macroLabel, { color: isDark ? 'white' : 'white' }]}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroNumber, { color: '#66B2FF' }]}>
                {Math.round(protein.consumed)}
              </Text>
              <Text style={[styles.macroLabel, { color: isDark ? 'white' : 'white' }]}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={[styles.macroNumber, { color: '#66B2FF' }]}>
                {Math.round(fat.consumed)}
              </Text>
              <Text style={[styles.macroLabel, { color: isDark ? 'white' : 'white' }]}>Fat</Text>
            </View>
          </View>
        </View>

        {/* Training Block - Football styled */}
        <TouchableOpacity
          style={[styles.trainingBlock, { backgroundColor: '#1E3A5F' }]}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Workout')}
        >
          <View style={styles.weekCalendar}>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
              const today = new Date().getDay();
              const isToday = index === today;
              return (
                <View key={day + index} style={styles.dayColumn}>
                  <View style={[
                    styles.dayDot,
                    isToday && { backgroundColor: '#22C55E' },
                    !isToday && { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                  ]} />
                  <Text style={[
                    styles.dayText,
                    { color: isToday ? '#22C55E' : (isDark ? '#B0B0B0' : '#999') }
                  ]}>
                    {day}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text style={[styles.sessionLabel, { color: isDark ? '#B0B0B0' : '#999' }]}>
            Today's Training
          </Text>

          <View style={styles.trainingTitleSection}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.trainingMainTitle, { color: isDark ? 'white' : '#1a1a1a' }]}>
                Cardio & Skills Session
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 4 }}>
            <Text style={[styles.trainingCategory, { color: isDark ? '#B0B0B0' : '#666', fontSize: 12 }]}>
              FOOTBALL TRAINING
            </Text>
            <MaterialCommunityIcons name="soccer" size={40} color="rgba(34, 197, 94, 0.3)" />
          </View>

          <View style={styles.trainingInfoRow}>
            <View style={styles.infoPill}>
              <Ionicons name="time-outline" size={16} color="#22C55E" />
              <Text style={[styles.infoPillText, { color: isDark ? 'white' : '#333' }]}>
                45-60 min
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.warmupSection}
            onPress={() => navigation.navigate('Workout')}
          >
            <View style={styles.warmupHeader}>
              <Text style={[styles.warmupTitle, { color: isDark ? 'white' : '#1a1a1a' }]}>
                Warm-up & Drills
              </Text>
              <Ionicons name="chevron-up" size={20} color={isDark ? '#B0B0B0' : '#666'} />
            </View>
            <Text style={[styles.warmupSubtitle, { color: isDark ? '#B0B0B0' : '#666' }]}>
              10 min • Dynamic stretching
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.nextActionsRow}>
          <TouchableOpacity
            style={[styles.nextActionCard, { backgroundColor: '#1E3A5F' }]}
            onPress={() => navigation.navigate('Nutrition')}
          >
            <View style={[styles.nextActionIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
              <MaterialCommunityIcons name="food-apple" size={24} color="#22C55E" />
            </View>
            <View style={styles.nextActionContent}>
              <Text style={[styles.nextActionLabel, { color: isDark ? '#B0B0B0' : '#666' }]}>NEXT MEAL</Text>
              <Text style={[styles.nextActionTitle, { color: colors.text }]}>Lunch</Text>
              <Text style={[styles.nextActionTime, { color: colors.textSecondary }]}>12:30 PM</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextActionCard, { backgroundColor: '#1E3A5F' }]}
            onPress={() => navigation.navigate('Workout')}
          >
            <View style={[styles.nextActionIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
              <MaterialCommunityIcons name="soccer" size={24} color="#22C55E" />
            </View>
            <View style={styles.nextActionContent}>
              <Text style={[styles.nextActionLabel, { color: isDark ? '#B0B0B0' : '#666' }]}>NEXT SESSION</Text>
              <Text style={[styles.nextActionTitle, { color: colors.text }]}>Skills Training</Text>
              <Text style={[styles.nextActionTime, { color: colors.textSecondary }]}>6 drills</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 0,
    paddingTop: 0,
  },
  scrollContent: {
    flexGrow: 1,
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    overflow: 'hidden',
    height: 120,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A5F',
  },
  duolingoTopBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    height: 120,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  topBarCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
  },
  footballTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22C55E',
    letterSpacing: 2,
  },
  footballSubtitle: {
    fontSize: 10,
    color: '#8B9AA5',
    letterSpacing: 1,
  },
  workoutIcon: {
    padding: 8,
    marginHorizontal: 4,
  },
  duolingoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  duolingoItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  newCaloriesSection: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
    backgroundColor: '#1E3A5F',
    borderRadius: 20,
    padding: 20,
  },
  caloriesTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginHorizontal: -10,
  },
  caloriesStat: {
    alignItems: 'center',
    width: 70,
  },
  caloriesStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  caloriesStatLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  centralCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 160,
    height: 160,
  },
  logoContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityStatsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: -5,
    gap: 40,
  },
  activityStatItem: {
    alignItems: 'center',
    gap: 4,
  },
  activityIcon: {
    width: 36,
    height: 36,
  },
  activityStatLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  activityStatValue: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  macrosBottomSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 15,
    gap: 40,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroNumber: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  trainingBlock: {
    marginTop: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderRadius: 20,
  },
  weekCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  dayColumn: {
    alignItems: 'center',
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  dayText: {
    fontSize: 11,
    fontWeight: '500',
  },
  sessionLabel: {
    fontSize: 12,
    marginBottom: 12,
  },
  trainingTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  trainingMainTitle: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  trainingCategory: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  trainingInfoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoPillText: {
    fontSize: 14,
    fontWeight: '500',
  },
  warmupSection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
  },
  warmupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  warmupTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  warmupSubtitle: {
    fontSize: 13,
  },
  nextActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  nextActionCard: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  nextActionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  nextActionContent: {
    flex: 1,
  },
  nextActionLabel: {
    fontSize: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  nextActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  nextActionTime: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default FootballHomeScreen;
