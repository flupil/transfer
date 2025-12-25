import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity, View, Text, StyleSheet, Platform, I18nManager } from 'react-native';
import { Avatar } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import { useLanguage } from '../contexts/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

import AuthNavigator from './AuthNavigator';
import AdminNavigator from './AdminNavigator';
import CoachNavigator from './CoachNavigator';

// Main screens
import SimpleWorkoutScreen from '../screens/SimpleWorkoutScreen';
import WorkoutScreen from '../screens/WorkoutScreen';
import NutritionScreen from '../screens/nutrition/NutritionScreen';
import ProgressScreen from '../screens/ProgressScreen';
import CalendarScreen from '../screens/CalendarScreen';
import ProfileScreen from '../screens/ProfileScreen';
import StreakScreen from '../screens/StreakScreen';
import TestingScreen from '../screens/TestingScreen';
import TryScreen from '../screens/TryScreen';

// Workout screens
import { WorkoutLogScreen } from '../screens/workout/WorkoutLogScreen';
import SimpleWorkoutPlansScreen from '../screens/workout/SimpleWorkoutPlansScreen';
import { ExerciseLibraryScreen } from '../screens/workout/ExerciseLibraryScreen';
import AIWorkoutGeneratorScreen from '../screens/workout/AIWorkoutGeneratorScreen';
import FootballTrainingScreen from '../screens/football/FootballTrainingScreen';
import FootballHomeScreen from '../screens/football/FootballHomeScreen';
import FootballWorkoutDetailScreen from '../screens/football/FootballWorkoutDetailScreen';
import ActiveWorkoutScreen from '../screens/football/ActiveWorkoutScreen';
import FootballProgramWorkoutsScreen from '../screens/football/FootballProgramWorkoutsScreen';

// Nutrition screens
import FoodLogScreen from '../screens/nutrition/FoodLogScreen';
import FoodSearchScreen from '../screens/nutrition/FoodSearchScreen';
import ManualFoodEntryScreen from '../screens/nutrition/ManualFoodEntryScreen';
import CreateCustomFoodScreen from '../screens/nutrition/CreateCustomFoodScreen';
import CreateCustomMealScreen from '../screens/nutrition/CreateCustomMealScreen';
import PhotoMealLogScreen from '../screens/nutrition/PhotoMealLogScreen';
import AINutritionAdvisorScreen from '../screens/nutrition/AINutritionAdvisorScreen';
import FoodDiaryScreen from '../screens/nutrition/FoodDiaryScreen';
import FoodDiaryScreenNew from '../screens/nutrition/FoodDiaryScreenNew';
import MealLogScreen from '../screens/nutrition/MealLogScreen';
import SimpleMealPlansScreen from '../screens/nutrition/SimpleMealPlansScreen';
import MealPlanSelectionScreen from '../screens/nutrition/MealPlanSelectionScreen';
import MealDetailScreen from '../screens/nutrition/MealDetailScreen';
import WorkoutPlanSelectionScreen from '../screens/workout/WorkoutPlanSelectionScreen';
import WorkoutDetailScreen from '../screens/workout/WorkoutDetailScreen';
import EditWeekScreen from '../screens/EditWeekScreen';

// Additional screens
import { SettingsScreen } from '../screens/SettingsScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';
import { AttendanceScreen } from '../screens/AttendanceScreen';
import { PersonalRecordsScreen } from '../screens/PersonalRecordsScreen';
import ProgressPhotosScreen from '../screens/progress/ProgressPhotosScreen';
import ExportDataScreen from '../screens/progress/ExportDataScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import MonthlyReportsScreen from '../screens/MonthlyReportsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import MealTrackingScreen from '../screens/MealTrackingScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import CalendarSyncScreen from '../screens/CalendarSyncScreen';
import MyActivityScreen from '../screens/activity/MyActivityScreen';

