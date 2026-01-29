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
    // Line.setup({
    //   channelId: '2008969814',
    // });
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initI18n();
        setI18nInitialized(true);
      } catch (error) {
        console.error('[App] i18n initialization failed:', error);
        setI18nInitialized(true);
      }

      ErrorHandler.setScreen('App');
    };

    initializeApp();

    const themeSubscription = Appearance.addChangeListener(({ colorScheme: newColorScheme }) => {
      setColorScheme(newColorScheme);
    });

    const unsubscribeNetwork = NetworkMonitor.addListener(() => {});

    void CrashReporter.sendPendingReports();

    return () => {
      themeSubscription.remove();
      unsubscribeNetwork();
    };
  }, []);

  useEffect(() => {}, [isDarkMode, i18nInitialized]);

  if (!i18nInitialized) {
    return null;
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
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
