import React, { Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Keyboard,
  StatusBar,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import WifiIcon from '@assets/svg/wifi-vector.svg';
import LanIcon from '@assets/svg/ethernet-port.svg';
import SimIcon from '@assets/svg/signal.svg';
import CheckIcon from '@assets/svg/icon-check.svg';
import { useNavigation, useRoute } from '@react-navigation/native';
import { styles } from './NetworkSetup.styles';
import HomeBackgroundImage from '@assets/webp/home-background.webp';
import BackIcon from '@assets/svg/icon-back.svg';
import { useTranslation } from 'react-i18next';
import { LockIconComponent } from '@components/IconCustom/IconCustom';
import { COLORS } from '@constants/theme';
import { NetworkSetupNavigationProp, NetworkSetupRouteProp } from '@navigation/types';
import TextInput from '@components/TextInput/TextInput';
import { useInput } from '@hooks/useInput';
import { isPasswordWifi } from '@utils/validate';
import { store, useAppSelector } from '@redux/store';
import { useJetsonBLE, WiFiScanStatus } from '@hooks/useJetsonBLE';
import { WiFiStatus } from '@redux/slices/bleSlice';
import { jetsonBLEService } from '@/services/jetsonBLEService';
import type { NetCheckType } from '@/services/jetsonBLEService';

const NET_STATUS_POLL_MS = 100;
const NET_STATUS_POLL_MAX_MS = 2000;

type LinkStatus = 'connected' | 'disconnected' | 'error';
type LinkStatusState = LinkStatus | null;

async function fetchNetworkLinkStatus(
  checkNetworkStatus: (type: NetCheckType) => Promise<boolean>,
  netCheckType: NetCheckType,
  expectedDeviceType: 'ethernet' | 'cellular'
): Promise<LinkStatus> {
  try {
    await checkNetworkStatus(netCheckType);
    let waited = 0;
    let status = store.getState().ble.networkStatus;
    while ((!status || status.type !== expectedDeviceType) && waited < NET_STATUS_POLL_MAX_MS) {
      await new Promise((res) => setTimeout(res, NET_STATUS_POLL_MS));
      waited += NET_STATUS_POLL_MS;
      status = store.getState().ble.networkStatus;
    }
    if (status?.type === expectedDeviceType) {
      return status.connected ? 'connected' : 'disconnected';
    }
    return 'disconnected';
  } catch {
    return 'error';
  }
}

function applyLinkStatus(
  result: LinkStatus,
  setStatus: Dispatch<SetStateAction<LinkStatusState>>,
  setConnected: Dispatch<SetStateAction<boolean>>
) {
  setStatus(result);
  setConnected(result === 'connected');
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
  const [selectedWifi, setSelectedWifi] = useState<any>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectingNetSetup, setConnectingNetSetup] = useState(false);
  const [progress, setProgress] = useState(0.6);
  const { t } = useTranslation();
  const { isLoading } = useAppSelector((state) => state.auth);
  const passwordInput = useInput({
    validateFn: isPasswordWifi,
  });

  const {
    wifiNetworks,
    wifiScanStatus,
    isConnected: bleConnected,
    requestWiFiScan,
    sendWiFiCredentials,
    checkNetworkStatus,
    netSetupConnect,
  } = useJetsonBLE();

  // Get WiFi list from BLE networks
  const getCurrentWifiList = () => {
    if (!bleConnected) {
      return [];
    }
    return wifiNetworks.map(([ssid, signal, security], idx) => {
      let signalLevel: 'excellent' | 'good' | 'weak';
      if (signal >= 80) {
        signalLevel = 'excellent';
      } else if (signal >= 60) {
        signalLevel = 'good';
      } else {
        signalLevel = 'weak';
      }
      return {
        id: `ble-${idx}`,
        name: ssid,
        signal: signalLevel,
        secure: security.toLowerCase() !== 'open',
        capabilities: security,
      };
    });
  };

  const handleConnectLte = async () => {
    if (!bleConnected) {
      Alert.alert(
        t('networkSetup.bleRequired'),
        t('networkSetup.pleaseConnectToDeviceViaBluetoothFirst'),
        [{ text: 'OK', onPress: () => handleBackToScan() }]
      );
      return;
    }
    setSelectedWifi(null);
    setConnectingNetSetup(true);
    try {
      const ok = await netSetupConnect('lte');
      if (ok) {
        setProgress(1);
        proceedToNextScreen();
      } else {
        Alert.alert(t('networkSetup.connectionFailed'), t('networkSetup.networkConnectionFailed'), [
          { text: 'OK', onPress: () => handleBackToScan() },
        ]);
      }
    } finally {
      setConnectingNetSetup(false);
    }
  };

  const scanWifi = async (isManualRescan: boolean = false) => {
    if (!bleConnected) {
      Alert.alert(
        t('networkSetup.bleRequired'),
        t('networkSetup.pleaseConnectToDeviceViaBluetoothFirstToScanWiFiNetworks'),
        [{ text: 'OK', onPress: () => handleBackToScan() }]
      );
      return;
    }

    // Only reset selection when user manually rescan
    if (isManualRescan) {
      setSelectedWifi(null);
    }

    try {
      const success = await requestWiFiScan();
      if (!success) {
        Alert.alert(
          t('networkSetup.wifiScanError'),
          t('networkSetup.failedToRequestWiFiScanFromDevice')
        );
      }
    } catch (e) {
      Alert.alert(
        t('networkSetup.wifiScanError'),
        `${t('networkSetup.wiFiScanFailed')}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  };

  useEffect(() => {
    if (
      activeTab === 'wifi' &&
      bleConnected &&
      wifiNetworks.length === 0 &&
      wifiScanStatus === WiFiScanStatus.IDLE
    ) {
      void scanWifi(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, bleConnected]);

  // State for LAN network status
  const [lanStatus, setLanStatus] = useState<LinkStatusState>(null);
  const [lanStatusLoading, setLanStatusLoading] = useState(false);
  const [lanConnected, setLanConnected] = useState(false);

  const [lteStatus, setLteStatus] = useState<LinkStatusState>(null);
  const [lteStatusLoading, setLteStatusLoading] = useState(false);
  const [lteConnected, setLteConnected] = useState(false);

  const fetchLanStatus = async () => {
    setLanStatusLoading(true);
    setLanStatus(null);
    setLanConnected(false);
    try {
      const result = await fetchNetworkLinkStatus(checkNetworkStatus, 'LAN', 'ethernet');
      applyLinkStatus(result, setLanStatus, setLanConnected);
    } finally {
      setLanStatusLoading(false);
    }
  };

  const fetchLteStatus = async () => {
    setLteStatusLoading(true);
    setLteStatus(null);
    setLteConnected(false);
    try {
      const result = await fetchNetworkLinkStatus(checkNetworkStatus, 'LTE', 'cellular');
      applyLinkStatus(result, setLteStatus, setLteConnected);
    } finally {
      setLteStatusLoading(false);
    }
  };

  const onTabChange = async (tab: 'wifi' | 'lan' | 'lte') => {
    setActiveTab(tab);
    if (tab === 'lte') {
      await fetchLteStatus();
    }
    if (tab === 'lan') {
      await fetchLanStatus();
    }
  };

  const proceedToNextScreen = () => {
    const cameraName = route.params?.cameraAp || 'Camera';
    const connectedSsid = selectedWifi?.name || 'WiFi Network';

    navigation.replace('SetupComplete', {
      cameraName,
      ssid: connectedSsid,
      deviceId: route.params?.deviceId,
    });
  };

  const handleConnect = async () => {
    if (!bleConnected) {
      Alert.alert(
        t('networkSetup.bleRequired'),
        t('networkSetup.pleaseConnectToDeviceViaBluetoothFirst'),
        [{ text: 'OK', onPress: () => handleBackToScan() }]
      );
      return;
    }

    if (!selectedWifi) {
      Alert.alert(t('networkSetup.wiFiRequired'), t('networkSetup.pleaseSelectAWiFiNetworkFirst'));
      return;
    }

    if (selectedWifi.secure && (!passwordInput.value || passwordInput.error)) {
      return;
    }

    setConnecting(true);
    setProgress(0.6);

    try {
      const password = selectedWifi.secure ? passwordInput.value : '';
      const success = await sendWiFiCredentials(selectedWifi.name, password);
      if (success) {
        setProgress(1);
        proceedToNextScreen();
      } else {
        const bleState = store.getState().ble;
        const isDisconnected = bleState.error === 'BLE_DISCONNECTED' || !bleState.isConnected;
        const isWrongPassword = bleState.wifiStatus === WiFiStatus.ERROR;

        if (isDisconnected) {
          Alert.alert(
            t('networkSetup.bleRequired'),
            t('networkSetup.pleaseConnectToDeviceViaBluetoothFirst'),
            [{ text: 'OK', onPress: () => handleBackToScan() }]
          );
        } else {
          Alert.alert(
            t('networkSetup.connectionFailed'),
            isWrongPassword
              ? t('networkSetup.wrongPasswordOrNetworkNotFound')
              : t('networkSetup.failedToSendWiFiCredentialsToDevice')
          );
        }
        setConnecting(false);
        setProgress(0.6);
      }
    } catch (error) {
      Alert.alert(t('networkSetup.connectionFailed'), String(error));
      setConnecting(false);
      setProgress(0.6);
    }
  };

  const handleConnectLAN = async () => {
    if (!bleConnected) {
      Alert.alert(
        t('networkSetup.bleRequired'),
        t('networkSetup.pleaseConnectToDeviceViaBluetoothFirst'),
        [{ text: 'OK', onPress: () => handleBackToScan() }]
      );
      return;
    }
    setSelectedWifi(null);
    setConnectingNetSetup(true);
    try {
      const ok = await netSetupConnect('lan');
      if (ok) {
        setProgress(1);
        proceedToNextScreen();
      } else {
        Alert.alert(t('networkSetup.connectionFailed'), t('networkSetup.networkConnectionFailed'), [
          { text: 'OK', onPress: () => handleBackToScan() },
        ]);
      }
    } finally {
      setConnectingNetSetup(false);
    }
  };

  const handleBackToScan = async () => {
    await jetsonBLEService.disconnect();
    navigation.reset({
      index: 1,
      routes: [{ name: 'Home' }, { name: 'ConnectDevice' }],
    });
  };

  let lanStatusContent: React.ReactNode;
  if (lanStatusLoading) {
    lanStatusContent = <ActivityIndicator />;
  } else if (lanStatus === 'connected') {
    lanStatusContent = (
      <Text style={styles.textLanStyle}>{t('networkSetup.lanConnectionIsActive')}</Text>
    );
  } else if (lanStatus === 'disconnected') {
    lanStatusContent = <Text style={styles.textLanStyle}>{t('networkSetup.noLanConnection')}</Text>;
  } else {
    lanStatusContent = null;
  }

  let lteStatusContent: React.ReactNode;
  if (lteStatusLoading) {
    lteStatusContent = <ActivityIndicator />;
  } else if (lteStatus === 'connected') {
    lteStatusContent = (
      <Text style={styles.textLanStyle}>{t('networkSetup.lteConnectionIsActive')}</Text>
    );
  } else if (lteStatus === 'disconnected') {
    lteStatusContent = <Text style={styles.textLanStyle}>{t('networkSetup.noLteConnection')}</Text>;
  } else {
    lteStatusContent = null;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
              <TouchableOpacity style={styles.backButton} onPress={() => handleBackToScan()}>
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

            {activeTab === 'wifi' && (
              <KeyboardAwareScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.wifiScrollContent}
                enableOnAndroid
                extraScrollHeight={80}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.availableTitle}>{t('networkSetup.availableNetworks')}</Text>

                {bleConnected ? (
                  <>
                    <TouchableOpacity
                      style={styles.rescanButton}
                      onPress={() => scanWifi(true)}
                      disabled={wifiScanStatus === 1}
                    >
                      <Text
                        style={[
                          styles.rescanText,
                          wifiScanStatus === 1
                            ? styles.rescanTextScanning
                            : styles.rescanTextActive,
                        ]}
                      >
                        {wifiScanStatus === 1
                          ? t('networkSetup.scanning')
                          : t('networkSetup.rescan')}
                      </Text>
                    </TouchableOpacity>

                    {wifiScanStatus === 1 ? (
                      <ActivityIndicator style={styles.scanningIndicator} size="large" />
                    ) : (
                      <View style={styles.wifiListContainer}>
                        {getCurrentWifiList().length === 0 ? (
                          <Text style={styles.emptyWifiText}>
                            {t('networkSetup.noAvailableWifi')}
                          </Text>
                        ) : (
                          getCurrentWifiList().map((item) => (
                            <TouchableOpacity
                              key={item.id}
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
                                    {item.secure
                                      ? t('networkSetup.secure')
                                      : t('networkSetup.open')}
                                    {' • '}
                                    {getSignalText(item.signal, t)}
                                  </Text>
                                </View>
                              </View>
                              {item.id === selectedWifi?.id && <CheckIcon height={22} width={22} />}
                            </TouchableOpacity>
                          ))
                        )}
                      </View>
                    )}

                    {selectedWifi && selectedWifi.secure && (
                      <View style={styles.passwordSection}>
                        <Text style={styles.passLabel}>
                          {t('networkSetup.passwordFor')} "{selectedWifi?.name}"
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
                ) : (
                  <View style={styles.iosWifiContainer}>
                    <Text style={styles.iosWifiInstruction}>
                      {t(
                        'networkSetup.pleaseConnectToDeviceViaBluetoothFirstToScanAndConfigureWiFiNetworks'
                      )}
                    </Text>
                    <Text style={styles.iosCurrentWifiText}>
                      {t('networkSetup.bluetoothConnectionRequired')}
                    </Text>
                  </View>
                )}

                {/* Bottom Section inside scroll so button is always reachable */}
                <View style={styles.wifiBottomSection}>
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
                      (!bleConnected ||
                        connecting ||
                        wifiScanStatus === 1 ||
                        !selectedWifi ||
                        (selectedWifi?.secure &&
                          (!passwordInput.value || !!passwordInput.error))) &&
                        styles.connectBtnDisabled,
                    ]}
                    onPress={handleConnect}
                    disabled={
                      !bleConnected ||
                      connecting ||
                      wifiScanStatus === 1 ||
                      !selectedWifi ||
                      (selectedWifi?.secure && (!passwordInput.value || !!passwordInput.error))
                    }
                  >
                    {connecting || wifiScanStatus === 1 ? (
                      <ActivityIndicator color="#0A2540" />
                    ) : (
                      <Text
                        style={[
                          styles.connectBtnText,
                          (!bleConnected ||
                            connecting ||
                            wifiScanStatus === 1 ||
                            !selectedWifi ||
                            (selectedWifi?.secure &&
                              (!passwordInput.value || !!passwordInput.error))) &&
                            styles.connectBtnTextDisabled,
                        ]}
                      >
                        {t('bluetoothScreen.connect')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </KeyboardAwareScrollView>
            )}

            {/* LAN Tab */}
            {activeTab === 'lan' && (
              <>
                <View style={styles.contentContainer}>
                  <Text style={styles.availableTitle}>{t('networkSetup.availableNetworks')}</Text>
                  <TouchableOpacity
                    style={styles.rescanButton}
                    onPress={fetchLanStatus}
                    disabled={lanStatusLoading}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={[styles.rescanText, styles.colorRescan]}>
                      {lanStatusLoading ? t('networkSetup.scanning') : t('networkSetup.rescan')}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.tabContentCenter}>{lanStatusContent}</View>
                </View>
                <View style={styles.bottomContainer}>
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={[
                      styles.connectBtn,
                      (!lanConnected || lanStatusLoading || connectingNetSetup) &&
                        styles.connectBtnDisabled,
                    ]}
                    onPress={handleConnectLAN}
                    disabled={!lanConnected || lanStatusLoading || connectingNetSetup}
                  >
                    {connectingNetSetup ? (
                      <ActivityIndicator color="#0A2540" />
                    ) : (
                      <Text
                        style={[
                          styles.connectBtnText,
                          (!lanConnected || lanStatusLoading || connectingNetSetup) &&
                            styles.connectBtnTextDisabled,
                        ]}
                      >
                        {t('bluetoothScreen.connect')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* LTE Tab */}
            {activeTab === 'lte' && (
              <>
                <View style={styles.contentContainer}>
                  <Text style={styles.availableTitle}>{t('networkSetup.availableLte')}</Text>
                  <TouchableOpacity
                    style={styles.rescanButton}
                    onPress={fetchLteStatus}
                    disabled={lteStatusLoading}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={[styles.rescanText, styles.colorRescan]}>
                      {lteStatusLoading ? t('networkSetup.scanning') : t('networkSetup.rescan')}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.tabContentCenter}>{lteStatusContent}</View>
                </View>
                <View style={styles.bottomContainer}>
                  <View style={styles.divider} />
                  <TouchableOpacity
                    style={[
                      styles.connectBtn,
                      (!lteConnected || lteStatusLoading || connectingNetSetup) &&
                        styles.connectBtnDisabled,
                    ]}
                    onPress={handleConnectLte}
                    disabled={!lteConnected || lteStatusLoading || connectingNetSetup}
                  >
                    {connectingNetSetup ? (
                      <ActivityIndicator color="#0A2540" />
                    ) : (
                      <Text
                        style={[
                          styles.connectBtnText,
                          (!lteConnected || lteStatusLoading || connectingNetSetup) &&
                            styles.connectBtnTextDisabled,
                        ]}
                      >
                        {t('bluetoothScreen.connect')}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </SafeAreaView>
        </ImageBackground>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default NetworkSetup;
