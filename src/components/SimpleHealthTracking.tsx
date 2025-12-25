import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useNutrition } from '../contexts/NutritionContext';

const { width } = Dimensions.get('window');

const SimpleHealthTracking: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const nutrition = useNutrition();
  const [animatedScale] = useState(new Animated.Value(1));
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [customAmount, setCustomAmount] = useState('250');
  const [selectedType, setSelectedType] = useState<'cup' | 'bottle' | 'custom'>('cup');
  const [isAddMode, setIsAddMode] = useState(true); // true = add, false = remove

  // Get water data from NutritionContext (single source of truth)
  const waterIntake = nutrition.currentDiary?.waterIntake || 0;
  const waterTarget = nutrition.currentDiary?.targets.water || 2000;

  const handleOpenWaterModal = () => {
    // Animate button press
    Animated.sequence([
      Animated.timing(animatedScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedScale, {
        toValue: 1.1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Reset to default cup selection and add mode
    setSelectedType('cup');
    setCustomAmount('250');
    setIsAddMode(true);
    setShowWaterModal(true);
  };

  const handleAddWater = async (amount: number) => {
    try {
      // Use NutritionContext as single entry point (consolidation)
      await nutrition.addWater(amount);
      setShowWaterModal(false);
      setCustomAmount('');

      // Show encouraging message if goal reached
      const newWaterIntake = waterIntake + amount;
      if (newWaterIntake >= waterTarget && waterIntake < waterTarget) {
        Alert.alert('🎉 Goal Reached!', 'Great job staying hydrated!');
      }
    } catch (error) {
      console.error('Failed to add water:', error);
      // Error alert is already handled by NutritionContext
    }
  };

  const handleCustomAdd = () => {
    const amount = parseInt(customAmount);
    if (amount && amount > 0) {
      handleAddWater(amount);
    }
  };

  const waterPercentage = Math.min((waterIntake / waterTarget) * 100, 100);
  return (
    <View style={styles.container}>
      {/* Top Row */}
      <View style={styles.row}>
        {/* Water Card - Wide */}
        <View style={[styles.card, styles.wideCard, styles.tallCard, styles.waterCardLayout, {
          backgroundColor: 'rgba(100, 181, 246, 0.5)'
        }]}>
          <MaterialCommunityIcons name="water" size={30} color="#64B5F6" />
          <View style={styles.waterTextCentered}>
            <Text style={[styles.mainValue, { color: 'white' }]}>{waterIntake}ml</Text>
            <Text style={[styles.label, { color: 'white' }]}>Water Intake</Text>
          </View>
          <Animated.View style={{ transform: [{ scale: animatedScale }] }}>
            <TouchableOpacity
              style={[styles.plusButton, { backgroundColor: '#64B5F6' }]}
              onPress={handleOpenWaterModal}
            >
              <Text style={[styles.plusText, { color: '#FFF' }]}>+</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Progress Card - Narrow */}
        <View style={[styles.card, styles.narrowCard, styles.tallCard, {
          backgroundColor: 'rgba(100, 181, 246, 0.5)'
        }]}>
          <View style={[styles.progressRing, { borderColor: '#e5e5e5' }]}>
            <Text style={[styles.progressValue, { color: 'white' }]}>
              {Math.round(waterPercentage)}%
            </Text>
          </View>
          <View style={styles.progressRingFill}>
            <View
              style={[
                styles.progressFillInner,
                {
                  height: `${waterPercentage}%`,
                  backgroundColor: waterPercentage >= 100 ? '#E94E1B' : '#64B5F6',
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Bottom Row */}
      <View style={styles.row}>
        {/* Distance Card - Narrow */}
        <View style={[styles.card, styles.narrowCard, styles.shortCard, {
          backgroundColor: 'rgba(255, 167, 38, 0.5)'
        }]}>
          <MaterialCommunityIcons name="map-marker" size={26} color="#FFA726" />
          <View style={styles.emptyStateContainer}>
            <Text style={[styles.distanceValue, { color: 'white' }]}>--</Text>
            <Text style={[styles.emptyStateHint, { color: 'rgba(255, 255, 255, 0.8)' }]}>
              Connect wearable
            </Text>
          </View>
        </View>

        {/* Steps Card - Wide */}
        <View style={[styles.card, styles.wideCard, styles.shortCard, styles.stepsCard, {
          backgroundColor: 'rgba(255, 167, 38, 0.5)'
        }]}>
          <View style={styles.stepsLeft}>
            <MaterialCommunityIcons name="walk" size={26} color="#FFA726" />
            <View style={styles.stepsContent}>
              <Text style={[styles.stepsValue, { color: 'white' }]}>--</Text>
              <Text style={[styles.emptyStateHint, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                Sync your fitness tracker to see steps
              </Text>
            </View>
          </View>
          <View style={styles.dots}>
            <View style={[styles.dot, { backgroundColor: '#FFA726' }]} />
            <View style={[styles.dot, { backgroundColor: '#FFA726' }]} />
            <View style={[styles.dot, { backgroundColor: '#FFA726' }]} />
          </View>
        </View>
      </View>

      {/* Water Modal */}
      <Modal
        visible={showWaterModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWaterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
            {/* Toggle Switch and Title */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isAddMode ? 'הוספת צריכת מים' : 'הפחתת צריכת מים'}
              </Text>
              <TouchableOpacity
                style={styles.toggleContainer}
                onPress={() => setIsAddMode(!isAddMode)}
              >
                <View style={[styles.toggleSwitch, { backgroundColor: isAddMode ? '#E94E1B' : '#E94E1B' }]}>
                  <View style={[styles.toggleCircle, { alignSelf: isAddMode ? 'flex-end' : 'flex-start' }]} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Water Circle Display */}
            <View style={styles.waterCircleContainer}>
              <View style={[styles.waterCircle, { backgroundColor: '#E3F2FD' }]}>
                <View style={styles.waterCircleContent}>
                  <Text style={styles.waterAmountText}>{waterIntake} / {waterTarget}</Text>
                  <Text style={styles.mlText}>מ״ל</Text>
                </View>
              </View>
            </View>

            {/* Preset Amounts */}
            <Text style={[styles.sectionLabel, { color: colors.text }]}>כמות:</Text>
            <View style={styles.presetButtons}>
              <TouchableOpacity
                style={[
                  styles.presetButton,
                  selectedType === 'cup' && styles.presetButtonActive,
                  { backgroundColor: selectedType === 'cup' ? '#64B5F6' : '#F5F5F5' }
                ]}
                onPress={() => {
                  setSelectedType('cup');
                  setCustomAmount('250');
                }}
              >
                <View style={styles.presetButtonContent}>
                  <MaterialCommunityIcons
                    name="cup"
                    size={20}
                    color={selectedType === 'cup' ? '#FFF' : '#666'}
                  />
                  <Text style={[
                    styles.presetButtonText,
                    { color: selectedType === 'cup' ? '#FFF' : '#666' }
                  ]}>
                    כוס (250מ״ל)
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.presetButton,
                  selectedType === 'bottle' && styles.presetButtonActive,
                  { backgroundColor: selectedType === 'bottle' ? '#64B5F6' : '#F5F5F5' }
                ]}
                onPress={() => {
                  setSelectedType('bottle');
                  setCustomAmount('500');
                }}
              >
                <View style={styles.presetButtonContent}>
                  <MaterialCommunityIcons
                    name="water"
                    size={20}
                    color={selectedType === 'bottle' ? '#FFF' : '#666'}
                  />
                  <Text style={[
                    styles.presetButtonText,
                    { color: selectedType === 'bottle' ? '#FFF' : '#666' }
                  ]}>
                    בקבוק (500מ״ל)
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Custom Amount */}
            <TouchableOpacity
              style={[styles.customButton, { backgroundColor: '#F5F5F5' }]}
              onPress={() => setSelectedType('custom')}
            >
              <MaterialCommunityIcons name="pencil" size={20} color="#64B5F6" />
              <TextInput
                style={[styles.customInput, { color: colors.text }]}
                placeholder="כמות מותאמת"
                placeholderTextColor={colors.textSecondary}
                value={selectedType === 'custom' ? customAmount : ''}
                onChangeText={(text) => {
                  setSelectedType('custom');
                  setCustomAmount(text);
                }}
                keyboardType="numeric"
              />
            </TouchableOpacity>

            {/* Add/Remove Button */}
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: isAddMode ? '#64B5F6' : '#E94E1B' }]}
              onPress={() => {
                const amount = parseInt(customAmount);
                if (amount && amount > 0) {
                  if (isAddMode) {
                    handleAddWater(amount);
                  } else {
                    handleAddWater(-amount); // Remove water by passing negative amount
                  }
                }
              }}
            >
              <Text style={styles.addButtonText}>
                {isAddMode ? 'הוספה' : 'הפחתה'} {customAmount} מ״ל
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideCard: {
    flex: 1,
  },
  narrowCard: {
    width: 100,
  },
  tallCard: {
    height: 100,
  },
  shortCard: {
    height: 100,
  },
  stepsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 20,
    paddingRight: 15,
  },
  stepsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    flex: 1,
  },
  waterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  waterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waterTextContainer: {
    alignItems: 'flex-start',
  },
  waterCardLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  waterTextCentered: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  mainValue: {
    fontSize: 30,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: '#FFFFFF',
    marginTop: 2,
  },
  plusButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E1F5FE',  // Light blue button
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#64B5F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  plusText: {
    fontSize: 24,
    color: '#64B5F6',  // Darker blue text on light blue button
    fontWeight: '300',
    lineHeight: 26,
  },
  waterCardBackground: {
    backgroundColor: '#64B5F6',  // Darker blue background for water card
  },
  progressCardBackground: {
    backgroundColor: '#64B5F6',  // Darker blue background for progress card
  },
  distanceCardBackground: {
    backgroundColor: '#FFB74D',  // Darker orange background for distance card
  },
  stepsCardBackground: {
    backgroundColor: '#FFB74D',  // Darker orange background for steps card
  },
  progressRing: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    borderWidth: 7,
    borderColor: '#E1F5FE',  // Light blue ring to match the switched colors
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  progressRingFill: {
    position: 'absolute',
    width: 85,
    height: 85,
    borderRadius: 42.5,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  progressFillInner: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    borderRadius: 42.5,
  },
  progressValue: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  distanceValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginTop: 8,
  },
  emptyStateContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  emptyStateHint: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
    lineHeight: 13,
  },
  stepsContent: {
    flex: 1,
    marginLeft: 12,
  },
  stepsValue: {
    fontSize: 30,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  dots: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFA726',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 25,
    paddingHorizontal: 20,
    paddingBottom: 40,
    minHeight: 600,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  toggleContainer: {
    position: 'absolute',
    left: 20,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 3,
  },
  toggleCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'white',
  },
  waterCircleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  waterCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterCircleContent: {
    alignItems: 'center',
  },
  waterAmountText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
  },
  mlText: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
  },
  sectionLabel: {
    fontSize: 16,
    marginBottom: 15,
    fontWeight: '500',
    textAlign: 'right',
  },
  presetButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 15,
  },
  presetButtonActive: {
    elevation: 2,
  },
  presetButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  presetButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 40,
  },
  customInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    textAlign: 'right',
  },
  addButton: {
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
});

export default SimpleHealthTracking;