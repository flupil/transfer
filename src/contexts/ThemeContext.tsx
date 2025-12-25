import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3LightTheme, MD3DarkTheme, MD3Theme } from 'react-native-paper';
import { BRAND_COLORS } from '../constants/brandColors';

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

// FIT AND POWER Brand Colors - Dark Theme (Primary)
const brandDarkColors: CustomColors = {
  background: BRAND_COLORS.background,      // #2A2A2A
  surface: BRAND_COLORS.backgroundLight,     // #4A4A4A
  text: BRAND_COLORS.text,                   // #F4F1EF
  textSecondary: BRAND_COLORS.textSecondary, // #C5C2BF
  border: BRAND_COLORS.border,               // #5A5A5A
  cardBackground: BRAND_COLORS.backgroundLight, // #4A4A4A
  waterCard: BRAND_COLORS.accent,            // #E94E1B
  waterCardLight: BRAND_COLORS.accentSubtle, // #E94E1B20
  progressCard: BRAND_COLORS.accent,         // #E94E1B
  progressCardLight: BRAND_COLORS.accentSubtle,
  distanceCard: BRAND_COLORS.accentLight,    // #FF6B35
  distanceCardLight: BRAND_COLORS.accentSubtle,
  stepsCard: BRAND_COLORS.accent,
  stepsCardLight: BRAND_COLORS.accentSubtle,
  tabBarBackground: BRAND_COLORS.backgroundDark, // #2A2A2A
  tabBarActive: '#E94E1B',
  tabBarInactive: BRAND_COLORS.textSecondary, // #C5C2BF
  // Macro colors (ALL USE ORANGE - strict 4-color palette)
  proteinColor: BRAND_COLORS.accent,    // Orange
  carbsColor: BRAND_COLORS.accent,      // Orange
  fatColor: BRAND_COLORS.accent,        // Orange
  // Status colors (ALL USE ORANGE except info which uses blue)
  success: BRAND_COLORS.success,        // Orange (mapped in brandColors)
  warning: BRAND_COLORS.warning,        // Orange (mapped in brandColors)
  info: BRAND_COLORS.info,              // Blue (for data viz only)
  // Action colors (ALL USE ORANGE)
  primaryAction: BRAND_COLORS.accent,      // Orange
  secondaryAction: BRAND_COLORS.accent,    // Orange
  dangerAction: BRAND_COLORS.accent,       // Orange
};

// Light theme (optional - using inverted brand colors)
const brandLightColors: CustomColors = {
  background: BRAND_COLORS.text,       // #F4F1EF (cream as background)
  surface: '#FFFFFF',                   // Pure white
  text: BRAND_COLORS.background,        // #2A2A2A (dark as text)
  textSecondary: '#6B6B6B',            // Medium gray
  border: '#D5D2CF',                   // Light border
  cardBackground: '#FFFFFF',
  waterCard: BRAND_COLORS.accent,
  waterCardLight: BRAND_COLORS.accentSubtle,
  progressCard: BRAND_COLORS.accent,
  progressCardLight: BRAND_COLORS.accentSubtle,
  distanceCard: BRAND_COLORS.accentLight,
  distanceCardLight: BRAND_COLORS.accentSubtle,
  stepsCard: BRAND_COLORS.accent,
  stepsCardLight: BRAND_COLORS.accentSubtle,
  tabBarBackground: '#FFFFFF',
  tabBarActive: '#E94E1B',
  tabBarInactive: '#8B8886',
  // Macro colors (ALL USE ORANGE - strict 4-color palette)
  proteinColor: BRAND_COLORS.accent,
  carbsColor: BRAND_COLORS.accent,
  fatColor: BRAND_COLORS.accent,
  // Status colors (ALL USE ORANGE except info which uses blue)
  success: BRAND_COLORS.success,
  warning: BRAND_COLORS.warning,
  info: BRAND_COLORS.info,
  // Action colors (ALL USE ORANGE)
  primaryAction: BRAND_COLORS.accent,
  secondaryAction: BRAND_COLORS.accent,
  dangerAction: BRAND_COLORS.accent,
};

const brandDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: BRAND_COLORS.accent,         // #E94E1B
    secondary: BRAND_COLORS.accentLight,  // #FF6B35
    tertiary: BRAND_COLORS.text,          // #F4F1EF
    error: BRAND_COLORS.error,            // #E94E1B
    surface: BRAND_COLORS.backgroundLight, // #4A4A4A
    background: BRAND_COLORS.background,  // #2A2A2A
    onPrimary: BRAND_COLORS.text,         // #F4F1EF
    onSecondary: BRAND_COLORS.text,
    onSurface: BRAND_COLORS.text,
    onBackground: BRAND_COLORS.text,
  },
};

const brandLightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: BRAND_COLORS.accent,         // #E94E1B
    secondary: BRAND_COLORS.accentLight,  // #FF6B35
    tertiary: BRAND_COLORS.background,    // #2A2A2A
    error: BRAND_COLORS.error,
    surface: '#FFFFFF',
    background: BRAND_COLORS.text,        // #F4F1EF
    onPrimary: BRAND_COLORS.text,
    onSecondary: BRAND_COLORS.text,
    onSurface: BRAND_COLORS.background,
    onBackground: BRAND_COLORS.background,
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
  // Default to dark theme for FIT AND POWER branding
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [theme, setTheme] = useState(brandDarkTheme);
  const [isDark, setIsDark] = useState(true);

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
      } else {
        // Default to dark if no preference saved
        setThemeModeState('dark');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load theme settings. Using default theme.');
      console.error('Failed to load theme preference:', error);
    }
  };

  const updateTheme = () => {
    let shouldUseDark = true; // Default to dark for brand

    if (themeMode === 'dark') {
      shouldUseDark = true;
    } else if (themeMode === 'light') {
      shouldUseDark = false;
    } else {
      // For system mode, prefer dark theme for brand consistency
      shouldUseDark = systemColorScheme === 'dark' || systemColorScheme == null;
    }

    setIsDark(shouldUseDark);
    setTheme(shouldUseDark ? brandDarkTheme : brandLightTheme);
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

  const colors = isDark ? brandDarkColors : brandLightColors;

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
