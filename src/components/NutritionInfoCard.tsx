import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MacroPieChart from './MacroPieChart';
import RecommendedMacroPieChart from './RecommendedMacroPieChart';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface NutritionInfoCardProps {
  carbsConsumed: number;
  fatConsumed: number;
  proteinConsumed: number;
  carbsTarget: number;
  fatTarget: number;
  proteinTarget: number;
  onPress?: () => void;
}

const NutritionInfoCard: React.FC<NutritionInfoCardProps> = ({
  carbsConsumed,
  fatConsumed,
  proteinConsumed,
  carbsTarget,
  fatTarget,
  proteinTarget,
  onPress,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [userGoal, setUserGoal] = useState<'gain' | 'lose' | 'maintain'>('maintain');

  useEffect(() => {
    const loadGoal = async () => {
      try {
        const nutritionDataKey = `nutrition_data_${user?.id}`;
        const data = await AsyncStorage.getItem(nutritionDataKey);
        if (data) {
          const parsed = JSON.parse(data);
          setUserGoal(parsed.goal || 'maintain');
        }
      } catch (error) {
        console.error('Error loading goal:', error);
      }
    };

    if (user?.id) {
      loadGoal();
    }
  }, [user?.id]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity style={styles.header} onPress={onPress} activeOpacity={0.7}>
        <Text style={styles.headerTitle}>{t('nutrition.nutritionInfo')}</Text>
        <Ionicons name="chevron-forward" size={24} color="#B0B0B0" />
      </TouchableOpacity>

      {/* Macros Row */}
      <View style={styles.macrosRow}>
        <View style={styles.macroItem}>
          <View style={[styles.dot, { backgroundColor: '#4ECDC4' }]} />
          <Text style={styles.macroLabel}>{t('nutrition.carb')}</Text>
        </View>
        <View style={styles.macroItem}>
          <View style={[styles.dot, { backgroundColor: '#FF9F40' }]} />
          <Text style={styles.macroLabel}>{t('nutrition.fat')}</Text>
        </View>
        <View style={styles.macroItem}>
          <View style={[styles.dot, { backgroundColor: '#E8C547' }]} />
          <Text style={styles.macroLabel}>{t('nutrition.protein')}</Text>
        </View>
      </View>

      {/* Values Row */}
      <View style={styles.valuesRow}>
        <Text style={styles.macroValue}>{Math.round(carbsConsumed)} g</Text>
        <Text style={styles.macroValue}>{Math.round(fatConsumed)} g</Text>
        <Text style={styles.macroValue}>{Math.round(proteinConsumed)} g</Text>
      </View>

      {/* Pie Charts */}
      <View style={styles.pieChartsRow}>
        <RecommendedMacroPieChart
          title={t('nutrition.recommended')}
          goal={userGoal}
          size={120}
        />

        <MacroPieChart
          title={t('nutrition.actual')}
          carbs={carbsConsumed * 4}
          protein={proteinConsumed * 4}
          fat={fatConsumed * 9}
          size={120}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroLabel: {
    fontSize: 12,
    color: '#B0B0B0',
  },
  valuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    minWidth: 80,
    textAlign: 'center',
  },
  pieChartsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
});

export default NutritionInfoCard;
