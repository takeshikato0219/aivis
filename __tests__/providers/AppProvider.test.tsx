import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import AppProvider from '../../src/providers/AppProvider';

// ===== MOCK @/i18n =====
jest.mock('@/i18n', () => ({
  initI18n: jest.fn(() => Promise.resolve()),
}));

// ===== MOCK @utils/errorHandler =====
const mockSetScreen = jest.fn();
jest.mock('@utils/errorHandler', () => ({
  setScreen: (...args: unknown[]) => mockSetScreen(...args),
  handleApiError: jest.fn(),
}));

// ===== MOCK @utils/networkMonitor =====
jest.mock('@utils/networkMonitor', () => ({
  addListener: jest.fn(() => jest.fn()),
  isConnected: jest.fn(() => true),
}));

// ===== MOCK @utils/crashReporter =====
const mockSendPendingReports = jest.fn(() => Promise.resolve());
const mockReportCrash = jest.fn(() => Promise.resolve());
jest.mock('@utils/crashReporter', () => ({
  // @ts-ignore
  sendPendingReports: (...args: unknown[]) => mockSendPendingReports(...args),
  // @ts-ignore
  reportCrash: (...args: unknown[]) => mockReportCrash(...args),
}));

// ===== MOCK @constants/materialTheme =====
jest.mock('@constants/materialTheme', () => ({
  paperDarkTheme: {
    colors: { background: '#121212' },
    dark: true,
  },
}));

// Use real @redux/store

describe('AppProvider', () => {
  const getInitI18nMock = () => require('@/i18n').initI18n as jest.Mock;
  const getNetworkMonitor = () => require('@utils/networkMonitor');

  beforeEach(() => {
    jest.clearAllMocks();
    getInitI18nMock().mockResolvedValue(undefined);
    // resetMocks clears addListener impl; AppProvider cleanup calls its return value
    getNetworkMonitor().addListener.mockReturnValue(jest.fn());
  });

  it('calls initI18n on mount', async () => {
    render(
      <AppProvider>
        <Text testID="child">Child</Text>
      </AppProvider>
    );

    await waitFor(() => {
      expect(getInitI18nMock()).toHaveBeenCalledTimes(1);
    });
  });

  it('calls ErrorHandler.setScreen with "App" on mount', async () => {
    render(
      <AppProvider>
        <Text testID="child">Child</Text>
      </AppProvider>
    );

    await waitFor(() => {
      expect(mockSetScreen).toHaveBeenCalledWith('App');
    });
  });

  it('calls CrashReporter.sendPendingReports on mount', async () => {
    render(
      <AppProvider>
        <Text testID="child">Child</Text>
      </AppProvider>
    );

    await waitFor(() => {
      expect(mockSendPendingReports).toHaveBeenCalled();
    });
  });

  it('returns null until i18n is initialized', () => {
    getInitI18nMock().mockImplementation(() => new Promise(() => {})); // never resolves

    const { queryByTestId } = render(
      <AppProvider>
        <Text testID="child">Child</Text>
      </AppProvider>
    );

    expect(queryByTestId('child')).toBeNull();
  });

  it('renders children after i18n is initialized', async () => {
    const { getByTestId } = render(
      <AppProvider>
        <Text testID="child">Child</Text>
      </AppProvider>
    );

    await waitFor(() => {
      expect(getByTestId('child')).toBeTruthy();
    });

    expect(getByTestId('child').props.children).toBe('Child');
  });

  it('registers Appearance theme listener and NetworkMonitor listener on mount', async () => {
    const { Appearance } = require('react-native');
    const addChangeListenerSpy = jest
      .spyOn(Appearance, 'addChangeListener')
      .mockReturnValue({ remove: jest.fn() });

    const { addListener: addNetworkListener } = require('@utils/networkMonitor');

    render(
      <AppProvider>
        <Text testID="child">Child</Text>
      </AppProvider>
    );

    await waitFor(() => {
      expect(addChangeListenerSpy).toHaveBeenCalled();
      expect(addNetworkListener).toHaveBeenCalled();
    });

    addChangeListenerSpy.mockRestore();
  });

  it('renders with Redux Provider and PaperProvider', async () => {
    const { getByTestId } = render(
      <AppProvider>
        <Text testID="child">Child</Text>
      </AppProvider>
    );

    await waitFor(() => {
      expect(getByTestId('child')).toBeTruthy();
    });
  });

  it('sets i18nInitialized to true even when initI18n rejects', async () => {
    getInitI18nMock().mockRejectedValueOnce(new Error('i18n fail'));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { getByTestId } = render(
      <AppProvider>
        <Text testID="child">Child</Text>
      </AppProvider>
    );

    await waitFor(() => {
      expect(getByTestId('child')).toBeTruthy();
    });

    expect(getInitI18nMock()).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
