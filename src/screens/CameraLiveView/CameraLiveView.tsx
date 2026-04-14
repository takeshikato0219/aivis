import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  Alert,
  Modal,
  FlatList,
  StatusBar,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
  TouchableWithoutFeedback,
  Platform,
  AppState,
  AppStateStatus,
  Image,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { check, request, RESULTS, PERMISSIONS } from 'react-native-permissions';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraLiveScreenNavigationProp, CameraLiveScreenRouteProp } from '@navigation/types';
import cameraService from '@/services/cameraService';
import recordingService from '../../services/recordingService';
import { getStyles } from './CameraLiveView.styles';
import { SafeAreaView } from 'react-native-safe-area-context';
import LogoDetail from '@assets/svg/logo-detail.svg';
import { useTranslation } from 'react-i18next';
import Video from 'react-native-video';
import { captureRef, captureScreen } from 'react-native-view-shot';
import { WebView } from 'react-native-webview';
import {
  buildIOSStreamInlineHtml,
  buildStreamHtmlUrl,
  buildStreamHtmlUrlForAndroid,
  buildHlsStreamUrlFromWs,
  getStreamOriginBaseUrl,
  getInjectedStreamPlayerJS,
} from '@utils/streamUtils';
import { StreamQuality } from '@api/types/cameraTypes';
import { useLiveStream } from '@hooks/useLiveStream';
import { useMic } from '@hooks/useMic';
import { MicState } from '@redux/slices/streamSlice';
import { checkMicPermission, requestMicPermission, openAppSettings } from '@utils/permissions';

const STREAM_QUALITIES: StreamQuality[] = [
  { label: '流畅', value: 'low', resolution: '640x480', bitrate: 256 },
  { label: '标清', value: 'medium', resolution: '1280x720', bitrate: 512 },
  { label: '高清', value: 'high', resolution: '1920x1080', bitrate: 1024 },
  { label: 'HD', value: 'hd', resolution: '2560x1440', bitrate: 2048 },
];

