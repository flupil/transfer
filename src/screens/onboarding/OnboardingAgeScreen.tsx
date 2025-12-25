import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';

const OnboardingAgeScreen = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const [age, setAge] = useState('');

  const handleNext = () => {
    if (age && parseInt(age) >= 13 && parseInt(age) <= 100) {
      navigation.navigate('OnboardingFitnessLevel' as never);
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
            <View style={[styles.progressFill, { width: '41%' }]} />
          </View>
          <Text style={styles.progressText}>5/12</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.ageQuestion')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.ageInfo')}
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            placeholderTextColor="#4E4E50"
            placeholder={t('onboarding.enterAge')}
            maxLength={3}
          />
          <Text style={styles.yearsText}>{t('onboarding.years')}</Text>
        </View>

        {age && (parseInt(age) < 13 || parseInt(age) > 100) && (
          <Text style={styles.errorText}>{t('onboarding.ageError')}</Text>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.button,
            (!age || parseInt(age) < 13 || parseInt(age) > 100) && styles.buttonDisabled
          ]}
          onPress={handleNext}
          disabled={!age || parseInt(age) < 13 || parseInt(age) > 100}
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
    gap: 15,
  },
  input: {
    flex: 1,
    fontSize: 32,
    color: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#3A3A3A',
    paddingVertical: 15,
    paddingHorizontal: 10,
    textAlign: 'center',
    maxWidth: 150,
  },
  yearsText: {
    fontSize: 20,
    color: '#8e9bab',
  },
  errorText: {
    color: '#E94E1B',
    fontSize: 14,
    marginTop: 20,
    textAlign: 'center',
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

export default OnboardingAgeScreen;