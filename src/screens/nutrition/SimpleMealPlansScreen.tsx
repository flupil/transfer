import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { BRAND_COLORS } from '../../constants/brandColors';

interface MealPlan {
  id: string;
  name: string;
  description: string;
  dailyCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  tags: string[];
  color: string;
  icon: string;
}

// Function to calculate personalized meal plans based on user's maintenance calories
const calculatePersonalizedPlans = (maintenanceCalories: number): MealPlan[] => {
  const cutting = Math.round(maintenanceCalories * 0.8); // 20% deficit
  const balanced = maintenanceCalories;
  const bulking = Math.round(maintenanceCalories * 1.2); // 20% surplus

  const calculateMacros = (calories: number, proteinRatio: number, carbRatio: number, fatRatio: number) => ({
    protein: Math.round((calories * proteinRatio) / 4),
    carbs: Math.round((calories * carbRatio) / 4),
    fat: Math.round((calories * fatRatio) / 9),
  });

  return [
    {
      id: 'preset_keto',
      name: 'Keto Diet',
      description: 'High fat, low carb for ketosis',
      dailyCalories: cutting,
      ...calculateMacros(cutting, 0.30, 0.05, 0.65),
      tags: ['Low Carb', 'Weight Loss'],
      color: BRAND_COLORS.accent,
      icon: 'food-steak',
    },
    {
      id: 'preset_vegan',
      name: 'Plant-Based',
      description: 'Complete plant-based nutrition',
      dailyCalories: balanced,
      ...calculateMacros(balanced, 0.20, 0.60, 0.20),
      tags: ['Vegan', 'Sustainable'],
      color: BRAND_COLORS.accent,
      icon: 'leaf',
    },
    {
      id: 'preset_muscle',
      name: 'Muscle Building',
      description: 'High protein for muscle growth',
      dailyCalories: bulking,
      ...calculateMacros(bulking, 0.30, 0.50, 0.20),
      tags: ['High Protein', 'Bulking'],
      color: '#6C5CE7',
      icon: 'arm-flex',
    },
    {
      id: 'preset_balanced',
      name: 'Balanced',
      description: 'Well-rounded for overall health',
      dailyCalories: balanced,
      ...calculateMacros(balanced, 0.30, 0.40, 0.30),
      tags: ['Balanced', 'Healthy'],
      color: '#00B894',
      icon: 'scale-balance',
    },
    {
      id: 'preset_mediterranean',
      name: 'Mediterranean',
      description: 'Heart-healthy with omega-3',
      dailyCalories: balanced,
      ...calculateMacros(balanced, 0.20, 0.45, 0.35),
      tags: ['Heart Healthy', 'Omega-3'],
      color: '#FDCB6E',
      icon: 'fish',
    },
    {
      id: 'preset_cutting',
      name: 'Cutting Phase',
      description: 'Low calorie for fat loss',
      dailyCalories: cutting,
      ...calculateMacros(cutting, 0.40, 0.30, 0.30),
      tags: ['Fat Loss', 'Lean'],
      color: '#FD79A8',
      icon: 'lightning-bolt',
    },
  ];
};

export const SimpleMealPlansScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [presetPlans, setPresetPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const onSelectPlan = (route.params as any)?.onSelectPlan;

  useEffect(() => {
    loadPersonalizedPlans();
  }, [user?.id]);

  const loadPersonalizedPlans = async () => {
    try {
      setLoading(true);

      // Load user's maintenance calories from Firebase
      let maintenanceCalories = 2000; // Default fallback

      if (user?.id) {
        const firebaseDailyDataService = (await import('../../services/firebaseDailyDataService')).default;
        const todayData = await firebaseDailyDataService.getTodayData(user.id);
        maintenanceCalories = todayData.calories.target || 2000;
        console.log('Loaded user maintenance calories:', maintenanceCalories);
      }

      // Calculate personalized plans based on maintenance
      const personalizedPlans = calculatePersonalizedPlans(maintenanceCalories);
      setPresetPlans(personalizedPlans);
    } catch (error) {
      console.error('Error loading personalized plans:', error);
      // Fallback to default 2000 cal plans
      setPresetPlans(calculatePersonalizedPlans(2000));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: MealPlan) => {
    setSelectedPlan(plan.id);

    // Update the parent screen with the selected plan name
    if (onSelectPlan) {
      onSelectPlan(plan.name);
    }

    // Update Firebase targets with the selected plan
    if (user?.id) {
      try {
        const firebaseDailyDataService = (await import('../../services/firebaseDailyDataService')).default;
        await firebaseDailyDataService.updateTargets(user.id, {
          calories: plan.dailyCalories,
          protein: plan.protein,
          carbs: plan.carbs,
          fat: plan.fat,
          water: 2000
        });
        console.log('Updated Firebase targets with preset plan:', plan.name);
      } catch (error) {
        console.error('Error updating Firebase targets:', error);
      }
    }

    Alert.alert(
      'Plan Selected',
      `You've selected the ${plan.name} plan!\n\nDaily targets:\n• Calories: ${plan.dailyCalories}\n• Protein: ${plan.protein}g\n• Carbs: ${plan.carbs}g\n• Fat: ${plan.fat}g`,
      [{
        text: 'OK',
        onPress: () => navigation.goBack()
      }]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.header}>Loading personalized plans...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>Choose Your Meal Plan</Text>
      <Text style={styles.subheader}>Select a plan that fits your goals</Text>

      <View style={styles.plansContainer}>
        {presetPlans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              { borderColor: plan.color },
              selectedPlan === plan.id && { backgroundColor: `${plan.color}15` }
            ]}
            onPress={() => handleSelectPlan(plan)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: plan.color }]}>
              <MaterialCommunityIcons
                name={plan.icon as any}
                size={32}
                color="white"
              />
            </View>

            <View style={styles.planContent}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planDescription}>{plan.description}</Text>

              <View style={styles.tagsContainer}>
                {plan.tags.map((tag, index) => (
                  <View
                    key={index}
                    style={[styles.tag, { backgroundColor: `${plan.color}20` }]}
                  >
                    <Text style={[styles.tagText, { color: plan.color }]}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.macrosContainer}>
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{plan.dailyCalories}</Text>
                  <Text style={styles.macroLabel}>{t('nutrition.cal')}</Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{plan.protein}g</Text>
                  <Text style={styles.macroLabel}>{t('nutrition.protein')}</Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{plan.carbs}g</Text>
                  <Text style={styles.macroLabel}>{t('nutrition.carbs')}</Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroItem}>
                  <Text style={styles.macroValue}>{plan.fat}g</Text>
                  <Text style={styles.macroLabel}>{t('nutrition.fat')}</Text>
                </View>
              </View>

              {selectedPlan === plan.id && (
                <View style={[styles.selectedBadge, { backgroundColor: plan.color }]}>
                  <MaterialCommunityIcons name="check" size={16} color="white" />
                  <Text style={styles.selectedText}>Selected</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginTop: 20,
    marginHorizontal: 20,
  },
  subheader: {
    fontSize: 16,
    color: '#7A7A7A',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  plansContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planContent: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#7A7A7A',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  macrosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  macroLabel: {
    fontSize: 11,
    color: '#7A7A7A',
    marginTop: 2,
  },
  macroDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E0E0E0',
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  selectedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default SimpleMealPlansScreen;