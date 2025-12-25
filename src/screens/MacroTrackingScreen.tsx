import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  getTodayMacros,
  addMacroFood,
  updateMacroTargets,
  getMacroStats,
  searchFoods,
  getFoodDatabase,
} from '../services/macroTrackingService';
import { format } from 'date-fns';

const { width } = Dimensions.get('window');

const MacroTrackingScreen = () => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const [dailyMacros, setDailyMacros] = useState<any>(null);
  const [weeklyStats, setWeeklyStats] = useState<any>(null);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [newTargets, setNewTargets] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const todayData = await getTodayMacros();
      const stats = await getMacroStats();
      setDailyMacros(todayData);
      setWeeklyStats(stats);
      setNewTargets(todayData.targets);
    } catch (error) {
      console.error('Failed to load macro data:', error);
    }
  };

  const handleUpdateTargets = async () => {
    try {
      await updateMacroTargets(newTargets);
      await loadData();
      setShowTargetModal(false);
      Alert.alert(t('alert.success'), t('macros.targetsUpdated'));
    } catch (error) {
      Alert.alert(t('alert.error'), t('macros.updateFailed'));
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this food entry?',
      [
        { text: t('button.cancel'), style: 'cancel' },
        {
          text: t('button.delete'),
          style: 'destructive',
          onPress: async () => {
            // Delete functionality not implemented - service method needed
            // For now, user can clear all data from settings
            await loadData();
          },
        },
      ]
    );
  };

  const getMacroPercentage = (consumed: number, target: number) => {
    return Math.min((consumed / target) * 100, 100);
  };

  const getMealIcon = (meal: string) => {
    switch (meal) {
      case 'breakfast':
        return 'coffee';
      case 'lunch':
        return 'food';
      case 'dinner':
        return 'silverware';
      case 'snack':
        return 'cookie';
      default:
        return 'food';
    }
  };

  if (!dailyMacros) {
    return (
      <View style={[styles.container, { backgroundColor: '#2A2A2A' }]}>
        <Text style={{ color: '#F4F1EF' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#2A2A2A' }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: '#F4F1EF' }]}>Macro Tracking</Text>
        <Text style={[styles.date, { color: '#C5C2BF' }]}>
          {format(new Date(), 'EEEE, MMM d')}
        </Text>
      </View>

      {/* Overview Cards */}
      <View style={styles.overviewCards}>
        <View style={[styles.macroCard, { backgroundColor: '#E94E1B' }]}>
          <Text style={styles.macroCardTitle}>Calories</Text>
          <Text style={styles.macroCardValue}>
            {dailyMacros.consumed.calories}
          </Text>
          <Text style={styles.macroCardTarget}>
            / {dailyMacros.targets.calories}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${getMacroPercentage(
                    dailyMacros.consumed.calories,
                    dailyMacros.targets.calories
                  )}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={[styles.macroCard, { backgroundColor: '#E94E1B' }]}>
          <Text style={styles.macroCardTitle}>Protein</Text>
          <Text style={styles.macroCardValue}>
            {dailyMacros.consumed.protein}g
          </Text>
          <Text style={styles.macroCardTarget}>
            / {dailyMacros.targets.protein}g
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${getMacroPercentage(
                    dailyMacros.consumed.protein,
                    dailyMacros.targets.protein
                  )}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={[styles.macroCard, { backgroundColor: '#95E1D3' }]}>
          <Text style={styles.macroCardTitle}>Carbs</Text>
          <Text style={styles.macroCardValue}>
            {dailyMacros.consumed.carbs}g
          </Text>
          <Text style={styles.macroCardTarget}>
            / {dailyMacros.targets.carbs}g
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${getMacroPercentage(
                    dailyMacros.consumed.carbs,
                    dailyMacros.targets.carbs
                  )}%`,
                },
              ]}
            />
          </View>
        </View>

        <View style={[styles.macroCard, { backgroundColor: '#E94E1B' }]}>
          <Text style={styles.macroCardTitle}>Fat</Text>
          <Text style={styles.macroCardValue}>
            {dailyMacros.consumed.fat}g
          </Text>
          <Text style={styles.macroCardTarget}>
            / {dailyMacros.targets.fat}g
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${getMacroPercentage(
                    dailyMacros.consumed.fat,
                    dailyMacros.targets.fat
                  )}%`,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Weekly Stats */}
      {weeklyStats && (
        <View style={[styles.statsContainer, { backgroundColor: '#4A4A4A' }]}>
          <Text style={[styles.sectionTitle, { color: '#F4F1EF' }]}>
            Weekly Statistics
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: '#C5C2BF' }]}>
                Avg Calories
              </Text>
              <Text style={[styles.statValue, { color: '#F4F1EF' }]}>
                {weeklyStats.averageCalories}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: '#C5C2BF' }]}>
                Avg Protein
              </Text>
              <Text style={[styles.statValue, { color: '#F4F1EF' }]}>
                {weeklyStats.averageProtein}g
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: '#C5C2BF' }]}>
                Days on Target
              </Text>
              <Text style={[styles.statValue, { color: '#F4F1EF' }]}>
                {weeklyStats.daysOnTarget}/7
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Today's Entries */}
      <View style={[styles.entriesContainer, { backgroundColor: '#4A4A4A' }]}>
        <View style={styles.entriesHeader}>
          <Text style={[styles.sectionTitle, { color: '#F4F1EF' }]}>
            Today's Food
          </Text>
          <TouchableOpacity onPress={() => setShowTargetModal(true)}>
            <MaterialCommunityIcons name="cog" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {dailyMacros.entries.length === 0 ? (
          <Text style={[styles.emptyText, { color: '#C5C2BF' }]}>
            {t('macros.noEntriesYet')}
          </Text>
        ) : (
          <FlatList
            data={dailyMacros.entries}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={[styles.entryItem, { borderBottomColor: colors.border }]}>
                <View style={styles.entryLeft}>
                  <MaterialCommunityIcons
                    name={getMealIcon(item.meal)}
                    size={20}
                    color={colors.textSecondary}
                  />
                  <View style={styles.entryDetails}>
                    <Text style={[styles.entryName, { color: '#F4F1EF' }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.entryMeal, { color: '#C5C2BF' }]}>
                      {item.meal.charAt(0).toUpperCase() + item.meal.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={styles.entryMacros}>
                  <Text style={[styles.entryCalories, { color: '#F4F1EF' }]}>
                    {item.calories} cal
                  </Text>
                  <View style={styles.entryMacroDetails}>
                    <Text style={styles.entryMacroText}>P: {item.protein}g</Text>
                    <Text style={styles.entryMacroText}>C: {item.carbs}g</Text>
                    <Text style={styles.entryMacroText}>F: {item.fat}g</Text>
                  </View>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Target Settings Modal */}
      <Modal
        visible={showTargetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTargetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: '#4A4A4A' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: '#F4F1EF' }]}>
                Daily Targets
              </Text>
              <TouchableOpacity onPress={() => setShowTargetModal(false)}>
                <MaterialCommunityIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.targetInputs}>
              <View style={styles.targetRow}>
                <Text style={[styles.targetLabel, { color: '#F4F1EF' }]}>
                  Calories
                </Text>
                <View style={styles.targetButtons}>
                  <TouchableOpacity
                    onPress={() =>
                      setNewTargets({ ...newTargets, calories: Math.max(1000, newTargets.calories - 100) })
                    }
                  >
                    <MaterialCommunityIcons name="minus" size={24} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.targetValue, { color: '#F4F1EF' }]}>
                    {newTargets.calories}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setNewTargets({ ...newTargets, calories: Math.min(5000, newTargets.calories + 100) })
                    }
                  >
                    <MaterialCommunityIcons name="plus" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.targetRow}>
                <Text style={[styles.targetLabel, { color: '#F4F1EF' }]}>
                  Protein (g)
                </Text>
                <View style={styles.targetButtons}>
                  <TouchableOpacity
                    onPress={() =>
                      setNewTargets({ ...newTargets, protein: Math.max(50, newTargets.protein - 10) })
                    }
                  >
                    <MaterialCommunityIcons name="minus" size={24} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.targetValue, { color: '#F4F1EF' }]}>
                    {newTargets.protein}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setNewTargets({ ...newTargets, protein: Math.min(500, newTargets.protein + 10) })
                    }
                  >
                    <MaterialCommunityIcons name="plus" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.targetRow}>
                <Text style={[styles.targetLabel, { color: '#F4F1EF' }]}>
                  Carbs (g)
                </Text>
                <View style={styles.targetButtons}>
                  <TouchableOpacity
                    onPress={() =>
                      setNewTargets({ ...newTargets, carbs: Math.max(50, newTargets.carbs - 10) })
                    }
                  >
                    <MaterialCommunityIcons name="minus" size={24} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.targetValue, { color: '#F4F1EF' }]}>
                    {newTargets.carbs}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setNewTargets({ ...newTargets, carbs: Math.min(700, newTargets.carbs + 10) })
                    }
                  >
                    <MaterialCommunityIcons name="plus" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.targetRow}>
                <Text style={[styles.targetLabel, { color: '#F4F1EF' }]}>
                  Fat (g)
                </Text>
                <View style={styles.targetButtons}>
                  <TouchableOpacity
                    onPress={() =>
                      setNewTargets({ ...newTargets, fat: Math.max(20, newTargets.fat - 5) })
                    }
                  >
                    <MaterialCommunityIcons name="minus" size={24} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.targetValue, { color: '#F4F1EF' }]}>
                    {newTargets.fat}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setNewTargets({ ...newTargets, fat: Math.min(200, newTargets.fat + 5) })
                    }
                  >
                    <MaterialCommunityIcons name="plus" size={24} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: '#FF6B35' }]}
              onPress={handleUpdateTargets}
            >
              <Text style={styles.saveButtonText}>Save Targets</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
  },
  overviewCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  macroCard: {
    width: (width - 44) / 2,
    padding: 16,
    borderRadius: 16,
    marginBottom: 4,
  },
  macroCardTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  macroCardValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  macroCardTarget: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 3,
  },
  statsContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  entriesContainer: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  entriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: 20,
  },
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  entryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  entryDetails: {
    marginLeft: 12,
    flex: 1,
  },
  entryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  entryMeal: {
    fontSize: 12,
    marginTop: 2,
  },
  entryMacros: {
    alignItems: 'flex-end',
  },
  entryCalories: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  entryMacroDetails: {
    flexDirection: 'row',
    gap: 8,
  },
  entryMacroText: {
    fontSize: 11,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  targetInputs: {
    gap: 20,
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 16,
    flex: 1,
  },
  targetButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  targetValue: {
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 60,
    textAlign: 'center',
  },
  saveButton: {
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 30,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MacroTrackingScreen;