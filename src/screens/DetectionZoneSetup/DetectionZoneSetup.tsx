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
} from 'react-native';
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
  getInjectedStreamPlayerJS,
  buildIOSStreamInlineHtml,
} from '@utils/streamUtils';
import cameraService from '@api/cameraService';
import { useLiveStream } from '@hooks/useLiveStream';

const getScreenDims = () => {
  const { width, height } = Dimensions.get('window');
  return { SCREEN_WIDTH: Math.max(width, height), SCREEN_HEIGHT: Math.min(width, height) };
};

const { SCREEN_WIDTH, SCREEN_HEIGHT } = getScreenDims();
const PREVIEW_WIDTH = SCREEN_WIDTH;
const PREVIEW_HEIGHT = SCREEN_HEIGHT;

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
  const centerX = PREVIEW_WIDTH / 2;
  const centerY = PREVIEW_HEIGHT / 2;
  const offset = 80;

  const INITIAL_ZONE: DetectionZone = {
    topLeft: { x: centerX - offset, y: centerY - offset },
    topRight: { x: centerX + offset, y: centerY - offset },
    bottomLeft: { x: centerX - offset, y: centerY + offset },
    bottomRight: { x: centerX + offset, y: centerY + offset },
  };

  const [zone, setZone] = useState<DetectionZone>(INITIAL_ZONE);
  const [activeCorner, setActiveCorner] = useState<keyof DetectionZone | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [entryExitPoints, setEntryExitPoints] = useState([
    { x: PREVIEW_WIDTH / 2, y: 1 },
    { x: PREVIEW_WIDTH / 2, y: PREVIEW_HEIGHT - PREVIEW_HEIGHT * 0.15 },
  ]);
  const [activeEntryExitPoint, setActiveEntryExitPoint] = useState<number | null>(null);
  const [isLeftIn, setIsLeftIn] = useState(true);
  const [streamWsUrl, setStreamWsUrl] = useState<string>(route.params.liveUrl || '');
  const [streamHtmlUrl, setStreamHtmlUrl] = useState(() =>
    buildStreamHtmlUrl(route.params.liveUrl)
  );
  const [timeExp, setTimeExp] = useState<string | null>(null);
  const [liveViewLayout, setLiveViewLayout] = useState({
    x: 0,
    y: 0,
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
  });

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
  } = useLiveStream({ maxRetries: 3, heartbeatTimeout: 15000 });

  const webViewError = connectionStatus === 'failed';
  const isLive = connectionStatus === 'connected' && !!streamHtmlUrl && !isWebViewLoading;

  const fetchLiveUrl = useCallback(async () => {
    try {
      const res = await cameraService.getLiveStreamUrl(camera.id);
      if (res.success && res.data) {
        setTimeExp(res.data.time_exp);
        setStreamWsUrl(res.data.live_url);
        const newHtmlUrl = buildStreamHtmlUrl(res.data.live_url);
        setStreamHtmlUrl((prev) => (prev === newHtmlUrl ? prev : newHtmlUrl));
      }
    } catch {
      // handle error
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
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        fetchLiveUrl().then(() => {
          webViewRef.current?.reload();
        });
      }
      appStateRef.current = nextAppState;
    });
    return () => {
      subscription.remove();
    };
  }, [fetchLiveUrl, webViewRef]);

  const forceVideoPlay = useCallback(() => {
    webViewRef.current?.injectJavaScript(`
      (function(){
        var v = document.querySelector('video');
        if (v && v.paused) v.play().catch(function(){});
        true;
      })();
    `);
  }, [webViewRef]);

  useFocusEffect(
    useCallback(() => {
      if (connectionStatus === 'connected' && streamWsUrl && !webViewError) {
        const t1 = setTimeout(forceVideoPlay, 300);
        const t2 = setTimeout(forceVideoPlay, 1200);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      }
    }, [connectionStatus, streamWsUrl, webViewError, forceVideoPlay])
  );

  useEffect(() => {
    if (!isLive || !streamWsUrl) return;
    const t1 = setTimeout(forceVideoPlay, 500);
    const t2 = setTimeout(forceVideoPlay, 2000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isLive, streamWsUrl, forceVideoPlay]);

  const INJECTED_JS = getInjectedStreamPlayerJS(Platform.OS as 'ios' | 'android');

  const inlineStreamSource = useMemo(() => {
    if (!streamWsUrl) return null;
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

  const clamp = useCallback(
    (v: number, min: number, max: number) => Math.max(min, Math.min(max, v)),
    []
  );

  useEffect(() => {
    if (zoneType === 'entryExit' && liveViewLayout.width > 0 && liveViewLayout.height > 0) {
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

  const getZoneCoordinates = () => ({
    topLeft: { x: zone.topLeft.x / PREVIEW_WIDTH, y: zone.topLeft.y / PREVIEW_HEIGHT },
    topRight: { x: zone.topRight.x / PREVIEW_WIDTH, y: zone.topRight.y / PREVIEW_HEIGHT },
    bottomLeft: { x: zone.bottomLeft.x / PREVIEW_WIDTH, y: zone.bottomLeft.y / PREVIEW_HEIGHT },
    bottomRight: { x: zone.bottomRight.x / PREVIEW_WIDTH, y: zone.bottomRight.y / PREVIEW_HEIGHT },
  });

  const getZoneDetect = async () => {
    try {
      const response = await detectionZoneService.getZones(camera.id, typeId);
      const coordinates = response.data[0]?.coordinates;
      if (zoneType === 'entryExit') {
        if (Array.isArray(coordinates) && coordinates.length >= 2) {
          setEntryExitPoints([
            { x: coordinates[0].x * PREVIEW_WIDTH, y: coordinates[0].y * PREVIEW_HEIGHT },
            { x: coordinates[1].x * PREVIEW_WIDTH, y: coordinates[1].y * PREVIEW_HEIGHT },
          ]);
        }
        if (coordinates?.length === 3) {
          const p1 = { x: coordinates[0].x * PREVIEW_WIDTH, y: coordinates[0].y * PREVIEW_HEIGHT };
          const p2 = { x: coordinates[1].x * PREVIEW_WIDTH, y: coordinates[1].y * PREVIEW_HEIGHT };
          const ic = { x: coordinates[2].x * PREVIEW_WIDTH, y: coordinates[2].y * PREVIEW_HEIGHT };
          setEntryExitPoints([p1, p2]);
          const side = (p2.x - p1.x) * (ic.y - p1.y) - (p2.y - p1.y) * (ic.x - p1.x);
          setIsLeftIn(side < 0);
        }
      } else if (Array.isArray(coordinates) && coordinates.length === 4) {
        setZoneClamped({
          topLeft: { x: coordinates[0].x * PREVIEW_WIDTH, y: coordinates[0].y * PREVIEW_HEIGHT },
          topRight: { x: coordinates[1].x * PREVIEW_WIDTH, y: coordinates[1].y * PREVIEW_HEIGHT },
          bottomLeft: { x: coordinates[2].x * PREVIEW_WIDTH, y: coordinates[2].y * PREVIEW_HEIGHT },
          bottomRight: {
            x: coordinates[3].x * PREVIEW_WIDTH,
            y: coordinates[3].y * PREVIEW_HEIGHT,
          },
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isEntryExitInvalid = () => {
    if (zoneType !== 'entryExit') return false;
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
      if (zoneType === 'entryExit') {
        const { left, right } = getEntryExitPolygons();
        const inPoly = isLeftIn ? left : right;
        const frameCornersArr = [
          { x: liveViewLayout.x, y: liveViewLayout.y },
          { x: liveViewLayout.x + liveViewLayout.width, y: liveViewLayout.y },
          {
            x: liveViewLayout.x + liveViewLayout.width,
            y: liveViewLayout.y + liveViewLayout.height,
          },
          { x: liveViewLayout.x, y: liveViewLayout.y + liveViewLayout.height },
        ];
        const ic =
          frameCornersArr.find((c) => inPoly.some((p) => p.x === c.x && p.y === c.y)) ||
          frameCornersArr[0];
        coords = [
          { x: entryExitPoints[0].x / PREVIEW_WIDTH, y: entryExitPoints[0].y / PREVIEW_HEIGHT },
          { x: entryExitPoints[1].x / PREVIEW_WIDTH, y: entryExitPoints[1].y / PREVIEW_HEIGHT },
          { x: ic.x / PREVIEW_WIDTH, y: ic.y / PREVIEW_HEIGHT },
        ];
      } else {
        const c = getZoneCoordinates();
        coords = [c.topLeft, c.topRight, c.bottomLeft, c.bottomRight];
      }
      const response = await detectionZoneService.createZone(camera.id, {
        zone_type_id: typeId,
        coordinates: coords,
      });
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

  const handleReset = () => setZoneClamped(INITIAL_ZONE);
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
    for (let x = GRID_SIZE; x < PREVIEW_WIDTH; x += GRID_SIZE)
      v.push(<View key={`v-${x}`} style={[styles.gridLineVertical, { left: x }]} />);
    for (let y = GRID_SIZE; y < PREVIEW_HEIGHT; y += GRID_SIZE)
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
    } else if (zoneType === 'entryExit') {
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
              <WebView
                key={streamWsUrl || streamHtmlUrl || 'stream'}
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
                  } catch {
                    // ignore parse errors
                  }
                  handleWebViewMessage(event);
                }}
                onLayout={(e) => {
                  const { x, y, width, height } = e.nativeEvent.layout;
                  setLiveViewLayout((prev) =>
                    prev.x === x && prev.y === y && prev.width === width && prev.height === height
                      ? prev
                      : { x, y, width, height }
                  );
                }}
              />
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
                <Text style={styles.loadingText}>{t('bluetoothScreen.connecting')}</Text>
              </View>
            )}

            {!streamHtmlUrl || (isWebViewLoading && streamHtmlUrl) ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.loadingText}>
                  {!streamHtmlUrl ? t('bluetoothScreen.connecting') : t('liveStream.loadingStream')}
                </Text>
              </View>
            ) : null}

            {isReconnecting && streamHtmlUrl ? (
              <View style={styles.reconnectingOverlay}>
                <ActivityIndicator size="small" color="#FFF" />
                <Text style={styles.loadingText}>
                  {t('liveStream.reconnecting') || 'Reconnecting...'} ({retryCount})
                </Text>
              </View>
            ) : null}

            {webViewError && !isWebViewLoading && streamHtmlUrl ? (
              <View style={styles.errorOverlay}>
                <Text style={styles.errorText}>
                  {t('networkSetup.connectionFailed') || 'Connection failed'}
                </Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleReconnect}>
                  <Text style={styles.retryButtonText}>{t('common.retry') || 'Retry'}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.overlayContainer} pointerEvents="box-none">
              <View style={styles.gridOverlay} pointerEvents="none">
                {renderGrid()}
              </View>

              {zoneType === 'entryExit' ? (
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
                {zoneType !== 'entryExit' && (
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
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default DetectionZoneSetup;
