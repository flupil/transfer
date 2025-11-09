import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format, subMonths } from 'date-fns';
import { useLanguage } from '../contexts/LanguageContext';

const { width } = Dimensions.get('window');

interface MonthlyStats {
  month: string;
  workouts: number;
  calories: number;
  weight: number;
  weightChange: number;
  attendance: number;
  topActivities: string[];
}

const MOCK_MONTHLY_DATA: MonthlyStats[] = [
  {
    month: format(new Date(), 'MMMM yyyy'),
    workouts: 18,
    calories: 8500,
    weight: 85.2,
    weightChange: -1.2,
    attendance: 75,
    topActivities: ['Upper Body', 'HIIT', 'Leg Day'],
  },
  {
    month: format(subMonths(new Date(), 1), 'MMMM yyyy'),
    workouts: 22,
    calories: 10200,
    weight: 86.4,
    weightChange: -0.8,
    attendance: 88,
    topActivities: ['Full Body', 'Core Blast', 'HIIT'],
  },
  {
    month: format(subMonths(new Date(), 2), 'MMMM yyyy'),
    workouts: 20,
    calories: 9500,
    weight: 87.2,
    weightChange: -1.5,
    attendance: 80,
    topActivities: ['Leg Day', 'Upper Body', 'Cardio'],
  },
];

