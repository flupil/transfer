import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Card,
  Button,
  IconButton,
  Chip,
  FAB,
  SegmentedButtons,
  DataTable,
  Divider,
  List,
  Avatar,
  ProgressBar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// import { BarCodeScanner } from 'expo-barcode-scanner'; // Temporarily disabled due to build issues
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { foodDatabaseService } from '../../services/foodDatabaseService';
import { nutritionService } from '../../services/nutritionService';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BRAND_COLORS } from '../../constants/brandColors';

const { width, height } = Dimensions.get('window');

interface FoodItem {
  id: string;
  name: string;
  brand?: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  imageUrl?: string;
}

interface MealEntry {
  foodId: string;
  foodName: string;
  brand?: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const CompleteFoodLogScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { t } = useLanguage();

  // State
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedMeal, setSelectedMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [meals, setMeals] = useState<{
    breakfast: MealEntry[];
    lunch: MealEntry[];
    dinner: MealEntry[];
    snack: MealEntry[];
  }>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: [],
  });

  // Search and add food
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [recentFoods, setRecentFoods] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [customUnit, setCustomUnit] = useState('');

  // Barcode scanner
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  // Nutrition targets
  const [nutritionTargets, setNutritionTargets] = useState({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fat: 65,
  });

  // Daily totals
  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
  });

  // Water tracking
  const [waterIntake, setWaterIntake] = useState(0); // ml
  const waterGoal = 2000; // ml

  // Create food modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFood, setNewFood] = useState({
    name: '',
    brand: '',
    servingSize: '100',
    servingUnit: 'g',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
  });

  useEffect(() => {
    loadDailyData();
    loadRecentFoods();
    requestCameraPermission();
    initializeFoodDatabase();
  }, [selectedDate]);

  const initializeFoodDatabase = async () => {
    await foodDatabaseService.initializeDefaultFoods();
  };

  const loadDailyData = async () => {
    try {
      const dailyData = await nutritionService.getDailyNutrition(
        user?.id || '1',
        selectedDate
      );

      // Load meals
      const mealsByType: any = {
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
      };

      dailyData.meals.forEach(meal => {
        if (mealsByType[meal.mealType]) {
          mealsByType[meal.mealType] = meal.items;
        }
      });

      setMeals(mealsByType);
      setDailyTotals({
        calories: dailyData.totalCalories,
        protein: dailyData.totalProtein,
        carbs: dailyData.totalCarbs,
        fat: dailyData.totalFat,
        fiber: dailyData.totalFiber,
      });

      // Load water intake
      const water = await nutritionService.getDailyWater(user?.id || '1', selectedDate);
      setWaterIntake(water);

      // Load targets
      setNutritionTargets({
        calories: dailyData.targetCalories,
        protein: dailyData.targetProtein,
        carbs: dailyData.targetCarbs,
        fat: dailyData.targetFat,
      });
    } catch (error) {
      console.error('Failed to load daily data:', error);
    }
  };

  const loadRecentFoods = async () => {
    try {
      const recent = await foodDatabaseService.getRecentFoods(user?.id || '1');
      setRecentFoods(recent);
    } catch (error) {
      console.error('Failed to load recent foods:', error);
    }
  };

  const requestCameraPermission = async () => {
    // Barcode scanner temporarily disabled
    setHasPermission(false);
  };

  const openScanner = async () => {
    // Barcode scanner temporarily disabled
    Alert.alert('Feature Unavailable', 'Barcode scanner is temporarily disabled in this build');
    return;

    /* Original code:
    setScanned(false); // Reset scanned state
    if (hasPermission === null) {
      await requestCameraPermission();
    }
    if (hasPermission === false) {
      Alert.alert(t('alert.error'), t('foodLog.noCameraAccess'));
      return;
    }
    */
    setShowAddModal(false);
    setShowScanner(true);
  };

  const searchFoods = async () => {
    if (searchQuery.length < 2) return;

    setIsSearching(true);
    try {
      const results = await foodDatabaseService.searchFoods(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Failed to search foods:', error);
      Alert.alert(t('alert.error'), t('foodLog.searchFailed'));
    } finally {
      setIsSearching(false);
    }
  };

  const handleBarCodeScanned = async ({ type, data }: { type: string; data: string }) => {
    setScanned(true);
    setShowScanner(false);

    try {
      const food = await foodDatabaseService.scanBarcode(data);
      if (food) {
        setSelectedFood(food);
        setShowAddModal(true);
      } else {
        Alert.alert(t('alert.notFound'), t('foodLog.productNotFound'));
      }
    } catch (error) {
      console.error('Failed to scan barcode:', error);
      Alert.alert(t('alert.error'), t('foodLog.barcodeScanFailed'));
    }

    setScanned(false);
  };

  const addFoodToMeal = async () => {
    if (!selectedFood) return;

    const quantityNum = parseFloat(quantity) || 1;
    const multiplier = quantityNum * (selectedFood.servingSize / 100);

    const entry: MealEntry = {
      foodId: selectedFood.id,
      foodName: selectedFood.name,
      brand: selectedFood.brand,
      quantity: quantityNum,
      unit: customUnit || selectedFood.servingUnit,
      calories: Math.round(selectedFood.calories * multiplier),
      protein: Math.round(selectedFood.protein * multiplier * 10) / 10,
      carbs: Math.round(selectedFood.carbs * multiplier * 10) / 10,
      fat: Math.round(selectedFood.fat * multiplier * 10) / 10,
    };

    // Add to current meal
    const updatedMeals = { ...meals };
    updatedMeals[selectedMeal].push(entry);
    setMeals(updatedMeals);

    // Save to database
    await nutritionService.logMeal({
      userId: user?.id || '1',
      date: selectedDate,
      meals: [{
        id: Date.now().toString(),
        mealType: selectedMeal,
        time: new Date().toISOString(),
        items: [{
          foodId: entry.foodId,
          foodName: entry.foodName || entry.name,
          quantity: entry.quantity || 1,
          unit: entry.unit || 'g',
          macros: {
            calories: entry.calories || 0,
            protein: entry.protein || 0,
            carbs: entry.carbs || 0,
            fat: entry.fat || 0
          },
          isQuickAdd: false
        }]
      }],
      water: 0,
      totals: {
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat
      },
      targets: {
        calories: 2000,
        protein: 150,
        carbs: 250,
        fat: 65
      }
    });

    // Track as recent
    await foodDatabaseService.trackRecentFood(user?.id || '1', selectedFood.id);

    // Update totals
    setDailyTotals(prev => ({
      calories: prev.calories + entry.calories,
      protein: prev.protein + entry.protein,
      carbs: prev.carbs + entry.carbs,
      fat: prev.fat + entry.fat,
      fiber: prev.fiber,
    }));

    // Close modal and reset
    setShowAddModal(false);
    setSelectedFood(null);
    setQuantity('1');
    setCustomUnit('');
    setSearchQuery('');
    setSearchResults([]);

    Alert.alert(t('alert.success'), t('foodLog.foodAdded', { food: selectedFood.name, meal: selectedMeal }));
  };

  const createCustomFood = async () => {
    if (!newFood.name || !newFood.calories) {
      Alert.alert(t('alert.error'), t('foodLog.fillRequired'));
      return;
    }

    try {
      const customFood: FoodItem = {
        id: `custom_${Date.now()}`,
        name: newFood.name,
        brand: newFood.brand,
        servingSize: parseFloat(newFood.servingSize) || 100,
        servingUnit: newFood.servingUnit,
        calories: parseFloat(newFood.calories) || 0,
        protein: parseFloat(newFood.protein) || 0,
        carbs: parseFloat(newFood.carbs) || 0,
        fat: parseFloat(newFood.fat) || 0,
        fiber: parseFloat(newFood.fiber),
      };

      await foodDatabaseService.addFood({
        ...customFood,
        source: 'user',
        userId: user?.id,
      });

      setSelectedFood(customFood);
      setShowCreateModal(false);
      setShowAddModal(true);

      // Reset form
      setNewFood({
        name: '',
        brand: '',
        servingSize: '100',
        servingUnit: 'g',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        fiber: '',
      });
    } catch (error) {
      console.error('Failed to create custom food:', error);
      Alert.alert(t('alert.error'), t('foodLog.createFailed'));
    }
  };

  const removeFoodFromMeal = (mealType: string, index: number) => {
    const updatedMeals = { ...meals };
    const removed = updatedMeals[mealType][index];
    updatedMeals[mealType].splice(index, 1);
    setMeals(updatedMeals);

    // Update totals
    setDailyTotals(prev => ({
      calories: prev.calories - removed.calories,
      protein: prev.protein - removed.protein,
      carbs: prev.carbs - removed.carbs,
      fat: prev.fat - removed.fat,
      fiber: prev.fiber,
    }));
  };

  const addWater = async (amount: number) => {
    const newTotal = waterIntake + amount;
    setWaterIntake(newTotal);
    await nutritionService.logWater(user?.id || '1', amount);

    if (newTotal >= waterGoal && waterIntake < waterGoal) {
      Alert.alert(t('water.goalReached'), t('water.dailyGoalReached'));
    }
  };

  const getMacroPercentage = (macro: 'protein' | 'carbs' | 'fat'): number => {
    const totalCals = dailyTotals.calories || 1;
    const calPerGram = { protein: 4, carbs: 4, fat: 9 };
    return (dailyTotals[macro] * calPerGram[macro] / totalCals) * 100;
  };

  const renderMealSection = (mealType: keyof typeof meals, title: string, icon: string) => {
    const mealItems = meals[mealType];
    const mealCalories = mealItems.reduce((sum, item) => sum + item.calories, 0);

    return (
      <Card style={styles.mealCard}>
        <Card.Title
          title={title}
          subtitle={`${mealCalories} cal`}
          left={(props) => <Avatar.Icon {...props} icon={icon} size={40} />}
          right={(props) => (
            <IconButton
              {...props}
              icon="plus"
              onPress={() => {
                setSelectedMeal(mealType);
                setShowAddModal(true);
              }}
            />
          )}
        />
        <Card.Content>
          {mealItems.length === 0 ? (
            <Text style={styles.emptyMealText}>{t('common.noDataYet')}</Text>
          ) : (
            mealItems.map((item, index) => (
              <List.Item
                key={index}
                title={item.foodName}
                description={`${item.quantity} ${item.unit} • ${item.calories} cal`}
                right={() => (
                  <View style={styles.macroChips}>
                    <Chip compact style={styles.macroChip}>P: {item.protein}g</Chip>
                    <Chip compact style={styles.macroChip}>C: {item.carbs}g</Chip>
                    <Chip compact style={styles.macroChip}>F: {item.fat}g</Chip>
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => removeFoodFromMeal(mealType, index)}
                    />
                  </View>
                )}
              />
            ))
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      {/* Date Selector */}
      <View style={styles.dateSelector}>
        <IconButton
          icon="chevron-left"
          onPress={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() - 1);
            setSelectedDate(newDate);
          }}
        />
        <TouchableOpacity onPress={() => setSelectedDate(new Date())}>
          <Text style={styles.dateText}>
            {selectedDate.toDateString() === new Date().toDateString()
              ? 'Today'
              : selectedDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
        <IconButton
          icon="chevron-right"
          onPress={() => {
            const newDate = new Date(selectedDate);
            newDate.setDate(newDate.getDate() + 1);
            setSelectedDate(newDate);
          }}
        />
      </View>

      {/* Daily Summary */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <View style={styles.calorieRow}>
            <View style={styles.calorieItem}>
              <Text style={styles.calorieLabel}>Eaten</Text>
              <Text style={styles.calorieValue}>{dailyTotals.calories}</Text>
            </View>
            <View style={styles.calorieItem}>
              <Text style={styles.calorieLabel}>Remaining</Text>
              <Text style={[styles.calorieValue, styles.remainingCalories]}>
                {nutritionTargets.calories - dailyTotals.calories}
              </Text>
            </View>
            <View style={styles.calorieItem}>
              <Text style={styles.calorieLabel}>Goal</Text>
              <Text style={styles.calorieValue}>{nutritionTargets.calories}</Text>
            </View>
          </View>

          <ProgressBar
            progress={Math.min(1, dailyTotals.calories / nutritionTargets.calories)}
            color={dailyTotals.calories > nutritionTargets.calories ? '#FF5252' : BRAND_COLORS.accent}
            style={styles.progressBar}
          />

          {/* Macros */}
          <View style={styles.macrosRow}>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{dailyTotals.protein}g</Text>
              <Text style={styles.macroPercentage}>{getMacroPercentage('protein').toFixed(0)}%</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Carbs</Text>
              <Text style={styles.macroValue}>{dailyTotals.carbs}g</Text>
              <Text style={styles.macroPercentage}>{getMacroPercentage('carbs').toFixed(0)}%</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Fat</Text>
              <Text style={styles.macroValue}>{dailyTotals.fat}g</Text>
              <Text style={styles.macroPercentage}>{getMacroPercentage('fat').toFixed(0)}%</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Water Tracking */}
      <Card style={styles.waterCard}>
        <Card.Content>
          <View style={styles.waterHeader}>
            <Text style={styles.waterTitle}>Water Intake</Text>
            <Text style={styles.waterAmount}>{waterIntake} / {waterGoal} ml</Text>
          </View>
          <ProgressBar
            progress={Math.min(1, waterIntake / waterGoal)}
            color="#3B82F6"
            style={styles.waterProgress}
          />
          <View style={styles.waterButtons}>
            <Button onPress={() => addWater(250)} compact>+250ml</Button>
            <Button onPress={() => addWater(500)} compact>+500ml</Button>
            <Button onPress={() => addWater(750)} compact>+750ml</Button>
          </View>
        </Card.Content>
      </Card>

      {/* Meals */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderMealSection('breakfast', 'Breakfast', 'coffee')}
        {renderMealSection('lunch', 'Lunch', 'food')}
        {renderMealSection('dinner', 'Dinner', 'silverware-fork-knife')}
        {renderMealSection('snack', 'Snacks', 'cookie')}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Food Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedFood ? t('foodLog.addFood') : t('foodLog.addToMeal', { meal: selectedMeal })}
              </Text>
              <IconButton
                icon="close"
                onPress={() => {
                  setShowAddModal(false);
                  setSelectedFood(null);
                }}
              />
            </View>

            {selectedFood ? (
              // Food selected, show quantity input
              <View style={styles.foodDetails}>
                <Text style={styles.foodName}>{selectedFood.name}</Text>
                {selectedFood.brand && (
                  <Text style={styles.foodBrand}>{selectedFood.brand}</Text>
                )}

                <View style={styles.nutritionInfo}>
                  <Text style={styles.nutritionLabel}>Per {selectedFood.servingSize}{selectedFood.servingUnit}:</Text>
                  <View style={styles.nutritionRow}>
                    <Text>Calories: {selectedFood.calories}</Text>
                    <Text>Protein: {selectedFood.protein}g</Text>
                  </View>
                  <View style={styles.nutritionRow}>
                    <Text>Carbs: {selectedFood.carbs}g</Text>
                    <Text>Fat: {selectedFood.fat}g</Text>
                  </View>
                </View>

                <View style={styles.quantityInput}>
                  <Text style={styles.quantityLabel}>Quantity</Text>
                  <TextInput
                    style={styles.quantityField}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                  />
                  <Text style={styles.unitText}>{selectedFood.servingUnit}</Text>
                </View>

                <Button
                  mode="contained"
                  onPress={addFoodToMeal}
                  style={styles.addButton}
                >
                  {t('foodLog.addToMeal', { meal: selectedMeal })}
                </Button>
              </View>
            ) : (
              // Search for food
              <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder={t('placeholder.searchFoods')}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={searchFoods}
                  />
                  <IconButton icon="magnify" onPress={searchFoods} />
                </View>

                <View style={styles.quickActions}>
                  <Button
                    icon="barcode-scan"
                    mode="outlined"
                    onPress={openScanner}
                    style={styles.quickButton}
                  >
                    Scan
                  </Button>
                  <Button
                    icon="plus"
                    mode="outlined"
                    onPress={() => {
                      setShowAddModal(false);
                      setShowCreateModal(true);
                    }}
                    style={styles.quickButton}
                  >
                    Create
                  </Button>
                </View>

                {/* Recent Foods */}
                {recentFoods.length > 0 && searchQuery === '' && (
                  <View>
                    <Text style={styles.sectionTitle}>Recent</Text>
                    <FlatList
                      data={recentFoods}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={styles.foodItem}
                          onPress={() => setSelectedFood(item)}
                        >
                          <Text style={styles.foodItemName}>{item.name}</Text>
                          <Text style={styles.foodItemCalories}>{item.calories} cal</Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                )}

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.foodItem}
                        onPress={() => setSelectedFood(item)}
                      >
                        <View>
                          <Text style={styles.foodItemName}>{item.name}</Text>
                          {item.brand && <Text style={styles.foodItemBrand}>{item.brand}</Text>}
                        </View>
                        <Text style={styles.foodItemCalories}>{item.calories} cal</Text>
                      </TouchableOpacity>
                    )}
                  />
                )}
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Barcode Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowScanner(false)}
      >
        <View style={styles.scannerContainer}>
          {hasPermission === false ? (
            <Text>{t('foodLog.noCameraAccess')}</Text>
          ) : (
            <BarCodeScanner
              onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          <View style={styles.scannerOverlay}>
            <Text style={styles.scannerText}>{t('foodLog.scanBarcode')}</Text>
            <View style={styles.scannerFrame} />
            <Button
              mode="contained"
              onPress={() => setShowScanner(false)}
              style={styles.scannerButton}
            >
              {t('button.cancel')}
            </Button>
          </View>
        </View>
      </Modal>

      {/* Create Food Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Custom Food</Text>
              <IconButton
                icon="close"
                onPress={() => setShowCreateModal(false)}
              />
            </View>

            <ScrollView style={styles.createForm}>
              <TextInput
                style={styles.input}
                placeholder={t('placeholder.foodName')}
                value={newFood.name}
                onChangeText={(text) => setNewFood({...newFood, name: text})}
              />

              <TextInput
                style={styles.input}
                placeholder={t('placeholder.brand')}
                value={newFood.brand}
                onChangeText={(text) => setNewFood({...newFood, brand: text})}
              />

              <View style={styles.servingRow}>
                <TextInput
                  style={[styles.input, styles.servingInput]}
                  placeholder={t('placeholder.servingSize')}
                  value={newFood.servingSize}
                  onChangeText={(text) => setNewFood({...newFood, servingSize: text})}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.servingInput]}
                  placeholder={t('placeholder.unit')}
                  value={newFood.servingUnit}
                  onChangeText={(text) => setNewFood({...newFood, servingUnit: text})}
                />
              </View>

              <Text style={styles.nutritionTitle}>{t('form.nutritionFacts')}</Text>

              <TextInput
                style={styles.input}
                placeholder={t('form.calories')}
                value={newFood.calories}
                onChangeText={(text) => setNewFood({...newFood, calories: text})}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder={t('form.protein')}
                value={newFood.protein}
                onChangeText={(text) => setNewFood({...newFood, protein: text})}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder={t('form.carbs')}
                value={newFood.carbs}
                onChangeText={(text) => setNewFood({...newFood, carbs: text})}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder={t('form.fat')}
                value={newFood.fat}
                onChangeText={(text) => setNewFood({...newFood, fat: text})}
                keyboardType="numeric"
              />

              <TextInput
                style={styles.input}
                placeholder={t('form.fiber')}
                value={newFood.fiber}
                onChangeText={(text) => setNewFood({...newFood, fiber: text})}
                keyboardType="numeric"
              />

              <Button
                mode="contained"
                onPress={createCustomFood}
                style={styles.createButton}
              >
                {t('foodLog.createFood')}
              </Button>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* FAB */}
      <FAB
        icon="barcode-scan"
        style={styles.fab}
        onPress={openScanner}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  dateSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
  },
  summaryCard: {
    margin: 10,
  },
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  calorieItem: {
    alignItems: 'center',
  },
  calorieLabel: {
    fontSize: 12,
    color: '#666',
  },
  calorieValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  remainingCalories: {
    color: BRAND_COLORS.accent,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    color: '#666',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 2,
  },
  macroPercentage: {
    fontSize: 11,
    color: '#999',
  },
  waterCard: {
    marginHorizontal: 10,
    marginBottom: 10,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  waterTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  waterAmount: {
    fontSize: 16,
    color: '#3B82F6',
  },
  waterProgress: {
    height: 8,
    borderRadius: 4,
    marginBottom: 10,
  },
  waterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scrollView: {
    flex: 1,
  },
  mealCard: {
    margin: 10,
  },
  emptyMealText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  macroChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  macroChip: {
    height: 24,
    backgroundColor: '#f0f0f0',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
    padding: 20,
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
  foodDetails: {
    padding: 20,
  },
  foodName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  foodBrand: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  nutritionInfo: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  nutritionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  quantityInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    marginRight: 15,
  },
  quantityField: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 16,
    width: 100,
    textAlign: 'center',
  },
  unitText: {
    fontSize: 16,
    marginLeft: 10,
  },
  addButton: {
    marginTop: 10,
  },
  searchSection: {
    flex: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  quickButton: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  foodItemName: {
    fontSize: 16,
    fontWeight: '500',
  },
  foodItemBrand: {
    fontSize: 12,
    color: '#666',
  },
  foodItemCalories: {
    fontSize: 14,
    color: BRAND_COLORS.accent,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
  },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerText: {
    fontSize: 20,
    color: 'white',
    marginBottom: 20,
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: 'white',
    backgroundColor: 'transparent',
  },
  scannerButton: {
    marginTop: 50,
  },
  createForm: {
    maxHeight: height * 0.6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  servingRow: {
    flexDirection: 'row',
    gap: 10,
  },
  servingInput: {
    flex: 1,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  createButton: {
    marginTop: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: BRAND_COLORS.accent,
  },
});