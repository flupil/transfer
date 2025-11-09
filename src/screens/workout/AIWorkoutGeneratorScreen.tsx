import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { aiService } from '../../services/aiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface WorkoutPreferences {
  goal: string;
  experience: string;
  daysPerWeek: number;
  equipment: string;
  duration: string;
  limitations?: string;
}

const AIWorkoutGeneratorScreen = () => {
  const navigation = useNavigation();
  const [generating, setGenerating] = useState(false);
  const [preferences, setPreferences] = useState<WorkoutPreferences>({
    goal: 'muscle_building',
    experience: 'intermediate',
    daysPerWeek: 4,
    equipment: 'gym',
    duration: '60',
  });

  const goals = [
    { id: 'muscle_building', name: 'Muscle Building', icon: 'barbell' },
    { id: 'fat_loss', name: 'Fat Loss', icon: 'flame' },
    { id: 'strength', name: 'Strength', icon: 'fitness' },
    { id: 'endurance', name: 'Endurance', icon: 'run' },
    { id: 'general_fitness', name: 'General Fitness', icon: 'heart' },
  ];

  const experienceLevels = [
    { id: 'beginner', name: 'Beginner' },
    { id: 'intermediate', name: 'Intermediate' },
    { id: 'advanced', name: 'Advanced' },
  ];

  const equipmentOptions = [
    { id: 'gym', name: 'Full Gym', icon: 'barbell-outline' },
    { id: 'dumbbells', name: 'Dumbbells Only', icon: 'fitness-outline' },
    { id: 'minimal', name: 'Minimal Equipment', icon: 'home-outline' },
    { id: 'none', name: 'Bodyweight', icon: 'body-outline' },
  ];

  const handleGenerateWorkout = async () => {
    setGenerating(true);
    try {
      const workoutPlan = await aiService.generateWorkoutPlan(preferences);

      // Save the AI-generated plan
      const planId = `ai_${Date.now()}`;
      await AsyncStorage.setItem(
        `@ai_workout_plan_${planId}`,
        JSON.stringify({ ...workoutPlan, id: planId })
      );

      // Set as selected plan
      await AsyncStorage.setItem('@selected_workout_plan', planId);

      Alert.alert(
        'Workout Plan Generated!',
        `Your personalized ${preferences.daysPerWeek}-day ${workoutPlan.name} has been created and selected.`,
        [
          {
            text: 'View Plan',
            onPress: () => navigation.navigate('WorkoutPlans' as never),
          },
          { text: 'OK', onPress: () => navigation.goBack() },
        ]
      );
    } catch (error: any) {
      console.error('Error generating workout:', error);

      if (error.message.includes('API key')) {
        Alert.alert(
          'API Key Required',
          'Please set your Anthropic API key in Settings > AI Features to use AI workout generation.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Go to Settings',
              onPress: () => navigation.navigate('Settings' as never),
            },
          ]
        );
      } else {
        Alert.alert('Generation Failed', 'Could not generate workout plan. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const renderOptionButton = (
    label: string,
    value: string,
    isSelected: boolean,
    onPress: () => void,
    icon?: keyof typeof Ionicons.glyphMap
  ) => (
    <TouchableOpacity
      style={[styles.optionButton, isSelected && styles.optionButtonSelected]}
      onPress={onPress}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color={isSelected ? '#4ECDC4' : '#8A9BA8'}
        />
      )}
      <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#202124" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Workout Generator</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="sparkles" size={32} color="#4ECDC4" />
          <Text style={styles.infoText}>
            AI will create a personalized workout plan based on your goals and preferences
          </Text>
        </View>

        {/* Goal Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's your primary goal?</Text>
          <View style={styles.optionsGrid}>
            {goals.map((goal) => (
              <TouchableOpacity
                key={goal.id}
                style={[
                  styles.goalCard,
                  preferences.goal === goal.id && styles.goalCardSelected,
                ]}
                onPress={() => setPreferences({ ...preferences, goal: goal.id })}
              >
                <Ionicons
                  name={goal.icon as any}
                  size={28}
                  color={preferences.goal === goal.id ? '#4ECDC4' : '#8A9BA8'}
                />
                <Text
                  style={[
                    styles.goalText,
                    preferences.goal === goal.id && styles.goalTextSelected,
                  ]}
                >
                  {goal.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Experience Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience Level</Text>
          <View style={styles.optionsRow}>
            {experienceLevels.map((level) =>
              renderOptionButton(
                level.name,
                level.id,
                preferences.experience === level.id,
                () => setPreferences({ ...preferences, experience: level.id })
              )
            )}
          </View>
        </View>

        {/* Days Per Week */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Days Per Week</Text>
          <View style={styles.optionsRow}>
            {[3, 4, 5, 6].map((days) =>
              renderOptionButton(
                `${days} Days`,
                days.toString(),
                preferences.daysPerWeek === days,
                () => setPreferences({ ...preferences, daysPerWeek: days })
              )
            )}
          </View>
        </View>

        {/* Equipment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Equipment</Text>
          <View style={styles.optionsGrid}>
            {equipmentOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.equipmentCard,
                  preferences.equipment === option.id && styles.equipmentCardSelected,
                ]}
                onPress={() =>
                  setPreferences({ ...preferences, equipment: option.id })
                }
              >
                <Ionicons
                  name={option.icon as any}
                  size={24}
                  color={preferences.equipment === option.id ? '#4ECDC4' : '#8A9BA8'}
                />
                <Text
                  style={[
                    styles.equipmentText,
                    preferences.equipment === option.id && styles.equipmentTextSelected,
                  ]}
                >
                  {option.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Session Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Duration</Text>
          <View style={styles.optionsRow}>
            {['30', '45', '60', '75', '90'].map((duration) =>
              renderOptionButton(
                `${duration} min`,
                duration,
                preferences.duration === duration,
                () => setPreferences({ ...preferences, duration })
              )
            )}
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateButton, generating && styles.generateButtonDisabled]}
          onPress={handleGenerateWorkout}
          disabled={generating}
        >
          {generating ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={styles.generateButtonText}>Generating...</Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={24} color="#fff" />
              <Text style={styles.generateButtonText}>Generate My Workout Plan</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#202124',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C3A47',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#8A9BA8',
    lineHeight: 20,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  goalCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  goalCardSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  goalText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8A9BA8',
    textAlign: 'center',
  },
  goalTextSelected: {
    color: '#4ECDC4',
    fontWeight: '600',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2C2C2E',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8A9BA8',
  },
  optionTextSelected: {
    color: '#4ECDC4',
    fontWeight: '600',
  },
  equipmentCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#2C2C2E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  equipmentCardSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  equipmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A9BA8',
    textAlign: 'center',
  },
  equipmentTextSelected: {
    color: '#4ECDC4',
    fontWeight: '600',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ECDC4',
    marginHorizontal: 16,
    marginTop: 32,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AIWorkoutGeneratorScreen;
