import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
  ImageBackground,
  ScrollView,
  Animated,
  Keyboard,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraSetupScreenNavigationProp } from '@navigation/types';
import QrScannerBackground from '@assets/webp/qr-scan-background.webp';
import { styles } from './QRScanner.styles';
import RectangleIcon4 from '@assets/svg/rectangle-4.svg';
import RectangleIcon5 from '@assets/svg/rectangle-5.svg';
import RectangleIcon6 from '@assets/svg/rectangle-6.svg';
import RectangleIcon7 from '@assets/svg/rectangle-7.svg';
import MoveRightIcon from '@assets/svg/vector-right.svg';
import { useTranslation } from 'react-i18next';
import cameraService from '@/services/cameraService';
import { jetsonBLEService } from '@/services/jetsonBLEService';

const CAMERA_PERMISSION_KEY = '@camera_permission_status';

type PermissionStatus = 'checking' | 'denied' | 'granted' | 'blocked';

const QRScanner: React.FC = () => {
  const navigation = useNavigation<CameraSetupScreenNavigationProp>();
  const isFocused = useIsFocused();
  const device = useCameraDevice('back');

  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('checking');
  const [shouldMountCamera, setShouldMountCamera] = useState<boolean>(false);
  const [scanningEnabled, setScanningEnabled] = useState<boolean>(true); // New state to control scanning
  const [scanResult, setScanResult] = useState<'idle' | 'success' | 'error'>('idle');
  const { t } = useTranslation();
  const isProcessingRef = useRef<boolean>(false);
  const [idStatusCamera, setIdStatusCamera] = useState<string>('');
  const [responseData, setResponseData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      await updateStatusCamera();
      await checkPermissionStatus();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset scanning state when screen is focused
  useEffect(() => {
    if (isFocused) {
      setScanningEnabled(true);
      setIsSearching(false);
      setScannedData(null);
      setScanResult('idle');
      isProcessingRef.current = false;
    }
  }, [isFocused]);

  const checkPermissionStatus = async () => {
    try {
      const cameraPermission = Camera.getCameraPermissionStatus();

      if (cameraPermission === 'granted') {
        await AsyncStorage.setItem(CAMERA_PERMISSION_KEY, 'granted');
        setPermissionStatus('granted');
        setShouldMountCamera(true);
      } else if (cameraPermission === 'not-determined' || cameraPermission === 'denied') {
        setPermissionStatus('denied');
        Alert.alert(t('QRScan.cameraAccess'), t('QRScan.cameraAccessIsRequiredToScanTheQRCode'), [
          {
            text: t('QRScan.doNotAllow'),
            style: 'cancel',
            onPress: () => navigation.navigate('CameraSetup', { qrData: null }),
          },
          {
            text: t('QRScan.allow'),
            onPress: handleAllowPermission,
          },
        ]);
      } else {
        await AsyncStorage.setItem(CAMERA_PERMISSION_KEY, 'blocked');
        setPermissionStatus('blocked');
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setPermissionStatus('denied');
      Alert.alert(t('QRScan.cameraAccess'), t('QRScan.cameraAccessIsRequiredToScanTheQRCode'), [
        {
          text: t('QRScan.doNotAllow'),
          style: 'cancel',
          onPress: () => navigation.navigate('CameraSetup', { qrData: null }),
        },
        {
          text: t('QRScan.allow'),
          onPress: handleAllowPermission,
        },
      ]);
    }
  };

  const handleAllowPermission = async () => {
    const permission = await Camera.requestCameraPermission();
    if (permission === 'granted') {
      await AsyncStorage.setItem(CAMERA_PERMISSION_KEY, 'granted');
      setPermissionStatus('granted');
      setShouldMountCamera(true);
    } else {
      await AsyncStorage.setItem(CAMERA_PERMISSION_KEY, 'blocked');
      setPermissionStatus('blocked');
    }
  };

  const resetScanningState = () => {
    setIsSearching(false);
    setScannedData(null);
    setScanningEnabled(true);
    setScanResult('idle');
    isProcessingRef.current = false;
  };

  const handleManualConnect = async () => {
    if (!scannedData) {
      Alert.alert(t('common.error') || 'Error', t('QRScan.noQRData') || 'No QR data scanned');
      return;
    }
    if (responseData) {
      navigation.navigate('ConnectionSuccessful', {
        cameraData: responseData,
      });
      return;
    }
    setIsSearching(true);
    setScanResult('idle');
    try {
      const parsedData = JSON.parse(scannedData);
      const { id } = parsedData;
      const response = await cameraService.registerCamera({
        id,
        status_id: idStatusCamera,
      });
      if (!response.data) {
        setIsSearching(false);
        setScanResult('error');
        return;
      }
      setResponseData(response.data);
      setScanResult('success');
      setIsSearching(false);
      navigation.navigate('ConnectionSuccessful', {
        cameraData: response.data,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setIsSearching(false);
      setScanResult('error');
      Alert.alert('', t('QRScan.theCameraHasBeenRegistered'), [
        {
          text: t('common.ok'),
          onPress: () => {
            resetScanningState();
          },
        },
      ]);
    }
  };

  const updateStatusCamera = async () => {
    const response = await cameraService.updateStatus();
    const cameras: { id: string; name_trans: string } = response.data;
    // @ts-ignore
    setIdStatusCamera(cameras[2]?.id ?? '');
  };

  const registerCamera = async (qrData: string) => {
    void jetsonBLEService.disconnect();
    setScanningEnabled(false);
    if (isProcessingRef.current) {
      return;
    }
    setScannedData(qrData);
    setIsSearching(false);
    setScanResult('success');
    isProcessingRef.current = false;
  };

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      if (
        codes.length > 0 &&
        !scannedData &&
        !isSearching &&
        !isProcessingRef.current &&
        scanningEnabled
      ) {
        const qrData = codes[0].value;
        if (qrData) {
          registerCamera(qrData);
        }
      }
    },
  });

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  if (permissionStatus === 'checking') {
    return (
      <LinearGradient colors={['#0A3A2A', '#0D1F1A', '#050F0A']} style={styles.container}>
        <SafeAreaView style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00FFAA" />
          <Text style={styles.loadingText}>{t('QRScan.loading')}</Text>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (permissionStatus === 'blocked') {
    return (
      <LinearGradient colors={['#0A3A2A', '#0D1F1A', '#050F0A']} style={styles.container}>
        <SafeAreaView style={styles.centerContainer}>
          <View style={styles.permissionIconContainer}>
            <Icon name="camera-off" size={64} color="#EF4444" />
          </View>
          <Text style={styles.permissionTitle}>{t('QRScan.cameraPermissionRequired')}</Text>
          <Text style={styles.permissionText}>
            {t('QRScan.toScanTheQRCodePleaseAllowCameraPermissionInSettings')}
          </Text>
          <TouchableOpacity style={styles.settingsButton} onPress={() => Linking.openSettings()}>
            <Icon name="cog" size={20} color="#00FFAA" />
            <Text style={styles.settingsButtonText}>{t('permission.openSettings')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.manualConnectButton} onPress={handleManualConnect}>
            <Text style={styles.manualConnectButtonText}>{t('QRScan.manualConnection')}</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!device) {
    return (
      <LinearGradient colors={['#0A3A2A', '#0D1F1A', '#050F0A']} style={styles.container}>
        <SafeAreaView style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#00FFAA" />
          <Text style={styles.loadingText}>{t('QRScan.loadingCamera')}</Text>

          <TouchableOpacity style={styles.manualButton} onPress={handleManualConnect}>
            <Text style={styles.manualButtonText}>{t('QRScan.manualConnection')}</Text>
            <MoveRightIcon />
          </TouchableOpacity>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const HeaderContent = (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Icon name="arrow-left" size={24} color="#FFF" />
      </TouchableOpacity>
      <Text style={styles.title}>{t('QRScan.deviceRegistration')}</Text>
    </View>
  );

  const BodyContent = (
    // eslint-disable-next-line react-native/no-inline-styles
    <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
      <View style={styles.centerContent}>
        <Animated.View style={[styles.qrFrameContainer]}>
          {shouldMountCamera && (
            <Camera
              style={StyleSheet.absoluteFill}
              device={device}
              isActive={isFocused && shouldMountCamera && scanningEnabled}
              codeScanner={scanningEnabled ? codeScanner : undefined}
              torch={isFlashOn ? 'on' : 'off'}
            />
          )}
          <RectangleIcon4 style={[styles.corner, styles.topLeft]} />
          <RectangleIcon5 style={[styles.corner, styles.topRight]} />
          <RectangleIcon6 style={[styles.corner, styles.bottomLeft]} />
          <RectangleIcon7 style={[styles.corner, styles.bottomRight]} />
          {!scannedData && !isSearching && scanningEnabled && (
            <View style={styles.scanIndicator}>
              <Icon name="qrcode-scan" size={80} color="#00ADD4" />
            </View>
          )}
          {!scanningEnabled && !isSearching && (
            <View style={styles.scanIndicator}>
              <Icon name="pause" size={80} color="#FFA500" />
            </View>
          )}
        </Animated.View>

        <TouchableOpacity
          style={[styles.flashButton, isFlashOn && styles.flashButtonActive]}
          onPress={() => setIsFlashOn(!isFlashOn)}
          disabled={isSearching || !scanningEnabled}
        >
          <Icon name="flash" size={18} color="#FFF" />
          <Text style={styles.flashText}>Flash {isFlashOn ? 'on' : 'off'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.bottomSection}>
        {isSearching ? (
          <View style={styles.searchingContainer}>
            <View style={styles.bluetoothIcon}>
              <Icon name="bluetooth" size={28} color="#00D9FF" />
            </View>
            <Text style={styles.searchingText}>
              {scanResult === 'success'
                ? t('QRScan.cameraRegisteredSuccessfully')
                : t('QRScan.searchingForDevices')}
            </Text>
            {scanResult === 'success' ? null : (
              <ActivityIndicator size="small" color="#00D9FF" style={styles.btnSearch} />
            )}
          </View>
        ) : null}
        <TouchableOpacity
          style={[styles.manualButton, scanResult !== 'success' && styles.manualButtonDisabled]}
          onPress={handleManualConnect}
          disabled={scanResult !== 'success'}
        >
          <Text
            style={[
              styles.manualButtonText,
              scanResult !== 'success' && styles.manualButtonTextDisabled,
            ]}
          >
            {t('bluetoothScreen.connect')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={QrScannerBackground}
        style={styles.backgroundImage}
        resizeMode="stretch"
        imageStyle={styles.imageStyle}
      >
        {permissionStatus === 'granted' && (
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView style={styles.overlay} edges={['top']}>
              {HeaderContent}
              <View style={styles.styleScrollView}>{BodyContent}</View>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        )}
      </ImageBackground>
    </View>
  );
};

export default QRScanner;
