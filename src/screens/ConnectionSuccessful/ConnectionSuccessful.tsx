import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
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

const ConnectionSuccessful: React.FC = () => {
  const responsive = useResponsive();
  const navigation = useNavigation();
  const { t } = useTranslation();
  const webViewRef = useRef<WebView>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'failed'>(
    'connecting'
  );
  const [cameraName, setCameraName] = useState(t(''));
  const [retryCount, setRetryCount] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const maxRetries = 5;
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef<number>(Date.now());

  const cameraInfo: CameraInfo = {
    id: '1',
    name: 'AIVIS Pro Cam 1',
    serial: 'シリアル：8928-XXXX-12',
    status: 'online',
    streamUrl:
      'https://avisaitest-nginx001.wpstories.org/stream.html?src=camera&mode=webrtc,mse,hls,mjpeg',
  };

  useEffect(() => {
    // Initial loading: 5-10 seconds (random between 5000-10000ms)
    const loadingTime = Math.floor(Math.random() * 5000) + 5000; // 5000-10000ms
    const timer = setTimeout(() => {
      // Only auto-hide loading if WebView hasn't loaded yet
      // If WebView loads earlier, handleWebViewLoad will handle it
      setIsLoading((prevLoading) => {
        if (prevLoading) {
          setConnectionStatus('connected');
          return false;
        }
        return prevLoading;
      });
    }, loadingTime);

    return () => clearTimeout(timer);
  }, []);

  const handleWebViewError = () => {
    setConnectionStatus('failed');
    setIsLoading(false);
    handleConnectionLost();
  };

  const handleWebViewLoad = () => {
    setIsLoading(false);
    setConnectionStatus('connected');
    setIsReconnecting(false);
    setRetryCount(0);
    // Clear any pending retry timers
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    lastHeartbeatRef.current = Date.now();
    startHeartbeatMonitoring();
  };

  const handleWebViewHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.warn('WebView HTTP error:', nativeEvent);
    handleConnectionLost();
  };

  const startHeartbeatMonitoring = () => {
    // Clear existing interval
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    // Reset heartbeat time
    lastHeartbeatRef.current = Date.now();

    // Start heartbeat check every 5 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - lastHeartbeatRef.current;
      // If no heartbeat for 10 seconds, consider connection lost
      if (timeSinceLastHeartbeat > 10000) {
        console.warn('Heartbeat timeout detected, connection may be lost');
        handleConnectionLost();
      }
    }, 5000);
  };

  const handleConnectionLost = () => {
    // Clear heartbeat monitoring
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }

    // Don't retry if already failed or max retries reached
    if (retryCount >= maxRetries) {
      setConnectionStatus('failed');
      setIsReconnecting(false);
      return;
    }

    // Start reconnecting
    setIsReconnecting(true);
    setConnectionStatus('connecting');

    // Calculate delay with exponential backoff (max 30 seconds)
    const delay = Math.min(2000 * Math.pow(2, retryCount), 30000);

    // Clear existing retry timer
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
    }

    // Schedule retry
    retryTimerRef.current = setTimeout(() => {
      setRetryCount((prev) => prev + 1);
      webViewRef.current?.reload();
    }, delay);
  };

  const handleManualRetry = () => {
    setRetryCount(0);
    setIsLoading(true);
    setConnectionStatus('connecting');
    setIsReconnecting(false);
    webViewRef.current?.reload();
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'heartbeat') {
        // Update last heartbeat time
        lastHeartbeatRef.current = Date.now();
      } else if (data.type === 'connection-lost') {
        console.warn('Connection lost detected from WebView');
        handleConnectionLost();
      } else if (data.type === 'connection-restored') {
        console.log('Connection restored');
        setIsReconnecting(false);
        setRetryCount(0);
        setConnectionStatus('connected');
        lastHeartbeatRef.current = Date.now();
      } else if (data.type === 'error') {
        console.warn('WebView error:', data.message);
        // Check if it's a connection-related error
        if (
          data.message &&
          (data.message.includes('network') ||
            data.message.includes('connection') ||
            data.message.includes('failed') ||
            data.message.includes('timeout'))
        ) {
          handleConnectionLost();
        }
      }
    } catch (error) {
      console.log('WebView message:', error);
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, []);

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
              onMessage={handleWebViewMessage}
              injectedJavaScript={`
              (function() {
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
                
                // Heartbeat monitoring
                let heartbeatInterval = null;
                let lastHeartbeatTime = Date.now();
                
                function sendHeartbeat() {
                  try {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'heartbeat',
                      timestamp: Date.now()
                    }));
                    lastHeartbeatTime = Date.now();
                  } catch(e) {
                    console.error('Failed to send heartbeat:', e);
                  }
                }
                
                // Monitor iframe connection
                function monitorIframe() {
                  const iframe = document.querySelector('iframe');
                  if (!iframe) {
                    console.warn('Iframe not found');
                    return;
                  }
                  
                  // Check if iframe is loaded
                  iframe.onload = function() {
                    console.log('Iframe loaded successfully');
                    sendHeartbeat();
                  };
                  
                  // Monitor iframe errors
                  iframe.onerror = function() {
                    console.error('Iframe error detected');
                    try {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'connection-lost',
                        reason: 'iframe-error'
                      }));
                    } catch(e) {}
                  };
                  
                  // Try to access iframe content to check connection
                  try {
                    // Check if we can access iframe (may fail due to CORS)
                    const iframeWindow = iframe.contentWindow;
                    if (iframeWindow) {
                      // Iframe is accessible, connection seems OK
                      sendHeartbeat();
                    }
                  } catch(e) {
                    // CORS error is expected, but we can still monitor
                    console.log('Cannot access iframe content (CORS), but iframe exists');
                    sendHeartbeat();
                  }
                }
                
                // Start monitoring when page loads
                if (document.readyState === 'complete') {
                  monitorIframe();
                  // Send heartbeat every 3 seconds
                  heartbeatInterval = setInterval(sendHeartbeat, 3000);
                } else {
                  window.addEventListener('load', function() {
                    monitorIframe();
                    heartbeatInterval = setInterval(sendHeartbeat, 3000);
                  });
                }
                
                // Monitor network status
                window.addEventListener('online', function() {
                  console.log('Network online');
                  try {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'connection-restored',
                      reason: 'network-online'
                    }));
                  } catch(e) {}
                });
                
                window.addEventListener('offline', function() {
                  console.warn('Network offline');
                  try {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'connection-lost',
                      reason: 'network-offline'
                    }));
                  } catch(e) {}
                });
                
                // Cleanup on page unload
                window.addEventListener('beforeunload', function() {
                  if (heartbeatInterval) {
                    clearInterval(heartbeatInterval);
                  }
                });
                
                return true; // Required for injectedJavaScript
              })();
            `}
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
              </View>
            )}

            {connectionStatus === 'failed' && !isReconnecting && (
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
              <Text style={styles.statusText}>オンライン・準備完了</Text>
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
            />
          </View>
          <Text style={styles.cameraNameHint}>
            {t('liveStream.thisNameWillAppearInYourDashboardAlerts')}
          </Text>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => {
            navigation.navigate('Home' as any);
          }}
        >
          <Text style={styles.primaryButtonText}>{t('liveStream.startMonitoring')}</Text>
          <MoveRightIcon />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => {
            navigation.navigate('FaceUpload' as never);
          }}
        >
          <Text style={styles.secondaryButtonText}>{t('liveStream.faceSetup')}</Text>
          <SettingIcon width={20} height={20} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
};

export default ConnectionSuccessful;