// Onboarding screens
import OnboardingWelcomeScreen from '../screens/onboarding/OnboardingWelcomeScreen';
import OnboardingAppPurposeScreen from '../screens/onboarding/OnboardingAppPurposeScreen';
import OnboardingInterestsScreen from '../screens/onboarding/OnboardingInterestsScreenV2';
import OnboardingGenderScreen from '../screens/onboarding/OnboardingGenderScreen';
import OnboardingBodyStatsScreen from '../screens/onboarding/OnboardingBodyStatsScreen';
import OnboardingFitnessLevelScreen from '../screens/onboarding/OnboardingFitnessLevelScreen';
import OnboardingFoodPreferencesScreen from '../screens/onboarding/OnboardingFoodPreferencesScreen';
import OnboardingTargetWeightScreen from '../screens/onboarding/OnboardingTargetWeightScreen';
import OnboardingCalorieResultsScreen from '../screens/onboarding/OnboardingCalorieResultsScreen';
import OnboardingWorkoutDaysScreen from '../screens/onboarding/OnboardingWorkoutDaysScreen';
import OnboardingPlansWelcomeScreen from '../screens/onboarding/OnboardingPlansWelcomeScreen';
import OnboardingNotificationsScreen from '../screens/onboarding/OnboardingNotificationsScreen';
import OnboardingCompleteScreen from '../screens/onboarding/OnboardingCompleteScreen';
import OnboardingAllergensScreen from '../screens/onboarding/OnboardingAllergensScreen';
import OnboardingDietsScreen from '../screens/onboarding/OnboardingDietsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const HomeStack = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const [appPurpose, setAppPurpose] = useState<'gym' | 'football'>('gym');

  useEffect(() => {
    const loadAppPurpose = async () => {
      try {
        const savedPurpose = await AsyncStorage.getItem('appPurpose');
        if (savedPurpose === 'gym' || savedPurpose === 'football') {
          setAppPurpose(savedPurpose);
        }
      } catch (error) {
        console.error('Failed to load app purpose:', error);
      }
    };
    loadAppPurpose();
  }, []);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#202124' : 'white',
        },
        headerTintColor: isDark ? 'white' : 'black',
      }}
    >
      <Stack.Screen
        name="HomeMain"
        component={appPurpose === 'football' ? FootballHomeScreen : TryScreen}
        options={{
          headerShown: true,
          headerTransparent: true,
          headerTitle: '',
          headerRight: () => <ProfileButton />,
        }}
      />
      <Stack.Screen
        name="MyActivity"
        component={MyActivityScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const WorkoutStack = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#202124' : 'white',
        },
        headerTintColor: isDark ? 'white' : 'black',
      }}
    >
      <Stack.Screen
        name="WorkoutMain"
        component={TestingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WorkoutPlanSelection"
        component={WorkoutPlanSelectionScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AIWorkoutGenerator"
        component={AIWorkoutGeneratorScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="WorkoutDetail"
        component={WorkoutDetailScreen}
        options={{ title: t('nav.workoutDetails') }}
      />
      <Stack.Screen
        name="EditWeek"
        component={EditWeekScreen}
        options={{ title: t('nav.editWeek'), headerShown: false }}
      />
      <Stack.Screen
        name="WorkoutLog"
        component={WorkoutLogScreen}
        options={{ title: t('nav.logWorkout') }}
      />
      <Stack.Screen
        name="PersonalRecords"
        component={PersonalRecordsScreen}
        options={{ title: t('nav.personalRecords') }}
      />
      <Stack.Screen
        name="ProgressPhotos"
        component={ProgressPhotosScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const FootballStack = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#202124' : 'white',
        },
        headerTintColor: isDark ? 'white' : 'black',
      }}
    >
      <Stack.Screen
        name="FootballMain"
        component={FootballTrainingScreen}
      <Stack.Screen
        name="FootballProgramWorkouts"
        component={FootballProgramWorkoutsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FootballWorkoutDetail"
        component={FootballWorkoutDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{ headerShown: false }}
      />
        options={{ headerShown: false }}
      />
      {/* Will add more football-specific screens later */}
    </Stack.Navigator>
  );
};


