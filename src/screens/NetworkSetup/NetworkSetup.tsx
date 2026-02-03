import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WifiIcon from '@assets/svg/wifi-vector.svg';
import LanIcon from '@assets/svg/ethernet-port.svg';
import SimIcon from '@assets/svg/signal.svg';
import CheckIcon from '@assets/svg/icon-check.svg';
import { useNavigation, useRoute } from '@react-navigation/native';
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
import { useAppSelector } from '@redux/store';
import DeviceInfo from 'react-native-device-info';
import { useJetsonBLE } from '@hooks/useJetsonBLE';

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
  const [wifiList, setWifiList] = useState<WifiItem[]>([]);
  const [selectedWifi, setSelectedWifi] = useState<WifiItem | null>(null);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [progress, setProgress] = useState(0.33);
  const { t } = useTranslation();
  const { isLoading } = useAppSelector((state) => state.auth);
  const [lteCarrier, setLteCarrier] = useState<string | null>(null);
  const [lteInfo, setLteInfo] = useState<any>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [connectingLte, setConnectingLte] = useState(false);

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

  useEffect(() => {
    let isMounted = true;

    const fetchLteInfo = async () => {
      try {
        // Fetch SIM card information
        let carrierName = null;
        let hasSimCard = false;
        let simDetectionMethod = 'unknown';

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

            simDetectionMethod = hasSimCard ? 'ios_carrier_name' : 'ios_assumed_no_sim';
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

            simDetectionMethod = hasSimCard ? 'android_carrier_name' : 'android_no_sim';
          }
        } catch (carrierError) {
          console.warn('Failed to get carrier name:', carrierError);
          hasSimCard = false;
          simDetectionMethod = 'error';
        }

        console.log(
          'Carrier name:',
          carrierName,
          'Has SIM:',
          hasSimCard,
          'Method:',
          simDetectionMethod
        );

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

  const scanWifi = async () => {
    setScanning(true);
    setWifiList([]);
    setSelectedWifi(null);

    // Priority 1: BLE Wi-Fi scanning (works on all platforms)
    if (bleConnected) {
      try {
        const success = await requestWiFiScan();
        if (!success) {
          Alert.alert(
            t('networkSetup.wifiScanError'),
            t('networkSetup.failedToRequestWiFiScanFromDevice')
          );
        }
        setScanning(false);
        return;
      } catch (e) {
        console.warn('BLE WiFi scan failed, falling back to native scan:', e);
      }
    }
    setScanning(false);
  };

  useEffect(() => {
    if (activeTab === 'wifi') {
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

  // Reset connection state helper
  const resetConnectionState = useCallback(() => {
    setConnecting(false);
    setProgress(0.33);
  }, []);

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

    setConnecting(true);
    setProgress(0.5);

    try {
      const success = await sendWiFiCredentials(selectedWifi.name, passwordInput.value);

      if (!success) {
        Alert.alert(
          t('networkSetup.connectionFailed'),
          t('networkSetup.failedToSendWiFiCredentialsToDevice')
        );
        resetConnectionState();
        return;
      }

      // Wait for device to connect and report success
      setTimeout(() => {
        if (wifiStatus === 2) {
          proceedToNextScreen();
        } else if (wifiStatus === 3) {
          Alert.alert(
            t('networkSetup.connectionFailed'),
            t('networkSetup.deviceFailedToConnectToWiFi')
          );
          resetConnectionState();
        } else {
          setTimeout(() => {
            if (wifiStatus === 2) {
              proceedToNextScreen();
            } else {
              Alert.alert(
                t('networkSetup.connectionFailed'),
                t('networkSetup.wiFiConnectionTimeout')
              );
              resetConnectionState();
            }
          }, 5000);
        }
      }, 3000);
    } catch (error) {
      Alert.alert(t('networkSetup.connectionFailed'), String(error));
      resetConnectionState();
    } finally {
      setConnecting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    bleConnected,
    selectedWifi,
    passwordInput.value,
    sendWiFiCredentials,
    proceedToNextScreen,
    resetConnectionState,
    wifiStatus,
    t,
  ]);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" />
      <ImageBackground
        source={HomeBackgroundImage}
        style={styles.backgroundImage}
        resizeMode="stretch"
        imageStyle={styles.imageStyle}
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
                  disabled={isScanning}
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
                      (isScanning || connecting || !canConnect) && styles.connectBtnTextDisabled,
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
      </ImageBackground>
    </View>
  );
};

export default NetworkSetup;
