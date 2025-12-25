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
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useNutrition } from '../../contexts/NutritionContext';
import customFoodsService, { CustomFood, CustomMeal } from '../../services/customFoodsService';
import firebaseDailyDataService from '../../services/firebaseDailyDataService';
import { Alert } from 'react-native';
import { MealTypeId } from '../../types/navigation.types';
import * as Haptics from 'expo-haptics';
import { BRAND_COLORS } from '../../constants/brandColors';

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
  const { currentDiary } = useNutrition();
  const { mealType, mealName } = route.params as { mealType: MealTypeId; mealName: string };

  const [activeTab, setActiveTab] = useState<'favorites' | 'myFoods' | 'myMeals'>('favorites');
  const [previousTab, setPreviousTab] = useState<'favorites' | 'myFoods' | 'myMeals'>('favorites');
  const [searchQuery, setSearchQuery] = useState('');
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current; // For moving the block
  const contentSlideAnim = useRef(new Animated.Value(0)).current; // For content slide
  const scrollRef = useRef<ScrollView>(null);

  const [favorites, setFavorites] = useState<CustomFood[]>([]);
  const [myFoods, setMyFoods] = useState<CustomFood[]>([]);
  const [myMeals, setMyMeals] = useState<CustomMeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track recently added items for undo functionality
  const [recentlyAdded, setRecentlyAdded] = useState<FoodItem[]>([]);

  // Quick Macros modal state
  const [showQuickMacros, setShowQuickMacros] = useState(false);
  const [quickMacros, setQuickMacros] = useState({
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });

  // Save Template modal state
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  // Animation values
  const summaryCardOpacity = useRef(new Animated.Value(0)).current;
  const progressBarWidth = useRef(new Animated.Value(0)).current;

  // Get current meal items from diary
  const getCurrentMealItems = () => {
    if (!currentDiary) return [];

    switch (mealType) {
      case 'breakfast':
        return currentDiary.breakfast || [];
      case 'lunch':
        return currentDiary.lunch || [];
      case 'snack':
        return currentDiary.snacks || [];
      case 'dinner':
        return currentDiary.dinner || [];
      default:
        return [];
    }
  };

  // Calculate meal totals
  const getMealTotals = () => {
    const items = getCurrentMealItems();
    return items.reduce((totals, item: any) => ({
      calories: totals.calories + (item.nutrition?.calories || 0),
      protein: totals.protein + (item.nutrition?.protein || 0),
      carbs: totals.carbs + (item.nutrition?.carbs || 0),
      fat: totals.fat + (item.nutrition?.fat || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const mealItems = getCurrentMealItems();
  const mealTotals = getMealTotals();

  // Calculate percentage of daily target
  const dailyTargets = currentDiary?.targets || { calories: 2000, protein: 150, carbs: 200, fat: 67 };
  const caloriePercentage = Math.min(100, Math.round((mealTotals.calories / dailyTargets.calories) * 100));

  // Filter data based on search query
  const filteredFavorites = React.useMemo(() => {
    if (!searchQuery.trim()) return favorites;
    const query = searchQuery.toLowerCase();
    return favorites.filter(item => item.name.toLowerCase().includes(query));
  }, [favorites, searchQuery]);

  const filteredMyFoods = React.useMemo(() => {
    if (!searchQuery.trim()) return myFoods;
    const query = searchQuery.toLowerCase();
    return myFoods.filter(item => item.name.toLowerCase().includes(query));
  }, [myFoods, searchQuery]);

  const filteredMyMeals = React.useMemo(() => {
    if (!searchQuery.trim()) return myMeals;
    const query = searchQuery.toLowerCase();
    return myMeals.filter(item => item.name.toLowerCase().includes(query));
  }, [myMeals, searchQuery]);

  // Load data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [user?.id])
  );

  const loadData = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
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
      setError('Failed to load your foods. Please check your connection and try again.');
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

  // Animate summary card when meal items change
  useEffect(() => {
    if (mealItems.length > 0) {
      Animated.parallel([
        Animated.timing(summaryCardOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(progressBarWidth, {
          toValue: caloriePercentage,
          useNativeDriver: false,
          friction: 10,
          tension: 40,
        }),
      ]).start();
    } else {
      summaryCardOpacity.setValue(0);
      progressBarWidth.setValue(0);
    }
  }, [mealItems.length, caloriePercentage]);

  // Animate tab transitions
  useEffect(() => {
    const currentIndex = getTabIndex(activeTab);
    const previousIndex = getTabIndex(previousTab);
    const direction = currentIndex > previousIndex ? 1 : -1;

    // Start content off-screen in the direction of movement
    contentSlideAnim.setValue(direction * 50);
    fadeAnim.setValue(0);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: currentIndex,
        useNativeDriver: true,
        friction: 8,
        tension: 40,
      }),
      Animated.spring(contentSlideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 9,
        tension: 50,
      })
    ]).start();

    setPreviousTab(activeTab);
  }, [activeTab]);

  // Auto-scroll summary card into view when first item is added
  useEffect(() => {
    if (mealItems.length === 1) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      }, 400); // Small delay to let the card animate in first
    }
  }, [mealItems.length]);

  const handleSearch = () => {
    // Navigate to food search/database screen
    navigation.navigate('FoodSearch' as never, { mealType, mealName } as never);
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

      // Track for undo
      setRecentlyAdded(prev => [...prev, food]);

      // Haptic feedback for success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `Added ${food.name} to ${mealName}`);
      navigation.goBack();
    } catch (error) {
      console.error('Error adding food:', error);
      Alert.alert('Error', 'Failed to log food');
    }
  };

  const handleDeleteMealItem = async (item: any, index: number) => {
    if (!user?.id) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Remove Item',
      `Remove "${item.foodItem?.name || item.name || 'this item'}" (${Math.round(item.nutrition?.calories || 0)} cal)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // Subtract the macros from today's totals
              await firebaseDailyDataService.updateNutrition(
                user.id,
                {
                  calories: item.nutrition?.calories || 0,
                  protein: item.nutrition?.protein || 0,
                  carbs: item.nutrition?.carbs || 0,
                  fat: item.nutrition?.fat || 0,
                },
                'subtract'
              );

              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Success', `Removed from ${mealName}`);
            } catch (error) {
              console.error('Error removing item:', error);
              Alert.alert('Error', 'Failed to remove item');
            }
          }
        }
      ]
    );
  };

  const handleQuickMacrosSubmit = async () => {
    if (!user?.id) return;

    const calories = parseInt(quickMacros.calories) || 0;
    const protein = parseInt(quickMacros.protein) || 0;
    const carbs = parseInt(quickMacros.carbs) || 0;
    const fat = parseInt(quickMacros.fat) || 0;

    if (calories === 0 && protein === 0 && carbs === 0 && fat === 0) {
      Alert.alert('Error', 'Please enter at least one macro value');
      return;
    }

    try {
      await firebaseDailyDataService.updateNutrition(
        user.id,
        { calories, protein, carbs, fat },
        'add'
      );

      setShowQuickMacros(false);
      setQuickMacros({ calories: '', protein: '', carbs: '', fat: '' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `Added quick entry to ${mealName}`);
      navigation.goBack();
    } catch (error) {
      console.error('Error adding quick macros:', error);
      Alert.alert('Error', 'Failed to log macros');
    }
  };

  const handleSaveTemplate = async () => {
    if (!user?.id) return;
    if (!templateName.trim()) {
      Alert.alert('Error', 'Please enter a name for this template');
      return;
    }
    if (mealItems.length === 0) {
      Alert.alert('Error', 'No items in this meal to save');
      return;
    }

    try {
      // Create a custom meal from current items
      const customMeal: CustomMeal = {
        id: `meal_${Date.now()}`,
        name: templateName.trim(),
        calories: mealTotals.calories,
        protein: mealTotals.protein,
        carbs: mealTotals.carbs,
        fat: mealTotals.fat,
        serving: `${mealItems.length} items`,
      };

      await customFoodsService.saveCustomMeal(customMeal, user.id);

      setShowSaveTemplate(false);
      setTemplateName('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `Saved "${templateName}" as a template!\n\nYou can find it in the "My Meals" tab.`);
    } catch (error) {
      console.error('Error saving template:', error);
      Alert.alert('Error', 'Failed to save template');
    }
  };

  const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={() => handleAddFood(item)}
      accessibilityLabel={`Add ${item.name} to meal`}
      activeOpacity={0.6}
    >
      <View style={styles.foodInfo}>
        <Text style={styles.foodName}>{item.name}</Text>
        <Text style={styles.foodServing}>{item.serving}</Text>
      </View>
      <View style={styles.foodStats}>
        <Text style={styles.foodCalories}>{item.calories} cal</Text>
        <Ionicons name="add-circle-outline" size={24} color={BRAND_COLORS.accent} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = (message: string, showCreateButton: boolean = false, iconName: string = 'restaurant-outline') => (
    <View style={styles.emptyState}>
      <Ionicons name={iconName as any} size={64} color="#B0B0B0" />
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
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Go back" style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log {mealName}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        {/* Meal Summary Card */}
        {mealItems.length > 0 && (
          <Animated.View style={[styles.summaryCard, { opacity: summaryCardOpacity }]}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryTitle}>{mealName} Total</Text>
              <Text style={styles.summaryCount}>{mealItems.length} {mealItems.length === 1 ? 'item' : 'items'}</Text>
            </View>

            <View style={styles.summaryMacros}>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(mealTotals.calories)}</Text>
                <Text style={styles.macroLabel}>cal</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(mealTotals.protein)}</Text>
                <Text style={styles.macroLabel}>protein</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(mealTotals.carbs)}</Text>
                <Text style={styles.macroLabel}>carbs</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroValue}>{Math.round(mealTotals.fat)}</Text>
                <Text style={styles.macroLabel}>fat</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Recent Additions - Foods in this meal */}
        {mealItems.length > 0 && (
          <View style={styles.recentAdditionsSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>In This Meal</Text>
              {recentlyAdded.length > 0 && (
                <TouchableOpacity
                  style={styles.undoButton}
                  onPress={async () => {
                    const lastAdded = recentlyAdded[recentlyAdded.length - 1];
                    if (!user?.id || !lastAdded) return;

                    Alert.alert(
                      'Undo Last Addition',
                      `Remove "${lastAdded.name}" (${lastAdded.calories} cal)?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Undo',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              // Subtract the macros from today's totals
                              await firebaseDailyDataService.updateNutrition(
                                user.id,
                                {
                                  calories: lastAdded.calories,
                                  protein: lastAdded.protein,
                                  carbs: lastAdded.carbs,
                                  fat: lastAdded.fat,
                                },
                                'subtract'
                              );

                              // Remove from recently added
                              setRecentlyAdded(prev => prev.slice(0, -1));
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                              Alert.alert('Success', `Removed "${lastAdded.name}"`);
                            } catch (error) {
                              console.error('Error undoing:', error);
                              Alert.alert('Error', 'Failed to undo');
                            }
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Ionicons name="arrow-undo" size={16} color={BRAND_COLORS.accent} />
                  <Text style={styles.undoText}>Undo</Text>
                </TouchableOpacity>
              )}
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              style={styles.recentScroll}
              contentContainerStyle={styles.recentScrollContent}
              directionalLockEnabled={true}
            >
              {mealItems.slice(0, 5).map((item: any, index) => (
                <View key={index} style={styles.recentItem}>
                  <TouchableOpacity
                    style={styles.recentItemDeleteBtn}
                    onPress={() => handleDeleteMealItem(item, index)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="close-circle" size={18} color={BRAND_COLORS.accent} />
                  </TouchableOpacity>
                  <Text style={styles.recentItemName} numberOfLines={1}>
                    {item.foodItem?.name || item.name || 'Unknown'}
                  </Text>
                  <Text style={styles.recentItemCal}>
                    {Math.round(item.nutrition?.calories || 0)} cal
                  </Text>
                </View>
              ))}
              {mealItems.length > 5 ? (
                <View style={styles.moreItemsIndicator}>
                  <Text style={styles.moreItemsText}>+{mealItems.length - 5} more</Text>
                </View>
              ) : mealItems.length > 1 ? (
                <View style={styles.scrollHintContainer}>
                  <Ionicons name="chevron-forward" size={16} color="#666" />
                </View>
              ) : null}
            </ScrollView>
          </View>
        )}

        {/* Quick Actions Row */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowQuickMacros(true);
            }}
          >
            <Ionicons name="calculator-outline" size={20} color={BRAND_COLORS.accent} />
            <Text style={styles.quickActionText} numberOfLines={1} adjustsFontSizeToFit>Quick Macros</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (mealItems.length === 0) {
                Alert.alert('No Items', 'Add some foods to this meal first before saving as a template');
              } else {
                setShowSaveTemplate(true);
              }
            }}
          >
            <Ionicons name="bookmark-outline" size={20} color={BRAND_COLORS.accent} />
            <Text style={styles.quickActionText} numberOfLines={1} adjustsFontSizeToFit>Save Template</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons Block */}
        <View style={styles.actionsBlock}>
        <Text style={styles.blockTitle}>Add Food to This Meal</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleSearch();
            }}
            accessibilityLabel="Search for food"
          >
            <Ionicons name="search" size={24} color="#fff" />
            <Text style={styles.actionText}>Search Food</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate('PhotoMealLog' as never, { mealType, mealName } as never);
            }}
            accessibilityLabel="Log meal with AI photo"
          >
            <Ionicons name="camera" size={24} color={BRAND_COLORS.accent} />
            <Text style={[styles.actionText, { color: BRAND_COLORS.accent }]}>AI Photo Log</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleManualEntry();
            }}
            accessibilityLabel="Add calories manually"
          >
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <Text style={styles.actionText}>Add Calories</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#B0B0B0" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your foods..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.searchClear}>
            <Ionicons name="close-circle" size={20} color="#B0B0B0" />
          </TouchableOpacity>
        )}
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
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('favorites');
          }}
          accessibilityLabel="Favorites tab"
        >
          <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
            Favorites
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('myFoods');
          }}
          accessibilityLabel="My Foods tab"
        >
          <Text style={[styles.tabText, activeTab === 'myFoods' && styles.tabTextActive]}>
            My Foods
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tab}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setActiveTab('myMeals');
          }}
          accessibilityLabel="My Meals tab"
        >
          <Text style={[styles.tabText, activeTab === 'myMeals' && styles.tabTextActive]}>
            My Meals
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, {
        opacity: fadeAnim,
        transform: [{ translateX: contentSlideAnim }]
      }]}>
        {error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={64} color={BRAND_COLORS.accent} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BRAND_COLORS.accent} />
            <Text style={styles.loadingText}>Loading your foods...</Text>
          </View>
        ) : (
          <>
            {activeTab === 'favorites' && (
              filteredFavorites.length > 0 ? (
                <View>
                  {filteredFavorites.map((item) => (
                    <View key={item.id}>
                      {renderFoodItem({ item })}
                    </View>
                  ))}
                </View>
              ) : searchQuery.trim() ? (
                renderEmptyState('No foods found matching your search', false, 'search-outline')
              ) : (
                renderEmptyState('No favorite foods yet. Add foods from search!', false, 'star-outline')
              )
            )}

            {activeTab === 'myFoods' && (
              filteredMyFoods.length > 0 ? (
                <View>
                  {filteredMyFoods.map((item) => (
                    <View key={item.id}>
                      {renderFoodItem({ item })}
                    </View>
                  ))}
                </View>
              ) : searchQuery.trim() ? (
                renderEmptyState('No foods found matching your search', false, 'search-outline')
              ) : (
                renderEmptyState('No custom foods yet. Create your own!', true, 'nutrition-outline')
              )
            )}

            {activeTab === 'myMeals' && (
              filteredMyMeals.length > 0 ? (
                <View>
                  {filteredMyMeals.map((item) => (
                    <View key={item.id}>
                      {renderFoodItem({ item })}
                    </View>
                  ))}
                </View>
              ) : searchQuery.trim() ? (
                renderEmptyState('No meals found matching your search', false, 'search-outline')
              ) : (
                renderEmptyState('No saved meals yet. Save your frequent combinations!', false, 'fast-food-outline')
              )
            )}
          </>
        )}
      </Animated.View>
      </ScrollView>

      {/* Quick Macros Modal */}
      <Modal
        visible={showQuickMacros}
        transparent
        animationType="slide"
        onRequestClose={() => setShowQuickMacros(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quick Macros Entry</Text>
              <TouchableOpacity onPress={() => setShowQuickMacros(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>Enter macros for {mealName}</Text>

            <View style={styles.macrosInputGrid}>
              <View style={styles.macroInputRow}>
                <Text style={styles.macroInputLabel}>Calories</Text>
                <TextInput
                  style={styles.macroInput}
                  value={quickMacros.calories}
                  onChangeText={(text) => setQuickMacros({...quickMacros, calories: text})}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#666"
                />
                <Text style={styles.macroInputUnit}>kcal</Text>
              </View>

              <View style={styles.macroInputRow}>
                <Text style={styles.macroInputLabel}>Protein</Text>
                <TextInput
                  style={styles.macroInput}
                  value={quickMacros.protein}
                  onChangeText={(text) => setQuickMacros({...quickMacros, protein: text})}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#666"
                />
                <Text style={styles.macroInputUnit}>g</Text>
              </View>

              <View style={styles.macroInputRow}>
                <Text style={styles.macroInputLabel}>Carbs</Text>
                <TextInput
                  style={styles.macroInput}
                  value={quickMacros.carbs}
                  onChangeText={(text) => setQuickMacros({...quickMacros, carbs: text})}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#666"
                />
                <Text style={styles.macroInputUnit}>g</Text>
              </View>

              <View style={styles.macroInputRow}>
                <Text style={styles.macroInputLabel}>Fat</Text>
                <TextInput
                  style={styles.macroInput}
                  value={quickMacros.fat}
                  onChangeText={(text) => setQuickMacros({...quickMacros, fat: text})}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#666"
                />
                <Text style={styles.macroInputUnit}>g</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary, { flex: 0.4 }]}
                onPress={() => {
                  setShowQuickMacros(false);
                  setQuickMacros({ calories: '', protein: '', carbs: '', fat: '' });
                }}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { flex: 0.6 }]}
                onPress={handleQuickMacrosSubmit}
              >
                <Text style={styles.modalButtonText}>Add to {mealName}</Text>
              </TouchableOpacity>
            </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Save Template Modal */}
      <Modal
        visible={showSaveTemplate}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSaveTemplate(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Save as Template</Text>
              <TouchableOpacity onPress={() => setShowSaveTemplate(false)} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Save this {mealName.toLowerCase()} ({mealItems.length} items, {Math.round(mealTotals.calories)} cal) as a reusable template
            </Text>

            <View style={styles.templateInputContainer}>
              <Text style={styles.templateInputLabel}>Template Name</Text>
              <TextInput
                style={styles.templateInput}
                value={templateName}
                onChangeText={setTemplateName}
                placeholder={`My ${mealName} Template`}
                placeholderTextColor="#666"
                autoFocus
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary, { flex: 0.4 }]}
                onPress={() => {
                  setShowSaveTemplate(false);
                  setTemplateName('');
                }}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary, { flex: 0.6 }]}
                onPress={handleSaveTemplate}
              >
                <Ionicons name="bookmark" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.modalButtonText}>Save Template</Text>
              </TouchableOpacity>
            </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

