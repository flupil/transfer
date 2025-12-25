import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useLanguage } from '../../contexts/LanguageContext';

const OnboardingTargetWeightScreen = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const [targetWeight, setTargetWeight] = useState('');
  const [unit, setUnit] = useState<'kg' | 'lb'>('kg');

  const handleNext = () => {
    if (targetWeight) {
      updateOnboardingData({ targetWeight: parseFloat(targetWeight), targetWeightUnit: unit });
    }

    // ALWAYS show calorie results screen so user can choose their calorie target
    navigation.navigate('OnboardingCalorieResults' as never);
  };

  const convertWeight = () => {
    if (unit === 'kg') {
      setUnit('lb');
      if (targetWeight) {
        setTargetWeight(Math.round(parseFloat(targetWeight) * 2.20462).toString());
      }
    } else {
      setUnit('kg');
      if (targetWeight) {
        setTargetWeight(Math.round(parseFloat(targetWeight) / 2.20462).toString());
      }
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
            <View style={[styles.progressFill, { width: '66%' }]} />
          </View>
          <Text style={styles.progressText}>8/12</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.targetWeightQuestion')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.reachGoalSafely')}
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={targetWeight}
            onChangeText={setTargetWeight}
            keyboardType="numeric"
            placeholderTextColor="#4E4E50"
            placeholder={t('onboarding.enterTargetPlaceholder')}
          />
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[styles.unitButton, unit === 'kg' && styles.unitButtonActive]}
              onPress={convertWeight}
            >
              <Text style={[styles.unitText, unit === 'kg' && styles.unitTextActive]}>
                KG
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitButton, unit === 'lb' && styles.unitButtonActive]}
              onPress={convertWeight}
            >
              <Text style={[styles.unitText, unit === 'lb' && styles.unitTextActive]}>
                LB
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => {
            // ALWAYS show calorie results screen so user can choose their calorie target
            navigation.navigate('OnboardingCalorieResults' as never);
          }}
        >
          <Text style={styles.skipText}>{t('onboarding.skipForNow')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !targetWeight && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!targetWeight}
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
    backgroundColor: '#3B82F6',
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#8e9bab',
    marginBottom: 50,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  input: {
    flex: 1,
    fontSize: 24,
    color: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#3A3A3A',
    paddingVertical: 15,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    padding: 2,
  },
  unitButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  unitButtonActive: {
    backgroundColor: '#3B82F6',
  },
  unitText: {
    fontSize: 16,
    color: '#8e9bab',
    fontWeight: '600',
  },
  unitTextActive: {
    color: '#fff',
  },
  skipButton: {
    marginTop: 30,
    alignSelf: 'center',
  },
  skipText: {
    color: '#8e9bab',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  footer: {
    padding: 20,
  },
  button: {
    backgroundColor: '#3B82F6',
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

export default OnboardingTargetWeightScreen;