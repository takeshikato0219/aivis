import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Platform,
  Alert,
  Image,
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

interface CameraInfo {
  id: string;
  name: string;
  serial: string;
  status: 'online' | 'offline';
  streamUrl: string;
  thumbnail?: string;
}

interface RouteParams {
  camera?: CameraInfo;
  streamUrl?: string;
}

const ConnectionSuccessful: React.FC = () => {
  const responsive = useResponsive();
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const webViewRef = useRef<WebView>(null);

  const params = route.params as RouteParams;

  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>(
    'connecting'
  );

  const cameraInfo: CameraInfo = params?.camera || {
    id: '1',
    name: 'AIVIS Pro Cam 1',
    serial: 'シリアル：8928-XXXX-12',
    status: 'online',
    streamUrl:
      params?.streamUrl ||
      'https://avisaitest-nginx001.wpstories.org/stream.html?src=camera&mode=webrtc,mse,hls,mjpeg',
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setConnectionStatus('connected');
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleWebViewError = () => {
    setConnectionStatus('failed');
    setIsLoading(false);
  };

  const handleWebViewLoad = () => {
    setIsLoading(false);
    setConnectionStatus('connected');
  };

  const handleWebViewHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView HTTP error:', nativeEvent);
  };

  const getStreamHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <meta http-equiv="Content-Security-Policy" content="upgrade-insecure-requests">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            background: #000;
            overflow: hidden;
            -webkit-overflow-scrolling: touch;
          }
          #stream-container {
            width: 100vw;
            height: 100vh;
            position: relative;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: none;
          }
          video {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
        </style>
      </head>
      <body>
        <div id="stream-container">
          <iframe 
            src="${cameraInfo.streamUrl}" 
            allow="camera; microphone; autoplay; fullscreen"
            allowfullscreen
            frameborder="0"
          ></iframe>
        </div>
        <script>
          window.addEventListener('error', function(e) {
            e.preventDefault();
          });
          
          // Log readiness
          window.addEventListener('load', function() {
            console.log('Stream iframe loaded');
          });
        </script>
      </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

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

        <View style={styles.streamWrapper}>
          <WebView
            ref={webViewRef}
            source={{ html: getStreamHTML() }}
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
            {...(Platform.OS === 'ios' && {
              allowsBackForwardNavigationGestures: false,
              decelerationRate: 'normal',
              bounces: false,
              scrollEnabled: false,
            })}
            {...(Platform.OS === 'android' && {
              mixedContentMode: 'always',
              thirdPartyCookiesEnabled: true,
              allowFileAccessFromFileURLs: true,
            })}
            onMessage={(event) => {
              console.log('WebView message:', event.nativeEvent.data);
            }}
            injectedJavaScript={`
              // Log errors to React Native
              window.onerror = function(msg, url, line, col, error) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'error',
                  message: msg,
                  url: url,
                  line: line
                }));
                return false;
              };
              
              // Override console for debugging
              const originalLog = console.log;
              console.log = function(msg) {
                originalLog(msg);
                try {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'log',
                    message: String(msg)
                  }));
                } catch(e) {}
              };
              
              true; // Required for injectedJavaScript
            `}
          />

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>Loading stream...</Text>
            </View>
          )}

          {connectionStatus === 'failed' && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorText}>Failed to load stream</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setIsLoading(true);
                  setConnectionStatus('connecting');
                  webViewRef.current?.reload();
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
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
            <Text style={styles.statusText}>オンライン・準備完了</Text>
          </View>
        </View>
      </View>

      <View style={styles.cameraNameSection}>
        <Text style={styles.cameraNameLabel}>{t('liveStream.cameraName')}</Text>
        <TouchableOpacity style={styles.editNameButton}>
          <IconPencil />
          <Text style={styles.editNameText}>{t('liveStream.exampleLivingRoomCamera')}</Text>
        </TouchableOpacity>
        <Text style={styles.cameraNameHint}>
          {t('liveStream.thisNameWillAppearInYourDashboardAlerts')}
        </Text>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            Alert.alert('Start Monitoring', 'Navigate to monitoring screen');
          }}
        >
          <View style={styles.styleViewBottom}>
            <View style={styles.settingStyle}>
              <Text style={styles.primaryButtonText}>{t('liveStream.startMonitoring')}</Text>
            </View>
            <View style={styles.marginStyle}>
              <MoveRightIcon />
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            navigation.navigate('FaceUpload' as never);
          }}
        >
          <View style={styles.styleViewBottom}>
            <View style={styles.settingStyle}>
              <Text style={styles.secondaryButtonText}>{t('liveStream.faceSetup')}</Text>
            </View>
            <View style={styles.marginStyle}>
              <SettingIcon width={20} height={20} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

export default ConnectionSuccessful;