// Consistent spacing system (4px base)
const SPACING = {
  XS: 4,
  S: 8,
  M: 12,
  L: 16,
  XL: 24,
  XXL: 32,
  XXXL: 40,
  HUGE: 60,
};

const RADIUS = {
  XS: 4,
  S: 8,
  M: 12,
  L: 16,
  XL: 20,
  XXL: 24,
};

const FONT_SIZE = {
  S: 12,   // Small text
  M: 14,   // Body text (most common)
  L: 16,   // Large body
  XL: 18,  // Headers
  XXL: 20, // Titles
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
    paddingBottom: SPACING.XXXL,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.L,
    paddingVertical: SPACING.L,
    borderBottomWidth: 1,
    borderBottomColor: '#4E4E50',
  },
  headerTitle: {
    fontSize: FONT_SIZE.XL,
    fontWeight: '600',
    color: '#fff',
  },
  headerBackButton: {
    padding: SPACING.M,
    marginLeft: -SPACING.M,
  },
  actionsBlock: {
    backgroundColor: '#4E4E50',
    marginHorizontal: SPACING.L,
    marginTop: SPACING.L,
    marginBottom: SPACING.L,
    borderRadius: RADIUS.M,
    padding: SPACING.L,
  },
  blockTitle: {
    fontSize: FONT_SIZE.L,
    fontWeight: '600',
    color: '#fff',
    marginBottom: SPACING.L,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: SPACING.L,
  },
  actionButton: {
    alignItems: 'center',
    width: '45%',
    paddingVertical: SPACING.M,
  },
  actionText: {
    color: '#fff',
    fontSize: FONT_SIZE.S,
    marginTop: SPACING.S,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.L,
    marginBottom: SPACING.L,
    gap: SPACING.S,
    position: 'relative',
  },
  tabBackground: {
    position: 'absolute',
    top: 0,
    left: SPACING.L,
    width: 102, // Width of one tab (adjust based on screen width)
    height: 44,
    backgroundColor: '#4E4E50',
    borderRadius: RADIUS.XL,
    zIndex: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.M,
    alignItems: 'center',
    zIndex: 1,
  },
  tabText: {
    color: '#B0B0B0',
    fontSize: FONT_SIZE.M,
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
    padding: SPACING.L,
    borderBottomWidth: 1,
    borderBottomColor: '#4E4E50',
    backgroundColor: 'rgba(26, 26, 26, 0.5)',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: FONT_SIZE.L,
    fontWeight: '500',
    color: '#fff',
    marginBottom: SPACING.XS,
  },
  foodServing: {
    fontSize: FONT_SIZE.M,
    color: '#B0B0B0',
  },
  foodStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.M,
  },
  foodCalories: {
    fontSize: FONT_SIZE.M,
    fontWeight: '600',
    color: BRAND_COLORS.accent,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
    paddingVertical: SPACING.XL,
    marginTop: SPACING.L,
  },
  emptyText: {
    fontSize: FONT_SIZE.L,
    color: '#B0B0B0',
    textAlign: 'center',
    marginTop: SPACING.L,
  },
  createButton: {
    marginTop: SPACING.XL,
    backgroundColor: BRAND_COLORS.accent,
    paddingVertical: SPACING.M,
    paddingHorizontal: SPACING.XL,
    borderRadius: RADIUS.XL,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.S,
  },
  createButtonText: {
    color: '#fff',
    fontSize: FONT_SIZE.M,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#4A4A4A',
    marginHorizontal: SPACING.L,
    marginTop: SPACING.M,
    marginBottom: SPACING.M,
    borderRadius: RADIUS.L,
    padding: SPACING.L,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.L,
  },
  summaryTitle: {
    fontSize: FONT_SIZE.L,
    fontWeight: '600',
    color: '#fff',
  },
  summaryCount: {
    fontSize: FONT_SIZE.S,
    fontWeight: '500',
    color: '#888',
  },
  summaryMacros: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  macroItem: {
    alignItems: 'center',
    flex: 1,
  },
  macroValue: {
    fontSize: FONT_SIZE.XXL,
    fontWeight: 'bold',
    color: BRAND_COLORS.accent,
    marginBottom: SPACING.XS,
  },
  macroLabel: {
    fontSize: FONT_SIZE.S,
    color: '#888',
    textTransform: 'uppercase',
  },
  recentAdditionsSection: {
    marginTop: SPACING.L,
    marginBottom: SPACING.S,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.L,
    marginBottom: SPACING.M,
  },
  recentTitle: {
    fontSize: FONT_SIZE.M,
    fontWeight: '600',
    color: '#fff',
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.XS,
    paddingVertical: SPACING.M,
    paddingHorizontal: SPACING.M,
    backgroundColor: '#4A4A4A',
    borderRadius: RADIUS.M,
  },
  undoText: {
    fontSize: FONT_SIZE.S,
    color: BRAND_COLORS.accent,
    fontWeight: '600',
  },
  recentScroll: {
    paddingHorizontal: SPACING.L,
  },
  recentScrollContent: {
    paddingRight: SPACING.HUGE,
  },
  scrollHintContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.S,
  },
  moreItemsIndicator: {
    backgroundColor: '#4A4A4A',
    paddingVertical: SPACING.M,
    paddingHorizontal: SPACING.L,
    borderRadius: RADIUS.M,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: BRAND_COLORS.accent,
    borderStyle: 'dashed',
  },
  moreItemsText: {
    fontSize: FONT_SIZE.S,
    color: BRAND_COLORS.accent,
    fontWeight: '600',
  },
  recentItem: {
    backgroundColor: '#4A4A4A',
    paddingVertical: SPACING.M,
    paddingHorizontal: SPACING.L,
    borderRadius: RADIUS.M,
    marginRight: SPACING.M,
    minWidth: 120,
    maxWidth: 150,
    position: 'relative',
  },
  recentItemDeleteBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    zIndex: 10,
    backgroundColor: '#202124',
    borderRadius: 12,
  },
  recentItemName: {
    fontSize: FONT_SIZE.M,
    fontWeight: '500',
    color: '#fff',
    marginBottom: SPACING.XS,
  },
  recentItemCal: {
    fontSize: FONT_SIZE.S,
    color: BRAND_COLORS.accent,
    fontWeight: '600',
  },
  quickActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.L,
    marginTop: SPACING.L,
    marginBottom: SPACING.S,
    gap: SPACING.M,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A4A4A',
    paddingVertical: SPACING.L,
    borderRadius: RADIUS.M,
    gap: SPACING.S,
    borderWidth: 1,
    borderColor: '#4E4E50',
  },
  quickActionText: {
    fontSize: FONT_SIZE.M,
    fontWeight: '600',
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#202124',
    borderTopLeftRadius: RADIUS.XXL,
    borderTopRightRadius: RADIUS.XXL,
    padding: SPACING.XL,
    paddingBottom: SPACING.XXXL,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.S,
  },
  modalTitle: {
    fontSize: FONT_SIZE.XXL,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalCloseButton: {
    padding: SPACING.M,
    marginRight: -SPACING.M,
  },
  modalSubtitle: {
    fontSize: FONT_SIZE.M,
    color: '#B0B0B0',
    marginBottom: SPACING.XL,
  },
  macrosInputGrid: {
    gap: SPACING.L,
    marginBottom: SPACING.XL,
  },
  macroInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A4A4A',
    borderRadius: RADIUS.M,
    padding: SPACING.L,
    borderWidth: 1,
    borderColor: '#4E4E50',
  },
  macroInputLabel: {
    fontSize: FONT_SIZE.M,
    fontWeight: '600',
    color: '#fff',
    width: 80,
  },
  macroInput: {
    flex: 1,
    fontSize: FONT_SIZE.XL,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'right',
    paddingVertical: SPACING.XS,
  },
  macroInputUnit: {
    fontSize: FONT_SIZE.M,
    color: '#B0B0B0',
    marginLeft: SPACING.S,
    width: 40,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.M,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.L,
    borderRadius: RADIUS.M,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  modalButtonPrimary: {
    backgroundColor: BRAND_COLORS.accent,
  },
  modalButtonSecondary: {
    backgroundColor: '#4E4E50',
  },
  modalButtonText: {
    fontSize: FONT_SIZE.L,
    fontWeight: '600',
    color: '#fff',
  },
  modalButtonTextSecondary: {
    fontSize: FONT_SIZE.L,
    fontWeight: '600',
    color: '#B0B0B0',
  },
  templateInputContainer: {
    marginBottom: SPACING.XL,
  },
  templateInputLabel: {
    fontSize: FONT_SIZE.M,
    fontWeight: '600',
    color: '#fff',
    marginBottom: SPACING.S,
  },
  templateInput: {
    backgroundColor: '#4A4A4A',
    borderRadius: RADIUS.M,
    padding: SPACING.L,
    fontSize: FONT_SIZE.L,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#4E4E50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.HUGE,
  },
  loadingText: {
    fontSize: FONT_SIZE.M,
    color: '#B0B0B0',
    marginTop: SPACING.L,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.HUGE,
    paddingHorizontal: SPACING.XXXL,
  },
  errorText: {
    fontSize: FONT_SIZE.M,
    color: '#B0B0B0',
    textAlign: 'center',
    marginTop: SPACING.L,
    marginBottom: SPACING.XL,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BRAND_COLORS.accent,
    paddingVertical: SPACING.M,
    paddingHorizontal: SPACING.XL,
    borderRadius: RADIUS.XL,
    gap: SPACING.S,
  },
  retryButtonText: {
    fontSize: FONT_SIZE.M,
    fontWeight: '600',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A4A4A',
    borderRadius: RADIUS.M,
    paddingHorizontal: SPACING.L,
    paddingVertical: SPACING.M,
    marginHorizontal: SPACING.L,
    marginBottom: SPACING.L,
    gap: SPACING.S,
    borderWidth: 1,
    borderColor: '#4E4E50',
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.M,
    color: '#fff',
    paddingVertical: SPACING.XS,
  },
  emptySearchContainer: {
    paddingVertical: SPACING.XXXL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySearchText: {
    fontSize: FONT_SIZE.M,
    color: '#B0B0B0',
    textAlign: 'center',
  },
});

export default MealLogScreen;
