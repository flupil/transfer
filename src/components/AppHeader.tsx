import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { getStreakData as getStreakDataService, getUserLevel } from '../services/progressTrackingService';
import { useAuth } from '../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const { width } = Dimensions.get('window');

const AppHeader = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [userXP, setUserXP] = useState(0);
  const [hasWorkedOutToday, setHasWorkedOutToday] = useState(false);
  const [isFootballMode, setIsFootballMode] = useState(false);

  useEffect(() => {
    loadStreakData();
    checkAppPurpose();
  }, [user?.id]);

  const checkAppPurpose = async () => {
    try {
      // First try AsyncStorage (fast)
      let savedPurpose = await AsyncStorage.getItem('appPurpose');
      console.log('[AppHeader] savedPurpose from AsyncStorage:', savedPurpose);

      // If not in AsyncStorage, try Firebase (for existing users)
      if (!savedPurpose && user?.id) {
        console.log('[AppHeader] Not in AsyncStorage, checking Firebase for user:', user.id);
        try {
          const userRef = doc(db, 'users', user.id);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            savedPurpose = userData.appPurpose || null;
            console.log('[AppHeader] Retrieved appPurpose from Firebase:', savedPurpose);

            // Cache to AsyncStorage for future use
            if (savedPurpose) {
              await AsyncStorage.setItem('appPurpose', savedPurpose);
              console.log('[AppHeader] Cached appPurpose to AsyncStorage');
            }
          }
        } catch (firebaseError) {
          console.error('[AppHeader] Error reading from Firebase:', firebaseError);
        }
      }

      console.log('[AppHeader] Setting isFootballMode to:', savedPurpose === 'football');
      setIsFootballMode(savedPurpose === 'football');
    } catch (error) {
      console.error('Error checking app purpose:', error);
    }
  };

  // Reload streak data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadStreakData();
      checkAppPurpose();
    }, [])
  );

  const loadStreakData = async () => {
    try {
      // Load streak from progressTrackingService (supports freezes)
      const streakData = await getStreakDataService();
      setCurrentStreak(streakData.workoutStreak);

      const today = new Date().toDateString();
      const lastWorkout = streakData.lastWorkoutDate ? new Date(streakData.lastWorkoutDate).toDateString() : null;
      setHasWorkedOutToday(lastWorkout === today);

      // Load XP
      if (user?.id) {
        try {
          const { experience } = await getUserLevel();
          setUserXP(experience);
        } catch (error) {
          setUserXP(0);
        }
      } else {
        setUserXP(0);
      }
    } catch (error) {
      console.error('Error loading streak data:', error);
      setCurrentStreak(0);
      setHasWorkedOutToday(false);
      setUserXP(0);
    }
  };

  console.log('[AppHeader] Rendering with isFootballMode:', isFootballMode);

  const styles = StyleSheet.create({
    header: {
      height: 120,
      position: 'relative',
      zIndex: 10,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 107, 53, 0.2)' : 'rgba(0, 0, 0, 0.05)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    headerBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 120,
      backgroundColor: colors.cardBackground,
    },
    headerContent: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingTop: 50,
      height: 120,
      zIndex: 100,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    headerCenter: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      flex: 1,
    },
    headerItem: {
      alignItems: 'center',
    },
    headerItemText: {
      fontSize: 17,
      fontWeight: '700',
      marginTop: 4,
    },
    workoutIcon: {
      padding: 8,
      marginHorizontal: 4,
    },
    logo: {
      width: 80,
      height: 80,
    },
    footballHeader: {
      height: 120,
      position: 'relative',
      zIndex: 10,
    },
    footballHeaderBackground: {
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
    footballHeaderContent: {
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
      zIndex: 100,
    },
    footballHeaderItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      gap: 4,
    },
    footballTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
      letterSpacing: 1,
    },
    footballSubtitle: {
      fontSize: 12,
      fontWeight: '600',
      color: '#22C55E',
      letterSpacing: 0.5,
      marginTop: -2,
    },
    footballLogo: {
      width: 60,
      height: 60,
    },
    accountButton: {
      padding: 8,
    },
  });

  if (isFootballMode) {
    return (
      <View style={styles.footballHeader}>
        <View style={[styles.footballHeaderBackground, { backgroundColor: '#0D1B2A' }]} />

        <View style={styles.footballHeaderContent}>
          {/* Left Side - Streak */}
          <View style={[styles.headerLeft, { marginTop: 15 }]}>
            <TouchableOpacity
              style={styles.footballHeaderItem}
              onPress={() => navigation.navigate('Streak' as never)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="fire"
                size={30}
                color={hasWorkedOutToday ? "#22C55E" : "#999999"}
              />
              <Text style={[
                styles.headerItemText,
                { color: hasWorkedOutToday ? colors.text : '#999999' }
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
            style={styles.headerCenter}
            onPress={() => navigation.navigate('Settings' as never)}
            activeOpacity={0.7}
          >
            <Text style={styles.footballTitle}>FOOTBALL</Text>
            <Text style={styles.footballSubtitle}>TRAINING</Text>
          </TouchableOpacity>

          {/* Right Side - XP and Account */}
          <View style={[styles.headerRight, { marginTop: 15 }]}>
            <TouchableOpacity
              style={styles.footballHeaderItem}
              onPress={() => navigation.navigate('Progress' as never)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="diamond" size={30} color="#FFB800" />
              <Text style={[styles.headerItemText, { color: colors.text }]}>
                {userXP}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footballHeaderItem}
              onPress={() => {}}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="account-group" size={30} color="#22C55E" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.header}>
      <View style={styles.headerBackground} />

      <View style={styles.headerContent}>
        {/* Left Side - Streak */}
        <View style={[styles.headerLeft, { marginTop: 15, paddingLeft: 25 }]}>
          <TouchableOpacity
            style={styles.headerItem}
            onPress={() => navigation.navigate('Streak' as never)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="fire"
              size={30}
              color={hasWorkedOutToday ? "#FF6B35" : "#999999"}
            />
            <Text style={[
              styles.headerItemText,
              { color: hasWorkedOutToday ? colors.text : '#999999' }
            ]}>
              {currentStreak}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Center - Logo */}
        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() => navigation.navigate('Settings' as never)}
          activeOpacity={0.7}
        >
          <Image
            source={require('../assets/logotransparent.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Right Side - XP */}
        <View style={[styles.headerRight, { marginTop: 15, paddingRight: 25 }]}>
          <TouchableOpacity
            style={styles.headerItem}
            onPress={() => navigation.navigate('Progress' as never)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="diamond"
              size={30}
              color="#1CB0F6"
            />
            <Text style={[styles.headerItemText, { color: colors.text }]}>
              {userXP}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default AppHeader;
