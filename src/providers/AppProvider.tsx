import React, { useEffect, useState } from 'react';
import { LogBox, StatusBar, useColorScheme, Appearance } from 'react-native';
import { Provider } from 'react-redux';
import { PaperProvider } from 'react-native-paper';
import { store } from '@redux/store';
import { paperDarkTheme } from '@constants/materialTheme';
import ErrorBoundary from '@components/ErrorBoundary/ErrorBoundary';
import OfflineBanner from '@components/OfflineBanner/OfflineBanner';
import ErrorHandler from '@utils/errorHandler';
import NetworkMonitor from '@utils/networkMonitor';
import CrashReporter from '@utils/crashReporter';
import { initI18n } from '@/i18n';
import { jetsonBLEService } from '@/services/jetsonBLEService';

// Ignore logs
LogBox.ignoreLogs(['Non-serializable']);

if (!__DEV__) {
  LogBox.ignoreAllLogs(true);
}

interface AppProviderProps {
  children: React.ReactNode;
}

const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const initialColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState(initialColorScheme);
  const [i18nInitialized, setI18nInitialized] = useState(false);

  const isDarkMode = colorScheme === 'dark';
  const theme = paperDarkTheme;

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initI18n();
        setI18nInitialized(true);
      } catch (error) {
        console.error('[App] i18n initialization failed:', error);
        setI18nInitialized(true);
      }

      // Initialize BLE service singleton
      jetsonBLEService.init();

      ErrorHandler.setScreen('App');
    };

    initializeApp();

    const themeSubscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      setColorScheme(newColorScheme);
    });

    const unsubscribeNetwork = NetworkMonitor.addListener(() => {});

    void CrashReporter.sendPendingReports();

    // Note: We don't disconnect BLE when app goes to background
    // Only disconnect when app is killed (in cleanup function below)
    // This allows BLE connection to persist when app is in background

    // Cleanup when app is terminated (killed/cleared from background)
    return () => {
      themeSubscription.remove();
      unsubscribeNetwork();
      // Disconnect BLE when app component unmounts (app is killed/cleared)
      console.log('[App] App terminating, disconnecting BLE connection...');
      void jetsonBLEService.disconnect();
    };
  }, []);

  useEffect(() => {}, [isDarkMode, i18nInitialized]);

  if (!i18nInitialized) {
    return null;
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('[App] Error caught by ErrorBoundary, cleaning up BLE...');
        // Cleanup BLE subscriptions on app crash
        void jetsonBLEService.disconnect();
        void CrashReporter.reportCrash(error, {
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      <Provider store={store}>
        <PaperProvider theme={theme}>
          <StatusBar
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
            backgroundColor={theme.colors.background}
            translucent={false}
          />
          <OfflineBanner />
          {children}
        </PaperProvider>
      </Provider>
    </ErrorBoundary>
  );
};

export default AppProvider;
