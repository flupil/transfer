import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  FlatList,
} from 'react-native';
import { Card, Chip, IconButton, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../../contexts/LanguageContext';

const { width, height } = Dimensions.get('window');

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  description: string;
  instructions: string[];
  tips: string[];
  commonMistakes: string[];
}

const exerciseLibrary: Exercise[] = [
  {
    id: '1',
    name: 'Barbell Squat',
    category: 'Compound',
    muscleGroup: ['Quadriceps', 'Glutes', 'Core'],
    difficulty: 'intermediate',
    equipment: 'Barbell',
    description: 'The king of all exercises. Builds overall lower body strength and mass.',
    instructions: [
      'Position the barbell on your upper back',
      'Stand with feet shoulder-width apart',
      'Keep chest up and core braced',
      'Descend by pushing hips back and bending knees',
      'Go down until thighs are parallel to floor',
      'Drive through heels to stand back up',
    ],
    tips: [
      'Keep knees tracking over toes',
      'Maintain neutral spine throughout',
      'Breathe in on descent, out on ascent',
    ],
    commonMistakes: [
      'Knees caving inward',
      'Heels coming off the ground',
      'Excessive forward lean',
      'Not reaching proper depth',
    ],
  },
  {
    id: '2',
    name: 'Bench Press',
    category: 'Compound',
    muscleGroup: ['Chest', 'Triceps', 'Shoulders'],
    difficulty: 'beginner',
    equipment: 'Barbell',
    description: 'Fundamental upper body exercise for building chest strength and mass.',
    instructions: [
      'Lie flat on bench with eyes under the bar',
      'Grip bar slightly wider than shoulder-width',
      'Plant feet firmly on the ground',
      'Lower bar to chest with control',
      'Touch chest lightly',
      'Press bar back up to starting position',
    ],
    tips: [
      'Maintain slight arch in lower back',
      'Keep shoulder blades pulled back',
      'Use full range of motion',
    ],
    commonMistakes: [
      'Bouncing bar off chest',
      'Flaring elbows too wide',
      'Not touching chest',
      'Lifting hips off bench',
    ],
  },
  {
    id: '3',
    name: 'Deadlift',
    category: 'Compound',
    muscleGroup: ['Back', 'Glutes', 'Hamstrings', 'Core'],
    difficulty: 'intermediate',
    equipment: 'Barbell',
    description: 'Total body exercise that builds posterior chain strength.',
    instructions: [
      'Stand with feet hip-width apart',
      'Bend at hips and knees to grip bar',
      'Keep back straight and chest up',
      'Drive through heels to lift bar',
      'Stand tall with shoulders back',
      'Lower bar with control',
    ],
    tips: [
      'Keep bar close to body throughout',
      'Engage lats before lifting',
      'Push the floor away with feet',
    ],
    commonMistakes: [
      'Rounding the back',
      'Bar drifting away from body',
      'Hyperextending at top',
      'Not engaging core',
    ],
  },
  {
    id: '4',
    name: 'Pull-ups',
    category: 'Compound',
    muscleGroup: ['Back', 'Biceps', 'Core'],
    difficulty: 'intermediate',
    equipment: 'Pull-up Bar',
    description: 'Excellent bodyweight exercise for back development.',
    instructions: [
      'Hang from bar with overhand grip',
      'Grip slightly wider than shoulders',
      'Pull body up until chin over bar',
      'Lower with control to full extension',
    ],
    tips: [
      'Engage core throughout movement',
      'Focus on pulling elbows down',
      'Use full range of motion',
    ],
    commonMistakes: [
      'Using momentum/kipping',
      'Not reaching full extension',
      'Chin not clearing bar',
    ],
  },
  {
    id: '5',
    name: 'Dumbbell Shoulder Press',
    category: 'Compound',
    muscleGroup: ['Shoulders', 'Triceps'],
    difficulty: 'beginner',
    equipment: 'Dumbbells',
    description: 'Builds shoulder strength and stability.',
    instructions: [
      'Sit or stand with dumbbells at shoulder level',
      'Press dumbbells overhead',
      'Bring dumbbells together at top',
      'Lower with control to starting position',
    ],
    tips: [
      'Keep core tight',
      'Avoid arching back excessively',
      'Control the tempo',
    ],
    commonMistakes: [
      'Using too much momentum',
      'Not going through full range',
      'Leaning back too much',
    ],
  },
  {
    id: '6',
    name: 'Plank',
    category: 'Isometric',
    muscleGroup: ['Core', 'Shoulders'],
    difficulty: 'beginner',
    equipment: 'Bodyweight',
    description: 'Core stability exercise that strengthens entire midsection.',
    instructions: [
      'Start in push-up position on forearms',
      'Keep body in straight line from head to heels',
      'Engage core and glutes',
      'Hold position for desired time',
    ],
    tips: [
      'Breathe normally throughout',
      'Keep hips level',
      'Look at floor to maintain neutral neck',
    ],
    commonMistakes: [
      'Hips sagging or too high',
      'Holding breath',
      'Looking up or forward',
    ],
  },
  {
    id: '7',
    name: 'Romanian Deadlift',
    category: 'Compound',
    muscleGroup: ['Hamstrings', 'Glutes', 'Back'],
    difficulty: 'intermediate',
    equipment: 'Barbell',
    description: 'Targets hamstrings and glutes with emphasis on hip hinge movement.',
    instructions: [
      'Hold bar at hip level with overhand grip',
      'Keep knees slightly bent',
      'Push hips back while lowering bar',
      'Feel stretch in hamstrings',
      'Drive hips forward to return to start',
    ],
    tips: [
      'Keep bar close to legs',
      'Maintain flat back throughout',
      'Focus on hip hinge, not knee bend',
    ],
    commonMistakes: [
      'Bending knees too much',
      'Rounding the back',
      'Going too low',
    ],
  },
  {
    id: '8',
    name: 'Dips',
    category: 'Compound',
    muscleGroup: ['Chest', 'Triceps', 'Shoulders'],
    difficulty: 'intermediate',
    equipment: 'Dip Bars',
    description: 'Powerful upper body exercise for chest and tricep development.',
    instructions: [
      'Support body on dip bars with arms straight',
      'Lean forward slightly for chest emphasis',
      'Lower body by bending elbows',
      'Descend until shoulders below elbows',
      'Push back up to starting position',
    ],
    tips: [
      'Control the descent',
      'Keep elbows from flaring too wide',
      'Lean forward for chest, upright for triceps',
    ],
    commonMistakes: [
      'Going too deep too soon',
      'Using momentum',
      'Shoulders rolling forward',
    ],
  },
];

