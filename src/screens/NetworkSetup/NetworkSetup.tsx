import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  Keyboard,
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
import { useNavigation, useRoute } from '@react-navigation/native';
import { styles } from './NetworkSetup.styles';
import HomeBackgroundImage from '@assets/png/home-background.png';
import BackIcon from '@assets/svg/icon-back.svg';
import { useTranslation } from 'react-i18next';
import { LockIconComponent } from '@components/IconCustom/IconCustom';
import { COLORS } from '@constants/theme';
import { NetworkSetupNavigationProp, NetworkSetupRouteProp } from '@navigation/types';
import TextInput from '@components/TextInput/TextInput';
import { useInput } from '@hooks/useInput';
import { isPasswordWifi } from '@utils/validate';
import { useAppSelector } from '@redux/store';
import { useJetsonBLE, WiFiScanStatus } from '@hooks/useJetsonBLE';
import { jetsonBLEService } from '@/services/jetsonBLEService';

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
  const [progress, setProgress] = useState(0.33);
  const { t } = useTranslation();
  const { isLoading } = useAppSelector((state) => state.auth);
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
    checkNetworkStatus,
  } = useJetsonBLE();

  const { networkStatus } = useAppSelector((state) => state.ble);

  // Get WiFi list from BLE networks
  const getCurrentWifiList = () => {
    if (!bleConnected) {
      return [];
    }

    return wifiNetworks.map((network, idx) => {
      let signalLevel: 'excellent' | 'good' | 'weak';
      if (network.signal >= -55) {
        signalLevel = 'excellent';
      } else if (network.signal >= -70) {
        signalLevel = 'good';
      } else {
        signalLevel = 'weak';
      }
      return {
        id: `ble-${idx}`,
        name: network.ssid,
        signal: signalLevel,
        secure: network.security !== 'open',
        capabilities: network.security,
      };
    });
  };

  const handleConnectLte = async () => {
    setSelectedWifi(null);
    proceedToNextScreen();
  };

  const scanWifi = async (isManualRescan: boolean = false) => {
    if (!bleConnected) {
      Alert.alert(
        t('networkSetup.bleRequired'),
        t('networkSetup.pleaseConnectToDeviceViaBluetoothFirstToScanWiFiNetworks')
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
  const [lanStatus, setLanStatus] = useState<'connected' | 'disconnected' | 'error' | null>(null);
  const [lanStatusLoading, setLanStatusLoading] = useState(false);
  const [lanConnected, setLanConnected] = useState(false);

  const fetchLanStatus = async () => {
    setLanStatusLoading(true);
    setLanStatus(null);
    setLanConnected(false);
    try {
      await checkNetworkStatus();
      // Wait for Redux to update (poll for up to 2s)
      let waited = 0;
      let status = networkStatus;
      while ((!status || status.type !== 'ethernet') && waited < 2000) {
        await new Promise((res) => setTimeout(res, 100));
        waited += 100;
        status = networkStatus;
      }
      if (status && status.type === 'ethernet') {
        if (status.connected) {
          setLanStatus('connected');
          setLanConnected(true);
        } else {
          setLanStatus('disconnected');
          setLanConnected(false);
        }
      } else {
        setLanStatus('disconnected');
        setLanConnected(false);
      }
    } catch {
      setLanStatus('error');
      setLanConnected(false);
    } finally {
      setLanStatusLoading(false);
    }
  };

  const onTabChange = async (tab: 'wifi' | 'lan' | 'lte') => {
    setActiveTab(tab);
    if (tab === 'lte') {
      ltePasswordInput.setValue('');
      setConnectingLte(false);
      setProgress(0.33);
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
    });
  };

  const handleConnect = async () => {
    if (!bleConnected) {
      Alert.alert(
        t('networkSetup.bleRequired'),
        t('networkSetup.pleaseConnectToDeviceViaBluetoothFirst')
      );
      return;
    }

    if (!selectedWifi) {
      Alert.alert(t('networkSetup.wiFiRequired'), t('networkSetup.pleaseSelectAWiFiNetworkFirst'));
      return;
    }

    if (!passwordInput.value || passwordInput.error) {
      return;
    }

    setConnecting(true);
    setProgress(0.5);

    try {
      const success = await sendWiFiCredentials(selectedWifi.name, passwordInput.value);

      if (success) {
        // Success: Navigate to next screen
        proceedToNextScreen();
      } else {
        Alert.alert(
          t('networkSetup.connectionFailed'),
          t('networkSetup.failedToSendWiFiCredentialsToDevice')
        );
        setConnecting(false);
        setProgress(0.33);
      }
    } catch (error) {
      Alert.alert(t('networkSetup.connectionFailed'), String(error));
      setConnecting(false);
      setProgress(0.33);
    }
  };

  const handleConnectLAN = () => {
    setSelectedWifi(null);
    proceedToNextScreen();
  };

  const handleBackToScan = async () => {
    jetsonBLEService.disconnect();
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

            {/* Main Content Area */}
            <View style={styles.contentContainer}>
              {/* WiFi Tab Content */}
              {activeTab === 'wifi' && (
                <>
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
                        <FlatList
                          data={getCurrentWifiList()}
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
                          )}
                          ListEmptyComponent={
                            wifiScanStatus !== 1 ? (
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
                </>
              )}

              {activeTab === 'lan' && (
                <View style={styles.container}>
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
              )}

              {activeTab === 'lte' && (
                <>
                  <Text style={styles.availableTitle}>{t('networkSetup.availableLte')}</Text>
                  <TouchableOpacity
                    style={styles.rescanButton}
                    onPress={() => {}}
                    disabled={lanStatusLoading}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={[styles.rescanText, styles.colorRescan]}>
                      {lanStatusLoading ? t('networkSetup.scanning') : t('networkSetup.rescan')}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.networkItem}>
                    <View style={styles.networkLeftContent}>
                      <SimIcon width={24} height={24} />
                      <View />
                    </View>
                  </View>
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
                    (!bleConnected ||
                      connecting ||
                      wifiScanStatus === 1 ||
                      !passwordInput.value ||
                      !!passwordInput.error ||
                      !selectedWifi) &&
                      styles.connectBtnDisabled,
                  ]}
                  onPress={handleConnect}
                  disabled={
                    !bleConnected ||
                    connecting ||
                    wifiScanStatus === 1 ||
                    !passwordInput.value ||
                    !!passwordInput.error ||
                    !selectedWifi
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
                          !passwordInput.value ||
                          !!passwordInput.error ||
                          !selectedWifi) &&
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
                    {t('networkSetup.systemCheck')}{' '}
                    <Text style={styles.inProgress}>
                      {connectingLte
                        ? t('bluetoothScreen.connecting')
                        : progress === 1
                          ? t('networkSetup.done')
                          : t('networkSetup.idle')}
                    </Text>
                  </Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.connectBtn,
                    (connectingLte || !ltePasswordInput.value || !!ltePasswordInput.error) &&
                      styles.connectBtnDisabled,
                  ]}
                  onPress={handleConnectLte}
                  disabled={connectingLte || !ltePasswordInput.value || !!ltePasswordInput.error}
                >
                  {connectingLte ? (
                    <ActivityIndicator color="#0A2540" />
                  ) : (
                    <Text
                      style={[
                        styles.connectBtnText,
                        (connectingLte || !ltePasswordInput.value || !!ltePasswordInput.error) &&
                          styles.connectBtnTextDisabled,
                      ]}
                    >
                      {t('bluetoothScreen.connect')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {activeTab === 'lan' && (
              <View style={styles.bottomContainer}>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={[
                    styles.connectBtn,
                    (!lanConnected || lanStatusLoading) && styles.connectBtnDisabled,
                  ]}
                  onPress={handleConnectLAN}
                  disabled={!lanConnected || lanStatusLoading}
                >
                  <Text
                    style={[
                      styles.connectBtnText,
                      (!lanConnected || lanStatusLoading) && styles.connectBtnTextDisabled,
                    ]}
                  >
                    {t('bluetoothScreen.connect')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </SafeAreaView>
        </ImageBackground>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default NetworkSetup;
