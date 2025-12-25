import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface SetData {
  weight: string;
  reps: string;
  completed: boolean;
}

interface WorkoutExerciseCardProps {
  exercise: any;
  index: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onCompleteSet: (setIndex: number) => void;
  onUpdateSet: (setIndex: number, field: 'weight' | 'reps', value: string) => void;
  onShowVideo: () => void;
  onCompleteExercise: (exerciseId: string, completed: boolean) => void;
  setData: SetData[];
  muscleIcon?: string;
  exerciseGifUrl?: string;
}

const WorkoutExerciseCard: React.FC<WorkoutExerciseCardProps> = ({
  exercise,
  index,
  expanded,
  onToggleExpand,
  onCompleteSet,
  onUpdateSet,
  onShowVideo,
  onCompleteExercise,
  setData = [],
  muscleIcon = 'dumbbell',
  exerciseGifUrl,
}) => {
  const { colors, isDark } = useTheme();
  const [exerciseCompleted, setExerciseCompleted] = useState(false);

  // Ensure setData is an array
  const validSetData = Array.isArray(setData) && setData.length > 0 ? setData :
    Array(parseInt(exercise?.sets) || 3).fill(null).map(() => ({
      weight: exercise?.weight?.replace(/[^0-9]/g, '') || '',
      reps: exercise?.reps || '12',
      completed: false
    }));

  const completedSets = validSetData.filter(s => s?.completed).length;
  const totalSets = validSetData.length;

  // Get exercise image - use GIF if available, fallback to icon
  const getExerciseImage = () => {
    if (exerciseGifUrl) {
      return (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: exerciseGifUrl }}
            style={styles.exerciseImage}
            resizeMode="cover"
          />
        </View>
      );
    }

    // Fallback to icon
    return (
      <View style={styles.imageContainer}>
        <MaterialCommunityIcons name={muscleIcon as any} size={36} color={colors.textSecondary} />
      </View>
    );
  };

  const styles = StyleSheet.create({
    card: {
      backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
      borderRadius: 20,
      marginHorizontal: 16,
      marginVertical: 8,
      padding: 16,
      borderWidth: isDark ? 1 : 0,
      borderColor: isDark ? '#2A2A2A' : 'transparent',
    },
    collapsedView: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    imageContainer: {
      width: 60,
      height: 60,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F5F5F5',
    },
    exerciseImage: {
      width: 60,
      height: 60,
      borderRadius: 16,
    },
    exerciseDetails: {
      flex: 1,
    },
    exerciseName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    targetMuscle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 6,
    },
    arrowSection: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    exerciseCheckbox: {
      padding: 4,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
      flexWrap: 'wrap',
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    expandButton: {
      padding: 8,
    },
    expandedView: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E8E8E8',
    },
    exerciseInfoSection: {
      flexDirection: 'row',
      marginBottom: 16,
      gap: 12,
    },
    largeImageContainer: {
      width: 120,
      height: 120,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F5F5F5',
    },
    largeExerciseImage: {
      width: 120,
      height: 120,
      borderRadius: 16,
    },
    exerciseDescription: {
      flex: 1,
    },
    exerciseTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    exerciseInfo: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    exerciseInstructions: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
      marginTop: 8,
    },
    separator: {
      height: 1,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E8E8E8',
      marginHorizontal: -12,
      marginBottom: 8,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
    },
    actionButtonText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    setsTable: {
      marginBottom: 8,
    },
    tableHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E8E8E8',
      marginBottom: 4,
    },
    headerText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      textAlign: 'center',
    },
    setRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
      gap: 8,
    },
    setNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    setCol: {
      width: 30,
    },
    inputCol: {
      flex: 1,
    },
    checkCol: {
      width: 30,
      alignItems: 'center',
    },
    input: {
      height: 36,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#E0E0E0',
      borderRadius: 12,
      paddingHorizontal: 8,
      fontSize: 14,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
      color: colors.text,
      textAlign: 'center',
    },
    inputCompleted: {
      backgroundColor: isDark ? 'rgba(76, 175, 80, 0.2)' : '#F0F8FF',
      borderColor: '#E94E1B',
      color: '#E94E1B',
    },
    checkButton: {
      alignItems: 'center',
    },
    addSetButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      marginTop: 8,
      backgroundColor: isDark ? 'rgba(255, 107, 53, 0.2)' : '#FFF5F0',
      borderRadius: 12,
      gap: 4,
    },
    addSetText: {
      color: '#FF6B35',
      fontSize: 14,
      fontWeight: '500',
    },
  });

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.collapsedView}
        onPress={onShowVideo}
        activeOpacity={0.7}
      >
        {getExerciseImage()}

        <View style={styles.exerciseDetails}>
          <Text style={styles.exerciseName}>{exercise?.name || 'Exercise'}</Text>
          <Text style={styles.targetMuscle}>
            {exercise?.muscleGroup || 'Target Muscle'}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="repeat" size={16} color="#FF6B35" />
              <Text style={styles.statText}>{completedSets}/{totalSets}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="dumbbell" size={16} color="#FF6B35" />
              <Text style={styles.statText}>{exercise?.reps || 12} reps</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="timer" size={16} color="#FF6B35" />
              <Text style={styles.statText}>{exercise?.rest || '60s'}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.expandButton}
          onPress={onToggleExpand}
        >
          <MaterialCommunityIcons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Expanded View */}
      {expanded && (
        <View style={styles.expandedView}>
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton} onPress={onShowVideo}>
              <MaterialCommunityIcons name="information-outline" size={16} color="#888" />
              <Text style={styles.actionButtonText}>Exercise info</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MaterialCommunityIcons name="history" size={16} color="#888" />
              <Text style={styles.actionButtonText}>History</Text>
            </TouchableOpacity>
          </View>

          {/* Sets Table */}
          <View style={styles.setsTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, styles.setCol]}>Set</Text>
              <Text style={[styles.headerText, styles.inputCol]}>Reps</Text>
              <Text style={[styles.headerText, styles.inputCol]}>Weight</Text>
              <Text style={[styles.headerText, styles.inputCol]}>RIR</Text>
              <View style={styles.checkCol} />
            </View>

            {validSetData.map((set, setIndex) => (
              <View key={setIndex} style={styles.setRow}>
                <Text style={[styles.setNumber, styles.setCol]}>{setIndex + 1}</Text>

                <TextInput
                  style={[styles.input, styles.inputCol, set.completed && styles.inputCompleted]}
                  value={set.reps}
                  onChangeText={(value) => onUpdateSet(setIndex, 'reps', value)}
                  keyboardType="numeric"
                  placeholder="12"
                  editable={!set.completed}
                />

                <TextInput
                  style={[styles.input, styles.inputCol, set.completed && styles.inputCompleted]}
                  value={set.weight}
                  onChangeText={(value) => onUpdateSet(setIndex, 'weight', value)}
                  keyboardType="numeric"
                  placeholder="0"
                  editable={!set.completed}
                />

                <TextInput
                  style={[styles.input, styles.inputCol]}
                  placeholder="-"
                  editable={!set.completed}
                />

                <TouchableOpacity
                  style={[styles.checkButton, styles.checkCol]}
                  onPress={() => onCompleteSet(setIndex)}
                >
                  <MaterialCommunityIcons
                    name={set.completed ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={24}
                    color={set.completed ? '#E94E1B' : '#999'}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Add Set Button */}
          <TouchableOpacity style={styles.addSetButton}>
            <MaterialCommunityIcons name="plus" size={16} color="#FF6B35" />
            <Text style={styles.addSetText}>Add Set</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default WorkoutExerciseCard;