export const ExerciseLibraryScreen: React.FC = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const categories = [t('exercises.all'), t('exercises.compound'), t('exercises.isolation'), t('exercises.isometric')];
  const muscleGroups = [t('exercises.all'), t('muscle.chest'), t('muscle.back'), t('muscle.shoulders'), t('muscle.arms'), t('muscle.legs'), t('muscle.core')];

  const filteredExercises = exerciseLibrary.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || selectedCategory === t('exercises.all') || exercise.category === selectedCategory;
    const matchesMuscle = !selectedMuscle || selectedMuscle === t('exercises.all') ||
      exercise.muscleGroup.some(muscle => muscle.toLowerCase().includes(selectedMuscle.toLowerCase()));

    return matchesSearch && matchesCategory && matchesMuscle;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4CAF50';
      case 'intermediate': return '#FF9800';
      case 'advanced': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const handleExercisePress = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setModalVisible(true);
  };

  const renderExerciseCard = ({ item }: { item: Exercise }) => (
    <TouchableOpacity onPress={() => handleExercisePress(item)}>
      <Card style={styles.exerciseCard}>
        <View style={styles.cardContent}>
          <View style={styles.videoPlaceholder}>
            <MaterialCommunityIcons name="play-circle-outline" size={40} color="#666" />
            <Text style={styles.videoText}>{t('exercises.videoTutorial')}</Text>
          </View>
          <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            <View style={styles.muscleChips}>
              {item.muscleGroup.slice(0, 2).map((muscle, index) => (
                <Chip key={index} compact style={styles.muscleChip}>
                  {muscle}
                </Chip>
              ))}
            </View>
            <View style={styles.exerciseMeta}>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons name="dumbbell" size={14} color="#666" />
                <Text style={styles.metaText}>{item.equipment}</Text>
              </View>
              <Chip
                compact
                style={[styles.difficultyChip, { backgroundColor: getDifficultyColor(item.difficulty) }]}
              >
                <Text style={styles.difficultyText}>
                  {t(`exercises.${item.difficulty}`)}
                </Text>
              </Chip>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchBar}
          placeholder={t('exercises.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {muscleGroups.map(muscle => (
          <Chip
            key={muscle}
            selected={selectedMuscle === muscle}
            onPress={() => setSelectedMuscle(muscle === 'All' ? null : muscle)}
            style={styles.filterChip}
          >
            {muscle}
          </Chip>
        ))}
      </ScrollView>

      <FlatList
        data={filteredExercises}
        renderItem={renderExerciseCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedExercise && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedExercise.name}</Text>
                    <IconButton
                      icon="close"
                      size={24}
                      onPress={() => setModalVisible(false)}
                    />
                  </View>

                  <View style={styles.videoSection}>
                    <LinearGradient
                      colors={['#667eea', '#764ba2']}
                      style={styles.videoPlaceholderLarge}
                    >
                      <MaterialCommunityIcons name="play-circle-outline" size={60} color="white" />
                      <Text style={styles.videoTextLarge}>{t('exercises.exerciseDemonstration')}</Text>
                    </LinearGradient>
                  </View>

                  <View style={styles.modalBody}>
                    <Text style={styles.sectionTitle}>{t('exercises.description')}</Text>
                    <Text style={styles.description}>{selectedExercise.description}</Text>

                    <Text style={styles.sectionTitle}>{t('exercises.targetMuscles')}</Text>
                    <View style={styles.muscleChips}>
                      {selectedExercise.muscleGroup.map((muscle, index) => (
                        <Chip key={index} style={styles.muscleChipLarge}>
                          {muscle}
                        </Chip>
                      ))}
                    </View>

                    <Text style={styles.sectionTitle}>{t('exercises.howToPerform')}</Text>
                    {selectedExercise.instructions.map((instruction, index) => (
                      <View key={index} style={styles.instructionItem}>
                        <Text style={styles.instructionNumber}>{index + 1}</Text>
                        <Text style={styles.instructionText}>{instruction}</Text>
                      </View>
                    ))}

                    <Text style={styles.sectionTitle}>{t('exercises.proTips')}</Text>
                    {selectedExercise.tips.map((tip, index) => (
                      <View key={index} style={styles.tipItem}>
                        <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#4CAF50" />
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}

                    <Text style={styles.sectionTitle}>{t('exercises.commonMistakes')}</Text>
                    {selectedExercise.commonMistakes.map((mistake, index) => (
                      <View key={index} style={styles.mistakeItem}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#F44336" />
                        <Text style={styles.mistakeText}>{mistake}</Text>
                      </View>
                    ))}

                    <View style={styles.equipmentInfo}>
                      <MaterialCommunityIcons name="dumbbell" size={20} color="#666" />
                      <Text style={styles.equipmentText}>{t('exercises.equipment')}: {selectedExercise.equipment}</Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 16,
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterChip: {
    marginHorizontal: 5,
  },
  listContainer: {
    padding: 10,
  },
  exerciseCard: {
    marginBottom: 10,
    elevation: 2,
    backgroundColor: 'white',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 15,
  },
  videoPlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  videoText: {
    fontSize: 10,
    color: '#666',
    marginTop: 5,
  },
  exerciseInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  muscleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginVertical: 5,
  },
  muscleChip: {
    height: 24,
    backgroundColor: '#E3F2FD',
  },
  exerciseMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    color: '#666',
  },
  difficultyChip: {
    height: 24,
  },
  difficultyText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.9,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  videoSection: {
    padding: 20,
  },
  videoPlaceholderLarge: {
    height: 200,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTextLarge: {
    fontSize: 16,
    color: 'white',
    marginTop: 10,
  },
  modalBody: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  muscleChipLarge: {
    marginRight: 8,
    marginBottom: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 10,
    fontWeight: 'bold',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  mistakeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  mistakeText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  equipmentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  equipmentText: {
    fontSize: 14,
    color: '#666',
  },
});