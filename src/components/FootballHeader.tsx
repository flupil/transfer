import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FootballHeaderProps {
  navigation: any;
}

const FootballHeader: React.FC<FootballHeaderProps> = ({ navigation }) => {
  const { colors } = useTheme();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [hasTrainedToday, setHasTrainedToday] = useState(false);
  const [userXP, setUserXP] = useState(0);

  useEffect(() => {
    loadHeaderData();
  }, []);

  const loadHeaderData = async () => {
    try {
      // Load header data - placeholder for now
      setCurrentStreak(7);
      setHasTrainedToday(true);
      setUserXP(340);
    } catch (error) {
      console.error('Failed to load header data:', error);
    }
  };

  return (
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
              color={hasTrainedToday ? "#E94E1B" : "#999999"}
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
            <MaterialCommunityIcons name="soccer" size={28} color="#E94E1B" />
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
            <MaterialCommunityIcons name="diamond" size={30} color="#E94E1B" />
            <Text style={[styles.duolingoItemText, { color: colors.text }]}>
              {userXP}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.duolingoItem}
            onPress={() => {}}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="account-group" size={30} color="#E94E1B" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
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
    color: '#E94E1B',
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
});

export default FootballHeader;
