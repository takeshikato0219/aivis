import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  ActivityIndicator,
  Platform,
  AppState,
  AppStateStatus,
  Image,
  StyleSheet,
} from 'react-native';
import Video from 'react-native-video';
import { captureRef, captureScreen } from 'react-native-view-shot';
import Orientation from 'react-native-orientation-locker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { StackScreenProps } from '@react-navigation/stack';
import { AppStackParamList } from '@navigation/types';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './DetectionZoneSetup.styles';
import { useTranslation } from 'react-i18next';
import detectionZoneService from '../../services/detectionZone';
import Svg, { Line, Polygon } from 'react-native-svg';
import { showCommonAlert } from '@components/Alert/Alert';
import { WebView } from 'react-native-webview';
import {
  buildStreamHtmlUrl,
  buildStreamHtmlUrlForAndroid,
  buildHlsStreamUrlFromWs,
  getStreamOriginBaseUrl,
  getInjectedStreamPlayerJS,
  buildIOSStreamInlineHtml,
} from '@utils/streamUtils';
import cameraService from '@/services/cameraService';
import { useLiveStream } from '@hooks/useLiveStream';
import NetInfo from '@react-native-community/netinfo';
import { streamDebugLog } from '@utils/streamDebugLog';

const getScreenDims = () => {
  const { width, height } = Dimensions.get('window');
  return { SCREEN_WIDTH: Math.max(width, height), SCREEN_HEIGHT: Math.min(width, height) };
};

const { SCREEN_WIDTH, SCREEN_HEIGHT } = getScreenDims();

interface Corner {
  x: number;
  y: number;
}
interface DetectionZone {
  topLeft: Corner;
  topRight: Corner;
  bottomLeft: Corner;
  bottomRight: Corner;
}

const GRID_SIZE = 28;

type Props = StackScreenProps<AppStackParamList, 'DetectionZoneSetup'>;

