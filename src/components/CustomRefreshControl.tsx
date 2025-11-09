import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing, Image } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface CustomRefreshControlProps {
  refreshing: boolean;
  size?: number;
  color?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const CustomRefreshControl: React.FC<CustomRefreshControlProps> = ({
  refreshing,
  size = 60,
  color = '#FF6B35',
}) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (refreshing) {
      // Rotating progress ring
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Pulse animation for logo
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [refreshing]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const circumference = 2 * Math.PI * (size / 2 - 5);

  if (!refreshing) return null;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
        },
      ]}
    >
      {/* Rotating progress ring */}
      <Animated.View
        style={{
          position: 'absolute',
          transform: [{ rotate: rotation }],
        }}
      >
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 5}
            stroke={color}
            strokeWidth={4}
            fill="none"
            strokeDasharray={`${circumference * 0.25} ${circumference * 0.75}`}
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>

      {/* Center logo with pulse */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Image
          source={require('../assets/logotransparent.png')}
          style={[styles.logo, { width: size * 0.5, height: size * 0.5 }]}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Subtle glow */}
      <View
        style={[
          styles.glow,
          {
            width: size * 0.85,
            height: size * 0.85,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  logoContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    // Size set dynamically
  },
  glow: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.15,
    zIndex: -1,
  },
});

export default CustomRefreshControl;
