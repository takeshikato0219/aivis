import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ImageBackground,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ConnectWifiHotspotNavigationProp, ConnectWifiHotspotRouteProp } from '@navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './ConnectWifiHotspot.style';
import HomeBackgroundImage from '@assets/png/home-background.png';
import { LockOutlineIcon } from '@components/IconCustom/IconCustom';
import { COLORS } from '@constants/theme';
import { useTranslation } from 'react-i18next';
import { useInput } from '@hooks/useInput';
import { isPasswordWifi } from '@utils/validate';
import { useAppSelector } from '@redux/store';
import TextInput from '@components/TextInput/TextInput';
import BackIcon from '@assets/svg/icon-back.svg';

const ConnectWifiHotspot: React.FC = () => {
  const navigation = useNavigation<ConnectWifiHotspotNavigationProp>();
  const { params } = useRoute<ConnectWifiHotspotRouteProp>();
  const { t } = useTranslation();
  const { isLoading } = useAppSelector((state) => state.auth);
  const wifi = params?.wifi || { ssid: 'AIVIS_AP_XXXX' };

  const passwordInput = useInput({
    validateFn: isPasswordWifi,
  });

  const handleConnect = () => {
    navigation.navigate('NetworkSetup', { cameraAp: wifi.ssid });
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
        <SafeAreaView style={styles.container} edges={['top']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.container}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                  <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
                  </TouchableOpacity>
                  <Text style={styles.headerTitle}>{t('wifiHotspot.connectToCamera')}</Text>
                </View>

                <View style={styles.content}>
                  <Text style={styles.introText}>
                    {t('wifiHotspot.enterPasswordInstruction')}
                    <Text style={styles.textDisconnect}> {wifi.ssid}</Text>.{'\n'}
                    {t('wifiHotspot.deviceWillDisconnect')}
                  </Text>

                  <View style={styles.styleTitlePassword}>
                    <Text style={styles.inputLabel}>AP Password</Text>
                    <TextInput
                      value={passwordInput.value}
                      onChangeText={passwordInput.handleChange}
                      icon={LockOutlineIcon}
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

                  {/* Box info help */}
                  <View style={styles.infoBox}>
                    <Icon
                      name="information-outline"
                      size={18}
                      color="#5DC9FF"
                      style={styles.styleIconInformation}
                    />
                    <View style={styles.container}>
                      <Text style={styles.infoBoxTitle}>{t('wifiHotspot.whereIsThePassword')}</Text>
                      <Text style={styles.infoBoxContent}>
                        {t('wifiHotspot.passwordLocationInfo')}{' '}
                        <Text style={styles.textDisconnect}> '12345678' </Text>.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
          <TouchableOpacity
            style={[styles.connectBtn, !passwordInput.value && styles.connectBtnDisabled]}
            onPress={handleConnect}
            disabled={!passwordInput.value}
          >
            <Text
              style={[styles.connectBtnText, !passwordInput.value && styles.connectBtnTextDisabled]}
            >
              {t('bluetoothScreen.connect')}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export default ConnectWifiHotspot;
