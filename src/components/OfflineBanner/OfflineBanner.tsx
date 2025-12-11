import React, { useEffect, useState } from 'react';
import { Animated } from 'react-native';
import { Text } from 'react-native-paper';
import NetworkMonitor from '@utils/networkMonitor';
import { styles } from './OfflineBanner.styles';
import { useTranslation } from 'react-i18next';

const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!NetworkMonitor.isConnected());
  const [slideAnim] = useState(new Animated.Value(isOffline ? 0 : -100));
  const { t } = useTranslation();

  useEffect(() => {
    const initialStatus = !NetworkMonitor.isConnected();
    setIsOffline(initialStatus);

    const unsubscribe = NetworkMonitor.addListener((state) => {
      setIsOffline(!state.isConnected);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: isOffline ? 0 : -100,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOffline, slideAnim]);

  if (!isOffline) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text variant="labelLarge" style={styles.text}>
        ⚠️ {t('offline.title')}
      </Text>
    </Animated.View>
  );
};

export default OfflineBanner;
