import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, commonStyles } from './styles/OnboardingStyles';

const OnboardingInterestsScreen = () => {
  const navigation = useNavigation();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const { t } = useLanguage();
  const [selectedInterest, setSelectedInterest] = useState<string | null>(onboardingData.appInterest || null);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const interests = [
    {
      id: 'workouts',
      title: t('onboarding.fitnessTraining'),
      description: t('onboarding.buildStrength'),
      icon: 'fitness',
      gradient: ['#FF6B35', '#FF8A65'],
    },
    {
      id: 'nutrition',
      title: t('onboarding.nutritionTracking'),
      description: t('onboarding.monitorCalories'),
      icon: 'restaurant',
      gradient: ['#FFB74D', '#FFA726'],
    },
    {
      id: 'both',
      title: t('onboarding.completePackage'),
      description: t('onboarding.fullJourney'),
      icon: 'trending-up',
      gradient: ['#FF6B35', '#FFB74D'],
    },
  ];

  const handleSelect = (id: string) => {
    setSelectedInterest(id);
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleNext = () => {
    if (selectedInterest) {
      updateOnboardingData({ appInterest: selectedInterest });
      navigation.navigate('OnboardingGender' as never);
    }
  };

  const progress = (1 / 13) * 100;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.darkBg, COLORS.darkBg2]}
        style={styles.gradient}
      />

      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={commonStyles.header}>
          <TouchableOpacity
            style={commonStyles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>

          <View style={commonStyles.progressContainer}>
            <View style={commonStyles.progressInfo}>
              <Text style={commonStyles.progressSteps}>{t('onboarding.step1of13')}</Text>
              <Text style={commonStyles.progressPercent}>{Math.round(progress)}%</Text>
            </View>
            <View style={commonStyles.progressBarBg}>
              <LinearGradient
                colors={[COLORS.primary, COLORS.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[commonStyles.progressBarFill, { width: `${progress}%` }]}
              />
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={commonStyles.content}>
          <View style={styles.headerIcon}>
            <LinearGradient
              colors={[COLORS.primary, COLORS.accent]}
              style={styles.iconGradient}
            >
              <MaterialCommunityIcons name="rocket-launch" size={36} color={COLORS.textPrimary} />
            </LinearGradient>
          </View>

          <Text style={styles.title}>
            {t('onboarding.personalizeExperience')}
          </Text>

          <Text style={styles.subtitle}>
            {t('onboarding.focusOn')}
          </Text>

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <View style={styles.cardsContainer}>
              {interests.map((interest) => (
                <TouchableOpacity
                  key={interest.id}
                  style={[
                    styles.interestCard,
                    selectedInterest === interest.id && styles.interestCardSelected,
                  ]}
                  onPress={() => handleSelect(interest.id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={selectedInterest === interest.id ? interest.gradient : ['transparent', 'transparent']}
                    style={styles.cardIconContainer}
                  >
                    <Ionicons
                      name={interest.icon as any}
                      size={28}
                      color={selectedInterest === interest.id ? COLORS.textPrimary : COLORS.textSecondary}
                    />
                  </LinearGradient>

                  <View style={styles.cardContent}>
                    <Text style={[
                      styles.cardTitle,
                      selectedInterest === interest.id && styles.cardTitleSelected
                    ]}>
                      {interest.title}
                    </Text>
                    <Text style={styles.cardDescription}>
                      {interest.description}
                    </Text>
                  </View>

                  {selectedInterest === interest.id && (
                    <View style={styles.selectedBadge}>
                      <Ionicons name="checkmark" size={16} color={COLORS.textPrimary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          <View style={styles.tipContainer}>
            <Ionicons name="bulb-outline" size={20} color={COLORS.accent} />
            <Text style={styles.tipText}>
              {t('onboarding.canChangeLater')}
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={commonStyles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              !selectedInterest && styles.nextButtonDisabled
            ]}
            onPress={handleNext}
            disabled={!selectedInterest}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedInterest ? [COLORS.primary, '#FF8A65'] : ['#3A3A42', '#3A3A42']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>{t('onboarding.continue')}</Text>
              <Ionicons name="arrow-forward" size={20} color={COLORS.textPrimary} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBg,
  },
  gradient: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
  },
  headerIcon: {
    alignSelf: 'center',
    marginBottom: 28,
  },
  iconGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 32,
  },
  cardsContainer: {
    gap: 14,
  },
  interestCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 16,
  },
  interestCardSelected: {
    backgroundColor: 'rgba(255, 107, 53, 0.08)',
    borderColor: COLORS.primary,
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  cardTitleSelected: {
    color: COLORS.textPrimary,
  },
  cardDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    opacity: 0.8,
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 28,
    paddingHorizontal: 16,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
  nextButton: {
    overflow: 'hidden',
    borderRadius: 30,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default OnboardingInterestsScreen;