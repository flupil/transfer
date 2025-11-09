import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { DatabaseProvider } from './src/contexts/DatabaseContext';
import { OnboardingProvider } from './src/contexts/OnboardingContext';
import { UserPreferencesProvider } from './src/contexts/UserPreferencesContext';
import { NutritionProvider } from './src/contexts/NutritionContext';
import { LanguageProvider } from './src/contexts/LanguageContext';
import { TourProvider } from './src/contexts/TourContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initializeDatabase } from './src/database/schema';
import { setupNotifications } from './src/services/notificationService';
import { ErrorBoundary } from './src/components/ErrorBoundary';
// import { initializeSentry } from './src/config/sentry'; // Disabled for Expo Go - requires native code

// Set notification handler only if notifications are available
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (error) {
  console.log('Notification handler setup skipped (Expo Go limitation)');
}

function ThemedApp() {
  const { theme, isDark, colors } = useTheme();

  const navigationTheme = isDark ? {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: theme.colors.primary,
      background: colors.background,
      card: colors.cardBackground,
      text: colors.text,
      border: colors.border,
    },
  } : {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.colors.primary,
      background: colors.background,
      card: colors.cardBackground,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer theme={navigationTheme}>
        <AppNavigator />
        <StatusBar style={isDark ? 'light' : 'dark'} />
      </NavigationContainer>
    </PaperProvider>
  );
}

export default function App() {
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Initialize crash reporting (production only)
    // try {
    //   initializeSentry(); // Disabled for Expo Go - requires native code
    // } catch (sentryError) {
    //   console.log('Sentry initialization skipped:', sentryError);
    // }

    try {
      await initializeDatabase();
    } catch (dbError) {
      console.error('Database initialization error:', dbError);
      // App can continue without database for demo purposes
    }

    try {
      await setupNotifications();
    } catch (notifError) {
      console.log('Notification setup skipped:', notifError);
      // App can continue without notifications
    }
  };

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <LanguageProvider>
            <DatabaseProvider>
              <AuthProvider>
                <UserPreferencesProvider>
                  <OnboardingProvider>
                    <NutritionProvider>
                      <ThemeProvider>
                        <TourProvider>
                          <ThemedApp />
                        </TourProvider>
                      </ThemeProvider>
                    </NutritionProvider>
                  </OnboardingProvider>
                </UserPreferencesProvider>
              </AuthProvider>
            </DatabaseProvider>
          </LanguageProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}