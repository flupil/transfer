import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, Button, Divider, IconButton, Chip } from 'react-native-paper';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { searchFoods } from '../../services/openFoodFactsService';
import { useAuth } from '../../contexts/AuthContext';
import { useNutrition } from '../../contexts/NutritionContext';
import { FoodItem as FoodItemType, MealType as MealTypeEnum } from '../../types/nutrition.types';
import FoodDetailModal from '../../components/FoodDetailModal';
import { debounce } from 'lodash';
import { useLanguage } from '../../contexts/LanguageContext';

const FoodSearchScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { recentFoods, favorites } = useNutrition();
  const { t } = useLanguage();

  // Get mealType from route params
  const params = route.params as { mealType?: string; mealName?: string } | undefined;
  const mealTypeFromRoute = params?.mealType || 'breakfast';

  console.log('🔍 FoodSearchScreen - Route params:', params);
  console.log('🔍 FoodSearchScreen - mealTypeFromRoute:', mealTypeFromRoute);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Map the mealType string to MealTypeEnum
  const getMealTypeEnum = (mealType: string): MealTypeEnum => {
    console.log('🔍 FoodSearchScreen - Input mealType:', mealType);

    // Handle snack variations (morning-snack, afternoon-snack -> snack)
    if (mealType.includes('snack')) {
      console.log('🔍 FoodSearchScreen - Mapped to SNACK');
      return MealTypeEnum.SNACK;
    }

    // Try direct mapping for breakfast, lunch, dinner
    const mealTypeLower = mealType.toLowerCase();
    const mapping: { [key: string]: MealTypeEnum } = {
      'breakfast': MealTypeEnum.BREAKFAST,
      'lunch': MealTypeEnum.LUNCH,
      'dinner': MealTypeEnum.DINNER,
      'snack': MealTypeEnum.SNACK
    };

    const enumValue = mapping[mealTypeLower] || MealTypeEnum.BREAKFAST;
    console.log('🔍 FoodSearchScreen - Final enum value:', enumValue);
    return enumValue;
  };

  const [selectedMeal, setSelectedMeal] = useState<MealTypeEnum>(getMealTypeEnum(mealTypeFromRoute));
  const [selectedFood, setSelectedFood] = useState<FoodItemType | null>(null);
  const [showFoodDetail, setShowFoodDetail] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('Recently Added');
  const [recentSearches, setRecentSearches] = useState<string[]>(['Chicken breast', 'Banana', 'Oatmeal']);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        setHasSearched(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setHasSearched(false);
      console.log('Searching for:', query);
      try {
        const results = await searchFoods(query, 1, 20);
        console.log('Search results:', results.items.length, 'items found');
        setSearchResults(results.items);
        setHasSearched(true);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
        setHasSearched(true);
        Alert.alert(t('alert.error'), t('alert.searchFoodsError'));
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  useEffect(() => {
    if (searchQuery.length >= 2) {
      setLoading(true);
    }
    debouncedSearch(searchQuery);
  }, [searchQuery]);

  const handleBarcodePress = async () => {
    Alert.alert(t('common.comingSoon'), t('alert.barcodeScanningComingSoon'));
  };

  const handleFoodPress = (food: FoodItemType) => {
    setSelectedFood(food);
    setShowFoodDetail(true);
  };

  const handleCloseFoodDetail = () => {
    setShowFoodDetail(false);
    setSelectedFood(null);
  };

  const getFilterLabel = (filter: string): string => {
    const filterMap: { [key: string]: string } = {
      'Recently Added': t('foodLog.recentlyAdded'),
      'Frequently Added': t('foodLog.frequentlyAdded'),
      'Favorites': t('foodLog.favorites'),
      'My Food': t('foodLog.myFood'),
      'My Meals': t('foodLog.myMeals'),
    };
    return filterMap[filter] || filter;
  };

  const renderFoodItem = useCallback(({ item }: { item: FoodItemType }) => {
    // Extract emoji from imageUrl if it's a data URL with emoji
    const getEmojiFromUrl = (url?: string): string | null => {
      if (!url || !url.startsWith('data:image/svg+xml')) return null;
      try {
        // Decode the URL-encoded SVG
        const decodedUrl = decodeURIComponent(url);
        const match = decodedUrl.match(/dominant-baseline="middle">([^<]+)<\/text>/);
        return match ? match[1] : null;
      } catch (e) {
        return null;
      }
    };

    const emoji = getEmojiFromUrl(item.imageUrl);

    return (
      <TouchableOpacity
        onPress={() => handleFoodPress(item)}
        activeOpacity={0.7}
        accessibilityLabel={`View details for ${item.name}`}
      >
        <Card style={styles.foodCard}>
          <View style={styles.foodRow}>
            {emoji ? (
              <View style={[styles.foodImage, styles.emojiContainer]}>
                <Text style={styles.emojiText}>{emoji}</Text>
              </View>
            ) : item.imageUrl && !item.imageUrl.startsWith('data:') ? (
              <Image source={{ uri: item.imageUrl }} style={styles.foodImage} />
            ) : (
              <View style={[styles.foodImage, styles.placeholderImage]}>
                <MaterialCommunityIcons name="food-apple" size={24} color="#666" />
              </View>
            )}

            <View style={styles.foodInfo}>
              <Text style={styles.foodName} numberOfLines={1}>
                {item.name}
              </Text>
              {item.brand && (
                <Text style={styles.brandName} numberOfLines={1}>
                  {item.brand}
                </Text>
              )}
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionText}>{Math.round(item.nutritionPer100g.calories)} cal</Text>
                <Text style={styles.nutritionText}>P: {Math.round(item.nutritionPer100g.protein)}g</Text>
                <Text style={styles.nutritionText}>C: {Math.round(item.nutritionPer100g.carbs)}g</Text>
                <Text style={styles.nutritionText}>F: {Math.round(item.nutritionPer100g.fat)}g</Text>
              </View>
              <Text style={styles.servingText}>
                per 100g
              </Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color="#999" />
          </View>
        </Card>
      </TouchableOpacity>
    );
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('foodLog.addFood')}</Text>
          <TouchableOpacity onPress={handleBarcodePress} accessibilityLabel="Scan barcode">
            <Ionicons name="barcode" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('placeholder.searchFoods')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filters Block - only show when not searching */}
      {searchQuery.length === 0 && (
        <View style={styles.filtersBlock}>
          <Text style={styles.blockTitle}>{t('common.filters')}</Text>
          <View style={styles.filtersRow}>
            {['Recently Added', 'Frequently Added', 'Favorites', 'My Food', 'My Meals'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  selectedFilter === filter && styles.filterChipActive
                ]}
                onPress={() => setSelectedFilter(filter)}
                accessibilityLabel={`Filter by ${getFilterLabel(filter)}`}
              >
                <Text style={[
                  styles.filterChipText,
                  selectedFilter === filter && styles.filterChipTextActive
                ]}>
                  {getFilterLabel(filter)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Recent Searches Block - only show when not searching */}
      {searchQuery.length === 0 && recentSearches.length > 0 && (
        <View style={styles.recentSearchesBlock}>
          <View style={styles.recentSearchesHeader}>
            <Text style={styles.blockTitle}>{t('foodLog.recentSearches')}</Text>
            <TouchableOpacity onPress={() => setRecentSearches([])} accessibilityLabel="Clear all recent searches">
              <Text style={styles.clearAllText}>{t('common.clearAll')}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.recentSearchesList}>
            {recentSearches.map((search, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentSearchItem}
                onPress={() => setSearchQuery(search)}
                accessibilityLabel={`Search for ${search}`}
              >
                <Ionicons name="time-outline" size={18} color="#999" />
                <Text style={styles.recentSearchText}>{search}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <View style={styles.content}>
        {searchQuery.length === 0 ? (
          <>
            {selectedFilter === 'Recently Added' && recentFoods.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>{t('foodLog.recentlyAdded')}</Text>
                <FlatList
                  data={recentFoods}
                  renderItem={renderFoodItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  initialNumToRender={10}
                />
              </>
            )}
            {selectedFilter === 'Favorites' && favorites.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>{t('foodLog.favorites')}</Text>
                <FlatList
                  data={favorites}
                  renderItem={renderFoodItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.listContent}
                  removeClippedSubviews={true}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  initialNumToRender={10}
                />
              </>
            )}
            {selectedFilter === 'Frequently Added' && (
              <View style={styles.emptyContainer}>
                <Ionicons name="nutrition" size={64} color="#ccc" />
                <Text style={styles.emptyText}>{t('common.noDataYet')}</Text>
                <Text style={styles.emptySubtext}>{t('foodLog.frequentFoodsHint')}</Text>
              </View>
            )}
            {selectedFilter === 'My Food' && (
              <View style={styles.emptyContainer}>
                <Ionicons name="nutrition" size={64} color="#ccc" />
                <Text style={styles.emptyText}>{t('common.noDataYet')}</Text>
                <Text style={styles.emptySubtext}>{t('foodLog.customFoodsHint')}</Text>
              </View>
            )}
            {selectedFilter === 'My Meals' && (
              <View style={styles.emptyContainer}>
                <Ionicons name="nutrition" size={64} color="#ccc" />
                <Text style={styles.emptyText}>{t('common.noDataYet')}</Text>
                <Text style={styles.emptySubtext}>{t('foodLog.savedMealsHint')}</Text>
              </View>
            )}
            {((selectedFilter === 'Recently Added' && recentFoods.length === 0) ||
              (selectedFilter === 'Favorites' && favorites.length === 0)) && (
              <View style={styles.emptyContainer}>
                <Ionicons name="nutrition" size={64} color="#ccc" />
                <Text style={styles.emptyText}>{t('common.noItemsFound')}</Text>
                <Text style={styles.emptySubtext}>{t('foodLog.startAddingHint')}</Text>
              </View>
            )}
          </>
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4ECDC4" />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : hasSearched && searchResults.length > 0 ? (
          <FlatList
            data={searchResults}
            renderItem={renderFoodItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={10}
            ListHeaderComponent={
              <Text style={styles.resultsCount}>
                {t('foodLog.resultsFound', { count: searchResults.length })}
              </Text>
            }
          />
        ) : hasSearched && searchResults.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={64} color="#ccc" />
            <Text style={styles.emptyText}>{t('common.noItemsFound')}</Text>
            <Text style={styles.emptySubtext}>{t('foodLog.tryDifferentSearch')}</Text>
          </View>
        ) : null}
      </View>

      {/* Create Custom Food FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => Alert.alert(t('foodLog.customFood'), t('common.featureComingSoon'))}
        accessibilityLabel="Create custom food"
      >
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      {/* Food Detail Modal */}
      <FoodDetailModal
        visible={showFoodDetail}
        food={selectedFood}
        mealType={selectedMeal}
        onClose={handleCloseFoodDetail}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202124',
  },
  header: {
    backgroundColor: '#2C2C2E',
    paddingBottom: 15,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    marginBottom: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 45,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  filtersBlock: {
    backgroundColor: '#2C2C2E',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  blockTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#3C3C3E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  filterChipActive: {
    backgroundColor: '#4ECDC4',
  },
  filterChipText: {
    fontSize: 12,
    color: '#B0B0B0',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  recentSearchesBlock: {
    backgroundColor: '#2C2C2E',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  recentSearchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearAllText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '500',
  },
  recentSearchesList: {
    gap: 12,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  recentSearchText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 12,
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: 15,
    paddingBottom: 100, // Add space for bottom tab bar
  },
  foodCard: {
    marginBottom: 10,
    elevation: 2,
    backgroundColor: '#2C2C2E',
  },
  foodRow: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  foodImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 32,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  brandName: {
    fontSize: 12,
    color: '#B0B0B0',
    marginBottom: 4,
  },
  nutritionRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  nutritionText: {
    fontSize: 12,
    color: '#888',
    marginRight: 10,
  },
  servingText: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#B0B0B0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#B0B0B0',
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
  },
  resultsCount: {
    fontSize: 14,
    color: '#B0B0B0',
    marginBottom: 10,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
});

export default FoodSearchScreen;