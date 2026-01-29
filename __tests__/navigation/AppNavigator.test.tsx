import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import AppNavigator from '../../src/navigation/AppNavigator';

// ===== MOCK @constants/theme =====
jest.mock('@constants/theme', () => ({
  COLORS: {
    main: '#00ADD4',
    background: '#FFFFFF',
    BBBBBB: '#BBBBBB',
    '3E3E3E': '#3E3E3E',
    primary: '#007AFF',
    secondary: '#5856D6',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    surface: '#F2F2F7',
    card: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    textTertiary: '#C7C7CC',
    border: '#E5E5EA',
    divider: '#E5E5EA',
    gray696969: '#696969',
    CACACA: '#CACACA',
    gray9A9A9A: '#9A9A9A',
    B8B8B8: '#B8B8B8',
    FF0000: '#FF0000',
  },
  DARK_COLORS: {
    background: '#1C1C1E',
    text: '#FFFFFF',
  },
  FONTS: {
    weights: {
      medium: '500',
      regular: '400',
      semiBold: '600',
      bold: '700',
    },
  },
}));

// ===== MOCK SCREEN COMPONENTS =====
jest.mock('@screens/Introduce/Introduce', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const React = require('react');
  const { View } = require('react-native');
  return function MockIntroduce() {
    return <View testID="Introduce" />;
  };
});
jest.mock('@screens/Home/Home', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const React = require('react');
  const { View } = require('react-native');
  return function MockHome() {
    return <View testID="Home" />;
  };
});
jest.mock('@screens/Detail/Detail', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const React = require('react');
  const { View } = require('react-native');
  return function MockDetail() {
    return <View testID="Detail" />;
  };
});
jest.mock('@screens/CameraLiveView/CameraLiveView', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const React = require('react');
  const { View } = require('react-native');
  return function MockCameraLiveView() {
    return <View testID="CameraLiveView" />;
  };
});
jest.mock('@screens/Notifications/Notifications', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const React = require('react');
  const { View } = require('react-native');
  return function MockNotifications() {
    return <View testID="Notifications" />;
  };
});
jest.mock('@screens/QRScanner/QRScanner', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const React = require('react');
  const { View } = require('react-native');
  return function MockQRScanner() {
    return <View testID="QRScanner" />;
  };
});
jest.mock('@screens/CameraSetup/CameraSetup', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const React = require('react');
  const { View } = require('react-native');
  return function MockCameraSetup() {
    return <View testID="CameraSetup" />;
  };
});
jest.mock('@screens/SetupComplete/SetupComplete', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const React = require('react');
  const { View } = require('react-native');
  return function MockSetupComplete() {
    return <View testID="SetupComplete" />;
  };
});
jest.mock('@screens/Profile/Profile', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const React = require('react');
  const { View } = require('react-native');
  return function MockProfile() {
    return <View testID="Profile" />;
  };
});
jest.mock('@screens/EditProfile/EditProfile', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const React = require('react');
  const { View } = require('react-native');
  return function MockEditProfile() {
    return <View testID="EditProfile" />;
  };
});
jest.mock('@screens/ChangePassword/ChangePassword', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const React = require('react');
  const { View } = require('react-native');
  return function MockChangePassword() {
    return <View testID="ChangePassword" />;
  };
});
jest.mock('@screens/DetectionZoneSetup/DetectionZoneSetup', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const React = require('react');
  const { View } = require('react-native');
  return function MockDetectionZoneSetup() {
    return <View testID="DetectionZoneSetup" />;
  };
});
jest.mock('@screens/ConnectDevice/ConnectDevice', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const React = require('react');
  const { View } = require('react-native');
  return function MockConnectDevice() {
    return <View testID="ConnectDevice" />;
  };
});
jest.mock('@screens/PairingCode/PairingCode', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const React = require('react');
  const { View } = require('react-native');
  return function MockPairingCode() {
    return <View testID="PairingCode" />;
  };
});
jest.mock('@screens/ConnectWifiHotspot/ConnectWifiHotspot', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const React = require('react');
  const { View } = require('react-native');
  return function MockConnectWifiHotspot() {
    return <View testID="ConnectWifiHotspot" />;
  };
});
jest.mock('@screens/NetworkSetup/NetworkSetup', () => {
  // eslint-disable-next-line @typescript-eslint/no-shadow
  const React = require('react');
  const { View } = require('react-native');
  return function MockNetworkSetup() {
    return <View testID="NetworkSetup" />;
  };
});

describe('AppNavigator', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  const renderAppNavigator = (initialState?: {
    routes: { name: string; params?: object }[];
    index: number;
  }) =>
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
