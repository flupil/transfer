import { Animated, Easing } from 'react-native';
// import {
//   useAnimatedStyle,
//   useSharedValue,
//   withSpring,
//   withTiming,
//   interpolate,
//   Extrapolate,
// } from 'react-native-reanimated'; // Disabled for Expo Go

// Spring animation config
export const springConfig = {
  damping: 15,
  mass: 1,
  stiffness: 150,
  overshootClamping: false,
  restDisplacementThreshold: 0.01,
  restSpeedThreshold: 0.01,
};

// Timing animation config
export const timingConfig = {
  duration: 300,
  easing: Easing.out(Easing.exp),
};

// Fade in animation
export const fadeIn = (value: Animated.Value, duration = 300) => {
  return Animated.timing(value, {
    toValue: 1,
    duration,
    useNativeDriver: true,
    easing: Easing.ease,
  });
};

// Fade out animation
export const fadeOut = (value: Animated.Value, duration = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    useNativeDriver: true,
    easing: Easing.ease,
  });
};

// Scale animation
export const scaleIn = (value: Animated.Value, duration = 300) => {
  return Animated.spring(value, {
    toValue: 1,
    friction: 4,
    tension: 40,
    useNativeDriver: true,
  });
};

// Slide in from right
export const slideInFromRight = (value: Animated.Value, duration = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    useNativeDriver: true,
    easing: Easing.out(Easing.exp),
  });
};

// Slide in from bottom
export const slideInFromBottom = (value: Animated.Value, duration = 300) => {
  return Animated.timing(value, {
    toValue: 0,
    duration,
    useNativeDriver: true,
    easing: Easing.out(Easing.back(1.5)),
  });
};

// Card flip animation helper
export const createFlipAnimation = () => {
  const flipValue = new Animated.Value(0);

  const flip = () => {
    Animated.timing(flipValue, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.ease,
    }).start(() => {
      flipValue.setValue(0);
    });
  };

  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: flipValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  const backAnimatedStyle = {
    transform: [
      {
        rotateY: flipValue.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
  };

  return { flip, frontAnimatedStyle, backAnimatedStyle };
};

// Stagger animation for lists
export const staggerAnimation = (items: any[], delay = 50) => {
  const animations = items.map(() => new Animated.Value(0));

  const animate = () => {
    const animationSequence = animations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * delay,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      })
    );

    Animated.parallel(animationSequence).start();
  };

  return { animations, animate };
};

// Pulse animation for buttons
export const pulseAnimation = () => {
  const scaleValue = new Animated.Value(1);

  const pulse = () => {
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return { scaleValue, pulse };
};

// Progress bar animation
export const progressAnimation = (progressValue: Animated.Value, toValue: number) => {
  return Animated.timing(progressValue, {
    toValue,
    duration: 1000,
    useNativeDriver: false,
    easing: Easing.out(Easing.exp),
  });
};

// Skeleton loading animation
export const skeletonAnimation = () => {
  const animatedValue = new Animated.Value(0);

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

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return opacity;
};