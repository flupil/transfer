import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Vibration,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { useLanguage } from '../contexts/LanguageContext';

interface RestTimerProps {
  visible: boolean;
  duration?: number;
  onClose: () => void;
  onComplete?: () => void;
}

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const PRESET_TIMES = [30, 45, 60, 90, 120, 180];

const RestTimer: React.FC<RestTimerProps> = ({
  visible,
  duration = 60,
  onClose,
  onComplete,
}) => {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState(duration);
  const [showPresets, setShowPresets] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const pulseAnimationRef = useRef<Animated.CompositeAnimation | null>(null);
  const progressAnimationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    requestNotificationPermissions();
    return () => {
      // Cleanup all resources on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      if (pulseAnimationRef.current) {
        pulseAnimationRef.current.stop();
        pulseAnimationRef.current = null;
      }
      if (progressAnimationRef.current) {
        progressAnimationRef.current.stop();
        progressAnimationRef.current = null;
      }
    };
  }, []);

  const requestNotificationPermissions = async () => {
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('timer.permissionRequired'),
          t('timer.permissionMessage')
        );
      }
    }
  };

  const playSound = async () => {
    try {
      // For now, just use vibration as sound file may not exist
      // You can add a sound file later: assets/timer-complete.mp3
      Vibration.vibrate([0, 500, 200, 500]);
    } catch (error) {
      console.log('Sound playback failed:', error);
    }
  };

  const sendNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t('timer.restComplete'),
        body: t('timer.restCompleteMessage'),
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  };

  const startTimer = () => {
    setIsRunning(true);
    setShowPresets(false);
    setTimeLeft(selectedDuration);

    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Stop any existing animations
    if (pulseAnimationRef.current) {
      pulseAnimationRef.current.stop();
    }
    if (progressAnimationRef.current) {
      progressAnimationRef.current.stop();
    }

    // Start pulse animation and store reference
    pulseAnimationRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimationRef.current.start();

    intervalRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          completeTimer();
          return 0;
        }

        // Warning at 10 seconds
        if (prevTime === 11) {
          Vibration.vibrate(100);
        }

        return prevTime - 1;
      });
    }, 1000);

    // Animate progress and store reference
    progressAnimationRef.current = Animated.timing(animatedValue, {
      toValue: 1,
      duration: selectedDuration * 1000,
      useNativeDriver: false,
    });
    progressAnimationRef.current.start();
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (pulseAnimationRef.current) {
      pulseAnimationRef.current.stop();
    }
    if (progressAnimationRef.current) {
      progressAnimationRef.current.stop();
    }
  };

  const resumeTimer = () => {
    setIsRunning(true);

    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          completeTimer();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(selectedDuration);
    setShowPresets(true);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (pulseAnimationRef.current) {
      pulseAnimationRef.current.stop();
      pulseAnimationRef.current = null;
    }
    if (progressAnimationRef.current) {
      progressAnimationRef.current.stop();
      progressAnimationRef.current = null;
    }

    animatedValue.setValue(0);
    pulseAnim.setValue(1);
  };

  const completeTimer = () => {
    setIsRunning(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (pulseAnimationRef.current) {
      pulseAnimationRef.current.stop();
      pulseAnimationRef.current = null;
    }
    if (progressAnimationRef.current) {
      progressAnimationRef.current.stop();
      progressAnimationRef.current = null;
    }

    // Trigger completion feedback
    playSound();
    sendNotification();
    Vibration.vibrate([0, 500, 200, 500]);

    if (onComplete) {
      onComplete();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = () => {
    const progress = 1 - (timeLeft / selectedDuration);
    if (progress < 0.5) return '#4CAF50';
    if (progress < 0.8) return '#FFC107';
    return '#FF5722';
  };

  const handleClose = () => {
    resetTimer();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <MaterialCommunityIcons name="close" size={28} color="#666" />
          </TouchableOpacity>

          <Text style={styles.title}>{t('timer.restTimer')}</Text>

          {showPresets ? (
            <>
              <Text style={styles.subtitle}>{t('timer.selectDuration')}</Text>
              <View style={styles.presetsGrid}>
                {PRESET_TIMES.map((time) => (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.presetButton,
                      selectedDuration === time && styles.presetButtonSelected,
                    ]}
                    onPress={() => setSelectedDuration(time)}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        selectedDuration === time && styles.presetTextSelected,
                      ]}
                    >
                      {formatTime(time)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity onPress={startTimer} activeOpacity={0.8}>
                <LinearGradient
                  colors={['#FF6B35', '#F94C10']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startButton}
                >
                  <MaterialCommunityIcons name="play" size={28} color="white" />
                  <Text style={styles.startButtonText}>{t('timer.startTimer')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Animated.View
                style={[
                  styles.timerCircle,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <View style={[styles.progressRing, { borderColor: getProgressColor() }]}>
                  <Text style={styles.timeDisplay}>{formatTime(timeLeft)}</Text>
                  <Text style={styles.timeLabel}>
                    {timeLeft > 10 ? t('timer.keepResting') : t('timer.getReady')}
                  </Text>
                </View>
              </Animated.View>

              <View style={styles.controls}>
                {isRunning ? (
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={pauseTimer}
                  >
                    <MaterialCommunityIcons name="pause" size={32} color="#FF6B35" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={resumeTimer}
                  >
                    <MaterialCommunityIcons name="play" size={32} color="#4CAF50" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={resetTimer}
                >
                  <MaterialCommunityIcons name="refresh" size={32} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => setTimeLeft(timeLeft + 30)}
                >
                  <Text style={styles.addTimeText}>+30s</Text>
                </TouchableOpacity>
              </View>

              {timeLeft === 0 && (
                <TouchableOpacity onPress={handleClose}>
                  <LinearGradient
                    colors={['#4CAF50', '#45B839']}
                    style={styles.doneButton}
                  >
                    <Text style={styles.doneButtonText}>{t('timer.done')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1F36',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
    justifyContent: 'center',
  },
  presetButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    backgroundColor: 'white',
  },
  presetButtonSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F0',
  },
  presetText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  presetTextSelected: {
    color: '#FF6B35',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  timerCircle: {
    marginVertical: 32,
  },
  progressRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  timeDisplay: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#1A1F36',
  },
  timeLabel: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 24,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTimeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  doneButton: {
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 24,
  },
  doneButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
});

export default RestTimer;