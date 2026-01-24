import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import AppNavigator from '../../src/navigation/AppNavigator';

// ===== MOCK @constants/theme =====
jest.mock('@constants/theme', () => ({
  DARK_COLORS: {
    background: '#1C1C1E',
    text: '#FFFFFF',
  },
}));

// ===== MOCK SCREEN COMPONENTS =====
jest.mock('@screens/Introduce/Introduce', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockIntroduce() {
    return <View testID="Introduce" />;
  };
});
jest.mock('@screens/Home/Home', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockHome() {
    return <View testID="Home" />;
  };
});
jest.mock('@screens/Detail/Detail', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockDetail() {
    return <View testID="Detail" />;
  };
});
jest.mock('@screens/CameraLiveView/CameraLiveView', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockCameraLiveView() {
    return <View testID="CameraLiveView" />;
  };
});
jest.mock('@screens/Notifications/Notifications', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockNotifications() {
    return <View testID="Notifications" />;
  };
});
jest.mock('@screens/QRScanner/QRScanner', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockQRScanner() {
    return <View testID="QRScanner" />;
  };
});
jest.mock('@screens/CameraSetup/CameraSetup', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockCameraSetup() {
    return <View testID="CameraSetup" />;
  };
});
jest.mock('@screens/SetupComplete/SetupComplete', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockSetupComplete() {
    return <View testID="SetupComplete" />;
  };
});
jest.mock('@screens/Profile/Profile', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockProfile() {
    return <View testID="Profile" />;
  };
});
jest.mock('@screens/EditProfile/EditProfile', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockEditProfile() {
    return <View testID="EditProfile" />;
  };
});
jest.mock('@screens/ChangePassword/ChangePassword', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockChangePassword() {
    return <View testID="ChangePassword" />;
  };
});
jest.mock('@screens/DetectionZoneSetup/DetectionZoneSetup', () => {
  const React = require('react');
  const { View } = require('react-native');
  return function MockDetectionZoneSetup() {
    return <View testID="DetectionZoneSetup" />;
  };
});

describe('AppNavigator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  const renderAppNavigator = (initialState?: { routes: { name: string; params?: object }[]; index: number }) =>
    render(
      <NavigationContainer {...(initialState && { initialState: initialState as any })}>
        <AppNavigator />
      </NavigationContainer>
    );

  it('renders without crashing', () => {
    expect(() => renderAppNavigator()).not.toThrow();
  });

  it('renders the initial screen (Introduce) by default', () => {
    renderAppNavigator();
    expect(screen.getByTestId('Introduce')).toBeTruthy();
  });

  it('renders Stack.Navigator with correct structure', () => {
    const { toJSON } = renderAppNavigator();
    expect(toJSON()).toBeTruthy();
  });

  it('renders Home when initialState is Home', () => {
    renderAppNavigator({
      routes: [{ name: 'Home' }],
      index: 0,
    } as any);
    act(() => jest.runAllTimers());
    expect(screen.getByTestId('Home')).toBeTruthy();
  });

  it('renders Detail when initialState is Detail with params', () => {
    renderAppNavigator({
      routes: [{ name: 'Detail', params: { id: '1' } }],
      index: 0,
    } as any);
    act(() => jest.runAllTimers());
    expect(screen.getByTestId('Detail')).toBeTruthy();
  });

  it('renders Profile when initialState is Profile', () => {
    renderAppNavigator({
      routes: [{ name: 'Profile' }],
      index: 0,
    } as any);
    act(() => jest.runAllTimers());
    expect(screen.getByTestId('Profile')).toBeTruthy();
  });

  it('can navigate to Home screen via ref', async () => {
    const navigationRef = React.createRef<any>();
    render(
      <NavigationContainer ref={navigationRef}>
        <AppNavigator />
      </NavigationContainer>
    );

    expect(screen.getByTestId('Introduce')).toBeTruthy();

    await waitFor(() => {
      expect(navigationRef.current).toBeTruthy();
    });

    act(() => {
      navigationRef.current?.navigate('Home');
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.getByTestId('Home')).toBeTruthy();
    });
  });
});
