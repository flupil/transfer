import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Vibration,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useLanguage } from '../contexts/LanguageContext';

interface WorkoutTimerProps {
  visible: boolean;
  onClose: () => void;
  initialSeconds?: number;
  exerciseName?: string;
  setNumber?: number;
}

const WorkoutTimer: React.FC<WorkoutTimerProps> = ({
  visible,
  onClose,
  initialSeconds = 60,
  exerciseName = 'Rest',
  setNumber,
}) => {
  const { t } = useLanguage();
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(true);
  const [totalWorkoutTime, setTotalWorkoutTime] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Preset rest times
  const presetTimes = [30, 45, 60, 90, 120, 180];

  useEffect(() => {
    if (visible) {
      setSeconds(initialSeconds);
      setIsRunning(true);
    }
    return () => {
      // Cleanup on unmount or when modal closes
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, [visible, initialSeconds]);

  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isRunning && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
        setTotalWorkoutTime((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, seconds]);

  const handleTimerComplete = async () => {
    setIsRunning(false);

    // Vibration pattern: vibrate for 500ms, pause 200ms, vibrate 500ms
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Vibration.vibrate([0, 500, 200, 500]);
    }

    // Play sound - using system sound for now
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
      });
      // This will play a system beep sound
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3' },
        { shouldPlay: true }
      );
      soundRef.current = sound;
    } catch (error) {
      console.log('Sound not available');
    }
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setSeconds(initialSeconds);
    setIsRunning(false);
  };

  const skipTimer = () => {
    setSeconds(0);
    onClose();
  };

  const addTime = (additionalSeconds: number) => {
    setSeconds((prev) => prev + additionalSeconds);
  };

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    return ((initialSeconds - seconds) / initialSeconds) * 100;
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.timerCard}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.exerciseLabel}>
                {setNumber ? t('timer.setComplete', { number: setNumber }) : t('timer.restPeriod')}
              </Text>
              <Text style={styles.exerciseName}>{exerciseName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Timer Display */}
          <View style={styles.timerContainer}>
            <View style={styles.progressRing}>
              <View
                style={[
                  styles.progressFill,
                  {
                    height: `${getProgressPercentage()}%`,
                  },
                ]}
              />
              <View style={styles.timerDisplay}>
                <Text style={styles.timerText}>{formatTime(seconds)}</Text>
                <Text style={styles.timerLabel}>
                  {seconds > 0 ? t('timer.timeRemaining') : t('timer.complete')}
                </Text>
              </View>
            </View>
          </View>

          {/* Control Buttons */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={resetTimer}
            >
              <MaterialCommunityIcons name="restart" size={28} color="#666" />
              <Text style={styles.controlLabel}>{t('timer.reset')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.primaryButton]}
              onPress={toggleTimer}
            >
              <MaterialCommunityIcons
                name={isRunning ? 'pause' : 'play'}
                size={32}
                color="white"
              />
              <Text style={[styles.controlLabel, styles.primaryLabel]}>
                {isRunning ? t('timer.pause') : t('timer.resume')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={skipTimer}
            >
              <MaterialCommunityIcons name="skip-next" size={28} color="#666" />
              <Text style={styles.controlLabel}>{t('timer.skip')}</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Add Time Buttons */}
          <View style={styles.quickAddContainer}>
            <Text style={styles.quickAddLabel}>{t('timer.addTime')}</Text>
            <View style={styles.quickAddButtons}>
              <TouchableOpacity
                style={styles.quickAddButton}
                onPress={() => addTime(15)}
              >
                <Text style={styles.quickAddText}>+15s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAddButton}
                onPress={() => addTime(30)}
              >
                <Text style={styles.quickAddText}>+30s</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickAddButton}
                onPress={() => addTime(60)}
              >
                <Text style={styles.quickAddText}>+1m</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Preset Times */}
          <View style={styles.presetContainer}>
            <Text style={styles.presetLabel}>{t('timer.quickSet')}</Text>
            <View style={styles.presetButtons}>
              {presetTimes.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.presetButton,
                    time === initialSeconds && styles.activePreset,
                  ]}
                  onPress={() => {
                    setSeconds(time);
                    setIsRunning(true);
                  }}
                >
                  <Text
                    style={[
                      styles.presetText,
                      time === initialSeconds && styles.activePresetText,
                    ]}
                  >
                    {time < 60 ? `${time}s` : `${time / 60}m`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  timerCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  exerciseLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: 30,
  },
  progressRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    borderColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  progressFill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF6B35',
    opacity: 0.2,
  },
  timerDisplay: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  timerLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  controlButton: {
    alignItems: 'center',
    padding: 10,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  controlLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  primaryLabel: {
    color: 'white',
  },
  quickAddContainer: {
    marginBottom: 20,
  },
  quickAddLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  quickAddButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickAddButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  quickAddText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  presetContainer: {
    marginBottom: 10,
  },
  presetLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  activePreset: {
    backgroundColor: '#FF6B35',
  },
  presetText: {
    fontSize: 14,
    color: '#333',
  },
  activePresetText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default WorkoutTimer;