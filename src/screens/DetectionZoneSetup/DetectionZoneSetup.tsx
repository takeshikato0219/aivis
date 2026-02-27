import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  PanResponder,
  ActivityIndicator,
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
import { RTCView } from 'react-native-webrtc';
import { useStream } from '@hooks/useStream';

const getScreenDims = () => {
  const { width, height } = Dimensions.get('window');
  const w = Math.max(width, height);
  const h = Math.min(width, height);
  return { SCREEN_WIDTH: w, SCREEN_HEIGHT: h };
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
  const live_url =
    'wss://avisaitest-nginx001.wpstories.org/api/ws?src=camera&token=eyJwYXZpbGFvYWRJRCI6eyJjYW1lcmFfaWQiOiAiN2I4MWM3NzAtMGEyNS00Y2JjLTg3ZjgtN2JjY2JmMjgwNDUxIiwic3RhcnRfdGltZSI6IjIwMjYtMDItMjZUMTc6MDE6NTUuMzMzOTU1KzA3OjAwIiwidGltZV9leHAiOiAiMjAyNi0wMi0yNlQxNzozMTo1NS4zMzM5NTMrMDc6MDAiLCJleHBzIjoxNjc4NzYwMDAwLCJzaWduYXR1cmUiOiAiVElUTEVHSFgtJNE9qRTF1NnMxOVlJSmJYVTRXUysveGdYRW9BZ3ZTY2dVQms9In19';
  const { displayStream, isStalled, stallReason, error, reconnect } = useStream({ live_url });

  const createPanResponder = (corner: keyof DetectionZone) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setActiveCorner(corner);
      },
      onPanResponderMove: (_, gestureState) => {
        setZone((prev) => {
          const prevCorner = prev[corner];
          const newX = Math.max(0, Math.min(PREVIEW_WIDTH, prevCorner.x + gestureState.dx));
          const newY = Math.max(0, Math.min(PREVIEW_HEIGHT, prevCorner.y + gestureState.dy));

          const updated: DetectionZone = { ...prev, [corner]: { x: newX, y: newY } };

          switch (corner) {
            case 'topLeft':
              updated.topRight.y = newY;
              updated.bottomLeft.x = newX;
              break;
            case 'topRight':
              updated.topLeft.y = newY;
              updated.bottomRight.x = newX;
              break;
            case 'bottomLeft':
              updated.topLeft.x = newX;
              updated.bottomRight.y = newY;
              break;
            case 'bottomRight':
              updated.topRight.x = newX;
              updated.bottomLeft.y = newY;
              break;
          }

          return updated;
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
      onPanResponderMove: (_, gestureState) => {
        setEntryExitPoints((prev) => {
          const newPoints = [...prev];
          let newX = prev[idx].x + gestureState.dx;
          let newY = prev[idx].y + gestureState.dy;
          const distances = [
            { edge: 'top', dist: Math.abs(newY - 1) },
            { edge: 'bottom', dist: Math.abs(newY - (PREVIEW_HEIGHT - marginBottom)) },
            { edge: 'left', dist: Math.abs(newX - EDGE_MARGIN) },
            { edge: 'right', dist: Math.abs(newX - (PREVIEW_WIDTH - EDGE_MARGIN)) },
          ];
          distances.sort((a, b) => a.dist - b.dist);
          const nearest = distances[0].edge;
          if (nearest === 'top') {
            newY = 1;
            newX = Math.max(EDGE_MARGIN, Math.min(PREVIEW_WIDTH - EDGE_MARGIN, newX));
          } else if (nearest === 'bottom') {
            newY = PREVIEW_HEIGHT - marginBottom;
            newX = Math.max(EDGE_MARGIN, Math.min(PREVIEW_WIDTH - EDGE_MARGIN, newX));
          } else if (nearest === 'left') {
            newX = EDGE_MARGIN;
            newY = Math.max(1, Math.min(PREVIEW_HEIGHT - marginBottom, newY));
          } else if (nearest === 'right') {
            newX = PREVIEW_WIDTH - EDGE_MARGIN;
            newY = Math.max(1, Math.min(PREVIEW_HEIGHT - marginBottom, newY));
          }
          newPoints[idx] = { x: newX, y: newY };
          return newPoints;
        });
      },
      onPanResponderRelease: () => setActiveEntryExitPoint(null),
    })
  );

  const getZoneCoordinates = () => ({
    topLeft: {
      x: zone.topLeft.x / PREVIEW_WIDTH,
      y: zone.topLeft.y / PREVIEW_HEIGHT,
    },
    topRight: {
      x: zone.topRight.x / PREVIEW_WIDTH,
      y: zone.topRight.y / PREVIEW_HEIGHT,
    },
    bottomLeft: {
      x: zone.bottomLeft.x / PREVIEW_WIDTH,
      y: zone.bottomLeft.y / PREVIEW_HEIGHT,
    },
    bottomRight: {
      x: zone.bottomRight.x / PREVIEW_WIDTH,
      y: zone.bottomRight.y / PREVIEW_HEIGHT,
    },
  });

  const getZoneDetect = async () => {
    try {
      const response = await detectionZoneService.getZones(camera.id, typeId);
      const coordinates = response.data[0]?.coordinates;
      if (zoneType === 'entryExit') {
        if (Array.isArray(coordinates) && coordinates.length >= 2) {
          setEntryExitPoints([
            {
              x: coordinates[0].x * PREVIEW_WIDTH,
              y: coordinates[0].y * PREVIEW_HEIGHT,
            },
            {
              x: coordinates[1].x * PREVIEW_WIDTH,
              y: coordinates[1].y * PREVIEW_HEIGHT,
            },
          ]);
        }
        if (coordinates?.length === 3) {
          const p1 = {
            x: coordinates[0].x * PREVIEW_WIDTH,
            y: coordinates[0].y * PREVIEW_HEIGHT,
          };

          const p2 = {
            x: coordinates[1].x * PREVIEW_WIDTH,
            y: coordinates[1].y * PREVIEW_HEIGHT,
          };

          const inCorner = {
            x: coordinates[2].x * PREVIEW_WIDTH,
            y: coordinates[2].y * PREVIEW_HEIGHT,
          };

          setEntryExitPoints([p1, p2]);

          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;

          const side = dx * (inCorner.y - p1.y) - dy * (inCorner.x - p1.x);

          setIsLeftIn(side < 0);
        }
      } else if (Array.isArray(coordinates) && coordinates.length === 4) {
        setZone({
          topLeft: {
            x: coordinates[0].x * PREVIEW_WIDTH,
            y: coordinates[0].y * PREVIEW_HEIGHT,
          },
          topRight: {
            x: coordinates[1].x * PREVIEW_WIDTH,
            y: coordinates[1].y * PREVIEW_HEIGHT,
          },
          bottomLeft: {
            x: coordinates[2].x * PREVIEW_WIDTH,
            y: coordinates[2].y * PREVIEW_HEIGHT,
          },
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
      let coordinatesArray: { x: number; y: number }[] = [];

      if (zoneType === 'entryExit') {
        const { left, right } = getEntryExitPolygons();
        const inPolygon = isLeftIn ? left : right;

        const frameCorners = [
          { x: 0, y: 0 },
          { x: PREVIEW_WIDTH, y: 0 },
          { x: PREVIEW_WIDTH, y: PREVIEW_HEIGHT },
          { x: 0, y: PREVIEW_HEIGHT },
        ];

        const inCorner =
          frameCorners.find((corner) =>
            inPolygon.some((p) => p.x === corner.x && p.y === corner.y)
          ) || frameCorners[0];

        coordinatesArray = [
          {
            x: entryExitPoints[0].x / PREVIEW_WIDTH,
            y: entryExitPoints[0].y / PREVIEW_HEIGHT,
          },
          {
            x: entryExitPoints[1].x / PREVIEW_WIDTH,
            y: entryExitPoints[1].y / PREVIEW_HEIGHT,
          },
          {
            x: inCorner.x / PREVIEW_WIDTH,
            y: inCorner.y / PREVIEW_HEIGHT,
          },
        ];
      } else {
        const coordinates = getZoneCoordinates();

        coordinatesArray = [
          coordinates.topLeft,
          coordinates.topRight,
          coordinates.bottomLeft,
          coordinates.bottomRight,
        ];
      }
      const response = await detectionZoneService.createZone(camera.id, {
        zone_type_id: typeId,
        coordinates: coordinatesArray,
      });

      if (response.success) {
        showCommonAlert({
          title: t('detectionZone.successTitle', 'Success'),
          message: t('detectionZone.successMessage', 'Detection zone setup successful'),
          buttons: [
            {
              text: t('common.ok'),
              onPress: () => navigation.goBack(),
            },
          ],
        });
      } else {
        showCommonAlert({
          title: t('detectionZone.failureTitle', 'Failure'),
          message: t('detectionZone.failureMessage', 'Detection zone setup failed'),
          buttons: [
            {
              text: t('common.ok'),
              onPress: () => navigation.goBack(),
            },
          ],
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setZone(INITIAL_ZONE);
  };

  const handleDrawRectangle = () => {
    const marginX = PREVIEW_WIDTH * 0.05;
    setZone({
      topLeft: { x: marginX, y: 1 },
      topRight: { x: PREVIEW_WIDTH - marginX, y: 1 },
      bottomLeft: { x: marginX, y: PREVIEW_HEIGHT - marginBottom },
      bottomRight: { x: PREVIEW_WIDTH - marginX, y: PREVIEW_HEIGHT - marginBottom },
    });
  };

  const renderGrid = () => {
    const verticalLines = [];
    const horizontalLines = [];

    for (let x = 0; x <= PREVIEW_WIDTH; x += GRID_SIZE) {
      verticalLines.push(<View key={`v-${x}`} style={[styles.gridLineVertical, { left: x }]} />);
    }

    for (let y = 0; y <= PREVIEW_HEIGHT; y += GRID_SIZE) {
      horizontalLines.push(<View key={`h-${y}`} style={[styles.gridLineHorizontal, { top: y }]} />);
    }
    return (
      <>
        {verticalLines}
        {horizontalLines}
      </>
    );
  };

  // Set color based on zoneType
  const getZoneColor = () => {
    switch (zoneType) {
      case 'restricted':
        return 'rgba(255,0,0,0.3)';
      case 'entryExit':
        return 'rgba(0,255,0,0.3)';
      case 'detection':
      default:
        return 'rgba(255,255,0,0.3)';
    }
  };

  // Helper: get polygon points for left/right region
  const getEntryExitPolygons = () => {
    const [p1, p2] = entryExitPoints;
    if (p1.x === p2.x && p1.y === p2.y) return { left: [], right: [] };
    // Calculate normal vector to the line
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    // Corners of the frame in clockwise order
    const corners = [
      { x: 0, y: 0 },
      { x: PREVIEW_WIDTH, y: 0 },
      { x: PREVIEW_WIDTH, y: PREVIEW_HEIGHT },
      { x: 0, y: PREVIEW_HEIGHT },
    ];
    // Helper to determine which side of the line a point is on
    const side = (pt: { x: number; y: number }) => dx * (pt.y - p1.y) - dy * (pt.x - p1.x);

    // For each corner, classify as left or right
    const leftCorners = corners.filter((c) => side(c) < 0);
    const rightCorners = corners.filter((c) => side(c) >= 0);

    // For left polygon: start at p1, go to p2, then all left corners in order
    let leftPoly = [p1, p2, ...leftCorners];
    // For right polygon: start at p2, go to p1, then all right corners in order
    let rightPoly = [p2, p1, ...rightCorners];

    // Sort the corners in clockwise order for proper polygon rendering
    const sortClockwise = (points: { x: number; y: number }[]) => {
      // Calculate centroid
      const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
      const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
      // Sort by angle from centroid
      return points.slice().sort((a, b) => {
        const angleA = Math.atan2(a.y - cy, a.x - cx);
        const angleB = Math.atan2(b.y - cy, b.x - cx);
        return angleA - angleB;
      });
    };

    leftPoly = sortClockwise(leftPoly);
    rightPoly = sortClockwise(rightPoly);

    return {
      left: leftPoly,
      right: rightPoly,
    };
  };

  useEffect(() => {
    getZoneDetect();
    Orientation.lockToLandscapeLeft();
    return () => {
      Orientation.lockToPortrait();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          {/* RTCView for WebRTC video stream */}
          {displayStream ? (
            <RTCView
              streamURL={displayStream.toURL()}
              style={styles.cameraPreview}
              objectFit="cover"
            />
          ) : (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>
                {isStalled ? stallReason : 'Loading stream...'}
              </Text>
            </View>
          )}
          {/* Error and reconnect overlays */}
          {error && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={reconnect}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          <View
            style={[styles.overlayContainer, { width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }]}
            pointerEvents="box-none"
          >
            <View style={styles.gridOverlay} pointerEvents="none">
              {renderGrid()}
            </View>

            {/* Entry/Exit zoneType: show vertical line with 2 draggable points */}
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
                    const leftColor = isLeftIn ? 'rgba(255,0,0,0.25)' : 'rgba(0,255,0,0.25)';
                    const rightColor = isLeftIn ? 'rgba(0,255,0,0.25)' : 'rgba(255,0,0,0.25)';
                    return (
                      <>
                        {left.length > 2 && (
                          <Polygon
                            points={left.map((p) => `${p.x},${p.y}`).join(' ')}
                            fill={leftColor}
                          />
                        )}
                        {right.length > 2 && (
                          <Polygon
                            points={right.map((p) => `${p.x},${p.y}`).join(' ')}
                            fill={rightColor}
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
                {/* Draggable points */}
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
                {/* Switch button */}
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
                {/* Default zone overlay and handles for other zone types */}
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
              {zoneType === 'entryExit' ? null : (
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
