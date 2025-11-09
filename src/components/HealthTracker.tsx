import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Card, ProgressBar, IconButton, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getSafeDatabase } from '../database/databaseHelper';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';

interface HealthTrackerProps {
  type: 'steps' | 'sleep' | 'rest';
  compact?: boolean;
}

const HealthTracker: React.FC<HealthTrackerProps> = ({ type, compact = false }) => {
  const { user } = useAuth();
  const [value, setValue] = useState(0);
  const [goal, setGoal] = useState(() => {
    switch (type) {
      case 'steps': return 10000;
      case 'sleep': return 8;
      case 'rest': return 1;
      default: return 0;
    }
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showTimePicker, setShowTimePicker] = useState<boolean | 'start' | 'end'>(false);
  const [sleepTime, setSleepTime] = useState({ start: new Date(), end: new Date() });

  useEffect(() => {
    loadTodayData();
    loadUserGoal();
  }, [type]);

  const loadTodayData = async () => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      const today = format(new Date(), 'yyyy-MM-dd');
      const result = await db.getAllAsync(
        'SELECT value FROM health_tracking WHERE userId = ? AND date = ? AND type = ?',
        [user?.id || '', today, type]
      );

      if (result && result[0]) {
        setValue((result[0] as any).value || 0);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load your health data. Please try again.');
      console.error(`Error loading ${type} data:`, error);
    }
  };

  const loadUserGoal = async () => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      const result = await db.getAllAsync(
        `SELECT ${type}Goal FROM user_preferences WHERE userId = ?`,
        [user?.id || '']
      );

      if (result && result[0]) {
        const goalValue = (result[0] as any)[`${type}Goal`];
        if (goalValue) setGoal(goalValue);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load your goal settings. Using default goal.');
      console.error(`Error loading ${type} goal:`, error);
    }
  };

  const saveData = async (newValue: number) => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date().toISOString();

      // Check if entry exists
      const existing = await db.getAllAsync(
        'SELECT id FROM health_tracking WHERE userId = ? AND date = ? AND type = ?',
        [user?.id || '', today, type]
      );

      if (existing && existing.length > 0) {
        // Update existing
        await db.runAsync(
          'UPDATE health_tracking SET value = ?, updatedAt = ? WHERE userId = ? AND date = ? AND type = ?',
          [newValue, now, user?.id || '', today, type]
        );
      } else {
        // Insert new
        await db.runAsync(
          'INSERT INTO health_tracking (userId, date, type, value, createdAt) VALUES (?, ?, ?, ?, ?)',
          [user?.id || '', today, type, newValue, now]
        );
      }

      setValue(newValue);
      setModalVisible(false);
      setInputValue('');
    } catch (error) {
      Alert.alert('Error', `Failed to save ${type} data. Please try again.`);
      console.error(`Error saving ${type} data:`, error);
    }
  };

  const handleQuickAdd = (amount: number) => {
    const newValue = type === 'steps' ? value + amount : amount;
    saveData(newValue);
  };

  const handleManualInput = () => {
    const numValue = parseFloat(inputValue);
    if (isNaN(numValue) || numValue < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number');
      return;
    }
    saveData(numValue);
  };

  const calculateSleepHours = () => {
    const diff = sleepTime.end.getTime() - sleepTime.start.getTime();
    const hours = diff / (1000 * 60 * 60);
    return Math.round(hours * 10) / 10; // Round to 1 decimal
  };

  const getIcon = () => {
    switch (type) {
      case 'steps': return 'walk';
      case 'sleep': return 'sleep';
      case 'rest': return 'meditation';
      default: return 'heart';
    }
  };

  const getColor = () => {
    switch (type) {
      case 'steps': return '#4CAF50';
      case 'sleep': return '#673AB7';
      case 'rest': return '#FF9800';
      default: return '#2196F3';
    }
  };

  const getUnit = () => {
    switch (type) {
      case 'steps': return 'steps';
      case 'sleep': return 'hours';
      case 'rest': return 'days';
      default: return '';
    }
  };

  const progress = Math.min(value / goal, 1);
  const percentage = Math.round(progress * 100);
  const color = getColor();

  if (compact) {
    return (
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Card style={styles.compactCard}>
          <Card.Content>
            <View style={styles.compactHeader}>
              <MaterialCommunityIcons name={getIcon() as any} size={24} color={color} />
              <Text style={styles.compactTitle}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </View>
            <Text style={[styles.compactValue, { color }]}>
              {value.toLocaleString()}
            </Text>
            <Text style={styles.compactGoal}>
              / {goal.toLocaleString()} {getUnit()}
            </Text>
            <ProgressBar
              progress={progress}
              color={color}
              style={styles.compactProgressBar}
            />
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  }

  return (
    <>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.titleSection}>
              <MaterialCommunityIcons name={getIcon() as any} size={28} color={color} />
              <Text style={styles.title}>
                {type.charAt(0).toUpperCase() + type.slice(1)} Tracking
              </Text>
            </View>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => setModalVisible(true)}
            />
          </View>

          <View style={styles.mainContent}>
            <Text style={[styles.valueText, { color }]}>
              {value.toLocaleString()}
            </Text>
            <Text style={styles.unitText}>{getUnit()}</Text>
            <Text style={styles.goalText}>
              Goal: {goal.toLocaleString()} {getUnit()}
            </Text>
          </View>

          <ProgressBar
            progress={progress}
            color={color}
            style={styles.progressBar}
          />

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color }]}>{percentage}%</Text>
              <Text style={styles.statLabel}>Complete</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.max(0, goal - value).toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Remaining</Text>
            </View>
          </View>

          {type === 'steps' && (
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.quickButton, { backgroundColor: color + '20' }]}
                onPress={() => handleQuickAdd(1000)}
              >
                <Text style={[styles.quickButtonText, { color }]}>+1,000</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickButton, { backgroundColor: color + '20' }]}
                onPress={() => handleQuickAdd(2500)}
              >
                <Text style={[styles.quickButtonText, { color }]}>+2,500</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickButton, { backgroundColor: color + '20' }]}
                onPress={() => handleQuickAdd(5000)}
              >
                <Text style={[styles.quickButtonText, { color }]}>+5,000</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card.Content>
      </Card>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Update {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setModalVisible(false)}
              />
            </View>

            <View style={styles.modalBody}>
              {type === 'sleep' ? (
                <>
                  <Text style={styles.inputLabel}>Sleep Time</Text>
                  <View style={styles.sleepTimeRow}>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => setShowTimePicker('start')}
                    >
                      <Text>Bedtime</Text>
                      <Text style={styles.timeText}>
                        {format(sleepTime.start, 'h:mm a')}
                      </Text>
                    </TouchableOpacity>
                    <MaterialCommunityIcons name="arrow-right" size={24} color="#666" />
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => setShowTimePicker('end')}
                    >
                      <Text>Wake up</Text>
                      <Text style={styles.timeText}>
                        {format(sleepTime.end, 'h:mm a')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.calculatedHours}>
                    Total: {calculateSleepHours()} hours
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.inputLabel}>
                    Enter {type === 'steps' ? 'Steps' : 'Rest Days'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={inputValue}
                    onChangeText={setInputValue}
                    keyboardType="numeric"
                    placeholder={`Enter ${getUnit()}`}
                  />
                </>
              )}

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setModalVisible(false)}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={() => {
                    if (type === 'sleep') {
                      saveData(calculateSleepHours());
                    } else {
                      handleManualInput();
                    }
                  }}
                  style={styles.modalButton}
                  buttonColor={color}
                >
                  Save
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {showTimePicker && (
        <DateTimePicker
          value={showTimePicker === 'start' ? sleepTime.start : sleepTime.end}
          mode="time"
          is24Hour={false}
          display="default"
          onChange={(event: any, selectedTime?: Date) => {
            setShowTimePicker(false);
            if (selectedTime) {
              setSleepTime({
                ...sleepTime,
                [showTimePicker as 'start' | 'end']: selectedTime,
              });
            }
          }}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 10,
    elevation: 2,
    backgroundColor: 'white',
  },
  compactCard: {
    margin: 5,
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
    marginBottom: 20,
  },
  valueText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  unitText: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  goalText: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    marginVertical: 15,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  quickButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  quickButtonText: {
    fontWeight: '600',
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
  },
  compactValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  compactGoal: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  compactProgressBar: {
    height: 6,
    borderRadius: 3,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  sleepTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  timeButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 5,
  },
  calculatedHours: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
  },
});

export default HealthTracker;