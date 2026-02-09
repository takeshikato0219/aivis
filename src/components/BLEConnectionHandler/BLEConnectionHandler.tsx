import React, { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import { useAppSelector, useAppDispatch } from '@redux/store';
import { setCriticalDisconnection } from '@redux/slices/bleSlice';
import { useTranslation } from 'react-i18next';
import { navigationRef } from '@navigation/navigationRef';

const BLEConnectionHandler: React.FC = () => {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { criticalDisconnection } = useAppSelector((state) => state.ble);
  const alertShownRef = useRef(false);

  useEffect(() => {
    if (criticalDisconnection && !alertShownRef.current) {
      alertShownRef.current = true;

      Alert.alert(
        t('bluetoothScreen.connectionLost'),
        t('bluetoothScreen.deviceDisconnectedPleaseReconnect'),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              // Reset the critical disconnection flag
              dispatch(setCriticalDisconnection(false));
              alertShownRef.current = false;

              // Navigate to ConnectDevice screen using navigationRef
              if (navigationRef.isReady()) {
                // Reset navigation stack to App > ConnectDevice
                navigationRef.dispatch(
                  CommonActions.reset({
                    index: 1,
                    routes: [
                      {
                        name: 'App',
                        state: {
                          routes: [{ name: 'Home' }, { name: 'ConnectDevice' }],
                          index: 1,
                        },
                      },
                    ],
                  })
                );
              }
            },
          },
        ],
        { cancelable: false }
      );
    }
  }, [criticalDisconnection, dispatch, t]);

  return null; // This component doesn't render anything
};

export default BLEConnectionHandler;
