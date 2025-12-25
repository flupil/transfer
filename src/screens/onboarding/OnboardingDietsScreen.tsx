import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../contexts/OnboardingContext';

const OnboardingDietsScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const [selectedDiets, setSelectedDiets] = useState<string[]>(onboardingData.diets || []);

  const diets = [
    { id: 'dairy-free', name: 'Dairy Free', icon: 'cup-off' },
    { id: 'gluten-free', name: 'Gluten Free', icon: 'bread-slice-outline' },
    { id: 'keto', name: 'Keto', icon: 'egg-fried' },
    { id: 'lacto-vegetarian', name: 'Lacto Vegetarian', icon: 'leaf' },
    { id: 'low-carb', name: 'Low Carb', icon: 'bread-slice-outline' },
    { id: 'mediterranean', name: 'Mediterranean', icon: 'fish' },
    { id: 'ovo-vegetarian', name: 'Ovo Vegetarian', icon: 'egg' },
    { id: 'ovo-lacto-vegetarian', name: 'Ovo-Lacto Vegetarian', icon: 'food-variant' },
    { id: 'paleo', name: 'Paleo', icon: 'food-drumstick' },
    { id: 'pescatarian', name: 'Pescatarian', icon: 'fish' },
    { id: 'vegan', name: 'Vegan', icon: 'sprout' },
    { id: 'vegetarian', name: 'Vegetarian', icon: 'carrot' },
  ];

  const toggleDiet = (dietId: string) => {
    if (selectedDiets.includes(dietId)) {
      setSelectedDiets(selectedDiets.filter(id => id !== dietId));
    } else {
      if (selectedDiets.length < 2) {
        setSelectedDiets([...selectedDiets, dietId]);
      }
    }
  };

  const handleNext = () => {
    updateOnboardingData({ diets: selectedDiets });
    // Navigate to next screen in onboarding flow
    navigation.navigate('OnboardingAge' as never);
  };

  const handleSkip = () => {
    updateOnboardingData({ diets: [] });
    navigation.navigate('OnboardingAge' as never);
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
        <Text style={styles.title}>Do you have a special{'\n'}diet?</Text>
        <Text style={styles.subtitle}>Choose up to 2 diets to personalize your experience. Change them anytime.</Text>

        <View style={styles.dietsList}>
          {diets.map((diet) => (
            <TouchableOpacity
              key={diet.id}
              style={[
                styles.dietPill,
                selectedDiets.includes(diet.id) && styles.dietPillSelected,
                selectedDiets.length >= 2 && !selectedDiets.includes(diet.id) && styles.dietPillDisabled,
              ]}
              onPress={() => toggleDiet(diet.id)}
              disabled={selectedDiets.length >= 2 && !selectedDiets.includes(diet.id)}
            >
              <MaterialCommunityIcons
                name={diet.icon as any}
                size={20}
                color={selectedDiets.includes(diet.id) ? '#000' : '#fff'}
              />
              <Text
                style={[
                  styles.dietText,
                  selectedDiets.includes(diet.id) && styles.dietTextSelected,
                ]}
              >
                {diet.name}
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
    backgroundColor: '#2A2A2A',
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
  subtitle: {
    fontSize: 15,
    color: '#999',
    marginBottom: 10,
    lineHeight: 22,
  },
  dietsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 20,
  },
  dietPill: {
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
  dietPillSelected: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  dietPillDisabled: {
    opacity: 0.4,
  },
  dietText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  dietTextSelected: {
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

export default OnboardingDietsScreen;
