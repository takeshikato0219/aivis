import { useEffect } from 'react';
import ErrorHandler from '@utils/errorHandler';
import NetworkMonitor from '@utils/networkMonitor';
import CrashReporter from '@utils/crashReporter';

interface UseAppSetupOptions {
  screenName?: string;
  onNetworkChange?: (isConnected: boolean) => void;
}

export const useAppSetup = (options?: UseAppSetupOptions) => {
  const { screenName, onNetworkChange } = options || {};

  useEffect(() => {
    // Set screen name for error tracking
    if (screenName) {
      ErrorHandler.setScreen(screenName);
    }

    // Setup network monitoring
    const unsubscribe = NetworkMonitor.addListener((state) => {
      if (onNetworkChange) {
        onNetworkChange(state.isConnected ?? false);
      }
    });

    // Send pending crash reports
    void CrashReporter.sendPendingReports();

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, [screenName, onNetworkChange]);

  return {
    isConnected: NetworkMonitor.isConnected(),
  };
};
