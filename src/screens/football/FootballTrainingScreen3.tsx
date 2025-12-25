import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { getUserLevel, getStreakData } from '../../services/progressTrackingService';
import { footballPrograms, FootballProgram } from '../../data/footballWorkouts';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const programConfig: { [key: string]: { icon: string; gradient: string[] } } = {
  explosive_power: { icon: 'lightning-bolt', gradient: ['#F59E0B', '#D97706'] },
  agility_speed: { icon: 'run-fast', gradient: ['#E94E1B', '#FF6B35'] },
  cardio_endurance: { icon: 'heart', gradient: ['#E94E1B', '#DC2626'] },
  strength_endurance: { icon: 'weight-lifter', gradient: ['#E94E1B', '#7C3AED'] },
  leg_power: { icon: 'soccer', gradient: ['#3B82F6', '#2563EB'] }
};

// Animated Icon Component
const AnimatedIcon: React.FC<{ icon: string; size: number; color: string }> = ({ icon, size, color }) => {
  const animValue = useRef(new Animated.Value(0)).current;
  const AnimatedMaterialIcon = Animated.createAnimatedComponent(MaterialCommunityIcons);

  useEffect(() => {
    let animation: Animated.CompositeAnimation;

    switch (icon) {
      case 'heart':
        // Beating heart animation
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
        break;

      case 'run-fast':
        // Running animation (horizontal movement)
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 800,
              useNativeDriver: true,
            }),
          ])
        );
        break;

      case 'weight-lifter':
        // Barbell lift animation (vertical movement)
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ])
        );
        break;

      case 'soccer':
        // Spinning soccer ball
        animation = Animated.loop(
          Animated.timing(animValue, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          })
        );
        break;

      case 'lightning-bolt':
        // Pulsing lightning effect
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(animValue, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        );
        break;

      default:
        return null;
    }

    animation.start();
    return () => animation.stop();
  }, [icon]);

  // Define animation styles based on icon type
  const getAnimationStyle = () => {
    switch (icon) {
      case 'heart':
        // Scale effect for beating
        const scale = animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2],
        });
        return { transform: [{ scale }] };

      case 'run-fast':
        // Running motion with bounce and tilt
        const translateX = animValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: [-4, 0, 4],
        });
        const translateY = animValue.interpolate({
          inputRange: [0, 0.25, 0.5, 0.75, 1],
          outputRange: [0, -3, 0, -3, 0],
        });
        const rotate = animValue.interpolate({
          inputRange: [0, 0.5, 1],
          outputRange: ['-5deg', '5deg', '-5deg'],
        });
        return { transform: [{ translateX }, { translateY }, { rotate }] };

      case 'weight-lifter':
        // Vertical movement (up and down)
        const translateYLift = animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -5],
        });
        return { transform: [{ translateY: translateYLift }] };

      case 'soccer':
        // Rotation
        const rotateBall = animValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });
        return { transform: [{ rotate: rotateBall }] };

      case 'lightning-bolt':
        // Pulse and glow effect
        const lightningScale = animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.15],
        });
        const opacity = animValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 0.7],
        });
        return { transform: [{ scale: lightningScale }], opacity };

      default:
        return {};
    }
  };

  return (
    <AnimatedMaterialIcon
      name={icon as any}
      size={size}
      color={color}
      style={getAnimationStyle()}
    />
  );
};

