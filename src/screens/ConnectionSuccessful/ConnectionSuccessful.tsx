import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
  Image,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
import CompleteIcon from '@assets/svg/complete-icon.svg';
import { useResponsive } from '@hooks/useResponsive';
import LogoDetail from '@assets/svg/logo-detail.svg';
import { styles } from './ConnectionSuccessful.styles';
import MoveRightIcon from '@assets/svg/vector-right.svg';
import CameraLiveViewIcon from '@assets/png/camera-live.png';
import IconPencil from '@assets/svg/pencil-icon.svg';
import SettingIcon from '@assets/svg/settings-icon-incisor.svg';
import { ConnectionSuccessfulScreenRouteProp } from '@navigation/types';
import { CameraStatus } from '@api/types/cameraTypes';
import {
  buildStreamHtmlUrl,
  getInjectedStreamPlayerJS,
  buildIOSStreamInlineHtml,
} from '@utils/streamUtils';
import cameraService from '@/services/cameraService';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

interface CameraInfo {
  id: string;
  name: string;
  serial: string;
  status: 'online' | 'offline';
  streamUrl: string;
  thumbnail?: string;
}

const ConnectionSuccessful: React.FC = () => {
  const responsive = useResponsive();
  const navigation = useNavigation();
  const route = useRoute<ConnectionSuccessfulScreenRouteProp>();
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const cameraData = route.params?.cameraData;

  const streamWidth = screenWidth - 40;

  // Self-managed stream state (same as DetectionZoneSetup)
  const webViewRef = useRef<WebView>(null);
  const [streamHtmlUrl, setStreamHtmlUrl] = useState('');
  const [timeExp, setTimeExp] = useState<string | null>(null);
  const [isWebViewLoading, setIsWebViewLoading] = useState(true);
  const [webViewError, setWebViewError] = useState<string | null>(null);

  const fetchLiveUrl = useCallback(async () => {
    if (!cameraData?.id) return;
    try {
      const res = await cameraService.getLiveStreamUrl(cameraData.id);
      if (res.success && res.data) {
        const newHtmlUrl = buildStreamHtmlUrl(res.data.live_url);
        setStreamHtmlUrl((prev) => (prev === newHtmlUrl ? prev : newHtmlUrl));
        setTimeExp(res.data.time_exp);
      }
    } catch (error) {
      console.error('Failed to fetch live URL:', error);
    }
  }, [cameraData?.id]);

  // Auto-refresh stream URL before expiry
  useEffect(() => {
    if (!timeExp) return;
    const refreshMs = new Date(timeExp).getTime() - Date.now() - 2 * 60 * 1000;
    if (refreshMs > 0) {
      const timer = setTimeout(fetchLiveUrl, refreshMs);
      return () => clearTimeout(timer);
    }
  }, [timeExp, fetchLiveUrl]);

  // Fetch live URL on mount
  useEffect(() => {
    fetchLiveUrl();
  }, [fetchLiveUrl]);

  const handleReconnect = async () => {
    setWebViewError(null);
    setIsWebViewLoading(true);
    await fetchLiveUrl();
    webViewRef.current?.reload();
  };

  const getStatus = (status?: string | CameraStatus): 'online' | 'offline' => {
    if (!status) return 'online';
    if (typeof status === 'string') {
      return status.toLowerCase() === 'offline' ? 'offline' : 'online';
    }
    return status.name_trans?.toLowerCase().includes('offline') ? 'offline' : 'online';
  };

  // Convert Camera to CameraInfo
  const cameraInfo: CameraInfo = {
    id: cameraData?.id,
    name: cameraData?.name || 'AIVIS Pro Cam 1',
    serial: cameraData?.serial || 'シリアル：8928-XXXX-12',
    status: getStatus(cameraData?.status),
    streamUrl: streamHtmlUrl,
  };

  const [cameraName, setCameraName] = useState(cameraData?.name || t(''));
  const [cameraNameError, setCameraNameError] = useState<string | null>(null);

  const changeNameCamera = async () => {
    if (!cameraName.trim()) {
      setCameraNameError(t('validate.fieldRequired'));
      return;
    }
    setCameraNameError(null);
    if (!cameraData?.id) return;
    try {
      await cameraService.registerCamera({
        id: cameraData.id,
        name: cameraName.trim(),
      });
    } catch (error) {
      console.error('Failed to update camera name:', error);
    }
  };

  const INJECTED_JS = Platform.OS === 'ios' ? undefined : getInjectedStreamPlayerJS('android');

  return (
    <KeyboardAwareScrollView
      enableOnAndroid
      extraScrollHeight={100}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0A0E1A" />
      <View style={styles.successBadgeContainer}>
        <View style={styles.logoContainer}>
          <CompleteIcon
            width={responsive.isTablet ? 200 : 100}
            height={responsive.isTablet ? 200 : 100}
          />
        </View>
        <Text style={styles.successText}>{t('liveStream.connectionSuccessful')}</Text>
      </View>

      <View style={styles.cameraCard}>
        {/* Live Badge */}
        <View style={styles.liveBadge}>
          <View style={styles.liveIndicator} />
          <Text style={styles.liveText}>Live</Text>
        </View>

        <View style={styles.aivasLogoContainer}>
          <LogoDetail width={98} height={28} />
        </View>

        <View style={[styles.streamWrapper, { width: streamWidth }]}>
          {streamHtmlUrl ? (
            <WebView
              ref={webViewRef}
              source={
                Platform.OS === 'ios'
                  ? {
                      html: buildIOSStreamInlineHtml(streamHtmlUrl).html,
                      baseUrl: buildIOSStreamInlineHtml(streamHtmlUrl).baseUrl,
                    }
                  : { uri: streamHtmlUrl }
              }
              style={styles.webView}
              javaScriptEnabled
              domStorageEnabled
              mediaPlaybackRequiresUserAction={false}
              allowsInlineMediaPlayback
              allowsFullscreenVideo={false}
              scrollEnabled={false}
              bounces={false}
              overScrollMode="never"
              injectedJavaScript={INJECTED_JS}
              allowsBackForwardNavigationGestures={false}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              startInLoadingState={false}
              originWhitelist={['*']}
              mixedContentMode="always"
              setBuiltInZoomControls={false}
              setSupportMultipleWindows={false}
              {...(Platform.OS === 'ios' && {
                allowsAirPlayForMediaPlayback: false,
                dataDetectorTypes: 'none',
                decelerationRate: 'normal',
                useWebKit: true,
              })}
              onContentProcessDidTerminate={() => {
                webViewRef.current?.reload();
              }}
              onLoadStart={() => {
                setIsWebViewLoading(true);
                setWebViewError(null);
              }}
              onLoadEnd={() => setIsWebViewLoading(false)}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                setWebViewError(nativeEvent.description || 'Stream load failed');
                setIsWebViewLoading(false);
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                setWebViewError(`HTTP ${nativeEvent.statusCode}`);
                setIsWebViewLoading(false);
              }}
            />
          ) : (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>{t('liveStream.loadingStream')}</Text>
            </View>
          )}

          {isWebViewLoading && streamHtmlUrl ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>{t('liveStream.loadingStream')}</Text>
            </View>
          ) : null}

          {webViewError && !isWebViewLoading ? (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorText}>{webViewError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleReconnect}>
                <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.cameraInfoFooter}>
        <View style={styles.cameraIconContainer}>
          <View style={styles.cameraIcon}>
            <Image source={CameraLiveViewIcon} style={styles.cardImage} />
          </View>
        </View>

        <View style={styles.cameraDetails}>
          <Text style={styles.cameraName}>{cameraInfo.name}</Text>
          <Text style={styles.cameraSerial}>{cameraInfo.serial}</Text>
          <View style={styles.statusRow}>
            <View style={styles.onlineDot} />
            <Text style={styles.statusText}>{t('liveStream.onlineAndReady')}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cameraNameSection}>
        <Text style={styles.cameraNameLabel}>{t('liveStream.cameraName')}</Text>
        <View style={styles.editNameButton}>
          <IconPencil />
          <TextInput
            style={styles.editNameInput}
            value={cameraName}
            onChangeText={(text) => {
              setCameraName(text);
              if (cameraNameError && text.trim()) setCameraNameError(null);
            }}
            onBlur={changeNameCamera}
            placeholder={t('liveStream.exampleLivingRoomCamera')}
            placeholderTextColor="#8B92A8"
          />
        </View>
        {cameraNameError && <Text style={styles.cameraNameError}>{cameraNameError}</Text>}
        <Text style={styles.cameraNameHint}>
          {t('liveStream.thisNameWillAppearInYourDashboardAlerts')}
        </Text>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.bottomSection}>
        <TouchableOpacity
          // eslint-disable-next-line react-native/no-inline-styles
          style={[styles.primaryButton, cameraNameError ? { opacity: 0.5 } : null]}
          onPress={() => {
            navigation.navigate('Home' as any);
          }}
          disabled={!!cameraNameError}
        >
          <View style={styles.viewButtonBottom}>
            <Text style={styles.primaryButtonText}>{t('liveStream.startMonitoring')}</Text>
            <MoveRightIcon style={styles.positionButtonBottom} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          // eslint-disable-next-line react-native/no-inline-styles
          style={[styles.secondaryButton, cameraNameError ? { opacity: 0.5 } : null]}
          onPress={() => {
            (navigation as any).navigate('ListFace', { type: '' });
          }}
          disabled={!!cameraNameError}
        >
          <View style={styles.viewButtonBottom}>
            <Text style={styles.secondaryButtonText}>{t('liveStream.faceSetup')}</Text>
          </View>
          <SettingIcon width={20} height={20} color="#fff" style={styles.positionButtonBottom} />
        </TouchableOpacity>
      </SafeAreaView>
    </KeyboardAwareScrollView>
  );
};

export default ConnectionSuccessful;
