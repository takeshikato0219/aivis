import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { pushNotificationService } from '@/services/pushNotificationService';
import type { RootState } from '@redux/store';

/**
 * Initializes Firebase push notifications when user is logged in.
 * Must be rendered inside Redux Provider.
 */
const PushNotificationInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const prevAuthRef = useRef(isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) {
      void pushNotificationService.init();
    } else if (prevAuthRef.current) {
      // User just logged out
      void pushNotificationService.deleteToken();
      pushNotificationService.cleanup();
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    return () => {
      pushNotificationService.cleanup();
    };
  }, []);

  return <>{children}</>;
};

export default PushNotificationInitializer;
