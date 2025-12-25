import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions
} from 'react-native';
import { Card, Button, Chip, Badge } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../contexts/AuthContext';
import { getSafeDatabase } from '../../database/databaseHelper';
import { useLanguage } from '../../contexts/LanguageContext';

const { width } = Dimensions.get('window');

interface WorkoutProgram {
  id: string;
  name: string;
  description: string;
  duration: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  workoutsPerWeek: number;
  icon: string;
  color: string[];
  exercises: number;
  isActive?: boolean;
}

export const WorkoutPlansScreen: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeProgram, setActiveProgram] = useState<string | null>(null);
  const [filterLevel, setFilterLevel] = useState<string | null>(null);

  const workoutPrograms: WorkoutProgram[] = [
    {
      id: '1',
      name: t('workoutPlans.strengthFoundation'),
      description: t('workoutPlans.strengthFoundationDesc'),
      duration: `8 ${t('workoutPlans.weeks')}`,
      level: 'beginner',
      category: t('workoutPlans.categoryStrength'),
      workoutsPerWeek: 3,
      icon: 'dumbbell',
      color: ['#E94E1B', '#FF8787'],
      exercises: 24,
    },
    {
      id: '2',
      name: t('workoutPlans.hiitShred'),
      description: t('workoutPlans.hiitShredDesc'),
      duration: `6 ${t('workoutPlans.weeks')}`,
      level: 'intermediate',
      category: t('workoutPlans.categoryCardio'),
      workoutsPerWeek: 4,
      icon: 'fire',
      color: ['#FFA94D', '#FFB969'],
      exercises: 18,
    },
    {
      id: '3',
      name: t('workoutPlans.muscleBuilder'),
      description: t('workoutPlans.muscleBuilderDesc'),
      duration: `12 ${t('workoutPlans.weeks')}`,
      level: 'advanced',
      category: t('workoutPlans.categoryHypertrophy'),
      workoutsPerWeek: 5,
      icon: 'arm-flex',
      color: ['#845EC2', '#9B6FCE'],
      exercises: 36,
    },
    {
      id: '4',
      name: t('workoutPlans.fullBodyTransform'),
      description: t('workoutPlans.fullBodyTransformDesc'),
      duration: `16 ${t('workoutPlans.weeks')}`,
      level: 'intermediate',
      category: t('workoutPlans.categoryTransformation'),
      workoutsPerWeek: 4,
      icon: 'human',
      color: ['#4E8397', '#5A9AB2'],
      exercises: 42,
    },
    {
      id: '5',
      name: t('workoutPlans.powerliftingBasics'),
      description: t('workoutPlans.powerliftingBasicsDesc'),
      duration: `10 ${t('workoutPlans.weeks')}`,
      level: 'intermediate',
      category: t('workoutPlans.categoryPowerlifting'),
      workoutsPerWeek: 4,
      icon: 'weight-lifter',
      color: ['#C34A36', '#D65745'],
      exercises: 15,
    },
    {
      id: '6',
      name: t('workoutPlans.calisthenicsPro'),
      description: t('workoutPlans.calisthenicsProDesc'),
      duration: `8 ${t('workoutPlans.weeks')}`,
      level: 'advanced',
      category: t('workoutPlans.categoryCalisthenics'),
      workoutsPerWeek: 5,
      icon: 'gymnastics',
      color: ['#008B74', '#00A88C'],
      exercises: 28,
    },
    {
      id: '7',
      name: t('workoutPlans.beginnerFriendly'),
      description: t('workoutPlans.beginnerFriendlyDesc'),
      duration: `4 ${t('workoutPlans.weeks')}`,
      level: 'beginner',
      category: t('workoutPlans.categoryGeneral'),
      workoutsPerWeek: 3,
      icon: 'star',
      color: ['#F9B500', '#FFC41E'],
      exercises: 12,
    },
    {
      id: '8',
      name: t('workoutPlans.athleticPerformance'),
      description: t('workoutPlans.athleticPerformanceDesc'),
      duration: `12 ${t('workoutPlans.weeks')}`,
      level: 'advanced',
      category: t('workoutPlans.categoryAthletic'),
      workoutsPerWeek: 5,
      icon: 'run-fast',
      color: ['#FF006E', '#FF3085'],
      exercises: 32,
    },
  ];

  const handleSelectProgram = (program: WorkoutProgram) => {
    setSelectedProgram(program);
    setModalVisible(true);
  };

  const handleStartProgram = async () => {
    if (!selectedProgram) return;

    try {
      const db = getSafeDatabase();
      if (!db) return;

      const now = new Date().toISOString();

      // Add table if not exists
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS workout_programs_active (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          programId TEXT NOT NULL,
          programName TEXT NOT NULL,
          startDate TEXT NOT NULL,
          endDate TEXT,
          status TEXT DEFAULT 'active',
          FOREIGN KEY (userId) REFERENCES users(id)
        )
      `);

      // Deactivate any existing programs
      await db.runAsync(
        `UPDATE workout_programs_active SET status = 'completed' WHERE userId = ? AND status = 'active'`,
        [user?.id || '']
      );

      // Start new program
      await db.runAsync(
        `INSERT INTO workout_programs_active (userId, programId, programName, startDate, status)
         VALUES (?, ?, ?, ?, ?)`,
        [user?.id || '', selectedProgram.id, selectedProgram.name, now, 'active']
      );

      setActiveProgram(selectedProgram.id);
      setModalVisible(false);
      Alert.alert(t('workoutPlans.success'), `${t('workoutPlans.started')} ${selectedProgram.name} ${t('workoutPlans.program')}`);
    } catch (error) {
      console.error('Error starting program:', error);
      Alert.alert(t('workoutPlans.error'), t('workoutPlans.failedToStart'));
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return '#E94E1B';
      case 'intermediate': return '#E94E1B';
      case 'advanced': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const filteredPrograms = filterLevel
    ? workoutPrograms.filter(p => p.level === filterLevel)
    : workoutPrograms;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('workoutPlans.chooseProgram')}</Text>
          <Text style={styles.headerSubtitle}>
            {t('workoutPlans.selectMatching')}
          </Text>
        </View>

        <LinearGradient
          colors={['#E94E1B', '#45a049']}
          style={styles.logoSection}
        >
          <View style={styles.iconRow}>
            <TouchableOpacity style={styles.sideIcon} onPress={() => setFilterLevel('beginner')}>
              <MaterialCommunityIcons name="dumbbell" size={40} color="white" />
              <Text style={styles.iconLabel}>{t('workoutPlans.strength')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sideIcon} onPress={() => setFilterLevel('intermediate')}>
              <MaterialCommunityIcons name="fire" size={40} color="white" />
              <Text style={styles.iconLabel}>{t('workoutPlans.hiit')}</Text>
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <View style={styles.logoCircle}>
                <MaterialCommunityIcons name="weight-lifter" size={64} color="white" />
              </View>
              <Text style={styles.logoText}>{t('workoutPlans.fitApp')}</Text>
              <Text style={styles.logoSubtext}>{t('workoutPlans.yourFitnessJourney')}</Text>
            </View>
            <TouchableOpacity style={styles.sideIcon} onPress={() => setFilterLevel('advanced')}>
              <MaterialCommunityIcons name="arm-flex" size={40} color="white" />
              <Text style={styles.iconLabel}>{t('workoutPlans.power')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.sideIcon}>
              <MaterialCommunityIcons name="yoga" size={40} color="white" />
              <Text style={styles.iconLabel}>{t('workoutPlans.yoga')}</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          <Chip
            selected={filterLevel === null}
            onPress={() => setFilterLevel(null)}
            style={styles.filterChip}
          >
            {t('workoutPlans.allLevels')}
          </Chip>
          <Chip
            selected={filterLevel === 'beginner'}
            onPress={() => setFilterLevel('beginner')}
            style={styles.filterChip}
          >
            {t('workoutPlans.beginner')}
          </Chip>
          <Chip
            selected={filterLevel === 'intermediate'}
            onPress={() => setFilterLevel('intermediate')}
            style={styles.filterChip}
          >
            {t('workoutPlans.intermediate')}
          </Chip>
          <Chip
            selected={filterLevel === 'advanced'}
            onPress={() => setFilterLevel('advanced')}
            style={styles.filterChip}
          >
            {t('workoutPlans.advanced')}
          </Chip>
        </ScrollView>

        <View style={styles.programsGrid}>
          {filteredPrograms.map((program) => (
            <TouchableOpacity
              key={program.id}
              style={styles.programCard}
              onPress={() => handleSelectProgram(program)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={program.color as [string, string]}
                style={styles.programGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {activeProgram === program.id && (
                  <Badge style={styles.activeBadge}>{t('workoutPlans.active')}</Badge>
                )}
                <MaterialCommunityIcons
                  name={program.icon as any}
                  size={32}
                  color="white"
                />
                <Text style={styles.programName}>{program.name}</Text>
                <Text style={styles.programDuration}>{program.duration}</Text>
                <View style={styles.programInfo}>
                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="calendar" size={14} color="white" />
                    <Text style={styles.infoText}>{program.workoutsPerWeek}{t('workoutPlans.week')}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <MaterialCommunityIcons name="dumbbell" size={14} color="white" />
                    <Text style={styles.infoText}>{program.exercises} {t('workoutPlans.ex')}</Text>
                  </View>
                </View>
                <View style={[styles.levelIndicator, { backgroundColor: getLevelColor(program.level) }]} />
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedProgram && (
              <>
                <LinearGradient
                  colors={selectedProgram.color as [string, string]}
                  style={styles.modalHeader}
                >
                  <MaterialCommunityIcons
                    name={selectedProgram.icon as any}
                    size={48}
                    color="white"
                  />
                  <Text style={styles.modalTitle}>{selectedProgram.name}</Text>
                </LinearGradient>

                <View style={styles.modalBody}>
                  <Text style={styles.modalDescription}>
                    {selectedProgram.description}
                  </Text>

                  <View style={styles.modalStats}>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="clock-outline" size={24} color="#666" />
                      <Text style={styles.statLabel}>{t('workoutPlans.duration')}</Text>
                      <Text style={styles.statValue}>{selectedProgram.duration}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="calendar-check" size={24} color="#666" />
                      <Text style={styles.statLabel}>{t('workoutPlans.frequency')}</Text>
                      <Text style={styles.statValue}>{selectedProgram.workoutsPerWeek}x{t('workoutPlans.week')}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons name="trending-up" size={24} color="#666" />
                      <Text style={styles.statLabel}>{t('workoutPlans.level')}</Text>
                      <Text style={styles.statValue}>
                        {t(`workoutPlans.${selectedProgram.level}`)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalActions}>
                    <Button
                      mode="outlined"
                      onPress={() => setModalVisible(false)}
                      style={styles.modalButton}
                    >
                      {t('workoutPlans.cancel')}
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleStartProgram}
                      style={styles.modalButton}
                      buttonColor={selectedProgram.color[0]}
                      disabled={activeProgram === selectedProgram.id}
                    >
                      {activeProgram === selectedProgram.id ? t('workoutPlans.currentlyActive') : t('workoutPlans.startProgram')}
                    </Button>
                  </View>
                </View>
              </>
            )}
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
    padding: 20,
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  logoSection: {
    paddingVertical: 30,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },
  sideIcon: {
    alignItems: 'center',
    padding: 10,
    marginHorizontal: 5,
  },
  iconLabel: {
    fontSize: 10,
    color: 'white',
    marginTop: 5,
    fontWeight: '600',
  },
  filterContainer: {
    padding: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterChip: {
    marginHorizontal: 5,
  },
  programsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  programCard: {
    width: (width - 30) / 2,
    height: 200,
    marginBottom: 10,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  programGradient: {
    flex: 1,
    padding: 15,
    justifyContent: 'space-between',
  },
  activeBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#E94E1B',
  },
  programName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  programDuration: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 5,
  },
  programInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 11,
    color: 'white',
  },
  levelIndicator: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    padding: 30,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
  },
});