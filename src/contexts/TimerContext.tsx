import React, { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { Alert, Vibration } from 'react-native';

interface TimerContextType {
  isTimerRunning: boolean;
  timerSeconds: number;
  isExpanded: boolean;
  startTimer: (seconds: number) => void;
  stopTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  setExpanded: (expanded: boolean) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

interface TimerProviderProps {
  children: ReactNode;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

  const startTimer = (seconds: number) => {
    // Stop any existing timer
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

    setTimerSeconds(seconds);
    setIsTimerRunning(true);
    setIsExpanded(true); // Auto-expand when starting

    timerInterval.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          // Timer complete
          stopTimer();
          Vibration.vibrate([0, 50, 100, 50]); // Vibration pattern
          Alert.alert('Timer Complete!', 'Time to move to the next exercise!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const pauseTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    setIsTimerRunning(false);
  };

  const resumeTimer = () => {
    if (timerSeconds > 0 && !timerInterval.current) {
      setIsTimerRunning(true);
      timerInterval.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            stopTimer();
            Vibration.vibrate([0, 50, 100, 50]);
            Alert.alert('Timer Complete!', 'Time to move to the next exercise!');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const resetTimer = () => {
    stopTimer();
  };

  const setExpanded = (expanded: boolean) => {
    setIsExpanded(expanded);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  return (
    <TimerContext.Provider
      value={{
        isTimerRunning,
        timerSeconds,
        isExpanded,
        startTimer,
        stopTimer,
        pauseTimer,
        resumeTimer,
        resetTimer,
        setExpanded,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};
