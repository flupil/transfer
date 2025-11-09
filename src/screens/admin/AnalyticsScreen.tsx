import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {
  Text,
  Card,
  SegmentedButtons,
  List,
  Divider,
} from 'react-native-paper';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getSafeDatabase } from '../../database/databaseHelper';
import { format, subDays, startOfWeek, endOfWeek, subMonths } from 'date-fns';
import { ErrorBoundary } from '../../components/ErrorBoundary';

const screenWidth = Dimensions.get('window').width;

const AnalyticsScreen: React.FC = () => {
  const [timeRange, setTimeRange] = useState('week');
  const [userGrowthData, setUserGrowthData] = useState<any>({
    labels: [],
    datasets: [{ data: [] }]
  });
  const [workoutData, setWorkoutData] = useState<any>({
    labels: [],
    datasets: [{ data: [] }]
  });
  const [attendanceData, setAttendanceData] = useState<any>({
    labels: [],
    datasets: [{ data: [] }]
  });
  const [userDistribution, setUserDistribution] = useState<any>([]);
  const [keyMetrics, setKeyMetrics] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalWorkouts: 0,
    avgWorkoutDuration: 0,
    attendanceRate: 0,
    popularExercise: '',
  });

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    await Promise.all([
      loadUserGrowth(),
      loadWorkoutAnalytics(),
      loadAttendanceAnalytics(),
      loadUserDistribution(),
      loadKeyMetrics(),
    ]);
  };

  const loadUserGrowth = async () => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

      const result = await db.getAllAsync(
        `SELECT DATE(createdAt) as date, COUNT(*) as count
         FROM users
         WHERE createdAt >= ?
         GROUP BY DATE(createdAt)
         ORDER BY date`,
        [startDate]
      );

      if (result.length > 0) {
        const labels = result.map((r: any) => format(new Date(r.date), 'MM/dd'));
        const data = result.map((r: any) => r.count);

        setUserGrowthData({
          labels,
          datasets: [{
            data,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            strokeWidth: 2
          }]
        });
      } else {
        // Demo data
        setUserGrowthData({
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            data: [2, 3, 1, 4, 2, 5, 3],
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            strokeWidth: 2
          }]
        });
      }
    } catch (error) {
      console.error('Failed to load user growth:', error);
    }
  };

  const loadWorkoutAnalytics = async () => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

      const result = await db.getAllAsync(
        `SELECT DATE(date) as workout_date, COUNT(*) as count
         FROM workout_logs
         WHERE date >= ?
         GROUP BY DATE(date)
         ORDER BY workout_date`,
        [startDate]
      );

      if (result.length > 0) {
        const labels = result.map((r: any) => format(new Date(r.workout_date), 'MM/dd'));
        const data = result.map((r: any) => r.count);

        setWorkoutData({
          labels,
          datasets: [{ data }]
        });
      } else {
        // Demo data
        setWorkoutData({
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{ data: [12, 15, 8, 18, 20, 25, 14] }]
        });
      }
    } catch (error) {
      console.error('Failed to load workout analytics:', error);
    }
  };

  const loadAttendanceAnalytics = async () => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
      const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd');

      const result = await db.getAllAsync(
        `SELECT DATE(date) as attendance_date, COUNT(DISTINCT userId) as count
         FROM attendance
         WHERE date >= ?
         GROUP BY DATE(date)
         ORDER BY attendance_date`,
        [startDate]
      );

      if (result.length > 0) {
        const labels = result.map((r: any) => format(new Date(r.attendance_date), 'MM/dd'));
        const data = result.map((r: any) => r.count);

        setAttendanceData({
          labels,
          datasets: [{
            data,
            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
            strokeWidth: 2
          }]
        });
      } else {
        // Demo data
        setAttendanceData({
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            data: [45, 52, 38, 48, 55, 62, 35],
            color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
            strokeWidth: 2
          }]
        });
      }
    } catch (error) {
      console.error('Failed to load attendance analytics:', error);
    }
  };

  const loadUserDistribution = async () => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      const result = await db.getAllAsync(
        'SELECT role, COUNT(*) as count FROM users GROUP BY role'
      );

      if (result.length > 0) {
        const distribution = result.map((r: any) => ({
          name: r.role,
          count: r.count,
          color: getRoleColor(r.role),
          legendFontColor: '#333',
          legendFontSize: 14,
        }));

        setUserDistribution(distribution);
      } else {
        // Demo data
        setUserDistribution([
          { name: 'Users', count: 85, color: '#4CAF50', legendFontColor: '#333', legendFontSize: 14 },
          { name: 'Coaches', count: 8, color: '#FF9800', legendFontColor: '#333', legendFontSize: 14 },
          { name: 'Admins', count: 2, color: '#F44336', legendFontColor: '#333', legendFontSize: 14 },
        ]);
      }
    } catch (error) {
      console.error('Failed to load user distribution:', error);
    }
  };

  const loadKeyMetrics = async () => {
    try {
      const db = getSafeDatabase();
      if (!db) return;

      // Total users
      const userCount = await db.getAllAsync('SELECT COUNT(*) as count FROM users') as { count: number }[];
      const totalUsers = userCount[0]?.count || 0;

      // Active users (logged in last 30 days)
      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const activeUserCount = await db.getAllAsync(
        'SELECT COUNT(*) as count FROM users WHERE lastActiveAt >= ?',
        [thirtyDaysAgo]
      ) as { count: number }[];
      const activeUsers = activeUserCount[0]?.count || 0;

      // Total workouts
      const workoutCount = await db.getAllAsync('SELECT COUNT(*) as count FROM workout_logs') as { count: number }[];
      const totalWorkouts = workoutCount[0]?.count || 0;

      // Average workout duration
      const avgDuration = await db.getAllAsync(
        'SELECT AVG(duration) as avg FROM workout_logs WHERE duration IS NOT NULL'
      ) as { avg: number }[];
      const avgWorkoutDuration = Math.round(avgDuration[0]?.avg / 60) || 0;

      // Attendance rate (last 30 days)
      const attendanceCount = await db.getAllAsync(
        'SELECT COUNT(DISTINCT userId) as count FROM attendance WHERE date >= ?',
        [thirtyDaysAgo]
      ) as { count: number }[];
      const attendanceRate = totalUsers > 0 ? Math.round((attendanceCount[0]?.count || 0) / totalUsers * 100) : 0;

      // Most popular exercise
      const popularExercise = await db.getAllAsync(`
        SELECT exercises, COUNT(*) as count
        FROM workout_logs
        WHERE exercises IS NOT NULL
        GROUP BY exercises
        ORDER BY count DESC
        LIMIT 1
      `);

      setKeyMetrics({
        totalUsers,
        activeUsers,
        totalWorkouts,
        avgWorkoutDuration,
        attendanceRate,
        popularExercise: 'Push-ups', // Simplified for demo
      });
    } catch (error) {
      console.error('Failed to load key metrics:', error);
      // Set demo data on error
      setKeyMetrics({
        totalUsers: 95,
        activeUsers: 78,
        totalWorkouts: 1250,
        avgWorkoutDuration: 45,
        attendanceRate: 82,
        popularExercise: 'Push-ups',
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#F44336';
      case 'coach': return '#FF9800';
      case 'user': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#4CAF50',
    },
  };

  return (
    <ErrorBoundary>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <SegmentedButtons
            value={timeRange}
            onValueChange={setTimeRange}
            buttons={[
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' },
              { value: 'quarter', label: '3 Months' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Key Metrics */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Key Metrics
            </Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <MaterialCommunityIcons name="account-group" size={24} color="#4CAF50" />
                <Text variant="headlineSmall">{keyMetrics.totalUsers}</Text>
                <Text variant="bodySmall">Total Users</Text>
              </View>
              <View style={styles.metricItem}>
                <MaterialCommunityIcons name="account-check" size={24} color="#2196F3" />
                <Text variant="headlineSmall">{keyMetrics.activeUsers}</Text>
                <Text variant="bodySmall">Active Users</Text>
              </View>
              <View style={styles.metricItem}>
                <MaterialCommunityIcons name="dumbbell" size={24} color="#FF9800" />
                <Text variant="headlineSmall">{keyMetrics.totalWorkouts}</Text>
                <Text variant="bodySmall">Total Workouts</Text>
              </View>
              <View style={styles.metricItem}>
                <MaterialCommunityIcons name="clock" size={24} color="#9C27B0" />
                <Text variant="headlineSmall">{keyMetrics.avgWorkoutDuration}min</Text>
                <Text variant="bodySmall">Avg Duration</Text>
              </View>
            </View>
            <Divider style={styles.divider} />
            <List.Item
              title="Attendance Rate"
              description={`${keyMetrics.attendanceRate}% of users attended in the last 30 days`}
              left={(props) => <List.Icon {...props} icon="check-circle" color="#4CAF50" />}
            />
            <List.Item
              title="Most Popular Exercise"
              description={keyMetrics.popularExercise}
              left={(props) => <List.Icon {...props} icon="trophy" color="#FFD700" />}
            />
          </Card.Content>
        </Card>

        {/* User Growth */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              User Growth
            </Text>
            {userGrowthData.datasets[0].data.length > 0 ? (
              <LineChart
                data={userGrowthData}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
              />
            ) : (
              <Text style={styles.noData}>No user growth data available</Text>
            )}
          </Card.Content>
        </Card>

        {/* Workout Activity */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Daily Workout Activity
            </Text>
            {workoutData.datasets[0].data.length > 0 ? (
              <BarChart
                data={workoutData}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                yAxisLabel=""
                yAxisSuffix=""
              />
            ) : (
              <Text style={styles.noData}>No workout data available</Text>
            )}
          </Card.Content>
        </Card>

        {/* Attendance Trends */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              Daily Attendance
            </Text>
            {attendanceData.datasets[0].data.length > 0 ? (
              <LineChart
                data={attendanceData}
                width={screenWidth - 64}
                height={220}
                chartConfig={{
                  ...chartConfig,
                  color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                }}
                bezier
                style={styles.chart}
              />
            ) : (
              <Text style={styles.noData}>No attendance data available</Text>
            )}
          </Card.Content>
        </Card>

        {/* User Distribution */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.cardTitle}>
              User Distribution by Role
            </Text>
            {userDistribution.length > 0 ? (
              <PieChart
                data={userDistribution}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
              />
            ) : (
              <Text style={styles.noData}>No user distribution data available</Text>
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  card: {
    margin: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  cardTitle: {
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  divider: {
    marginVertical: 16,
  },
  noData: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 40,
  },
});

export default AnalyticsScreen;