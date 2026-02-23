import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
  Image,
  ScrollView,
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
import { buildStreamUrl } from '@utils/streamUtils';
import { useLiveStream } from '@hooks/useLiveStream';

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

  // Calculate stream width to fit outer view (excluding marginHorizontal: 20)
  const streamWidth = screenWidth - 40; // 20px margin each side

  // Use live stream hook
  const {
    webViewRef,
    isLoading,
    connectionStatus,
    isReconnecting,
    handleWebViewLoad,
    handleWebViewError,
    handleWebViewHttpError,
    handleManualRetry,
    handleWebViewMessage,
    getInjectedJavaScript,
  } = useLiveStream();

  const getStatus = (status?: string | CameraStatus): 'online' | 'offline' => {
    if (!status) return 'online';
    if (typeof status === 'string') {
      return status.toLowerCase() === 'offline' ? 'offline' : 'online';
    }
    return status.name_trans?.toLowerCase().includes('offline') ? 'offline' : 'online';
  };

  // Convert Camera to CameraInfo
  const streamUrl = buildStreamUrl(cameraData?.rtsp_url);
  const cameraInfo: CameraInfo = {
    id: cameraData?.id || '1',
    name: cameraData?.name || 'AIVIS Pro Cam 1',
    serial: cameraData?.serial || 'シリアル：8928-XXXX-12',
    status: getStatus(cameraData?.status),
    streamUrl,
  };

  const [cameraName, setCameraName] = useState(cameraData?.name || t(''));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
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
            <WebView
              ref={webViewRef}
              source={{ uri: streamUrl }}
              style={styles.webView}
              onLoad={handleWebViewLoad}
              onError={handleWebViewError}
              onHttpError={handleWebViewHttpError}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={false}
              originWhitelist={['*']}
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
              scalesPageToFit={false}
              renderToHardwareTextureAndroid={true}
              androidLayerType="hardware"
              cacheEnabled={false}
              {...(Platform.OS === 'ios' && {
                allowsBackForwardNavigationGestures: false,
                decelerationRate: 'normal',
                bounces: false,
                scrollEnabled: false,
                suppressesIncrementalRendering: true,
              })}
              {...(Platform.OS === 'android' && {
                mixedContentMode: 'always',
                thirdPartyCookiesEnabled: true,
                allowFileAccessFromFileURLs: true,
                textZoom: 100,
              })}
              onMessage={handleWebViewMessage}
              injectedJavaScript={getInjectedJavaScript()}
            />

            {isLoading && !isReconnecting && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>{t('liveStream.loadingStream')}</Text>
                <TouchableOpacity style={styles.loadingRetryButton} onPress={handleManualRetry}>
                  <Text style={styles.loadingRetryButtonText}>{t('common.retry')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {isReconnecting && (
              <View style={styles.reconnectingOverlay}>
                <ActivityIndicator size="large" color="#FFA500" />
                <Text style={styles.reconnectingText}>{t('liveStream.reconnecting')}</Text>
                <Text style={styles.reconnectingSubtext}>{t('liveStream.connectionLost')}</Text>
                <TouchableOpacity style={styles.loadingRetryButton} onPress={handleManualRetry}>
                  <Text style={styles.loadingRetryButtonText}>{t('common.retry')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {connectionStatus === 'failed' && !isReconnecting && !isLoading && (
              <View style={styles.errorOverlay}>
                <Text style={styles.errorText}>{t('liveStream.reconnectFailed')}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleManualRetry}>
                  <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
                </TouchableOpacity>
              </View>
            )}
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
              onChangeText={setCameraName}
              placeholder={t('liveStream.exampleLivingRoomCamera')}
              placeholderTextColor="#8B92A8"
              editable={false}
            />
          </View>
          <Text style={styles.cameraNameHint}>
            {t('liveStream.thisNameWillAppearInYourDashboardAlerts')}
          </Text>
        </View>
        <SafeAreaView edges={['bottom']} style={styles.bottomSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              navigation.navigate('Home' as any);
            }}
          >
            <View style={styles.viewButtonBottom}>
              <Text style={styles.primaryButtonText}>{t('liveStream.startMonitoring')}</Text>
              <MoveRightIcon style={styles.positionButtonBottom} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              navigation.navigate('FaceUpload' as never);
            }}
          >
            <View style={styles.viewButtonBottom}>
              <Text style={styles.secondaryButtonText}>{t('liveStream.faceSetup')}</Text>
            </View>
            <SettingIcon width={20} height={20} color="#fff" style={styles.positionButtonBottom} />
          </TouchableOpacity>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
};

export default ConnectionSuccessful;
