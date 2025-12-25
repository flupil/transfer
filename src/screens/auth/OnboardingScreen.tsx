import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { BRAND_COLORS } from '../../constants/brandColors';

const { width } = Dimensions.get('window');

const OnboardingScreen = ({ navigation }: any) => {
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.logoSection}>
        <MaterialCommunityIcons name="dumbbell" size={100} color={BRAND_COLORS.accent} />
        <Text style={styles.title}>FitGym</Text>
        <Text style={styles.subtitle}>Your Complete Fitness Companion</Text>
      </View>

      <View style={styles.features}>
        <Feature icon="clipboard-check" title={t('onboarding.trackWorkouts')} />
        <Feature icon="food-apple" title={t('onboarding.logNutrition')} />
        <Feature icon="chart-line" title={t('onboarding.monitorProgress')} />
        <Feature icon="calendar-check" title={t('onboarding.scheduleSessions')} />
      </View>

      <View style={styles.buttons}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('SignUp')}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          {t('onboarding.getStarted')}
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('SignIn')}
          style={styles.button}
        >
          {t('onboarding.iHaveAccount')}
        </Button>
      </View>
    </View>
  );
};

const Feature = ({ icon, title }: { icon: string; title: string }) => (
  <View style={styles.feature}>
    <MaterialCommunityIcons name={icon as any} size={24} color={BRAND_COLORS.accent} />
    <Text style={styles.featureText}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    padding: 20,
  },
  logoSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  features: {
    marginVertical: 40,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  featureText: {
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  buttons: {
    paddingBottom: 20,
  },
  button: {
    marginVertical: 5,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

export default OnboardingScreen;