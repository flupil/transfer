import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Searchbar,
  List,
  Avatar,
  Chip,
  Button,
  Menu,
  Divider,
  ProgressBar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSafeDatabase } from '../../database/databaseHelper';
import { useAuth } from '../../contexts/AuthContext';
import { format, subDays } from 'date-fns';

const TraineesScreen: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [trainees, setTrainees] = useState<any[]>([]);
  const [filteredTrainees, setFilteredTrainees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [traineeStats, setTraineeStats] = useState<Record<string, any>>({});

  useEffect(() => {
    loadTrainees();
  }, []);

  useEffect(() => {
    filterTrainees();
  }, [trainees, searchQuery]);

  const loadTrainees = async () => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      setLoading(true);

      // Get all users assigned to this coach
      const result = await db.getAllAsync(
        'SELECT * FROM users WHERE coachId = ? AND role = "user" ORDER BY name',
        [currentUser?.id || '']
      ) as any[];

      setTrainees(result);

      // Load stats for each trainee
      const stats: Record<string, any> = {};
      for (const trainee of result) {
        stats[trainee.id] = await loadTraineeStats(trainee.id);
      }
      setTraineeStats(stats);
    } catch (error) {
      console.error('Failed to load trainees:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTraineeStats = async (traineeId: string) => {
    try {
      const db = getSafeDatabase();
      if (!db) return {};

      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

      // Get workout stats for last 30 days
      const workoutStats = await db.getAllAsync(
        `SELECT COUNT(*) as workoutCount, AVG(duration) as avgDuration
         FROM workout_logs
         WHERE userId = ? AND date >= ?`,
        [traineeId, thirtyDaysAgo]
      ) as { workoutCount: number; avgDuration: number }[];

      // Get attendance stats for last 30 days
      const attendanceStats = await db.getAllAsync(
        `SELECT COUNT(*) as attendanceCount
         FROM attendance
         WHERE userId = ? AND date >= ?`,
        [traineeId, thirtyDaysAgo]
      ) as { attendanceCount: number }[];

      // Get latest weight from progress metrics
      const progressStats = await db.getAllAsync(
        `SELECT weight, date
         FROM progress_metrics
         WHERE userId = ?
         ORDER BY date DESC
         LIMIT 1`,
        [traineeId]
      ) as { weight: number; date: string }[];

      // Get assigned plans
      const assignedPlans = await db.getAllAsync(
        `SELECT wp.name, wp.difficulty
         FROM workout_plans wp
         WHERE json_extract(wp.assignedUserIds, '$') LIKE '%${traineeId}%'`
      ) as { name: string; difficulty: string }[];

      return {
        workoutCount: workoutStats[0]?.workoutCount || 0,
        avgDuration: Math.round((workoutStats[0]?.avgDuration || 0) / 60),
        attendanceCount: attendanceStats[0]?.attendanceCount || 0,
        currentWeight: progressStats[0]?.weight || null,
        lastWeighIn: progressStats[0]?.date || null,
        assignedPlans: assignedPlans.length,
        attendanceRate: Math.round(((attendanceStats[0]?.attendanceCount || 0) / 30) * 100),
      };
    } catch (error) {
      console.error('Failed to load trainee stats:', error);
      return {};
    }
  };

  const filterTrainees = () => {
    let filtered = trainees;

    if (searchQuery) {
      filtered = filtered.filter(trainee =>
        trainee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trainee.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTrainees(filtered);
  };

  const handleAssignPlan = async (traineeId: string) => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      // Get available workout plans
      const plans = await db.getAllAsync(
        'SELECT id, name, difficulty FROM workout_plans WHERE owner IN ("gym", "coach")'
      ) as { id: string; name: string; difficulty: string }[];

      if (plans.length === 0) {
        Alert.alert('No Plans Available', 'Create workout plans first before assigning them.');
        return;
      }

      // Show plan selection (simplified for demo)
      const planNames = plans.map(p => p.name);
      const buttons = plans.map(plan => ({
        text: `${plan.name} (${plan.difficulty})`,
        onPress: async () => {
          await assignPlanToTrainee(plan.id, traineeId);
        }
      }));
      buttons.push({ text: 'Cancel', onPress: async () => {} });

      Alert.alert('Assign Plan', 'Select a plan to assign', buttons);
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  };

  const assignPlanToTrainee = async (planId: string, traineeId: string) => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      // Get current assigned users
      const result = await db.getAllAsync(
        'SELECT assignedUserIds FROM workout_plans WHERE id = ?',
        [planId]
      ) as { assignedUserIds: string | null }[];

      if (result.length === 0) return;

      const currentAssigned = result[0]?.assignedUserIds ? JSON.parse(result[0].assignedUserIds) : [];
      if (!currentAssigned.includes(traineeId)) {
        currentAssigned.push(traineeId);

        await db.runAsync(
          'UPDATE workout_plans SET assignedUserIds = ? WHERE id = ?',
          [JSON.stringify(currentAssigned), planId]
        );

        Alert.alert('Success', 'Plan assigned successfully');
        loadTrainees(); // Refresh stats
      } else {
        Alert.alert('Info', 'This plan is already assigned to this trainee');
      }
    } catch (error) {
      console.error('Failed to assign plan:', error);
      Alert.alert('Error', 'Failed to assign plan');
    }
  };

  const handleViewProgress = (trainee: any) => {
    // Navigate to trainee progress view (would be implemented)
    Alert.alert('View Progress', `Viewing progress for ${trainee.name}`);
  };

  const handleSendMessage = (trainee: any) => {
    // Navigate to messaging (would be implemented)
    Alert.alert('Send Message', `Sending message to ${trainee.name}`);
  };

  const getActivityLevel = (stats: any) => {
    const workoutRate = (stats.workoutCount || 0) / 30;
    if (workoutRate >= 0.8) return { level: 'High', color: '#E94E1B' };
    if (workoutRate >= 0.5) return { level: 'Medium', color: '#E94E1B' };
    return { level: 'Low', color: '#F44336' };
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search trainees..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
        <View style={styles.statsOverview}>
          <Text variant="titleMedium">
            {trainees.length} Trainees
          </Text>
          <Text variant="bodySmall" style={styles.statsText}>
            {trainees.filter(t => traineeStats[t.id]?.attendanceRate > 70).length} Active this month
          </Text>
        </View>
      </View>

      <ScrollView style={styles.traineesList}>
        {filteredTrainees.map((trainee) => {
          const stats = traineeStats[trainee.id] || {};
          const activity = getActivityLevel(stats);

          return (
            <Card key={trainee.id} style={styles.traineeCard}>
              <Card.Content>
                <View style={styles.traineeHeader}>
                  <View style={styles.traineeInfo}>
                    <Avatar.Text
                      size={50}
                      label={trainee.name?.charAt(0) || 'T'}
                      style={[{ backgroundColor: '#E94E1B' }]}
                    />
                    <View style={styles.traineeDetails}>
                      <Text variant="titleMedium" style={styles.traineeName}>
                        {trainee.name}
                      </Text>
                      <Text variant="bodySmall" style={styles.traineeEmail}>
                        {trainee.email}
                      </Text>
                      <View style={styles.activityLevel}>
                        <Chip
                          mode="outlined"
                          textStyle={{ fontSize: 12 }}
                          style={[styles.activityChip, { borderColor: activity.color }]}
                        >
                          {activity.level} Activity
                        </Chip>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setMenuVisible(menuVisible === trainee.id ? null : trainee.id)}
                  >
                    <MaterialCommunityIcons name="dots-vertical" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="dumbbell" size={20} color="#E94E1B" />
                    <Text variant="bodySmall" style={styles.statValue}>
                      {stats.workoutCount || 0}
                    </Text>
                    <Text variant="bodySmall" style={styles.statLabel}>
                      Workouts (30d)
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="check-circle" size={20} color="#3B82F6" />
                    <Text variant="bodySmall" style={styles.statValue}>
                      {stats.attendanceRate || 0}%
                    </Text>
                    <Text variant="bodySmall" style={styles.statLabel}>
                      Attendance
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="clipboard-list" size={20} color="#E94E1B" />
                    <Text variant="bodySmall" style={styles.statValue}>
                      {stats.assignedPlans || 0}
                    </Text>
                    <Text variant="bodySmall" style={styles.statLabel}>
                      Plans
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <MaterialCommunityIcons name="scale-bathroom" size={20} color="#9C27B0" />
                    <Text variant="bodySmall" style={styles.statValue}>
                      {stats.currentWeight || '--'}
                    </Text>
                    <Text variant="bodySmall" style={styles.statLabel}>
                      Weight (kg)
                    </Text>
                  </View>
                </View>

                {stats.avgDuration > 0 && (
                  <>
                    <Divider style={styles.divider} />
                    <View style={styles.progressSection}>
                      <Text variant="bodySmall" style={styles.progressLabel}>
                        Average Workout Duration: {stats.avgDuration} min
                      </Text>
                      <ProgressBar
                        progress={Math.min(stats.avgDuration / 60, 1)}
                        color="#E94E1B"
                        style={styles.progressBar}
                      />
                    </View>
                  </>
                )}

                {menuVisible === trainee.id && (
                  <View style={styles.actionMenu}>
                    <Button
                      mode="text"
                      icon="chart-line"
                      onPress={() => {
                        handleViewProgress(trainee);
                        setMenuVisible(null);
                      }}
                    >
                      View Progress
                    </Button>
                    <Button
                      mode="text"
                      icon="clipboard-plus"
                      onPress={() => {
                        handleAssignPlan(trainee.id);
                        setMenuVisible(null);
                      }}
                    >
                      Assign Plan
                    </Button>
                    <Button
                      mode="text"
                      icon="message"
                      onPress={() => {
                        handleSendMessage(trainee);
                        setMenuVisible(null);
                      }}
                    >
                      Send Message
                    </Button>
                  </View>
                )}
              </Card.Content>
            </Card>
          );
        })}

        {filteredTrainees.length === 0 && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="account-multiple" size={80} color="#ccc" />
            <Text variant="titleMedium" style={styles.emptyText}>
              No trainees found
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtext}>
              {trainees.length === 0
                ? 'No trainees are assigned to you yet'
                : 'No trainees match your search criteria'
              }
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  searchBar: {
    marginBottom: 16,
  },
  statsOverview: {
    alignItems: 'center',
  },
  statsText: {
    color: '#666',
    marginTop: 4,
  },
  traineesList: {
    flex: 1,
    padding: 16,
  },
  traineeCard: {
    marginBottom: 12,
  },
  traineeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  traineeInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  traineeDetails: {
    marginLeft: 12,
    flex: 1,
  },
  traineeName: {
    fontWeight: '600',
  },
  traineeEmail: {
    color: '#666',
    marginTop: 2,
  },
  activityLevel: {
    marginTop: 8,
  },
  activityChip: {
    height: 28,
    alignSelf: 'flex-start',
  },
  divider: {
    marginVertical: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    paddingVertical: 8,
  },
  statValue: {
    fontWeight: '600',
    marginTop: 4,
    fontSize: 16,
  },
  statLabel: {
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
  progressSection: {
    paddingTop: 8,
  },
  progressLabel: {
    color: '#666',
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  actionMenu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    color: '#666',
  },
  emptySubtext: {
    marginTop: 8,
    color: '#999',
    textAlign: 'center',
  },
});

export default TraineesScreen;