const NutritionStack = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#202124' : 'white',
        },
        headerTintColor: isDark ? 'white' : 'black',
      }}
    >
      <Stack.Screen
        name="NutritionMain"
        component={FoodDiaryScreenNew}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FoodLog"
        component={FoodLogScreen}
        options={{ title: t('nav.logFood') }}
      />
      <Stack.Screen
        name="MealLog"
        component={MealLogScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FoodSearch"
        component={FoodSearchScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ManualFoodEntry"
        component={ManualFoodEntryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PhotoMealLog"
        component={PhotoMealLogScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AINutritionAdvisor"
        component={AINutritionAdvisorScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateCustomFood"
        component={CreateCustomFoodScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CreateCustomMeal"
        component={CreateCustomMealScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FoodDiary"
        component={FoodDiaryScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MealPlans"
        component={SimpleMealPlansScreen}
        options={{ title: t('nav.mealPlans') }}
      />
      <Stack.Screen
        name="MealPlanSelection"
        component={MealPlanSelectionScreen}
        options={{ title: t('nav.selectMealPlan') }}
      />
      <Stack.Screen
        name="MealDetail"
        component={MealDetailScreen}
        options={{ title: t('nav.mealDetails') }}
      />
    </Stack.Navigator>
  );
};

const CalendarStack = () => {
  const { isDark } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#202124' : 'white',
        },
        headerTintColor: isDark ? 'white' : 'black',
      }}
    >
      <Stack.Screen
        name="CalendarMain"
        component={CalendarScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="CalendarSync"
        component={CalendarSyncScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const ProgressStack = () => {
  const { isDark } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#202124' : 'white',
        },
        headerTintColor: isDark ? 'white' : 'black',
      }}
    >
      <Stack.Screen
        name="ProgressMain"
        component={ProgressScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProgressPhotos"
        component={ProgressPhotosScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ExportData"
        component={ExportDataScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const ProfileButton = () => {
  const { user } = useAuth();
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Profile' as never)}
      style={{ marginRight: 15 }}
    >
      <Avatar.Text
        size={36}
        label={user?.name?.charAt(0) || 'U'}
        style={{ backgroundColor: '#E94E1B' }}
      />
    </TouchableOpacity>
  );
};

const OnboardingStack = () => {
  const { isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#1a2a3a' }
      }}
    >
      <Stack.Screen name="OnboardingWelcome" component={OnboardingWelcomeScreen} />
      <Stack.Screen name="OnboardingAppPurpose" component={OnboardingAppPurposeScreen} />
      <Stack.Screen name="OnboardingInterests" component={OnboardingInterestsScreen} />
      <Stack.Screen name="OnboardingGender" component={OnboardingGenderScreen} />
      <Stack.Screen name="OnboardingBodyStats" component={OnboardingBodyStatsScreen} />
      <Stack.Screen name="OnboardingFitnessLevel" component={OnboardingFitnessLevelScreen} />
      <Stack.Screen name="OnboardingTargetWeight" component={OnboardingTargetWeightScreen} />
      <Stack.Screen name="OnboardingCalorieResults" component={OnboardingCalorieResultsScreen} />
      <Stack.Screen name="OnboardingWorkoutDays" component={OnboardingWorkoutDaysScreen} />
      <Stack.Screen name="OnboardingPlansWelcome" component={OnboardingPlansWelcomeScreen} />
      <Stack.Screen name="OnboardingNotifications" component={OnboardingNotificationsScreen} />
      <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteScreen} />
    </Stack.Navigator>
  );
};

const UserNavigator = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user, refreshKey]);

  const checkOnboardingStatus = async () => {
    try {
      if (!user) {
        setHasCompletedOnboarding(false);
        return;
      }

      const onboardingKey = `onboarding_complete_${user.id}`;
      const completed = await AsyncStorage.getItem(onboardingKey);

      // For debugging - let's see what's stored
      console.log('Checking onboarding status for user:', user.id);
      console.log('AsyncStorage value:', completed);

      setHasCompletedOnboarding(completed === 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setHasCompletedOnboarding(false);
    }
  };

  // Listen for onboarding completion
  useEffect(() => {
    const checkInterval = setInterval(async () => {
      if (!hasCompletedOnboarding) {
        const onboardingKey = `onboarding_complete_${user?.id}`;
        const completed = await AsyncStorage.getItem(onboardingKey);
        if (completed === 'true') {
          setHasCompletedOnboarding(true);
          clearInterval(checkInterval);
        }
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [hasCompletedOnboarding, user]);

  if (hasCompletedOnboarding === null) {
    return null;
  }

  return (
    <Stack.Navigator
      key={`navigator-${refreshKey}`}
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: isDark ? '#1a2a3a' : '#fff' }
      }}
    >
      {!hasCompletedOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingStack} />
      ) : (
        <Stack.Screen name="MainTabs" component={MainStack} />
      )}
    </Stack.Navigator>
  );
};

