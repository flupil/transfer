import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import customFoodsService, { CustomFood } from '../../services/customFoodsService';
import { BRAND_COLORS } from '../../constants/brandColors';

interface MealFood {
  foodId: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
}

const CreateCustomMealScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [mealName, setMealName] = useState('');
  const [foods, setFoods] = useState<MealFood[]>([]);
  const [availableFoods, setAvailableFoods] = useState<CustomFood[]>([]);
  const [showFoodSelector, setShowFoodSelector] = useState(false);
  const [saving, setSaving] = useState(false);

  // Quick add fields
  const [quickName, setQuickName] = useState('');
  const [quickCalories, setQuickCalories] = useState('');
  const [quickProtein, setQuickProtein] = useState('');
  const [quickCarbs, setQuickCarbs] = useState('');
  const [quickFat, setQuickFat] = useState('');

  useEffect(() => {
    loadAvailableFoods();
  }, []);

  const loadAvailableFoods = async () => {
    if (!user?.id) return;
    const customFoods = await customFoodsService.getCustomFoods(user.id);
    setAvailableFoods(customFoods);
  };

  const handleAddFood = (food: CustomFood) => {
    const mealFood: MealFood = {
      foodId: food.id,
      foodName: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      serving: food.serving,
    };
    setFoods([...foods, mealFood]);
    setShowFoodSelector(false);
  };

  const handleQuickAdd = () => {
    if (!quickName || !quickCalories) {
      Alert.alert('Error', 'Please enter at least name and calories');
      return;
    }

    const mealFood: MealFood = {
      foodId: `quick_${Date.now()}`,
      foodName: quickName,
      calories: parseFloat(quickCalories),
      protein: parseFloat(quickProtein) || 0,
      carbs: parseFloat(quickCarbs) || 0,
      fat: parseFloat(quickFat) || 0,
      serving: '1 serving',
    };

    setFoods([...foods, mealFood]);

    // Clear fields
    setQuickName('');
    setQuickCalories('');
    setQuickProtein('');
    setQuickCarbs('');
    setQuickFat('');
  };

  const handleRemoveFood = (index: number) => {
    const newFoods = foods.filter((_, i) => i !== index);
    setFoods(newFoods);
  };

  const calculateTotals = () => {
    return foods.reduce(
      (totals, food) => ({
        calories: totals.calories + food.calories,
        protein: totals.protein + food.protein,
        carbs: totals.carbs + food.carbs,
        fat: totals.fat + food.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const handleSave = async () => {
    if (!mealName || foods.length === 0) {
      Alert.alert('Error', 'Please enter meal name and add at least one food');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setSaving(true);
    try {
      const totals = calculateTotals();
      await customFoodsService.createCustomMeal(
        {
          name: mealName,
          foods,
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          totalCarbs: totals.carbs,
          totalFat: totals.fat,
        },
        user.id
      );

      Alert.alert('Success', 'Custom meal created successfully!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error creating custom meal:', error);
      Alert.alert('Error', 'Failed to create custom meal');
    } finally {
      setSaving(false);
    }
  };

  const totals = calculateTotals();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#202124" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Custom Meal</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color={BRAND_COLORS.accent} />
            <Text style={styles.infoText}>
              Create a meal by combining multiple foods. Perfect for recipes or regular meals!
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Meal Name <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              value={mealName}
              onChangeText={setMealName}
              placeholder="e.g. Chicken & Rice Bowl"
              placeholderTextColor="#6A7A8A"
            />
          </View>

          {/* Foods List */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Foods in this Meal</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowFoodSelector(!showFoodSelector)}
                accessibilityLabel="Add food to meal"
              >
                <Ionicons name="add-circle" size={20} color={BRAND_COLORS.accent} />
                <Text style={styles.addButtonText}>Add Food</Text>
              </TouchableOpacity>
            </View>

            {/* Food Selector */}
            {showFoodSelector && (
              <View style={styles.foodSelector}>
                <Text style={styles.foodSelectorTitle}>Select from My Foods</Text>
                {availableFoods.length > 0 ? (
                  availableFoods.map((food) => (
                    <TouchableOpacity
                      key={food.id}
                      style={styles.foodOption}
                      onPress={() => handleAddFood(food)}
                      accessibilityLabel={`Add ${food.name} to meal`}
                    >
                      <Text style={styles.foodOptionName}>{food.name}</Text>
                      <Text style={styles.foodOptionDetails}>
                        {food.calories} cal • {food.serving}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.emptyText}>
                    No custom foods yet. Use quick add below or create custom foods first.
                  </Text>
                )}

                {/* Quick Add */}
                <View style={styles.quickAddSection}>
                  <Text style={styles.quickAddTitle}>Quick Add</Text>
                  <TextInput
                    style={styles.smallInput}
                    value={quickName}
                    onChangeText={setQuickName}
                    placeholder="Food name"
                    placeholderTextColor="#6A7A8A"
                  />
                  <View style={styles.macroRow}>
                    <TextInput
                      style={[styles.smallInput, { flex: 1 }]}
                      value={quickCalories}
                      onChangeText={setQuickCalories}
                      placeholder="Cal"
                      placeholderTextColor="#6A7A8A"
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.smallInput, { flex: 1 }]}
                      value={quickProtein}
                      onChangeText={setQuickProtein}
                      placeholder="P"
                      placeholderTextColor="#6A7A8A"
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.smallInput, { flex: 1 }]}
                      value={quickCarbs}
                      onChangeText={setQuickCarbs}
                      placeholder="C"
                      placeholderTextColor="#6A7A8A"
                      keyboardType="numeric"
                    />
                    <TextInput
                      style={[styles.smallInput, { flex: 1 }]}
                      value={quickFat}
                      onChangeText={setQuickFat}
                      placeholder="F"
                      placeholderTextColor="#6A7A8A"
                      keyboardType="numeric"
                    />
                  </View>
                  <TouchableOpacity style={styles.quickAddButton} onPress={handleQuickAdd} accessibilityLabel="Quick add food">
                    <Text style={styles.quickAddButtonText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Added Foods */}
            {foods.length > 0 ? (
              <View style={styles.foodsList}>
                {foods.map((food, index) => (
                  <View key={index} style={styles.foodItem}>
                    <View style={styles.foodItemInfo}>
                      <Text style={styles.foodItemName}>{food.foodName}</Text>
                      <Text style={styles.foodItemDetails}>
                        {food.calories} cal • P: {food.protein}g • C: {food.carbs}g • F: {food.fat}g
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveFood(index)} accessibilityLabel={`Remove ${food.foodName} from meal`}>
                      <Ionicons name="close-circle" size={24} color={BRAND_COLORS.accent} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No foods added yet</Text>
              </View>
            )}
          </View>

          {/* Totals */}
          {foods.length > 0 && (
            <View style={styles.totalsCard}>
              <Text style={styles.totalsTitle}>Meal Totals</Text>
              <View style={styles.totalsGrid}>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{totals.calories}</Text>
                  <Text style={styles.totalLabel}>Calories</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{totals.protein.toFixed(1)}g</Text>
                  <Text style={styles.totalLabel}>Protein</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{totals.carbs.toFixed(1)}g</Text>
                  <Text style={styles.totalLabel}>Carbs</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalValue}>{totals.fat.toFixed(1)}g</Text>
                  <Text style={styles.totalLabel}>Fat</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, (!mealName || foods.length === 0 || saving) && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={!mealName || foods.length === 0 || saving}
          accessibilityLabel={saving ? 'Creating custom meal' : 'Create custom meal'}
        >
          <Text style={styles.buttonText}>{saving ? 'Creating...' : 'Create Custom Meal'}</Text>
          {!saving && <Ionicons name="checkmark" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202124',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3A47',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: BRAND_COLORS.accent,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  required: {
    color: BRAND_COLORS.accent,
  },
  input: {
    backgroundColor: '#4E4E50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    color: BRAND_COLORS.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  foodSelector: {
    backgroundColor: '#4E4E50',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  foodSelectorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  foodOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#4E4E50',
    borderRadius: 6,
    marginBottom: 6,
  },
  foodOptionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  foodOptionDetails: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  quickAddSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3A3A3C',
  },
  quickAddTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  smallInput: {
    backgroundColor: '#4E4E50',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#fff',
    marginBottom: 8,
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAddButton: {
    backgroundColor: BRAND_COLORS.accent,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  quickAddButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  foodsList: {
    gap: 8,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#4E4E50',
    padding: 12,
    borderRadius: 8,
  },
  foodItemInfo: {
    flex: 1,
  },
  foodItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  foodItemDetails: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#B0B0B0',
    textAlign: 'center',
  },
  totalsCard: {
    backgroundColor: '#4E4E50',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  totalsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  totalsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  totalItem: {
    alignItems: 'center',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND_COLORS.accent,
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2C3A47',
  },
  button: {
    backgroundColor: BRAND_COLORS.accent,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default CreateCustomMealScreen;
