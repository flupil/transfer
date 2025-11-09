import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Card,
  Button,
  ProgressBar,
  List,
  Badge,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getSafeDatabase } from '../database/databaseHelper';
import { Attendance } from '../types';

interface AttendanceStats {
  thisWeek: number;
  thisMonth: number;
  streak: number;
  totalHours: number;
}

const AttendanceScreen = ({ navigation }: any) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [currentAttendance, setCurrentAttendance] = useState<Attendance | null>(null);
  const [todayHistory, setTodayHistory] = useState<Attendance[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<AttendanceStats>({
    thisWeek: 0,
    thisMonth: 0,
    streak: 0,
    totalHours: 0,
  });
  const [weeklyAttendance, setWeeklyAttendance] = useState<{ [date: string]: Attendance[] }>({});

  useEffect(() => {
    loadAttendanceData();
  }, []);

  const loadAttendanceData = async () => {
    if (!user) return;

    const db = getSafeDatabase();
    if (!db) return;

    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Check current check-in status
      const todayAttendance = await db.getAllAsync(
        'SELECT * FROM attendance WHERE userId = ? AND date = ? ORDER BY checkInTime DESC',
        [user.id, today]
      ) as any[];

      if (todayAttendance.length > 0) {
        const currentRecord = todayAttendance[0];
        setCurrentAttendance(currentRecord);
        setIsCheckedIn(!currentRecord.checkOutTime);
        setTodayHistory(todayAttendance.map(record => ({
          ...record,
          date: new Date(record.date),
          checkInTime: new Date(record.checkInTime),
          checkOutTime: record.checkOutTime ? new Date(record.checkOutTime) : undefined,
          createdAt: new Date(record.createdAt),
        })));
      } else {
        setCurrentAttendance(null);
        setIsCheckedIn(false);
        setTodayHistory([]);
      }

      // Load weekly stats
      await loadWeeklyStats();
      await loadWeeklyAttendance();
    } catch (error) {
      console.error('Failed to load attendance data:', error);
    }
  };

  const loadWeeklyStats = async () => {
    if (!user) return;

    const db = getSafeDatabase();
    if (!db) return;

    try {
      const now = new Date();
      const startOfThisWeek = format(startOfWeek(now), 'yyyy-MM-dd');
      const endOfThisWeek = format(endOfWeek(now), 'yyyy-MM-dd');
      const startOfThisMonth = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');

      // This week attendance
      const weekAttendance = await db.getAllAsync(
        'SELECT DISTINCT date FROM attendance WHERE userId = ? AND date BETWEEN ? AND ? AND checkOutTime IS NOT NULL',
        [user.id, startOfThisWeek, endOfThisWeek]
      ) as any[];

      // This month attendance
      const monthAttendance = await db.getAllAsync(
        'SELECT DISTINCT date FROM attendance WHERE userId = ? AND date >= ? AND checkOutTime IS NOT NULL',
        [user.id, startOfThisMonth]
      ) as any[];

      // Calculate total hours this week
      const weekHours = await db.getAllAsync(
        `SELECT SUM((julianday(checkOutTime) - julianday(checkInTime)) * 24) as totalHours
         FROM attendance
         WHERE userId = ? AND date BETWEEN ? AND ? AND checkOutTime IS NOT NULL`,
        [user.id, startOfThisWeek, endOfThisWeek]
      ) as any[];

      // Calculate streak (consecutive days)
      const recentAttendance = await db.getAllAsync(
        'SELECT DISTINCT date FROM attendance WHERE userId = ? AND checkOutTime IS NOT NULL ORDER BY date DESC LIMIT 30',
        [user.id]
      ) as any[];

      let streak = 0;
      const today = format(new Date(), 'yyyy-MM-dd');
      let checkDate = today;

      for (const record of recentAttendance) {
        if (record.date === checkDate) {
          streak++;
          const prevDay = new Date(checkDate);
          prevDay.setDate(prevDay.getDate() - 1);
          checkDate = format(prevDay, 'yyyy-MM-dd');
        } else {
          break;
        }
      }

      setWeeklyStats({
        thisWeek: weekAttendance.length,
        thisMonth: monthAttendance.length,
        streak,
        totalHours: weekHours[0]?.totalHours || 0,
      });
    } catch (error) {
      console.error('Failed to load weekly stats:', error);
    }
  };

  const loadWeeklyAttendance = async () => {
    if (!user) return;

    const db = getSafeDatabase();
    if (!db) return;

    try {
      const now = new Date();
      const startOfThisWeek = startOfWeek(now);
      const endOfThisWeek = endOfWeek(now);
      const weekDays = eachDayOfInterval({ start: startOfThisWeek, end: endOfThisWeek });

      const weeklyData: { [date: string]: Attendance[] } = {};

      for (const day of weekDays) {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayAttendance = await db.getAllAsync(
          'SELECT * FROM attendance WHERE userId = ? AND date = ? ORDER BY checkInTime',
          [user.id, dateStr]
        ) as any[];

        weeklyData[dateStr] = dayAttendance.map(record => ({
          ...record,
          date: new Date(record.date),
          checkInTime: new Date(record.checkInTime),
          checkOutTime: record.checkOutTime ? new Date(record.checkOutTime) : undefined,
          createdAt: new Date(record.createdAt),
        }));
      }

      setWeeklyAttendance(weeklyData);
    } catch (error) {
      console.error('Failed to load weekly attendance:', error);
    }
  };

  const handleCheckIn = async () => {
    if (!user) return;

    const db = getSafeDatabase();
    if (!db) return;

    try {
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      const id = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await db.runAsync(
        `INSERT INTO attendance (id, userId, date, checkInTime, method, locationVerified, createdAt, syncStatus)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, user.id, today, now.toISOString(), 'manual', 1, now.toISOString(), 'pending']
      );

      setIsCheckedIn(true);
      setCurrentAttendance({
        id,
        userId: user.id,
        date: now,
        checkInTime: now,
        method: 'manual',
        locationVerified: true,
        createdAt: now,
      });

      await loadAttendanceData();
      Alert.alert(t('alert.success'), t('attendance.checkInSuccess'));
    } catch (error) {
      console.error('Failed to check in:', error);
      Alert.alert(t('alert.error'), t('attendance.checkInFailed'));
    }
  };

  const handleCheckOut = async () => {
    if (!user || !currentAttendance) return;

    const db = getSafeDatabase();
    if (!db) return;

    try {
      const now = new Date();

      await db.runAsync(
        'UPDATE attendance SET checkOutTime = ?, syncStatus = ? WHERE id = ?',
        [now.toISOString(), 'pending', currentAttendance.id]
      );

      setIsCheckedIn(false);
      setCurrentAttendance({
        ...currentAttendance,
        checkOutTime: now,
      });

      await loadAttendanceData();
      Alert.alert(t('alert.success'), t('attendance.checkOutSuccess'));
    } catch (error) {
      console.error('Failed to check out:', error);
      Alert.alert(t('alert.error'), t('attendance.checkOutFailed'));
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadAttendanceData();
    } catch (error) {
      console.log('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = () => {
    return isCheckedIn ? '#4CAF50' : '#757575';
  };

  const getStatusText = () => {
    if (isCheckedIn && currentAttendance) {
      const duration = Math.floor((new Date().getTime() - currentAttendance.checkInTime.getTime()) / (1000 * 60));
      return `${t('attendance.checkedIn')} (${Math.floor(duration / 60)}h ${duration % 60}m)`;
    }
    return t('attendance.notCheckedIn');
  };

  const formatDuration = (checkInTime: Date, checkOutTime?: Date) => {
    const endTime = checkOutTime || new Date();
    const duration = Math.floor((endTime.getTime() - checkInTime.getTime()) / (1000 * 60));
    return `${Math.floor(duration / 60)}h ${duration % 60}m`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#FF6B35']}
          tintColor="#FF6B35"
          progressBackgroundColor="#FFFFFF"
        />
      }
    >
      {/* Current Status Card */}
      <Card style={styles.card}>
        <Card.Title
          title={t('attendance.currentStatus')}
          left={(props) => (
            <MaterialCommunityIcons
              {...props}
              name={isCheckedIn ? 'check-circle' : 'clock-outline'}
              color={getStatusColor()}
              size={24}
            />
          )}
        />
        <Card.Content>
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
            {isCheckedIn && currentAttendance && (
              <Text style={styles.checkInTime}>
                Since {format(currentAttendance.checkInTime, 'h:mm a')}
              </Text>
            )}
          </View>

          <Button
            mode="contained"
            onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
            style={[styles.actionButton, { backgroundColor: getStatusColor() }]}
            icon={isCheckedIn ? 'logout' : 'login'}
          >
            {isCheckedIn ? t('attendance.checkOut') : t('attendance.checkIn')}
          </Button>
        </Card.Content>
      </Card>

      {/* Today's History */}
      {todayHistory.length > 0 && (
        <Card style={styles.card}>
          <Card.Title
            title={t('attendance.todaysHistory')}
            left={(props) => <MaterialCommunityIcons {...props} name="history" size={24} />}
          />
          <Card.Content>
            {todayHistory.map((attendance, index) => (
              <View key={attendance.id} style={styles.historyItem}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTime}>
                    {format(attendance.checkInTime, 'h:mm a')} - {' '}
                    {attendance.checkOutTime
                      ? format(attendance.checkOutTime, 'h:mm a')
                      : 'In Progress'
                    }
                  </Text>
                  <Text style={styles.historyDuration}>
                    {formatDuration(attendance.checkInTime, attendance.checkOutTime)}
                  </Text>
                </View>
                <Badge visible={!attendance.checkOutTime} style={styles.activeBadge}>
                  Active
                </Badge>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Weekly Stats */}
      <Card style={styles.card}>
        <Card.Title
          title={t('attendance.weeklyStats')}
          left={(props) => <MaterialCommunityIcons {...props} name="chart-bar" size={24} />}
        />
        <Card.Content>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weeklyStats.thisWeek}</Text>
              <Text style={styles.statLabel}>{t('attendance.thisWeek')}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weeklyStats.thisMonth}</Text>
              <Text style={styles.statLabel}>This Month</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weeklyStats.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weeklyStats.totalHours.toFixed(1)}h</Text>
              <Text style={styles.statLabel}>Total Hours</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Weekly Overview */}
      <Card style={styles.card}>
        <Card.Title
          title={t('attendance.thisWeek')}
          left={(props) => <MaterialCommunityIcons {...props} name="calendar-week" size={24} />}
        />
        <Card.Content>
          {Object.entries(weeklyAttendance).map(([date, attendanceRecords]) => {
            const dayDate = new Date(date);
            const hasAttendance = attendanceRecords.length > 0;
            const completedSessions = attendanceRecords.filter(a => a.checkOutTime).length;

            return (
              <View key={date} style={styles.weeklyItem}>
                <View style={styles.dayInfo}>
                  <Text style={[
                    styles.dayName,
                    isToday(dayDate) && styles.todayText
                  ]}>
                    {format(dayDate, 'EEE')}
                  </Text>
                  <Text style={[
                    styles.dayDate,
                    isToday(dayDate) && styles.todayText
                  ]}>
                    {format(dayDate, 'd')}
                  </Text>
                </View>

                <View style={styles.attendanceIndicator}>
                  {hasAttendance ? (
                    <View style={styles.attendanceStats}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={20}
                        color="#4CAF50"
                      />
                      <Text style={styles.sessionsText}>
                        {completedSessions} session{completedSessions !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  ) : (
                    <MaterialCommunityIcons
                      name="minus-circle"
                      size={20}
                      color="#E0E0E0"
                    />
                  )}
                </View>
              </View>
            );
          })}
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  checkInTime: {
    fontSize: 14,
    color: '#666',
  },
  actionButton: {
    marginTop: 10,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyInfo: {
    flex: 1,
  },
  historyTime: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  historyDuration: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
  },
  statsGrid: {
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
  weeklyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dayInfo: {
    alignItems: 'center',
    minWidth: 50,
  },
  dayName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  dayDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 2,
  },
  todayText: {
    color: '#4CAF50',
  },
  attendanceIndicator: {
    flex: 1,
    alignItems: 'flex-end',
  },
  attendanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionsText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
});

export { AttendanceScreen };
export default AttendanceScreen;