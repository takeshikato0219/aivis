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
  useWindowDimensions,
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
import QrScannerBackground from '@assets/png/qr-scan-background.png';
import { styles } from './QRScanner.styles';
import RectangleIcon4 from '@assets/svg/rectangle-4.svg';
import RectangleIcon5 from '@assets/svg/rectangle-5.svg';
import RectangleIcon6 from '@assets/svg/rectangle-6.svg';
import RectangleIcon7 from '@assets/svg/rectangle-7.svg';
import MoveRightIcon from '@assets/svg/vector-right.svg';
import { useTranslation } from 'react-i18next';
import { KeyboardIconComponent } from '@components/IconCustom/IconCustom';
import { COLORS } from '@constants/theme';
import TextInput from '@components/TextInput/TextInput';
import { useInput } from '@hooks/useInput';
import { isPassword } from '@utils/validate';
import { useAppSelector, store } from '@redux/store';
import cameraService from '@api/cameraService';
import { jetsonBLEService } from '@/services/jetsonBLEService';

const CAMERA_PERMISSION_KEY = '@camera_permission_status';

type PermissionStatus = 'checking' | 'denied' | 'granted' | 'blocked';

const QRScanner: React.FC = () => {
  const navigation = useNavigation<CameraSetupScreenNavigationProp>();
  const isFocused = useIsFocused();
  const device = useCameraDevice('back');
  const window = useWindowDimensions();
  const isLandscape = window.width > window.height;
  const isSmallScreen = window.width < 600 || window.height < 600;
  const shouldUseScrollView = isLandscape && isSmallScreen;

  const [isFlashOn, setIsFlashOn] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('checking');
  const [shouldMountCamera, setShouldMountCamera] = useState<boolean>(false);
  const [scanningEnabled, setScanningEnabled] = useState<boolean>(true); // New state to control scanning
  const { t } = useTranslation();
  const { accessToken, isAuthenticated } = useAppSelector((state) => state.auth);
  const isProcessingRef = useRef<boolean>(false);
  const [idStatusCamera, setIdStatusCamera] = useState<string>('');
  const state = store.getState();

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
      isProcessingRef.current = false;
    }
  }, [isFocused]);

  const agentCodeInput = useInput({
    validateFn: isPassword,
  });

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
    } catch (error) {
      console.log(error);
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
    isProcessingRef.current = false;
  };

  const registerCamera = async (qrData: string) => {
    void jetsonBLEService.disconnect();

    setScanningEnabled(false);

    if (isProcessingRef.current) {
      return;
    }

    // Check authentication
    if (!isAuthenticated || !accessToken) {
      setIsSearching(false);
      setScannedData(null);
      Alert.alert(
        t('common.error') || 'Error',
        t('QRScan.authenticationRequired') || 'Please login to register camera',
        [
          {
            text: t('common.ok'),
            onPress: () => {
              resetScanningState();
            },
          },
        ]
      );
      return;
    }

    isProcessingRef.current = true;

    try {
      // Parse QR data
      const parsedData = JSON.parse(qrData);
      const { id } = parsedData;

      // Call camera service to register
      const response = await cameraService.registerCamera({
        id,
        status_id: idStatusCamera,
        user_id: state.auth.user?.id,
      });

      // Success - show alert and navigate
      Alert.alert(
        t('common.success'),
        t('QRScan.cameraRegisteredSuccessfully') || 'Camera registered successfully',
        [
          {
            text: t('common.ok'),
            onPress: () => {
              isProcessingRef.current = false;
              if (response.data) {
                navigation.navigate('ConnectionSuccessful', {
                  cameraData: response.data,
                });
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error registering camera:', error);
      isProcessingRef.current = false;

      Alert.alert('', t('QRScan.theCameraHasBeenRegistered'), [
        {
          text: t('common.ok'),
          onPress: () => {
            // Reset scanning state to allow scanning again
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

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: (codes) => {
      // Only process QR codes if scanning is enabled and not already processing
      if (
        codes.length > 0 &&
        !scannedData &&
        !isSearching &&
        !isProcessingRef.current &&
        scanningEnabled
      ) {
        const qrData = codes[0].value;
        if (qrData) {
          setScannedData(qrData);
          setIsSearching(true);
          registerCamera(qrData);
        }
      }
    },
  });

  const handleManualConnect = () => {
    navigation.navigate('CameraSetup', { qrData: null });
  };

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
    <>
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
            <Text style={styles.searchingText}>{t('QRScan.searchingForDevices')}</Text>
            <Text style={styles.searchingSubtext}>{t('QRScan.bluetoothConnected')}</Text>
            <ActivityIndicator size="small" color="#00D9FF" style={styles.btnSearch} />
          </View>
        ) : null}

        <Text style={styles.styleAgentCodeText}>{t('QRScan.agentCode')}</Text>
        <TextInput
          value={agentCodeInput.value}
          onChangeText={agentCodeInput.handleChange}
          icon={KeyboardIconComponent}
          secureTextEntry
          placeholder={t('QRScan.enterManualCode')}
          autoCapitalize="none"
          autoComplete="password"
          style={styles.input}
          testID="password-input"
          placeholderTextColor={COLORS.BBBBBB}
        />
        <TouchableOpacity style={styles.manualButton} onPress={handleManualConnect}>
          <Text style={styles.manualButtonText}>{t('bluetoothScreen.connect')}</Text>
        </TouchableOpacity>
      </View>
    </>
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
              {shouldUseScrollView ? (
                <ScrollView
                  contentContainerStyle={styles.styleScrollView}
                  keyboardShouldPersistTaps="handled"
                >
                  {BodyContent}
                </ScrollView>
              ) : (
                <View style={styles.styleScrollView}>{BodyContent}</View>
              )}
            </SafeAreaView>
          </TouchableWithoutFeedback>
        )}
      </ImageBackground>
    </View>
  );
};

export default QRScanner;
