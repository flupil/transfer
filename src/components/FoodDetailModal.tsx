import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  StatusBar,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FoodItem, MealType, FoodIntake, calculateNutrition } from '../types/nutrition.types';
import { useNutrition } from '../contexts/NutritionContext';
import { useAuth } from '../contexts/AuthContext';

interface FoodDetailModalProps {
  visible: boolean;
  food: FoodItem | null;
  mealType: MealType;
  date?: Date;
  onClose: () => void;
}

const FoodDetailModal: React.FC<FoodDetailModalProps> = ({
  visible,
  food,
  mealType,
  date = new Date(),
  onClose
}) => {
  const { user } = useAuth();
  const { addFoodIntake, addFavorite } = useNutrition();

  const [selectedServingIndex, setSelectedServingIndex] = useState(0);
  const [customAmount, setCustomAmount] = useState('1');
  const [isCustom, setIsCustom] = useState(false);

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

  if (!food) return null;

  const emoji = getEmojiFromUrl(food.imageUrl);

  const servingSizes = food.servingSizes || [
    { amount: 100, unit: 'g', label: '100g', gramsEquivalent: 100 }
  ];

  const selectedServing = isCustom
    ? { amount: parseFloat(customAmount) || 1, unit: 'g', gramsEquivalent: parseFloat(customAmount) || 1 }
    : servingSizes[selectedServingIndex];

  // Calculate nutrition for selected serving
  const grams = selectedServing.gramsEquivalent || selectedServing.amount;
  const nutrition = calculateNutrition(food.nutritionPer100g, grams, 'g');

  const handleAddFood = async () => {
    console.log('🔥 FoodDetailModal: handleAddFood called');
    console.log('🔥 User:', user ? user.id : 'NO USER');
    console.log('🔥 Food:', food.name);
    console.log('🔥 MealType:', mealType);

    if (!user) {
      console.log('❌ No user, showing alert');
      Alert.alert('Sign In Required', 'Please sign in to add food');
      return;
    }

    // Validate that food has nutrition data
    if (!food.nutritionPer100g) {
      console.log('❌ No nutrition data');
      Alert.alert(
        'Missing Nutrition Data',
        'This food item is missing nutrition information and cannot be added to your diary.'
      );
      return;
    }

    console.log('✅ Validation passed, creating intake');

    // Haptic feedback on food addition
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const intake: FoodIntake = {
      id: `intake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      foodItem: food,
      amount: selectedServing.amount,
      unit: selectedServing.unit,
      dateTime: date,
      mealType,
      nutrition
    };

    console.log('🔥 Intake created:', intake.id);
    console.log('🔥 Calling addFoodIntake...');
    addFoodIntake(intake);
    console.log('🔥 addFoodIntake completed, closing modal');
    onClose();
  };

  const handleAddToFavorites = () => {
    addFavorite(food);
    Alert.alert('Success', 'Added to favorites!');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Food Details</Text>
          <TouchableOpacity onPress={handleAddToFavorites} style={styles.favoriteButton}>
            <MaterialCommunityIcons name="star-outline" size={24} color="#FFD700" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Food Image & Name */}
          <View style={styles.foodHeader}>
            {emoji ? (
              <View style={[styles.foodImage, styles.emojiContainer]}>
                <Text style={styles.emojiText}>{emoji}</Text>
              </View>
            ) : food.imageUrl && !food.imageUrl.startsWith('data:') ? (
              <Image source={{ uri: food.imageUrl }} style={styles.foodImage} />
            ) : (
              <View style={[styles.foodImage, styles.placeholderImage]}>
                <MaterialCommunityIcons name="food-apple" size={64} color="#8e9bab" />
              </View>
            )}

            <Text style={styles.foodName}>{food.name}</Text>
            {food.brand && <Text style={styles.brand}>{food.brand}</Text>}

            {/* Tags */}
            {food.dietaryTags && food.dietaryTags.length > 0 && (
              <View style={styles.tagsContainer}>
                {food.dietaryTags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Serving Size Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Serving Size</Text>

            {/* Predefined Servings */}
            <View style={styles.servingsGrid}>
              {servingSizes.map((serving, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.servingButton,
                    !isCustom && selectedServingIndex === index && styles.servingButtonActive
                  ]}
                  onPress={() => {
                    setIsCustom(false);
                    setSelectedServingIndex(index);
                  }}
                >
                  <Text style={[
                    styles.servingText,
                    !isCustom && selectedServingIndex === index && styles.servingTextActive
                  ]}>
                    {serving.label || `${serving.amount}${serving.unit}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Amount */}
            <TouchableOpacity
              style={[styles.customServingButton, isCustom && styles.customServingButtonActive]}
              onPress={() => setIsCustom(true)}
            >
              <Text style={styles.customServingLabel}>Custom Amount (grams):</Text>
              <TextInput
                style={styles.customInput}
                value={customAmount}
                onChangeText={setCustomAmount}
                keyboardType="decimal-pad"
                placeholder="100"
                placeholderTextColor="#8e9bab"
                onFocus={() => setIsCustom(true)}
              />
              <Text style={styles.customUnit}>g</Text>
            </TouchableOpacity>
          </View>

          {/* Nutrition Facts */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Nutrition Facts</Text>

            <View style={styles.nutritionCard}>
              {/* Calories */}
              <View style={styles.calorieRow}>
                <Text style={styles.calorieLabel}>Calories</Text>
                <Text style={styles.calorieValue}>{nutrition.calories}</Text>
              </View>

              <View style={styles.divider} />

              {/* Macros */}
              <View style={styles.macroRow}>
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={styles.macroValue}>{nutrition.protein}g</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={styles.macroValue}>{nutrition.carbs}g</Text>
                </View>
                <View style={styles.macroItem}>
                  <Text style={styles.macroLabel}>Fat</Text>
                  <Text style={styles.macroValue}>{nutrition.fat}g</Text>
                </View>
              </View>

              {/* Additional Nutrients */}
              {(nutrition.fiber || nutrition.sugar || nutrition.saturatedFat || nutrition.sodium) && (
                <>
                  <View style={styles.divider} />
                  <View style={styles.detailsSection}>
                    {nutrition.fiber !== undefined && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Fiber</Text>
                        <Text style={styles.detailValue}>{nutrition.fiber}g</Text>
                      </View>
                    )}
                    {nutrition.sugar !== undefined && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Sugar</Text>
                        <Text style={styles.detailValue}>{nutrition.sugar}g</Text>
                      </View>
                    )}
                    {nutrition.saturatedFat !== undefined && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Saturated Fat</Text>
                        <Text style={styles.detailValue}>{nutrition.saturatedFat}g</Text>
                      </View>
                    )}
                    {nutrition.sodium !== undefined && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Sodium</Text>
                        <Text style={styles.detailValue}>{nutrition.sodium}mg</Text>
                      </View>
                    )}
                  </View>
                </>
              )}
            </View>
          </View>

          {/* Ingredients */}
          {food.ingredients && food.ingredients.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ingredients</Text>
              <View style={styles.ingredientsCard}>
                <Text style={styles.ingredientsText}>
                  {food.ingredients.join(', ')}
                </Text>
              </View>
            </View>
          )}

          {/* Allergens */}
          {food.allergens && food.allergens.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Allergens</Text>
              <View style={styles.allergensCard}>
                {food.allergens.map((allergen, index) => (
                  <View key={index} style={styles.allergenTag}>
                    <MaterialCommunityIcons name="alert" size={16} color="#EF4444" />
                    <Text style={styles.allergenText}>{allergen}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Add Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddFood}>
            <MaterialCommunityIcons name="plus-circle" size={24} color="#fff" />
            <Text style={styles.addButtonText}>
              Add to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a2a3a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1e2e3e',
  },
  closeButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  favoriteButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  content: {
    flex: 1,
  },
  foodHeader: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1e2e3e',
  },
  foodImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    marginBottom: 15,
  },
  placeholderImage: {
    backgroundColor: '#2a3a4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiContainer: {
    backgroundColor: '#2a3a4a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 64,
  },
  foodName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  brand: {
    fontSize: 14,
    color: '#8e9bab',
    marginBottom: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  tag: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  servingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  servingButton: {
    backgroundColor: '#1e2e3e',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  servingButtonActive: {
    borderColor: '#3b9eff',
    backgroundColor: 'rgba(59, 158, 255, 0.1)',
  },
  servingText: {
    fontSize: 14,
    color: '#8e9bab',
    fontWeight: '600',
  },
  servingTextActive: {
    color: '#3b9eff',
  },
  customServingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e2e3e',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  customServingButtonActive: {
    borderColor: '#3b9eff',
  },
  customServingLabel: {
    fontSize: 14,
    color: '#fff',
    marginRight: 10,
  },
  customInput: {
    flex: 1,
    backgroundColor: '#2a3a4a',
    color: '#fff',
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    textAlign: 'center',
  },
  customUnit: {
    fontSize: 14,
    color: '#8e9bab',
    marginLeft: 10,
  },
  nutritionCard: {
    backgroundColor: '#1e2e3e',
    borderRadius: 16,
    padding: 20,
  },
  calorieRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  calorieLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  calorieValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3b9eff',
  },
  divider: {
    height: 1,
    backgroundColor: '#2a3a4a',
    marginVertical: 15,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 12,
    color: '#8e9bab',
    marginBottom: 6,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  detailsSection: {
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 14,
    color: '#8e9bab',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  ingredientsCard: {
    backgroundColor: '#1e2e3e',
    borderRadius: 16,
    padding: 15,
  },
  ingredientsText: {
    fontSize: 13,
    color: '#8e9bab',
    lineHeight: 20,
  },
  allergensCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  allergenTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  allergenText: {
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    backgroundColor: '#1e2e3e',
  },
  addButton: {
    backgroundColor: '#3b9eff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default FoodDetailModal;
