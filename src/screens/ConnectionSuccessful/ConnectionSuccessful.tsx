import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  AppState,
  AppStateStatus,
  StyleSheet,
} from 'react-native';
import Video from 'react-native-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { useTranslation } from 'react-i18next';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { captureRef, captureScreen } from 'react-native-view-shot';
import NetInfo from '@react-native-community/netinfo';
import CompleteIcon from '@assets/svg/complete-icon.svg';
import { useResponsive } from '@hooks/useResponsive';
import LogoDetail from '@assets/svg/logo-detail.svg';
import { styles } from './ConnectionSuccessful.styles';
import MoveRightIcon from '@assets/svg/vector-right.svg';
import CameraLiveViewIcon from '@assets/webp/camera-live.webp';
import IconPencil from '@assets/svg/pencil-icon.svg';
import SettingIcon from '@assets/svg/settings-icon-incisor.svg';
import { ConnectionSuccessfulScreenRouteProp } from '@navigation/types';
import { CameraStatus } from '@api/types/cameraTypes';
import {
  buildStreamHtmlUrl,
  buildStreamHtmlUrlForAndroid,
  buildHlsStreamUrlFromWs,
  getInjectedStreamPlayerJS,
  buildIOSStreamInlineHtml,
} from '@utils/streamUtils';
import cameraService from '@/services/cameraService';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useLiveStream } from '@hooks/useLiveStream';
import { streamDebugLog } from '@utils/streamDebugLog';

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

  const [streamWsUrl, setStreamWsUrl] = useState('');
  const [streamHtmlUrl, setStreamHtmlUrl] = useState('');
  const [timeExp, setTimeExp] = useState<string | null>(null);
  const [fetchUrlError, setFetchUrlError] = useState(false);
  const [videoReloadKey, setVideoReloadKey] = useState(0);
  const [isCellularNetwork, setIsCellularNetwork] = useState(false);
  const nativeHlsStallAttemptsRef = useRef(0);
  const isLiveRef = useRef(false);
  const hasVideoDataRef = useRef(false);
  const androidVideoSurfaceRef = useRef<View>(null);
  const captureResolveRef = useRef<((base64: string) => void) | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const backgroundEnteredAtRef = useRef<number | null>(null);
  const prevStreamUrlRef = useRef<string>(streamWsUrl || streamHtmlUrl);
  const hasInitialStreamRef = useRef(false);

  const isAndroidNativeHls = Platform.OS === 'android';
  const reloadNativePlayer = useCallback(() => {
    setVideoReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    const sub = NetInfo.addEventListener((s) => setIsCellularNetwork(s.type === 'cellular'));
    NetInfo.fetch().then((s) => setIsCellularNetwork(s.type === 'cellular'));
    return () => sub();
  }, []);

  const {
    webViewRef,
    isLoading: isWebViewLoading,
    connectionStatus,
    playerLoadPhase,
    isReconnecting,
    retryCount,
    handleWebViewLoad,
    handleWebViewError: onWebViewError,
    handleWebViewHttpError: onWebViewHttpError,
    handleManualRetry,
    handleWebViewMessage,
    cleanup: cleanupLiveStream,
    markNativePlaybackConnected,
    markNativePlaybackFailed,
  } = useLiveStream({
    maxRetries: 5,
    heartbeatInterval: 10000,
    heartbeatTimeout: isCellularNetwork ? 60000 : 45000,
    initialGracePeriod: isCellularNetwork ? 14000 : 8000,
    initialLoadingMax: isCellularNetwork ? 70000 : 55000,
    ...(isAndroidNativeHls && {
      playbackSurface: 'native-hls' as const,
      onReloadNativePlayer: reloadNativePlayer,
    }),
  });

  const hlsUrl = useMemo(
    () => (streamWsUrl ? buildHlsStreamUrlFromWs(streamWsUrl) : ''),
    [streamWsUrl]
  );
  const useAndroidExoHls = isAndroidNativeHls && !!hlsUrl;

  useEffect(() => {
    nativeHlsStallAttemptsRef.current = 0;
  }, [hlsUrl]);

  useEffect(() => {
    if (!useAndroidExoHls || !hlsUrl) {
      return undefined;
    }
    if (connectionStatus !== 'connecting') {
      return undefined;
    }

    const stallMs = isCellularNetwork ? 75000 : 55000;
    const timer = setTimeout(() => {
      if (nativeHlsStallAttemptsRef.current >= 2) {
        streamDebugLog('nativeHlsStallGiveUp');
        markNativePlaybackFailed();
        return;
      }
      nativeHlsStallAttemptsRef.current += 1;
      streamDebugLog('nativeHlsStallReload', { attempt: nativeHlsStallAttemptsRef.current });
      reloadNativePlayer();
    }, stallMs);

    return () => clearTimeout(timer);
  }, [
    useAndroidExoHls,
    hlsUrl,
    connectionStatus,
    videoReloadKey,
    isCellularNetwork,
    reloadNativePlayer,
    markNativePlaybackFailed,
  ]);

  const webViewError = connectionStatus === 'failed';
  const isLive = connectionStatus === 'connected' && !!streamHtmlUrl && !isWebViewLoading;

  useEffect(() => {
    isLiveRef.current = isLive;
  }, [isLive]);

  const streamLoadingMessage = useMemo(() => {
    if (!streamHtmlUrl) {
      return t('bluetoothScreen.connecting');
    }
    if (playerLoadPhase === 'buffering') {
      return t('liveStream.bufferingStream');
    }
    if (playerLoadPhase === 'connecting') {
      return t('liveStream.startingPlayer');
    }
    return t('liveStream.loadingStream');
  }, [streamHtmlUrl, playerLoadPhase, t]);

  useEffect(() => {
    if (!isLive) {
      hasVideoDataRef.current = false;
    }
  }, [isLive]);

  const fetchLiveUrl = useCallback(async () => {
    if (!cameraData?.id) return;
    setFetchUrlError(false);
    streamDebugLog('fetchLiveUrlStart', { cameraId: cameraData.id });
    try {
      const res = await cameraService.getLiveStreamUrl(cameraData.id);
      if (res.success && res.data) {
        streamDebugLog('fetchLiveUrlOk', { hasTimeExp: !!res.data.time_exp });
        setTimeExp(res.data.time_exp);
        setStreamWsUrl(res.data.live_url);
        const newHtmlUrl =
          Platform.OS === 'android'
            ? buildStreamHtmlUrlForAndroid(res.data.live_url)
            : buildStreamHtmlUrl(res.data.live_url);
        setStreamHtmlUrl((prev) => (prev === newHtmlUrl ? prev : newHtmlUrl));
      }
    } catch (error) {
      console.warn('getLiveStreamUrl failed:', error);
      streamDebugLog('fetchLiveUrlError', { message: String(error) });
      setFetchUrlError(true);
    }
  }, [cameraData?.id]);

  useEffect(() => {
    if (!timeExp) return;
    const refreshMs = new Date(timeExp).getTime() - Date.now() - 2 * 60 * 1000;
    if (refreshMs > 0) {
      const timer = setTimeout(fetchLiveUrl, refreshMs);
      return () => clearTimeout(timer);
    }
  }, [timeExp, fetchLiveUrl]);

  useEffect(() => {
    fetchLiveUrl().catch(() => {});
  }, [fetchLiveUrl]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const prev = appStateRef.current;

      if (nextAppState === 'background') {
        backgroundEnteredAtRef.current = Date.now();
      }

      if (prev === 'background' && nextAppState === 'active') {
        const entered = backgroundEnteredAtRef.current;
        backgroundEnteredAtRef.current = null;
        const msInBackground = entered != null ? Date.now() - entered : Infinity;
        if (msInBackground >= 800) {
          fetchLiveUrl()
            .then(() => {
              if (useAndroidExoHls) {
                reloadNativePlayer();
              } else {
                webViewRef.current?.reload();
              }
            })
            .catch(() => {});
        }
      }

      appStateRef.current = nextAppState;
    });
    return () => {
      subscription.remove();
    };
  }, [fetchLiveUrl, webViewRef, useAndroidExoHls, reloadNativePlayer]);

  const forceVideoPlay = useCallback(() => {
    if (useAndroidExoHls) {
      return;
    }
    webViewRef.current?.injectJavaScript(`
      (function(){
        var v = document.querySelector('video');
        if (v && v.paused) v.play().catch(function(){});
        true;
      })();
    `);
  }, [webViewRef, useAndroidExoHls]);

  useFocusEffect(
    useCallback(() => {
      if (connectionStatus === 'connected' && streamWsUrl && !webViewError) {
        const timers = [200, 500, 1200, 2500].map((ms) => setTimeout(forceVideoPlay, ms));
        return () => timers.forEach((tm) => clearTimeout(tm));
      }
    }, [connectionStatus, streamWsUrl, webViewError, forceVideoPlay])
  );

  useEffect(() => {
    const currentUrl = streamWsUrl || streamHtmlUrl;
    if (!currentUrl) return;
    if (hasInitialStreamRef.current && prevStreamUrlRef.current !== currentUrl) {
      prevStreamUrlRef.current = currentUrl;
      if (useAndroidExoHls) {
        reloadNativePlayer();
      } else {
        webViewRef.current?.reload();
      }
    } else if (!hasInitialStreamRef.current) {
      hasInitialStreamRef.current = true;
      prevStreamUrlRef.current = currentUrl;
    }
  }, [streamWsUrl, streamHtmlUrl, webViewRef, useAndroidExoHls, reloadNativePlayer]);

  useEffect(() => {
    if (!isLive || !streamWsUrl) return;
    const timers = [500, 1500, 3000].map((ms) => setTimeout(forceVideoPlay, ms));
    return () => timers.forEach((tm) => clearTimeout(tm));
  }, [isLive, streamWsUrl, forceVideoPlay]);

  useEffect(() => {
    if (!streamHtmlUrl) return;
    if (Platform.OS === 'android') return;

    hasVideoDataRef.current = false;

    const checkAndReload = () => {
      webViewRef.current?.injectJavaScript(`
        (function(){
          try {
            var hasData = false;
            var video = document.querySelector('video');
            var canvas = document.querySelector('canvas');
            if (video && video.readyState >= 2 && video.videoWidth > 0) {
              var c = document.createElement('canvas');
              c.width = 16; c.height = 16;
              var ctx = c.getContext('2d');
              ctx.drawImage(video, 0, 0, 16, 16);
              var d = ctx.getImageData(0, 0, 16, 16).data;
              for (var i = 0; i < d.length; i += 4) {
                if (d[i] > 5 || d[i+1] > 5 || d[i+2] > 5) { hasData = true; break; }
              }
            } else if (canvas && canvas.width > 0) {
              var ctx2 = canvas.getContext('2d');
              var d2 = ctx2.getImageData(0, 0, Math.min(canvas.width, 16), Math.min(canvas.height, 16)).data;
              for (var j = 0; j < d2.length; j += 4) {
                if (d2[j] > 5 || d2[j+1] > 5 || d2[j+2] > 5) { hasData = true; break; }
              }
            }
            window.ReactNativeWebView.postMessage(JSON.stringify({type:'videoDataCheck', hasData: hasData}));
          } catch(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({type:'videoDataCheck', hasData: false}));
          }
        })();
        true;
      `);
    };

    let intervalId: ReturnType<typeof setInterval> | null = null;
    const graceTimer = setTimeout(() => {
      if (!hasVideoDataRef.current) checkAndReload();
      intervalId = setInterval(() => {
        if (!hasVideoDataRef.current) {
          checkAndReload();
        }
      }, 3000);
    }, 28000);

    return () => {
      clearTimeout(graceTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [streamHtmlUrl, webViewRef]);

  const INJECTED_JS = useMemo(
    () => (Platform.OS === 'android' ? '' : getInjectedStreamPlayerJS('ios')),
    []
  );

  const inlineStreamSource = useMemo(() => {
    if (!streamWsUrl || Platform.OS === 'android') return null;
    const result = buildIOSStreamInlineHtml(streamWsUrl);
    return result.html ? result : null;
  }, [streamWsUrl]);

  const captureFrameFromWebView = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      if (useAndroidExoHls) {
        const timeout = setTimeout(() => resolve(null), 5000);
        const finish = (data: string | null) => {
          clearTimeout(timeout);
          resolve(data);
        };
        const tryCapture = () => {
          if (!androidVideoSurfaceRef.current) {
            finish(null);
            return;
          }
          captureRef(androidVideoSurfaceRef, {
            format: 'jpg',
            quality: 0.85,
            result: 'data-uri',
            handleGLSurfaceViewOnAndroid: true,
          })
            .then((dataUri) => {
              if (dataUri && dataUri.length > 200) {
                return dataUri;
              }
              return captureScreen({ format: 'jpg', quality: 0.85, result: 'data-uri' });
            })
            .then((uri) => finish(uri && uri.length > 80 ? uri : null))
            .catch(() => finish(null));
        };
        requestAnimationFrame(() => tryCapture());
        return;
      }
      if (!webViewRef.current) {
        resolve(null);
        return;
      }

      const timeout = setTimeout(() => {
        resolve(null);
      }, 3000);

      captureResolveRef.current = (base64: string) => {
        clearTimeout(timeout);
        captureResolveRef.current = null;
        resolve(base64);
      };

      webViewRef.current.injectJavaScript(`
        (function(){
          try {
            var video = document.querySelector('video');
            var canvas = document.querySelector('canvas');
            var c = document.createElement('canvas');
            var ctx = c.getContext('2d');
            if (video && video.readyState >= 2 && video.videoWidth > 0) {
              c.width = video.videoWidth;
              c.height = video.videoHeight;
              ctx.drawImage(video, 0, 0, c.width, c.height);
            } else if (canvas && canvas.width > 0) {
              c.width = canvas.width;
              c.height = canvas.height;
              ctx.drawImage(canvas, 0, 0, c.width, c.height);
            } else {
              window.ReactNativeWebView.postMessage(JSON.stringify({type:'frameCaptured', data:''}));
              return;
            }
            var dataUrl = c.toDataURL('image/jpeg', 0.8);
            window.ReactNativeWebView.postMessage(JSON.stringify({type:'frameCaptured', data: dataUrl}));
          } catch(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({type:'frameCaptured', data:''}));
          }
        })();
        true;
      `);
    });
  }, [webViewRef, useAndroidExoHls]);

  const persistLastFrameOnLeave = useCallback(async () => {
    if (!cameraData?.id) return;
    try {
      const base64Data = await captureFrameFromWebView();

      if (base64Data) {
        const dir = `${RNFS.DocumentDirectoryPath}/camera_snapshots`;
        const dirExists = await RNFS.exists(dir);
        if (!dirExists) {
          await RNFS.mkdir(dir);
        }

        const destPath = `${dir}/camera_${cameraData.id}_last_frame.jpg`;
        if (await RNFS.exists(destPath)) {
          await RNFS.unlink(destPath);
        }

        const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');
        await RNFS.writeFile(destPath, base64String, 'base64');

        await AsyncStorage.setItem(`camera_last_frame_${cameraData.id}`, destPath);
      }
    } catch (err) {
      console.warn('Failed to capture last frame on leave:', err);
    }
  }, [cameraData?.id, captureFrameFromWebView]);

  const shutdownStreamOnBlur = useCallback(async () => {
    try {
      await persistLastFrameOnLeave();
    } finally {
      if (!useAndroidExoHls) {
        try {
          webViewRef.current?.injectJavaScript(`
            (function(){
              try {
                document.querySelectorAll('video').forEach(function(v){
                  v.pause();
                  v.removeAttribute('src');
                  if (v.load) v.load();
                });
              } catch(e) {}
              true;
            })();
          `);
        } catch {
          // noop
        }
      }
      cleanupLiveStream();
      setStreamWsUrl('');
      setStreamHtmlUrl('');
      setTimeExp(null);
      setFetchUrlError(false);
      hasInitialStreamRef.current = false;
      prevStreamUrlRef.current = '';
      setVideoReloadKey((k) => k + 1);
    }
  }, [persistLastFrameOnLeave, cleanupLiveStream, useAndroidExoHls, webViewRef]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        shutdownStreamOnBlur().catch(() => {});
      };
    }, [shutdownStreamOnBlur])
  );

  const handleReconnect = async () => {
    await fetchLiveUrl();
    handleManualRetry();
  };

  const showErrorOverlay = (webViewError && !isWebViewLoading) || fetchUrlError;

  const getStatus = (status?: string | CameraStatus): 'online' | 'offline' => {
    if (!status) return 'online';
    if (typeof status === 'string') {
      return status.toLowerCase() === 'offline' ? 'offline' : 'online';
    }
    return status.name_trans?.toLowerCase().includes('offline') ? 'offline' : 'online';
  };

  const cameraInfo: CameraInfo = {
    id: cameraData?.id ?? '',
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

  const cameraId = cameraData?.id ?? 'camera';

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
            useAndroidExoHls ? (
              <View style={styles.videoPlayerRoot}>
                <View
                  ref={androidVideoSurfaceRef}
                  style={styles.videoNativeSurface}
                  collapsable={false}
                  pointerEvents="box-none"
                >
                  <Video
                    key={`exo-${cameraId}-${videoReloadKey}`}
                    source={{ uri: hlsUrl, type: 'm3u8' }}
                    style={StyleSheet.absoluteFill}
                    resizeMode="cover"
                    paused={false}
                    muted
                    controls={false}
                    useTextureView
                    ignoreSilentSwitch="ignore"
                    playInBackground={false}
                    allowsExternalPlayback={false}
                    onLoadStart={() => streamDebugLog('nativeHlsLoadStart')}
                    onLoad={() => markNativePlaybackConnected()}
                    onBuffer={({ isBuffering }) => {
                      if (isBuffering) {
                        streamDebugLog('nativeHlsBuffering');
                      }
                    }}
                    onError={(e) => {
                      console.warn('[ConnectionSuccessful] ExoPlayer HLS error', e);
                      streamDebugLog('nativeHlsOnError');
                      markNativePlaybackFailed();
                    }}
                  />
                </View>
              </View>
            ) : (
              <WebView
                key={`stream-${cameraId}`}
                ref={webViewRef}
                source={
                  inlineStreamSource
                    ? { html: inlineStreamSource.html, baseUrl: inlineStreamSource.baseUrl }
                    : { uri: streamHtmlUrl }
                }
                style={styles.webView}
                containerStyle={styles.webViewContainer}
                javaScriptEnabled
                domStorageEnabled
                cacheEnabled={false}
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
                {...(Platform.OS === 'android' && {
                  androidLayerType: 'hardware',
                })}
                {...(Platform.OS === 'ios' && {
                  allowsAirPlayForMediaPlayback: false,
                  dataDetectorTypes: 'none',
                  decelerationRate: 'normal',
                  useWebKit: true,
                })}
                onContentProcessDidTerminate={() => {
                  webViewRef.current?.reload();
                }}
                onLoad={handleWebViewLoad}
                onError={onWebViewError}
                onHttpError={onWebViewHttpError}
                onMessage={(event) => {
                  try {
                    const data = JSON.parse(event.nativeEvent.data);
                    if (data.type === 'frameCaptured' && captureResolveRef.current) {
                      captureResolveRef.current(data.data || '');
                      return;
                    }
                    if (data.type === 'needReload') {
                      webViewRef.current?.reload();
                      return;
                    }
                    if (data.type === 'videoDataCheck') {
                      hasVideoDataRef.current = data.hasData;
                      if (!data.hasData && isLiveRef.current) {
                        streamDebugLog('videoDataCheckBlackReload');
                        fetchLiveUrl()
                          .then(() => handleManualRetry())
                          .catch(() => {});
                      }
                      return;
                    }
                  } catch {
                    // ignore
                  }
                  handleWebViewMessage(event);
                }}
              />
            )
          ) : (
            <View style={[styles.webView, styles.loadingOverlay]}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>{streamLoadingMessage}</Text>
            </View>
          )}

          <View style={styles.streamOverlayContainer} pointerEvents="box-none">
            {!isLive && !fetchUrlError && (
              <View style={styles.loadingIndicatorInOverlay} pointerEvents="none">
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.loadingText}>{streamLoadingMessage}</Text>
              </View>
            )}
            {isReconnecting && !showErrorOverlay && !fetchUrlError && (
              <View style={styles.loadingIndicatorInOverlay} pointerEvents="none">
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.loadingText}>
                  {`${t('liveStream.reconnecting') || 'Reconnecting...'} (${retryCount})`}
                </Text>
              </View>
            )}
            {showErrorOverlay ? (
              <View style={styles.errorInOverlay} pointerEvents="box-none">
                <Text style={styles.errorText}>
                  {t('networkSetup.connectionFailed') || 'Connection failed'}
                </Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    if (fetchUrlError) {
                      fetchLiveUrl().catch(() => {});
                    } else {
                      handleReconnect().catch(() => {});
                    }
                  }}
                >
                  <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
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
