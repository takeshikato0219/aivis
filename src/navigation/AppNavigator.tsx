import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { useTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/Ionicons';
import { AppStackParamList, BottomTabParamList } from './types';
import { COLORS } from '@constants/theme';

// Import Screens
import HomeScreen from '@screens/HomeScreen/HomeScreen';
import SearchScreen from '@screens/SearchScreen/SearchScreen';
import NotificationsScreen from '@screens/NotificationsScreen/NotificationsScreen';
import ProfileScreen from '@screens/ProfileScreen/ProfileScreen';
import DemoScreen from '@screens/DemoScreen/DemoScreen';

const Stack = createStackNavigator<AppStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

// ===== TAB ICON HELPER =====
const getTabBarIcon =
  (routeName: keyof BottomTabParamList) =>
  ({ focused, color, size }: { focused: boolean; color: string; size: number }) => {
    let iconName = 'home';

    switch (routeName) {
      case 'HomeTab':
        iconName = focused ? 'home' : 'home-outline';
        break;
      case 'SearchTab':
        iconName = focused ? 'search' : 'search-outline';
        break;
      case 'NotificationsTab':
        iconName = focused ? 'notifications' : 'notifications-outline';
        break;
      case 'ProfileTab':
        iconName = focused ? 'person' : 'person-outline';
        break;
    }

    return <Icon name={iconName} size={size} color={color} />;
  };

// ===== BOTTOM TAB NAVIGATOR =====
const BottomTabNavigator = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary || COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface || COLORS.background,
          borderTopWidth: 1,
          borderTopColor: theme.colors.outline || COLORS.border,
          height: Platform.OS === 'ios' ? 88 : 60,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: getTabBarIcon(route.name),
      })}
    >
      {/* Direct screen components */}
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
        }}
      />

      <Tab.Screen
        name="SearchTab"
        component={SearchScreen}
        options={{
          tabBarLabel: 'Search',
        }}
      />

      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Notifications',
          tabBarBadge: 3,
        }}
      />

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// ===== APP STACK NAVIGATOR (Wrap BottomTab + Modal Screens) =====
const AppNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: COLORS.background,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 18,
        },
      }}
    >
      {/* Main BottomTab */}
      <Stack.Screen
        name="MainTabs"
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />

      {/* Modal/Overlay Screens */}
      <Stack.Screen
        name="Demo"
        component={DemoScreen}
        options={{
          title: 'Design Components',
        }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
