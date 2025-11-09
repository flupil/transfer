import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {
  Card,
  Button,
  Chip,
  List,
  Badge,
  Searchbar,
  Menu,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getSafeDatabase } from '../database/databaseHelper';
import { PersonalRecord, MuscleGroup } from '../types';

interface ExerciseRecord {
  exerciseId: string;
  exerciseName: string;
  records: PersonalRecord[];
  bestWeight?: number;
  bestReps?: number;
  bestDuration?: number;
  bestDistance?: number;
  latestDate: Date;
  primaryMuscles?: MuscleGroup[];
}

const PersonalRecordsScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [personalRecords, setPersonalRecords] = useState<ExerciseRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ExerciseRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<MuscleGroup | 'all'>('all');
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  const muscleGroups: (MuscleGroup | 'all')[] = [
    'all', 'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
    'abs', 'obliques', 'quadriceps', 'hamstrings', 'glutes', 'calves'
  ];

  useEffect(() => {
    loadPersonalRecords();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [personalRecords, searchQuery, selectedMuscleGroup]);

  const loadPersonalRecords = async () => {
    if (!user) return;

    const db = getSafeDatabase();
    if (!db) return;

    try {
      // Get all workout logs with personal records
      const workoutLogs = await db.getAllAsync(
        `SELECT personalRecords, date FROM workout_logs
         WHERE userId = ? AND personalRecords IS NOT NULL AND personalRecords != '[]'
         ORDER BY date DESC`,
        [user.id]
      ) as any[];

      // Get exercise details for muscle group filtering
      const exercises = await db.getAllAsync(
        'SELECT id, name, primaryMuscles FROM exercises'
      ) as any[];

      const exerciseMap = new Map();
      exercises.forEach(exercise => {
        exerciseMap.set(exercise.id, {
          name: exercise.name,
          primaryMuscles: exercise.primaryMuscles ? JSON.parse(exercise.primaryMuscles) : []
        });
      });

      // Process personal records
      const recordsMap = new Map<string, ExerciseRecord>();

      for (const log of workoutLogs) {
        try {
          const records = JSON.parse(log.personalRecords) as PersonalRecord[];
          const logDate = new Date(log.date);

          for (const record of records) {
            const exerciseInfo = exerciseMap.get(record.exerciseId);
            const exerciseName = exerciseInfo?.name || record.exerciseName;
            const primaryMuscles = exerciseInfo?.primaryMuscles || [];

            if (!recordsMap.has(record.exerciseId)) {
              recordsMap.set(record.exerciseId, {
                exerciseId: record.exerciseId,
                exerciseName,
                records: [],
                latestDate: logDate,
                primaryMuscles,
              });
            }

            const existingRecord = recordsMap.get(record.exerciseId)!;
            existingRecord.records.push({
              ...record,
              date: new Date(record.date),
            });

            // Update latest date
            if (logDate > existingRecord.latestDate) {
              existingRecord.latestDate = logDate;
            }
          }
        } catch (error) {
          console.log('Error parsing personal records for log:', error);
        }
      }

      // Calculate best records for each exercise
      const processedRecords: ExerciseRecord[] = Array.from(recordsMap.values()).map(exerciseRecord => {
        const { records } = exerciseRecord;

        // Find best records by type
        const weightRecords = records.filter(r => r.type === 'weight');
        const repsRecords = records.filter(r => r.type === 'reps');
        const durationRecords = records.filter(r => r.type === 'duration');
        const distanceRecords = records.filter(r => r.type === 'distance');

        return {
          ...exerciseRecord,
          records: records.sort((a, b) => b.date.getTime() - a.date.getTime()),
          bestWeight: weightRecords.length > 0 ? Math.max(...weightRecords.map(r => r.value)) : undefined,
          bestReps: repsRecords.length > 0 ? Math.max(...repsRecords.map(r => r.value)) : undefined,
          bestDuration: durationRecords.length > 0 ? Math.max(...durationRecords.map(r => r.value)) : undefined,
          bestDistance: distanceRecords.length > 0 ? Math.max(...distanceRecords.map(r => r.value)) : undefined,
        };
      });

      // Sort by latest date
      processedRecords.sort((a, b) => b.latestDate.getTime() - a.latestDate.getTime());

      setPersonalRecords(processedRecords);
    } catch (error) {
      console.error('Failed to load personal records:', error);
    }
  };

  const filterRecords = () => {
    let filtered = personalRecords;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(record =>
        record.exerciseName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by muscle group
    if (selectedMuscleGroup !== 'all') {
      filtered = filtered.filter(record =>
        record.primaryMuscles?.includes(selectedMuscleGroup as MuscleGroup)
      );
    }

    setFilteredRecords(filtered);
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadPersonalRecords();
    } catch (error) {
      console.log('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const renderRecordCard = ({ item }: { item: ExerciseRecord }) => {
    const latestRecord = item.records[0];
    const hasMultipleTypes = new Set(item.records.map(r => r.type)).size > 1;

    return (
      <Card style={styles.recordCard}>
        <TouchableOpacity
          onPress={() => {
            // You could navigate to a detailed exercise record screen here
            console.log('Show details for:', item.exerciseName);
          }}
        >
          <Card.Content>
            <View style={styles.recordHeader}>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{item.exerciseName}</Text>
                <Text style={styles.latestDate}>
                  Latest: {format(item.latestDate, 'MMM d, yyyy')}
                </Text>
              </View>
              <View style={styles.recordStats}>
                <Badge style={styles.recordCount}>
                  {`${item.records.length} PR${item.records.length !== 1 ? 's' : ''}`}
                </Badge>
              </View>
            </View>

            {/* Muscle Groups */}
            {item.primaryMuscles && item.primaryMuscles.length > 0 && (
              <View style={styles.muscleGroupContainer}>
                {item.primaryMuscles.slice(0, 3).map(muscle => (
                  <Chip
                    key={muscle}
                    style={styles.muscleChip}
                    textStyle={styles.muscleChipText}
                    compact
                  >
                    {String(muscle)}
                  </Chip>
                ))}
                {item.primaryMuscles.length > 3 && (
                  <Text style={styles.moreMuscles}>+{item.primaryMuscles.length - 3} more</Text>
                )}
              </View>
            )}

            {/* Best Records */}
            <View style={styles.bestRecords}>
              {item.bestWeight && (
                <View style={styles.bestRecord}>
                  <MaterialCommunityIcons name="weight-kilogram" size={16} color="#FF9800" />
                  <Text style={styles.bestRecordText}>{item.bestWeight}kg</Text>
                </View>
              )}
              {item.bestReps && (
                <View style={styles.bestRecord}>
                  <MaterialCommunityIcons name="repeat" size={16} color="#2196F3" />
                  <Text style={styles.bestRecordText}>{item.bestReps} reps</Text>
                </View>
              )}
              {item.bestDuration && (
                <View style={styles.bestRecord}>
                  <MaterialCommunityIcons name="timer" size={16} color="#9C27B0" />
                  <Text style={styles.bestRecordText}>{Math.floor(item.bestDuration / 60)}:{(item.bestDuration % 60).toString().padStart(2, '0')}</Text>
                </View>
              )}
              {item.bestDistance && (
                <View style={styles.bestRecord}>
                  <MaterialCommunityIcons name="map-marker-distance" size={16} color="#4CAF50" />
                  <Text style={styles.bestRecordText}>{item.bestDistance}m</Text>
                </View>
              )}
            </View>

            {/* Latest Record Details */}
            <Divider style={styles.divider} />
            <View style={styles.latestRecord}>
              <Text style={styles.latestRecordLabel}>Latest PR:</Text>
              <View style={styles.latestRecordDetails}>
                <Text style={styles.latestRecordValue}>
                  {latestRecord.type === 'weight' && `${latestRecord.value}kg`}
                  {latestRecord.type === 'reps' && `${latestRecord.value} reps`}
                  {latestRecord.type === 'duration' && `${Math.floor(latestRecord.value / 60)}:${(latestRecord.value % 60).toString().padStart(2, '0')}`}
                  {latestRecord.type === 'distance' && `${latestRecord.value}m`}
                </Text>
                <Text style={styles.latestRecordType}>({latestRecord.type})</Text>
                <Text style={styles.latestRecordDate}>
                  {format(latestRecord.date, 'MMM d')}
                </Text>
              </View>
              {latestRecord.previousValue && (
                <Text style={styles.improvement}>
                  +{latestRecord.value - latestRecord.previousValue} from previous
                </Text>
              )}
            </View>
          </Card.Content>
        </TouchableOpacity>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialCommunityIcons name="trophy-outline" size={64} color="#E0E0E0" />
      <Text style={styles.emptyStateTitle}>{t('pr.noRecordsYet')}</Text>
      <Text style={styles.emptyStateText}>
        Complete workouts and set new personal records to see them here
      </Text>
      <Button
        mode="contained"
        onPress={() => navigation.navigate('Workout')}
        style={styles.startWorkoutButton}
      >
        Start a Workout
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search and Filter Header */}
      <View style={styles.header}>
        <Searchbar
          placeholder={t('placeholder.searchExercises')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />

        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setFilterMenuVisible(true)}
            >
              <MaterialCommunityIcons name="filter" size={24} color="#666" />
              <Text style={styles.filterButtonText}>
                {selectedMuscleGroup === 'all' ? 'All' : selectedMuscleGroup}
              </Text>
            </TouchableOpacity>
          }
        >
          {muscleGroups.map(group => (
            <Menu.Item
              key={group}
              onPress={() => {
                setSelectedMuscleGroup(group);
                setFilterMenuVisible(false);
              }}
              title={group === 'all' ? 'All Muscle Groups' : group}
              leadingIcon={selectedMuscleGroup === group ? 'check' : undefined}
            />
          ))}
        </Menu>
      </View>

      {/* Statistics Summary */}
      {personalRecords.length > 0 && (
        <Card style={styles.statsCard}>
          <Card.Content>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{personalRecords.length}</Text>
                <Text style={styles.statLabel}>Exercises</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {personalRecords.reduce((sum, record) => sum + record.records.length, 0)}
                </Text>
                <Text style={styles.statLabel}>Total PRs</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {personalRecords.filter(record =>
                    record.records.some(r =>
                      new Date().getTime() - r.date.getTime() < 7 * 24 * 60 * 60 * 1000
                    )
                  ).length}
                </Text>
                <Text style={styles.statLabel}>This Week</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Records List */}
      <FlatList
        data={filteredRecords}
        renderItem={renderRecordCard}
        keyExtractor={(item) => item.exerciseId}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
            progressBackgroundColor="#FFFFFF"
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={filteredRecords.length === 0 ? styles.emptyContainer : undefined}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    gap: 10,
  },
  searchbar: {
    flex: 1,
    height: 45,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#fff',
    gap: 5,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  statsCard: {
    margin: 10,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  recordCard: {
    margin: 10,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  latestDate: {
    fontSize: 12,
    color: '#666',
  },
  recordStats: {
    alignItems: 'flex-end',
  },
  recordCount: {
    backgroundColor: '#E3F2FD',
  },
  muscleGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: 10,
    gap: 5,
  },
  muscleChip: {
    backgroundColor: '#F5F5F5',
    height: 24,
  },
  muscleChipText: {
    fontSize: 10,
    textTransform: 'capitalize',
  },
  moreMuscles: {
    fontSize: 10,
    color: '#666',
    fontStyle: 'italic',
  },
  bestRecords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 10,
  },
  bestRecord: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bestRecordText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  divider: {
    marginVertical: 10,
  },
  latestRecord: {
    gap: 4,
  },
  latestRecordLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  latestRecordDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  latestRecordValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4CAF50',
  },
  latestRecordType: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  latestRecordDate: {
    fontSize: 12,
    color: '#666',
  },
  improvement: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  startWorkoutButton: {
    marginTop: 10,
  },
});

export { PersonalRecordsScreen };
export default PersonalRecordsScreen;