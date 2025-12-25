import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getMealDetails, markFoodEaten, replaceMealFood } from '../../services/mealPlanService';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { getSafeDatabase, ensureDatabase } from '../../database/databaseHelper';
import { BRAND_COLORS } from '../../constants/brandColors';

const MealDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { planId, mealId } = route.params as { planId: string; mealId: string };

  const [meal, setMeal] = useState<any>(null);
  const [consumedFoods, setConsumedFoods] = useState<string[]>([]);
  const [showReplacementModal, setShowReplacementModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await ensureDatabase();
      loadMealDetails();
    };
    init();
  }, []);

  const loadMealDetails = async () => {
    try {
      const mealData = await getMealDetails(planId, mealId);
      setMeal(mealData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load meal details');
    } finally {
      setLoading(false);
    }
  };

  const handleFoodToggle = async (food: any) => {
    const today = format(new Date(), 'yyyy-MM-dd');

    if (!consumedFoods.includes(food.name)) {
      // Mark as eaten in AsyncStorage (for UI state)
      await markFoodEaten(today, mealId, food.name);
      setConsumedFoods([...consumedFoods, food.name]);

      // Also save to database for dashboard display
      if (user?.id) {
        try {
          await ensureDatabase();
          const db = getSafeDatabase();

          if (db) {
            // Determine meal type based on meal name or time
            let mealType = 'snack';
            if (meal.name.toLowerCase().includes('breakfast')) mealType = 'breakfast';
            else if (meal.name.toLowerCase().includes('lunch')) mealType = 'lunch';
            else if (meal.name.toLowerCase().includes('dinner')) mealType = 'dinner';

            // Save to database
            const result = await db.runAsync(
              `INSERT INTO food_logs (userId, date, mealType, foodData, calories, protein, carbs, fat, quantity, unit)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                user.id,
                today,
                mealType,
                JSON.stringify(food),
                food.calories || 0,
                food.protein || 0,
                food.carbs || 0,
                food.fat || 0,
                100, // Default quantity
                'g' // Default unit
              ]
            );
            console.log('Food logged to database from MealDetail:', food.name);
          }
        } catch (error) {
          console.error('Failed to log food to database:', error);
        }
      }
    } else {
      setConsumedFoods(consumedFoods.filter(name => name !== food.name));
    }
  };

  const handleReplacementSelect = async (replacement: any) => {
    if (!selectedFood || !meal) return;

    try {
      const updatedMeal = await replaceMealFood(meal, selectedFood, replacement);
      setMeal(updatedMeal);
      setShowReplacementModal(false);
      setSelectedFood(null);
      Alert.alert('Success', `Replaced ${selectedFood.name} with ${replacement.name}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to replace food');
    }
  };

  const openReplacementModal = (food: any) => {
    if (food.alternatives && food.alternatives.length > 0) {
      setSelectedFood(food);
      setShowReplacementModal(true);
    } else {
      Alert.alert('No Alternatives', 'No alternative foods available for this item');
    }
  };

  if (loading || !meal) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading meal details...</Text>
      </View>
    );
  }

  const calculateProgress = () => {
    const consumedCount = consumedFoods.length;
    const totalCount = meal.foods.length;
    return (consumedCount / totalCount) * 100;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={BRAND_COLORS.accent} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{meal.name}</Text>
          <Text style={styles.headerTime}>{meal.time}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.macroSummary}>
        <View style={[styles.macroCard, { backgroundColor: '#FFE8E8' }]}>
          <MaterialCommunityIcons name="fire" size={20} color={BRAND_COLORS.accent} />
          <Text style={styles.macroValue}>{meal.calories}</Text>
          <Text style={styles.macroLabel}>Calories</Text>
        </View>
        <View style={[styles.macroCard, { backgroundColor: '#E8E8FF' }]}>
          <MaterialCommunityIcons name="arm-flex" size={20} color="#6B6BFF" />
          <Text style={styles.macroValue}>{meal.protein}g</Text>
          <Text style={styles.macroLabel}>Protein</Text>
        </View>
        <View style={[styles.macroCard, { backgroundColor: '#FFF8E8' }]}>
          <MaterialCommunityIcons name="grain" size={20} color="#FFB347" />
          <Text style={styles.macroValue}>{meal.carbs}g</Text>
          <Text style={styles.macroLabel}>Carbs</Text>
        </View>
        <View style={[styles.macroCard, { backgroundColor: '#E8FFE8' }]}>
          <Ionicons name="water" size={20} color="#66BB6A" />
          <Text style={styles.macroValue}>{meal.fat}g</Text>
          <Text style={styles.macroLabel}>Fat</Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>Meal Progress</Text>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${calculateProgress()}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          {consumedFoods.length} of {meal.foods.length} foods consumed
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}>
        <Text style={styles.sectionTitle}>Foods in this meal:</Text>

        {meal.foods.map((food: any, index: number) => {
          const isConsumed = consumedFoods.includes(food.name);

          return (
            <View key={index} style={styles.foodItem}>
              <TouchableOpacity
                style={styles.checkboxWrapper}
                onPress={() => handleFoodToggle(food)}
              >
                <View style={[styles.checkbox, isConsumed && styles.checkboxChecked]}>
                  {isConsumed && (
                    <Ionicons name="checkmark" size={18} color="white" />
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.foodContent}>
                <View style={styles.foodHeader}>
                  <Text style={[styles.foodName, isConsumed && styles.foodNameConsumed]}>
                    {food.name}
                  </Text>
                  <Text style={styles.foodAmount}>{food.amount}</Text>
                </View>

                <View style={styles.foodMacros}>
                  <View style={styles.macroTag}>
                    <MaterialCommunityIcons name="fire" size={12} color={BRAND_COLORS.accent} />
                    <Text style={styles.macroTagText}>{food.calories} cal</Text>
                  </View>
                  <View style={styles.macroTag}>
                    <Text style={styles.macroTagText}>P: {food.protein}g</Text>
                  </View>
                  <View style={styles.macroTag}>
                    <Text style={styles.macroTagText}>C: {food.carbs}g</Text>
                  </View>
                  <View style={styles.macroTag}>
                    <Text style={styles.macroTagText}>F: {food.fat}g</Text>
                  </View>
                </View>

                {food.alternatives && food.alternatives.length > 0 && (
                  <TouchableOpacity
                    style={styles.replaceButton}
                    onPress={() => openReplacementModal(food)}
                  >
                    <MaterialCommunityIcons name="swap-horizontal" size={16} color={BRAND_COLORS.accent} />
                    <Text style={styles.replaceButtonText}>Replace</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Replacement Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showReplacementModal}
        onRequestClose={() => setShowReplacementModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Replace {selectedFood?.name}</Text>
              <TouchableOpacity onPress={() => setShowReplacementModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Choose an alternative:</Text>

            <ScrollView style={styles.alternativesList}>
              {selectedFood?.alternatives?.map((alt: any, index: number) => (
                <TouchableOpacity
                  key={index}
                  style={styles.alternativeItem}
                  onPress={() => handleReplacementSelect(alt)}
                >
                  <View style={styles.alternativeContent}>
                    <Text style={styles.alternativeName}>{alt.name}</Text>
                    <Text style={styles.alternativeAmount}>{alt.amount}</Text>
                  </View>
                  <View style={styles.alternativeMacros}>
                    <Text style={styles.altMacroText}>{alt.calories} cal</Text>
                    <Text style={styles.altMacroText}>P: {alt.protein}g</Text>
                    <Text style={styles.altMacroText}>C: {alt.carbs}g</Text>
                    <Text style={styles.altMacroText}>F: {alt.fat}g</Text>
                  </View>
                </TouchableOpacity>
              ))}
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
    backgroundColor: '#F5F7FA',
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
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: BRAND_COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerTime: {
    fontSize: 14,
    color: BRAND_COLORS.accent,
    marginTop: 2,
  },
  macroSummary: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    gap: 8,
  },
  macroCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  macroValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  macroLabel: {
    fontSize: 10,
    color: '#666',
  },
  progressContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 10,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BRAND_COLORS.accent,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginTop: 6,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 15,
  },
  foodItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  checkboxWrapper: {
    marginRight: 15,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#DDD',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: BRAND_COLORS.accent,
    borderColor: BRAND_COLORS.accent,
  },
  foodContent: {
    flex: 1,
  },
  foodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  foodNameConsumed: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  foodAmount: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  foodMacros: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  macroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  macroTagText: {
    fontSize: 11,
    color: '#666',
  },
  replaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFF5F0',
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  replaceButtonText: {
    fontSize: 12,
    color: BRAND_COLORS.accent,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 20,
    marginVertical: 15,
  },
  alternativesList: {
    paddingHorizontal: 20,
  },
  alternativeItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  alternativeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  alternativeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  alternativeAmount: {
    fontSize: 14,
    color: '#666',
  },
  alternativeMacros: {
    flexDirection: 'row',
    gap: 12,
  },
  altMacroText: {
    fontSize: 12,
    color: '#666',
  },
});

export default MealDetailScreen;