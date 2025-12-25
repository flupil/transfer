import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OnboardingWelcomeScreen = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();

  useEffect(() => {
    // Clear any existing meal plan selection when starting onboarding
    // This ensures the new custom plan from onboarding will be used
    const clearOldPlan = async () => {
      try {
        await AsyncStorage.removeItem('selectedMealPlan');
        console.log('🗑️ Cleared old meal plan selection for fresh onboarding');
      } catch (error) {
        console.error('Error clearing old meal plan:', error);
      }
    };
    clearOldPlan();
  }, []);

  const steps = [
    {
      icon: 'person-outline',
      title: t('onboarding.step1'),
      description: t('onboarding.step1Description')
    },
    {
      icon: 'barbell-outline',
      title: t('onboarding.step2'),
      description: t('onboarding.step2Description')
    },
    {
      icon: 'flame-outline',
      title: t('onboarding.step3'),
      description: t('onboarding.step3Description')
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />

      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '8%' }]} />
          </View>
          <Text style={styles.progressText}>1/12</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.welcomeTitle')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.welcomeSubtitle')}
        </Text>

        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={20} color="#8e9bab" />
          <Text style={styles.timeText}>{t('onboarding.estimatedTime')}</Text>
        </View>

        <View style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <View key={index} style={styles.stepItem}>
              <View style={styles.stepIconContainer}>
                <Ionicons name={step.icon as any} size={24} color="#3B82F6" />
                <View style={styles.stepLine} />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDescription}>{step.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('OnboardingInterests' as never)}
        >
          <Text style={styles.buttonText}>{t('onboarding.startSetup')}</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  progressContainer: {
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
    marginBottom: 15,
  },
  subtitle: {
    fontSize: 16,
    color: '#8e9bab',
    lineHeight: 24,
    marginBottom: 20,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 40,
  },
  timeText: {
    color: '#8e9bab',
    fontSize: 16,
  },
  stepsContainer: {
    gap: 30,
  },
  stepItem: {
    flexDirection: 'row',
    gap: 15,
  },
  stepIconContainer: {
    alignItems: 'center',
    width: 40,
  },
  stepLine: {
    position: 'absolute',
    top: 35,
    width: 1,
    height: 50,
    backgroundColor: '#2A2A2A',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    color: '#8e9bab',
    fontSize: 12,
    marginBottom: 4,
  },
  stepDescription: {
    color: '#fff',
    fontSize: 16,
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
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingWelcomeScreen;