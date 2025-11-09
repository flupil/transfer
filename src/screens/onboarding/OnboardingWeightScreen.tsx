import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useLanguage } from '../../contexts/LanguageContext';

const OnboardingWeightScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const { t } = useLanguage();
  const [weight, setWeight] = useState(onboardingData.currentWeight?.toString() || '60');
  const [unit, setUnit] = useState<'kg' | 'lb'>(onboardingData.weightUnit || 'kg');

  const handleNext = () => {
    if (weight) {
      updateOnboardingData({
        currentWeight: parseFloat(weight),
        weightUnit: unit
      });
      navigation.navigate('OnboardingHeight' as never);
    }
  };

  const convertWeight = () => {
    if (unit === 'kg') {
      setUnit('lb');
      setWeight(Math.round(parseFloat(weight) * 2.20462).toString());
    } else {
      setUnit('kg');
      setWeight(Math.round(parseFloat(weight) / 2.20462).toString());
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
            <View style={[styles.progressFill, { width: '25%' }]} />
          </View>
          <Text style={styles.progressText}>3/12</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>{t('onboarding.weightMotivation')}</Text>
        <Text style={styles.title}>{t('onboarding.weightQuestion')}</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            keyboardType="numeric"
            placeholderTextColor="#4a5a6a"
            placeholder={t('onboarding.enterWeight')}
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
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, !weight && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!weight}
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
  subtitle: {
    fontSize: 18,
    color: '#8e9bab',
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 50,
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
    borderBottomColor: '#3a4a5a',
    paddingVertical: 15,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#1e2e3e',
    borderRadius: 8,
    padding: 2,
  },
  unitButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  unitButtonActive: {
    backgroundColor: '#3b9eff',
  },
  unitText: {
    fontSize: 16,
    color: '#8e9bab',
    fontWeight: '600',
  },
  unitTextActive: {
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

export default OnboardingWeightScreen;