import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ImageBackground, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { PairingCodeScreenNavigationProp, PairingCodeScreenRouteProp } from '@navigation/types';
import { styles } from './PairingCode.style';
import HomeBackgroundImage from '@assets/png/home-background.png';
import { useTranslation } from 'react-i18next';
import BackIcon from '@assets/svg/icon-back.svg';

const CodeStickerBox = ({ code }: { code: string[] }) => (
  <View style={styles.stickerBoxOuter}>
    <View style={styles.stickerBoxInner}>
      <View style={styles.stickerBoxLines}>
        <View style={styles.stickerBoxLineLong} />
        <View style={styles.stickerBoxLineShort} />
      </View>
      <View style={styles.stickerBoxCodeRow}>
        {code.map((c, i) => (
          <View key={`${c}-${i}`} style={styles.stickerBoxCodeItem}>
            <Text style={styles.stickerBoxCodeText}>{c || '-'}</Text>
          </View>
        ))}
      </View>
    </View>
  </View>
);

const PairingCode: React.FC = () => {
  const navigation = useNavigation<PairingCodeScreenNavigationProp>();
  const { params } = useRoute<PairingCodeScreenRouteProp>();
  const device = params?.device;
  const wifi = params?.wifi;
  const isWifi = params?.isWifi;
  const defaultCode = params?.pairingCode || '';
  const { t } = useTranslation();
  console.log(device, wifi);
  const [codes, setCodes] = useState(() =>
    Array(6)
      .fill('')
      .map((_, idx) => defaultCode[idx]?.toUpperCase() || '')
  );

  const inputRefs = useRef<Array<React.RefObject<TextInput | null>>>(
    Array.from({ length: 6 }, () => React.createRef<TextInput>())
  ).current;

  const [error, setError] = useState('');

  const handleChange = (i: number, v: string) => {
    v = v.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (v.length > 1) v = v.slice(0, 1);
    const copy = [...codes];
    copy[i] = v;
    setCodes(copy);

    if (v && i < 5) {
      inputRefs[i + 1]?.current?.focus();
    }
  };

  const handleSubmit = () => {
    if (codes.some((val) => !val)) {
      setError('Please fill all boxes.');
      return;
    }
    setError('');
    navigation.navigate('SetupComplete', {
      cameraName: 'test',
      ssid: '123',
    });
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={HomeBackgroundImage}
        style={styles.backgroundImage}
        resizeMode="stretch"
        imageStyle={styles.imageStyle}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          {/* Fixed Header - outside ScrollView */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('pairingCode.enterPairingCode')}</Text>
          </View>

          {/* Scrollable Content - takes remaining space */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.codeStickerContainer}>
              <CodeStickerBox code={codes} />
            </View>

            <Text style={styles.title}>
              {isWifi ? t('pairingCode.enterWifiPairingCode') : t('pairingCode.enterPairingCode')}
            </Text>
            <Text style={styles.instruction}>{t('pairingCode.alphanumericCode')}</Text>

            <View style={styles.codeInputsRow}>
              {codes.map((value, idx) => (
                <TextInput
                  key={`${value}-${idx}`}
                  ref={inputRefs[idx]}
                  value={value}
                  maxLength={1}
                  style={styles.codeInput}
                  keyboardType="default"
                  autoCapitalize="characters"
                  placeholder="-"
                  placeholderTextColor="#384150"
                  onChangeText={(v) => handleChange(idx, v)}
                  onKeyPress={(e) => {
                    if (e.nativeEvent.key === 'Backspace' && !codes[idx] && idx > 0) {
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

              <TouchableOpacity style={styles.pairBtn} onPress={handleSubmit}>
                <Text style={styles.pairBtnText}>{t('pairingCode.pairDevice')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export default PairingCode;
