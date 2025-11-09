import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../contexts/OnboardingContext';

const OnboardingFoodPreferencesScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const [selectedDiets, setSelectedDiets] = useState<string[]>(onboardingData.dietaryPreferences || []);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(onboardingData.allergens || []);

  const diets = [
    { id: 'none', label: 'No Restrictions', icon: 'food' },
    { id: 'vegetarian', label: 'Vegetarian', icon: 'leaf' },
    { id: 'vegan', label: 'Vegan', icon: 'flower' },
    { id: 'pescatarian', label: 'Pescatarian', icon: 'fish' },
    { id: 'keto', label: 'Keto', icon: 'nutrition' },
    { id: 'paleo', label: 'Paleo', icon: 'flame' },
    { id: 'mediterranean', label: 'Mediterranean', icon: 'restaurant' },
    { id: 'low-carb', label: 'Low Carb', icon: 'remove-circle' },
  ];

  const allergens = [
    { id: 'dairy', label: 'Dairy', icon: 'ice-cream' },
    { id: 'eggs', label: 'Eggs', icon: 'egg' },
    { id: 'nuts', label: 'Nuts', icon: 'nutrition' },
    { id: 'peanuts', label: 'Peanuts', icon: 'peanut' },
    { id: 'soy', label: 'Soy', icon: 'leaf' },
    { id: 'wheat', label: 'Wheat/Gluten', icon: 'pizza' },
    { id: 'fish', label: 'Fish', icon: 'fish' },
    { id: 'shellfish', label: 'Shellfish', icon: 'restaurant' },
  ];

  const toggleDiet = (dietId: string) => {
    if (dietId === 'none') {
      setSelectedDiets(['none']);
    } else {
      const filtered = selectedDiets.filter(id => id !== 'none');
      if (selectedDiets.includes(dietId)) {
        setSelectedDiets(filtered.filter(id => id !== dietId));
      } else {
        setSelectedDiets([...filtered, dietId]);
      }
    }
  };

  const toggleAllergen = (allergenId: string) => {
    if (selectedAllergens.includes(allergenId)) {
      setSelectedAllergens(selectedAllergens.filter(id => id !== allergenId));
    } else {
      setSelectedAllergens([...selectedAllergens, allergenId]);
    }
  };

  const handleNext = () => {
    updateOnboardingData({
      dietaryPreferences: selectedDiets.length > 0 ? selectedDiets : ['none'],
      allergens: selectedAllergens,
    });
    navigation.navigate('OnboardingTargetWeight' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a2a3a" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '58%' }]} />
          </View>
          <Text style={styles.progressText}>7/12</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Food Preferences</Text>
        <Text style={styles.subtitle}>
          Tell us about your dietary preferences and allergies
        </Text>

        {/* Dietary Preferences Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="food-apple" size={20} color="#FF6B35" />
            <Text style={styles.sectionTitle}>Dietary Preferences</Text>
          </View>

          <View style={styles.optionsGrid}>
            {diets.map((diet) => (
              <TouchableOpacity
                key={diet.id}
                style={[
                  styles.optionCard,
                  selectedDiets.includes(diet.id) && styles.optionCardSelected,
                ]}
                onPress={() => toggleDiet(diet.id)}
              >
                <MaterialCommunityIcons
                  name={diet.icon as any}
                  size={28}
                  color={selectedDiets.includes(diet.id) ? '#FF6B35' : '#8e9bab'}
                />
                <Text
                  style={[
                    styles.optionLabel,
                    selectedDiets.includes(diet.id) && styles.optionLabelSelected,
                  ]}
                >
                  {diet.label}
                </Text>
                {selectedDiets.includes(diet.id) && (
                  <View style={styles.checkmark}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Allergens Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.sectionTitle}>Allergies & Intolerances</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Select any you need to avoid</Text>

          <View style={styles.optionsGrid}>
            {allergens.map((allergen) => (
              <TouchableOpacity
                key={allergen.id}
                style={[
                  styles.optionCard,
                  selectedAllergens.includes(allergen.id) && styles.optionCardAllergen,
                ]}
                onPress={() => toggleAllergen(allergen.id)}
              >
                <MaterialCommunityIcons
                  name={allergen.icon as any}
                  size={28}
                  color={selectedAllergens.includes(allergen.id) ? '#EF4444' : '#8e9bab'}
                />
                <Text
                  style={[
                    styles.optionLabel,
                    selectedAllergens.includes(allergen.id) && styles.optionLabelAllergen,
                  ]}
                >
                  {allergen.label}
                </Text>
                {selectedAllergens.includes(allergen.id) && (
                  <View style={[styles.checkmark, { backgroundColor: '#EF4444' }]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
        >
          <Text style={styles.buttonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    marginRight: 15,
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#2a3a4a',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  progressText: {
    color: '#8e9bab',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#8e9bab',
    marginBottom: 30,
    lineHeight: 24,
  },
  section: {
    marginBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8e9bab',
    marginBottom: 20,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  optionCard: {
    width: '48%',
    padding: 16,
    backgroundColor: '#1e2e3e',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1e2e3e',
    alignItems: 'center',
    position: 'relative',
    minHeight: 100,
    justifyContent: 'center',
  },
  optionCardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
  },
  optionCardAllergen: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  optionLabel: {
    fontSize: 13,
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  optionLabelSelected: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  optionLabelAllergen: {
    color: '#EF4444',
    fontWeight: '600',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    padding: 20,
  },
  button: {
    backgroundColor: '#FF6B35',
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
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingFoodPreferencesScreen;
