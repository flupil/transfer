import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions, PanResponder, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { useLanguage } from '../../contexts/LanguageContext';

const { width: screenWidth } = Dimensions.get('window');
const SLIDER_WIDTH = screenWidth - 100;

const OnboardingFitnessLevelScreen = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const [sliderValue, setSliderValue] = useState(onboardingData.fitnessLevel || 0);
  const pan = useRef(new Animated.Value(0)).current;
  const [currentDescription, setCurrentDescription] = useState(0);

  const fitnessDescriptions = [
    t('onboarding.sitFloorTrouble'),
    t('onboarding.loseBreathStairs'),
    t('onboarding.occasionallyExercise'),
    t('onboarding.regularExercise'),
    t('onboarding.vigorousExercise'),
    t('onboarding.competitiveAthlete')
  ];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        pan.setOffset(pan._value);
      },
      onPanResponderMove: (e, gestureState) => {
        const newValue = Math.max(0, Math.min(SLIDER_WIDTH, pan._offset + gestureState.dx));
        pan.setValue(newValue - pan._offset);
        // Update value and description in real-time while dragging
        const value = Math.max(0, Math.min(1, newValue / SLIDER_WIDTH));
        setSliderValue(value);
        const index = Math.round(value * (fitnessDescriptions.length - 1));
        setCurrentDescription(index);
      },
      onPanResponderRelease: () => {
        pan.flattenOffset();
        const value = Math.max(0, Math.min(1, pan._value / SLIDER_WIDTH));
        setSliderValue(value);
        const index = Math.round(value * (fitnessDescriptions.length - 1));
        setCurrentDescription(index);
      },
    })
  ).current;

  React.useEffect(() => {
    pan.setValue(sliderValue * SLIDER_WIDTH);
  }, []);

  const handleNext = () => {
    const index = Math.round(sliderValue * (fitnessDescriptions.length - 1));
    updateOnboardingData({ fitnessLevel: index });
    navigation.navigate('OnboardingTargetWeight' as never);
  };

  const getDescription = () => {
    return fitnessDescriptions[Math.min(currentDescription, fitnessDescriptions.length - 1)];
  };

  const handleSliderPress = (event) => {
    const locationX = event.nativeEvent.locationX;
    const value = Math.max(0, Math.min(1, locationX / SLIDER_WIDTH));
    setSliderValue(value);
    const index = Math.round(value * (fitnessDescriptions.length - 1));
    setCurrentDescription(index);
    Animated.spring(pan, {
      toValue: value * SLIDER_WIDTH,
      useNativeDriver: false,
      friction: 7,
    }).start();
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
            <View style={[styles.progressFill, { width: '50%' }]} />
          </View>
          <Text style={styles.progressText}>6/11</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('onboarding.whatFitnessLevel')}</Text>
        <Text style={styles.subtitle}>
          {t('onboarding.selectClosest')}
        </Text>

        <View style={styles.sliderSection}>
          <Text style={styles.description}>
            {getDescription()}
          </Text>

          <View style={styles.sliderWrapper}>
            <TouchableOpacity
              style={styles.sliderContainer}
              onPress={handleSliderPress}
              activeOpacity={1}
            >
              {/* Track Background - dotted line that gets taller */}
              <View style={styles.sliderTrackContainer}>
                {/* Create dotted effect with increasing height */}
                {[...Array(50)].map((_, i) => {
                  const progress = i / 49;
                  const height = 2 + (progress * 20); // Start at 2px, end at 22px - much taller!
                  return (
                    <View
                      key={i}
                      style={[
                        styles.sliderDot,
                        {
                          left: i * (SLIDER_WIDTH / 50),
                          width: 2,
                          height: height,
                          backgroundColor: '#4a5a6a',
                          borderRadius: 1,
                          opacity: 0.4 + (progress * 0.4),
                        }
                      ]}
                    />
                  );
                })}
              </View>

              {/* Active Track - orange dots that match the height */}
              <Animated.View
                style={[
                  styles.sliderActiveTrackContainer,
                  {
                    width: pan.interpolate({
                      inputRange: [0, SLIDER_WIDTH],
                      outputRange: [0, SLIDER_WIDTH],
                    })
                  }
                ]}
              >
                {[...Array(50)].map((_, i) => {
                  const progress = i / 49;
                  const height = 2 + (progress * 20);
                  return (
                    <View
                      key={i}
                      style={[
                        styles.sliderActiveDot,
                        {
                          left: i * (SLIDER_WIDTH / 50),
                          width: 2,
                          height: height,
                          backgroundColor: '#FF6B35',
                          borderRadius: 1,
                        }
                      ]}
                    />
                  );
                })}
              </Animated.View>

              {/* Slider Thumb */}
              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  styles.sliderThumb,
                  {
                    transform: [{ translateX: pan }]
                  }
                ]}
              >
                <View style={styles.sliderThumbInner} />
              </Animated.View>
            </TouchableOpacity>

            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabel}>{t('onboarding.notFitAtAll')}</Text>
              <Text style={styles.sliderLabel}>{t('onboarding.reallyFit')}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.button}
          onPress={handleNext}
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
    paddingTop: 30,
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
    marginBottom: 60,
    lineHeight: 24,
  },
  sliderSection: {
    flex: 1,
    justifyContent: 'center',
    marginTop: -40,
  },
  description: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 60,
    paddingHorizontal: 20,
    lineHeight: 28,
  },
  sliderWrapper: {
    paddingHorizontal: 30,
  },
  sliderContainer: {
    height: 40,
    justifyContent: 'center',
    marginBottom: 20,
  },
  sliderTrackContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderDot: {
    position: 'absolute',
  },
  sliderActiveTrackContainer: {
    position: 'absolute',
    left: 0,
    height: 25,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderActiveDot: {
    position: 'absolute',
  },
  sliderThumb: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    borderWidth: 3,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sliderThumbInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 14,
    color: '#8e9bab',
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
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingFitnessLevelScreen;