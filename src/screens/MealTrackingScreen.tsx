import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { BRAND_COLORS } from '../constants/brandColors';
import {
  getTodayMacros,
  addMacroEntry,
  getFoodDatabase,
  removeMacroEntry,
} from '../services/macroTrackingService';

const { width } = Dimensions.get('window');

const MealTrackingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors, isDark } = useTheme();
  const { mealType, mealTime } = route.params as { mealType: string; mealTime: string };

  const [selectedTab, setSelectedTab] = useState('meal');
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
  const [macros, setMacros] = useState({
    calories: { current: 0, target: 2000 },
    protein: { current: 0, target: 150 },
    carbs: { current: 0, target: 250 },
    fat: { current: 0, target: 65 },
  });
  const [mealEntries, setMealEntries] = useState<any[]>([]);
  const [foodDatabase] = useState(getFoodDatabase());

  // Load data on mount
  useEffect(() => {
    loadMacroData();
  }, []);

  const loadMacroData = async () => {
    try {
      const data = await getTodayMacros();
      const mealFoods = data.entries.filter(
        (entry: any) => entry.meal === mealType.toLowerCase()
      );

      // Calculate meal-specific macros
      const mealMacros = mealFoods.reduce(
        (acc: any, food: any) => ({
          calories: acc.calories + food.calories,
          protein: acc.protein + food.protein,
          carbs: acc.carbs + food.carbs,
          fat: acc.fat + food.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      // Set meal-specific targets (roughly 1/3 of daily)
      const mealTargets = {
        calories: Math.round(data.targets.calories / 3),
        protein: Math.round(data.targets.protein / 3),
        carbs: Math.round(data.targets.carbs / 3),
        fat: Math.round(data.targets.fat / 3),
      };

      setMacros({
        calories: { current: mealMacros.calories, target: mealTargets.calories },
        protein: { current: mealMacros.protein, target: mealTargets.protein },
        carbs: { current: mealMacros.carbs, target: mealTargets.carbs },
        fat: { current: mealMacros.fat, target: mealTargets.fat },
      });

      setMealEntries(mealFoods);
      setCheckedItems(mealFoods.map((f: any) => f.id));
    } catch (error) {
      console.error('Failed to load macro data:', error);
    }
  };

  const toggleFood = async (food: any) => {
    try {
      const isChecked = checkedItems.some(id => id === food.name);

      if (!isChecked) {
        // Add food
        await addMacroEntry({
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          meal: mealType.toLowerCase() as any,
        });
        setCheckedItems([...checkedItems, food.name]);
      } else {
        // Remove food
        const entry = mealEntries.find(e => e.name === food.name);
        if (entry) {
          await removeMacroEntry(entry.id);
        }
        setCheckedItems(checkedItems.filter(id => id !== food.name));
      }

      await loadMacroData();
    } catch (error) {
      Alert.alert('Error', 'Failed to update food');
    }
  };

  // Get Hebrew meal name
  const getMealName = () => {
    switch (mealType.toLowerCase()) {
      case 'breakfast': return 'ארוחת בוקר';
      case 'lunch': return 'ארוחת צהריים';
      case 'dinner': return 'ארוחת ערב';
      case 'snack': return 'חטיף';
      default: return mealType;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#2A2A2A' }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={BRAND_COLORS.accent} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{getMealName()}</Text>
          <Text style={styles.headerTime}>{mealTime}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {/* Macro Cards */}
      <View style={styles.macroRow}>
        <View style={[styles.macroCard, { backgroundColor: '#FFE8E8' }]}>
          <MaterialCommunityIcons name="fire" size={24} color={BRAND_COLORS.accent} />
          <Text style={styles.macroLabel}>Calories</Text>
          <Text style={styles.macroValue}>
            {Math.round(macros.calories.current)}/{macros.calories.target}
          </Text>
        </View>

        <View style={[styles.macroCard, { backgroundColor: '#E8E8FF' }]}>
          <MaterialCommunityIcons name="arm-flex" size={24} color="#6B6BFF" />
          <Text style={styles.macroLabel}>Protein</Text>
          <Text style={styles.macroValue}>
            {Math.round(macros.protein.current)}/{macros.protein.target}g
          </Text>
        </View>

        <View style={[styles.macroCard, { backgroundColor: '#FFF8E8' }]}>
          <MaterialCommunityIcons name="grain" size={24} color="#FFB347" />
          <Text style={styles.macroLabel}>Carbs</Text>
          <Text style={styles.macroValue}>
            {Math.round(macros.carbs.current)}/{macros.carbs.target}g
          </Text>
        </View>

        <View style={[styles.macroCard, { backgroundColor: '#E8FFE8' }]}>
          <Ionicons name="water" size={24} color="#66BB6A" />
          <Text style={styles.macroLabel}>Fat</Text>
          <Text style={styles.macroValue}>
            {Math.round(macros.fat.current)}/{macros.fat.target}g
          </Text>
        </View>
      </View>

      {/* Tab Buttons */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'favorites' && styles.activeTab]}
          onPress={() => setSelectedTab('favorites')}
        >
          <MaterialCommunityIcons name="star" size={18} color={selectedTab === 'favorites' ? BRAND_COLORS.accent : '#999'} />
          <Text style={[styles.tabText, selectedTab === 'favorites' && styles.activeTabText]}>
            Favorites
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'meal' && styles.activeTab]}
          onPress={() => setSelectedTab('meal')}
        >
          <Text style={[styles.tabText, selectedTab === 'meal' && styles.activeTabText]}>
            All Foods
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={18} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Food List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Show existing meal entries first */}
        {mealEntries.map((entry, index) => (
          <View key={entry.id} style={styles.foodItem}>
            <TouchableOpacity
              style={styles.checkboxWrapper}
              onPress={() => toggleFood(entry)}
            >
              <View style={[styles.checkbox, styles.checkboxChecked]}>
                <Ionicons name="checkmark" size={18} color="white" />
              </View>
            </TouchableOpacity>

            <View style={styles.foodContent}>
              <Text style={styles.foodTitle}>{entry.name}</Text>
              <View style={styles.foodDetails}>
                <View style={styles.caloriesInfo}>
                  <MaterialCommunityIcons name="fire" size={16} color={BRAND_COLORS.accent} />
                  <Text style={styles.caloriesText}>{entry.calories} calories</Text>
                </View>
                <View style={styles.macroInfo}>
                  <Text style={styles.macroText}>P: {entry.protein}g</Text>
                  <Text style={styles.macroText}>C: {entry.carbs}g</Text>
                  <Text style={styles.macroText}>F: {entry.fat}g</Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* Show available foods */}
        {foodDatabase.map((food, index) => {
          const isChecked = checkedItems.includes(food.name);
          return (
            <View key={food.name} style={styles.foodItem}>
              <TouchableOpacity
                style={styles.checkboxWrapper}
                onPress={() => toggleFood(food)}
              >
                <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                  {isChecked && (
                    <Ionicons name="checkmark" size={18} color="white" />
                  )}
                </View>
              </TouchableOpacity>

              <View style={styles.foodContent}>
                <Text style={styles.foodTitle}>{food.name}</Text>
                <View style={styles.foodDetails}>
                  <View style={styles.caloriesInfo}>
                    <MaterialCommunityIcons name="fire" size={16} color={BRAND_COLORS.accent} />
                    <Text style={styles.caloriesText}>{food.calories} cal</Text>
                  </View>
                  <View style={styles.servingInfo}>
                    <Text style={styles.servingText}>{food.serving}</Text>
                  </View>
                  <View style={styles.macroInfo}>
                    <Text style={styles.macroText}>P: {food.protein}g</Text>
                    <Text style={styles.macroText}>C: {food.carbs}g</Text>
                    <Text style={styles.macroText}>F: {food.fat}g</Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.goBack()}>
          <Ionicons name="home" size={22} color={BRAND_COLORS.accent} />
          <Text style={[styles.navLabel, { color: BRAND_COLORS.accent }]}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Workout' as never)}>
          <MaterialCommunityIcons name="dumbbell" size={22} color="#999" />
          <Text style={styles.navLabel}>Workout</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Nutrition' as never)}>
          <MaterialCommunityIcons name="silverware-fork-knife" size={22} color="#999" />
          <Text style={styles.navLabel}>Nutrition</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate('Progress' as never)}>
          <Ionicons name="trending-up" size={22} color="#999" />
          <Text style={styles.navLabel}>Progress</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem}>
          <MaterialCommunityIcons name="file-document-outline" size={22} color="#999" />
          <Text style={styles.navLabel}>Docs</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color: '#333',
    marginBottom: 4,
  },
  headerTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: BRAND_COLORS.accent,
  },
  macroRow: {
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
  macroLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  macroValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: 'white',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
    gap: 6,
  },
  activeTab: {
    borderColor: BRAND_COLORS.accent,
    backgroundColor: '#FFF5F0',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: BRAND_COLORS.accent,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'white',
  },
  foodItem: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  checkboxWrapper: {
    marginRight: 16,
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
  foodTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  foodDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  caloriesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  caloriesText: {
    fontSize: 13,
    color: '#666',
  },
  servingInfo: {
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  servingText: {
    fontSize: 12,
    color: '#666',
  },
  macroInfo: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 'auto',
  },
  macroText: {
    fontSize: 12,
    color: '#999',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 8,
    paddingBottom: 12,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  navLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
});

export default MealTrackingScreen;