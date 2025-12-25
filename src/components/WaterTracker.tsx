import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { Card, ProgressBar, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../contexts/AuthContext';
import { useNutrition } from '../contexts/NutritionContext';
import { getSafeDatabase } from '../database/databaseHelper';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

interface WaterTrackerProps {
  compact?: boolean;
}

const WaterTracker: React.FC<WaterTrackerProps> = ({ compact = false }) => {
  const { user } = useAuth();
  const nutrition = useNutrition();
  const [animationValue] = useState(new Animated.Value(0));

  const glassSize = 250; // 250ml per glass
  const bottleSize = 500; // 500ml per bottle

  // Get water data from NutritionContext (single source of truth)
  const waterIntake = nutrition.currentDiary?.waterIntake || 0;
  const dailyGoal = nutrition.currentDiary?.targets.water || 2000;

  useEffect(() => {
    animateProgress();
  }, [waterIntake]);

  const addWater = async (amount: number) => {
    try {
      // Haptic feedback on water addition
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Use NutritionContext as single entry point (consolidation)
      await nutrition.addWater(amount);

      // Animate the addition
      Animated.sequence([
        Animated.timing(animationValue, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animationValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

    } catch (error) {
      console.error('Error adding water:', error);
      // Error alert is already handled by NutritionContext
    }
  };

  const removeWater = async (amount: number) => {
    // Feature intentionally not implemented - users can reset water in settings
    Alert.alert('Coming Soon', 'Remove water feature will be available soon.');
  };

  const animateProgress = () => {
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const progress = Math.min(waterIntake / dailyGoal, 1);
  const percentage = Math.round(progress * 100);
  const glasses = Math.floor(waterIntake / glassSize);

  if (compact) {
    return (
      <Card style={styles.compactCard}>
        <Card.Content>
          <View style={styles.compactHeader}>
            <MaterialCommunityIcons name="water" size={24} color="#3B82F6" />
            <Text style={styles.compactTitle}>Water</Text>
            <Text style={styles.compactValue}>
              {(waterIntake / 1000).toFixed(1)}L / {(dailyGoal / 1000).toFixed(0)}L
            </Text>
          </View>
          <ProgressBar
            progress={progress}
            color="#3B82F6"
            style={styles.compactProgressBar}
          />
          <View style={styles.compactActions}>
            <TouchableOpacity
              style={styles.compactButton}
              onPress={() => addWater(glassSize)}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <Text style={styles.compactPercentage}>{percentage}%</Text>
            <TouchableOpacity
              style={styles.compactButton}
              onPress={() => removeWater(glassSize)}
            >
              <MaterialCommunityIcons name="minus" size={20} color="#666" />
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleSection}>
            <MaterialCommunityIcons name="water" size={28} color="#3B82F6" />
            <Text style={styles.title}>Water Intake</Text>
          </View>
          <TouchableOpacity
            style={styles.settingsButton}
            accessibilityLabel="Water settings"
          >
            <MaterialCommunityIcons name="cog" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.mainContent,
            { transform: [{ scale: animationValue }] }
          ]}
        >
          <View style={styles.circularProgress}>
            <View style={styles.waterDrop}>
              <MaterialCommunityIcons name="water" size={40} color="#3B82F6" />
            </View>
            <Text style={styles.intakeText}>
              {(waterIntake / 1000).toFixed(1)}L
            </Text>
            <Text style={styles.goalText}>
              of {(dailyGoal / 1000).toFixed(1)}L goal
            </Text>
          </View>

          <ProgressBar
            progress={progress}
            color="#3B82F6"
            style={styles.progressBar}
          />

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{glasses}</Text>
              <Text style={styles.statLabel}>Glasses</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: percentage >= 100 ? '#E94E1B' : '#3B82F6' }]}>
                {percentage}%
              </Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.max(0, dailyGoal - waterIntake)}ml
              </Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.quickAddSection}>
          <Text style={styles.quickAddTitle}>Quick Add</Text>
          <View style={styles.quickAddButtons}>
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => addWater(glassSize)}
            >
              <MaterialCommunityIcons name="cup" size={24} color="#3B82F6" />
              <Text style={styles.quickAddText}>Glass</Text>
              <Text style={styles.quickAddAmount}>{glassSize}ml</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => addWater(bottleSize)}
            >
              <MaterialCommunityIcons name="water" size={24} color="#3B82F6" />
              <Text style={styles.quickAddText}>Bottle</Text>
              <Text style={styles.quickAddAmount}>{bottleSize}ml</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => addWater(1000)}
            >
              <MaterialCommunityIcons name="water-outline" size={24} color="#3B82F6" />
              <Text style={styles.quickAddText}>1 Liter</Text>
              <Text style={styles.quickAddAmount}>1000ml</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => addWater(100)}
            >
              <MaterialCommunityIcons name="plus" size={24} color="#3B82F6" />
              <Text style={styles.quickAddText}>Custom</Text>
              <Text style={styles.quickAddAmount}>100ml</Text>
            </TouchableOpacity>
          </View>
        </View>

        {waterIntake > 0 && (
          <TouchableOpacity
            style={styles.undoButton}
            onPress={() => removeWater(glassSize)}
          >
            <MaterialCommunityIcons name="undo" size={20} color="#666" />
            <Text style={styles.undoText}>Undo last glass</Text>
          </TouchableOpacity>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 10,
    elevation: 2,
    backgroundColor: 'white',
  },
  compactCard: {
    margin: 10,
    elevation: 2,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  mainContent: {
    alignItems: 'center',
  },
  circularProgress: {
    alignItems: 'center',
    marginBottom: 20,
  },
  waterDrop: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  intakeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  goalText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    marginVertical: 20,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quickAddSection: {
    marginTop: 20,
  },
  quickAddTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  quickAddButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickAddButton: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    margin: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  quickAddText: {
    fontSize: 12,
    color: '#333',
    marginTop: 5,
  },
  quickAddAmount: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    padding: 12,
    minHeight: 44,
    gap: 8,
  },
  settingsButton: {
    padding: 10,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  undoText: {
    fontSize: 14,
    color: '#666',
  },
  // Compact styles
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  compactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  compactValue: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  compactProgressBar: {
    height: 6,
    borderRadius: 3,
    marginBottom: 10,
  },
  compactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactButton: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
});

export default WaterTracker;