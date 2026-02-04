import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WifiIcon from '@assets/svg/wifi-vector.svg';
import LanIcon from '@assets/svg/ethernet-port.svg';
import SimIcon from '@assets/svg/signal.svg';
import CheckIcon from '@assets/svg/icon-check.svg';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { styles } from './NetworkSetup.styles';
import HomeBackgroundImage from '@assets/png/home-background.png';
import BackIcon from '@assets/svg/icon-back.svg';
import { useTranslation } from 'react-i18next';
import NetInfo from '@react-native-community/netinfo';
import { LockIconComponent } from '@components/IconCustom/IconCustom';
import { COLORS } from '@constants/theme';
import { NetworkSetupNavigationProp, NetworkSetupRouteProp } from '@navigation/types';
import TextInput from '@components/TextInput/TextInput';
import { useInput } from '@hooks/useInput';
import { isPasswordWifi } from '@utils/validate';
import { useAppSelector, useAppDispatch } from '@redux/store';
import DeviceInfo from 'react-native-device-info';
import { useJetsonBLE } from '@hooks/useJetsonBLE';
import { resetWifiState, resetConnectionState } from '@redux/slices/bleSlice';

interface WifiItem {
  id: string;
  name: string;
  signal: 'excellent' | 'good' | 'weak';
  secure: boolean;
  capabilities: string;
  isWep: boolean;
}

const getSignalStyle = (signal: string) => {
  const signalStyles = {
    excellent: styles.signalExcellent,
    good: styles.signalGood,
    weak: styles.signalWeak,
  };
  return signalStyles[signal as keyof typeof signalStyles] || styles.signalWeak;
};

const getSignalText = (signal: string, t: any) => {
  const signalTexts = {
    excellent: t('networkSetup.excellentSignal') || 'Excellent',
    good: t('networkSetup.goodSignal') || 'Good',
    weak: t('networkSetup.weakSignal') || 'Weak',
  };
  return signalTexts[signal as keyof typeof signalTexts] || 'Weak';
};

const TABS = [
  { key: 'wifi', title: 'Wi-Fi', icon: <WifiIcon width={22} height={22} /> },
  { key: 'lan', title: 'LAN', icon: <LanIcon width={22} height={22} /> },
  { key: 'lte', title: 'LTE', icon: <SimIcon width={20} height={20} /> },
];

