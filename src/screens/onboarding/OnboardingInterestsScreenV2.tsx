import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../contexts/OnboardingContext';

const OnboardingInterestsScreenV2 = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const [selectedInterest, setSelectedInterest] = useState<string | null>(onboardingData.appInterest || null);

  const interests = [
    {
      id: 'workouts',
      title: 'Gym Workouts',
      description: 'Focus on gym training and exercises',
      icon: 'dumbbell',
      color: '#FF6B35',
    },
    {
      id: 'football',
      title: 'Football Training',
      description: 'Specialized training for football performance',
      icon: 'soccer',
      color: '#22C55E',
    },
    {
      id: 'nutrition',
      title: 'Nutrition Only',
      description: 'Track meals and manage your diet',
      icon: 'food-apple',
      color: '#FF9800',
    },
    {
      id: 'both',
      title: 'Gym & Nutrition',
      description: 'Complete fitness and nutrition tracking',
      icon: 'heart-pulse',
      color: '#9333EA',
    },
  ];

  const handleNext = () => {
    if (selectedInterest) {
      updateOnboardingData({ appInterest: selectedInterest });
      navigation.navigate('OnboardingGender' as never);
    }
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
            <View style={[styles.progressFill, { width: '8%' }]} />
          </View>
          <Text style={styles.progressText}>1/13</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.iconHeader}>
          <MaterialCommunityIcons name="target" size={48} color="#FF6B35" />
        </View>

        <Text style={styles.title}>What brings you here?</Text>
        <Text style={styles.subtitle}>
          We'll customize your experience based on your goals
        </Text>

        <View style={styles.optionsContainer}>
          {interests.map((interest) => (
            <TouchableOpacity
              key={interest.id}
              style={[
                styles.optionCard,
                selectedInterest === interest.id && styles.optionCardSelected,
              ]}
              onPress={() => setSelectedInterest(interest.id)}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${interest.color}15` }]}>
                <MaterialCommunityIcons
                  name={interest.icon as any}
                  size={32}
                  color={selectedInterest === interest.id ? interest.color : '#8e9bab'}
                />
              </View>
              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionTitle,
                    selectedInterest === interest.id && styles.optionTitleSelected,
                  ]}
                >
                  {interest.title}
                </Text>
                <Text style={styles.optionDescription}>{interest.description}</Text>
              </View>
              {selectedInterest === interest.id && (
                <View style={[styles.checkCircle, { backgroundColor: interest.color }]}>
                  <Ionicons name="checkmark" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#FF6B35" />
          <Text style={styles.infoText}>
            You can always change this later in settings
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !selectedInterest && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!selectedInterest}
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
    paddingTop: 20,
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8e9bab',
    marginBottom: 35,
    textAlign: 'center',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 15,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#1e2e3e',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1e2e3e',
    gap: 15,
  },
  optionCardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#1a3048',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  optionTitleSelected: {
    color: '#FF6B35',
  },
  optionDescription: {
    fontSize: 14,
    color: '#8e9bab',
    lineHeight: 20,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 25,
    paddingHorizontal: 10,
  },
  infoText: {
    fontSize: 13,
    color: '#8e9bab',
    flex: 1,
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
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingInterestsScreenV2;