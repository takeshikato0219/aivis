import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  ActivityIndicator,
  Platform,
} from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './DetectionZoneSetup.styles';
import { useTranslation } from 'react-i18next';
import detectionZoneService from '../../services/detectionZone';
import Svg, { Line, Polygon } from 'react-native-svg';
import { showCommonAlert } from '@components/Alert/Alert';
import { WebView } from 'react-native-webview';
import { buildStreamHtmlUrl, getInjectedStreamPlayerJS } from '@utils/streamUtils';
import cameraService from '@api/cameraService';

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

type DetectionZoneSetupParamList = {
  DetectionZoneSetup: {
    camera: any;
    zoneType?: 'detection' | 'restricted' | 'entryExit';
    typeId?: string;
    liveUrl: string;
  };
};

const DetectionZoneSetup: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<DetectionZoneSetupParamList, 'DetectionZoneSetup'>>();
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
  const marginBottom = PREVIEW_HEIGHT * 0.2;
  const [entryExitPoints, setEntryExitPoints] = useState([
    { x: PREVIEW_WIDTH / 2, y: 1 },
    { x: PREVIEW_WIDTH / 2, y: PREVIEW_HEIGHT - PREVIEW_HEIGHT * 0.15 },
  ]);
  const [activeEntryExitPoint, setActiveEntryExitPoint] = useState<number | null>(null);
  const [isLeftIn, setIsLeftIn] = useState(true);
  const [streamHtmlUrl, setStreamHtmlUrl] = useState(() =>
    buildStreamHtmlUrl(route.params.liveUrl)
  );
  const [timeExp, setTimeExp] = useState<string | null>(null);
  const [isWebViewLoading, setIsWebViewLoading] = useState(true);
  const [webViewError, setWebViewError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);
  const [liveViewLayout, setLiveViewLayout] = useState({
    x: 0,
    y: 0,
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
  });

  const fetchLiveUrl = useCallback(async () => {
    const res = await cameraService.getLiveStreamUrl(camera.id);
    if (res.success && res.data) {
      const newHtmlUrl = buildStreamHtmlUrl(res.data.live_url);
      setStreamHtmlUrl((prev) => (prev === newHtmlUrl ? prev : newHtmlUrl));
      setTimeExp(res.data.time_exp);
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

  useEffect(() => {
    fetchLiveUrl();
    getZoneDetect();
    Orientation.lockToLandscapeLeft();
    return () => {
      Orientation.lockToPortrait();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchLiveUrl]);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

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

  const EDGE_MARGIN = 20;
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
          const dists = [
            { edge: 'top', d: Math.abs(ny - 1) },
            { edge: 'bottom', d: Math.abs(ny - (PREVIEW_HEIGHT - marginBottom)) },
            { edge: 'left', d: Math.abs(nx - EDGE_MARGIN) },
            { edge: 'right', d: Math.abs(nx - (PREVIEW_WIDTH - EDGE_MARGIN)) },
          ].sort((a, b) => a.d - b.d);
          const nearest = dists[0].edge;
          if (nearest === 'top') {
            ny = 1;
            nx = clamp(nx, EDGE_MARGIN, PREVIEW_WIDTH - EDGE_MARGIN);
          } else if (nearest === 'bottom') {
            ny = PREVIEW_HEIGHT - PREVIEW_HEIGHT * 0.15;
            nx = clamp(nx, EDGE_MARGIN, PREVIEW_WIDTH - EDGE_MARGIN);
          } else if (nearest === 'left') {
            nx = EDGE_MARGIN;
            ny = clamp(ny, 1, PREVIEW_HEIGHT - marginBottom);
          } else if (nearest === 'right') {
            nx = PREVIEW_WIDTH - EDGE_MARGIN;
            ny = clamp(ny, 1, PREVIEW_HEIGHT - marginBottom);
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let coords: { x: number; y: number }[];
      if (zoneType === 'entryExit') {
        const { left, right } = getEntryExitPolygons();
        const inPoly = isLeftIn ? left : right;
        const frameCornersArr = [
          { x: 0, y: 0 },
          { x: PREVIEW_WIDTH, y: 0 },
          { x: PREVIEW_WIDTH, y: PREVIEW_HEIGHT },
          { x: 0, y: PREVIEW_HEIGHT },
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
          ? t('detectionZone.successTitle', 'Success')
          : t('detectionZone.failureTitle', 'Failure'),
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
    for (let x = 0; x <= PREVIEW_WIDTH; x += GRID_SIZE)
      v.push(<View key={`v-${x}`} style={[styles.gridLineVertical, { left: x }]} />);
    for (let y = 0; y <= PREVIEW_HEIGHT; y += GRID_SIZE)
      h.push(<View key={`h-${y}`} style={[styles.gridLineHorizontal, { top: y }]} />);
    return (
      <>
        {v}
        {h}
      </>
    );
  };

  const getZoneColor = () =>
    zoneType === 'restricted'
      ? 'rgba(255,0,0,0.3)'
      : zoneType === 'entryExit'
        ? 'rgba(0,255,0,0.3)'
        : 'rgba(255,255,0,0.3)';

  const getEntryExitPolygons = () => {
    const [p1, p2] = entryExitPoints;
    if (p1.x === p2.x && p1.y === p2.y) return { left: [], right: [] };
    const dx = p2.x - p1.x,
      dy = p2.y - p1.y;
    const corners = [
      { x: 0, y: 0 },
      { x: PREVIEW_WIDTH, y: 0 },
      { x: PREVIEW_WIDTH, y: PREVIEW_HEIGHT },
      { x: 0, y: PREVIEW_HEIGHT },
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
    setWebViewError(null);
    setIsWebViewLoading(true);
    await fetchLiveUrl();
    webViewRef.current?.reload();
  };

  const INJECTED_JS = getInjectedStreamPlayerJS(Platform.OS as 'ios' | 'android');

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backArea}
            onPress={() => navigation.goBack()}
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
      </SafeAreaView>

      <View style={styles.body}>
        <View style={styles.previewContainer}>
          {streamHtmlUrl ? (
            <WebView
              ref={webViewRef}
              source={{ uri: streamHtmlUrl }}
              style={styles.cameraPreview}
              containerStyle={styles.webViewContainer}
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
              })}
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
              onLayout={(e) => {
                const { x, y, width, height } = e.nativeEvent.layout;
                setLiveViewLayout({ x, y, width, height });
              }}
            />
          ) : (
            <View
              style={[styles.cameraPreview, styles.loadingOverlay]}
              onLayout={(e) => {
                const { x, y, width, height } = e.nativeEvent.layout;
                setLiveViewLayout({ x, y, width, height });
              }}
            >
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={styles.loadingText}>{'Connecting…'}</Text>
            </View>
          )}

          {/* Loading overlay khi WebView đang tải */}
          {isWebViewLoading && streamHtmlUrl ? (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color="#FFF" />
              <Text style={styles.loadingText}>{'Loading stream…'}</Text>
            </View>
          ) : null}

          {/* Error overlay khi WebView bị lỗi */}
          {webViewError && !isWebViewLoading ? (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorText}>{webViewError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleReconnect}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View
            style={[styles.overlayContainer, { width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }]}
            pointerEvents="box-none"
          >
            <View style={styles.gridOverlay} pointerEvents="none">
              {renderGrid()}
            </View>

            {zoneType === 'entryExit' ? (
              <>
                <Svg
                  // eslint-disable-next-line react-native/no-inline-styles
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: PREVIEW_WIDTH,
                    height: PREVIEW_HEIGHT,
                  }}
                  pointerEvents="none"
                >
                  {(() => {
                    const { left, right } = getEntryExitPolygons();
                    const lc = isLeftIn ? 'rgba(255,0,0,0.25)' : 'rgba(0,255,0,0.25)';
                    const rc = isLeftIn ? 'rgba(0,255,0,0.25)' : 'rgba(255,0,0,0.25)';
                    return (
                      <>
                        {left.length > 2 && (
                          <Polygon points={left.map((p) => `${p.x},${p.y}`).join(' ')} fill={lc} />
                        )}
                        {right.length > 2 && (
                          <Polygon points={right.map((p) => `${p.x},${p.y}`).join(' ')} fill={rc} />
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
    </View>
  );
};

export default DetectionZoneSetup;
