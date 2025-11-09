import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';

interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  duration: string;
  frequency: string;
  difficulty: string;
  focus: string[];
  color: string;
  icon: string;
}

export const SimpleWorkoutPlansScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const onSelectPlan = (route.params as any)?.onSelectPlan;

  const PRESET_WORKOUT_PLANS: WorkoutPlan[] = [
    {
      id: 'preset_beginner',
      name: t('simpleWorkout.foundationTraining'),
      description: t('simpleWorkout.foundationDesc'),
      duration: '4 weeks',
      frequency: '3x/week',
      difficulty: t('simpleWorkout.easy'),
      focus: [t('simpleWorkout.fullBody'), t('simpleWorkout.foundation')],
      color: '#4ECDC4',
      icon: 'walk',
    },
    {
      id: 'preset_strength',
      name: t('simpleWorkout.strengthBuilder'),
      description: t('simpleWorkout.strengthDesc'),
      duration: '8 weeks',
      frequency: '4x/week',
      difficulty: t('simpleWorkout.medium'),
      focus: [t('simpleWorkout.strength'), t('simpleWorkout.muscle')],
      color: '#6C5CE7',
      icon: 'dumbbell',
    },
    {
      id: 'preset_hiit',
      name: t('simpleWorkout.hiitCardio'),
      description: t('simpleWorkout.hiitDesc'),
      duration: '6 weeks',
      frequency: '5x/week',
      difficulty: t('simpleWorkout.hard'),
      focus: [t('simpleWorkout.cardio'), t('simpleWorkout.fatLoss')],
      color: '#FF6B6B',
      icon: 'fire',
    },
    {
      id: 'preset_ppl',
      name: t('simpleWorkout.pushPullLegs'),
      description: t('simpleWorkout.pplDesc'),
      duration: '12 weeks',
      frequency: '6x/week',
      difficulty: t('simpleWorkout.advanced'),
      focus: [t('simpleWorkout.hypertrophy'), t('simpleWorkout.split')],
      color: '#00B894',
      icon: 'arm-flex',
    },
    {
      id: 'preset_athletic',
      name: t('simpleWorkout.athleticPerf'),
      description: t('simpleWorkout.athleticDesc'),
      duration: '8 weeks',
      frequency: '4x/week',
      difficulty: t('simpleWorkout.medium'),
      focus: [t('simpleWorkout.sports'), t('simpleWorkout.agility')],
      color: '#FDCB6E',
      icon: 'run-fast',
    },
    {
      id: 'preset_home',
      name: t('simpleWorkout.homeWorkout'),
      description: t('simpleWorkout.homeDesc'),
      duration: '6 weeks',
      frequency: '4x/week',
      difficulty: t('simpleWorkout.medium'),
      focus: [t('simpleWorkout.bodyweight'), t('simpleWorkout.home')],
      color: '#FD79A8',
      icon: 'home',
    },
    {
      id: 'preset_crossfit',
      name: t('simpleWorkout.crossfitStyle'),
      description: t('simpleWorkout.crossfitDesc'),
      duration: '8 weeks',
      frequency: '5x/week',
      difficulty: t('simpleWorkout.hard'),
      focus: [t('simpleWorkout.functional'), t('simpleWorkout.wod')],
      color: '#A29BFE',
      icon: 'weight-lifter',
    },
    {
      id: 'preset_yoga',
      name: t('simpleWorkout.yogaFlex'),
      description: t('simpleWorkout.yogaDesc'),
      duration: '4 weeks',
      frequency: '6x/week',
      difficulty: t('simpleWorkout.easy'),
      focus: [t('simpleWorkout.flexibility'), t('simpleWorkout.balance')],
      color: '#55A3FF',
      icon: 'yoga',
    },
  ];

  const handleSelectPlan = (plan: WorkoutPlan) => {
    setSelectedPlan(plan.id);

    // Update the parent screen with the selected plan name
    if (onSelectPlan) {
      onSelectPlan(plan.name);
    }

    Alert.alert(
      t('simpleWorkout.planSelected'),
      `${t('simpleWorkout.youveSelected')} ${plan.name} ${t('simpleWorkout.plan')}\n\n• ${t('workoutPlans.duration')}: ${plan.duration}\n• ${t('workoutPlans.frequency')}: ${plan.frequency}\n• ${t('workoutPlans.level')}: ${plan.difficulty}\n• Focus: ${plan.focus.join(', ')}`,
      [{
        text: t('simpleWorkout.ok'),
        onPress: () => navigation.goBack()
      }]
    );
  };

  const getDifficultyColor = (difficulty: string) => {
    const easyText = t('simpleWorkout.easy');
    const mediumText = t('simpleWorkout.medium');
    const hardText = t('simpleWorkout.hard');
    const advancedText = t('simpleWorkout.advanced');

    if (difficulty === easyText) return '#4ECDC4';
    if (difficulty === mediumText) return '#FDCB6E';
    if (difficulty === hardText) return '#FF6B6B';
    if (difficulty === advancedText) return '#6C5CE7';
    return '#999';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>{t('simpleWorkout.chooseYourPlan')}</Text>
      <Text style={styles.subheader}>{t('simpleWorkout.selectMatches')}</Text>

      <View style={styles.plansContainer}>
        {PRESET_WORKOUT_PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              { borderColor: plan.color },
              selectedPlan === plan.id && { backgroundColor: `${plan.color}15` }
            ]}
            onPress={() => handleSelectPlan(plan)}
            activeOpacity={0.8}
          >
            <View style={[styles.iconContainer, { backgroundColor: plan.color }]}>
              <MaterialCommunityIcons
                name={plan.icon as any}
                size={32}
                color="white"
              />
            </View>

            <View style={styles.planContent}>
              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planDescription}>{plan.description}</Text>

              <View style={styles.tagsContainer}>
                {plan.focus.map((tag, index) => (
                  <View
                    key={index}
                    style={[styles.tag, { backgroundColor: `${plan.color}20` }]}
                  >
                    <Text style={[styles.tagText, { color: plan.color }]}>
                      {tag}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.detailsContainer}>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="calendar" size={14} color="#999" />
                  <Text style={styles.detailText}>{plan.duration}</Text>
                </View>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="repeat" size={14} color="#999" />
                  <Text style={styles.detailText}>{plan.frequency}</Text>
                </View>
                <View style={styles.detailItem}>
                  <MaterialCommunityIcons name="speedometer" size={14} color="#999" />
                  <Text style={[styles.detailText, { color: getDifficultyColor(plan.difficulty), fontWeight: '600' }]}>
                    {plan.difficulty}
                  </Text>
                </View>
              </View>

              {selectedPlan === plan.id && (
                <View style={[styles.selectedBadge, { backgroundColor: plan.color }]}>
                  <MaterialCommunityIcons name="check" size={16} color="white" />
                  <Text style={styles.selectedText}>Selected</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginTop: 20,
    marginHorizontal: 20,
  },
  subheader: {
    fontSize: 16,
    color: '#7A7A7A',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  plansContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  planContent: {
    flex: 1,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    color: '#7A7A7A',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  selectedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default SimpleWorkoutPlansScreen;