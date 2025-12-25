import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  Animated
} from 'react-native';
import { Text, Card, Button, IconButton, Chip, FAB } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUserLevel, getStreakData } from '../../services/progressTrackingService';
import { footballPrograms, FootballProgram } from '../../data/footballWorkouts';

const { width } = Dimensions.get('window');

// Map programs to icons and colors
const programConfig: { [key: string]: { icon: string; color: string } } = {
  explosive_power: { icon: 'flash', color: '#FF6B35' },
  agility_speed: { icon: 'run-fast', color: '#E94E1B' },
  cardio_endurance: { icon: 'heart-pulse', color: '#FF6B35' },
  strength_endurance: { icon: 'dumbbell', color: '#E94E1B' },
  leg_power: { icon: 'soccer-field', color: '#E94E1B' }
};
const FootballTrainingScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState({ target: 5, completed: 0 });
  const [totalSessions, setTotalSessions] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [hasTrainedToday, setHasTrainedToday] = useState(false);
  const [userXP, setUserXP] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      loadTrainingData();
    }, [user])
  );

  const loadTrainingData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load training data from storage
      // For now using sample data for weekly stats and activities
      setWeeklyStats({ target: 5, completed: 3 });
      setTotalSessions(24);
      setRecentActivities([
        {
          type: 'Cardiopulmonary',
          date: 'Today',
          duration: 45,
          icon: 'heart-pulse',
          color: '#FF6B35'
        },
        {
          type: 'Ball Skills',
          date: 'Yesterday',
          duration: 30,
          icon: 'soccer',
          color: '#E94E1B'
        }
      ]);

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
      console.error('Failed to load training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProgramPress = (program: FootballProgram) => {
    (navigation as any).navigate('FootballProgramWorkouts', { program });
  };

  const getDisplayName = (program: FootballProgram): string => {
    if (language === 'he') {
      return program.nameHe;
    }
    return program.name;
  };

  const getDisplayDescription = (program: FootballProgram): string => {
    if (language === 'he') {
      return program.descriptionHe;
    }
    return program.description;
  };

  const startQuickTraining = () => {
    Alert.alert('Football Training', 'Start Quick Training Session');
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: '#2A2A2A' }]}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#0A0E1A' }]}>
      {/* Sticky Football Header with Gradient */}
      <Animated.View style={styles.stickyHeader}>
        <LinearGradient
          colors={['#1A2332', '#0F1822']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerBackground}
        />

        <View style={styles.duolingoTopBar}>
          {/* Left Side - Streak */}
          <View style={[styles.topBarLeft, { marginTop: 15 }]}>
            <TouchableOpacity
              style={styles.duolingoItem}
              onPress={() => (navigation as any).navigate('Streak')}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBadge, { backgroundColor: hasTrainedToday ? 'rgba(34, 197, 94, 0.2)' : 'rgba(153, 153, 153, 0.2)' }]}>
                <MaterialCommunityIcons
                  name="fire"
                  size={24}
                  color={hasTrainedToday ? "#E94E1B" : "#999999"}
                />
              </View>
              <Text style={[
                styles.duolingoItemText,
                { color: hasTrainedToday ? '#FFFFFF' : '#999999' }
              ]}>
                {currentStreak}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Center - Football Logo/Text */}
          <View style={styles.topBarCenter}>
            <View style={styles.headerBadge}>
              <MaterialCommunityIcons name="soccer" size={24} color="#E94E1B" />
            </View>
            <Text style={styles.footballTitle}>FOOTBALL</Text>
            <Text style={styles.footballSubtitle}>TRAINING PRO</Text>
          </View>

          {/* Right Side - XP */}
          <View style={[styles.topBarRight, { marginTop: 15 }]}>
            <TouchableOpacity
              style={styles.duolingoItem}
              onPress={() => (navigation as any).navigate('Progress')}
              activeOpacity={0.7}
            >
              <Text style={[styles.duolingoItemText, { color: '#FFFFFF' }]}>
                {userXP}
              </Text>
              <View style={[styles.iconBadge, { backgroundColor: 'rgba(255, 184, 0, 0.2)' }]}>
                <MaterialCommunityIcons name="diamond" size={24} color="#E94E1B" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingTop: 120, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Weekly Progress Card */}
        <View style={styles.card}>
          <LinearGradient
            colors={['#1E3A5F', '#152D4A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientCard}
          >
            <View style={styles.statsHeader}>
              <View style={[styles.iconBadge, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                <MaterialCommunityIcons name="soccer" size={24} color="#E94E1B" />
              </View>
              <Text style={[styles.cardTitle, { color: 'white' }]}>
                This Week's Training
              </Text>
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={['#E94E1B', '#FF6B35']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.progressFill,
                    { width: `${(weeklyStats.completed / weeklyStats.target) * 100}%` }
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: '#E0E0E0' }]}>
                {weeklyStats.completed} / {weeklyStats.target} sessions completed
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsOverview}>
          <TouchableOpacity style={styles.statBox} activeOpacity={0.8}>
            <LinearGradient
              colors={['#2D1B4E', '#1E1333']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statBoxGradient}
            >
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 184, 0, 0.2)' }]}>
                <MaterialCommunityIcons name="trophy" size={28} color="#E94E1B" />
              </View>
              <Text style={[styles.statNumber, { color: 'white' }]}>
                {totalSessions}
              </Text>
              <Text style={[styles.statLabel, { color: '#B0B0B0' }]}>
                Total Sessions
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statBox} activeOpacity={0.8}>
            <LinearGradient
              colors={['#4A1E1E', '#331414']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statBoxGradient}
            >
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(255, 107, 53, 0.2)' }]}>
                <MaterialCommunityIcons name="fire" size={28} color="#FF6B35" />
              </View>
              <Text style={[styles.statNumber, { color: 'white' }]}>
                {currentStreak}
              </Text>
              <Text style={[styles.statLabel, { color: '#B0B0B0' }]}>
                Day Streak
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.statBox} activeOpacity={0.8}>
            <LinearGradient
              colors={['#1E4A3A', '#143329']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statBoxGradient}
            >
              <View style={[styles.statIconContainer, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
                <MaterialCommunityIcons name="chart-line" size={28} color="#E94E1B" />
              </View>
              <Text style={[styles.statNumber, { color: 'white' }]}>
                {Math.round((weeklyStats.completed / weeklyStats.target) * 100)}%
              </Text>
              <Text style={[styles.statLabel, { color: '#B0B0B0' }]}>
                Weekly Goal
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Training Programs - Dynamic from Database */}
        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: 'white' }]}>
            Training Programs
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesScrollContent}
          >
            {footballPrograms.map((program) => {
              const config = programConfig[program.id];
              const iconName = config?.icon || 'dumbbell';
              const iconColor = config?.color || '#E94E1B';

              return (
                <TouchableOpacity
                  key={program.id}
                  style={[styles.categoryCard, { backgroundColor: '#1E3A5F' }]}
                  onPress={() => handleProgramPress(program)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.programIconContainer, { backgroundColor: `${iconColor}25` }]}>
                    <MaterialCommunityIcons
                      name={iconName as any}
                      size={32}
                      color={iconColor}
                    />
                  </View>
                  <Text style={[styles.categoryTitle, { color: 'white' }]} numberOfLines={2}>
                    {language === 'he' ? program.nameHe : program.name}
                  </Text>
                  <Text style={[styles.categorySubtitle, { color: '#B0B0B0' }]} numberOfLines={2}>
                    {language === 'he' ? program.descriptionHe : program.description}
                  </Text>
                  <Text style={[styles.workoutCountText, { color: '#E94E1B' }]}>
                    {program.workouts.length} {language === 'he' ? 'אימונים' : 'workouts'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Quick Start Options */}
        <View style={styles.quickStartSection}>
          <Text style={[styles.sectionTitle, { color: 'white' }]}>
            Quick Start
          </Text>

          <TouchableOpacity
            style={[styles.quickStartCard, { backgroundColor: '#1E3A5F' }]}
            onPress={startQuickTraining}
          >
            <View style={styles.quickStartContent}>
              <View>
                <Text style={[styles.quickStartTitle, { color: 'white' }]}>
                  Aerobic Conditioning
                </Text>
                <Text style={[styles.quickStartSubtitle, { color: '#B0B0B0' }]}>
                  45 min • Cardio + ball skills
                </Text>
              </View>
              <MaterialCommunityIcons name="play-circle" size={48} color="#E94E1B" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        {recentActivities.length > 0 && (
          <View style={styles.recentActivitySection}>
            <Text style={[styles.sectionTitle, { color: 'white' }]}>
              Recent Activity
            </Text>

            {recentActivities.map((activity, index) => (
              <Card
                key={index}
                style={[styles.activityCard, { backgroundColor: '#1E3A5F' }]}
              >
                <Card.Content>
                  <View style={styles.activityContent}>
                    <View style={[styles.activityIcon, { backgroundColor: `${activity.color}20` }]}>
                      <MaterialCommunityIcons
                        name={activity.icon}
                        size={24}
                        color={activity.color}
                      />
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={[styles.activityTitle, { color: 'white' }]}>
                        {activity.type}
                      </Text>
                      <Text style={[styles.activityDetails, { color: '#B0B0B0' }]}>
                        {activity.date} • {activity.duration} min
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={24}
                      color="#E94E1B"
                    />
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={startQuickTraining}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#E94E1B', '#FF6B35']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <MaterialCommunityIcons name="play" size={24} color="white" />
          <Text style={styles.fabText}>Start Training</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 0,
    paddingTop: 0,
  },
  scrollView: {
    flex: 1,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    marginTop: 8,
  },
  footballSubtitle: {
    fontSize: 9,
    color: '#E94E1B',
    letterSpacing: 2,
    fontWeight: '600',
  },
  headerBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutIcon: {
    padding: 8,
    marginHorizontal: 4,
  },
  duolingoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 8,
  },
  duolingoItemText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientCard: {
    padding: 20,
    borderRadius: 16,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E94E1B',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  categoriesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: 0.5,
    paddingHorizontal: 16,
  },
  categoriesScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryCard: {
    width: width * 0.6,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
  },
  categorySubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
    minHeight: 32,
  },
  programIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
  quickStartSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  quickStartCard: {
    padding: 20,
    borderRadius: 12,
  },
  quickStartContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickStartTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  quickStartSubtitle: {
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#E94E1B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  fabGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    borderRadius: 30,
  },
  fabText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsOverview: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  statBoxGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  recentActivitySection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  activityCard: {
    marginBottom: 12,
    borderRadius: 12,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  activityDetails: {
    fontSize: 13,
  },
});

export default FootballTrainingScreen;
