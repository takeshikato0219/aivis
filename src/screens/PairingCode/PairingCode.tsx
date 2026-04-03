import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PairingCodeScreenNavigationProp, PairingCodeScreenRouteProp } from '@navigation/types';
import { styles } from './PairingCode.style';
import HomeBackgroundImage from '@assets/webp/home-background.webp';
import { useTranslation } from 'react-i18next';
import BackIcon from '@assets/svg/icon-back.svg';
import ItemCodeBackground from '@assets/webp/pairing-code.webp';
import { jetsonBLEService } from '@/services/jetsonBLEService';
import { useJetsonBLE } from '@hooks/useJetsonBLE';

const PairingCode: React.FC = () => {
  const navigation = useNavigation<PairingCodeScreenNavigationProp>();
  const { params } = useRoute<PairingCodeScreenRouteProp>();
  const device = params?.device;
  const isWifi = params?.isWifi;
  const defaultCode = params?.pairingCode || '';
  const { t } = useTranslation();
  const [code, setCode] = useState(() => defaultCode.toUpperCase());

  const inputRefs = useRef<Array<React.RefObject<TextInput | null>>>(
    Array.from({ length: 6 }, () => React.createRef<TextInput>())
  ).current;

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { connect } = useJetsonBLE();

  const handleGoBack = () => {
    void jetsonBLEService.disconnect();
    navigation.goBack();
  };

  const handleChange = (i: number, v: string) => {
    v = v.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (v.length > 1) v = v.slice(0, 1);
    let newCode = code.split('');
    newCode[i] = v;
    setCode(newCode.join('').slice(0, 6));
    if (v && i < 5) {
      inputRefs[i + 1]?.current?.focus();
    }
  };

  const handleSubmit = async () => {
    if (code.length !== 6) return;

    setLoading(true);
    setError('');

    const result = await connect(device as any, code);
    if (!result || !result.success) {
      if (result?.reason === 'INVALID_PIN') {
        setError('Incorrect PIN');
      } else {
        setError('Connection failed');
      }

      setLoading(false);
      return;
    }

    navigation.navigate('NetworkSetup', {
      cameraAp: device?.name || device?.localName || 'BLE Camera',
    });

    setLoading(false);
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <ActivityIndicator size="large" color="#38E9FF" />
            <Text style={styles.loadingText}>{t('bluetoothScreen.connecting')}</Text>
          </View>
        </View>
      )}
      <ImageBackground
        source={HomeBackgroundImage}
        style={styles.backgroundImage}
        resizeMode="stretch"
        imageStyle={styles.imageStyle}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          {/* Fixed Header - outside ScrollView */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('pairingCode.pairingCode')}</Text>
          </View>

          {/* Scrollable Content - takes remaining space */}
          <KeyboardAvoidingView
            style={styles.scrollView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 60}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <View style={styles.codeStickerContainer}>
                <Image source={ItemCodeBackground} style={styles.stickerBoxOuter} />
              </View>

              <Text style={styles.title}>
                {isWifi ? t('pairingCode.enterWifiPairingCode') : t('pairingCode.enterPairingCode')}
              </Text>
              <Text style={styles.instruction}>{t('pairingCode.alphanumericCode')}</Text>

              <View style={styles.codeInputsRow}>
                {[0, 1, 2, 3, 4, 5].map((idx) => (
                  <TextInput
                    key={idx}
                    ref={inputRefs[idx]}
                    value={code[idx] || ''}
                    maxLength={1}
                    style={styles.codeInput}
                    autoCapitalize="characters"
                    keyboardType="numeric"
                    placeholder="-"
                    placeholderTextColor="#384150"
                    onChangeText={(v) => handleChange(idx, v)}
                    onKeyPress={(e) => {
                      if (e.nativeEvent.key === 'Backspace' && !code[idx] && idx > 0) {
                        inputRefs[idx - 1]?.current?.focus();
                      }
                    }}
                    returnKeyType="next"
                    textAlign="center"
                  />
                ))}
              </View>
              {error ? <Text style={styles.errText}>{error}</Text> : null}

              {/* Spacer to push bottom elements down */}
              <View style={styles.spacer} />

              {/* Bottom Elements inside ScrollView */}
              <View style={styles.bottomContainer}>
                <View style={styles.helpRow}>
                  <Icon
                    name="alert-circle-outline"
                    size={16}
                    color="#8BB2CE"
                    style={styles.marginRightIcon}
                  />
                  <Text style={styles.helpText}>{t('pairingCode.uniqueToEachDevice')}</Text>
                </View>

                <TouchableOpacity
                  style={[
                    styles.pairBtn,
                    code.length !== 6 || code.split('').some((val) => !val)
                      ? styles.pairBtnDisabled
                      : null,
                  ]}
                  onPress={handleSubmit}
                  disabled={code.length !== 6 || code.split('').some((val) => !val)}
                >
                  <Text
                    style={[
                      styles.pairBtnText,
                      code.length !== 6 || code.split('').some((val) => !val)
                        ? styles.pairBtnTextDisabled
                        : null,
                    ]}
                  >
                    {t('pairingCode.pairDevice')}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export default PairingCode;
