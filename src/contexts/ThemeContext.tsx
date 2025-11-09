import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3LightTheme, MD3DarkTheme, MD3Theme } from 'react-native-paper';

type ThemeMode = 'light' | 'dark' | 'system';

export interface CustomColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  cardBackground: string;
  waterCard: string;
  waterCardLight: string;
  progressCard: string;
  progressCardLight: string;
  distanceCard: string;
  distanceCardLight: string;
  stepsCard: string;
  stepsCardLight: string;
  tabBarBackground: string;
  tabBarActive: string;
  tabBarInactive: string;
  // Macro colors
  proteinColor: string;
  carbsColor: string;
  fatColor: string;
  // Status colors
  success: string;
  warning: string;
  info: string;
  // Action colors
  primaryAction: string;
  secondaryAction: string;
  dangerAction: string;
}

interface ThemeContextType {
  theme: MD3Theme;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDark: boolean;
  colors: CustomColors;
  toggleTheme: () => void;
}

const lightColors: CustomColors = {
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#1C1C1C',
  textSecondary: '#666666',
  border: '#E0E0E0',
  cardBackground: '#ffffff',
  waterCard: '#64B5F6',
  waterCardLight: '#E1F5FE',
  progressCard: '#64B5F6',
  progressCardLight: '#E1F5FE',
  distanceCard: '#FFB74D',
  distanceCardLight: '#FFF3E0',
  stepsCard: '#FFB74D',
  stepsCardLight: '#FFF3E0',
  tabBarBackground: '#ffffff',
  tabBarActive: '#4CAF50',
  tabBarInactive: '#999999',
  // Macro colors
  proteinColor: '#FF6B6B',
  carbsColor: '#4ECDC4',
  fatColor: '#FFD93D',
  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  info: '#1CB0F6',
  // Action colors
  primaryAction: '#FF6B35',
  secondaryAction: '#2196F3',
  dangerAction: '#FF6B6B',
};

const darkColors: CustomColors = {
  background: '#202124',
  surface: '#2D2E30',
  text: '#FFFFFF',
  textSecondary: '#B3B3B3',
  border: '#2C2C2C',
  cardBackground: '#2D2E30',
  waterCard: '#1976D2',
  waterCardLight: '#90CAF9',
  progressCard: '#1976D2',
  progressCardLight: '#90CAF9',
  distanceCard: '#E65100',
  distanceCardLight: '#FFAB91',
  stepsCard: '#E65100',
  stepsCardLight: '#FFAB91',
  tabBarBackground: '#2D2E30',
  tabBarActive: '#66BB6A',
  tabBarInactive: '#808080',
  // Macro colors (slightly adjusted for dark mode)
  proteinColor: '#FF8A8A',
  carbsColor: '#6EDBD3',
  fatColor: '#FFE066',
  // Status colors
  success: '#66BB6A',
  warning: '#FFA726',
  info: '#42A5F5',
  // Action colors
  primaryAction: '#FF8A5B',
  secondaryAction: '#42A5F5',
  dangerAction: '#FF8A8A',
};

const lightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#4CAF50',
    secondary: '#2196F3',
    tertiary: '#FF9800',
    error: '#F44336',
    surface: '#ffffff',
    background: '#f5f5f5',
  },
};

const darkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#66BB6A',
    secondary: '#42A5F5',
    tertiary: '#FFA726',
    error: '#EF5350',
    surface: '#2D2E30',
    background: '#202124',
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [theme, setTheme] = useState(lightTheme);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    updateTheme();
  }, [themeMode, systemColorScheme]);

  const loadThemePreference = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('themeMode');
      if (savedTheme) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load theme settings. Using default theme.');
      console.error('Failed to load theme preference:', error);
    }
  };

  const updateTheme = () => {
    let shouldUseDark = false;

    if (themeMode === 'dark') {
      shouldUseDark = true;
    } else if (themeMode === 'light') {
      shouldUseDark = false;
    } else {
      shouldUseDark = systemColorScheme === 'dark';
    }

    setIsDark(shouldUseDark);
    setTheme(shouldUseDark ? darkTheme : lightTheme);
  };

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem('themeMode', mode);
      setThemeModeState(mode);
    } catch (error) {
      Alert.alert('Error', 'Failed to save theme preference. Please try again.');
      console.error('Failed to save theme preference:', error);
    }
  };

  const toggleTheme = async () => {
    const newMode = isDark ? 'light' : 'dark';
    await setThemeMode(newMode);
  };

  const colors = isDark ? darkColors : lightColors;

  const value: ThemeContextType = {
    theme,
    themeMode,
    setThemeMode,
    isDark,
    colors,
    toggleTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};