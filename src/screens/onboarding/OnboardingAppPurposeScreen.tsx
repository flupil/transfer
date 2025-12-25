import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useLanguage } from '../../contexts/LanguageContext';

const OnboardingAppPurposeScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const { t } = useLanguage();
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(onboardingData.appPurpose || 'gym');

  const purposes = [
    {
      id: 'gym',
      title: 'Gym & Fitness',
      description: 'Build muscle, lose weight, and track workouts',
      icon: 'dumbbell',
      color: '#E94E1B', // Primary color
    },
    {
      id: 'football',
      title: 'Football Training',
      description: 'Improve your skills and performance',
      icon: 'soccer',
      color: '#FF8C42',
    },
  ];

  const handleNext = () => {
    if (selectedPurpose) {
      updateOnboardingData({ appPurpose: selectedPurpose });
      // Go to Gender screen (Interests screen is now before this)
      navigation.navigate('OnboardingGender' as never);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

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
          <Text style={styles.progressText}>1/12</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>What will you use this app for?</Text>
        <Text style={styles.subtitle}>
          Choose your primary focus
        </Text>

        <View style={styles.optionsContainer}>
          {purposes.map((purpose) => {
            const isSelected = selectedPurpose === purpose.id;
            return (
              <TouchableOpacity
                key={purpose.id}
                style={[
                  styles.optionCard,
                  isSelected && [
                    styles.optionCardSelected,
                    { borderColor: purpose.color, backgroundColor: `${purpose.color}10` }
                  ],
                ]}
                onPress={() => setSelectedPurpose(purpose.id)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.iconContainer,
                  { backgroundColor: isSelected ? purpose.color : `${purpose.color}25` }
                ]}>
                  <MaterialCommunityIcons
                    name={purpose.icon as any}
                    size={56}
                    color={isSelected ? '#fff' : purpose.color}
                  />
                </View>
                <Text
                  style={[
                    styles.optionTitle,
                    isSelected && { color: purpose.color },
                  ]}
                >
                  {purpose.title}
                </Text>
                <Text style={styles.optionDescription}>{purpose.description}</Text>
                {isSelected && (
                  <View style={[styles.checkCircle, { backgroundColor: purpose.color }]}>
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={18} color="#3B82F6" />
          <Text style={styles.infoText}>
            You can switch modes anytime in settings
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            !selectedPurpose && styles.buttonDisabled,
            selectedPurpose && {
              backgroundColor: purposes.find(p => p.id === selectedPurpose)?.color || '#FF6B35'
            }
          ]}
          onPress={handleNext}
          disabled={!selectedPurpose}
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
    backgroundColor: '#1A1A1A',
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
    backgroundColor: '#2A2A2A',
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
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#a0b0c0',
    marginBottom: 30,
    textAlign: 'center',
  },
  optionsContainer: {
    gap: 16,
  },
  optionCard: {
    padding: 20,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2A2A2A',
    alignItems: 'center',
    position: 'relative',
  },
  optionCardSelected: {
    borderWidth: 3,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 14,
    color: '#a0b0c0',
    textAlign: 'center',
    lineHeight: 20,
  },
  checkCircle: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#2A2A2A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  infoText: {
    fontSize: 13,
    color: '#a0b0c0',
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    padding: 20,
  },
  button: {
    backgroundColor: '#FF8C42',
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

export default OnboardingAppPurposeScreen;
