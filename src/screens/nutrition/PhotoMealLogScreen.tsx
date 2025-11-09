import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { aiService, FoodAnalysis } from '../../services/aiService';
import { useAuth } from '../../contexts/AuthContext';
import firebaseDailyDataService from '../../services/firebaseDailyDataService';
import { validateNutritionInfo, showValidationErrors } from '../../utils/nutritionValidation';

const PhotoMealLogScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { mealType, mealName } = route.params as { mealType: string; mealName: string };

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<FoodAnalysis | null>(null);
  const [logging, setLogging] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos of your meals.'
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        analyzePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
        analyzePhoto(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const analyzePhoto = async (uri: string) => {
    setAnalyzing(true);
    setAnalysis(null);

    try {
      const result = await aiService.analyzeFoodFromPhoto(uri);
      setAnalysis(result);
    } catch (error: any) {
      console.error('Error analyzing photo:', error);

      if (error.message.includes('API key')) {
        Alert.alert(
          'API Key Required',
          'Please set your Anthropic API key in Settings > AI Features to use photo meal logging.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Settings',
              onPress: () => navigation.navigate('Settings' as never),
            },
          ]
        );
      } else {
        Alert.alert('Analysis Failed', 'Could not analyze the photo. Please try again.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleLogMeal = async () => {
    if (!analysis || !user?.id) return;

    // Validate AI-analyzed nutrition data
    const nutritionData = {
      calories: analysis.totalCalories,
      protein: analysis.totalProtein,
      carbs: analysis.totalCarbs,
      fat: analysis.totalFat,
    };

    const validationResult = validateNutritionInfo(nutritionData);
    if (!validationResult.isValid) {
      showValidationErrors(validationResult, 'Invalid AI Analysis');
      return;
    }

    setLogging(true);
    try {
      await firebaseDailyDataService.updateNutrition(
        user.id,
        nutritionData,
        'add'
      );

      Alert.alert(
        'Success',
        `Logged ${analysis.totalCalories} calories to ${mealName}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error logging meal:', error);
      Alert.alert('Error', 'Failed to log meal');
    } finally {
      setLogging(false);
    }
  };

  const renderAnalysis = () => {
    if (!analysis) return null;

    return (
      <View style={styles.analysisContainer}>
        <View style={styles.analysisHeader}>
          <Text style={styles.analysisTitle}>Nutritional Analysis</Text>
          <View style={[
            styles.confidenceBadge,
            analysis.confidence === 'high' && styles.confidenceHigh,
            analysis.confidence === 'medium' && styles.confidenceMedium,
            analysis.confidence === 'low' && styles.confidenceLow,
          ]}>
            <Text style={styles.confidenceText}>{analysis.confidence} confidence</Text>
          </View>
        </View>

        {/* Total Macros */}
        <View style={styles.macrosGrid}>
          <View style={styles.macroCard}>
            <Ionicons name="flame" size={24} color="#FF6B35" />
            <Text style={styles.macroValue}>{analysis.totalCalories}</Text>
            <Text style={styles.macroLabel}>Calories</Text>
          </View>
          <View style={styles.macroCard}>
            <Ionicons name="fitness" size={24} color="#4ECDC4" />
            <Text style={styles.macroValue}>{analysis.totalProtein}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroCard}>
            <Ionicons name="leaf" size={24} color="#95E1D3" />
            <Text style={styles.macroValue}>{analysis.totalCarbs}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroCard}>
            <Ionicons name="water" size={24} color="#FFD93D" />
            <Text style={styles.macroValue}>{analysis.totalFat}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>

        {/* Individual Food Items */}
        <Text style={styles.itemsTitle}>Detected Items</Text>
        {analysis.items.map((item, index) => (
          <View key={`${item.name}-${item.quantity}-${index}`} style={styles.foodItem}>
            <View style={styles.foodInfo}>
              <Text style={styles.foodName}>{item.name}</Text>
              <Text style={styles.foodQuantity}>{item.quantity}</Text>
            </View>
            <View style={styles.foodMacros}>
              <Text style={styles.foodMacroText}>{item.calories} cal</Text>
              <Text style={styles.foodMacroText}>P: {item.protein}g</Text>
              <Text style={styles.foodMacroText}>C: {item.carbs}g</Text>
              <Text style={styles.foodMacroText}>F: {item.fat}g</Text>
            </View>
          </View>
        ))}

        {/* Suggestions */}
        {analysis.suggestions && analysis.suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>💡 Tips</Text>
            {analysis.suggestions.map((suggestion, index) => (
              <Text key={`suggestion-${index}-${suggestion.substring(0, 20)}`} style={styles.suggestionText}>• {suggestion}</Text>
            ))}
          </View>
        )}

        {/* Log Button */}
        <TouchableOpacity
          style={[styles.logButton, logging && styles.logButtonDisabled]}
          onPress={handleLogMeal}
          disabled={logging}
          accessibilityLabel={logging ? 'Logging meal' : `Log meal to ${mealName}`}
        >
          {logging ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.logButtonText}>Log to {mealName}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#202124" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Meal Log</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="camera" size={32} color="#4ECDC4" />
          <Text style={styles.infoText}>
            Take a photo of your meal and AI will analyze the nutritional content
          </Text>
        </View>

        {/* Image Preview */}
        {imageUri ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUri }} style={styles.image} />
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => {
                setImageUri(null);
                setAnalysis(null);
              }}
              accessibilityLabel="Retake photo"
            >
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.retakeButtonText}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.captureContainer}>
            <TouchableOpacity style={styles.captureButton} onPress={takePhoto} accessibilityLabel="Take photo of meal">
              <Ionicons name="camera" size={48} color="#fff" />
              <Text style={styles.captureButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery} accessibilityLabel="Choose photo from gallery">
              <Ionicons name="images" size={48} color="#fff" />
              <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Analyzing Indicator */}
        {analyzing && (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color="#4ECDC4" />
            <Text style={styles.analyzingText}>Analyzing your meal...</Text>
            <Text style={styles.analyzingSubtext}>This may take a few seconds</Text>
          </View>
        )}

        {/* Analysis Results */}
        {renderAnalysis()}

        <View style={{ height: 40 }} />
      </ScrollView>
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
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#B0B0B0',
    lineHeight: 20,
  },
  captureContainer: {
    marginTop: 32,
    paddingHorizontal: 16,
    gap: 16,
  },
  captureButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  captureButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  galleryButton: {
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: '#3C3C3E',
  },
  galleryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  imageContainer: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#2C2C2E',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C2C2E',
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  retakeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  analyzingContainer: {
    marginTop: 32,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  analyzingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 16,
  },
  analyzingSubtext: {
    fontSize: 14,
    color: '#B0B0B0',
    marginTop: 8,
  },
  analysisContainer: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  confidenceBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  confidenceHigh: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  confidenceMedium: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  confidenceLow: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize',
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  macroCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  macroValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  macroLabel: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  foodItem: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  foodInfo: {
    marginBottom: 8,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  foodQuantity: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  foodMacros: {
    flexDirection: 'row',
    gap: 12,
  },
  foodMacroText: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '500',
  },
  suggestionsContainer: {
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  suggestionText: {
    fontSize: 14,
    color: '#B0B0B0',
    lineHeight: 20,
    marginBottom: 8,
  },
  logButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  logButtonDisabled: {
    opacity: 0.6,
  },
  logButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});

export default PhotoMealLogScreen;
