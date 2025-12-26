import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { getStreakData, getUserLevel } from '../services/progressTrackingService';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import { BRAND_COLORS } from '../constants/brandColors';

interface CustomHeaderProps {
  onFriendStreakPress?: () => void;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ onFriendStreakPress }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();

  // Generate styles with theme colors
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [currentStreak, setCurrentStreak] = useState(0);
  const [userXP, setUserXP] = useState(0);
  const [hasWorkedOutToday, setHasWorkedOutToday] = useState(false);
  const [isFootballMode, setIsFootballMode] = useState(false);

  useEffect(() => {
    loadHeaderData();
  }, [user?.id]);

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadHeaderData();
    }, [user?.id])
  );

  const loadHeaderData = async () => {
    if (!user?.id) return;

    try {
      // Check app purpose (football vs gym mode)
      const appPurpose = await AsyncStorage.getItem('appPurpose');
      setIsFootballMode(appPurpose === 'football');

      // Load streak data
      const streakData = await getStreakData();
      logger.debug('🔥', 'CustomHeader streak data:', streakData);
      setCurrentStreak(streakData.workoutStreak || 0);

      const lastWorkoutDate = streakData.lastWorkoutDate ? new Date(streakData.lastWorkoutDate).toDateString() : null;
      const todayDate = new Date().toDateString();
      const workedOutToday = !!streakData.lastWorkoutDate && lastWorkoutDate === todayDate;

      logger.debug('🔥', 'CustomHeader lastWorkoutDate:', lastWorkoutDate);
      logger.debug('🔥', 'CustomHeader todayDate:', todayDate);
      logger.debug('🔥', 'CustomHeader workedOutToday (from service):', workedOutToday);

      setHasWorkedOutToday(workedOutToday);

      // Also check completed workouts from AsyncStorage (same as TryScreen)
      const stored = await AsyncStorage.getItem('completedWorkouts');
      logger.debug('🔥', 'CustomHeader completedWorkouts:', stored);
      if (stored) {
        const completedArray = JSON.parse(stored);
        const today = new Date();
        const todayKey = `1-${today.getDay() === 0 ? 6 : today.getDay() - 1}`;

        logger.debug('🔥', 'CustomHeader todayKey:', todayKey);
        logger.debug('🔥', 'CustomHeader completedArray:', completedArray);
        logger.debug('🔥', 'CustomHeader includes todayKey:', completedArray.includes(todayKey));

        if (completedArray.includes(todayKey)) {
          logger.debug('🔥', 'CustomHeader Setting hasWorkedOutToday to TRUE from AsyncStorage');
          setHasWorkedOutToday(true);
        }
      }

      // Load user level/XP
      const levelData = await getUserLevel();
      setUserXP(levelData.experience || 0);
    } catch (error) {
      logger.error('Error loading header data:', error);
    }
  };

  return (
    <View style={styles.headerBackground}>
      <View style={styles.duolingoTopBar}>
        {/* Left Side - Streak and Workout Icon */}
        <View style={[styles.topBarLeft, { marginTop: 15 }]}>
          <TouchableOpacity
            style={styles.duolingoItem}
            onPress={() => (navigation as any).navigate('Streak')}
            activeOpacity={0.7}
            accessibilityLabel={`Workout streak: ${currentStreak} days`}
          >
            <MaterialCommunityIcons
              name="fire"
              size={30}
              color={BRAND_COLORS.accent}
            />
            <Text style={[
              styles.duolingoItemText,
              { color: BRAND_COLORS.accent }
            ]}>
              {currentStreak}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.workoutIcon}
            onPress={() => (navigation as any).navigate('Workout')}
            accessibilityLabel="Go to workout"
          >
            <MaterialCommunityIcons
              name={isFootballMode ? "soccer" : "dumbbell"}
              size={28}
              color={BRAND_COLORS.accent}
            />
          </TouchableOpacity>
        </View>

        {/* Center - Logo or Football Text */}
        <TouchableOpacity
          style={styles.topBarCenter}
          onPress={() => (navigation as any).navigate('Settings')}
          activeOpacity={0.7}
          accessibilityLabel="Open settings"
        >
          {isFootballMode ? (
            <>
              <Text style={styles.footballTitle}>FOOTBALL</Text>
              <Text style={styles.footballSubtitle}>TRAINING</Text>
            </>
          ) : (
            <Image
              source={require('../../assets/gym-branding/logo-new.png')}
              style={styles.topBarLogo}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>

        {/* Right Side - XP and Account */}
        <View style={[styles.topBarRight, { marginTop: 15 }]}>
          <TouchableOpacity
            style={styles.duolingoItem}
            onPress={() => (navigation as any).navigate('Progress')}
            activeOpacity={0.7}
            accessibilityLabel={`Experience points: ${userXP}`}
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
            style={[styles.duolingoItem, { zIndex: 1000 }]}
            onPress={() => {
              console.log('🟢 Friend streak button pressed!');
              // Try multiple navigation strategies
              try {
                if (onFriendStreakPress) {
                  onFriendStreakPress();
                } else {
                  // Fallback: navigate to Streak screen as a test
                  Alert.alert('Friend Streak', 'Button is working! Feature coming soon.');
                }
              } catch (error) {
                console.error('Navigation error:', error);
                Alert.alert('Error', 'Could not open friend streaks');
              }
            }}
            activeOpacity={0.7}
            accessibilityLabel="View friend streaks"
          >
            <MaterialCommunityIcons
              name="account-group"
              size={30}
              color="#58CC02"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.duolingoItem}
            onPress={() => (navigation as any).navigate('Profile')}
            activeOpacity={0.7}
            accessibilityLabel="View profile"
          >
            <MaterialCommunityIcons
              name="account-circle"
              size={30}
              color={BRAND_COLORS.accent}
            />
          </TouchableOpacity>
        </View>
      </View>
      {/* Bottom separator line */}
      <View style={styles.headerSeparator} />
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  headerBackground: {
    backgroundColor: colors.background,
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
  topBarLogo: {
    width: 100,
    height: 100,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
  logoPlaceholderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666666',
  },
  footballTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: BRAND_COLORS.accent,
    letterSpacing: 1,
  },
  footballSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
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
});

export default CustomHeader;
