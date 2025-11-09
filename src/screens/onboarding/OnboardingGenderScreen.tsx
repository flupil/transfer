import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useLanguage } from '../../contexts/LanguageContext';

const OnboardingGenderScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const { t } = useLanguage();
  const [selectedGender, setSelectedGender] = useState<string | null>(onboardingData.gender || null);

  const genders = [
    { id: 'female', label: t('onboarding.female'), icon: 'female' },
    { id: 'male', label: t('onboarding.male'), icon: 'male' },
  ];

  const handleNext = () => {
    if (selectedGender) {
      updateOnboardingData({ gender: selectedGender });
      navigation.navigate('OnboardingBodyStats' as never);
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
            <View style={[styles.progressFill, { width: '16%' }]} />
          </View>
          <Text style={styles.progressText}>2/12</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.genderQuestion')}</Text>

        <View style={styles.infoBox}>
          <Ionicons name="settings-outline" size={20} color="#3b9eff" />
          <Text style={styles.infoText}>
            {t('onboarding.genderInfo')}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {genders.map((gender) => (
            <TouchableOpacity
              key={gender.id}
              style={[
                styles.optionButton,
                selectedGender === gender.id && styles.optionButtonSelected,
              ]}
              onPress={() => setSelectedGender(gender.id)}
            >
              <Ionicons
                name={gender.icon as any}
                size={24}
                color={selectedGender === gender.id ? '#3b9eff' : '#8e9bab'}
              />
              <Text
                style={[
                  styles.optionText,
                  selectedGender === gender.id && styles.optionTextSelected,
                ]}
              >
                {gender.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !selectedGender && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!selectedGender}
        >
          <Text style={styles.buttonText}>{t('onboarding.next')}</Text>
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
    backgroundColor: '#3b9eff',
    borderRadius: 2,
  },
  progressText: {
    color: '#8e9bab',
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#1e2e3e',
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    flex: 1,
    color: '#8e9bab',
    fontSize: 14,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 15,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1e2e3e',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1e2e3e',
    gap: 15,
  },
  optionButtonSelected: {
    borderColor: '#3b9eff',
  },
  optionText: {
    fontSize: 18,
    color: '#8e9bab',
  },
  optionTextSelected: {
    color: '#fff',
  },
  footer: {
    padding: 20,
  },
  button: {
    backgroundColor: '#3b9eff',
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

export default OnboardingGenderScreen;