const NetworkSetup: React.FC = () => {
  const navigation = useNavigation<NetworkSetupNavigationProp>();
  const route = useRoute<NetworkSetupRouteProp>();
  const [activeTab, setActiveTab] = useState<'wifi' | 'lan' | 'lte'>('wifi');
  const [wifiList] = useState<WifiItem[]>([]);
  const [selectedWifi, setSelectedWifi] = useState<WifiItem | null>(null);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [progress, setProgress] = useState(0.33);
  const { t } = useTranslation();
  const { isLoading } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const [lteCarrier, setLteCarrier] = useState<string | null>(null);
  const [lteInfo, setLteInfo] = useState<any>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [connectingLte, setConnectingLte] = useState(false);

  // Track timeout IDs for cleanup
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finalTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isConnectingRef = useRef<boolean>(false);

  const ltePasswordInput = useInput({
    validateFn: isPasswordWifi,
  });

  const passwordInput = useInput({
    validateFn: isPasswordWifi,
  });

  const {
    wifiNetworks,
    wifiScanStatus,
    isConnected: bleConnected,
    requestWiFiScan,
    sendWiFiCredentials,
    wifiStatus,
    isStillConnected,
  } = useJetsonBLE();

  const currentWifiList = useMemo((): WifiItem[] => {
    if (bleConnected && wifiNetworks.length > 0) {
      return wifiNetworks.map((network, idx) => ({
        id: '' + idx,
        name: network.ssid,
        signal: network.signal >= -55 ? 'excellent' : network.signal >= -70 ? 'good' : 'weak',
        secure: network.security !== 'open',
        capabilities: network.security,
        isWep: false,
      }));
    }
    return wifiList;
  }, [bleConnected, wifiNetworks, wifiList]);

  // Check if currently scanning (BLE or native)
  const isScanning = useMemo(() => {
    return scanning || (bleConnected && wifiScanStatus === 1);
  }, [scanning, bleConnected, wifiScanStatus]);

  // Reset local scanning state when BLE scan completes
  useEffect(() => {
    // wifiScanStatus: 0 = IDLE, 1 = SCANNING, 2 = COMPLETED, 3 = ERROR
    if (wifiScanStatus === 2 || wifiScanStatus === 3) {
      console.log('📡 WiFi scan finished, status:', wifiScanStatus);
      setScanning(false);
    }
  }, [wifiScanStatus]);

  useEffect(() => {
    let isMounted = true;

    const fetchLteInfo = async () => {
      try {
        // Fetch SIM card information
        let carrierName = null;
        let hasSimCard = false;

        try {
          carrierName = await DeviceInfo.getCarrier();
          if (Platform.OS === 'ios') {
            const realCarrierIndicators = [
              'verizon',
              'att',
              'tmobile',
              'sprint',
              'at&t',
              'vodafone',
              'o2',
              'ee',
              'orange',
              'telecom',
              'mobile',
              'cellular',
              'carrier',
            ];

            const lowerCarrier = carrierName?.toLowerCase() || '';

            // Check for real carrier names (even if short)
            hasSimCard = Boolean(
              carrierName &&
              carrierName !== '--' &&
              carrierName !== '' &&
              carrierName.trim().length > 0 &&
              !lowerCarrier.includes('unknown') &&
              !lowerCarrier.includes('test') &&
              !lowerCarrier.includes('no service')
            );

            // Additional check: if it looks like a real carrier name
            if (!hasSimCard && carrierName && carrierName.length >= 2) {
              hasSimCard = realCarrierIndicators.some((indicator) =>
                lowerCarrier.includes(indicator)
              );
            }
          } else {
            // Android logic (keep existing)
            hasSimCard = Boolean(
              carrierName &&
              carrierName !== '--' &&
              carrierName !== 'No carrier' &&
              carrierName !== '' &&
              carrierName !== 'Carrier' &&
              carrierName !== 'Unknown' &&
              carrierName.trim().length > 0
            );

            if (
              carrierName &&
              (carrierName.toLowerCase().includes('test') ||
                carrierName.toLowerCase().includes('unknown') ||
                carrierName.length < 2)
            ) {
              hasSimCard = false;
            }
          }
        } catch (carrierError) {
          console.warn('Failed to get carrier name:', carrierError);
          hasSimCard = false;
        }

        const simInfo = {
          carrierName,
          hasSimCard,
          mcc: null,
          mnc: null,
          isoCountryCode: null,
          networkOperator: null,
        };

        // Fetch network information
        let netInfo = null;
        try {
          netInfo = await NetInfo.fetch();
        } catch (netError) {
          console.warn('Failed to get network info:', netError);
        }

        // Multiple ways to detect cellular:
        const hasCellularFromNetInfo =
          (netInfo?.type === 'cellular' && (netInfo?.details as any)?.cellularGeneration) ||
          (netInfo?.type === 'cellular' && (netInfo?.details as any)?.carrier) ||
          netInfo?.type === 'cellular';

        const hasCellularFromSim = simInfo.hasSimCard;

        // Additional cellular capability checks
        let hasCellularByDeviceType = false;
        try {
          // Most mobile devices have cellular capability
          // Check if it's a phone/tablet (not just WiFi-only device)
          const deviceType = DeviceInfo.getDeviceType();
          const isTablet = DeviceInfo.isTablet();
          const isEmulator = await DeviceInfo.isEmulator();
          // Phones and tablets typically have cellular, but WiFi-only devices don't
          hasCellularByDeviceType = (deviceType === 'Handset' || isTablet) && !isEmulator;
        } catch (deviceError) {
          console.warn('Failed to get device info:', deviceError);
        }

        const finalHasCellular =
          hasCellularFromNetInfo || hasCellularFromSim || hasCellularByDeviceType;

        if (isMounted) {
          setLteCarrier(carrierName || null);
          setLteInfo({ ...simInfo, hasCellularCapability: finalHasCellular });
          setNetworkInfo(netInfo || { isConnected: false, type: 'none' });
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        if (isMounted) {
          setLteCarrier(null);
          setLteInfo(null);
          setNetworkInfo(null);
        }
      }
      if (isMounted) {
        setConnectingLte(false);
        setProgress(0.33);
      }
    };

    // Fetch LTE info when component mounts
    fetchLteInfo();

    // Add network state listener to update in real-time
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (isMounted) {
        setNetworkInfo(state);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();

      // Cancel any pending timeouts on unmount
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (finalTimeoutRef.current) {
        clearTimeout(finalTimeoutRef.current);
        finalTimeoutRef.current = null;
      }
      isConnectingRef.current = false;
    };
  }, []); // Fetch on mount and cleanup listener on unmount

  const handleConnectLte = async () => {
    if (
      !lteInfo?.hasSimCard || // Must have SIM card to connect
      !ltePasswordInput.value ||
      ltePasswordInput.error
    )
      return;
    setConnectingLte(true);
    setProgress(0.7);
    setTimeout(() => {
      setProgress(1);
      setConnectingLte(false);

      // Navigate to SetupComplete with LTE info
      const cameraName = route.params?.cameraAp || 'Camera';

      navigation.replace('SetupComplete', {
        cameraName,
        ssid: lteCarrier || 'LTE Network',
      });
    }, 1600);
  };

  const scanWifi = useCallback(async () => {
    console.log('🔄 scanWifi called - bleConnected:', bleConnected);

    // Check BLE connection first
    if (!bleConnected) {
      console.log('❌ BLE not connected - cannot scan WiFi');
      Alert.alert(
        t('networkSetup.connectionError'),
        t('networkSetup.bLEConnectionLostPleaseGoBackAndReconnect')
      );
      return;
    }

    // If currently connecting, cancel the connection process to allow rescan
    if (isConnectingRef.current) {
      console.log('⚠️ Cancelling ongoing WiFi connection to allow rescan');
      // Cancel pending timeouts
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (finalTimeoutRef.current) {
        clearTimeout(finalTimeoutRef.current);
        finalTimeoutRef.current = null;
      }
      isConnectingRef.current = false;
      setConnecting(false);
      setProgress(0.33);
    }

    // Reset selection
    setSelectedWifi(null);
    passwordInput.setValue('');

    // Set local scanning state (will be combined with wifiScanStatus in isScanning memo)
    setScanning(true);

    try {
      console.log('📡 Requesting WiFi scan via BLE...');
      const success = await requestWiFiScan();
      console.log('📡 requestWiFiScan result:', success);

      if (!success) {
        Alert.alert(
          t('networkSetup.wifiScanError'),
          t('networkSetup.failedToRequestWiFiScanFromDevice')
        );
        setScanning(false);
      }
      // If success is true, keep scanning=true and let useEffect handle reset
      // when wifiScanStatus changes to COMPLETED or ERROR
    } catch (e) {
      console.warn('❌ BLE WiFi scan failed:', e);
      Alert.alert(t('networkSetup.wifiScanError'), String(e));
      setScanning(false);
    }
  }, [bleConnected, requestWiFiScan, passwordInput, t]);

  useEffect(() => {
    if (activeTab === 'wifi' && bleConnected) {
      void scanWifi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Auto-trigger Wi-Fi scan when BLE connection is detected
  useEffect(() => {
    if (bleConnected && activeTab === 'wifi') {
      void scanWifi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bleConnected, activeTab]);

  // Verify BLE connection when screen is focused
  useFocusEffect(
    useCallback(() => {
      const checkConnection = async () => {
        // If Redux shows disconnected, verify actual connection
        if (!bleConnected) {
          const stillConnected = await isStillConnected();
          if (stillConnected) {
            console.log('[NetworkSetup] BLE connection exists but Redux state shows disconnected');
            // Connection exists - this is unexpected, but we can continue
          } else {
            console.log('[NetworkSetup] BLE connection lost');
          }
        }
      };
      checkConnection();
    }, [bleConnected, isStillConnected])
  );

  const onTabChange = (tab: 'wifi' | 'lan' | 'lte') => {
    setActiveTab(tab);
    if (tab === 'wifi') {
      void scanWifi();
      setProgress(0.33);
      passwordInput.setValue('');
      setConnecting(false);
    } else if (tab === 'lte') {
      ltePasswordInput.setValue('');
      setConnectingLte(false);
      setProgress(0.33);
    }
  };

  // Shared function to navigate to next screen
  const proceedToNextScreen = useCallback(() => {
    const cameraName = route.params?.cameraAp || 'Camera';
    const connectedSsid = selectedWifi?.name || 'WiFi Network';

    navigation.replace('SetupComplete', {
      cameraName,
      ssid: connectedSsid,
    });
  }, [route.params?.cameraAp, selectedWifi?.name, navigation]);

  // Reset UI state helper (local state only, not Redux)
  const resetUIState = useCallback(() => {
    // Cancel any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (finalTimeoutRef.current) {
      clearTimeout(finalTimeoutRef.current);
      finalTimeoutRef.current = null;
    }

    // Reset connecting ref
    isConnectingRef.current = false;

    // Reset UI state
    setConnecting(false);
    setProgress(0.33);

    // Clear selected Wi-Fi and password to allow retry
    setSelectedWifi(null);
    passwordInput.setValue('');
  }, [passwordInput]);

  const canConnect = useMemo(() => {
    return selectedWifi && passwordInput.value && !passwordInput.error;
  }, [selectedWifi, passwordInput.value, passwordInput.error]);

  const handleConnect = useCallback(async () => {
    if (!selectedWifi || !passwordInput.value) {
      Alert.alert(
        t('networkSetup.connectionFailed'),
        t('networkSetup.pleaseSelectAWiFiNetworkAndEnterPassword')
      );
      return;
    }

    // Check BLE connection before attempting WiFi connection
    if (!bleConnected) {
      Alert.alert(
        t('networkSetup.connectionError'),
        t('networkSetup.bLEConnectionLostPleaseGoBackAndReconnect')
      );
      return;
    }

    // Cancel any pending timeouts before starting new connection
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (finalTimeoutRef.current) {
      clearTimeout(finalTimeoutRef.current);
      finalTimeoutRef.current = null;
    }

    isConnectingRef.current = true;
    setConnecting(true);
    setProgress(0.5);

    try {
      const success = await sendWiFiCredentials(selectedWifi.name, passwordInput.value);

      if (!success) {
        // Check if BLE is still connected after Wi-Fi credential send failure
        const stillConnected = await isStillConnected();

        if (!stillConnected) {
          Alert.alert(
            t('networkSetup.connectionError'),
            t('networkSetup.bLEConnectionLostDuringWiFiSetupPleaseGoBackAndReconnect')
          );
          dispatch(resetConnectionState());
        } else {
          Alert.alert(
            t('networkSetup.connectionFailed'),
            t('networkSetup.failedToSendWiFiCredentialsToDevice')
          );
          dispatch(resetWifiState());
        }
        resetUIState();
        return;
      }

      // Wait for device to connect and report success
      timeoutRef.current = setTimeout(async () => {
        // Check if we're still connecting (might have been cancelled)
        if (!isConnectingRef.current) {
          return;
        }

        // Check BLE connection status before checking WiFi status
        const stillConnected = await isStillConnected();

        if (!stillConnected) {
          Alert.alert(
            t('networkSetup.connectionError'),
            t('networkSetup.bLEConnectionLostDuringWiFiSetupPleaseGoBackAndReconnect')
          );
          dispatch(resetConnectionState());
          resetUIState();
          return;
        }

        if (wifiStatus === 2) {
          // Clear timeouts before proceeding
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
          }
          if (finalTimeoutRef.current) {
            clearTimeout(finalTimeoutRef.current);
            finalTimeoutRef.current = null;
          }
          proceedToNextScreen();
        } else if (wifiStatus === 3) {
          Alert.alert(
            t('networkSetup.connectionFailed'),
            t('networkSetup.deviceFailedToConnectToWiFi')
          );
          // Check if BLE is still connected - if yes, only reset WiFi state
          const stillConnectedOnError = await isStillConnected();
          if (stillConnectedOnError) {
            dispatch(resetWifiState());
          } else {
            dispatch(resetConnectionState());
          }
          resetUIState();
        } else {
          finalTimeoutRef.current = setTimeout(async () => {
            // Check if we're still connecting (might have been cancelled)
            if (!isConnectingRef.current) {
              return;
            }

            // Check BLE connection again before final status check
            const stillConnectedFinal = await isStillConnected();

            if (!stillConnectedFinal) {
              Alert.alert(
                t('networkSetup.connectionError'),
                t('networkSetup.bLEConnectionLostDuringWiFiSetupPleaseGoBackAndReconnect')
              );
              dispatch(resetConnectionState());
              resetUIState();
              return;
            }

            if (wifiStatus === 2) {
              // Clear timeouts before proceeding
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
              }
              if (finalTimeoutRef.current) {
                clearTimeout(finalTimeoutRef.current);
                finalTimeoutRef.current = null;
              }
              proceedToNextScreen();
            } else {
              Alert.alert(
                t('networkSetup.connectionFailed'),
                t('networkSetup.wiFiConnectionTimeout')
              );
              // BLE is still connected (checked above), only reset WiFi state
              dispatch(resetWifiState());
              resetUIState();
            }
          }, 5000);
        }
      }, 3000);
    } catch (error) {
      // Check BLE connection after error
      const stillConnected = await isStillConnected();

      if (!stillConnected) {
        Alert.alert(
          t('networkSetup.connectionError'),
          t('networkSetup.bLEConnectionLostDuringWiFiSetupPleaseGoBackAndReconnect')
        );
        dispatch(resetConnectionState());
      } else {
        Alert.alert(t('networkSetup.connectionFailed'), String(error));
        dispatch(resetWifiState());
      }
      resetUIState();
    } finally {
      // Note: setConnecting(false) is handled in resetUIState
      // But we need to ensure it's set here too in case resetUIState wasn't called
      if (isConnectingRef.current) {
        isConnectingRef.current = false;
        setConnecting(false);
      }
    }
  }, [
    bleConnected,
    selectedWifi,
    passwordInput.value,
    sendWiFiCredentials,
    proceedToNextScreen,
    resetUIState,
    wifiStatus,
    isStillConnected,
    t,
  ]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" />
        <ImageBackground
          source={HomeBackgroundImage}
          style={styles.backgroundImage}
          resizeMode="stretch"
          imageStyle={styles.imageStyle}
        >
          <KeyboardAvoidingView
            style={styles.keyboardAvoidingView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <SafeAreaView style={styles.safeAreaContainer} edges={['top']}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                  <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('networkSetup.networkSetup')}</Text>
              </View>

              <View style={styles.tabsRow}>
                {TABS.map((tab) => (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
                    onPress={() => onTabChange(tab.key as any)}
                  >
                    {tab.icon}
                    <Text style={activeTab === tab.key ? styles.tabTextActive : styles.tabText}>
                      {tab.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Main Content Area */}
              <View style={styles.contentContainer}>
                {/* Wi-Fi Tab Content - Unified UI for all platforms */}
                {activeTab === 'wifi' && (
                  <>
                    <Text style={styles.availableTitle}>{t('networkSetup.availableNetworks')}</Text>
                    <TouchableOpacity
                      style={styles.rescanButton}
                      onPress={scanWifi}
                      disabled={isScanning || !bleConnected}
                    >
                      <Text
                        style={[
                          styles.rescanText,
                          isScanning ? styles.rescanTextScanning : styles.rescanTextActive,
                        ]}
                      >
                        {isScanning ? t('networkSetup.scanning') : t('networkSetup.rescan')}
                      </Text>
                    </TouchableOpacity>
                    {isScanning ? (
                      <ActivityIndicator style={styles.scanningIndicator} size="large" />
                    ) : (
                      <FlatList
                        data={currentWifiList}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.paddingBottomFlatList}
                        style={styles.listStyle}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            style={[
                              styles.networkItem,
                              item.id === selectedWifi?.id && styles.networkItemActive,
                            ]}
                            onPress={() => {
                              setSelectedWifi(item);
                              passwordInput.setValue('');
                            }}
                          >
                            <View style={styles.networkLeftContent}>
                              <WifiIcon width={24} height={24} />
                              <View>
                                <Text style={styles.networkName}>{item.name}</Text>
                                <Text style={[styles.networkSignal, getSignalStyle(item.signal)]}>
                                  {item.secure ? t('networkSetup.secure') : t('networkSetup.open')}
                                  {' • '}
                                  {getSignalText(item.signal, t)}
                                </Text>
                              </View>
                            </View>
                            {item.id === selectedWifi?.id && <CheckIcon height={22} width={22} />}
                          </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                          !isScanning ? (
                            <Text style={styles.emptyWifiText}>
                              {t('networkSetup.noAvailableWifi')}
                            </Text>
                          ) : null
                        }
                      />
                    )}
                    {selectedWifi && (
                      <View style={styles.passwordSection}>
                        <Text style={styles.passLabel}>
                          {t('networkSetup.passwordFor')} "{selectedWifi.name}"
                        </Text>
                        <TextInput
                          value={passwordInput.value}
                          onChangeText={passwordInput.handleChange}
                          icon={LockIconComponent}
                          secureTextEntry
                          placeholder={t('auth.placeHolderPassword')}
                          autoCapitalize="none"
                          autoComplete="password"
                          disabled={isLoading}
                          error={!!passwordInput.error}
                          style={styles.input}
                          testID="password-input"
                          placeholderTextColor={COLORS.BBBBBB}
                        />
                      </View>
                    )}
                  </>
                )}

                {activeTab === 'lan' && (
                  <View style={styles.tabContentCenter}>
                    <Text style={styles.lanText}>{t('networkSetup.plugCameraEthernet')}</Text>
                  </View>
                )}

                {activeTab === 'lte' && (
                  <>
                    <Text style={styles.availableTitle}>{t('networkSetup.availableLte')}</Text>
                    <View style={styles.networkItem}>
                      <View style={styles.networkLeftContent}>
                        <SimIcon width={24} height={24} />
                        <View>
                          <Text style={styles.networkName}>
                            {lteInfo?.hasSimCard && lteCarrier
                              ? lteCarrier
                              : lteInfo?.hasSimCard
                                ? 'SIM Card Detected'
                                : lteInfo?.hasCellularCapability
                                  ? 'No SIM Card (Device supports LTE)'
                                  : 'No SIM Card'}
                          </Text>
                          <Text style={styles.networkSignal}>
                            {networkInfo?.isConnected && networkInfo?.type === 'cellular'
                              ? 'LTE Connected'
                              : networkInfo?.isConnected && networkInfo?.type === 'wifi'
                                ? lteInfo?.hasCellularCapability
                                  ? 'WiFi Active (LTE available)'
                                  : 'WiFi Active'
                                : lteInfo?.hasCellularCapability
                                  ? 'LTE Module Available'
                                  : 'SIM Card / LTE module'}
                          </Text>
                          {networkInfo && (
                            <Text style={styles.networkSignal}>
                              Status:{' '}
                              {networkInfo.isConnected
                                ? networkInfo.type === 'cellular'
                                  ? 'Cellular'
                                  : networkInfo.type
                                : 'Disconnected'}
                              {lteInfo?.hasCellularCapability ? ' • LTE Available' : ''}
                            </Text>
                          )}
                        </View>
                      </View>
                      {!!lteInfo?.hasSimCard &&
                        networkInfo?.isConnected &&
                        networkInfo?.type === 'cellular' && <CheckIcon height={22} width={22} />}
                    </View>
                    {lteInfo?.hasSimCard &&
                      networkInfo?.isConnected &&
                      networkInfo?.type === 'cellular' && (
                        <View style={styles.passwordSection}>
                          <Text style={styles.passLabel}>{t('networkSetup.ltePassword')}</Text>
                          <TextInput
                            value={ltePasswordInput.value}
                            onChangeText={ltePasswordInput.handleChange}
                            icon={LockIconComponent}
                            secureTextEntry
                            placeholder={t('networkSetup.ltePasswordPlaceholder')}
                            autoCapitalize="none"
                            autoComplete="password"
                            disabled={connectingLte}
                            error={!!ltePasswordInput.error}
                            style={styles.input}
                            testID="lte-pass-input"
                            placeholderTextColor={COLORS.BBBBBB}
                          />
                        </View>
                      )}
                  </>
                )}
              </View>

              {/* Bottom Section - Progress and Connect Button */}
              {activeTab === 'wifi' && (
                <View style={styles.bottomContainer}>
                  <View style={styles.divider} />
                  <View style={styles.systemCheck}>
                    <Text style={styles.progressLabel}>
                      {t('networkSetup.systemCheck')}{' '}
                      <Text style={styles.inProgress}>{t('networkSetup.inProgress')}</Text>
                    </Text>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                    </View>
                    <Text style={styles.checkDescription}>
                      {t('networkSetup.checkingInternetConnection')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.connectBtn,
                      (isScanning || connecting || !canConnect) && styles.connectBtnDisabled,
                    ]}
                    onPress={handleConnect}
                    disabled={isScanning || connecting || !canConnect}
                  >
                    {isScanning || connecting ? (
                      <ActivityIndicator color="#0A2540" />
                    ) : (
                      <Text
                        style={[
                          styles.connectBtnText,
                          (isScanning || connecting || !canConnect) &&
                            styles.connectBtnTextDisabled,
                        ]}
                      >
                        {t('bluetoothScreen.connect')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}

              {activeTab === 'lte' && (
                <View style={styles.bottomContainer}>
                  <View style={styles.systemCheck}>
                    <Text style={styles.progressLabel}>
                      SYSTEM CHECK{' '}
                      <Text style={styles.inProgress}>
                        {connectingLte
                          ? t('bluetoothScreen.connecting')
                          : progress === 1
                            ? 'Done'
                            : 'Idle'}
                      </Text>
                    </Text>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                    </View>
                    <Text style={styles.checkDescription}>
                      {connectingLte
                        ? t('bluetoothScreen.connecting') + (lteCarrier ? ' ' + lteCarrier : '')
                        : progress === 1
                          ? t('networkSetup.lteConnected')
                          : lteCarrier
                            ? networkInfo?.isConnected && networkInfo?.type === 'cellular'
                              ? t('networkSetup.lteReady')
                              : t('networkSetup.waitingForCellularConnection')
                            : t('networkSetup.insertLTESim')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.connectBtn,
                      (connectingLte ||
                        !lteCarrier ||
                        !ltePasswordInput.value ||
                        !!ltePasswordInput.error) &&
                        styles.connectBtnDisabled,
                    ]}
                    onPress={handleConnectLte}
                    disabled={
                      connectingLte ||
                      !lteInfo?.hasSimCard || // Must have SIM card
                      !ltePasswordInput.value ||
                      !!ltePasswordInput.error
                    }
                  >
                    {connectingLte ? (
                      <ActivityIndicator color="#0A2540" />
                    ) : (
                      <Text
                        style={[
                          styles.connectBtnText,
                          (connectingLte ||
                            !lteCarrier ||
                            !ltePasswordInput.value ||
                            !!ltePasswordInput.error) &&
                            styles.connectBtnTextDisabled,
                        ]}
                      >
                        {t('bluetoothScreen.connect')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </SafeAreaView>
          </KeyboardAvoidingView>
        </ImageBackground>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default NetworkSetup;
