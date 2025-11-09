import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import firebaseDailyDataService from '../../services/firebaseDailyDataService';

const ManualFoodEntryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { mealType, mealName } = route.params as { mealType: string; mealName: string };

  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!calories || parseFloat(calories) <= 0) {
      Alert.alert(t('alert.error'), 'Please enter at least the calories');
      return;
    }

    if (!user?.id) {
      Alert.alert(t('alert.error'), 'User not found');
      return;
    }

    setSaving(true);
    try {
      await firebaseDailyDataService.updateNutrition(
        user.id,
        {
          calories: parseFloat(calories) || 0,
          protein: parseFloat(protein) || 0,
          carbs: parseFloat(carbs) || 0,
          fat: parseFloat(fat) || 0,
        },
        'add'
      );

      Alert.alert(
        t('alert.success'),
        `Added ${calories} calories to ${mealName}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving food:', error);
      Alert.alert(t('alert.error'), 'Failed to save food entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#202124" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Calories</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#4ECDC4" />
          <Text style={styles.infoText}>
            Enter at minimum the calories. Macros are optional.
          </Text>
        </View>

        {/* Food Name (Optional) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Food Name (Optional)</Text>
          <TextInput
            style={styles.input}
            value={foodName}
            onChangeText={setFoodName}
            placeholder="e.g. Chicken breast"
            placeholderTextColor="#6A7A8A"
          />
        </View>

        {/* Calories (Required) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Calories <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={calories}
            onChangeText={setCalories}
            placeholder="0"
            placeholderTextColor="#6A7A8A"
            keyboardType="numeric"
          />
        </View>

        {/* Protein */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Protein (g)</Text>
          <TextInput
            style={styles.input}
            value={protein}
            onChangeText={setProtein}
            placeholder="0"
            placeholderTextColor="#6A7A8A"
            keyboardType="numeric"
          />
        </View>

        {/* Carbs */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Carbs (g)</Text>
          <TextInput
            style={styles.input}
            value={carbs}
            onChangeText={setCarbs}
            placeholder="0"
            placeholderTextColor="#6A7A8A"
            keyboardType="numeric"
          />
        </View>

        {/* Fat */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Fat (g)</Text>
          <TextInput
            style={styles.input}
            value={fat}
            onChangeText={setFat}
            placeholder="0"
            placeholderTextColor="#6A7A8A"
            keyboardType="numeric"
          />
        </View>

        {/* Summary */}
        {calories && parseFloat(calories) > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Calories:</Text>
              <Text style={styles.summaryValue}>{calories}</Text>
            </View>
            {protein && parseFloat(protein) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Protein:</Text>
                <Text style={styles.summaryValue}>{protein}g</Text>
              </View>
            )}
            {carbs && parseFloat(carbs) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Carbs:</Text>
                <Text style={styles.summaryValue}>{carbs}g</Text>
              </View>
            )}
            {fat && parseFloat(fat) > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Fat:</Text>
                <Text style={styles.summaryValue}>{fat}g</Text>
              </View>
            )}
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, (!calories || saving) && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={!calories || saving}
          accessibilityLabel={saving ? 'Saving food entry' : `Add food to ${mealName}`}
        >
          <Text style={styles.buttonText}>
            {saving ? 'Saving...' : `Add to ${mealName}`}
          </Text>
          {!saving && <Ionicons name="checkmark" size={20} color="#fff" />}
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#4ECDC4',
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  required: {
    color: '#FF6B6B',
  },
  input: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#3A3A3C',
  },
  summaryCard: {
    backgroundColor: '#2C2C2E',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#B0B0B0',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#2C3A47',
  },
  button: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default ManualFoodEntryScreen;