const MonthlyReportsScreen: React.FC = () => {
  const { t } = useLanguage();
  const [selectedMonth, setSelectedMonth] = useState(0);
  const currentData = MOCK_MONTHLY_DATA[selectedMonth];

  const StatCard = ({ icon, value, label, color, trend }: any) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
      <View style={styles.statContent}>
        <View style={styles.statValueRow}>
          <Text style={styles.statValue}>{value}</Text>
          {trend && (
            <View style={[styles.trendBadge, { backgroundColor: trend > 0 ? '#E8F5E9' : '#FFEBEE' }]}>
              <MaterialCommunityIcons
                name={trend > 0 ? "trending-up" : "trending-down"}
                size={14}
                color={trend > 0 ? '#4CAF50' : '#F44336'}
              />
              <Text style={[styles.trendText, { color: trend > 0 ? '#4CAF50' : '#F44336' }]}>
                {Math.abs(trend)}%
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </View>
  );

  const generateReport = () => {
    // Placeholder for generating PDF or sharing report
    Alert.alert(t('monthlyReports.reportGenerated'), t('monthlyReports.reportGeneratedDesc'));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity
          onPress={() => setSelectedMonth(Math.min(selectedMonth + 1, MOCK_MONTHLY_DATA.length - 1))}
          disabled={selectedMonth === MOCK_MONTHLY_DATA.length - 1}
        >
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={selectedMonth === MOCK_MONTHLY_DATA.length - 1 ? '#ccc' : '#333'}
          />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{currentData.month}</Text>
        <TouchableOpacity
          onPress={() => setSelectedMonth(Math.max(selectedMonth - 1, 0))}
          disabled={selectedMonth === 0}
        >
          <MaterialCommunityIcons
            name="chevron-right"
            size={28}
            color={selectedMonth === 0 ? '#ccc' : '#333'}
          />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>{t('monthlyReports.monthlySummary')}</Text>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="fire" size={32} color="#FF6B6B" />
            <Text style={styles.summaryValue}>{currentData.calories.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>{t('monthlyReports.caloriesBurned')}</Text>
          </View>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="calendar-check" size={32} color="#4ECDC4" />
            <Text style={styles.summaryValue}>{currentData.attendance}%</Text>
            <Text style={styles.summaryLabel}>{t('monthlyReports.attendance')}</Text>
          </View>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="weight" size={32} color="#6C5CE7" />
            <Text style={styles.summaryValue}>{currentData.weight} kg</Text>
            <Text style={styles.summaryLabel}>{t('monthlyReports.currentWeight')}</Text>
          </View>
        </View>
      </View>

      {/* Detailed Stats */}
      <Text style={styles.sectionTitle}>{t('monthlyReports.detailedStatistics')}</Text>

      <StatCard
        icon="dumbbell"
        value={currentData.workouts}
        label={t('monthlyReports.totalWorkouts')}
        color="#4CAF50"
        trend={12}
      />

      <StatCard
        icon="fire"
        value={`${(currentData.calories / 1000).toFixed(1)}k`}
        label={t('monthlyReports.totalCaloriesBurned')}
        color="#FF6B6B"
        trend={8}
      />

      <StatCard
        icon="scale-bathroom"
        value={`${currentData.weightChange > 0 ? '+' : ''}${currentData.weightChange} kg`}
        label={t('monthlyReports.weightChange')}
        color={currentData.weightChange < 0 ? '#4CAF50' : '#FF6B6B'}
      />

      <StatCard
        icon="percent"
        value={`${currentData.attendance}%`}
        label={t('monthlyReports.gymAttendance')}
        color="#2196F3"
        trend={5}
      />

      {/* Top Activities */}
      <Text style={styles.sectionTitle}>{t('monthlyReports.topActivities')}</Text>
      <View style={styles.activitiesCard}>
        {currentData.topActivities.map((activity, index) => (
          <View key={index} style={styles.activityItem}>
            <View style={[styles.activityRank, { backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32' }]}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <Text style={styles.activityName}>{activity}</Text>
          </View>
        ))}
      </View>

      {/* Achievement Section */}
      <Text style={styles.sectionTitle}>{t('monthlyReports.monthlyAchievements')}</Text>
      <View style={styles.achievementsGrid}>
        <View style={styles.achievementCard}>
          <MaterialCommunityIcons name="trophy" size={32} color="#FFD700" />
          <Text style={styles.achievementTitle}>{t('monthlyReports.consistent')}</Text>
          <Text style={styles.achievementDesc}>{t('monthlyReports.consistentDesc')}</Text>
        </View>
        <View style={styles.achievementCard}>
          <MaterialCommunityIcons name="fire" size={32} color="#FF6B6B" />
          <Text style={styles.achievementTitle}>{t('monthlyReports.calorieCrusher')}</Text>
          <Text style={styles.achievementDesc}>{t('monthlyReports.calorieCrusherDesc')}</Text>
        </View>
        <View style={styles.achievementCard}>
          <MaterialCommunityIcons name="trending-down" size={32} color="#4CAF50" />
          <Text style={styles.achievementTitle}>{t('monthlyReports.weightLoss')}</Text>
          <Text style={styles.achievementDesc}>{t('monthlyReports.weightLossDesc')}</Text>
        </View>
      </View>

      {/* Progress Chart Placeholder */}
      <Text style={styles.sectionTitle}>{t('monthlyReports.progressOverview')}</Text>
      <View style={styles.chartCard}>
        <View style={styles.chartPlaceholder}>
          <MaterialCommunityIcons name="chart-line" size={48} color="#ccc" />
          <Text style={styles.chartPlaceholderText}>{t('monthlyReports.progressChart')}</Text>
        </View>
      </View>

      {/* Generate Report Button */}
      <TouchableOpacity style={styles.generateButton} onPress={generateReport}>
        <MaterialCommunityIcons name="file-download" size={24} color="white" />
        <Text style={styles.generateButtonText}>{t('monthlyReports.generateFullReport')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  summaryCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginBottom: 20,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginLeft: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  statCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statContent: {
    flex: 1,
    marginLeft: 16,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1C',
  },
  statLabel: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activitiesCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activityName: {
    fontSize: 16,
    color: '#1C1C1C',
  },
  achievementsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  achievementCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginTop: 8,
  },
  achievementDesc: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartPlaceholder: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  chartPlaceholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  generateButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    marginHorizontal: 20,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  generateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MonthlyReportsScreen;