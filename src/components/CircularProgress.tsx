import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

export interface CircularProgressProps {
  /** The current value (0-1 range or actual value if max is provided) */
  value: number;
  /** Maximum value for the progress. If provided, value will be normalized against this. */
  max?: number;
  /** Radius of the circle */
  radius?: number;
  /** Width of the progress stroke */
  strokeWidth?: number;
  /** Color of the progress arc */
  progressColor?: string;
  /** Color of the background arc */
  backgroundColor?: string;
  /** Starting angle in degrees (0 = top, 90 = right, 180 = bottom, 270 = left) */
  startAngle?: number;
  /** Arc length as a percentage of full circle (0-1). Default 1 for full circle */
  arcLength?: number;
  /** Shape of the stroke end: 'butt' | 'round' | 'square' */
  strokeLinecap?: 'butt' | 'round' | 'square';
  /** Children to render in the center of the circle */
  children?: React.ReactNode;
  /** Custom container style */
  style?: any;
}

/**
 * Reusable circular progress component using SVG
 *
 * Examples:
 * ```tsx
 * // Simple full circle (0-100%)
 * <CircularProgress value={0.75} />
 *
 * // With custom colors and size
 * <CircularProgress
 *   value={500}
 *   max={2000}
 *   radius={85}
 *   strokeWidth={16}
 *   progressColor="#1CB0F6"
 *   backgroundColor="#4A5568"
 * />
 *
 * // 75% arc (e.g., for calorie display)
 * <CircularProgress
 *   value={1500}
 *   max={2000}
 *   arcLength={0.75}
 *   startAngle={135}
 *   strokeLinecap="round"
 * >
 *   <Text>1500 kcal</Text>
 * </CircularProgress>
 * ```
 */
export const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max,
  radius = 50,
  strokeWidth = 8,
  progressColor = '#1CB0F6',
  backgroundColor = '#E0E0E0',
  startAngle = 0,
  arcLength = 1,
  strokeLinecap = 'butt',
  children,
  style,
}) => {
  // Normalize value to 0-1 range
  const normalizedValue = max ? Math.min(value / max, 1) : Math.min(value, 1);

  // Calculate SVG properties
  const size = (radius + strokeWidth) * 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const arcCircumference = circumference * arcLength;

  // Calculate stroke dash offset for progress
  // Progress fills from start, so we need to show (1 - normalizedValue) * arcCircumference as the gap
  const strokeDashoffset = arcCircumference * (1 - normalizedValue);

  // Convert start angle to rotation (SVG rotation is clockwise from top)
  const rotation = startAngle;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        {/* Background arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${arcCircumference} ${circumference - arcCircumference}`}
          transform={`rotate(${rotation} ${center} ${center})`}
          strokeLinecap={strokeLinecap}
        />

        {/* Progress arc */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={arcCircumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap={strokeLinecap}
          transform={`rotate(${rotation} ${center} ${center})`}
        />
      </Svg>

      {/* Center content */}
      {children && (
        <View style={styles.centerContent}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CircularProgress;
