import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { aiService } from '../../services/aiService';
import firebaseDailyDataService from '../../services/firebaseDailyDataService';

const AINutritionAdvisorScreen = () => {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);
  const [advice, setAdvice] = useState<any>(null);

  const handleGetAdvice = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please log in to get personalized advice');
      return;
    }

    setAnalyzing(true);
    try {
      // Fetch user's recent nutrition data
      const weekData = await firebaseDailyDataService.getWeeklyData(user.id);
      const todayData = await firebaseDailyDataService.getTodayData(user.id);

      // Calculate averages
      const avgCalories = Math.round(
        weekData.reduce((sum: number, day: any) => sum + (day.calories?.consumed || 0), 0) / weekData.length
      );
      const avgProtein = Math.round(
        weekData.reduce((sum: number, day: any) => sum + (day.protein?.consumed || 0), 0) / weekData.length
      );
      const avgCarbs = Math.round(
        weekData.reduce((sum: number, day: any) => sum + (day.carbs?.consumed || 0), 0) / weekData.length
      );
      const avgFat = Math.round(
        weekData.reduce((sum: number, day: any) => sum + (day.fat?.consumed || 0), 0) / weekData.length
      );

      const nutritionAdvice = await aiService.getNutritionAdvice({
        currentIntake: {
          calories: avgCalories,
          protein: avgProtein,
          carbs: avgCarbs,
          fat: avgFat,
        },
        targets: {
          calories: todayData.calories.target,
          protein: todayData.protein.target,
          carbs: todayData.carbs.target,
          fat: todayData.fat.target,
        },
        weekData,
      });

      setAdvice(nutritionAdvice);
    } catch (error: any) {
      console.error('Error getting nutrition advice:', error);

      if (error.message.includes('API key')) {
        Alert.alert(
          'API Key Required',
          'Please set your Anthropic API key in Settings > AI Features to use AI nutrition advice.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Settings',
              onPress: () => navigation.navigate('Settings' as never),
            },
          ]
        );
      } else {
        Alert.alert('Analysis Failed', 'Could not generate nutrition advice. Please try again.');
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const renderAdviceSection = (title: string, items: string[], icon: string) => (
    <View style={styles.adviceSection}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon as any} size={24} color="#4ECDC4" />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {items.map((item, index) => (
        <View key={index} style={styles.adviceItem}>
          <Text style={styles.bulletPoint}>•</Text>
          <Text style={styles.adviceText}>{item}</Text>
        </View>
      ))}
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
        <Text style={styles.headerTitle}>AI Nutrition Advisor</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!advice && !analyzing && (
          <>
            {/* Info Card */}
            <View style={styles.infoCard}>
              <Ionicons name="nutrition" size={32} color="#4ECDC4" />
              <Text style={styles.infoText}>
                Get personalized nutrition advice based on your current intake, goals, and progress
              </Text>
            </View>

            {/* Features List */}
            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>What you'll get:</Text>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                <Text style={styles.featureText}>Analysis of your eating patterns</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                <Text style={styles.featureText}>Personalized macro recommendations</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                <Text style={styles.featureText}>Meal timing suggestions</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                <Text style={styles.featureText}>Food swap recommendations</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#4ECDC4" />
                <Text style={styles.featureText}>Supplement guidance</Text>
              </View>
            </View>

            {/* Analyze Button */}
            <TouchableOpacity
              style={[styles.analyzeButton, analyzing && styles.analyzeButtonDisabled]}
              onPress={handleGetAdvice}
              disabled={analyzing}
              accessibilityLabel="Analyze my nutrition"
            >
              <Ionicons name="sparkles" size={24} color="#fff" />
              <Text style={styles.analyzeButtonText}>Analyze My Nutrition</Text>
            </TouchableOpacity>
          </>
        )}

        {analyzing && (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color="#4ECDC4" />
            <Text style={styles.analyzingText}>Analyzing your nutrition...</Text>
            <Text style={styles.analyzingSubtext}>This may take a few seconds</Text>
          </View>
        )}

        {advice && !analyzing && (
          <View style={styles.adviceContainer}>
            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Your Nutrition Overview</Text>
              <Text style={styles.summaryText}>{advice.summary}</Text>
            </View>

            {/* Strengths */}
            {advice.strengths && advice.strengths.length > 0 && (
              renderAdviceSection('Strengths', advice.strengths, 'trophy')
            )}

            {/* Areas for Improvement */}
            {advice.improvements && advice.improvements.length > 0 && (
              renderAdviceSection('Areas for Improvement', advice.improvements, 'trending-up')
            )}

            {/* Recommendations */}
            {advice.recommendations && advice.recommendations.length > 0 && (
              renderAdviceSection('Recommendations', advice.recommendations, 'bulb')
            )}

            {/* Meal Suggestions */}
            {advice.mealSuggestions && advice.mealSuggestions.length > 0 && (
              renderAdviceSection('Meal Ideas', advice.mealSuggestions, 'restaurant')
            )}

            {/* Supplements */}
            {advice.supplements && advice.supplements.length > 0 && (
              renderAdviceSection('Supplement Suggestions', advice.supplements, 'medkit')
            )}

            {/* Get New Advice Button */}
            <TouchableOpacity style={styles.refreshButton} onPress={handleGetAdvice} accessibilityLabel="Get updated nutrition advice">
              <Ionicons name="refresh" size={20} color="#4ECDC4" />
              <Text style={styles.refreshButtonText}>Get Updated Advice</Text>
            </TouchableOpacity>
          </View>
        )}

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
  featuresContainer: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 12,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#fff',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    marginHorizontal: 16,
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  analyzingContainer: {
    marginTop: 64,
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
  adviceContainer: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  summaryCard: {
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.3)',
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4ECDC4',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  adviceSection: {
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  adviceItem: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  bulletPoint: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  adviceText: {
    flex: 1,
    fontSize: 14,
    color: '#B0B0B0',
    lineHeight: 20,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2C2C2E',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
  },
});

export default AINutritionAdvisorScreen;
