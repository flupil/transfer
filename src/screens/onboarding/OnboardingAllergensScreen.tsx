import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../contexts/OnboardingContext';

const OnboardingAllergensScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>(onboardingData.allergens || []);

  const allergens = [
    { id: 'alcohol', name: 'Alcohol', icon: 'glass-cocktail' },
    { id: 'caffeine', name: 'Caffeine', icon: 'coffee' },
    { id: 'celery', name: 'Celery', icon: 'carrot' },
    { id: 'crustacean', name: 'Crustacean', icon: 'fish' },
    { id: 'egg', name: 'Egg', icon: 'egg' },
    { id: 'fish', name: 'Fish', icon: 'fish' },
    { id: 'gluten', name: 'Gluten', icon: 'bread-slice' },
    { id: 'groundnut', name: 'Groundnut', icon: 'peanut' },
    { id: 'milk', name: 'Milk', icon: 'cup' },
    { id: 'mollusc', name: 'Mollusc', icon: 'food-variant' },
    { id: 'mustard', name: 'Mustard', icon: 'food' },
    { id: 'sesame', name: 'Sesame', icon: 'seed' },
    { id: 'soybean', name: 'Soybean', icon: 'soy-sauce' },
    { id: 'sulphites', name: 'Sulphites', icon: 'flask' },
    { id: 'tree-nut', name: 'Tree Nut', icon: 'nut' },
    { id: 'wheat', name: 'Wheat', icon: 'barley' },
    { id: 'lactose', name: 'Lactose', icon: 'cheese' },
    { id: 'yeast', name: 'Yeast', icon: 'bacteria' },
  ];

  const toggleAllergen = (allergenId: string) => {
    if (selectedAllergens.includes(allergenId)) {
      setSelectedAllergens(selectedAllergens.filter(id => id !== allergenId));
    } else {
      setSelectedAllergens([...selectedAllergens, allergenId]);
    }
  };

  const handleNext = () => {
    updateOnboardingData({ allergens: selectedAllergens });
    navigation.navigate('OnboardingDiets' as never);
  };

  const handleSkip = () => {
    updateOnboardingData({ allergens: [] });
    navigation.navigate('OnboardingDiets' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Are you avoiding any{'\n'}ingredients?</Text>

        <View style={styles.allergensList}>
          {allergens.map((allergen) => (
            <TouchableOpacity
              key={allergen.id}
              style={[
                styles.allergenPill,
                selectedAllergens.includes(allergen.id) && styles.allergenPillSelected,
              ]}
              onPress={() => toggleAllergen(allergen.id)}
            >
              <MaterialCommunityIcons
                name={allergen.icon as any}
                size={20}
                color={selectedAllergens.includes(allergen.id) ? '#000' : '#fff'}
              />
              <Text
                style={[
                  styles.allergenText,
                  selectedAllergens.includes(allergen.id) && styles.allergenTextSelected,
                ]}
              >
                {allergen.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerSpacer: {
    width: 50,
  },
  skipText: {
    color: '#FF8C42',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    lineHeight: 36,
  },
  allergensList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
  },
  allergenPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    gap: 8,
  },
  allergenPillSelected: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  allergenText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  allergenTextSelected: {
    color: '#000',
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
  },
  nextButton: {
    backgroundColor: '#FF8C42',
    paddingVertical: 18,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
});

export default OnboardingAllergensScreen;
