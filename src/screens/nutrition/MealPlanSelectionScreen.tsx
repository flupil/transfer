import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getMealPlans, selectMealPlan, getSelectedMealPlan, saveMealPlan } from '../../services/mealPlanService';
import { useAuth } from '../../contexts/AuthContext';
import { BRAND_COLORS } from '../../constants/brandColors';

const MealPlanSelectionScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customCalories, setCustomCalories] = useState('2000');
  const [customProtein, setCustomProtein] = useState('150');
  const [customCarbs, setCustomCarbs] = useState('225');
  const [customFat, setCustomFat] = useState('67');

  // Baseline values to calculate ratio from when user starts editing
  const [baselineCalories, setBaselineCalories] = useState('2000');
  const [baselineProtein, setBaselineProtein] = useState('150');
  const [baselineCarbs, setBaselineCarbs] = useState('225');
  const [baselineFat, setBaselineFat] = useState('67');

  useEffect(() => {
    loadMealPlans();
  }, []);

  // Populate modal fields when editing current plan
  useEffect(() => {
    if (showCustomModal && currentPlan) {
      // Editing existing plan - populate with current values
      const cals = currentPlan.totalCalories?.toString() || '2000';
      const prot = currentPlan.totalProtein?.toString() || '150';
      const carb = currentPlan.totalCarbs?.toString() || '225';
      const f = currentPlan.totalFat?.toString() || '67';

      setCustomCalories(cals);
      setCustomProtein(prot);
      setCustomCarbs(carb);
      setCustomFat(f);

      // Set baseline values for proportional scaling
      setBaselineCalories(cals);
      setBaselineProtein(prot);
      setBaselineCarbs(carb);
      setBaselineFat(f);

      console.log('📝 Populated modal for editing:', {
        calories: currentPlan.totalCalories,
        protein: currentPlan.totalProtein,
        carbs: currentPlan.totalCarbs,
        fat: currentPlan.totalFat
      });
    } else if (showCustomModal && !currentPlan) {
      // Creating new plan - reset to defaults
      setCustomCalories('2000');
      setCustomProtein('150');
      setCustomCarbs('225');
      setCustomFat('67');

      setBaselineCalories('2000');
      setBaselineProtein('150');
      setBaselineCarbs('225');
      setBaselineFat('67');

      console.log('📝 Reset modal for creating new plan');
    }
  }, [showCustomModal, currentPlan]);

  const loadMealPlans = async () => {
    try {
      const [plans, selected] = await Promise.all([
        getMealPlans(user?.id), // Pass userId to get personalized plans
        getSelectedMealPlan()
      ]);

      // Filter out custom plans from the list (we'll show them separately)
      const preMadePlans = plans.filter(p => !p.id.includes('custom'));

      setMealPlans(preMadePlans);
      setCurrentPlan(selected);
      setSelectedPlanId(selected?.id || null);

      // Pre-fill custom plan values if current plan exists
      if (selected) {
        setCustomCalories(selected.totalCalories?.toString() || '2000');
        setCustomProtein(selected.totalProtein?.toString() || '150');
        setCustomCarbs(selected.totalCarbs?.toString() || '225');
        setCustomFat(selected.totalFat?.toString() || '67');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load meal plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    try {
      // Get the plan details (pass userId to get personalized plans)
      const allPlans = await getMealPlans(user?.id);
      const selectedPlan = allPlans.find(p => p.id === planId);

      if (!selectedPlan) {
        Alert.alert('Error', 'Plan not found');
        return;
      }

      // Select the plan in AsyncStorage
      await selectMealPlan(planId);
      setSelectedPlanId(planId);

      // Update Firebase targets to match the selected plan
      if (user?.id) {
        const firebaseDailyDataService = (await import('../../services/firebaseDailyDataService')).default;
        await firebaseDailyDataService.updateTargets(user.id, {
          calories: selectedPlan.totalCalories,
          protein: selectedPlan.totalProtein,
          carbs: selectedPlan.totalCarbs,
          fat: selectedPlan.totalFat,
          water: 2000
        });
        console.log('✅ Updated Firebase targets for selected plan');
      }

      Alert.alert('Success', 'Meal plan selected!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error selecting plan:', error);
      Alert.alert('Error', 'Failed to select meal plan');
    }
  };

  const handleCreateCustomPlan = async () => {
    const calories = parseInt(customCalories);
    const protein = parseInt(customProtein);
    const carbs = parseInt(customCarbs);
    const fat = parseInt(customFat);

    // Validate inputs
    if (isNaN(calories) || isNaN(protein) || isNaN(carbs) || isNaN(fat)) {
      Alert.alert('Invalid Input', 'Please enter valid numbers for all fields');
      return;
    }

    if (calories < 800 || calories > 5000) {
      Alert.alert('Invalid Calories', 'Please enter calories between 800 and 5000');
      return;
    }

    try {
      const customPlan = {
        id: currentPlan?.id || `custom-${Date.now()}`, // Keep existing ID when editing
        name: currentPlan?.name || 'Your Custom Plan',
        description: `${calories} cal/day custom plan`,
        totalCalories: calories,
        totalProtein: protein,
        totalCarbs: carbs,
        totalFat: fat,
        meals: currentPlan?.meals || [], // Preserve existing meals when editing
        isCustom: true
      };

      console.log(currentPlan ? '✏️ Updating existing plan:' : '✨ Creating new plan:', customPlan);
      await saveMealPlan(customPlan, user?.id);
      setShowCustomModal(false);

      const successMessage = currentPlan ? 'Plan updated successfully!' : 'Custom plan created and selected!';
      Alert.alert('Success', successMessage, [
        { text: 'OK', onPress: () => {
          loadMealPlans();
          navigation.goBack();
        }}
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create custom plan');
    }
  };

  const calculateMacrosFromCalories = (calories: number, goal: 'loss' | 'maintain' | 'gain') => {
    let proteinRatio = 0.30;
    let carbRatio = 0.40;
    let fatRatio = 0.30;

    if (goal === 'loss') {
      proteinRatio = 0.35;
      carbRatio = 0.35;
      fatRatio = 0.30;
    } else if (goal === 'gain') {
      proteinRatio = 0.30;
      carbRatio = 0.45;
      fatRatio = 0.25;
    }

    const protein = Math.round((calories * proteinRatio) / 4);
    const carbs = Math.round((calories * carbRatio) / 4);
    const fat = Math.round((calories * fatRatio) / 9);

    setCustomProtein(protein.toString());
    setCustomCarbs(carbs.toString());
    setCustomFat(fat.toString());
  };

  const handleCaloriesChange = (newCalories: string) => {
    setCustomCalories(newCalories);

    // Use BASELINE values to calculate ratio (not current state which changes with each keystroke)
    const baseCals = parseFloat(baselineCalories);
    const newCals = parseFloat(newCalories);

    // Only adjust if both are valid numbers and new value is reasonable
    if (!isNaN(baseCals) && !isNaN(newCals) && baseCals > 0 && newCals >= 800 && newCals <= 5000) {
      // Calculate ratio based on BASELINE, not current values
      const ratio = newCals / baseCals;

      // Scale baseline macros by this ratio
      const baseProt = parseFloat(baselineProtein);
      const baseCarb = parseFloat(baselineCarbs);
      const baseFt = parseFloat(baselineFat);

      if (!isNaN(baseProt)) {
        setCustomProtein(Math.round(baseProt * ratio).toString());
      }
      if (!isNaN(baseCarb)) {
        setCustomCarbs(Math.round(baseCarb * ratio).toString());
      }
      if (!isNaN(baseFt)) {
        setCustomFat(Math.round(baseFt * ratio).toString());
      }

      console.log(`Macros scaled: ${baseCals}→${newCals} (×${ratio.toFixed(2)}): P=${Math.round(baseProt * ratio)}g C=${Math.round(baseCarb * ratio)}g F=${Math.round(baseFt * ratio)}g`);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'cutting':
        return 'weight-lifter';
      case 'bulking':
        return 'arm-flex';
      case 'maintenance':
        return 'scale-balance';
      default:
        return 'food';
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'cutting':
        return '#3B82F6';
      case 'bulking':
        return '#FF8C42';
      case 'maintenance':
        return '#10B981';
      default:
        return '#9333EA';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading meal plans...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Nutrition Plan</Text>
          <View style={{ width: 28 }} />
        </View>

        <Text style={styles.subtitle}>
          Choose or customize your daily nutrition targets
        </Text>

        {/* Current Plan Section */}
        {currentPlan && (
          <View style={styles.currentPlanSection}>
            <Text style={styles.sectionTitle}>
              <MaterialCommunityIcons name="check-circle" size={20} color={BRAND_COLORS.accent} /> Current Plan
            </Text>
            <View style={styles.currentPlanCard}>
              <View style={styles.currentPlanHeader}>
                <View>
                  <Text style={styles.currentPlanName}>{currentPlan.name}</Text>
                  <Text style={styles.currentPlanDesc}>{currentPlan.totalCalories} calories/day</Text>
                </View>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setShowCustomModal(true)}
                >
                  <MaterialCommunityIcons name="pencil" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.macroRow}>
                <View style={styles.macroBox}>
                  <MaterialCommunityIcons name="fire" size={24} color={BRAND_COLORS.accent} />
                  <Text style={styles.macroValue}>{currentPlan.totalCalories}</Text>
                  <Text style={styles.macroLabel}>Calories</Text>
                </View>
                <View style={styles.macroBox}>
                  <MaterialCommunityIcons name="arm-flex" size={24} color="#3B82F6" />
                  <Text style={styles.macroValue}>{currentPlan.totalProtein}g</Text>
                  <Text style={styles.macroLabel}>Protein</Text>
                </View>
                <View style={styles.macroBox}>
                  <MaterialCommunityIcons name="grain" size={24} color="#F59E0B" />
                  <Text style={styles.macroValue}>{currentPlan.totalCarbs}g</Text>
                  <Text style={styles.macroLabel}>Carbs</Text>
                </View>
                <View style={styles.macroBox}>
                  <MaterialCommunityIcons name="water" size={24} color="#10B981" />
                  <Text style={styles.macroValue}>{currentPlan.totalFat}g</Text>
                  <Text style={styles.macroLabel}>Fat</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Create Custom Plan Button */}
        <View style={styles.customSection}>
          <TouchableOpacity
            style={styles.createCustomButton}
            onPress={() => setShowCustomModal(true)}
          >
            <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" />
            <Text style={styles.createCustomText}>
              {currentPlan ? 'Edit Current Plan' : 'Create Custom Plan'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pre-made Plans Section */}
        <View style={styles.premadeSection}>
          <Text style={styles.sectionTitle}>
            <MaterialCommunityIcons name="food-variant" size={20} color="#a0a0a0" /> Pre-made Plans
          </Text>

          {mealPlans.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const planColor = getPlanColor(plan.id);

            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  isSelected && [styles.selectedCard, { borderColor: planColor }]
                ]}
                onPress={() => handleSelectPlan(plan.id)}
                activeOpacity={0.8}
              >
                {isSelected && (
                  <View style={[styles.selectedBadge, { backgroundColor: planColor }]}>
                    <MaterialCommunityIcons name="check" size={16} color="#fff" />
                  </View>
                )}

                <View style={[styles.planIconContainer, { backgroundColor: `${planColor}20` }]}>
                  <MaterialCommunityIcons
                    name={getPlanIcon(plan.id) as any}
                    size={32}
                    color={planColor}
                  />
                </View>

                <View style={styles.planInfo}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <Text style={styles.planDescription}>{plan.description}</Text>
                </View>

                <View style={styles.planMacros}>
                  <Text style={styles.planCalories}>{plan.totalCalories} cal</Text>
                  <Text style={styles.planMacroText}>
                    P: {plan.totalProtein}g • C: {plan.totalCarbs}g • F: {plan.totalFat}g
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Custom Plan Modal */}
      <Modal
        visible={showCustomModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Customize Your Plan</Text>
              <TouchableOpacity onPress={() => setShowCustomModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalSubtitle}>Set your daily targets</Text>

              {/* Calories Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  <MaterialCommunityIcons name="fire" size={18} color={BRAND_COLORS.accent} /> Daily Calories
                </Text>
                <TextInput
                  style={styles.input}
                  value={customCalories}
                  onChangeText={handleCaloriesChange}
                  keyboardType="numeric"
                  placeholder="e.g., 2000"
                  placeholderTextColor="#6a7a8a"
                />
              </View>

              {/* Quick Calorie Buttons */}
              <View style={styles.quickButtons}>
                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() => {
                    setCustomCalories('1800');
                    calculateMacrosFromCalories(1800, 'loss');
                  }}
                >
                  <Text style={styles.quickButtonText}>1800</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() => {
                    setCustomCalories('2200');
                    calculateMacrosFromCalories(2200, 'maintain');
                  }}
                >
                  <Text style={styles.quickButtonText}>2200</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickButton}
                  onPress={() => {
                    setCustomCalories('2600');
                    calculateMacrosFromCalories(2600, 'gain');
                  }}
                >
                  <Text style={styles.quickButtonText}>2600</Text>
                </TouchableOpacity>
              </View>

              {/* Protein Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  <MaterialCommunityIcons name="arm-flex" size={18} color="#3B82F6" /> Protein (grams)
                </Text>
                <TextInput
                  style={styles.input}
                  value={customProtein}
                  onChangeText={setCustomProtein}
                  keyboardType="numeric"
                  placeholder="e.g., 150"
                  placeholderTextColor="#6a7a8a"
                />
              </View>

              {/* Carbs Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  <MaterialCommunityIcons name="grain" size={18} color="#F59E0B" /> Carbs (grams)
                </Text>
                <TextInput
                  style={styles.input}
                  value={customCarbs}
                  onChangeText={setCustomCarbs}
                  keyboardType="numeric"
                  placeholder="e.g., 225"
                  placeholderTextColor="#6a7a8a"
                />
              </View>

              {/* Fat Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  <MaterialCommunityIcons name="water" size={18} color="#10B981" /> Fat (grams)
                </Text>
                <TextInput
                  style={styles.input}
                  value={customFat}
                  onChangeText={setCustomFat}
                  keyboardType="numeric"
                  placeholder="e.g., 67"
                  placeholderTextColor="#6a7a8a"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowCustomModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleCreateCustomPlan}
                >
                  <Text style={styles.saveButtonText}>Save Plan</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#a0a0a0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#8e9bab',
    textAlign: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  currentPlanSection: {
    marginTop: 20,
  },
  currentPlanCard: {
    backgroundColor: '#2A2A2A',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: BRAND_COLORS.accent,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  currentPlanName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  currentPlanDesc: {
    fontSize: 14,
    color: '#8e9bab',
    marginTop: 4,
  },
  editButton: {
    backgroundColor: BRAND_COLORS.accent,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroBox: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 6,
  },
  macroLabel: {
    fontSize: 11,
    color: '#8e9bab',
    marginTop: 2,
  },
  customSection: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  createCustomButton: {
    backgroundColor: BRAND_COLORS.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  createCustomText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  premadeSection: {
    marginTop: 30,
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: '#2A2A2A',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
    position: 'relative',
  },
  selectedCard: {
    borderWidth: 2,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 13,
    color: '#8e9bab',
    marginBottom: 8,
  },
  planMacros: {
    alignItems: 'flex-end',
  },
  planCalories: {
    fontSize: 16,
    fontWeight: 'bold',
    color: BRAND_COLORS.accent,
    marginBottom: 4,
  },
  planMacroText: {
    fontSize: 11,
    color: '#8e9bab',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#202124',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#8e9bab',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputGroup: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#4E4E50',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#555',
  },
  quickButtons: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickButton: {
    flex: 1,
    backgroundColor: '#4E4E50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#555',
  },
  quickButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#4E4E50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#a0a0a0',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: BRAND_COLORS.accent,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MealPlanSelectionScreen;
