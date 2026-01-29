import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StatusBar,
  ImageBackground,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WifiIcon from '@assets/svg/wifi-vector.svg';
import LanIcon from '@assets/svg/ethernet-port.svg';
import SimIcon from '@assets/svg/signal.svg';
import CheckIcon from '@assets/svg/icon-check.svg';
import { useNavigation } from '@react-navigation/native';
import { styles } from './NetworkSetup.styles';
import HomeBackgroundImage from '@assets/png/home-background.png';
import BackIcon from '@assets/svg/icon-back.svg';
import { useTranslation } from 'react-i18next';
import { LockOutlineIcon } from '@components/IconCustom/IconCustom';
import { COLORS } from '@constants/theme';
import TextInput from '@components/TextInput/TextInput';
import { useInput } from '@hooks/useInput';
import { isPasswordWifi } from '@utils/validate';
import { useAppSelector } from '@redux/store';
import WifiManager from 'react-native-wifi-reborn';

const TABS = [
  { key: 'wifi', title: 'Wi-Fi', icon: <WifiIcon width={22} height={22} /> },
  { key: 'lan', title: 'LAN', icon: <LanIcon width={22} height={22} /> },
  { key: 'lte', title: 'LTE', icon: <SimIcon width={20} height={20} /> },
];

const NetworkSetup: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'wifi' | 'lan' | 'lte'>('wifi');
  const [wifiList, setWifiList] = useState<any[]>([]);
  const [selectedWifi, setSelectedWifi] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [currentSSID, setCurrentSSID] = useState<string | null>(null);
  const [progress, setProgress] = useState(0.33);
  const { t } = useTranslation();
  const { isLoading } = useAppSelector((state) => state.auth);

  const passwordInput = useInput({
    validateFn: isPasswordWifi,
  });

  const scanWifi = async () => {
    setScanning(true);
    setWifiList([]);
    setSelectedWifi(null);
    setCurrentSSID(null);

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            t('networkSetup.permissionRequired') || 'Permission required',
            t('networkSetup.pleaseAllowLocationForWiFiScan') ||
              'Please allow location for Wi-Fi scan.'
          );
          setScanning(false);
          return;
        }
        const networks = await WifiManager.loadWifiList();
        const list = networks
          .map((n: any, idx: number) => ({
            id: '' + idx,
            name: n.SSID,
            signal: n.level >= -55 ? 'excellent' : n.level >= -70 ? 'good' : 'weak',
            secure: (n.capabilities || '').includes('WPA'),
          }))
          .filter((n: any) => !!n.name);
        setWifiList(list);
        if (list.length > 0) {
          setSelectedWifi(list[0]);
        } else {
          setSelectedWifi(null);
        }
      } catch (e) {
        Alert.alert(t('networkSetup.wifiScanError') || 'WiFi scan error', String(e));
        setWifiList([]);
        setSelectedWifi(null);
      }
      setScanning(false);
    } else {
      try {
        const ssid = await WifiManager.getCurrentWifiSSID();
        setCurrentSSID(ssid);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        setCurrentSSID(null);
        Alert.alert(
          t('networkSetup.notSupported') || 'Not supported',
          t('networkSetup.wiFiScanningIsNotSupportedOnThisDevice') ||
            'Wi-Fi scanning is not supported on iOS. Please connect in Settings.'
        );
      }
      setScanning(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'wifi') void scanWifi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const onTabChange = (tab: 'wifi' | 'lan' | 'lte') => {
    setActiveTab(tab);
    if (tab === 'wifi') {
      void scanWifi();
      setProgress(0.33);
      passwordInput.setValue('');
      setConnecting(false);
    }
  };

  const handleConnect = async () => {
    if (!selectedWifi && !currentSSID) return;

    setConnecting(true);
    setProgress(0.5);

    try {
      if (Platform.OS === 'android') {
        if (selectedWifi) {
          await WifiManager.connectToProtectedSSID(
            selectedWifi.name,
            passwordInput.value,
            selectedWifi.secure,
            false
          );
        }
      } else {
        if (!currentSSID) {
          Alert.alert(
            t('networkSetup.connectionError') || 'Connection Error',
            t('networkSetup.noWifiConnected') || 'No WiFi connected'
          );
          setConnecting(false);
          return;
        }
      }

      setProgress(1);
      setTimeout(() => {
        navigation.goBack();
      }, 1000);
    } catch (error) {
      Alert.alert(t('networkSetup.connectionFailed') || 'Connection Failed', String(error));
      setProgress(0.33);
    } finally {
      setConnecting(false);
    }
  };

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
            <Text style={styles.headerTitle}>
              {t('networkSetup.networkSetup') || 'Network Setup'}
            </Text>
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
                <Text style={styles.availableTitle}>
                  {t('networkSetup.availableNetworks') || 'Available Networks'}
                </Text>
                {Platform.OS === 'android' ? (
                  <>
                    <TouchableOpacity
                      style={styles.rescanButton}
                      onPress={scanWifi}
                      disabled={scanning}
                    >
                      <Text
                        style={[
                          styles.rescanText,
                          scanning ? styles.rescanTextScanning : styles.rescanTextActive,
                        ]}
                      >
                        {scanning
                          ? t('networkSetup.scanning') || 'Scanning...'
                          : t('networkSetup.rescan') || 'Rescan'}
                      </Text>
                    </TouchableOpacity>
                    {scanning ? (
                      <ActivityIndicator style={styles.scanningIndicator} size="large" />
                    ) : (
                      <FlatList
                        data={wifiList}
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
                              passwordInput.setValue(''); // Reset password khi chọn WiFi khác
                            }}
                          >
                            <View style={styles.networkLeftContent}>
                              <WifiIcon width={24} height={24} />
                              <View>
                                <Text style={styles.networkName}>{item.name}</Text>
                                <Text
                                  style={[
                                    styles.networkSignal,
                                    item.signal === 'excellent'
                                      ? styles.signalExcellent
                                      : item.signal === 'good'
                                        ? styles.signalGood
                                        : styles.signalWeak,
                                  ]}
                                >
                                  {item.secure ? t('networkSetup.secure') : t('networkSetup.open')}
                                  {' • '}
                                  {item.signal === 'excellent'
                                    ? t('networkSetup.excellentSignal')
                                    : item.signal === 'good'
                                      ? t('networkSetup.goodSignal')
                                      : t('networkSetup.weakSignal')}
                                </Text>
                              </View>
                            </View>
                            {item.id === selectedWifi?.id && <CheckIcon height={22} width={22} />}
                          </TouchableOpacity>
                        )}
                        ListEmptyComponent={
                          !scanning && (
                            <Text style={styles.emptyWifiText}>
                              {t('networkSetup.noAvailableWifi') ||
                                'No available Wi-Fi found. Pull to refresh.'}
                            </Text>
                          )
                        }
                      />
                    )}
                    {selectedWifi && (
                      <View style={styles.passwordSection}>
                        <Text style={styles.passLabel}>
                          {t('networkSetup.passwordFor') || 'Password for'} "{selectedWifi?.name}"
                        </Text>
                        <TextInput
                          value={passwordInput.value}
                          onChangeText={passwordInput.handleChange}
                          icon={LockOutlineIcon}
                          secureTextEntry
                          placeholder={t('auth.placeHolderPassword') || 'Password'}
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
                    <Text style={styles.iosWifiText}>
                      {t('networkSetup.wiFiScanningIsNotSupportedOnThisDevice') ||
                        'Wi-Fi scanning is not supported on iOS. Please connect manually in Settings.'}
                    </Text>
                    <Text style={styles.iosCurrentWifiText}>
                      {currentSSID
                        ? (t('networkSetup.currentConnected') || 'Currently connected: ') +
                          currentSSID
                        : t('networkSetup.noWifiConnected') || 'No WiFi connected'}
                    </Text>
                  </View>
                )}
              </>
            )}

            {activeTab === 'lan' && (
              <View style={styles.tabContentCenter}>
                <Text style={styles.lanText}>
                  {t('networkSetup.plugCameraEthernet') ||
                    'Plug your camera into an Ethernet cable.'}
                </Text>
              </View>
            )}

            {activeTab === 'lte' && (
              <View style={styles.tabContentCenter}>
                <Text style={styles.lteText}>
                  {t('networkSetup.insertLTESim') ||
                    'Insert your LTE SIM module and follow setup instructions.'}
                </Text>
              </View>
            )}
          </View>

          {/* Bottom Section - Progress and Connect Button */}
          {activeTab === 'wifi' && (
            <View style={styles.bottomContainer}>
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
                style={styles.connectBtn}
                onPress={handleConnect}
                disabled={
                  scanning ||
                  connecting ||
                  !passwordInput.value.length ||
                  (Platform.OS === 'android' ? !selectedWifi : !currentSSID)
                }
              >
                {scanning || connecting ? (
                  <ActivityIndicator color="#0A2540" />
                ) : (
                  <Text style={styles.connectBtnText}>
                    {t('bluetoothScreen.connect') || 'Connect'}
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