const DetectionZoneSetup: React.FC<Props> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const camera = route.params.camera;
  const zoneType = route.params.zoneType || 'detection';
  const typeId = route.params.typeId || '';
  const offset = 80;

  const getInitialZone = useCallback(
    (layout: { x: number; y: number; width: number; height: number }): DetectionZone => {
      const cx = layout.x + layout.width / 2;
      const cy = layout.y + layout.height / 2;
      return {
        topLeft: { x: cx - offset, y: cy - offset },
        topRight: { x: cx + offset, y: cy - offset },
        bottomLeft: { x: cx - offset, y: cy + offset },
        bottomRight: { x: cx + offset, y: cy + offset },
      };
    },
    [offset]
  );

  const getInitialEntryExitPoints = useCallback(
    (layout: { x: number; y: number; width: number; height: number }) => [
      { x: layout.x + layout.width / 2, y: layout.y + 1 },
      { x: layout.x + layout.width / 2, y: layout.y + layout.height - 1 },
    ],
    []
  );

  const [zone, setZone] = useState<DetectionZone>(() =>
    getInitialZone({ x: 0, y: 0, width: SCREEN_WIDTH, height: SCREEN_HEIGHT })
  );
  const [existingZoneId, setExistingZoneId] = useState<string | null>(null);
  const [activeCorner, setActiveCorner] = useState<keyof DetectionZone | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [fetchUrlError, setFetchUrlError] = useState(false);
  const [entryExitPoints, setEntryExitPoints] = useState<{ x: number; y: number }[]>(() =>
    getInitialEntryExitPoints({ x: 0, y: 0, width: SCREEN_WIDTH, height: SCREEN_HEIGHT })
  );
  const [activeEntryExitPoint, setActiveEntryExitPoint] = useState<number | null>(null);
  const [isLeftIn, setIsLeftIn] = useState(true);
  const [streamWsUrl, setStreamWsUrl] = useState<string>(route.params.liveUrl || '');
  const [streamHtmlUrl, setStreamHtmlUrl] = useState(() =>
    Platform.OS === 'android'
      ? buildStreamHtmlUrlForAndroid(route.params.liveUrl)
      : buildStreamHtmlUrl(route.params.liveUrl)
  );
  const [timeExp, setTimeExp] = useState<string | null>(null);
  const [liveViewLayout, setLiveViewLayout] = useState({
    x: 0,
    y: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });
  const prevLayoutRef = useRef(liveViewLayout);
  const liveViewLayoutRef = useRef(liveViewLayout);
  liveViewLayoutRef.current = liveViewLayout;
  const hasInitialStreamRef = useRef(false);
  const [lastFrameBase64, setLastFrameBase64] = useState<string | null>(null);
  const captureResolveRef = useRef<((base64: string) => void) | null>(null);
  const hasVideoDataRef = useRef(false);
  const androidVideoSurfaceRef = useRef<View>(null);
  const [videoReloadKey, setVideoReloadKey] = useState(0);
  const [isCellularNetwork, setIsCellularNetwork] = useState(false);
  const nativeHlsStallAttemptsRef = useRef(0);
  const isLiveRef = useRef(false);

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

  const micWebViewBaseUrl = useMemo(
    () => (streamWsUrl ? getStreamOriginBaseUrl(streamWsUrl) : 'https://localhost'),
    [streamWsUrl]
  );

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

  // Reset hasVideoDataRef when connection is lost so auto-reload kicks in again
  useEffect(() => {
    if (!isLive) {
      hasVideoDataRef.current = false;
    }
  }, [isLive]);

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
      const timeout = setTimeout(() => resolve(null), 3000);
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

  const showErrorOverlay = (webViewError && !isWebViewLoading) || fetchUrlError;

  const fetchLiveUrl = useCallback(async () => {
    setFetchUrlError(false);
    streamDebugLog('fetchLiveUrlStart', { cameraId: camera.id });
    try {
      const res = await cameraService.getLiveStreamUrl(camera.id);
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
    } catch (e) {
      console.warn('getLiveStreamUrl failed:', e);
      streamDebugLog('fetchLiveUrlError', { message: String(e) });
      setFetchUrlError(true);
    }
  }, [camera.id]);

  useEffect(() => {
    if (!timeExp) return;
    const refreshMs = new Date(timeExp).getTime() - Date.now() - 2 * 60 * 1000;
    if (refreshMs > 0) {
      const timer = setTimeout(fetchLiveUrl, refreshMs);
      return () => clearTimeout(timer);
    }
  }, [timeExp, fetchLiveUrl]);

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

  // Reload WebView when stream URL changes (e.g. token refresh) - avoid remount with stable key
  const prevStreamUrlRef = useRef<string>(streamWsUrl || streamHtmlUrl);
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

  // Auto-reload every 3s if stream has no actual video data (black screen) or connection lost
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

  useEffect(() => {
    fetchLiveUrl();
    getZoneDetect();
    Orientation.lockToLandscapeLeft();
    return () => {
      Orientation.lockToPortrait();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchLiveUrl]);

  //Capture frames periodically during live-streaming - save the last frame before interruption.
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

  // Remove the last frame when resuming a live stream.
  useEffect(() => {
    if (isLive && lastFrameBase64 !== null) setLastFrameBase64(null);
  }, [isLive, lastFrameBase64]);

  const clamp = useCallback(
    (v: number, min: number, max: number) => Math.max(min, Math.min(max, v)),
    []
  );

  // Scale zone and entryExitPoints when liveViewLayout changes (e.g. from onLayout with actual dimensions)
  useEffect(() => {
    const prev = prevLayoutRef.current;
    const next = liveViewLayout;
    if (prev.width <= 0 || prev.height <= 0 || next.width <= 0 || next.height <= 0) return;
    if (
      prev.x === next.x &&
      prev.y === next.y &&
      prev.width === next.width &&
      prev.height === next.height
    )
      return;

    const scaleX = (px: number) => ((px - prev.x) / prev.width) * next.width + next.x;
    const scaleY = (py: number) => ((py - prev.y) / prev.height) * next.height + next.y;
    const clampToNext = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

    setZone((z) => {
      const scaled = {
        topLeft: { x: scaleX(z.topLeft.x), y: scaleY(z.topLeft.y) },
        topRight: { x: scaleX(z.topRight.x), y: scaleY(z.topRight.y) },
        bottomLeft: { x: scaleX(z.bottomLeft.x), y: scaleY(z.bottomLeft.y) },
        bottomRight: { x: scaleX(z.bottomRight.x), y: scaleY(z.bottomRight.y) },
      };
      const { x: lx, y: ly, width: lw, height: lh } = next;
      return {
        topLeft: {
          x: clampToNext(scaled.topLeft.x, lx, lx + lw),
          y: clampToNext(scaled.topLeft.y, ly, ly + lh),
        },
        topRight: {
          x: clampToNext(scaled.topRight.x, lx, lx + lw),
          y: clampToNext(scaled.topRight.y, ly, ly + lh),
        },
        bottomLeft: {
          x: clampToNext(scaled.bottomLeft.x, lx, lx + lw),
          y: clampToNext(scaled.bottomLeft.y, ly, ly + lh),
        },
        bottomRight: {
          x: clampToNext(scaled.bottomRight.x, lx, lx + lw),
          y: clampToNext(scaled.bottomRight.y, ly, ly + lh),
        },
      };
    });
    setEntryExitPoints((pts) =>
      pts.map((pt) => ({
        x: clamp(scaleX(pt.x), next.x, next.x + next.width),
        y: clamp(scaleY(pt.y), next.y, next.y + next.height),
      }))
    );
    prevLayoutRef.current = next;
  }, [liveViewLayout, clamp]);

  useEffect(() => {
    if (zoneType === 'entry_exit' && liveViewLayout.width > 0 && liveViewLayout.height > 0) {
      const lx = liveViewLayout.x;
      const ly = liveViewLayout.y;
      const lRight = lx + liveViewLayout.width;
      const lBottom = ly + liveViewLayout.height;
      setEntryExitPoints((prev) =>
        prev.map((pt) => ({
          x: clamp(pt.x, lx, lRight),
          y: clamp(pt.y, ly, lBottom),
        }))
      );
    }
  }, [liveViewLayout, zoneType, clamp]);

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const clampZoneToLiveView = (zone: DetectionZone): DetectionZone => {
    const { x, y, width, height } = liveViewLayout;
    return {
      topLeft: {
        x: clamp(zone.topLeft.x, x, x + width),
        y: clamp(zone.topLeft.y, y, y + height),
      },
      topRight: {
        x: clamp(zone.topRight.x, x, x + width),
        y: clamp(zone.topRight.y, y, y + height),
      },
      bottomLeft: {
        x: clamp(zone.bottomLeft.x, x, x + width),
        y: clamp(zone.bottomLeft.y, y, y + height),
      },
      bottomRight: {
        x: clamp(zone.bottomRight.x, x, x + width),
        y: clamp(zone.bottomRight.y, y, y + height),
      },
    };
  };

  // eslint-disable-next-line @typescript-eslint/no-shadow
  const setZoneClamped = (zone: DetectionZone) => setZone(clampZoneToLiveView(zone));

  const createPanResponder = (corner: keyof DetectionZone) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setActiveCorner(corner),
      onPanResponderMove: (_, g) => {
        setZone((prev) => {
          const newX = clamp(
            prev[corner].x + g.dx,
            liveViewLayout.x,
            liveViewLayout.x + liveViewLayout.width
          );
          const newY = clamp(
            prev[corner].y + g.dy,
            liveViewLayout.y,
            liveViewLayout.y + liveViewLayout.height
          );
          const u: DetectionZone = { ...prev, [corner]: { x: newX, y: newY } };
          if (corner === 'topLeft') {
            u.topRight.y = newY;
            u.bottomLeft.x = newX;
          }
          if (corner === 'topRight') {
            u.topLeft.y = newY;
            u.bottomRight.x = newX;
          }
          if (corner === 'bottomLeft') {
            u.topLeft.x = newX;
            u.bottomRight.y = newY;
          }
          if (corner === 'bottomRight') {
            u.topRight.x = newX;
            u.bottomLeft.y = newY;
          }
          return clampZoneToLiveView(u);
        });
      },
      onPanResponderRelease: () => setActiveCorner(null),
    });

  const panResponders = {
    topLeft: createPanResponder('topLeft'),
    topRight: createPanResponder('topRight'),
    bottomLeft: createPanResponder('bottomLeft'),
    bottomRight: createPanResponder('bottomRight'),
  };

  const entryExitPanResponders = [0, 1].map((idx) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => setActiveEntryExitPoint(idx),
      onPanResponderMove: (_, g) => {
        setEntryExitPoints((prev) => {
          const pts = [...prev];
          let nx = prev[idx].x + g.dx;
          let ny = prev[idx].y + g.dy;
          const lx = liveViewLayout.x;
          const ly = liveViewLayout.y;
          const lw = liveViewLayout.width;
          const lh = liveViewLayout.height;
          const lRight = lx + lw;
          const lBottom = ly + lh;
          const dists = [
            { edge: 'top', d: Math.abs(ny - ly) },
            { edge: 'bottom', d: Math.abs(ny - lBottom) },
            { edge: 'left', d: Math.abs(nx - lx) },
            { edge: 'right', d: Math.abs(nx - lRight) },
          ].sort((a, b) => a.d - b.d);
          const nearest = dists[0].edge;
          if (nearest === 'top') {
            ny = ly;
            nx = clamp(nx, lx, lRight);
          } else if (nearest === 'bottom') {
            ny = lBottom;
            nx = clamp(nx, lx, lRight);
          } else if (nearest === 'left') {
            nx = lx;
            ny = clamp(ny, ly, lBottom);
          } else if (nearest === 'right') {
            nx = lRight;
            ny = clamp(ny, ly, lBottom);
          }
          pts[idx] = { x: nx, y: ny };
          return pts;
        });
      },
      onPanResponderRelease: () => setActiveEntryExitPoint(null),
    })
  );

  const getZoneCoordinates = () => {
    const { x, y, width, height } = liveViewLayout;
    return {
      topLeft: { x: (zone.topLeft.x - x) / width, y: (zone.topLeft.y - y) / height },
      topRight: { x: (zone.topRight.x - x) / width, y: (zone.topRight.y - y) / height },
      bottomLeft: { x: (zone.bottomLeft.x - x) / width, y: (zone.bottomLeft.y - y) / height },
      bottomRight: { x: (zone.bottomRight.x - x) / width, y: (zone.bottomRight.y - y) / height },
    };
  };

  const getZoneDetect = async () => {
    try {
      const response = await detectionZoneService.getZones(camera.id, typeId);
      const zoneData = response.data[0];
      const coordinates = zoneData?.coordinates;
      if (zoneData?.id) {
        setExistingZoneId(zoneData.id);
      } else {
        setExistingZoneId(null);
      }
      const layout = liveViewLayoutRef.current;
      if (zoneType === 'entry_exit') {
        if (Array.isArray(coordinates) && coordinates.length >= 2) {
          const { x: lx, y: ly, width: lw, height: lh } = layout;
          setEntryExitPoints([
            { x: coordinates[0].x * lw + lx, y: coordinates[0].y * lh + ly },
            { x: coordinates[1].x * lw + lx, y: coordinates[1].y * lh + ly },
          ]);
        }
        const ic =
          zoneData?.in_direction_point ?? (coordinates?.length === 3 ? coordinates[2] : null);
        if (ic && Array.isArray(coordinates) && coordinates.length >= 2) {
          const { x: lx, y: ly, width: lw, height: lh } = layout;
          const p1 = { x: coordinates[0].x * lw + lx, y: coordinates[0].y * lh + ly };
          const p2 = { x: coordinates[1].x * lw + lx, y: coordinates[1].y * lh + ly };
          const icPx = { x: ic.x * lw + lx, y: ic.y * lh + ly };
          const side = (p2.x - p1.x) * (icPx.y - p1.y) - (p2.y - p1.y) * (icPx.x - p1.x);
          setIsLeftIn(side >= 0);
        }
      } else if (Array.isArray(coordinates) && coordinates.length === 4) {
        const { x: lx, y: ly, width: lw, height: lh } = layout;
        setZoneClamped({
          topLeft: { x: coordinates[0].x * lw + lx, y: coordinates[0].y * lh + ly },
          topRight: { x: coordinates[1].x * lw + lx, y: coordinates[1].y * lh + ly },
          bottomLeft: { x: coordinates[2].x * lw + lx, y: coordinates[2].y * lh + ly },
          bottomRight: {
            x: coordinates[3].x * lw + lx,
            y: coordinates[3].y * lh + ly,
          },
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isEntryExitInvalid = () => {
    if (zoneType !== 'entry_exit') return false;
    const [p1, p2] = entryExitPoints;
    const isVertical = p1.x === p2.x;
    const isHorizontal = p1.y === p2.y;
    const x0 = liveViewLayout.x;
    const xMax = liveViewLayout.x + liveViewLayout.width;
    const y0 = liveViewLayout.y;
    const yMax = liveViewLayout.y + liveViewLayout.height;
    if (isVertical && (p1.x === x0 || p1.x === xMax)) return true;
    return isHorizontal && (p1.y === y0 || p1.y === yMax);
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (isEntryExitInvalid()) {
      showCommonAlert({
        title: t('detectionZone.setupError'),
        message: t('detectionZone.twoPointError'),
        buttons: [{ text: t('common.ok') }],
      });
      setIsSaving(false);
      return;
    }
    setIsSaving(true);
    try {
      let coords: { x: number; y: number }[];
      let inDirectionPoint: { x: number; y: number } | undefined;
      if (zoneType === 'entry_exit') {
        const { left, right } = getEntryExitPolygons();
        const inPoly = isLeftIn ? right : left;
        const [p1, p2] = entryExitPoints;
        const eps = 1e-6;
        const eq = (a: Corner, b: Corner) => Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps;
        const lBottom = liveViewLayout.y + liveViewLayout.height;
        const bottomCorners = [
          { x: liveViewLayout.x, y: lBottom },
          { x: liveViewLayout.x + liveViewLayout.width, y: lBottom },
        ];
        const pt =
          bottomCorners.find((c) => inPoly.some((p) => eq(p, c))) ||
          inPoly.find((p) => !eq(p, p1) && !eq(p, p2)) ||
          bottomCorners[0];
        const { x: lx, y: ly, width: lw, height: lh } = liveViewLayout;
        coords = [
          { x: (p1.x - lx) / lw, y: (p1.y - ly) / lh },
          { x: (p2.x - lx) / lw, y: (p2.y - ly) / lh },
        ];
        inDirectionPoint = {
          x: (pt.x - lx) / lw,
          y: (pt.y - ly) / lh,
        };
      } else {
        const c = getZoneCoordinates();
        coords = [c.topLeft, c.topRight, c.bottomLeft, c.bottomRight];
      }
      const zonePayload = {
        zone_type_id: typeId,
        coordinates: coords,
        ...(inDirectionPoint && { in_direction_point: inDirectionPoint }),
      };
      const response = existingZoneId
        ? await detectionZoneService.updateZone(existingZoneId, camera.id, zonePayload)
        : await detectionZoneService.createZone(camera.id, zonePayload);

      showCommonAlert({
        title: response.success
          ? t('common.success', 'Success')
          : t('uploadDetectZone.failureTitle', 'Failure'),
        message: response.success
          ? t('detectionZone.successMessage', 'Detection zone setup successful')
          : t('detectionZone.failureMessage', 'Detection zone setup failed'),
        buttons: [{ text: t('common.ok'), onPress: () => navigation.goBack() }],
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => setZoneClamped(getInitialZone(liveViewLayout));
  const handleDrawRectangle = () =>
    setZoneClamped({
      topLeft: { x: liveViewLayout.x, y: liveViewLayout.y },
      topRight: { x: liveViewLayout.x + liveViewLayout.width, y: liveViewLayout.y },
      bottomLeft: { x: liveViewLayout.x, y: liveViewLayout.y + liveViewLayout.height },
      bottomRight: {
        x: liveViewLayout.x + liveViewLayout.width,
        y: liveViewLayout.y + liveViewLayout.height,
      },
    });

  const renderGrid = () => {
    const v = [];
    const h = [];
    const { x: lx, y: ly, width: lw, height: lh } = liveViewLayout;
    for (let x = lx + GRID_SIZE; x < lx + lw; x += GRID_SIZE)
      v.push(<View key={`v-${x}`} style={[styles.gridLineVertical, { left: x }]} />);
    for (let y = ly + GRID_SIZE; y < ly + lh; y += GRID_SIZE)
      h.push(<View key={`h-${y}`} style={[styles.gridLineHorizontal, { top: y }]} />);
    return (
      <>
        {v}
        {h}
      </>
    );
  };

  const getZoneColor = () => {
    if (zoneType === 'restricted') {
      return 'rgba(255,0,0,0.3)';
    } else if (zoneType === 'entry_exit') {
      return 'rgba(0,255,0,0.3)';
    } else {
      return 'rgba(255,255,0,0.3)';
    }
  };

  const getEntryExitPolygons = () => {
    const [p1, p2] = entryExitPoints;
    if (p1.x === p2.x && p1.y === p2.y) return { left: [], right: [] };
    const dx = p2.x - p1.x,
      dy = p2.y - p1.y;
    const lx = liveViewLayout.x;
    const ly = liveViewLayout.y;
    const lRight = lx + liveViewLayout.width;
    const lBottom = ly + liveViewLayout.height;
    const corners = [
      { x: lx, y: ly },
      { x: lRight, y: ly },
      { x: lRight, y: lBottom },
      { x: lx, y: lBottom },
    ];
    const side = (pt: Corner) => dx * (pt.y - p1.y) - dy * (pt.x - p1.x);
    const cw = (pts: Corner[]) => {
      const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
      const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
      return pts
        .slice()
        .sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
    };
    return {
      left: cw([p1, p2, ...corners.filter((c) => side(c) < 0)]),
      right: cw([p2, p1, ...corners.filter((c) => side(c) >= 0)]),
    };
  };

  const handleReconnect = async () => {
    await fetchLiveUrl();
    handleManualRetry();
  };

  const onLivePreviewLayout = useCallback(
    (e: { nativeEvent: { layout: { x: number; y: number; width: number; height: number } } }) => {
      const { x, y, width, height } = e.nativeEvent.layout;
      setLiveViewLayout((prev) =>
        prev.x === x && prev.y === y && prev.width === width && prev.height === height
          ? prev
          : { x, y, width, height }
      );
    },
    []
  );

  const handleGoback = () => {
    showCommonAlert({
      title: t('detectionZone.endSetup'),
      message: t('detectionZone.doYouWantToEndTheSetupProcess'),
      buttons: [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ],
    });
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backArea}
            onPress={handleGoback}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="chevron-left" color="#FFFFFF" size={26} />
          </TouchableOpacity>
          <View style={styles.flex1} />
          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.saveText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.body}>
          <View style={styles.previewContainer}>
            {streamHtmlUrl ? (
              useAndroidExoHls ? (
                <View style={styles.videoPlayerRoot} onLayout={onLivePreviewLayout}>
                  <View
                    ref={androidVideoSurfaceRef}
                    style={styles.videoNativeSurface}
                    collapsable={false}
                    pointerEvents="box-none"
                  >
                    <Video
                      key={`exo-${camera.id}-${videoReloadKey}`}
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
                        console.warn('[DetectionZone] ExoPlayer HLS error', e);
                        streamDebugLog('nativeHlsOnError');
                        markNativePlaybackFailed();
                      }}
                    />
                  </View>
                  <WebView
                    key={`aux-wv-${camera.id}`}
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
                  />
                </View>
              ) : (
                <WebView
                  key={`stream-${camera.id}`}
                  ref={webViewRef}
                  source={
                    inlineStreamSource
                      ? { html: inlineStreamSource.html, baseUrl: inlineStreamSource.baseUrl }
                      : { uri: streamHtmlUrl }
                  }
                  style={styles.cameraPreview}
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
                  mediaCapturePermissionGrantType="grant"
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
                      if (data.type === 'needReload') {
                        webViewRef.current?.reload();
                        return;
                      }
                      if (data.type === 'frameCaptured' && captureResolveRef.current) {
                        captureResolveRef.current(data.data || '');
                        return;
                      }
                      if (data.type === 'videoDataCheck') {
                        hasVideoDataRef.current = data.hasData;
                        if (!data.hasData && isLiveRef.current) {
                          console.log('[DetectionZone] Black screen detected, auto-reloading...');
                          streamDebugLog('videoDataCheckBlackReload');
                          fetchLiveUrl().then(() => handleManualRetry());
                        }
                        return;
                      }
                    } catch {
                      // ignore parse errors
                    }
                    handleWebViewMessage(event);
                  }}
                  onLayout={onLivePreviewLayout}
                />
              )
            ) : (
              <View
                style={[styles.cameraPreview, styles.loadingOverlay]}
                onLayout={(e) => {
                  const { x, y, width, height } = e.nativeEvent.layout;
                  setLiveViewLayout((prev) =>
                    prev.x === x && prev.y === y && prev.width === width && prev.height === height
                      ? prev
                      : { x, y, width, height }
                  );
                }}
              >
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.loadingText}>{streamLoadingMessage}</Text>
              </View>
            )}

            {!isLive && lastFrameBase64 && (
              <View style={[styles.cameraPreview, styles.lastFrameOverlay]}>
                <Image
                  source={{ uri: lastFrameBase64 }}
                  style={styles.cameraPreview}
                  resizeMode="cover"
                />
              </View>
            )}

            <View style={styles.overlayContainer} pointerEvents="box-none">
              {!isLive && !lastFrameBase64 && !fetchUrlError && (
                <View style={styles.loadingBgOverlay} pointerEvents="none" />
              )}
              <View style={styles.gridOverlay} pointerEvents="none">
                {renderGrid()}
              </View>

              {zoneType === 'entry_exit' ? (
                <>
                  <Svg style={styles.svgOverlay} pointerEvents="none">
                    {(() => {
                      const { left, right } = getEntryExitPolygons();
                      const lc = isLeftIn ? 'rgba(255,0,0,0.25)' : 'rgba(0,255,0,0.25)';
                      const rc = isLeftIn ? 'rgba(0,255,0,0.25)' : 'rgba(255,0,0,0.25)';
                      return (
                        <>
                          {left.length > 2 && (
                            <Polygon
                              points={left.map((p) => `${p.x},${p.y}`).join(' ')}
                              fill={lc}
                            />
                          )}
                          {right.length > 2 && (
                            <Polygon
                              points={right.map((p) => `${p.x},${p.y}`).join(' ')}
                              fill={rc}
                            />
                          )}
                          <Line
                            x1={entryExitPoints[0].x}
                            y1={entryExitPoints[0].y}
                            x2={entryExitPoints[1].x}
                            y2={entryExitPoints[1].y}
                            stroke="#00FF00"
                            strokeWidth={4}
                          />
                        </>
                      );
                    })()}
                  </Svg>
                  {entryExitPoints.map((pt, idx) => (
                    <View
                      key={idx}
                      // eslint-disable-next-line react-native/no-inline-styles
                      style={{
                        position: 'absolute',
                        left: pt.x - 14,
                        top: pt.y - 14,
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: '#00FF00',
                        borderWidth: 2,
                        borderColor: '#FFF',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 10,
                        transform: [{ scale: activeEntryExitPoint === idx ? 1.3 : 1 }],
                      }}
                      {...entryExitPanResponders[idx].panHandlers}
                    >
                      <View style={styles.lineStyle} />
                    </View>
                  ))}
                  <TouchableOpacity
                    style={styles.switchButton}
                    onPress={() => setIsLeftIn((v) => !v)}
                  >
                    <Icon name="swap-horizontal" size={20} color="#333" style={styles.marginIcon} />
                    <Text style={styles.fontStyle}>
                      {t('detectionZone.inGreenOutRed', 'In: Green / Out: Red')}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View
                    pointerEvents="none"
                    style={[
                      styles.zoneOverlay,
                      {
                        top: zone.topLeft.y,
                        left: zone.topLeft.x,
                        width: zone.topRight.x - zone.topLeft.x,
                        height: zone.bottomLeft.y - zone.topLeft.y,
                        backgroundColor: getZoneColor(),
                      },
                    ]}
                  />
                  {(Object.keys(zone) as (keyof DetectionZone)[]).map((corner) => {
                    const c = zone[corner];
                    return (
                      <View
                        key={corner}
                        style={[
                          styles.cornerHandle,
                          {
                            left: c.x - 14,
                            top: c.y - 14,
                            transform: [{ scale: activeCorner === corner ? 1.3 : 1 }],
                          },
                        ]}
                        {...panResponders[corner].panHandlers}
                      >
                        <View style={styles.cornerInner} />
                      </View>
                    );
                  })}
                </>
              )}

              <View style={styles.rightButtons}>
                {zoneType !== 'entry_exit' && (
                  <View>
                    <TouchableOpacity style={styles.roundButton} onPress={handleDrawRectangle}>
                      <Icon name="selection-drag" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.roundButton} onPress={handleReset}>
                      <Icon name="trash-can-outline" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {!isLive &&
                !isReconnecting &&
                !showErrorOverlay &&
                !fetchUrlError &&
                !lastFrameBase64 && (
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
                    onPress={() => (fetchUrlError ? fetchLiveUrl() : handleReconnect())}
                  >
                    <Text style={styles.retryButtonText}>{t('common.retry') || 'Retry'}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default DetectionZoneSetup;
