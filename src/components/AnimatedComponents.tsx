import React, { useEffect, useRef } from 'react';
import { Animated, ViewStyle, Pressable } from 'react-native';
import { Card } from 'react-native-paper';
import { fadeIn, scaleIn, slideInFromBottom, pulseAnimation } from '../utils/animations';

interface FadeInViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  duration?: number;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  style,
  delay = 0,
  duration = 300,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = fadeIn(fadeAnim, duration);
    if (delay > 0) {
      setTimeout(() => animation.start(), delay);
    } else {
      animation.start();
    }
  }, [fadeAnim, delay, duration]);

  return (
    <Animated.View style={[style, { opacity: fadeAnim }]}>
      {children}
    </Animated.View>
  );
};

interface ScaleInViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
}

export const ScaleInView: React.FC<ScaleInViewProps> = ({
  children,
  style,
  delay = 0,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = scaleIn(scaleAnim);
    if (delay > 0) {
      setTimeout(() => animation.start(), delay);
    } else {
      animation.start();
    }
  }, [scaleAnim, delay]);

  return (
    <Animated.View style={[style, { transform: [{ scale: scaleAnim }] }]}>
      {children}
    </Animated.View>
  );
};

interface SlideInViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  direction?: 'bottom' | 'right';
}

export const SlideInView: React.FC<SlideInViewProps> = ({
  children,
  style,
  delay = 0,
  direction = 'bottom',
}) => {
  const slideAnim = useRef(
    new Animated.Value(direction === 'bottom' ? 100 : 300)
  ).current;

  useEffect(() => {
    const animation = slideInFromBottom(slideAnim);
    if (delay > 0) {
      setTimeout(() => animation.start(), delay);
    } else {
      animation.start();
    }
  }, [slideAnim, delay]);

  const transform =
    direction === 'bottom'
      ? [{ translateY: slideAnim }]
      : [{ translateX: slideAnim }];

  return (
    <Animated.View style={[style, { transform }]}>
      {children}
    </Animated.View>
  );
};

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  onPress?: () => void;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  delay = 0,
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        delay,
        useNativeDriver: true,
        friction: 4,
        tension: 40,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        delay,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, fadeAnim, delay]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    onPress?.();
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          style,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Card>{children}</Card>
      </Animated.View>
    </Pressable>
  );
};

interface AnimatedButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onPress,
  style,
}) => {
  const { scaleValue, pulse } = pulseAnimation();

  const handlePress = () => {
    pulse();
    setTimeout(onPress, 100);
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

interface StaggerListProps {
  children: React.ReactElement[];
  delay?: number;
}

export const StaggerList: React.FC<StaggerListProps> = ({
  children,
  delay = 50,
}) => {
  const animations = useRef(
    children.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    const animationSequence = animations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * delay,
        useNativeDriver: true,
      })
    );

    Animated.stagger(delay, animationSequence).start();
  }, [animations, delay]);

  return (
    <>
      {children.map((child, index) => (
        <Animated.View
          key={index}
          style={{
            opacity: animations[index],
            transform: [
              {
                translateY: animations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >
          {child}
        </Animated.View>
      ))}
    </>
  );
};

interface ProgressBarProps {
  progress: number;
  style?: ViewStyle;
  color?: string;
}

export const AnimatedProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  style,
  color = '#E94E1B',
}) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [widthAnim, progress]);

  return (
    <Animated.View
      style={[
        {
          height: 8,
          backgroundColor: '#e0e0e0',
          borderRadius: 4,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={{
          height: '100%',
          backgroundColor: color,
          width: widthAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
        }}
      />
    </Animated.View>
  );
};

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  style,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          backgroundColor: '#e0e0e0',
          borderRadius: 4,
        },
        style,
        { opacity },
      ]}
    />
  );
};