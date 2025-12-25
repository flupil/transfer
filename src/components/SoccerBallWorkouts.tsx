import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Text,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Path, G, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import type { FootballWorkout } from '../data/footballWorkouts';

const { width } = Dimensions.get('window');

interface SoccerBallWorkoutsProps {
  workouts: FootballWorkout[];
  completedWorkoutIds: Set<string>;
  onWorkoutPress: (workout: FootballWorkout, index: number) => void;
  programColor?: string;
}

// Pentagon path (5-sided)
const createPentagonPath = (cx: number, cy: number, size: number): string => {
  const points: [number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    points.push([
      cx + size * Math.cos(angle),
      cy + size * Math.sin(angle),
    ]);
  }
  return `M ${points.map(p => p.join(',')).join(' L ')} Z`;
};

// Hexagon path (6-sided)
const createHexagonPath = (cx: number, cy: number, size: number): string => {
  const points: [number, number][] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    points.push([
      cx + size * Math.cos(angle),
      cy + size * Math.sin(angle),
    ]);
  }
  return `M ${points.map(p => p.join(',')).join(' L ')} Z`;
};

const SoccerBallWorkouts: React.FC<SoccerBallWorkoutsProps> = ({
  workouts,
  completedWorkoutIds,
  onWorkoutPress,
  programColor = '#E94E1B',
}) => {
  const completionAnims = useRef(
    workouts.map(() => new Animated.Value(1))
  ).current;

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation for incomplete workouts
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#E94E1B';
      case 'intermediate': return '#E94E1B';
      case 'advanced': return '#FF6B35';
      default: return '#8B9AA5';
    }
  };

  // Layout configurations for different workout counts
  const getLayoutConfig = (count: number) => {
    const baseSize = 340;
    const cx = baseSize / 2;
    const cy = baseSize / 2;

    if (count === 5) {
      // Pentagon arrangement
      return {
        viewBox: `0 0 ${baseSize} ${baseSize}`,
        panels: Array.from({ length: 5 }, (_, i) => {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          return {
            type: 'pentagon' as const,
            x: cx + 100 * Math.cos(angle),
            y: cy + 100 * Math.sin(angle),
            size: 35,
          };
        }),
        center: { x: cx, y: cy, radius: 50 },
      };
    } else if (count === 6) {
      // Hexagon arrangement (classic soccer ball)
      return {
        viewBox: `0 0 ${baseSize} ${baseSize}`,
        panels: [
          { type: 'pentagon' as const, x: cx, y: cy - 100, size: 35 },
          { type: 'hexagon' as const, x: cx - 87, y: cy - 50, size: 32 },
          { type: 'hexagon' as const, x: cx + 87, y: cy - 50, size: 32 },
          { type: 'hexagon' as const, x: cx - 87, y: cy + 50, size: 32 },
          { type: 'hexagon' as const, x: cx + 87, y: cy + 50, size: 32 },
          { type: 'pentagon' as const, x: cx, y: cy + 100, size: 35 },
        ],
        center: { x: cx, y: cy, radius: 50 },
      };
    } else if (count === 7) {
      // 6 hexagons + 1 center
      return {
        viewBox: `0 0 ${baseSize} ${baseSize}`,
        panels: [
          { type: 'hexagon' as const, x: cx, y: cy - 90, size: 30 },
          { type: 'hexagon' as const, x: cx + 78, y: cy - 45, size: 30 },
          { type: 'hexagon' as const, x: cx + 78, y: cy + 45, size: 30 },
          { type: 'hexagon' as const, x: cx, y: cy + 90, size: 30 },
          { type: 'hexagon' as const, x: cx - 78, y: cy + 45, size: 30 },
          { type: 'hexagon' as const, x: cx - 78, y: cy - 45, size: 30 },
          { type: 'pentagon' as const, x: cx, y: cy, size: 28 },
        ],
        center: { x: cx, y: cy, radius: 45 },
      };
    } else {
      // 8 workouts - octagon arrangement
      return {
        viewBox: `0 0 ${baseSize} ${baseSize}`,
        panels: Array.from({ length: 8 }, (_, i) => {
          const angle = (Math.PI * 2 * i) / 8 - Math.PI / 2;
          return {
            type: i % 2 === 0 ? ('pentagon' as const) : ('hexagon' as const),
            x: cx + 100 * Math.cos(angle),
            y: cy + 100 * Math.sin(angle),
            size: 30,
          };
        }),
        center: { x: cx, y: cy, radius: 50 },
      };
    }
  };

  const layout = getLayoutConfig(workouts.length);
  const completedCount = workouts.filter(w => completedWorkoutIds.has(w.id)).length;
  const progressPercentage = (completedCount / workouts.length) * 100;

  return (
    <View style={styles.container}>
      {/* Progress ring and SVG soccer ball */}
      <View style={styles.soccerBallContainer}>
        <Svg width={340} height={340} viewBox={layout.viewBox}>
          <Defs>
            <RadialGradient id="ballGradient" cx="50%" cy="50%">
              <Stop offset="0%" stopColor="#4E4E50" stopOpacity="1" />
              <Stop offset="100%" stopColor="#1A1A1A" stopOpacity="1" />
            </RadialGradient>
          </Defs>

          {/* Progress ring background */}
          <Circle
            cx={layout.center.x}
            cy={layout.center.y}
            r={layout.center.radius + 60}
            stroke="#4A5568"
            strokeWidth="4"
            fill="none"
            strokeOpacity={0.3}
          />

          {/* Progress ring fill */}
          <G transform={`rotate(-90 ${layout.center.x} ${layout.center.y})`}>
            <Circle
              cx={layout.center.x}
              cy={layout.center.y}
              r={layout.center.radius + 60}
              stroke={programColor}
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${2 * Math.PI * (layout.center.radius + 60)}`}
              strokeDashoffset={`${2 * Math.PI * (layout.center.radius + 60) * (1 - progressPercentage / 100)}`}
              strokeLinecap="round"
            />
          </G>

          {/* Center soccer ball */}
          <Circle
            cx={layout.center.x}
            cy={layout.center.y}
            r={layout.center.radius}
            fill="url(#ballGradient)"
            stroke="#4A5568"
            strokeWidth="2"
          />

          {/* Workout panels */}
          {layout.panels.map((panel, index) => {
            const workout = workouts[index];
            if (!workout) return null;

            const isCompleted = completedWorkoutIds.has(workout.id);
            const difficultyColor = getDifficultyColor(workout.difficulty);
            const path = panel.type === 'pentagon'
              ? createPentagonPath(panel.x, panel.y, panel.size)
              : createHexagonPath(panel.x, panel.y, panel.size);

            return (
              <G key={workout.id}>
                {/* Panel background */}
                <Path
                  d={path}
                  fill={isCompleted ? `${programColor}40` : '#4E4E50'}
                  stroke={difficultyColor}
                  strokeWidth="3"
                  opacity={isCompleted ? 0.9 : 0.8}
                />

                {/* Panel border glow for difficulty */}
                <Path
                  d={path}
                  fill="none"
                  stroke={difficultyColor}
                  strokeWidth="1"
                  opacity={0.5}
                />
              </G>
            );
          })}
        </Svg>

        {/* Center progress text */}
        <View style={styles.centerContent}>
          <MaterialCommunityIcons name="soccer" size={32} color={programColor} />
          <Text style={styles.progressText}>
            {completedCount}/{workouts.length}
          </Text>
          <Text style={styles.progressLabel}>Complete</Text>
        </View>

        {/* Workout overlays with numbers and tap handlers */}
        {layout.panels.map((panel, index) => {
          const workout = workouts[index];
          if (!workout) return null;

          const isCompleted = completedWorkoutIds.has(workout.id);
          const difficultyColor = getDifficultyColor(workout.difficulty);

          // Calculate position for overlay (center of panel)
          const overlayX = panel.x - 30; // Adjust for half width
          const overlayY = panel.y - 30; // Adjust for half height

          return (
            <Animated.View
              key={workout.id}
              style={[
                styles.workoutOverlay,
                {
                  left: overlayX,
                  top: overlayY,
                  transform: [
                    { scale: completionAnims[index] || 1 },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  // Animate on press
                  Animated.sequence([
                    Animated.timing(completionAnims[index], {
                      toValue: 0.9,
                      duration: 100,
                      useNativeDriver: true,
                    }),
                    Animated.spring(completionAnims[index], {
                      toValue: 1,
                      friction: 3,
                      useNativeDriver: true,
                    }),
                  ]).start();

                  onWorkoutPress(workout, index);
                }}
                style={styles.workoutTouchable}
                activeOpacity={0.7}
              >
                {isCompleted ? (
                  <MaterialCommunityIcons name="check-circle" size={24} color={programColor} />
                ) : (
                  <View style={styles.workoutNumber}>
                    <Text style={[styles.workoutNumberText, { color: difficultyColor }]}>
                      {index + 1}
                    </Text>
                  </View>
                )}

                {/* Difficulty indicator dot */}
                <View style={[styles.difficultyDot, { backgroundColor: difficultyColor }]} />
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#E94E1B' }]} />
          <Text style={styles.legendText}>Beginner</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#E94E1B' }]} />
          <Text style={styles.legendText}>Intermediate</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF6B35' }]} />
          <Text style={styles.legendText}>Advanced</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  soccerBallContainer: {
    width: 340,
    height: 340,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#8B9AA5',
    marginTop: 2,
  },
  workoutOverlay: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutTouchable: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  difficultyDot: {
    position: 'absolute',
    bottom: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  legend: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    color: '#8B9AA5',
  },
});

export default SoccerBallWorkouts;