const FootballTrainingScreen3: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { language } = useLanguage();

  const [weeklyStats, setWeeklyStats] = useState({ target: 5, completed: 0 });
  const [totalSessions, setTotalSessions] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [hasTrainedToday, setHasTrainedToday] = useState(false);
  const [userXP, setUserXP] = useState(0);

  // Generate styles with theme colors
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [user])
  );

  const loadData = async () => {
    try {
      const streakData = await getStreakData();
      setCurrentStreak(streakData.workoutStreak);
      const today = new Date().toDateString();
      const lastWorkout = streakData.lastWorkoutDate ? new Date(streakData.lastWorkoutDate).toDateString() : null;
      setHasTrainedToday(lastWorkout === today);

      // Load actual weekly workout count from AsyncStorage
      const workoutHistoryStr = await AsyncStorage.getItem(`workout_history_${user?.id}`);
      if (workoutHistoryStr) {
        const workoutHistory = JSON.parse(workoutHistoryStr);

        // Get start of current week (Monday)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - daysToMonday);
        weekStart.setHours(0, 0, 0, 0);

        // Count workouts this week
        const weeklyWorkouts = workoutHistory.filter((workout: any) => {
          const workoutDate = new Date(workout.date);
          return workoutDate >= weekStart;
        });

        setWeeklyStats({ target: 5, completed: weeklyWorkouts.length });
        setTotalSessions(workoutHistory.length);
      }

      try {
        const { experience } = await getUserLevel();
        setUserXP(experience);
      } catch {
        setUserXP(0);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleProgramPress = (program: FootballProgram) => {
    (navigation as any).navigate('FootballProgramWorkouts', { program });
  };

  const progressPercentage = (weeklyStats.completed / weeklyStats.target) * 100;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Football Header */}
      <View style={styles.headerBackground}>
        <View style={styles.duolingoTopBar}>
          {/* Left Side - Streak */}
          <View style={[styles.topBarLeft, { marginTop: 15 }]}>
            <TouchableOpacity
              style={styles.duolingoItem}
              onPress={() => (navigation as any).navigate('Streak')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="fire"
                size={30}
                color={hasTrainedToday ? "#FF6B35" : "#999999"}
              />
              <Text style={[
                styles.duolingoItemText,
                { color: hasTrainedToday ? "#FFF" : '#999999' }
              ]}>
                {currentStreak}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.workoutIcon}
              onPress={() => (navigation as any).navigate('Workout')}
            >
              <MaterialCommunityIcons name="soccer" size={28} color="#E94E1B" />
            </TouchableOpacity>
          </View>

          {/* Center - Football Logo/Text */}
          <TouchableOpacity
            style={styles.topBarCenter}
            onPress={() => (navigation as any).navigate('Settings')}
            activeOpacity={0.7}
          >
            <Text style={styles.footballTitle}>FOOTBALL</Text>
            <Text style={styles.footballSubtitle}>TRAINING</Text>
          </TouchableOpacity>

          {/* Right Side - XP and Account */}
          <View style={[styles.topBarRight, { marginTop: 15 }]}>
            <TouchableOpacity
              style={styles.duolingoItem}
              onPress={() => (navigation as any).navigate('Progress')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="diamond"
                size={30}
                color="#1CB0F6"
              />
              <Text style={[styles.duolingoItemText, { color: '#FFF' }]}>
                {userXP}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.duolingoItem}
              onPress={() => (navigation as any).navigate('Profile')}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="account-circle"
                size={30}
                color="#E94E1B"
              />
            </TouchableOpacity>
          </View>
        </View>
        {/* Bottom separator line */}
        <View style={styles.headerSeparator} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Training</Text>
        </View>

        {/* Weekly Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.progressNumber}>{weeklyStats.completed}/{weeklyStats.target}</Text>
          <Text style={styles.progressLabel}>Weekly Goal</Text>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View style={styles.progressBarBackground} />
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercentage}%` }
                ]}
              />
            </View>
            <View style={styles.barLabels}>
              <Text style={styles.barLabel}>0</Text>
              <Text style={styles.barLabel}>{weeklyStats.target} sessions</Text>
            </View>
          </View>

          {/* Legend */}
          <View style={styles.legendRow}>
            <View style={styles.legendBox} />
            <Text style={styles.legendLabel}>Progress</Text>
            <Text style={styles.legendDots}> . . . . . . </Text>
            <Text style={styles.legendValue}>
              {Math.round(progressPercentage)}% Complete
            </Text>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsCard}>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <MaterialCommunityIcons name="fire" size={20} color="#FF6B35" />
              <Text style={styles.statBoxValue}>{currentStreak}</Text>
              <Text style={styles.statBoxLabel}>Day Streak</Text>
            </View>
            <View style={styles.statBox}>
              <MaterialCommunityIcons name="dumbbell" size={20} color="#1CB0F6" />
              <Text style={styles.statBoxValue}>{totalSessions}</Text>
              <Text style={styles.statBoxLabel}>Total Sessions</Text>
            </View>
            <View style={styles.statBox}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#8BC34A" />
              <Text style={styles.statBoxValue}>~45</Text>
              <Text style={styles.statBoxLabel}>Avg Minutes</Text>
            </View>
          </View>
        </View>

        {/* Training Programs */}
        <View style={styles.programsSection}>
          <View style={styles.programsContainer}>
            <Text style={styles.sectionTitle}>Training Programs</Text>

            {footballPrograms.map((program, index) => {
              const config = programConfig[program.id];
              const gradientColors = config?.gradient || ['#E94E1B', '#7C3AED'];
              const icon = config?.icon || 'dumbbell';

              return (
                <React.Fragment key={program.id}>
                  <TouchableOpacity
                    style={styles.programItem}
                    onPress={() => handleProgramPress(program)}
                  >
                    {/* Icon Circle */}
                    <View style={styles.programIconWrapper}>
                      <LinearGradient
                        colors={[gradientColors[0], gradientColors[1]]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.programIconCircle}
                      >
                        <View style={styles.iconInnerCircle}>
                          <AnimatedIcon icon={icon} size={30} color="#FFF" />
                        </View>
                      </LinearGradient>
                    </View>

                    {/* Program Info */}
                    <View style={styles.programInfo}>
                      <Text style={styles.programName}>
                        {language === 'he' ? program.nameHe : program.name}
                      </Text>
                      <Text style={styles.programMeta}>
                        {program.workouts.length} workouts • {language === 'he' ? program.descriptionHe : program.description}
                      </Text>
                    </View>

                    {/* Vertical Separator */}
                    <View style={styles.verticalSeparator} />

                    {/* Arrow Icon */}
                    <Ionicons name="chevron-forward" size={24} color="#fff" />
                  </TouchableOpacity>
                  {index < footballPrograms.length - 1 && <View style={styles.programSeparator} />}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
  },
  headerBackground: {
    backgroundColor: colors.backgroundDark,
  },
  duolingoTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    height: 120,
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
  footballTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.success,
    letterSpacing: 1,
  },
  footballSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    flex: 1,
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
  workoutIcon: {
    padding: 8,
    marginHorizontal: 4,
  },
  headerSeparator: {
    height: 1,
    backgroundColor: colors.border,
  },
  progressCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  progressNumber: {
    fontSize: 40,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  progressLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 32,
    backgroundColor: colors.backgroundDark,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarBackground: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: colors.backgroundDark,
  },
  progressBarFill: {
    position: 'absolute',
    height: '100%',
    backgroundColor: colors.info,
  },
  barLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  barLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  legendRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendBox: {
    width: 16,
    height: 16,
    backgroundColor: colors.info,
    borderRadius: 4,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 14,
    color: colors.text,
  },
  legendDots: {
    fontSize: 14,
    color: colors.border,
    flex: 1,
    letterSpacing: 3,
    marginLeft: 8,
    marginTop: -2,
  },
  legendValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: colors.cardBackground,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statBoxValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  statBoxLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  programsSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    padding: 20,
    paddingBottom: 12,
  },
  programsContainer: {
    backgroundColor: colors.cardBackground,
    borderRadius: 20,
    overflow: 'hidden',
  },
  programItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  programSeparator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 76,
    marginRight: 16,
  },
  programIconWrapper: {
    position: 'relative',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: 60,
    height: 60,
  },
  iconGlowOuter: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    opacity: 0.15,
  },
  iconGlowMiddle: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    opacity: 0.25,
  },
  programIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  iconInnerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  programMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  verticalSeparator: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
});

export default FootballTrainingScreen3;
