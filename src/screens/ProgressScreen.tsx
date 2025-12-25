import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import {
  addWeightEntry,
  getWeightHistory,
  addMeasurementEntry,
  getMeasurementHistory,
  getStreakData,
  getAchievements,
  getUserLevel,
  WeightEntry,
  MeasurementEntry,
  StreakData,
  Achievement,
} from '../services/progressTrackingService';
import CustomHeader from '../components/CustomHeader';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

const { width } = Dimensions.get('window');

const ProgressScreen = () => {
  const navigation = useNavigation();
  const { isDark, colors } = useTheme();
  const { t } = useLanguage();

  // Generate styles with theme colors
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'weight' | 'measurements' | 'photos' | 'achievements'>('weight');

  // Weight tracking states
  const [weightHistory, setWeightHistory] = useState<WeightEntry[]>([]);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');

  // Measurement states
  const [measurementHistory, setMeasurementHistory] = useState<MeasurementEntry[]>([]);
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [measurements, setMeasurements] = useState({
    chest: '',
    waist: '',
    hips: '',
    arms: '',
    thighs: '',
    calves: '',
  });

  // Streak and achievement states
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userLevel, setUserLevel] = useState({ level: 1, experience: 0, nextLevelXP: 100 });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    await loadWeightData();
    await loadMeasurementData();
    await loadStreakAndAchievements();
  };

  const loadWeightData = async () => {
    const history = await getWeightHistory(30);
    setWeightHistory(history);
  };

  const loadMeasurementData = async () => {
    const history = await getMeasurementHistory(10);
    setMeasurementHistory(history);
  };

  const loadStreakAndAchievements = async () => {
    const [streaks, achievs, level] = await Promise.all([
      getStreakData(),
      getAchievements(),
      getUserLevel(),
    ]);
    setStreakData(streaks);
    setAchievements(achievs);
    setUserLevel(level);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const handleAddWeight = async () => {
    if (!newWeight) {
      Alert.alert(t('alert.error'), t('progress.weightError'));
      return;
    }

    try {
      await addWeightEntry(parseFloat(newWeight), weightUnit);
      setShowWeightModal(false);
      setNewWeight('');
      await loadWeightData();
      Alert.alert(t('alert.success'), t('progress.weightAdded'));
    } catch (error) {
      Alert.alert(t('alert.error'), t('alert.error'));
    }
  };

  const handleAddMeasurements = async () => {
    const measurementData: any = {};
    let hasData = false;

    Object.entries(measurements).forEach(([key, value]) => {
      if (value) {
        measurementData[key] = parseFloat(value);
        hasData = true;
      }
    });

    if (!hasData) {
      Alert.alert(t('alert.error'), t('progress.measurementError'));
      return;
    }

    try {
      await addMeasurementEntry(measurementData, 'cm');
      setShowMeasurementModal(false);
      setMeasurements({
        chest: '',
        waist: '',
        hips: '',
        arms: '',
        thighs: '',
        calves: '',
      });
      await loadMeasurementData();
      Alert.alert(t('alert.success'), t('progress.measurementAdded'));
    } catch (error) {
      Alert.alert(t('alert.error'), t('alert.error'));
    }
  };

  const getWeightChartData = () => {
    if (weightHistory.length === 0) {
      return null;
    }

    const recentData = weightHistory.slice(0, 7).reverse();

    return {
      labels: recentData.map(entry => {
        const date = new Date(entry.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      datasets: [{
        data: recentData.map(entry => entry.weight),
      }],
    };
  };

  const renderWeightTab = () => {
    const chartData = getWeightChartData();
    const latestWeight = weightHistory[0];
    const previousWeight = weightHistory[1];
    const weightChange = latestWeight && previousWeight
      ? latestWeight.weight - previousWeight.weight
      : 0;

    return (
      <View style={styles.tabContent}>
        {/* Current Weight Card */}
        <LinearGradient
          colors={['#FF6B35', '#FF8E53']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.currentWeightCard}
        >
          <View style={styles.weightCardHeader}>
            <Text style={styles.currentWeightLabel}>{t('progress.currentWeight')}</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowWeightModal(true)}
            >
              <MaterialCommunityIcons name="plus" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {latestWeight ? (
            <>
              <Text style={styles.currentWeight}>
                {latestWeight.weight} {latestWeight.unit}
              </Text>
              <View style={styles.weightChangeContainer}>
                <MaterialCommunityIcons
                  name={weightChange > 0 ? 'trending-up' : weightChange < 0 ? 'trending-down' : 'minus'}
                  size={20}
                  color="white"
                />
                <Text style={styles.weightChange}>
                  {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} {latestWeight.unit}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.noDataText}>{t('progress.noWeightData')}</Text>
          )}
        </LinearGradient>

        {/* Weight Chart */}
        {chartData && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>{t('progress.weightTrend')}</Text>
            <LineChart
              data={chartData}
              width={width - 40}
              height={200}
              yAxisSuffix={` ${latestWeight?.unit || 'kg'}`}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(255, 107, 53, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#FF6B35',
                },
              }}
              bezier
              style={styles.chart}
            />
          </View>
        )}

        {/* Weight History */}
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>{t('progress.recentEntries')}</Text>
          {weightHistory.slice(0, 5).map((entry, index) => (
            <View key={entry.id} style={styles.historyItem}>
              <Text style={styles.historyDate}>
                {new Date(entry.date).toLocaleDateString()}
              </Text>
              <Text style={styles.historyValue}>
                {entry.weight} {entry.unit}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderMeasurementsTab = () => {
    const latest = measurementHistory[0];

    return (
      <View style={styles.tabContent}>
        <TouchableOpacity
          style={styles.measurementAddCard}
          onPress={() => setShowMeasurementModal(true)}
        >
          <MaterialCommunityIcons name="tape-measure" size={48} color="#FF6B35" />
          <Text style={styles.measurementAddText}>{t('progress.addMeasurements')}</Text>
        </TouchableOpacity>

        {latest && (
          <View style={styles.measurementCard}>
            <Text style={styles.measurementTitle}>{t('progress.latestMeasurements')}</Text>
            <Text style={styles.measurementDate}>
              {new Date(latest.date).toLocaleDateString()}
            </Text>

            <View style={styles.measurementGrid}>
              {Object.entries(latest.measurements).map(([key, value]) => (
                <View key={key} style={styles.measurementItem}>
                  <Text style={styles.measurementLabel}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </Text>
                  <Text style={styles.measurementValue}>{value} {latest.unit}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderAchievementsTab = () => {
    const unlockedAchievements = achievements.filter(a => a.unlockedAt);
    const lockedAchievements = achievements.filter(a => !a.unlockedAt);

    return (
      <ScrollView style={styles.tabContent}>
        {/* Level & Streaks Card */}
        <LinearGradient
          colors={['#E94E1B', '#44A08D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.levelCard}
        >
          <View style={styles.levelHeader}>
            <Text style={styles.levelTitle}>{t('progress.level')} {userLevel.level}</Text>
            <Text style={styles.experienceText}>
              {userLevel.experience} / {userLevel.nextLevelXP} XP
            </Text>
          </View>

          <View style={styles.experienceBar}>
            <View
              style={[
                styles.experienceFill,
                { width: `${(userLevel.experience / userLevel.nextLevelXP) * 100}%` }
              ]}
            />
          </View>

          {streakData && (
            <View style={styles.streakContainer}>
              <View style={styles.streakItem}>
                <MaterialCommunityIcons name="fire" size={24} color="white" />
                <Text style={styles.streakValue}>{streakData.workoutStreak}</Text>
                <Text style={styles.streakLabel}>{t('progress.workoutStreak')}</Text>
              </View>
              <View style={styles.streakItem}>
                <MaterialCommunityIcons name="food-apple" size={24} color="white" />
                <Text style={styles.streakValue}>{streakData.nutritionStreak}</Text>
                <Text style={styles.streakLabel}>{t('progress.nutritionStreak')}</Text>
              </View>
              <View style={styles.streakItem}>
                <MaterialCommunityIcons name="trophy" size={24} color="white" />
                <Text style={styles.streakValue}>{streakData.totalWorkouts}</Text>
                <Text style={styles.streakLabel}>{t('progress.totalWorkouts')}</Text>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Achievements */}
        <View style={styles.achievementsSection}>
          <Text style={styles.achievementsTitle}>{t('progress.achievements')}</Text>

          {unlockedAchievements.length > 0 && (
            <>
              <Text style={styles.achievementSubtitle}>{t('progress.unlocked')}</Text>
              <View style={styles.achievementGrid}>
                {unlockedAchievements.map(achievement => (
                  <View key={achievement.id} style={styles.achievementCard}>
                    <View style={[styles.achievementIcon, { backgroundColor: '#E94E1B' }]}>
                      <MaterialCommunityIcons
                        name={achievement.icon as any}
                        size={28}
                        color="white"
                      />
                    </View>
                    <Text style={styles.achievementName}>{achievement.title}</Text>
                    <Text style={styles.achievementDesc}>{achievement.description}</Text>
                    {achievement.level && (
                      <View style={[styles.achievementLevel, styles[achievement.level]]}>
                        <Text style={styles.achievementLevelText}>{achievement.level}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </>
          )}

          <Text style={styles.achievementSubtitle}>{t('progress.locked')}</Text>
          <View style={styles.achievementGrid}>
            {lockedAchievements.map(achievement => (
              <View key={achievement.id} style={[styles.achievementCard, styles.lockedCard]}>
                <View style={[styles.achievementIcon, { backgroundColor: '#9E9E9E' }]}>
                  <MaterialCommunityIcons
                    name={achievement.icon as any}
                    size={28}
                    color="white"
                  />
                </View>
                <Text style={[styles.achievementName, { color: '#999' }]}>
                  {achievement.title}
                </Text>
                <Text style={[styles.achievementDesc, { color: '#999' }]}>
                  {achievement.description}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: '#2A2A2A' }]}>
      <CustomHeader />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: '#2A2A2A' }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>{t('progress.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('progress.subtitle')}</Text>
          </View>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => (navigation as any).navigate('ExportData')}
          >
            <MaterialCommunityIcons name="download" size={24} color="#E94E1B" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'weight' && styles.activeTab]}
          onPress={() => setActiveTab('weight')}
        >
          <Text style={[styles.tabText, activeTab === 'weight' && styles.activeTabText]}>
            {t('progress.weight')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'measurements' && styles.activeTab]}
          onPress={() => setActiveTab('measurements')}
        >
          <Text style={[styles.tabText, activeTab === 'measurements' && styles.activeTabText]}>
            {t('progress.measurements')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'photos' && styles.activeTab]}
          onPress={() => (navigation as any).navigate('ProgressPhotos')}
        >
          <Text style={[styles.tabText, activeTab === 'photos' && styles.activeTabText]}>
            {t('progress.photos')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
          onPress={() => setActiveTab('achievements')}
        >
          <Text style={[styles.tabText, activeTab === 'achievements' && styles.activeTabText]}>
            {t('progress.achievements')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
            progressBackgroundColor={colors.card}
          />
        }
      >
        {activeTab === 'weight' && renderWeightTab()}
        {activeTab === 'measurements' && renderMeasurementsTab()}
        {activeTab === 'achievements' && renderAchievementsTab()}
      </ScrollView>

      {/* Weight Entry Modal */}
      <Modal
        visible={showWeightModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowWeightModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('progress.addWeightEntry')}</Text>

            <TextInput
              style={styles.input}
              placeholder={t('progress.enterWeight')}
              value={newWeight}
              onChangeText={setNewWeight}
              keyboardType="decimal-pad"
            />

            <View style={styles.unitSelector}>
              <TouchableOpacity
                style={[styles.unitButton, weightUnit === 'kg' && styles.unitButtonActive]}
                onPress={() => setWeightUnit('kg')}
              >
                <Text style={[styles.unitText, weightUnit === 'kg' && styles.unitTextActive]}>
                  kg
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.unitButton, weightUnit === 'lbs' && styles.unitButtonActive]}
                onPress={() => setWeightUnit('lbs')}
              >
                <Text style={[styles.unitText, weightUnit === 'lbs' && styles.unitTextActive]}>
                  lbs
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowWeightModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('alert.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddWeight}
              >
                <Text style={styles.saveButtonText}>{t('general.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Measurement Entry Modal */}
      <Modal
        visible={showMeasurementModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMeasurementModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('progress.addMeasurements')}</Text>

            <ScrollView style={styles.measurementInputs}>
              {Object.keys(measurements).map(key => (
                <View key={key} style={styles.measurementInputRow}>
                  <Text style={styles.measurementInputLabel}>
                    {key.charAt(0).toUpperCase() + key.slice(1)} (cm)
                  </Text>
                  <TextInput
                    style={styles.measurementInput}
                    placeholder="0"
                    value={measurements[key as keyof typeof measurements]}
                    onChangeText={(value) => setMeasurements({
                      ...measurements,
                      [key]: value
                    })}
                    keyboardType="decimal-pad"
                  />
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowMeasurementModal(false)}
              >
                <Text style={styles.cancelButtonText}>{t('alert.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddMeasurements}
              >
                <Text style={styles.saveButtonText}>{t('general.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1A1F36',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  exportButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4E4E50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF6B35',
  },
  tabText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FF6B35',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  currentWeightCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  weightCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentWeightLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentWeight: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  weightChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightChange: {
    fontSize: 18,
    color: 'white',
    marginLeft: 8,
  },
  noDataText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 20,
  },
  chartCard: {
    backgroundColor: '#4E4E50',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1F36',
    marginBottom: 16,
  },
  chart: {
    marginLeft: -20,
  },
  historyCard: {
    backgroundColor: '#4E4E50',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1F36',
    marginBottom: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
  },
  historyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1F36',
  },
  measurementAddCard: {
    backgroundColor: '#4E4E50',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
  },
  measurementAddText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B35',
    marginTop: 12,
  },
  measurementCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  measurementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1F36',
    marginBottom: 8,
  },
  measurementDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  measurementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  measurementItem: {
    width: '45%',
  },
  measurementLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  measurementValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1F36',
  },
  levelCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  experienceText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  experienceBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 24,
  },
  experienceFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  streakItem: {
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  streakLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  achievementsSection: {
    marginBottom: 20,
  },
  achievementsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1F36',
    marginBottom: 20,
  },
  achievementSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  achievementCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: (width - 52) / 3,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  lockedCard: {
    opacity: 0.6,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1F36',
    textAlign: 'center',
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  achievementLevel: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 8,
  },
  achievementLevelText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  bronze: {
    backgroundColor: '#CD7F32',
  },
  silver: {
    backgroundColor: '#C0C0C0',
  },
  gold: {
    backgroundColor: '#FFD700',
  },
  platinum: {
    backgroundColor: '#E5E4E2',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1F36',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  unitText: {
    fontSize: 16,
    color: '#666',
  },
  unitTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
  },
  saveButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  measurementInputs: {
    maxHeight: 300,
  },
  measurementInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  measurementInputLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  measurementInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 8,
    fontSize: 16,
    width: 80,
    textAlign: 'center',
  },
});

export default ProgressScreen;