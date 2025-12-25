import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import TryScreen from '../screens/TryScreen';
import TraineesScreen from '../screens/coach/TraineesScreen';
import PlanBuilderScreen from '../screens/coach/PlanBuilderScreen';
import CoachAnalyticsScreen from '../screens/coach/CoachAnalyticsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { BRAND_COLORS } from '../constants/brandColors';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const CoachTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = 'home';

          switch (route.name) {
            case 'Dashboard':
              iconName = 'view-dashboard';
              break;
            case 'Trainees':
              iconName = 'account-multiple';
              break;
            case 'Plans':
              iconName = 'clipboard-edit';
              break;
            case 'Analytics':
              iconName = 'chart-line';
              break;
            case 'Profile':
              iconName = 'account';
              break;
          }

          return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#E94E1B',
        tabBarInactiveTintColor: 'gray',
        headerShown: true,
      })}
    >
      <Tab.Screen name="Dashboard" component={TryScreen} />
      <Tab.Screen name="Trainees" component={TraineesScreen} />
      <Tab.Screen name="Plans" component={PlanBuilderScreen} />
      <Tab.Screen name="Analytics" component={CoachAnalyticsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const CoachNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CoachMain" component={CoachTabNavigator} />
    </Stack.Navigator>
  );
};

export default CoachNavigator;