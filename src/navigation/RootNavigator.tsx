import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppSelector } from '@redux/store';
import { RootStackParamList } from './types';
import { StyleSheet } from 'react-native';

// Import navigators
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';

// Import components
import { ActivityIndicator, View } from 'react-native';
import { COLORS } from '@constants/theme';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { isAuthenticated, isLoading } = useAppSelector((state) => state.auth);

  const styles = StyleSheet.create({
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: COLORS.primary,
          background: COLORS.background,
          card: COLORS.card,
          text: COLORS.text,
          border: COLORS.border,
          notification: COLORS.error,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '900' },
        },
      }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // User is logged in → Show App Navigator
          <Stack.Screen name="App" component={AppNavigator} />
        ) : (
          // User not logged in → Show Auth Navigator
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
