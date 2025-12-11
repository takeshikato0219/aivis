import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';

// ===== ROOT STACK =====
export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

// ===== AUTH STACK =====
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  VerifyEmail: { email: string };
};

// ===== APP STACK =====
export type AppStackParamList = {
  MainTabs: undefined;
  Demo: undefined;
  NetworkDebug: undefined;
};

// ===== BOTTOM TAB =====
export type BottomTabParamList = {
  HomeTab: undefined;
  SearchTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: { userId?: string };
};

// ===== NAVIGATION PROPS =====

// Auth
export type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

// Bottom Tab Screens với App Stack + Tab Navigation access
export type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'HomeTab'>,
  StackNavigationProp<AppStackParamList>
>;

export type SearchScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'SearchTab'>,
  StackNavigationProp<AppStackParamList>
>;

export type NotificationsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'NotificationsTab'>,
  StackNavigationProp<AppStackParamList>
>;

export type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<BottomTabParamList, 'ProfileTab'>,
  StackNavigationProp<AppStackParamList>
>;

export type ProfileScreenRouteProp = RouteProp<BottomTabParamList, 'ProfileTab'>;

// App Stack Screens
export type DemoScreenNavigationProp = StackNavigationProp<AppStackParamList, 'Demo'>;
export type NetworkDebugScreenNavigationProp = StackNavigationProp<
  AppStackParamList,
  'NetworkDebug'
>;

// ===== DECLARE GLOBAL =====
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
