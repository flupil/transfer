import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { getStreakData, getUserLevel } from '../services/progressTrackingService';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';

const CustomHeader = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [userXP, setUserXP] = useState(0);
  const [hasWorkedOutToday, setHasWorkedOutToday] = useState(false);

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
              color={hasWorkedOutToday ? "#FF6B35" : "#999999"}
            />
            <Text style={[
              styles.duolingoItemText,
              { color: hasWorkedOutToday ? colors.text : '#999999' }
            ]}>
              {currentStreak}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.workoutIcon}
            onPress={() => (navigation as any).navigate('Workout')}
            accessibilityLabel="Go to workout"
          >
            <MaterialCommunityIcons name="dumbbell" size={28} color="#FF6B6B" />
          </TouchableOpacity>
        </View>

        {/* Center - Logo */}
        <TouchableOpacity
          style={styles.topBarCenter}
          onPress={() => (navigation as any).navigate('Settings')}
          activeOpacity={0.7}
          accessibilityLabel="Open settings"
        >
          <Image
            source={require('../assets/logotransparent.png')}
            style={styles.topBarLogo}
            resizeMode="contain"
          />
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
            <Text style={[styles.duolingoItemText, { color: colors.text }]}>
              {userXP}
            </Text>
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
              color="#FFB800"
            />
          </TouchableOpacity>
        </View>
      </View>
      {/* Bottom separator line */}
      <View style={styles.headerSeparator} />
    </View>
  );
};

const styles = StyleSheet.create({
  headerBackground: {
    backgroundColor: '#000',
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
    width: 80,
    height: 80,
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
    backgroundColor: '#2A2A2A',
  },
});

export default CustomHeader;
