import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useLanguage } from '../../contexts/LanguageContext';

const OnboardingHeightScreen = () => {
  const navigation = useNavigation();
  const { updateOnboardingData } = useOnboarding();
  const { t } = useLanguage();
  const [height, setHeight] = useState('');
  const [unit, setUnit] = useState<'cm' | 'ft'>('cm');
  const [feet, setFeet] = useState('');
  const [inches, setInches] = useState('');

  const handleNext = () => {
    if (unit === 'cm' && height) {
      updateOnboardingData({ height: parseFloat(height), heightUnit: 'cm' });
      navigation.navigate('OnboardingAge' as never);
    } else if (unit === 'ft' && feet) {
      // Convert feet + inches to cm for storage
      const totalInches = (parseInt(feet) * 12) + (parseInt(inches) || 0);
      const cm = totalInches * 2.54;
      updateOnboardingData({ height: cm, heightUnit: 'cm' });
      navigation.navigate('OnboardingAge' as never);
    }
  };

  const switchUnit = () => {
    if (unit === 'cm') {
      setUnit('ft');
      if (height) {
        const totalInches = parseFloat(height) / 2.54;
        const ft = Math.floor(totalInches / 12);
        const inch = Math.round(totalInches % 12);
        setFeet(ft.toString());
        setInches(inch.toString());
      }
    } else {
      setUnit('cm');
      if (feet) {
        const totalInches = (parseInt(feet) * 12) + (parseInt(inches) || 0);
        const cm = Math.round(totalInches * 2.54);
        setHeight(cm.toString());
      }
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
            <View style={[styles.progressFill, { width: '33%' }]} />
          </View>
          <Text style={styles.progressText}>4/12</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>{t('onboarding.heightMotivation')}</Text>
        <Text style={styles.title}>{t('onboarding.heightQuestion')}</Text>

        <View style={styles.inputContainer}>
          {unit === 'cm' ? (
            <TextInput
              style={styles.input}
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
              placeholderTextColor="#4a5a6a"
              placeholder={t('onboarding.enterHeight')}
            />
          ) : (
            <View style={styles.feetInputContainer}>
              <TextInput
                style={[styles.input, styles.feetInput]}
                value={feet}
                onChangeText={setFeet}
                keyboardType="numeric"
                placeholderTextColor="#4a5a6a"
                placeholder={t('onboarding.feet')}
              />
              <Text style={styles.feetSeparator}>′</Text>
              <TextInput
                style={[styles.input, styles.inchesInput]}
                value={inches}
                onChangeText={setInches}
                keyboardType="numeric"
                placeholderTextColor="#4a5a6a"
                placeholder={t('onboarding.inches')}
              />
              <Text style={styles.inchesSeparator}>″</Text>
            </View>
          )}
          <View style={styles.unitToggle}>
            <TouchableOpacity
              style={[styles.unitButton, unit === 'cm' && styles.unitButtonActive]}
              onPress={switchUnit}
            >
              <Text style={[styles.unitText, unit === 'cm' && styles.unitTextActive]}>
                CM
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.unitButton, unit === 'ft' && styles.unitButtonActive]}
              onPress={switchUnit}
            >
              <Text style={[styles.unitText, unit === 'ft' && styles.unitTextActive]}>
                FT
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            !((unit === 'cm' && height) || (unit === 'ft' && feet)) && styles.buttonDisabled
          ]}
          onPress={handleNext}
          disabled={!((unit === 'cm' && height) || (unit === 'ft' && feet))}
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
  feetInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  feetInput: {
    flex: 1,
    maxWidth: 80,
  },
  inchesInput: {
    flex: 1,
    maxWidth: 80,
  },
  feetSeparator: {
    fontSize: 24,
    color: '#8e9bab',
  },
  inchesSeparator: {
    fontSize: 24,
    color: '#8e9bab',
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

export default OnboardingHeightScreen;