const CameraLiveView: React.FC = () => {
  const navigation = useNavigation<CameraLiveScreenNavigationProp>();
  const route = useRoute<CameraLiveScreenRouteProp>();
  const videoContainerRef = useRef<View>(null);
  /** Android ExoPlayer surface — view-shot captures this wrapper (TextureView). */
  const androidVideoSurfaceRef = useRef<View>(null);
  const captureResolveRef = useRef<((base64: string) => void) | null>(null);
  const hasInitialStreamRef = useRef(false);
  const prevStreamUrlRef = useRef<string>('');
  const { cameraId } = route.params;
  const { t } = useTranslation();

  const { width, height } = useWindowDimensions();
  const styles = getStyles(width, height);

  // Animation refs
  const slideAnim = useRef(new Animated.Value(height)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // States
  const [isRecording, setIsRecording] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamWsUrl, setStreamWsUrl] = useState<string>('');
  const [isMuted, setIsMuted] = useState(true);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);
  const [currentQuality, setCurrentQuality] = useState<StreamQuality>(STREAM_QUALITIES[2]);
  const [expMinutes, setExpMinutes] = useState<number | null>(null);
  const [streamHtmlUrl, setStreamHtmlUrl] = useState('');
  const [micUrl, setMicUrl] = useState('');
  const [isTalkingDelayed, setIsTalkingDelayed] = useState(false);
  const [isMicProcessing, setIsMicProcessing] = useState(false);
  const [lastFrameBase64, setLastFrameBase64] = useState<string | null>(null);
  const [videoReloadKey, setVideoReloadKey] = useState(0);

  const isAndroidNativeHls = Platform.OS === 'android';
  const reloadNativePlayer = useCallback(() => {
    setVideoReloadKey((k) => k + 1);
  }, []);

  // useLiveStream hook — auto-retry, heartbeat, NetInfo monitoring
  const {
    webViewRef,
    isLoading: isWebViewLoading,
    connectionStatus,
    isReconnecting,
    retryCount,
    handleWebViewLoad,
    handleWebViewError: onWebViewError,
    handleWebViewHttpError: onWebViewHttpError,
    handleManualRetry,
    handleWebViewMessage,
    markNativePlaybackConnected,
    markNativePlaybackFailed,
  } = useLiveStream({
    maxRetries: 5,
    heartbeatTimeout: 30000,
    ...(isAndroidNativeHls && {
      playbackSurface: 'native-hls' as const,
      onReloadNativePlayer: reloadNativePlayer,
    }),
  });

  const hlsUrl = useMemo(
    () => (streamWsUrl ? buildHlsStreamUrlFromWs(streamWsUrl) : ''),
    [streamWsUrl]
  );
  const micWebViewBaseUrl = useMemo(
    () => (streamWsUrl ? getStreamOriginBaseUrl(streamWsUrl) : ''),
    [streamWsUrl]
  );
  const useAndroidExoHls = isAndroidNativeHls && !!hlsUrl;

  const { micState, toggleMic, stopMic, handleMicMessage } = useMic({
    micUrl: micUrl,
    streamWsUrl: streamWsUrl,
    webViewRef: webViewRef,
  });

  const isTalking = micState === MicState.STREAMING || micState === MicState.CONNECTING;

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isTalking) {
      timer = setTimeout(() => setIsTalkingDelayed(true), 1000);
    } else {
      setIsTalkingDelayed(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isTalking]);

  // Derive error state from hook
  const webViewError = connectionStatus === 'failed';

  // Derive live status: only "connected" means truly live
  const isLive = connectionStatus === 'connected' && !!streamHtmlUrl && !isWebViewLoading;

  useEffect(() => {
    if (!isLive && isTalking) {
      stopMic();
    }
  }, [isLive, isTalking, stopMic]);

  // Animation effect for quality modal
  useEffect(() => {
    if (isAnimating) {
      // Slide up and fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (showQualityModal) {
      // Slide down and fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowQualityModal(false);
      });
    }
  }, [isAnimating, showQualityModal, slideAnim, opacityAnim, height]);

  const [fetchUrlError, setFetchUrlError] = useState(false);
  const fetchLiveUrl = useCallback(async () => {
    setFetchUrlError(false);
    try {
      const res = await cameraService.getLiveStreamUrl(cameraId);
      if (res.success && res.data) {
        setExpMinutes(res.data.exp_minutes ?? null);
        setStreamWsUrl(res.data.live_url);
        setMicUrl(res.data.mic || '');
        const newHtmlUrl =
          Platform.OS === 'android'
            ? buildStreamHtmlUrlForAndroid(res.data.live_url)
            : buildStreamHtmlUrl(res.data.live_url);
        setStreamHtmlUrl((prev) => (prev === newHtmlUrl ? prev : newHtmlUrl));
      }
    } catch (e) {
      console.warn('getLiveStreamUrl failed:', e);
      setFetchUrlError(true);
    }
  }, [cameraId]);

  useEffect(() => {
    fetchLiveUrl();
  }, [fetchLiveUrl]);

  useEffect(() => {
    if (!expMinutes || expMinutes <= 2) return;
    const refreshMs = (expMinutes - 2) * 60 * 1000;
    const timer = setTimeout(fetchLiveUrl, refreshMs);
    return () => clearTimeout(timer);
  }, [expMinutes, fetchLiveUrl]);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const backgroundEnteredAtRef = useRef<number | null>(null);
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
          fetchLiveUrl().then(() => {
            if (useAndroidExoHls) {
              reloadNativePlayer();
            } else {
              webViewRef.current?.reload();
            }
          });
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
        // eslint-disable-next-line @typescript-eslint/no-shadow
        return () => timers.forEach((t) => clearTimeout(t));
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
    // eslint-disable-next-line @typescript-eslint/no-shadow
    return () => timers.forEach((t) => clearTimeout(t));
  }, [isLive, streamWsUrl, forceVideoPlay]);

  // Auto-reload every 3s if stream has no actual video data (black screen)
  const hasVideoDataRef = useRef(false);
  useEffect(() => {
    if (!streamHtmlUrl) return;
    // Android hosted player: pixel checks are unreliable (WebGL/cross-origin); avoid reload thrash.
    if (Platform.OS === 'android') return;

    // Reset when stream URL changes
    hasVideoDataRef.current = false;

    const checkAndReload = () => {
      // Inject JS to sample pixels from video/canvas
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
    }, 10000);

    return () => {
      clearTimeout(graceTimer);
      if (intervalId) clearInterval(intervalId);
    };
  }, [streamHtmlUrl, webViewRef]);

  const streamPlayerInjectedJs = useMemo(
    () => (Platform.OS === 'android' ? '' : getInjectedStreamPlayerJS('ios')),
    []
  );

  const inlineStreamSource = useMemo(() => {
    if (!streamWsUrl || Platform.OS === 'android') return null;
    const result = buildIOSStreamInlineHtml(streamWsUrl);
    return result.html ? result : null;
  }, [streamWsUrl]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (!useAndroidExoHls) {
        webViewRef.current?.injectJavaScript(`
      (function(){
        var muted = ${next};
        document.querySelectorAll('video').forEach(function(v){ v.muted = muted; });
        true;
      })();
    `);
      }
      return next;
    });
  }, [webViewRef, useAndroidExoHls]);

  const requestFullscreen = () => {
    setIsFullscreen(true);
  };

  const exitFullscreen = () => {
    setIsFullscreen(false);
  };

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

  useEffect(() => {
    if (!isLive || !streamHtmlUrl) return;
    const interval = setInterval(async () => {
      const frame = await captureFrameFromWebView();
      if (frame) setLastFrameBase64(frame);
    }, 5000);
    return () => clearInterval(interval);
  }, [isLive, streamHtmlUrl, captureFrameFromWebView]);

  useEffect(() => {
    if (!isLive && lastFrameBase64 === null) {
      captureFrameFromWebView().then((frame) => frame && setLastFrameBase64(frame));
    }
  }, [isLive, lastFrameBase64, captureFrameFromWebView]);

  useEffect(() => {
    if (isLive && lastFrameBase64 !== null) setLastFrameBase64(null);
  }, [isLive, lastFrameBase64]);

  const takeSnapshot = useCallback(async () => {
    try {
      const base64Data = await captureFrameFromWebView();

      if (!base64Data) {
        Alert.alert(t('common.error'), t('cameraLive.failedToCaptureSnapshot'));
        return;
      }

      const tmpPath = `${RNFS.CachesDirectoryPath}/snapshot_${Date.now()}.jpg`;
      const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');
      await RNFS.writeFile(tmpPath, base64String, 'base64');

      let permissionStatus;
      if (Platform.OS === 'ios') {
        permissionStatus = await check(PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY);
        if (permissionStatus !== RESULTS.GRANTED) {
          permissionStatus = await request(PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY);
        }
      } else {
        const androidVersion =
          typeof Platform.Version === 'number'
            ? Platform.Version
            : parseInt(String(Platform.Version), 10);
        const permission =
          androidVersion >= 33
            ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
            : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;

        permissionStatus = await check(permission);
        if (permissionStatus !== RESULTS.GRANTED) {
          permissionStatus = await request(permission);
        }
      }

      if (permissionStatus !== RESULTS.GRANTED) {
        Alert.alert(
          t('common.error'),
          Platform.OS === 'ios'
            ? t('cameraLive.photoLibraryPermissionIsRequiredToSaveScreenshots')
            : t('cameraLive.storagePermissionIsRequiredToSaveScreenshots')
        );
        await RNFS.unlink(tmpPath).catch(() => {});
        return;
      }

      await CameraRoll.saveToCameraRoll(`file://${tmpPath}`, 'photo');
      await RNFS.unlink(tmpPath).catch(() => {});
      Alert.alert(t('cameraLive.success'), t('cameraLive.screenshotSaved'));
    } catch (err) {
      console.error('Error taking snapshot:', err);
      Alert.alert(t('common.error'), t('cameraLive.unableToTakeScreenshot'));
    }
  }, [t, captureFrameFromWebView]);

  const toggleTalk = useCallback(async () => {
    if (isMicProcessing || !isLive) return;
    setIsMicProcessing(true);
    try {
      const micPermission = await checkMicPermission();
      if (micPermission === 'granted') {
        await toggleMic();
      } else if (micPermission === 'denied') {
        const reqStatus = await requestMicPermission();
        if (reqStatus === 'granted') {
          await toggleMic();
        } else if (reqStatus === 'blocked') {
          Alert.alert(t('common.error'), t('cameraLive.micPermissionBlocked'), [
            {
              text: t('bluetoothScreen.openSettings'),
              onPress: openAppSettings,
            },
            { text: t('common.cancel'), style: 'cancel' },
          ]);
        }
      } else if (micPermission === 'blocked') {
        Alert.alert(t('common.error'), t('cameraLive.micPermissionBlocked'), [
          {
            text: t('bluetoothScreen.openSettings'),
            onPress: openAppSettings,
          },
          { text: t('common.cancel'), style: 'cancel' },
        ]);
      } else {
        Alert.alert(t('common.error'), t('cameraLive.micPermissionUnavailable'));
      }
    } finally {
      setIsMicProcessing(false);
    }
  }, [toggleMic, t, isMicProcessing, isLive]);

  const closeQualityModal = () => {
    setIsAnimating(false);
  };

  const changeQuality = async (quality: StreamQuality) => {
    try {
      setIsRecording(true);
      closeQualityModal();

      setCurrentQuality(quality);

      setIsRecording(false);
    } catch (err) {
      console.error('Error changing quality:', err);
      Alert.alert(t('common.error'), t('common.unableToChangeResolution'));
      setIsRecording(false);
    }
  };

  const toggleRecording = useCallback(async () => {
    if (!isRecording) {
      try {
        await recordingService.startRecording();
        setIsRecording(true);
        setRecordingStartTime(new Date());
        Alert.alert(t('cameraLive.recording'), t('cameraLive.recordingStarted'));
      } catch (err) {
        console.error('Error starting recording:', err);
        Alert.alert(
          t('common.error'),
          t('cameraLive.unableToStartRecording') || 'Unable to start recording'
        );
      }
    } else {
      // Stop recording and save video
      try {
        const startTime = recordingStartTime;

        // Stop the screen recording and get the file path
        const videoFilePath = await recordingService.stopRecording();
        setIsRecording(false);
        setRecordingStartTime(null);

        // Request photo library permission for saving video
        let permissionStatus;
        if (Platform.OS === 'ios') {
          // iOS: Use PHOTO_LIBRARY_ADD_ONLY for iOS 11+ (only write access)
          permissionStatus = await check(PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY);
          if (permissionStatus !== RESULTS.GRANTED) {
            permissionStatus = await request(PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY);
          }
        } else {
          // Android: Use appropriate permission based on Android version
          const androidVersion =
            typeof Platform.Version === 'number'
              ? Platform.Version
              : parseInt(String(Platform.Version), 10);
          const permission =
            androidVersion >= 33
              ? PERMISSIONS.ANDROID.READ_MEDIA_VIDEO
              : PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;

          permissionStatus = await check(permission);
          if (permissionStatus !== RESULTS.GRANTED) {
            permissionStatus = await request(permission);
          }
        }

        if (permissionStatus !== RESULTS.GRANTED) {
          Alert.alert(
            t('common.error'),
            Platform.OS === 'ios'
              ? t('cameraLive.photoLibraryPermissionIsRequiredToSaveVideos')
              : t('cameraLive.storagePermissionIsRequiredToSaveVideos')
          );
          return;
        }

        // Save the recorded video to gallery
        await recordingService.saveToGallery(videoFilePath);

        // Clean up temporary files
        await recordingService.cleanSandbox();

        const duration = startTime
          ? Math.round((new Date().getTime() - startTime.getTime()) / 1000)
          : recordingService.getRecordingDuration();
        Alert.alert(t('cameraLive.success'), `${t('cameraLive.videoSaved')} (${duration}s)`);
      } catch (err) {
        console.error('Error saving video:', err);
        Alert.alert(t('common.error'), t('cameraLive.unableToSaveVideo'));
        setIsRecording(false);
        setRecordingStartTime(null);

        // Clean up any temporary files
        try {
          await recordingService.cleanSandbox();
        } catch (cleanError) {
          console.error('Error cleaning sandbox:', cleanError);
        }
      }
    }
  }, [isRecording, recordingStartTime, t]);

  const handleClose = async () => {
    // Stop mic if active before closing
    stopMic();

    try {
      const base64Data = await captureFrameFromWebView();

      if (base64Data) {
        const dir = `${RNFS.DocumentDirectoryPath}/camera_snapshots`;
        const dirExists = await RNFS.exists(dir);
        if (!dirExists) {
          await RNFS.mkdir(dir);
        }

        const destPath = `${dir}/camera_${cameraId}_last_frame.jpg`;
        if (await RNFS.exists(destPath)) {
          await RNFS.unlink(destPath);
        }

        // Remove the data URL prefix (e.g. "data:image/jpeg;base64,")
        const base64String = base64Data.replace(/^data:image\/\w+;base64,/, '');
        await RNFS.writeFile(destPath, base64String, 'base64');

        await AsyncStorage.setItem(`camera_last_frame_${cameraId}`, destPath);
      }
    } catch (err) {
      console.warn('Failed to capture last frame on close:', err);
    }
    navigation.goBack();
  };

  const handleReconnect = async () => {
    await fetchLiveUrl();
    handleManualRetry();
  };

  // Determine if error overlay should show.
  const showErrorOverlay = (webViewError && !isWebViewLoading) || fetchUrlError;

  const renderVideoPlayer = () => {
    return (
      <View style={styles.videoPlayerRoot}>
        {streamHtmlUrl ? (
          <>
            {useAndroidExoHls ? (
              <>
                <View
                  ref={androidVideoSurfaceRef}
                  style={styles.videoNativeSurface}
                  collapsable={false}
                  pointerEvents="box-none"
                >
                  <Video
                    key={`exo-${cameraId}-${videoReloadKey}`}
                    source={{ uri: hlsUrl, type: 'm3u8' }}
                    style={StyleSheet.absoluteFillObject}
                    resizeMode="cover"
                    paused={false}
                    muted={isMuted}
                    controls={false}
                    useTextureView
                    ignoreSilentSwitch="ignore"
                    playInBackground={false}
                    allowsExternalPlayback={false}
                    onLoad={() => markNativePlaybackConnected()}
                    onError={(e) => {
                      console.warn('[CameraLive] ExoPlayer HLS error', e);
                      markNativePlaybackFailed();
                    }}
                  />
                </View>
                <WebView
                  key={`mic-wv-${cameraId}`}
                  ref={webViewRef}
                  source={{
                    html: '<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body></body></html>',
                    baseUrl: micWebViewBaseUrl,
                  }}
                  style={styles.micWebViewHidden}
                  javaScriptEnabled
                  domStorageEnabled
                  mediaPlaybackRequiresUserAction={false}
                  allowsInlineMediaPlayback
                  mediaCapturePermissionGrantType="grant"
                  originWhitelist={['*']}
                  mixedContentMode="always"
                  setSupportMultipleWindows={false}
                  setBuiltInZoomControls={false}
                  overScrollMode="never"
                  userAgent="Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
                  thirdPartyCookiesEnabled
                  androidLayerType="none"
                  onMessage={(event) => {
                    try {
                      const data = JSON.parse(event.nativeEvent.data);
                      if (data.type === '__mic_state') {
                        handleMicMessage(data);
                      }
                    } catch {
                      /* ignore */
                    }
                  }}
                />
              </>
            ) : (
              <WebView
                key={`stream-${cameraId}`}
                ref={webViewRef}
                source={
                  inlineStreamSource
                    ? { html: inlineStreamSource.html, baseUrl: inlineStreamSource.baseUrl }
                    : { uri: streamHtmlUrl }
                }
                style={styles.videoContainer}
                javaScriptEnabled
                domStorageEnabled
                cacheEnabled={false}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback
                allowsFullscreenVideo={false}
                scrollEnabled={false}
                bounces={false}
                overScrollMode="never"
                injectedJavaScript={streamPlayerInjectedJs}
                allowsBackForwardNavigationGestures={false}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                startInLoadingState={false}
                originWhitelist={['*']}
                mixedContentMode="always"
                setBuiltInZoomControls={false}
                setSupportMultipleWindows={false}
                mediaCapturePermissionGrantType="grant"
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
                    if (data.type === '__mic_state') {
                      handleMicMessage(data);
                      return;
                    }
                    if (data.type === 'needReload') {
                      webViewRef.current?.reload();
                      return;
                    }
                    if (data.type === 'videoDataCheck') {
                      hasVideoDataRef.current = data.hasData;
                      if (!data.hasData) {
                        console.log('Black screen detected, auto-reloading stream...');
                        fetchLiveUrl().then(() => handleManualRetry());
                      }
                      return;
                    }
                  } catch {
                    // ignore parse errors
                  }
                  handleWebViewMessage(event);
                }}
              />
            )}
            {/* Show last frame when stream is not live */}
            {!isLive && lastFrameBase64 && (
              <View
                style={[
                  styles.videoContainer,
                  // eslint-disable-next-line react-native/no-inline-styles
                  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
                ]}
              >
                <Image
                  source={{ uri: lastFrameBase64 }}
                  style={styles.videoContainer}
                  resizeMode="cover"
                />
              </View>
            )}
          </>
        ) : null}

        {!isLive && !isReconnecting && !showErrorOverlay && !lastFrameBase64 && !fetchUrlError ? (
          <View style={[styles.videoContainer, styles.loadingOverlay]}>
            <ActivityIndicator size="small" color="#FFF" />
            <Text style={styles.loadingText}>
              {!streamHtmlUrl ? t('bluetoothScreen.connecting') : t('liveStream.loadingStream')}
            </Text>
          </View>
        ) : null}

        {!isLive && !isReconnecting && !showErrorOverlay && lastFrameBase64 && !fetchUrlError ? (
          <View style={styles.loadingIndicatorOverlay}>
            <ActivityIndicator size="small" color="#FFF" />
            <Text style={styles.loadingText}>
              {!streamHtmlUrl ? t('bluetoothScreen.connecting') : t('liveStream.loadingStream')}
            </Text>
          </View>
        ) : null}

        {isReconnecting && !showErrorOverlay && !lastFrameBase64 && !fetchUrlError ? (
          <View style={styles.reconnectingOverlay}>
            <ActivityIndicator size="small" color="#FFF" />
            <Text style={styles.loadingText}>
              {`${t('liveStream.reconnecting') || 'Reconnecting...'} (${retryCount})`}
            </Text>
          </View>
        ) : null}

        {isReconnecting && !showErrorOverlay && lastFrameBase64 && !fetchUrlError ? (
          <View style={styles.loadingIndicatorOverlay}>
            <ActivityIndicator size="small" color="#FFF" />
            <Text style={styles.loadingText}>
              {`${t('liveStream.reconnecting') || 'Reconnecting...'} (${retryCount})`}
            </Text>
          </View>
        ) : null}

        {showErrorOverlay && !lastFrameBase64 ? (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>
              {t('networkSetup.connectionFailed') || 'Connection failed'}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => (fetchUrlError ? fetchLiveUrl() : handleReconnect())}
            >
              <Text style={styles.retryButtonText}>{t('common.retry') || 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {showErrorOverlay && lastFrameBase64 ? (
          <View style={styles.loadingIndicatorOverlay}>
            <Text style={styles.errorText}>
              {t('networkSetup.connectionFailed') || 'Connection failed'}
            </Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => (fetchUrlError ? fetchLiveUrl() : handleReconnect())}
            >
              <Text style={styles.retryButtonText}>{t('common.retry') || 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {!isFullscreen && streamHtmlUrl && connectionStatus === 'connected' && !webViewError && (
          <TouchableOpacity style={styles.muteButton} onPress={toggleMute} activeOpacity={0.75}>
            <Icon name={isMuted ? 'volume-off' : 'volume-high'} size={22} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderQualityModal = () => {
    if (!showQualityModal) {
      return null;
    }

    return (
      <View style={styles.qualityModalOverlay}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={closeQualityModal}>
          <Animated.View
            style={[
              styles.qualityModalBackdrop,
              {
                opacity: opacityAnim,
              },
            ]}
          />
        </TouchableWithoutFeedback>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('cameraLive.selectResolution')}</Text>
            <TouchableOpacity onPress={closeQualityModal}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={STREAM_QUALITIES}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.qualityItem,
                  currentQuality.value === item.value && styles.qualityItemActive,
                ]}
                onPress={() => changeQuality(item)}
              >
                <View style={styles.qualityInfo}>
                  <Text
                    style={[
                      styles.qualityText,
                      currentQuality.value === item.value && styles.qualityTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  <Text style={styles.qualityResolution}>{item.resolution}</Text>
                </View>
                {currentQuality.value === item.value && (
                  <Icon name="check-circle" size={24} color="#4CAF50" />
                )}
              </TouchableOpacity>
            )}
          />
        </Animated.View>
      </View>
    );
  };

  // Render Fullscreen Mode with Landscape Simulation
  if (isFullscreen) {
    return (
      <Modal
        visible={isFullscreen}
        animationType="fade"
        onRequestClose={exitFullscreen}
        statusBarTranslucent
      >
        <View style={styles.fullscreenContainer}>
          <StatusBar hidden />
          {/* Rotated Container to simulate landscape */}
          <View style={styles.landscapeWrapper}>
            <View
              ref={videoContainerRef}
              style={styles.fullscreenVideoContainer}
              collapsable={false}
            >
              {renderVideoPlayer()}

              {/* Fullscreen Top Overlay */}
              <View style={styles.topOverlay}>
                <View style={styles.topLeft}>
                  <View style={[styles.liveIndicator, !isLive && styles.offlineIndicator]}>
                    <View style={[styles.liveRedDot, !isLive && styles.offlineDot]} />
                    <Text style={styles.liveText}>{isLive ? 'Live' : t('common.loading')}</Text>
                  </View>
                </View>

                <View style={styles.reconnectStyle}>
                  <TouchableOpacity
                    style={styles.controlButtonFullscreen}
                    onPress={handleReconnect}
                  >
                    <Icon name="reload" size={22} color="#FFF" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                    <Icon name="close" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Fullscreen Right Controls */}
              <View style={styles.fullscreenRightControls}>
                <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
                  <Icon name={isMuted ? 'volume-off' : 'volume-high'} size={22} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={takeSnapshot}>
                  <Icon name="camera" size={22} color="#FFF" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.controlButton} onPress={toggleRecording}>
                  <Icon
                    name={isRecording ? 'stop-circle' : 'record-circle'}
                    size={22}
                    color={isRecording ? '#EF4444' : '#FFF'}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.mainButton, !isLive && styles.mainButtonDisabled]}
                  onPress={toggleTalk}
                  disabled={isMicProcessing || !isLive}
                >
                  <View
                    style={[
                      styles.iconCircleFullScreen,
                      isTalkingDelayed && styles.iconCircleActive,
                    ]}
                  >
                    <View style={styles.micIconRow}>
                      {isTalking && !isTalkingDelayed ? (
                        <ActivityIndicator size="small" color="#44ef52" />
                      ) : (
                        <Icon name="microphone" size={22} color={isLive ? '#FFF' : '#666'} />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.controlButton, styles.exitFullscreenButton]}
                  onPress={exitFullscreen}
                >
                  <Icon name="fullscreen-exit" size={22} color="#FFF" />
                </TouchableOpacity>
              </View>

              {/* Watermark */}
              <View style={styles.watermark}>
                <LogoDetail />
              </View>
            </View>
          </View>
          {renderQualityModal()}
        </View>
      </Modal>
    );
  }

  // Normal portrait mode
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      <View style={styles.videoWrapper}>
        <View ref={videoContainerRef} style={styles.videoContainer} collapsable={false}>
          {renderVideoPlayer()}

          <View style={styles.topOverlay}>
            <View style={styles.topLeft}>
              <View style={[styles.liveIndicator, !isLive && styles.offlineIndicator]}>
                <View style={[styles.liveRedDot, !isLive && styles.offlineDot]} />
                <Text style={styles.liveText}>{isLive ? 'Live' : t('common.loading')}</Text>
              </View>
            </View>
            <View style={styles.hdStyle}>
              <TouchableOpacity style={styles.reloadButton} onPress={handleReconnect}>
                <Icon name="reload" size={22} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Icon name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.rightControls}>
            <TouchableOpacity style={styles.controlButton} onPress={requestFullscreen}>
              <Icon name="fullscreen" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.watermark}>
            <LogoDetail />
          </View>
        </View>
      </View>

      <View style={styles.infoSection} />

      <View style={styles.bottomControls}>
        <TouchableOpacity style={styles.mainButton} onPress={toggleRecording}>
          <View style={[styles.iconCircle, isRecording && styles.iconCircleActive]}>
            <Icon name="video" size={28} color="#FFF" />
          </View>
          <Text style={styles.mainButtonText}>{t('cameraLive.video')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainButton, !isLive && styles.mainButtonDisabled]}
          onPress={toggleTalk}
          disabled={isMicProcessing || !isLive}
        >
          <View style={[styles.iconCircle, isTalkingDelayed && styles.iconCircleActive]}>
            <View style={styles.micIconRow}>
              {isTalking && !isTalkingDelayed ? (
                <ActivityIndicator size="small" color="#44ef52" />
              ) : (
                <Icon name="microphone" size={28} color={isLive ? '#FFF' : '#666'} />
              )}
            </View>
          </View>
          <Text style={styles.mainButtonText}>{t('cameraLive.call')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.mainButton} onPress={takeSnapshot}>
          <View style={styles.iconCircle}>
            <Icon name="camera" size={28} color="#FFF" />
          </View>
          <Text style={styles.mainButtonText}>{t('cameraLive.call')}</Text>
        </TouchableOpacity>
      </View>

      {renderQualityModal()}
    </SafeAreaView>
  );
};

export default CameraLiveView;
