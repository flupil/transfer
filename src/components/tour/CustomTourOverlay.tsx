import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import Svg, { Rect, Defs, Mask } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export interface TourStep {
  id: string;
  title: string;
  description: string;
  targetRef?: React.RefObject<View>;
  scrollToY?: number;
  highlightArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius?: number;
  };
}

interface CustomTourOverlayProps {
  visible: boolean;
  steps: TourStep[];
  currentStep: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onComplete: () => void;
  scrollViewRef?: React.RefObject<ScrollView> | null;
}

export const CustomTourOverlay: React.FC<CustomTourOverlayProps> = ({
  visible,
  steps,
  currentStep,
  onNext,
  onPrevious,
  onSkip,
  onComplete,
  scrollViewRef,
}) => {
  const { t } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    if (visible) {
      // Fade in animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-scroll to the target if needed
      if (currentStepData?.scrollToY !== undefined && scrollViewRef?.current) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({
            y: currentStepData.scrollToY,
            animated: true,
          });
        }, 100);
      }
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible, currentStep, currentStepData]);

  if (!visible || !currentStepData) return null;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      onNext();
    }
  };

  // Get highlight area for current step
  const getHighlightArea = () => {
    if (currentStepData.highlightArea) {
      return currentStepData.highlightArea;
    }

    // Default highlight areas based on step
    const defaultAreas = {
      0: { x: 20, y: 100, width: width - 40, height: 60, borderRadius: 12 }, // Plan selection
      1: { x: 20, y: 200, width: width - 40, height: 80, borderRadius: 12 }, // Week selector
      2: { x: 40, y: 400, width: width - 80, height: 300, borderRadius: 150 }, // Honeycomb
      3: { x: 20, y: 900, width: width - 40, height: 100, borderRadius: 16 }, // Quick actions
      4: { x: 20, y: 1100, width: width - 40, height: 150, borderRadius: 16 }, // Challenge
    };

    return defaultAreas[currentStep] || { x: 0, y: 0, width: width, height: 200, borderRadius: 0 };
  };

  const highlightArea = getHighlightArea();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onSkip}
    >
      {/* Dark overlay with hole/spotlight */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 1],
            }),
          },
        ]}
      >
        <Svg height={height} width={width}>
          <Defs>
            <Mask id="mask" x="0" y="0" height={height} width={width}>
              {/* White background (visible area) */}
              <Rect height={height} width={width} fill="#fff" />
              {/* Black rectangle (transparent area - the spotlight) */}
              <Rect
                x={highlightArea.x}
                y={highlightArea.y}
                width={highlightArea.width}
                height={highlightArea.height}
                rx={highlightArea.borderRadius || 0}
                fill="#000"
              />
            </Mask>
          </Defs>
          {/* Dark overlay with mask creating the spotlight effect */}
          <Rect
            height={height}
            width={width}
            fill="rgba(0, 0, 0, 0.70)"
            mask="url(#mask)"
          />
        </Svg>

        {/* Bright border around highlighted area */}
        <View
          style={{
            position: 'absolute',
            left: highlightArea.x - 4,
            top: highlightArea.y - 4,
            width: highlightArea.width + 8,
            height: highlightArea.height + 8,
            borderWidth: 4,
            borderColor: '#FF6B35',
            borderRadius: (highlightArea.borderRadius || 0) + 4,
            shadowColor: '#FF6B35',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 10,
          }}
        />
      </Animated.View>

      {/* Tooltip */}
      <Animated.View
        style={[
          currentStep >= steps.length - 2 ? styles.tooltipContainerTop : styles.tooltipContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.tooltip}>
          {/* Header */}
          <View style={styles.tooltipHeader}>
            <View style={styles.stepIndicator}>
              <Text style={styles.stepText}>
                {currentStep + 1} / {steps.length}
              </Text>
            </View>
            <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
              <MaterialCommunityIcons name="close" size={24} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.tooltipContent}>
            <Text style={styles.tooltipTitle}>{currentStepData.title}</Text>
            <Text style={styles.tooltipDescription}>
              {currentStepData.description}
            </Text>
          </View>

          {/* Navigation */}
          <View style={styles.tooltipFooter}>
            {!isFirstStep && (
              <TouchableOpacity
                onPress={onPrevious}
                style={styles.navButton}
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={24}
                  color="#FF6B35"
                />
                <Text style={styles.navButtonText}>{t('tour.previous')}</Text>
              </TouchableOpacity>
            )}

            <View style={{ flex: 1 }} />

            <TouchableOpacity
              onPress={handleNext}
              style={[styles.navButton, styles.nextButton]}
            >
              <Text style={styles.nextButtonText}>
                {isLastStep ? t('tour.finish') : t('tour.next')}
              </Text>
              {!isLastStep && (
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color="white"
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  tooltipContainer: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
  },
  tooltipContainerTop: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
  },
  tooltip: {
    backgroundColor: '#2C2C2E',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepIndicator: {
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  stepText: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '600',
  },
  skipButton: {
    padding: 4,
  },
  tooltipContent: {
    marginBottom: 20,
  },
  tooltipTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  tooltipDescription: {
    fontSize: 15,
    color: '#D1D5DB',
    lineHeight: 22,
  },
  tooltipFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
  },
  nextButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
