import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

interface QuickStat {
  icon: string;
  label: string;
  labelHe: string;
  value: string;
  color: string;
}

interface FeatureCard {
  id: string;
  icon: string;
  title: string;
  titleHe: string;
  description: string;
  descriptionHe: string;
  color: string;
  route: string;
}

export default function FootballTraining2Screen() {
  const { isDark } = useTheme();
  const { t, language } = useLanguage();
  const navigation = useNavigation();

  const quickStats: QuickStat[] = [
    {
      icon: 'fire',
      label: 'Workouts This Week',
      labelHe: 'אימונים השבוע',
      value: '4/5',
      color: '#FF6B35',
    },
    {
      icon: 'timer',
      label: 'Total Time',
      labelHe: 'זמן כולל',
      value: '3.2h',
      color: '#22C55E',
    },
    {
      icon: 'trophy',
      label: 'Streak',
      labelHe: 'רצף',
      value: '12 days',
      color: '#FFB800',
    },
    {
      icon: 'chart-line',
      label: 'Progress',
      labelHe: 'התקדמות',
      value: '+15%',
      color: '#8B5CF6',
    },
  ];

  const features: FeatureCard[] = [
    {
      id: 'training_programs',
      icon: 'soccer',
      title: 'Training Programs',
      titleHe: 'תוכניות אימון',
      description: 'Access 45+ professional football workouts',
      descriptionHe: 'גישה ל-45+ אימוני כדורגל מקצועיים',
      color: '#FF6B35',
      route: 'FootballMain',
    },
    {
      id: 'performance_tracking',
      icon: 'chart-timeline-variant',
      title: 'Performance Tracking',
      titleHe: 'מעקב ביצועים',
      description: 'Track speed, agility, and power metrics',
      descriptionHe: 'מעקב אחר מדדי מהירות, זריזות וכוח',
      color: '#22C55E',
      route: 'PerformanceTracking',
    },
    {
      id: 'workout_history',
      icon: 'history',
      title: 'Workout History',
      titleHe: 'היסטוריית אימונים',
      description: 'View all your completed training sessions',
      descriptionHe: 'צפייה בכל מפגשי האימון שהושלמו',
      color: '#3B82F6',
      route: 'WorkoutHistory',
    },
    {
      id: 'personal_records',
      icon: 'medal',
      title: 'Personal Records',
      titleHe: 'שיאים אישיים',
      description: 'Track your sprint times and best performances',
      descriptionHe: 'מעקב אחר זמני ספרינט וביצועים מיטביים',
      color: '#FFB800',
      route: 'FootballRecords',
    },
    {
      id: 'training_calendar',
      icon: 'calendar-month',
      title: 'Training Calendar',
      titleHe: 'לוח אימונים',
      description: 'Plan your weekly football training schedule',
      descriptionHe: 'תכנון לוח אימוני הכדורגל השבועי',
      color: '#8B5CF6',
      route: 'TrainingCalendar',
    },
    {
      id: 'custom_workouts',
      icon: 'plus-circle',
      title: 'Custom Workouts',
      titleHe: 'אימונים מותאמים אישית',
      description: 'Create your own football training routines',
      descriptionHe: 'יצירת שגרות אימון כדורגל משלך',
      color: '#EC4899',
      route: 'CustomWorkout',
    },
    {
      id: 'video_library',
      icon: 'video',
      title: 'Exercise Videos',
      titleHe: 'סרטוני תרגילים',
      description: 'Watch proper form demonstrations',
      descriptionHe: 'צפייה בהדגמות טכניקה נכונה',
      color: '#F59E0B',
      route: 'VideoLibrary',
    },
    {
      id: 'progress_analytics',
      icon: 'chart-box',
      title: 'Analytics Dashboard',
      titleHe: 'לוח מחוונים',
      description: 'Detailed insights into your training progress',
      descriptionHe: 'תובנות מפורטות על התקדמות האימונים',
      color: '#10B981',
      route: 'Analytics',
    },
  ];

  const handleFeaturePress = (route: string) => {
    if (route === 'FootballMain') {
      navigation.navigate('FootballMain' as never);
    } else {
      // Placeholder for future screens
      console.log('Navigate to:', route);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F5F5F5' }]}>
      {/* Header */}
      <LinearGradient
        colors={['#FF6B35', '#FF8C5A']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {language === 'he' ? 'כדורגל 2.0' : 'Football Training 2.0'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {language === 'he' ? 'מערכת אימון מקצועית' : 'Professional Training System'}
          </Text>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <MaterialCommunityIcons name="cog" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          {quickStats.map((stat, index) => (
            <View
              key={index}
              style={[
                styles.statCard,
                {
                  backgroundColor: isDark ? '#1E1E1E' : 'white',
                },
              ]}
            >
              <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}20` }]}>
                <MaterialCommunityIcons name={stat.icon as any} size={24} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: isDark ? 'white' : '#1A1A1A' }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: isDark ? '#B0B0B0' : '#666' }]}>
                {language === 'he' ? stat.labelHe : stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Features Grid */}
        <View style={styles.featuresContainer}>
          <Text style={[styles.sectionTitle, { color: isDark ? 'white' : '#1A1A1A' }]}>
            {language === 'he' ? 'תכונות' : 'Features'}
          </Text>

          <View style={styles.featuresGrid}>
            {features.map((feature) => (
              <TouchableOpacity
                key={feature.id}
                style={[
                  styles.featureCard,
                  {
                    backgroundColor: isDark ? '#1E1E1E' : 'white',
                  },
                ]}
                onPress={() => handleFeaturePress(feature.route)}
                activeOpacity={0.7}
              >
                <View style={[styles.featureIconContainer, { backgroundColor: `${feature.color}20` }]}>
                  <MaterialCommunityIcons name={feature.icon as any} size={32} color={feature.color} />
                </View>
                <Text style={[styles.featureTitle, { color: isDark ? 'white' : '#1A1A1A' }]}>
                  {language === 'he' ? feature.titleHe : feature.title}
                </Text>
                <Text style={[styles.featureDescription, { color: isDark ? '#B0B0B0' : '#666' }]}>
                  {language === 'he' ? feature.descriptionHe : feature.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Action Button */}
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('FootballMain' as never)}
        >
          <LinearGradient
            colors={['#FF6B35', '#FF8C5A']}
            style={styles.quickActionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaterialCommunityIcons name="play-circle" size={28} color="white" />
            <Text style={styles.quickActionText}>
              {language === 'he' ? 'התחל אימון עכשיו' : 'Start Training Now'}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={24} color="white" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginTop: -20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    textAlign: 'center',
  },
  featuresContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  featureCard: {
    width: (width - 50) / 2,
    marginHorizontal: 5,
    marginBottom: 15,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  featureDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  quickActionButton: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  quickActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  quickActionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 12,
  },
});
