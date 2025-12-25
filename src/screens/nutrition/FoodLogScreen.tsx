import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Dimensions,
  Alert,
  FlatList,
} from 'react-native';
import { Card, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { getSafeDatabase, ensureDatabase } from '../../database/databaseHelper';
import { format } from 'date-fns';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';
import { BRAND_COLORS } from '../../constants/brandColors';

const { width } = Dimensions.get('window');

interface Food {
  id: string;
  name: string;
  brand?: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  category: string;
}

interface FoodEntry {
  foodId: string;
  food: Food;
  quantity: number;
  unit: string;
}

const commonFoods: Food[] = [
  // Proteins
  { id: '1', name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: '100g', category: 'protein' },
  { id: '2', name: 'Eggs', calories: 155, protein: 13, carbs: 1.1, fat: 11, serving: '100g', category: 'protein' },
  { id: '3', name: 'Salmon', calories: 208, protein: 20, carbs: 0, fat: 13, serving: '100g', category: 'protein' },
  { id: '4', name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, serving: '100g', category: 'dairy' },
  { id: '5', name: 'Tuna', calories: 109, protein: 24, carbs: 0, fat: 1, serving: '100g', category: 'protein' },

  // Carbs
  { id: '6', name: 'White Rice', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, serving: '100g', category: 'grains' },
  { id: '7', name: 'Oatmeal', calories: 68, protein: 2.5, carbs: 12, fat: 1.4, serving: '100g', category: 'grains' },
  { id: '8', name: 'Sweet Potato', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, serving: '100g', category: 'vegetables' },
  { id: '9', name: 'Whole Wheat Bread', calories: 247, protein: 13, carbs: 41, fat: 3.4, serving: '100g', category: 'grains' },
  { id: '10', name: 'Quinoa', calories: 120, protein: 4.4, carbs: 21, fat: 1.9, serving: '100g', category: 'grains' },

  // Fruits
  { id: '11', name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, serving: '100g', category: 'fruits' },
  { id: '12', name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, serving: '100g', category: 'fruits' },
  { id: '13', name: 'Berries', calories: 57, protein: 0.7, carbs: 14, fat: 0.3, serving: '100g', category: 'fruits' },
  { id: '14', name: 'Orange', calories: 47, protein: 0.9, carbs: 12, fat: 0.1, serving: '100g', category: 'fruits' },

  // Vegetables
  { id: '15', name: 'Broccoli', calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, serving: '100g', category: 'vegetables' },
  { id: '16', name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, serving: '100g', category: 'vegetables' },
  { id: '17', name: 'Carrots', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, serving: '100g', category: 'vegetables' },
  { id: '18', name: 'Tomato', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, serving: '100g', category: 'vegetables' },

  // Fats & Nuts
  { id: '19', name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 50, serving: '100g', category: 'nuts' },
  { id: '20', name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15, serving: '100g', category: 'fats' },
  { id: '21', name: 'Olive Oil', calories: 884, protein: 0, carbs: 0, fat: 100, serving: '100g', category: 'fats' },
  { id: '22', name: 'Peanut Butter', calories: 588, protein: 25, carbs: 20, fat: 50, serving: '100g', category: 'fats' },

  // Dairy
  { id: '23', name: 'Milk', calories: 42, protein: 3.4, carbs: 5, fat: 1, serving: '100ml', category: 'dairy' },
  { id: '24', name: 'Cheese', calories: 402, protein: 25, carbs: 1.3, fat: 33, serving: '100g', category: 'dairy' },
  { id: '25', name: 'Cottage Cheese', calories: 98, protein: 11, carbs: 3.4, fat: 4.3, serving: '100g', category: 'dairy' },
];

const categories = [
  { id: 'all', name: 'All', icon: 'food' },
  { id: 'protein', name: 'Protein', icon: 'food-steak' },
  { id: 'grains', name: 'Grains', icon: 'barley' },
  { id: 'fruits', name: 'Fruits', icon: 'food-apple' },
  { id: 'vegetables', name: 'Vegetables', icon: 'carrot' },
  { id: 'dairy', name: 'Dairy', icon: 'cheese' },
  { id: 'nuts', name: 'Nuts', icon: 'peanut' },
  { id: 'fats', name: 'Fats', icon: 'oil' },
];

const FoodLogScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Make params optional with defaults
  const params = route.params as { mealType?: string; date?: Date; barcode?: string } || {};
  const mealType = params.mealType || 'snack';
  const date = params.date || new Date();
  const barcode = params.barcode;

  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFoods, setSelectedFoods] = useState<FoodEntry[]>([]);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customFood, setCustomFood] = useState<Partial<Food>>({
    name: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    serving: '100g'
  });
  const [filteredFoods, setFilteredFoods] = useState(commonFoods);
  const [recentFoods, setRecentFoods] = useState<Food[]>([]);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('100');
  const [unit, setUnit] = useState('g');

  useEffect(() => {
    const init = async () => {
      await ensureDatabase();
      loadRecentFoods();
    };
    init();
  }, []);

  useEffect(() => {
    filterFoods();
  }, [searchText, selectedCategory]);

  const loadRecentFoods = async () => {
    try {
      const db = getSafeDatabase();
      if (!db || !user?.id) return;

      // Load recent foods from last 7 days
      const result = await db.getAllAsync(
        `SELECT DISTINCT foodData FROM food_logs
         WHERE userId = ?
         ORDER BY date DESC
         LIMIT 10`,
        [user.id]
      ) as any[];

      const foods: Food[] = [];
      result.forEach((row: any) => {
        if (row.foodData) {
          try {
            const data = JSON.parse(row.foodData);
            if (data && data.id) {
              foods.push(data);
            }
          } catch (e) {
            console.error('Failed to parse food data:', e);
          }
        }
      });

      setRecentFoods(foods);
    } catch (error) {
      console.error('Failed to load recent foods:', error);
    }
  };

  const filterFoods = () => {
    let filtered = [...commonFoods];

    if (searchText) {
      filtered = filtered.filter(food =>
        food.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(food => food.category === selectedCategory);
    }

    setFilteredFoods(filtered);
  };

  const selectFood = (food: Food) => {
    setSelectedFood(food);
    setQuantity('100');
    setUnit('g');
    setShowQuantityModal(true);
  };

  const addSelectedFood = () => {
    if (!selectedFood) return;

    const multiplier = parseFloat(quantity) / 100;
    const entry: FoodEntry = {
      foodId: selectedFood.id,
      food: {
        ...selectedFood,
        calories: Math.round(selectedFood.calories * multiplier),
        protein: Math.round(selectedFood.protein * multiplier * 10) / 10,
        carbs: Math.round(selectedFood.carbs * multiplier * 10) / 10,
        fat: Math.round(selectedFood.fat * multiplier * 10) / 10,
      },
      quantity: parseFloat(quantity),
      unit
    };

    setSelectedFoods([...selectedFoods, entry]);
    setShowQuantityModal(false);
    setSelectedFood(null);
  };

  const removeFood = (index: number) => {
    setSelectedFoods(selectedFoods.filter((_, i) => i !== index));
  };

  const getTotalNutrition = () => {
    return selectedFoods.reduce((total, entry) => ({
      calories: total.calories + entry.food.calories,
      protein: total.protein + entry.food.protein,
      carbs: total.carbs + entry.food.carbs,
      fat: total.fat + entry.food.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const saveFoods = async () => {
    if (selectedFoods.length === 0) {
      Alert.alert(t('foodLog.noFoodsSelected'), t('foodLog.addAtLeastOne'));
      return;
    }

    console.log('Starting saveFoods with:', selectedFoods.length, 'items');

    try {
      // Ensure database is initialized
      await ensureDatabase();

      const db = getSafeDatabase();
      if (!db || !user?.id) {
        console.error('Database or user not available:', { db: !!db, userId: user?.id });
        Alert.alert(t('alert.error'), t('foodLog.databaseNotAvailable'));
        return;
      }

      const dateStr = format(date, 'yyyy-MM-dd');
      const totals = getTotalNutrition();

      console.log('Saving to database:', {
        userId: user.id,
        date: dateStr,
        mealType,
        itemCount: selectedFoods.length
      });

      // Save each food entry
      for (const entry of selectedFoods) {
        console.log('Inserting food:', entry.food.name, 'calories:', entry.food.calories);

        try {
          const result = await db.runAsync(
            `INSERT INTO food_logs (userId, date, mealType, foodData, calories, protein, carbs, fat, quantity, unit)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              user.id,
              dateStr,
              mealType,
              JSON.stringify(entry.food),
              entry.food.calories * (entry.quantity / 100), // Adjust for quantity
              entry.food.protein * (entry.quantity / 100),
              entry.food.carbs * (entry.quantity / 100),
              entry.food.fat * (entry.quantity / 100),
              entry.quantity,
              entry.unit
            ]
          );

          console.log('Insert result:', result);
        } catch (insertError) {
          console.error('Error inserting food:', insertError);
          // Try using execAsync as fallback
          try {
            await db.execAsync(
              `INSERT INTO food_logs (userId, date, mealType, foodData, calories, protein, carbs, fat, quantity, unit)
               VALUES ('${user.id}', '${dateStr}', '${mealType}', '${JSON.stringify(entry.food).replace(/'/g, "''")}',
                       ${entry.food.calories * (entry.quantity / 100)}, ${entry.food.protein * (entry.quantity / 100)},
                       ${entry.food.carbs * (entry.quantity / 100)}, ${entry.food.fat * (entry.quantity / 100)},
                       ${entry.quantity}, '${entry.unit}')`
            );
            console.log('Insert successful with execAsync');
          } catch (execError) {
            console.error('Error with execAsync too:', execError);
            throw insertError;
          }
        }
      }

      // Verify the data was saved
      try {
        const checkLogs = await db.getAllAsync(
          `SELECT * FROM food_logs WHERE date = ? AND userId = ?`,
          [dateStr, user.id]
        ) as any[];
        console.log('Verification - Food logs saved for date', dateStr, ':', checkLogs.length);
        if (checkLogs.length > 0) {
          console.log('Sample saved log:', checkLogs[0]);
        }
      } catch (verifyError) {
        console.error('Error verifying saved data:', verifyError);
      }

      Alert.alert(
        t('foodLog.foodsAdded'),
        `Added ${selectedFoods.length} items\nTotal: ${totals.calories} cal`,
        [{ text: t('alert.ok'), onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Failed to save foods:', error);
      Alert.alert(t('alert.error'), t('foodLog.saveFailed'));
    }
  };

  const addCustomFood = () => {
    if (!customFood.name || !customFood.calories) {
      Alert.alert(t('foodLog.missingInfo'), t('foodLog.fillRequired'));
      return;
    }

    const newFood: Food = {
      id: `custom_${Date.now()}`,
      name: customFood.name,
      brand: customFood.brand,
      calories: customFood.calories,
      protein: customFood.protein || 0,
      carbs: customFood.carbs || 0,
      fat: customFood.fat || 0,
      serving: customFood.serving || '100g',
      category: 'custom'
    };

    selectFood(newFood);
    setShowAddCustomModal(false);
    setCustomFood({
      name: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      serving: '100g'
    });
  };

  const renderFoodItem = ({ item }: { item: Food }) => (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={() => selectFood(item)}
    >
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodDetails}>
          {item.calories} cal | P: {item.protein}g | C: {item.carbs}g | F: {item.fat}g
        </Text>
        <Text style={styles.foodServing}>{item.serving}</Text>
      </View>
      <MaterialCommunityIcons name="plus-circle" size={24} color={BRAND_COLORS.accent} />
    </TouchableOpacity>
  );

  const totals = getTotalNutrition();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('foodLog.addFood')} - {mealType}</Text>
          <Text style={styles.headerDate}>{format(date, 'MMM dd, yyyy')}</Text>
        </View>
        <TouchableOpacity onPress={saveFoods}>
          <Text style={styles.saveButton}>{t('button.save')}</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={24} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder={t('placeholder.searchFoods')}
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity onPress={() => setShowAddCustomModal(true)}>
          <MaterialCommunityIcons name="plus" size={24} color={BRAND_COLORS.accent} />
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipSelected
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <MaterialCommunityIcons
              name={category.icon as any}
              size={20}
              color={selectedCategory === category.id ? 'white' : '#666'}
            />
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category.id && styles.categoryTextSelected
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Selected Foods Summary */}
      {selectedFoods.length > 0 && (
        <Card style={styles.summaryCard}>
          <Card.Content>
            <Text style={styles.summaryTitle}>{t('foodLog.selected')} ({selectedFoods.length} {t('common.items')})</Text>
            <View style={styles.summaryStats}>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{totals.calories}</Text>
                <Text style={styles.summaryStatLabel}>{t('nutrition.cal')}</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{totals.protein.toFixed(1)}</Text>
                <Text style={styles.summaryStatLabel}>{t('nutrition.protein')}</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{totals.carbs.toFixed(1)}</Text>
                <Text style={styles.summaryStatLabel}>{t('nutrition.carbs')}</Text>
              </View>
              <View style={styles.summaryStatItem}>
                <Text style={styles.summaryStatValue}>{totals.fat.toFixed(1)}</Text>
                <Text style={styles.summaryStatLabel}>{t('nutrition.fat')}</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedFoodsScroll}>
              {selectedFoods.map((entry, index) => (
                <View key={index} style={styles.selectedFoodChip}>
                  <Text style={styles.selectedFoodName}>
                    {entry.food.name} ({entry.quantity}{entry.unit})
                  </Text>
                  <TouchableOpacity onPress={() => removeFood(index)}>
                    <MaterialCommunityIcons name="close" size={16} color="#FF5252" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </Card.Content>
        </Card>
      )}

      {/* Recent Foods */}
      {recentFoods.length > 0 && !searchText && selectedCategory === 'all' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('foodLog.recent')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentFoods.map(food => (
              <TouchableOpacity
                key={food.id}
                style={styles.recentFoodCard}
                onPress={() => selectFood(food)}
              >
                <Text style={styles.recentFoodName}>{food.name}</Text>
                <Text style={styles.recentFoodCalories}>{food.calories} {t('nutrition.cal')}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Foods List */}
      <FlatList
        data={filteredFoods}
        renderItem={renderFoodItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.foodsList}
        ListHeaderComponent={
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? t('foodLog.allFoods') : categories.find(c => c.id === selectedCategory)?.name}
          </Text>
        }
      />

      {/* Quantity Modal */}
      <Modal
        visible={showQuantityModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQuantityModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{selectedFood?.name}</Text>
            <Text style={styles.modalSubtitle}>
              {selectedFood?.calories} cal per {selectedFood?.serving}
            </Text>

            <View style={styles.quantityRow}>
              <TextInput
                style={styles.quantityInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                placeholder={t('placeholder.servingSize')}
              />
              <View style={styles.unitSelector}>
                <TouchableOpacity
                  style={[styles.unitButton, unit === 'g' && styles.unitButtonSelected]}
                  onPress={() => setUnit('g')}
                >
                  <Text style={[styles.unitText, unit === 'g' && styles.unitTextSelected]}>g</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitButton, unit === 'ml' && styles.unitButtonSelected]}
                  onPress={() => setUnit('ml')}
                >
                  <Text style={[styles.unitText, unit === 'ml' && styles.unitTextSelected]}>ml</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.unitButton, unit === 'pcs' && styles.unitButtonSelected]}
                  onPress={() => setUnit('pcs')}
                >
                  <Text style={[styles.unitText, unit === 'pcs' && styles.unitTextSelected]}>pcs</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.nutritionPreview}>
              <Text style={styles.nutritionPreviewTitle}>{t('foodLog.nutritionFor')} {quantity}{unit}:</Text>
              <View style={styles.nutritionPreviewRow}>
                <Text>{t('nutrition.calories')}: {Math.round((selectedFood?.calories || 0) * parseFloat(quantity || '0') / 100)}</Text>
                <Text>{t('nutrition.protein')}: {((selectedFood?.protein || 0) * parseFloat(quantity || '0') / 100).toFixed(1)}g</Text>
              </View>
              <View style={styles.nutritionPreviewRow}>
                <Text>{t('nutrition.carbs')}: {((selectedFood?.carbs || 0) * parseFloat(quantity || '0') / 100).toFixed(1)}g</Text>
                <Text>{t('nutrition.fat')}: {((selectedFood?.fat || 0) * parseFloat(quantity || '0') / 100).toFixed(1)}g</Text>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowQuantityModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('button.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={addSelectedFood}
              >
                <Text style={styles.addButtonText}>{t('button.add')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Custom Food Modal */}
      <Modal
        visible={showAddCustomModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('foodLog.addCustomFood')}</Text>

            <TextInput
              style={styles.modalInput}
              placeholder={t('placeholder.foodName')}
              value={customFood.name}
              onChangeText={(text) => setCustomFood({ ...customFood, name: text })}
            />

            <TextInput
              style={styles.modalInput}
              placeholder={t('placeholder.brand')}
              value={customFood.brand}
              onChangeText={(text) => setCustomFood({ ...customFood, brand: text })}
            />

            <View style={styles.nutritionInputRow}>
              <View style={styles.nutritionInputContainer}>
                <Text style={styles.nutritionInputLabel}>{t('nutrition.calories')}</Text>
                <TextInput
                  style={styles.nutritionInput}
                  placeholder="0"
                  value={customFood.calories?.toString()}
                  onChangeText={(text) => setCustomFood({ ...customFood, calories: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.nutritionInputContainer}>
                <Text style={styles.nutritionInputLabel}>{t('nutrition.proteinG')}</Text>
                <TextInput
                  style={styles.nutritionInput}
                  placeholder="0"
                  value={customFood.protein?.toString()}
                  onChangeText={(text) => setCustomFood({ ...customFood, protein: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.nutritionInputRow}>
              <View style={styles.nutritionInputContainer}>
                <Text style={styles.nutritionInputLabel}>{t('nutrition.carbsG')}</Text>
                <TextInput
                  style={styles.nutritionInput}
                  placeholder="0"
                  value={customFood.carbs?.toString()}
                  onChangeText={(text) => setCustomFood({ ...customFood, carbs: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.nutritionInputContainer}>
                <Text style={styles.nutritionInputLabel}>{t('nutrition.fatG')}</Text>
                <TextInput
                  style={styles.nutritionInput}
                  placeholder="0"
                  value={customFood.fat?.toString()}
                  onChangeText={(text) => setCustomFood({ ...customFood, fat: parseFloat(text) || 0 })}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder={t('placeholder.servingSizeExample')}
              value={customFood.serving}
              onChangeText={(text) => setCustomFood({ ...customFood, serving: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddCustomModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('button.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={addCustomFood}
              >
                <Text style={styles.addButtonText}>{t('button.add')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerDate: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  saveButton: {
    color: BRAND_COLORS.accent,
    fontSize: 16,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    marginHorizontal: 10,
    fontSize: 16,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    maxHeight: 50,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  categoryChipSelected: {
    backgroundColor: BRAND_COLORS.accent,
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextSelected: {
    color: 'white',
  },
  summaryCard: {
    margin: 16,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  summaryStatItem: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: BRAND_COLORS.accent,
  },
  summaryStatLabel: {
    fontSize: 12,
    color: '#666',
  },
  selectedFoodsScroll: {
    marginTop: 8,
  },
  selectedFoodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    gap: 6,
  },
  selectedFoodName: {
    fontSize: 12,
    color: '#333',
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  recentFoodCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    marginLeft: 16,
    marginRight: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  recentFoodName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  recentFoodCalories: {
    fontSize: 12,
    color: '#666',
  },
  foodsList: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  foodItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  foodDetails: {
    fontSize: 13,
    color: '#666',
  },
  foodServing: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: width - 40,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 18,
    textAlign: 'center',
  },
  unitSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  unitButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2A2A2A',
  },
  unitButtonSelected: {
    backgroundColor: BRAND_COLORS.accent,
  },
  unitText: {
    fontSize: 16,
    color: '#666',
  },
  unitTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  nutritionPreview: {
    backgroundColor: '#2A2A2A',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  nutritionPreviewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  nutritionPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nutritionInputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  nutritionInputContainer: {
    flex: 1,
  },
  nutritionInputLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  nutritionInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#2A2A2A',
  },
  addButton: {
    backgroundColor: BRAND_COLORS.accent,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FoodLogScreen;