const MainStack = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: isDark ? '#202124' : 'white',
        },
        headerTintColor: isDark ? 'white' : 'black',
      }}
    >
      <Stack.Screen
        name="Main"
        component={UserTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MealTracking"
        component={MealTrackingScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t('nav.profile') }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('nav.settings') }}
      />
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ title: t('nav.privacyPolicy') }}
      />
      <Stack.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{ title: t('nav.subscription') }}
      />
      <Stack.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{ title: t('nav.attendance') }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: t('nav.notifications') }}
      />
      <Stack.Screen
        name="MonthlyReports"
        component={MonthlyReportsScreen}
        options={{ title: t('nav.monthlyReports') }}
      />
      <Stack.Screen
        name="Streak"
        component={StreakScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Onboarding"
        component={OnboardingStack}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

const UserTabNavigator = () => {
  const { colors, isDark } = useTheme();
  const { preferences } = useUserPreferences();
  const { t } = useLanguage();
  const [appPurpose, setAppPurpose] = useState<'gym' | 'football'>('gym');

  const loadAppPurpose = async () => {
    try {
      const savedPurpose = await AsyncStorage.getItem('appPurpose');
      console.log('Loading app purpose:', savedPurpose);
      if (savedPurpose === 'gym' || savedPurpose === 'football') {
        setAppPurpose(savedPurpose);
      }
    } catch (error) {
      console.error('Failed to load app purpose:', error);
    }
  };

  // Force LTR layout for tabs
  useEffect(() => {
    I18nManager.forceRTL(false);
  }, []);

  // Load app purpose from AsyncStorage on mount
  useEffect(() => {
    loadAppPurpose();
  }, []);

  // Reload app purpose when screen gains focus (e.g., coming back from Settings)
  useFocusEffect(
    React.useCallback(() => {
      loadAppPurpose();
    }, [])
  );

  // Default to 'both' if preferences not loaded yet
  const appInterest = preferences?.appInterest || 'both';

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'Home':
        return t('nav.home');
      case 'Workout':
        return appPurpose === 'football' ? 'Football' : t('nav.workouts');
      case 'Nutrition':
        return t('nav.nutrition');
      case 'Calendar':
        return 'Calendar';
      case 'Progress':
        return t('nav.progress');
      case 'Kira':
        return t('nav.ai');
      default:
        return routeName;
    }
  };

  return (
    <Tab.Navigator
      key={appPurpose} // Force remount when app purpose changes
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = 'home';

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Workout':
              iconName = appPurpose === 'football' ? 'soccer' : 'dumbbell';
              break;
            case 'Nutrition':
              iconName = 'food-apple';
              break;
            case 'Calendar':
              iconName = 'calendar';
              break;
            case 'Progress':
              iconName = 'chart-line';
              break;
            case 'Kira':
              iconName = 'robot';
              break;
          }

          return (
            <View style={styles.tabIconContainer}>
              <MaterialCommunityIcons
                name={iconName as any}
                size={24}
                color="#fff"
              />
              <Text style={[styles.tabLabel, { color: '#fff' }]}>{getTabLabel(route.name)}</Text>
            </View>
          );
        },
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#1A1A1A',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 85 : 70,
          paddingTop: 5,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingHorizontal: 10,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -5 },
          shadowOpacity: 0.3,
          shadowRadius: 15,
        },
        tabBarBackground: () => (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: '#1A1A1A',
            }}
          />
        ),
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          headerShown: false,
        }}
      />

      {/* Show Workout/Football tab only if user selected workouts, football, or both */}
      {((appInterest === 'workouts' || appInterest === 'both')) && (
        <Tab.Screen
          name="Workout"
          component={appPurpose === 'football' ? FootballStack : WorkoutStack}
        />
      )}

      {/* Show Nutrition tab only if user selected nutrition or both */}
      {(appInterest === 'nutrition' || appInterest === 'both') && (
        <Tab.Screen name="Nutrition" component={NutritionStack} />
      )}

      {/* Calendar is useful for both workouts and nutrition tracking */}
      <Tab.Screen name="Calendar" component={CalendarStack} />

      {/* Progress tab removed - feature still accessible from Profile/Settings */}

      {/* Kira AI tab */}
      <Tab.Screen name="Kira" component={AIAssistantScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 65,
    height: 55,
    paddingTop: 5,
  },
  iconWrapper: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'transparent',
    transform: [{ scale: 1 }],
  },
  iconWrapperActive: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    transform: [{ scale: 1.05 }],
  },
  activeIndicatorContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    alignItems: 'center',
  },
  activeIndicator: {
    width: 35,
    height: 3,
    borderRadius: 2,
    marginTop: -1,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    fontWeight: '500',
    letterSpacing: 0.3,
    textTransform: 'capitalize',
  },
});

export const AppNavigator = () => {
  const { user } = useAuth();

  if (!user) {
    return <AuthNavigator />;
  }

  switch (user.role) {
    case 'admin':
      return <AdminNavigator />;
    case 'coach':
      return <CoachNavigator />;
    case 'user':
    default:
      return <UserNavigator />;
  }
};
