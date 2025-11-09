import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StatusBar,
  FlatList,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import customFoodsService, { CustomFood, CustomMeal } from '../../services/customFoodsService';
import firebaseDailyDataService from '../../services/firebaseDailyDataService';
import { Alert } from 'react-native';

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
}

const MealLogScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { mealType, mealName } = route.params as { mealType: string; mealName: string };

  const [activeTab, setActiveTab] = useState<'favorites' | 'myFoods' | 'myMeals'>('favorites');
  const [searchQuery, setSearchQuery] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current; // For moving the block

  const [favorites, setFavorites] = useState<CustomFood[]>([]);
  const [myFoods, setMyFoods] = useState<CustomFood[]>([]);
  const [myMeals, setMyMeals] = useState<CustomMeal[]>([]);
  const [loading, setLoading] = useState(false);

  // Load data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [user?.id])
  );

  const loadData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [favs, foods, meals] = await Promise.all([
        customFoodsService.getFavorites(user.id),
        customFoodsService.getCustomFoods(user.id),
        customFoodsService.getCustomMeals(user.id),
      ]);

      setFavorites(favs);
      setMyFoods(foods);
      setMyMeals(meals);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get tab index for animation
  const getTabIndex = (tab: 'favorites' | 'myFoods' | 'myMeals') => {
    switch (tab) {
      case 'favorites': return 0;
      case 'myFoods': return 1;
      case 'myMeals': return 2;
      default: return 0;
    }
  };

  // Animate tab transitions
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: getTabIndex(activeTab),
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      })
    ]).start();
  }, [activeTab]);

  const handleSearch = () => {
    // Navigate to food search/database screen
    navigation.navigate('FoodSearch' as never, { mealType, mealName } as never);
  };

  const handleBarcodeScan = () => {
    // Barcode scanner requires custom development build
    // For now, users should use food search or manual entry
    return; // Disabled - feature requires native build
  };

  const handleManualEntry = () => {
    // Navigate to manual calorie entry
    navigation.navigate('ManualFoodEntry' as never, { mealType, mealName } as never);
  };

  const handleAddFood = async (food: FoodItem) => {
    if (!user?.id) return;

    try {
      // Log to Firebase
      await firebaseDailyDataService.updateNutrition(
        user.id,
        {
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
        },
        'add'
      );

      // Add to recent foods
      await customFoodsService.addToRecent(
        {
          id: food.id,
          name: food.name,
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat,
          serving: food.serving,
        },
        user.id
      );

      Alert.alert('Success', `Added ${food.name} to ${mealName}`);
      navigation.goBack();
    } catch (error) {
      console.error('Error adding food:', error);
      Alert.alert('Error', 'Failed to log food');
    }
  };

  const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={() => handleAddFood(item)}
      accessibilityLabel={`Add ${item.name} to meal`}
    >
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodServing}>{item.serving}</Text>
      </View>
      <View style={styles.foodStats}>
        <Text style={styles.foodCalories}>{item.calories} cal</Text>
        <Ionicons name="add-circle-outline" size={24} color="#4ECDC4" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = (message: string, showCreateButton: boolean = false) => (
    <View style={styles.emptyState}>
      <Ionicons name="restaurant-outline" size={64} color="#B0B0B0" />
      <Text style={styles.emptyText}>{message}</Text>
      {showCreateButton && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateCustomFood' as never)}
          accessibilityLabel="Create custom food"
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.createButtonText}>Create Custom Food</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#202124" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log {mealName}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {/* Action Buttons Block */}
        <View style={styles.actionsBlock}>
        <Text style={styles.blockTitle}>Choose how you want to log this meal</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSearch} accessibilityLabel="Search for food">
            <Ionicons name="search" size={24} color="#fff" />
            <Text style={styles.actionText}>Search Food</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('PhotoMealLog' as never, { mealType, mealName } as never)}
            accessibilityLabel="Log meal with AI photo"
          >
            <Ionicons name="camera" size={24} color="#4ECDC4" />
            <Text style={[styles.actionText, { color: '#4ECDC4' }]}>AI Photo Log</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'Barcode scanner will be available soon')}
            accessibilityLabel="Scan barcode"
          >
            <Ionicons name="barcode-outline" size={24} color="#FF9800" />
            <Text style={[styles.actionText, { color: '#FF9800' }]}>Scan Barcode</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={handleManualEntry} accessibilityLabel="Add calories manually">
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <Text style={styles.actionText}>Add Calories</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {/* Animated background block */}
        <Animated.View
          style={[
            styles.tabBackground,
            {
              transform: [{
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: [0, 110, 225] // Adjusted third value for My Meals
                })
              }]
            }
          ]}
        />

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('favorites')}
          accessibilityLabel="Favorites tab"
        >
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
            Favorites
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('myFoods')}
          accessibilityLabel="My Foods tab"
        >
          <Text style={[styles.tabText, activeTab === 'myFoods' && styles.tabTextActive]}>
            My Foods
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => setActiveTab('myMeals')}
          accessibilityLabel="My Meals tab"
        >
          <Text style={[styles.tabText, activeTab === 'myMeals' && styles.tabTextActive]}>
            My Meals
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {activeTab === 'favorites' && (
          favorites.length > 0 ? (
            <View>
              {favorites.map((item) => (
                <View key={item.id}>
                  {renderFoodItem({ item })}
                </View>
              ))}
            </View>
          ) : (
            renderEmptyState('No favorite foods yet. Add foods from search!')
          )
        )}

        {activeTab === 'myFoods' && (
          myFoods.length > 0 ? (
            <View>
              {myFoods.map((item) => (
                <View key={item.id}>
                  {renderFoodItem({ item })}
                </View>
              ))}
            </View>
          ) : (
            renderEmptyState('No custom foods yet. Create your own!', true)
          )
        )}

        {activeTab === 'myMeals' && (
          myMeals.length > 0 ? (
            <View>
              {myMeals.map((item) => (
                <View key={item.id}>
                  {renderFoodItem({ item })}
                </View>
              ))}
            </View>
          ) : (
            renderEmptyState('No saved meals yet. Save your frequent combinations!')
          )
        )}
      </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202124',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
  actionsBlock: {
    backgroundColor: '#2C2C2E',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 16,
  },
  actionButton: {
    alignItems: 'center',
    width: '45%',
    paddingVertical: 12,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    marginTop: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
    position: 'relative',
  },
  tabBackground: {
    position: 'absolute',
    top: 0,
    left: 16,
    width: 102, // Width of one tab (adjust based on screen width)
    height: 44,
    backgroundColor: '#2C2C2E',
    borderRadius: 22,
    zIndex: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    color: '#B0B0B0',
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    minHeight: 400,
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3A47',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 4,
  },
  foodServing: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  foodStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  foodCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#B0B0B0',
    textAlign: 'center',
    marginTop: 16,
  },
  createButton: {
    marginTop: 20,
    backgroundColor: '#4ECDC4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MealLogScreen;
