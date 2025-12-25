import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTour } from '../../contexts/TourContext';
import { CustomTourOverlay, TourStep } from '../../components/tour/CustomTourOverlay';
import professionalPlans from '../../data/professionalWorkoutPlans.json';
import { selectWorkoutPlan, getSelectedWorkoutPlan } from '../../services/workoutPlanService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WorkoutPlan {
  id: number;
  name: string;
  goal: string;
  experience: string;
  duration: string;
  daysPerWeek: number;
  equipment: string;
  description: string;
}

type FilterType = 'all' | 'beginner' | 'intermediate' | 'advanced' | 'home';
const FILTER_OPTIONS: FilterType[] = ['all', 'beginner', 'intermediate', 'advanced', 'home'];

const WorkoutPlanSelectionScreen = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const { isFirstVisit, markTourComplete } = useTour();
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadSelectedPlan();
  }, []);

  useEffect(() => {
    if (!loading) {
      checkAndStartTour();
    }
  }, [loading]);

  // Initialize tour - DISABLED
  const checkAndStartTour = async () => {
    return; // Tours disabled
  };

  // Tour steps
  const tourSteps: TourStep[] = [
    {
      id: 'filters',
      title: t('tour.planSelection.step1Title'),
      description: t('tour.planSelection.step1Desc'),
      scrollToY: 100,
    },
    {
      id: 'ai-generator',
      title: t('tour.planSelection.step2Title'),
      description: t('tour.planSelection.step2Desc'),
      scrollToY: 50,
    },
    {
      id: 'plan-cards',
      title: t('tour.planSelection.step3Title'),
      description: t('tour.planSelection.step3Desc'),
      scrollToY: 300,
    },
  ];

  const handleTourNext = () => {
    setTourStep(prev => prev + 1);
  };

  const handleTourPrevious = () => {
    setTourStep(prev => Math.max(0, prev - 1));
  };

  const handleTourSkip = () => {
    setShowTour(false);
    setTourStep(0);
  };

  const handleTourComplete = async () => {
    await markTourComplete('WorkoutPlanSelection');
    setShowTour(false);
    setTourStep(0);
  };

  const loadSelectedPlan = async () => {
    try {
      const selected = await getSelectedWorkoutPlan();
      setSelectedPlanId(selected?.id || null);
    } catch (error) {
      console.error('Failed to load selected plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (plan: WorkoutPlan) => {
    // Prevent multiple selections at once
    if (isSelecting) return;

    // Check if switching from a different plan
    if (selectedPlanId && selectedPlanId !== plan.id) {
      // Check if user has progress on current plan
      const hasProgress = await checkHasProgress(selectedPlanId);

      if (hasProgress) {
        // Find current plan name - try both number and string comparison
        const currentPlan = professionalPlans.find((p: any) =>
          p.id === selectedPlanId || p.id === String(selectedPlanId) || String(p.id) === String(selectedPlanId)
        );

        console.log('🔍 Looking for plan ID:', selectedPlanId);
        console.log('📋 Found plan:', currentPlan);
        console.log('📝 Plan name:', currentPlan?.name);

        const currentPlanName = currentPlan?.name || 'your current plan';

        // Show confirmation dialog
        Alert.alert(
          'Switch Workout Plan?',
          `You have progress on "${currentPlanName}".\n\nSwitching to "${plan.name}" will start fresh.\n\nContinue?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Switch Plan',
              style: 'destructive',
              onPress: () => performPlanSwitch(plan),
            },
          ]
        );
        return;
      }
    }

    // No progress or same plan, switch directly
    await performPlanSwitch(plan);
  };

  const checkHasProgress = async (planId: number): Promise<boolean> => {
    try {
      const completedWorkoutsData = await AsyncStorage.getItem('completedWorkouts');

      if (!completedWorkoutsData) {
        return false;
      }

      const completedWorkouts = JSON.parse(completedWorkoutsData);

      // completedWorkouts is an array like ["1-1-0", "1-1-1"]
      // Format is: planId-week-dayIndex
      if (!Array.isArray(completedWorkouts)) {
        return false;
      }

      // Check if any workouts are completed for this plan
      const planWorkouts = completedWorkouts.filter((key: string) =>
        key.startsWith(`${planId}-`)
      );

      return planWorkouts.length > 0;
    } catch (error) {
      console.error('Failed to check progress:', error);
      return false;
    }
  };

  const performPlanSwitch = async (plan: WorkoutPlan) => {
    setIsSelecting(true);
    try {
      await selectWorkoutPlan(plan.id.toString());
      setSelectedPlanId(plan.id);

      // Show success feedback
      Alert.alert(
        'Success',
        `"${plan.name}" is now your active workout plan!`,
        [
          {
            text: 'OK',
            onPress: () => (navigation as any).goBack(),
          }
        ]
      );
    } catch (error) {
      console.error('Failed to select plan:', error);
      Alert.alert(
        t('error.title') || 'Error',
        t('error.failedToSelectPlan') || 'Failed to select workout plan. Please try again.'
      );
    } finally {
      setIsSelecting(false);
    }
  };

  const getGoalIcon = (goal: string) => {
    switch (goal) {
      case 'muscle_building': return 'arm-flex';
      case 'fat_loss': return 'fire';
      case 'strength': return 'weight-lifter';
      case 'tone': return 'heart-pulse';
      case 'general_fitness': return 'run';
      case 'endurance': return 'run-fast';
      case 'flexibility': return 'yoga';
      case 'sport_performance': return 'medal';
      default: return 'dumbbell';
    }
  };

  const getGoalColor = (goal: string) => {
    switch (goal) {
      case 'muscle_building': return '#3B82F6';
      case 'fat_loss': return '#FF6B35';
      case 'strength': return '#E94E1B';
      case 'tone': return '#EC4899';
      case 'general_fitness': return '#10B981';
      case 'endurance': return '#F59E0B';
      case 'flexibility': return '#06B6D4';
      case 'sport_performance': return '#F97316';
      default: return '#6B7280';
    }
  };

  const getExperienceBadge = (experience: string) => {
    const badges = {
      beginner: { label: t('workoutPlans.beginner'), color: '#10B981' },
      intermediate: { label: t('workoutPlans.intermediate'), color: '#F59E0B' },
      advanced: { label: t('workoutPlans.advanced'), color: '#E94E1B' }
    };
    return badges[experience as keyof typeof badges] || badges.beginner;
  };

  const filteredPlans = professionalPlans.filter((plan: any) => {
    if (filter === 'all') return true;
    if (filter === 'beginner') return plan.experience === 'beginner';
    if (filter === 'intermediate') return plan.experience === 'intermediate';
    if (filter === 'advanced') return plan.experience === 'advanced';
    if (filter === 'home') return plan.equipment !== 'gym';
    return true;
  });

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primaryAction} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={28} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{t('workoutPlans.chooseProgram')}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              {filteredPlans.length} {t('workoutPlans.professionalPrograms')}
            </Text>
          </View>
        </View>

        {/* AI Generator Button */}
        <TouchableOpacity
          style={styles.aiGeneratorButton}
          onPress={() => (navigation as any).navigate('AIWorkoutGenerator')}
        >
          <MaterialCommunityIcons name="sparkles" size={24} color="#E94E1B" />
          <View style={styles.aiGeneratorTextContainer}>
            <Text style={styles.aiGeneratorTitle}>{t('workoutPlans.aiGenerator')}</Text>
            <Text style={styles.aiGeneratorSubtitle}>{t('workoutPlans.aiGeneratorSubtitle')}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color="#E94E1B" />
        </TouchableOpacity>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {FILTER_OPTIONS.map((f) => {
          const filterLabel = f === 'all' ? t('workoutPlans.all') :
                             f === 'home' ? t('workoutPlans.home') :
                             t(`workoutPlans.${f}`);
          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === f ? colors.primaryAction : colors.cardBackground,
                }
              ]}
            >
              <Text style={[
                styles.filterText,
                { color: filter === f ? '#FFF' : colors.textSecondary }
              ]}>
                {filterLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
        </ScrollView>

        {/* Plans List */}
        <View style={styles.plansContainer}>
          {filteredPlans.map((plan: any, index: number) => {
            const goalColor = getGoalColor(plan.goal);
            const badge = getExperienceBadge(plan.experience);
            const isSelected = selectedPlanId === plan.id;

            return (
              <TouchableOpacity
                key={plan.id}
                onPress={() => handleSelectPlan(plan)}
                activeOpacity={0.7}
                disabled={isSelecting}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderWidth: isSelected ? 2 : 0,
                    borderColor: isSelected ? colors.primaryAction : 'transparent',
                    opacity: isSelecting ? 0.5 : 1,
                  }
                ]}
              >
                <View style={styles.cardContent}>
                  {/* Icon */}
                  <View style={[styles.iconContainer, { backgroundColor: goalColor + '15' }]}>
                    <MaterialCommunityIcons
                      name={getGoalIcon(plan.goal)}
                      size={24}
                      color={goalColor}
                    />
                  </View>

                  {/* Content */}
                  <View style={styles.textContent}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.planName, { color: colors.text }]} numberOfLines={1}>
                        {plan.name}
                      </Text>
                      {isSelected && (
                        <MaterialCommunityIcons name="check-circle" size={18} color={colors.primaryAction} />
                      )}
                    </View>

                    <Text style={[styles.planDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                      {plan.description}
                    </Text>

                    {/* Info Pills */}
                    <View style={styles.pillsRow}>
                      <View style={[styles.pill, { backgroundColor: badge.color + '15' }]}>
                        <Text style={[styles.pillText, { color: badge.color }]}>
                          {badge.label}
                        </Text>
                      </View>

                      <View style={[styles.pill, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
                        <MaterialCommunityIcons name="calendar" size={11} color={colors.textSecondary} />
                        <Text style={[styles.pillText, { color: colors.textSecondary }]}>
                          {plan.daysPerWeek}x/week
                        </Text>
                      </View>

                      <View style={[styles.pill, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
                        <MaterialCommunityIcons name="clock-outline" size={11} color={colors.textSecondary} />
                        <Text style={[styles.pillText, { color: colors.textSecondary }]}>
                          {plan.duration}
                        </Text>
                      </View>
                    </View>

                    {/* Equipment */}
                    <View style={styles.equipmentRow}>
                      <MaterialCommunityIcons
                        name={plan.equipment === 'gym' ? 'dumbbell' : plan.equipment === 'dumbbells' ? 'weight' : plan.equipment === 'minimal' ? 'home-outline' : 'home'}
                        size={11}
                        color={colors.textSecondary}
                      />
                      <Text style={[styles.equipmentText, { color: colors.textSecondary }]}>
                        {t(`equipment.${plan.equipment}`) || plan.equipment}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Loading Overlay */}
      {isSelecting && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingContent, { backgroundColor: colors.cardBackground }]}>
            <ActivityIndicator size="large" color={colors.primaryAction} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Selecting plan...
            </Text>
          </View>
        </View>
      )}

      {/* Custom Tour Overlay */}
      <CustomTourOverlay
        visible={showTour}
        steps={tourSteps}
        currentStep={tourStep}
        onNext={handleTourNext}
        onPrevious={handleTourPrevious}
        onSkip={handleTourSkip}
        onComplete={handleTourComplete}
        scrollViewRef={scrollViewRef}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
  },
  aiGeneratorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  aiGeneratorTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  aiGeneratorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  aiGeneratorSubtitle: {
    fontSize: 12,
    color: '#8A9BA8',
  },
  filterContainer: {
    maxHeight: 50,
    marginBottom: 16,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    marginRight: 8,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
  },
  plansContainer: {
    paddingHorizontal: 20,
  },
  planCard: {
    borderRadius: 20,
    padding: 14,
    marginBottom: 10,
  },
  cardContent: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  planName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  planDescription: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  equipmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  equipmentText: {
    fontSize: 10,
    fontWeight: '500',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContent: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WorkoutPlanSelectionScreen;
