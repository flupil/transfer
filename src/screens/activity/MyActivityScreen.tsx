import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import Svg, { Circle, Line, Text as SvgText, Rect, Defs, LinearGradient, Stop, Path, G } from 'react-native-svg';
import firebaseDailyDataService from '../../services/firebaseDailyDataService';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const { width } = Dimensions.get('window');

type TimeView = 'day' | 'week' | 'month';
type DataType = 'steps' | 'calories';

interface ActivityData {
  label: string;
  value: number;
  date: string;
}

const MyActivityScreen = () => {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [timeView, setTimeView] = useState<TimeView>('week');
  const [dataType, setDataType] = useState<DataType>('calories');
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [underlinePosition] = useState(new Animated.Value(1)); // 0=day, 1=week, 2=month
  const [barAnimations, setBarAnimations] = useState<Animated.Value[]>([]);
  const [selectedBarIndex, setSelectedBarIndex] = useState<number | null>(null);

  useEffect(() => {
    loadActivityData();
  }, [timeView, dataType, user?.id, currentDate]);

  useEffect(() => {
    // Animate underline when timeView changes
    const position = timeView === 'day' ? 0 : timeView === 'week' ? 1 : 2;
    Animated.spring(underlinePosition, {
      toValue: position,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [timeView]);

  const loadActivityData = async () => {
    if (!user?.id) return;

    try {
      const data: ActivityData[] = [];

      if (timeView === 'day') {
        // For day view, show hourly breakdown (simulated for now)
        const dateStr = currentDate.toISOString().split('T')[0];

        try {
          const dayData = await firebaseDailyDataService.getDailyDiary(user.id, dateStr);
          const totalValue = dataType === 'steps' ? dayData.steps.count : dayData.calories.consumed;

          // Distribute the total across hours (simulated hourly data)
          // You can replace this with real hourly data from Firebase when available
          const hourlyDistribution = [0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.10, 0.12, 0.11, 0.09, 0.07, 0.06, 0.05, 0.04, 0.03, 0.02, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01];

          for (let hour = 0; hour < 24; hour++) {
            data.push({
              label: `${hour}:00`,
              value: totalValue * hourlyDistribution[hour],
              date: dateStr,
            });
          }
        } catch {
          // If no data, create empty hourly data
          for (let hour = 0; hour < 24; hour++) {
            data.push({
              label: `${hour}:00`,
              value: 0,
              date: dateStr,
            });
          }
        }
      } else if (timeView === 'week') {
        // Get data for the week containing currentDate
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay()); // Start of week (Sunday)

        const days = [t('days.sunShort'), t('days.monShort'), t('days.tueShort'),
                      t('days.wedShort'), t('days.thuShort'), t('days.friShort'), t('days.satShort')];

        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStart);
          date.setDate(weekStart.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];

          try {
            const dayData = await firebaseDailyDataService.getDailyDiary(user.id, dateStr);
            const value = dataType === 'steps' ? dayData.steps.count : dayData.calories.consumed;
            data.push({
              label: days[i],
              value: value,
              date: dateStr,
            });
          } catch {
            // No data for this day
            data.push({
              label: days[i],
              value: 0,
              date: dateStr,
            });
          }
        }
      } else {
        // Month view - get data for each day of the month
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          const dateStr = date.toISOString().split('T')[0];

          try {
            const dayData = await firebaseDailyDataService.getDailyDiary(user.id, dateStr);
            const value = dataType === 'steps' ? dayData.steps.count : dayData.calories.consumed;
            data.push({
              label: `${day}`,
              value: value,
              date: dateStr,
            });
          } catch {
            // No data for this day
            data.push({
              label: `${day}`,
              value: 0,
              date: dateStr,
            });
          }
        }
      }

      setActivityData(data);

      // Initialize animations for bars
      const animations = data.map(() => new Animated.Value(0));
      setBarAnimations(animations);

      // Animate bars sequentially with stagger effect
      Animated.stagger(50, animations.map(anim =>
        Animated.spring(anim, {
          toValue: 1,
          useNativeDriver: false,
          tension: 50,
          friction: 7,
        })
      )).start();
    } catch (error) {
      console.error('Error loading activity data:', error);
      setActivityData([]);
    }
  };

  const handlePreviousDate = () => {
    const newDate = new Date(currentDate);
    if (timeView === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (timeView === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    setCurrentDate(newDate);
  };

  const handleNextDate = () => {
    const newDate = new Date(currentDate);
    if (timeView === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (timeView === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const getDateRangeText = () => {
    if (timeView === 'day') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(currentDate);
      selectedDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((selectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const dateStr = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (daysDiff === 0) {
        return `today, ${dayName}, ${dateStr}`;
      } else if (daysDiff === -1) {
        return `yesterday, ${dayName}, ${dateStr}`;
      } else {
        return `${dayName}, ${dateStr}`;
      }
    } else if (timeView === 'week') {
      const weekStart = new Date(currentDate);
      weekStart.setDate(currentDate.getDate() - currentDate.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long' });
    }
  };

  // Create smooth curve path
  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;

      path += ` Q ${controlX} ${current.y}, ${controlX} ${(current.y + next.y) / 2}`;
      path += ` Q ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }

    return path;
  };

  const renderBarChart = () => {
    if (activityData.length === 0 || barAnimations.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="trending-up-outline" size={48} color="#3C3C3E" />
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      );
    }

    const maxValue = Math.max(...activityData.map(d => d.value), 1);
    const barColor = dataType === 'calories' ? '#FF6B35' : '#4285F4';
    const todayStr = new Date().toISOString().split('T')[0];

    // Day view shows bars
    if (timeView === 'day') {
      const chartHeight = 200;
      const chartWidth = width - 60;
      const paddingTop = 30;
      const paddingBottom = 50;
      const totalHeight = chartHeight + paddingTop + paddingBottom;

      const numBars = activityData.length;
      const barSpacing = 3;
      const barWidth = (chartWidth - (numBars - 1) * barSpacing) / numBars;
      const maxBarWidth = 12;
      const finalBarWidth = Math.min(barWidth, maxBarWidth);

      const totalBarsWidth = numBars * finalBarWidth + (numBars - 1) * barSpacing;
      const startX = (chartWidth - totalBarsWidth) / 2;

      return (
        <View style={styles.chartContainer}>
          <Svg width={chartWidth} height={totalHeight}>
            <Defs>
              <LinearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={barColor} stopOpacity="1" />
                <Stop offset="1" stopColor={barColor} stopOpacity="0.6" />
              </LinearGradient>
            </Defs>

            {/* Grid lines */}
            {[0.5, 1].map((fraction) => {
              const y = paddingTop + chartHeight - (fraction * chartHeight);
              return (
                <G key={`grid-${fraction}`}>
                  <Line
                    x1={0}
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="#2C2C2E"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                    opacity="0.3"
                  />
                  <SvgText
                    x={5}
                    y={y + 4}
                    fontSize="10"
                    fill="#666"
                    textAnchor="start"
                  >
                    {Math.round(maxValue * fraction) > 999
                      ? `${(maxValue * fraction / 1000).toFixed(1)}k`
                      : Math.round(maxValue * fraction)}
                  </SvgText>
                </G>
              );
            })}

            {/* Baseline */}
            <Line
              x1={0}
              y1={paddingTop + chartHeight}
              x2={chartWidth}
              y2={paddingTop + chartHeight}
              stroke="#3C3C3E"
              strokeWidth="2"
            />

            {/* Bars */}
            {activityData.map((data, index) => {
              const barHeight = Math.max((data.value / maxValue) * chartHeight, 2);
              const x = startX + index * (finalBarWidth + barSpacing);
              const baseY = paddingTop + chartHeight;

              const animatedHeight = barAnimations[index]?.interpolate({
                inputRange: [0, 1],
                outputRange: [0, barHeight],
              }) || 0;

              const animatedY = barAnimations[index]?.interpolate({
                inputRange: [0, 1],
                outputRange: [baseY, baseY - barHeight],
              }) || baseY;

              const showLabel = index % 4 === 0;

              return (
                <G key={index}>
                  <AnimatedRect
                    x={x}
                    y={animatedY}
                    width={finalBarWidth}
                    height={animatedHeight}
                    fill="url(#barGradient)"
                    rx={2}
                  />

                  {showLabel && (
                    <SvgText
                      x={x + finalBarWidth / 2}
                      y={paddingTop + chartHeight + 20}
                      fontSize="10"
                      fontWeight="400"
                      fill="#666"
                      textAnchor="middle"
                    >
                      {data.label}
                    </SvgText>
                  )}
                </G>
              );
            })}
          </Svg>
        </View>
      );
    }

    // Week and Month views show line chart
    const chartHeight = 200;
    const chartWidth = width - 60;
    const paddingTop = 30;
    const paddingBottom = 50;
    const paddingLeft = 10;
    const paddingRight = 40; // More space for average value label
    const totalHeight = chartHeight + paddingTop + paddingBottom;
    const graphWidth = chartWidth - paddingLeft - paddingRight;

    // Calculate points
    const points = activityData.map((data, index) => {
      const x = activityData.length > 1
        ? paddingLeft + (index / (activityData.length - 1)) * graphWidth
        : paddingLeft + graphWidth / 2;
      const y = paddingTop + chartHeight - (data.value / maxValue) * chartHeight;
      return { x, y, value: data.value, label: data.label, date: data.date };
    });

    // Create smooth curve path
    const linePath = createSmoothPath(points);

    // Create filled area path
    const areaPath = linePath +
      ` L ${points[points.length - 1].x} ${paddingTop + chartHeight}` +
      ` L ${points[0].x} ${paddingTop + chartHeight} Z`;

    // Colors
    const lineColor = barColor;

    // Calculate average
    const averageValue = getAverageValue();
    const averageY = paddingTop + chartHeight - (averageValue / maxValue) * chartHeight;

    return (
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={totalHeight}>
          <Defs>
            <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={lineColor} stopOpacity="0.3" />
              <Stop offset="1" stopColor={lineColor} stopOpacity="0.05" />
            </LinearGradient>
          </Defs>

          {/* Horizontal grid lines */}
          {[0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = paddingTop + chartHeight - (fraction * chartHeight);
            return (
              <G key={`grid-${fraction}`}>
                <Line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#2C2C2E"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                  opacity="0.3"
                />
                <SvgText
                  x={5}
                  y={y + 4}
                  fontSize="10"
                  fill="#666"
                  textAnchor="start"
                >
                  {Math.round(maxValue * fraction) > 999
                    ? `${(maxValue * fraction / 1000).toFixed(1)}k`
                    : Math.round(maxValue * fraction)}
                </SvgText>
              </G>
            );
          })}

          {/* Filled area under curve */}
          <Path
            d={areaPath}
            fill="url(#areaGradient)"
          />

          {/* Main line */}
          <Path
            d={linePath}
            stroke={lineColor}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Average line - dotted */}
          <Line
            x1={paddingLeft}
            y1={averageY}
            x2={chartWidth - paddingRight}
            y2={averageY}
            stroke="#999"
            strokeWidth="2"
            strokeDasharray="6,6"
            opacity="0.6"
          />

          {/* Average value label */}
          <G>
            <SvgText
              x={chartWidth - paddingRight + 10}
              y={averageY + 4}
              fontSize="10"
              fontWeight="600"
              fill="#999"
              textAnchor="start"
            >
              {Math.round(averageValue) > 999
                ? `${(Math.round(averageValue) / 1000).toFixed(1)}k`
                : Math.round(averageValue)}
            </SvgText>
          </G>

          {/* Data points */}
          {points.map((point, index) => {
            const isToday = timeView !== 'day' && activityData[index].date === todayStr;
            const showLabel = timeView === 'week' ||
                            (timeView === 'day' && index % 4 === 0) || // Show every 4th hour (0, 4, 8, 12, 16, 20)
                            (timeView === 'month' && (index % 5 === 0 || index === activityData.length - 1));

            const showDot = timeView === 'week' ||
                           (timeView === 'day' && index % 2 === 0) || // Show dots every 2 hours
                           (timeView === 'month' && index % 3 === 0);

            return (
              <G key={index}>
                {/* Outer ring for today */}
                {showDot && isToday && (
                  <Circle
                    cx={point.x}
                    cy={point.y}
                    r="8"
                    fill="none"
                    stroke={lineColor}
                    strokeWidth="2"
                    opacity="0.3"
                  />
                )}

                {/* Data point dot */}
                {showDot && (
                  <>
                    <Circle
                      cx={point.x}
                      cy={point.y}
                      r={isToday ? "5" : "4"}
                      fill={lineColor}
                    />

                    {/* White center */}
                    <Circle
                      cx={point.x}
                      cy={point.y}
                      r={isToday ? "2" : "1.5"}
                      fill="#1C1C1E"
                    />
                  </>
                )}

                {/* Value label on hover/significant points */}
                {(isToday || (point.value === maxValue && timeView === 'week')) && (
                  <G>
                    <Rect
                      x={point.x - 20}
                      y={point.y - 30}
                      width="40"
                      height="18"
                      fill={lineColor}
                      rx="9"
                    />
                    <SvgText
                      x={point.x}
                      y={point.y - 18}
                      fontSize="11"
                      fontWeight="700"
                      fill="#fff"
                      textAnchor="middle"
                    >
                      {point.value > 999 ? `${(point.value / 1000).toFixed(1)}k` : Math.round(point.value)}
                    </SvgText>
                  </G>
                )}

                {/* Date labels */}
                {showLabel && (
                  <SvgText
                    x={point.x}
                    y={paddingTop + chartHeight + 20}
                    fontSize={isToday ? "11" : "10"}
                    fontWeight={isToday ? "600" : "400"}
                    fill={isToday ? lineColor : "#666"}
                    textAnchor="middle"
                  >
                    {point.label}
                  </SvgText>
                )}
              </G>
            );
          })}
        </Svg>
      </View>
    );
  };

  const getTotalValue = () => {
    return activityData.reduce((sum, data) => sum + data.value, 0);
  };

  const getAverageValue = () => {
    return activityData.length > 0 ? getTotalValue() / activityData.length : 0;
  };

  const tabWidth = (width - 32) / 3; // 3 tabs with 16px padding on each side
  const underlineWidth = 40; // Fixed small width for underline
  const underlineOffset = (tabWidth - underlineWidth) / 2; // Center the underline
  const underlineTranslateX = underlinePosition.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      underlineOffset,
      tabWidth + underlineOffset,
      tabWidth * 2 + underlineOffset
    ],
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header - no border */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('activity.myActivity')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Time View Navigation with animated underline */}
      <View style={styles.timeNavWrapper}>
        <View style={styles.timeNavContainer}>
          <TouchableOpacity
            style={styles.timeNavButton}
            onPress={() => setTimeView('day')}
          >
            <Text style={[styles.timeNavText, timeView === 'day' && styles.timeNavTextActive]}>
              {t('activity.day')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.timeNavButton}
            onPress={() => setTimeView('week')}
          >
            <Text style={[styles.timeNavText, timeView === 'week' && styles.timeNavTextActive]}>
              {t('activity.week')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.timeNavButton}
            onPress={() => setTimeView('month')}
          >
            <Text style={[styles.timeNavText, timeView === 'month' && styles.timeNavTextActive]}>
              {t('activity.month')}
            </Text>
          </TouchableOpacity>
        </View>
        <Animated.View
          style={[
            styles.underline,
            {
              width: underlineWidth,
              transform: [{ translateX: underlineTranslateX }],
            },
          ]}
        />
      </View>

      {/* Date Navigation with arrows */}
      <View style={styles.dateNavContainer}>
        <TouchableOpacity onPress={handlePreviousDate} style={styles.arrowButton}>
          <Ionicons name="chevron-back" size={24} color="#4285F4" />
        </TouchableOpacity>
        <Text style={styles.dateText}>{getDateRangeText()}</Text>
        <TouchableOpacity onPress={handleNextDate} style={styles.arrowButton}>
          <Ionicons name="chevron-forward" size={24} color="#4285F4" />
        </TouchableOpacity>
      </View>

      {/* Daily Total Summary - only show for day view */}
      {timeView === 'day' && (
        <View style={styles.dailySummaryContainer}>
          <Ionicons
            name={dataType === 'steps' ? 'footsteps' : 'flame'}
            size={28}
            color={dataType === 'steps' ? '#4285F4' : '#FF6B35'}
          />
          <Text style={styles.dailySummaryValue}>
            {Math.round(getTotalValue()).toLocaleString()}
          </Text>
          <Text style={styles.dailySummaryUnit}>
            {dataType === 'steps' ? t('activity.steps') : 'kcal'}
          </Text>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Chart */}
        <View style={styles.chartCard}>
          {renderBarChart()}
        </View>

        {/* Data Type Navigation - below the chart */}
        <View style={styles.dataTypeNavContainer}>
          <TouchableOpacity
            style={[styles.dataTypeButton, dataType === 'steps' && styles.dataTypeButtonActive]}
            onPress={() => setDataType('steps')}
          >
            <Text style={[styles.dataTypeText, dataType === 'steps' && styles.dataTypeTextActive]}>
              {t('activity.steps')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.dataTypeButton, dataType === 'calories' && styles.dataTypeButtonActive]}
            onPress={() => setDataType('calories')}
          >
            <Text style={[styles.dataTypeText, dataType === 'calories' && styles.dataTypeTextActive]}>
              {t('activity.calories')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1C1C1E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  timeNavWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  timeNavContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  timeNavButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  timeNavText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B0B0B0',
  },
  timeNavTextActive: {
    color: '#4285F4',
  },
  underline: {
    height: 3,
    backgroundColor: '#4285F4',
    marginHorizontal: 16,
    borderRadius: 1.5,
  },
  dateNavContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  arrowButton: {
    padding: 4,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
  },
  dailySummaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 8,
    gap: 12,
  },
  dailySummaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  dailySummaryUnit: {
    fontSize: 16,
    fontWeight: '500',
    color: '#B0B0B0',
    marginTop: 8,
  },
  content: {
    flex: 1,
  },
  dataTypeNavContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: -40,
    marginBottom: 12,
    justifyContent: 'center',
  },
  dataTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3C3C3E',
    backgroundColor: 'transparent',
  },
  dataTypeButtonActive: {
    borderColor: '#4A5F7F',
    backgroundColor: '#2C3E50',
  },
  dataTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B0B0B0',
  },
  dataTypeTextActive: {
    color: '#fff',
  },
  chartCard: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  chartContainer: {
    paddingVertical: 30,
    paddingHorizontal: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginTop: 12,
  },
});

export default MyActivityScreen;
