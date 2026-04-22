import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, ImageBackground, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QrScannerBackground from '@assets/webp/complete-background.webp';
import CompleteIcon from '@assets/svg/complete-icon.svg';
import { useResponsive } from '@hooks/useResponsive';
import { styles } from './SetupComplete.styles';
import { useTranslation } from 'react-i18next';
import QRCodeIcon from '@assets/svg/qr-code.svg';
import { SetupCompleteScreenRouteProp } from '@navigation/types';

const SetupComplete: React.FC = () => {
  const navigation = useNavigation();
  const { params } = useRoute<SetupCompleteScreenRouteProp>();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const responsive = useResponsive();
  const { t } = useTranslation();

  useEffect(() => {
    // Success animation
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoToDashboard = () => {
    navigation.navigate('Home' as any);
  };

  const goToQrScanner = () => {
    navigation.navigate('QRScanner' as never);
  };

  const Content = (
    <View style={styles.content}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <CompleteIcon
          width={responsive.isTablet ? 235 : 150}
          height={responsive.isTablet ? 235 : 150}
        />
      </View>

      {/* Success Message */}
      <View style={styles.messageContainer}>
        <Text style={styles.successTitle}>{t('setupComplete.successfullyConnected')}</Text>
      </View>

      {/* Camera Info Card */}
      <View style={styles.cameraCardInfo}>
        <View style={responsive.isLandscape ? styles.cameraCardLandscape : styles.cameraCard}>
          <Text style={styles.cameraSerial}>
            {t('setupComplete.serial')} {params?.deviceId ?? ''}
          </Text>
        </View>
        <Text style={styles.textNotify}>{t('setupComplete.communicationEstablished')}</Text>
      </View>

      {/* Spacer to push bottom elements down */}
      <View style={styles.spacer} />

      {/* Bottom Buttons */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.dashboardButton} onPress={goToQrScanner}>
          <Text style={styles.dashboardButtonText}>Scan QR</Text>
          <QRCodeIcon />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingsButton} onPress={handleGoToDashboard}>
          <Text style={styles.settingsButtonText}>{t('setupComplete.cancelSetup')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ImageBackground
        source={QrScannerBackground}
        style={styles.backgroundImage}
        resizeMode="stretch"
        imageStyle={styles.imageStyle}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>{Content}</ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export default SetupComplete;
