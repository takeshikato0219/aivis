import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from './types';

// Import screens
import Login from '@screens/Login/Login';
import Register from '@screens/Register/Register';
import ForgotPassword from '@screens/ForgotPassword/ForgotPassword';
import Policy from "@screens/Policy/Policy";

const Stack = createStackNavigator<AuthStackParamList>();

const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'transparent' },
        // Animation config
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen
        name="Login"
        component={Login}
        options={{
          title: 'Sign In',
          animation: 'none',
        }}
      />
      <Stack.Screen
        name="Register"
        component={Register}
        options={{
          title: 'Sign Up',
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPassword}
        options={{
          title: 'Forgot Password',
        }}
      />
      <Stack.Screen
        name="Policy"
        component={Policy}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
