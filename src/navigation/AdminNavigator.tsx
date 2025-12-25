import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import TryScreen from '../screens/TryScreen';
import UsersManagementScreen from '../screens/admin/UsersManagementScreen';
import PlansManagementScreen from '../screens/admin/PlansManagementScreen';
import AnalyticsScreen from '../screens/admin/AnalyticsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { BRAND_COLORS } from '../constants/brandColors';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const AdminTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string = 'home';

          switch (route.name) {
            case 'Dashboard':
              iconName = 'view-dashboard';
              break;
            case 'Users':
              iconName = 'account-group';
              break;
            case 'Plans':
              iconName = 'clipboard-list';
              break;
            case 'Analytics':
              iconName = 'chart-bar';
              break;
            case 'Settings':
              iconName = 'cog';
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
      <Tab.Screen name="Users" component={UsersManagementScreen} />
      <Tab.Screen name="Plans" component={PlansManagementScreen} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

const AdminNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminMain" component={AdminTabNavigator} />
    </Stack.Navigator>
  );
};

export default AdminNavigator;