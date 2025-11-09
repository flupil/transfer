import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { getMealPlans, selectMealPlan, getSelectedMealPlan } from '../../services/mealPlanService';

const MealPlanSelectionScreen = () => {
  const navigation = useNavigation();
  const [mealPlans, setMealPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMealPlans();
  }, []);

  const loadMealPlans = async () => {
    try {
      const [plans, selected] = await Promise.all([
        getMealPlans(),
        getSelectedMealPlan()
      ]);
      setMealPlans(plans);
      setSelectedPlanId(selected?.id || null);
    } catch (error) {
      Alert.alert('Error', 'Failed to load meal plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: string) => {
    try {
      await selectMealPlan(planId);
      setSelectedPlanId(planId);
      Alert.alert('Success', 'Meal plan selected!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to select meal plan');
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'cutting':
        return 'weight-loss';
      case 'bulking':
        return 'arm-flex';
      case 'maintenance':
        return 'scale-balanced';
      default:
        return 'food';
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'cutting':
        return '#FF6B6B';
      case 'bulking':
        return '#4ECDC4';
      case 'maintenance':
        return '#45B7D1';
      default:
        return '#95E77E';
    }
  };

  const getPlanGradient = (planId: string) => {
    switch (planId) {
      case 'cutting':
        return ['#FF6B6B', '#FF4757'] as const;
      case 'bulking':
        return ['#4ECDC4', '#44A08D'] as const;
      case 'maintenance':
        return ['#45B7D1', '#2E86AB'] as const;
      default:
        return ['#95E77E', '#68B684'] as const;
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
            <MaterialCommunityIcons name="arrow-left" size={28} color="#1A1F36" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Choose Your Plan</Text>
          <View style={{ width: 28 }} />
        </View>

        <Text style={styles.subtitle}>
          Select a meal plan that aligns with your fitness goals
        </Text>

        <View style={styles.plansContainer}>
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
                    <Text style={styles.selectedText}>ACTIVE</Text>
                  </View>
                )}

                <View style={[styles.planIconContainer, { backgroundColor: `${planColor}20` }]}>
                  <MaterialCommunityIcons
                    name={getPlanIcon(plan.id) as any}
                    size={40}
                    color={planColor}
                  />
                </View>

                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planDescription}>{plan.description}</Text>

                <View style={styles.macroGrid}>
                  <View style={styles.macroItem}>
                    <MaterialCommunityIcons name="fire" size={20} color="#FF6B6B" />
                    <Text style={styles.macroValue}>{plan.totalCalories}</Text>
                    <Text style={styles.macroLabel}>Calories</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <MaterialCommunityIcons name="arm-flex" size={20} color="#6B6BFF" />
                    <Text style={styles.macroValue}>{plan.totalProtein}g</Text>
                    <Text style={styles.macroLabel}>Protein</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <MaterialCommunityIcons name="grain" size={20} color="#FFB347" />
                    <Text style={styles.macroValue}>{plan.totalCarbs}g</Text>
                    <Text style={styles.macroLabel}>Carbs</Text>
                  </View>
                  <View style={styles.macroItem}>
                    <MaterialCommunityIcons name="water" size={20} color="#66BB6A" />
                    <Text style={styles.macroValue}>{plan.totalFat}g</Text>
                    <Text style={styles.macroLabel}>Fat</Text>
                  </View>
                </View>

                <View style={styles.mealsInfo}>
                  <MaterialCommunityIcons name="silverware-fork-knife" size={16} color="#666" />
                  <Text style={styles.mealsText}>{plan.meals.length} meals per day</Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleSelectPlan(plan.id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={getPlanGradient(plan.id)}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.selectButton}
                  >
                    <Text style={styles.selectButtonText}>
                      {isSelected ? 'Current Plan' : 'Select Plan'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFD',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1F36',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 10,
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  plansContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    position: 'relative',
    overflow: 'hidden',
  },
  selectedCard: {
    borderWidth: 2,
    elevation: 8,
    shadowOpacity: 0.15,
    transform: [{ scale: 1.01 }],
  },
  selectedBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    elevation: 2,
  },
  selectedText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  planName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1A1F36',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  planDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 20,
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 18,
    paddingHorizontal: 10,
    backgroundColor: '#F8F9FB',
    borderRadius: 16,
    marginBottom: 20,
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1F36',
    marginTop: 6,
  },
  macroLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  mealsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#F3F4F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'center',
  },
  mealsText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
    fontWeight: '600',
  },
  selectButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default MealPlanSelectionScreen;