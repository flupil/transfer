import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTimer } from '../contexts/TimerContext';
import { useTheme } from '../contexts/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUBBLE_SIZE = 70;
const EXPANDED_WIDTH = 320;
const EXPANDED_HEIGHT = 420;

export const FloatingTimerBubble: React.FC = () => {
  const { isTimerRunning, timerSeconds, isExpanded, setExpanded, stopTimer, pauseTimer, resumeTimer, resetTimer, startTimer } = useTimer();
  const { colors } = useTheme();
  const pan = React.useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - BUBBLE_SIZE - 20, y: SCREEN_HEIGHT / 2 })).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isExpanded, // Only drag when collapsed
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture the gesture if user has moved more than 5 pixels
        // This allows taps to work while still enabling drags
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();

        // If it was a tap (very little movement), expand the timer
        if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
          setExpanded(true);
        }
      },
    })
  ).current;

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    stopTimer();
  };

  const presetTimes = [
    { label: '30s', seconds: 30 },
    { label: '1m', seconds: 60 },
    { label: '1.5m', seconds: 90 },
    { label: '2m', seconds: 120 },
  ];

  // Only show if timer has time or is running
  if (timerSeconds === 0 && !isTimerRunning) {
    return null;
  }

  if (isExpanded) {
    // Expanded view - show full timer controls
    return (
      <View style={styles.expandedContainer}>
        <View style={[styles.expandedCard, { backgroundColor: colors.cardBackground }]}>
          {/* Header */}
          <View style={styles.expandedHeader}>
            <Text style={[styles.expandedTitle, { color: colors.text }]}>Workout Timer</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity onPress={() => setExpanded(false)} style={styles.headerButton}>
                <MaterialCommunityIcons name="window-minimize" size={20} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClose} style={styles.headerButton}>
                <MaterialCommunityIcons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Timer Display */}
          <View style={styles.expandedTimerDisplay}>
            <Text style={[styles.expandedTimerText, { color: colors.primaryAction }]}>{formatTime(timerSeconds)}</Text>
            <Text style={[styles.expandedTimerLabel, { color: colors.textSecondary }]}>
              {timerSeconds > 0 ? 'Time Remaining' : 'Complete!'}
            </Text>
          </View>

          {/* Control Buttons */}
          <View style={styles.expandedControls}>
            <TouchableOpacity style={[styles.expandedButton, { backgroundColor: colors.border }]} onPress={resetTimer}>
              <MaterialCommunityIcons name="restart" size={24} color={colors.text} />
              <Text style={[styles.expandedButtonLabel, { color: colors.text }]}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.expandedButton, styles.primaryExpandedButton, { backgroundColor: colors.primaryAction }]}
              onPress={isTimerRunning ? pauseTimer : resumeTimer}
            >
              <MaterialCommunityIcons name={isTimerRunning ? 'pause' : 'play'} size={28} color="#FFF" />
              <Text style={[styles.expandedButtonLabel, { color: '#FFF' }]}>{isTimerRunning ? 'Pause' : 'Resume'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.expandedButton, { backgroundColor: colors.border }]} onPress={handleClose}>
              <MaterialCommunityIcons name="stop" size={24} color={colors.text} />
              <Text style={[styles.expandedButtonLabel, { color: colors.text }]}>Stop</Text>
            </TouchableOpacity>
          </View>

          {/* Preset Times */}
          <View style={styles.presetsContainer}>
            <Text style={[styles.presetsTitle, { color: colors.textSecondary }]}>Rest Presets</Text>
            <View style={styles.presetsGrid}>
              {presetTimes.map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  style={[styles.presetButton, { backgroundColor: colors.border }]}
                  onPress={() => startTimer(preset.seconds)}
                >
                  <Text style={[styles.presetText, { color: colors.text }]}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Collapsed bubble view
  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          backgroundColor: colors.primaryAction,
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.bubbleContent}>
        <MaterialCommunityIcons name="timer" size={24} color="#FFF" />
        <Text style={styles.bubbleTime}>{formatTime(timerSeconds)}</Text>
        {isTimerRunning && <View style={styles.pulseIndicator} />}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 9999,
  },
  bubbleContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleTime: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  pulseIndicator: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4ADE80',
  },
  expandedContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  expandedCard: {
    width: EXPANDED_WIDTH,
    minHeight: EXPANDED_HEIGHT,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  expandedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  expandedTimerDisplay: {
    alignItems: 'center',
    marginBottom: 30,
  },
  expandedTimerText: {
    fontSize: 56,
    fontWeight: 'bold',
  },
  expandedTimerLabel: {
    fontSize: 14,
    marginTop: 8,
  },
  expandedControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 12,
  },
  expandedButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryExpandedButton: {
    paddingVertical: 16,
  },
  expandedButtonLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  presetsContainer: {
    marginTop: 10,
  },
  presetsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
