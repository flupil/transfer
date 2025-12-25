import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../../contexts/ThemeContext';
import type { FootballProgram, FootballWorkout } from '../../data/footballWorkouts';

const { width } = Dimensions.get('window');

const FootballProgramWorkoutsScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { colors } = useTheme();
  const program = (route.params as any)?.program as FootballProgram;

  // Generate styles with theme colors
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  if (!program) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={styles.errorText}>Program not found</Text>
      </View>
    );
  }

  const navigateToWorkoutDetail = (workout: FootballWorkout) => {
    (navigation as any).navigate('FootballWorkoutDetail', { workout });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return colors.success;
      case 'intermediate': return colors.warning;
      case 'advanced': return colors.secondaryAction;
      default: return colors.textSecondary;
    }
  };

  const workoutsByDifficulty = {
    beginner: program.workouts.filter(w => w.difficulty === 'beginner'),
    intermediate: program.workouts.filter(w => w.difficulty === 'intermediate'),
    advanced: program.workouts.filter(w => w.difficulty === 'advanced'),
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <Text style={styles.headerTitleText} numberOfLines={1}>{program.name}</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Program Info */}
        <View style={styles.programInfo}>
          <View style={[styles.programIconLarge, { backgroundColor: `${program.color}20` }]}>
            <MaterialCommunityIcons
              name={program.icon as any}
              size={48}
              color={program.color}
            />
          </View>

          <Text style={styles.programName}>{program.name}</Text>
          <Text style={styles.programNameHe}>{program.nameHe}</Text>
          <Text style={styles.programDescription}>{program.description}</Text>
          <Text style={styles.programDescriptionHe}>{program.descriptionHe}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="dumbbell" size={20} color={program.color} />
              <Text style={styles.statText}>{program.workouts.length} workouts</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="clock-outline" size={20} color={program.color} />
              <Text style={styles.statText}>
                {program.workouts.reduce((sum, w) => sum + w.duration, 0)} min total
              </Text>
            </View>
          </View>
        </View>

        {/* Workouts by Difficulty */}
        {Object.entries(workoutsByDifficulty).map(([difficulty, workouts]) => {
          if (workouts.length === 0) return null;

          return (
            <View key={difficulty} style={styles.difficultySection}>
              <View style={styles.difficultySectionHeader}>
                <View style={[styles.difficultyBadge, {
                  backgroundColor: `${getDifficultyColor(difficulty)}20`
                }]}>
                  <Text style={[styles.difficultyBadgeText, {
                    color: getDifficultyColor(difficulty)
                  }]}>
                    {difficulty.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.difficultySectionCount}>
                  {workouts.length} workout{workouts.length !== 1 ? 's' : ''}
                </Text>
              </View>

              {workouts.map((workout, index) => (
                <TouchableOpacity
                  key={workout.id}
                  style={styles.workoutCard}
                  onPress={() => navigateToWorkoutDetail(workout)}
                  activeOpacity={0.8}
                >
                  <View style={styles.workoutNumber}>
                    <Text style={styles.workoutNumberText}>{index + 1}</Text>
                  </View>

                  <View style={styles.workoutInfo}>
                    <Text style={styles.workoutName}>{workout.name}</Text>
                    <Text style={styles.workoutNameHe}>{workout.nameHe}</Text>

                    <View style={styles.workoutMeta}>
                      <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="clock-outline" size={14} color="#8B9AA5" />
                        <Text style={styles.metaText}>{workout.duration} min</Text>
                      </View>
                      <View style={styles.metaItem}>
                        <MaterialCommunityIcons name="dumbbell" size={14} color="#8B9AA5" />
                        <Text style={styles.metaText}>{workout.exercises.length} exercises</Text>
                      </View>
                    </View>
                  </View>

                  <MaterialCommunityIcons name="chevron-right" size={24} color="#8B9AA5" />
                </TouchableOpacity>
              ))}
            </View>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.cardBackground}CC`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  programInfo: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: colors.cardBackground,
  },
  programIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  programName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  programNameHe: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
  programDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 4,
  },
  programDescriptionHe: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  difficultySection: {
    marginBottom: 24,
  },
  difficultySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  difficultyBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  difficultySectionCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  workoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: colors.cardBackground,
  },
  workoutNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.text}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  workoutNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  workoutInfo: {
    flex: 1,
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  workoutNameHe: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginTop: 100,
  },
});

export default FootballProgramWorkoutsScreen;
