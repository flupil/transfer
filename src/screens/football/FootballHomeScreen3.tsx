import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import firebaseDailyDataService from '../../services/firebaseDailyDataService';
import { getUserLevel, getStreakData } from '../../services/progressTrackingService';

const { width } = Dimensions.get('window');

const FootballHomeScreen3 = ({ navigation }: any) => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  // Generate styles with theme colors
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [refreshing, setRefreshing] = useState(false);

  const [currentStreak, setCurrentStreak] = useState(0);
  const [userXP, setUserXP] = useState(0);
  const [userLevel, setUserLevel] = useState(1);
  const [hasTrainedToday, setHasTrainedToday] = useState(false);
  const [calories, setCalories] = useState({ consumed: 0, target: 2000 });
  const [protein, setProtein] = useState({ consumed: 0, target: 150 });
  const [carbs, setCarbs] = useState({ consumed: 0, target: 250 });
  const [fat, setFat] = useState({ consumed: 0, target: 65 });
  const [water, setWater] = useState(0);
  const [steps, setSteps] = useState(0);

  useEffect(() => {
    if (user?.id) loadDashboardData();
  }, [user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      if (user?.id) loadDashboardData();
    }, [user?.id])
  );

  const loadDashboardData = async () => {
    if (!user?.id) return;
    try {
      const todayData = await firebaseDailyDataService.getTodayData(user.id);
      setCalories({ consumed: todayData.calories.consumed, target: todayData.calories.target });
      setProtein({ consumed: todayData.protein.consumed, target: todayData.protein.target });
      setCarbs({ consumed: todayData.carbs.consumed, target: todayData.carbs.target });
      setFat({ consumed: todayData.fat.consumed, target: todayData.fat.target });
      setWater(todayData.water.consumed * 250);
      setSteps(todayData.steps.count);

      const streakData = await getStreakData();
      setCurrentStreak(streakData.workoutStreak);
      const today = new Date().toDateString();
      const lastWorkout = streakData.lastWorkoutDate ? new Date(streakData.lastWorkoutDate).toDateString() : null;
      setHasTrainedToday(lastWorkout === today);

      try {
        const { level, experience } = await getUserLevel();
        setUserLevel(level);
        setUserXP(experience);
      } catch {
        setUserLevel(1);
        setUserXP(0);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const addWater = async () => {
    try {
      if (user?.id) {
        await firebaseDailyDataService.addWater(user.id, 1);
        setWater(water + 250);
      }
    } catch {
      setWater(water + 250);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Top Bar - Duolingo Style */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            style={styles.streakButton}
            onPress={() => navigation.navigate('Streak' as never)}
          >
            <MaterialCommunityIcons name="fire" size={28} color={hasTrainedToday ? colors.success : colors.textSecondary} />
            <Text style={[styles.streakText, { color: hasTrainedToday ? colors.success : colors.textSecondary }]}>
              {currentStreak}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topBarCenter}>
          <MaterialCommunityIcons name="soccer" size={32} color={colors.accent} />
          <Text style={styles.topBarTitle}>FOOTBALL</Text>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.xpButton}
            onPress={() => navigation.navigate('Progress' as never)}
          >
            <MaterialCommunityIcons name="diamond" size={28} color="#E94E1B" />
            <Text style={styles.xpText}>{userXP}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E94E1B" />}
      >
        <View style={{ height: 90 }} />

        {/* Main Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <View>
              <Text style={styles.statsGreeting}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}</Text>
              <Text style={styles.statsName}>{user?.name || 'Athlete'}</Text>
            </View>
            <View style={styles.levelBadge}>
              <MaterialCommunityIcons name="trophy" size={20} color="#E94E1B" />
              <Text style={styles.levelText}>Lv.{userLevel}</Text>
            </View>
          </View>

          {/* Progress Rings */}
          <View style={styles.ringsContainer}>
            <View style={styles.ringSection}>
              <Svg width={140} height={140}>
                <Defs>
                  <SvgLinearGradient id="calorieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#E94E1B" />
                    <Stop offset="100%" stopColor="#FF6B35" />
                  </SvgLinearGradient>
                </Defs>
                <Circle cx={70} cy={70} r={60} stroke="rgba(34, 197, 94, 0.1)" strokeWidth={10} fill="none" />
                <Circle
                  cx={70}
                  cy={70}
                  r={60}
                  stroke="url(#calorieGrad)"
                  strokeWidth={10}
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 60}`}
                  strokeDashoffset={`${2 * Math.PI * 60 * (1 - Math.min(calories.consumed / calories.target, 1))}`}
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                />
              </Svg>
              <View style={styles.ringCenter}>
                <Text style={styles.ringValue}>{calories.consumed}</Text>
                <Text style={styles.ringLabel}>kcal</Text>
              </View>
            </View>

            <View style={styles.ringSection}>
              <Svg width={140} height={140}>
                <Defs>
                  <SvgLinearGradient id="stepsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#3B82F6" />
                    <Stop offset="100%" stopColor="#2563EB" />
                  </SvgLinearGradient>
                </Defs>
                <Circle cx={70} cy={70} r={60} stroke="rgba(59, 130, 246, 0.1)" strokeWidth={10} fill="none" />
                <Circle
                  cx={70}
                  cy={70}
                  r={60}
                  stroke="url(#stepsGrad)"
                  strokeWidth={10}
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 60}`}
                  strokeDashoffset={`${2 * Math.PI * 60 * (1 - Math.min(steps / 10000, 1))}`}
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                />
              </Svg>
              <View style={styles.ringCenter}>
                <Text style={styles.ringValue}>{steps}</Text>
                <Text style={styles.ringLabel}>steps</Text>
              </View>
            </View>
          </View>

          {/* Macros Row */}
          <View style={styles.macrosRow}>
            <View style={styles.macroItem}>
              <View style={[styles.macroBar, { backgroundColor: `${colors.accent}33` }]}>
                <View style={[styles.macroFill, { width: `${Math.min((protein.consumed / protein.target) * 100, 100)}%`, backgroundColor: colors.accent }]} />
              </View>
              <Text style={styles.macroValue}>{protein.consumed}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroBar, { backgroundColor: `${colors.accent}33` }]}>
                <View style={[styles.macroFill, { width: `${Math.min((carbs.consumed / carbs.target) * 100, 100)}%`, backgroundColor: colors.accent }]} />
              </View>
              <Text style={styles.macroValue}>{carbs.consumed}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroBar, { backgroundColor: `${colors.accent}33` }]}>
                <View style={[styles.macroFill, { width: `${Math.min((fat.consumed / fat.target) * 100, 100)}%`, backgroundColor: colors.accent }]} />
              </View>
              <Text style={styles.macroValue}>{fat.consumed}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>
        </View>

        {/* Today's Training Block */}
        <TouchableOpacity
          style={styles.trainingSection}
          activeOpacity={1}
          onPress={() => navigation.navigate('FootballTraining' as never)}
        >
          <Text style={styles.sectionTitle}>Today's Training</Text>

          <View
            style={styles.trainingBlock}
          >
            {/* Week Calendar */}
            <View style={styles.weekCalendar}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
                const today = new Date().getDay();
                const isToday = index === today;
                return (
                  <View key={`${day}-${index}`} style={styles.dayColumn}>
                    <View style={[styles.dayDot, { backgroundColor: isToday ? colors.success : colors.surface }]} />
                    <Text style={[styles.dayText, { color: isToday ? colors.success : colors.textSecondary }]}>
                      {day}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.trainingHeader}>
              <View style={styles.trainingBadge}>
                <Text style={styles.trainingBadgeText}>FOOTBALL TRAINING</Text>
              </View>
              <MaterialCommunityIcons name="soccer" size={36} color="rgba(34, 197, 94, 0.2)" />
            </View>

            <Text style={styles.trainingTitle}>Cardio & Skills Session</Text>

            <View style={styles.trainingInfo}>
              <View style={styles.trainingInfoItem}>
                <Ionicons name="time-outline" size={16} color="#E94E1B" />
                <Text style={styles.trainingInfoText}>45-60 min</Text>
              </View>
              <View style={styles.trainingInfoItem}>
                <MaterialCommunityIcons name="fire" size={16} color="#F59E0B" />
                <Text style={styles.trainingInfoText}>350 cal</Text>
              </View>
            </View>

            <View style={styles.warmupSection}>
              <Text style={styles.warmupTitle}>Warm-up & Drills</Text>
              <Text style={styles.warmupSubtitle}>10 min • Dynamic stretching</Text>
            </View>

            <View style={styles.startButton}>
              <LinearGradient colors={['#E94E1B', '#FF6B35']} style={styles.startGradient}>
                <Ionicons name="play" size={20} color="#FFF" />
                <Text style={styles.startButtonText}>Start Workout</Text>
              </LinearGradient>
            </View>
          </View>
        </TouchableOpacity>

        {/* Nutrition Block - Navigate to Nutrition */}
        <TouchableOpacity
          style={styles.nutritionSection}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('Nutrition' as never)}
        >
          <Text style={styles.sectionTitle}>Nutrition</Text>
          <View style={styles.nutritionBlock}>
            <View style={styles.nutritionHeader}>
              <View style={styles.nutritionBadge}>
                <Text style={styles.nutritionBadgeText}>TODAY'S INTAKE</Text>
              </View>
              <MaterialCommunityIcons name="food-apple" size={36} color="rgba(34, 197, 94, 0.2)" />
            </View>

            <Text style={styles.nutritionTitle}>Daily Nutrition</Text>

            <View style={styles.macrosQuickView}>
              <View style={styles.macroQuickItem}>
                <Text style={styles.macroQuickValue}>{calories.consumed}</Text>
                <Text style={styles.macroQuickLabel}>Calories</Text>
              </View>
              <View style={styles.macroQuickItem}>
                <Text style={styles.macroQuickValue}>{protein.consumed}g</Text>
                <Text style={styles.macroQuickLabel}>Protein</Text>
              </View>
              <View style={styles.macroQuickItem}>
                <Text style={styles.macroQuickValue}>{carbs.consumed}g</Text>
                <Text style={styles.macroQuickLabel}>Carbs</Text>
              </View>
            </View>

            <View style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View Details</Text>
              <Ionicons name="arrow-forward" size={16} color="#E94E1B" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Programs */}
        <View style={styles.programsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Programs</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 20, paddingRight: 20 }}
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
          >
            <TouchableOpacity
              style={styles.programCard}
              onPress={() => navigation.navigate('FootballTraining' as never)}
            >
              <View style={[styles.programIcon, { backgroundColor: colors.accent }]}>
                <MaterialCommunityIcons name="soccer" size={28} color="#FFF" />
              </View>
              <Text style={styles.programTitle}>Ball Control</Text>
              <Text style={styles.programSubtitle}>6 weeks • 24 sessions</Text>
              <View style={styles.programProgress}>
                <View style={[styles.programProgressFill, { width: '35%' }]} />
              </View>
              <Text style={styles.programProgressText}>35% complete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.programCard}
              onPress={() => navigation.navigate('FootballTraining' as never)}
            >
              <View style={[styles.programIcon, { backgroundColor: colors.accent }]}>
                <MaterialCommunityIcons name="run-fast" size={28} color="#FFF" />
              </View>
              <Text style={styles.programTitle}>Speed Training</Text>
              <Text style={styles.programSubtitle}>4 weeks • 16 sessions</Text>
              <View style={styles.programProgress}>
                <View style={[styles.programProgressFill, { width: '60%' }]} />
              </View>
              <Text style={styles.programProgressText}>60% complete</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.programCard}
              onPress={() => navigation.navigate('FootballTraining' as never)}
            >
              <View style={[styles.programIcon, { backgroundColor: colors.accent }]}>
                <MaterialCommunityIcons name="arm-flex" size={28} color="#FFF" />
              </View>
              <Text style={styles.programTitle}>Strength</Text>
              <Text style={styles.programSubtitle}>8 weeks • 32 sessions</Text>
              <View style={styles.programProgress}>
                <View style={[styles.programProgressFill, { width: '12%' }]} />
              </View>
              <Text style={styles.programProgressText}>12% complete</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 90,
    backgroundColor: colors.backgroundDark,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 10,
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  topBarLeft: {
    flex: 1,
  },
  topBarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 1,
  },
  topBarRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  streakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streakText: {
    fontSize: 18,
    fontWeight: '700',
  },
  xpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  xpText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statsCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 20,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  statsGreeting: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statsName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.warning}26`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.warning,
  },
  ringsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  ringSection: {
    alignItems: 'center',
  },
  ringCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  ringLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroItem: {
    flex: 1,
  },
  macroBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  macroFill: {
    height: '100%',
    borderRadius: 3,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  macroLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  trainingSection: {
    marginBottom: 4,
  },
  nutritionSection: {
    marginBottom: 4,
  },
  nutritionBlock: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nutritionBadge: {
    backgroundColor: `${colors.success}26`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  nutritionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
    letterSpacing: 1,
  },
  nutritionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  macrosQuickView: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  macroQuickItem: {
    alignItems: 'center',
  },
  macroQuickValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  macroQuickLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  trainingBlock: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weekCalendar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  dayColumn: {
    alignItems: 'center',
    gap: 6,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trainingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  trainingBadge: {
    backgroundColor: `${colors.success}26`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trainingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.success,
    letterSpacing: 1,
  },
  trainingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  trainingInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  trainingInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trainingInfoText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  warmupSection: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  warmupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  warmupSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  startButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  programsSection: {
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  seeAll: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  programCard: {
    width: 160,
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  programIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  programTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  programSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  programProgress: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  programProgressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 2,
  },
  programProgressText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});

export default FootballHomeScreen3;
