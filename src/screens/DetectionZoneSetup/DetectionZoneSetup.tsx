import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Platform, Dimensions, PanResponder } from 'react-native';
import Orientation from 'react-native-orientation-locker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './DetectionZoneSetup.styles';
import { buildStreamUrl, getStreamHTML } from '@utils/streamUtils';
import { WebView } from 'react-native-webview';
import { useLiveStream } from '@hooks/useLiveStream';
import {useTranslation} from 'react-i18next';

const getScreenDims = () => {
  const { width, height } = Dimensions.get('window');
  const w = Math.max(width, height);
  const h = Math.min(width, height);
  return { SCREEN_WIDTH: w, SCREEN_HEIGHT: h };
};

const { SCREEN_WIDTH, SCREEN_HEIGHT } = getScreenDims();

const PREVIEW_WIDTH = SCREEN_WIDTH;
const PREVIEW_HEIGHT = SCREEN_HEIGHT; // full height phía dưới header

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
  DetectionZoneSetup: { camera: any };
};

const DetectionZoneSetup: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<DetectionZoneSetupParamList, 'DetectionZoneSetup'>>();
  const {t} = useTranslation();
  const camera = route.params.camera;

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
  const streamUrl = buildStreamUrl(camera?.rtsp_url);

  const {
    webViewRef,
    handleWebViewLoad,
    handleWebViewError,
    handleWebViewHttpError,
    handleWebViewMessage,
    getInjectedJavaScript,
  } = useLiveStream();

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const coordinates = getZoneCoordinates();
      console.log('📍 Detection zone coordinates:', coordinates);
      // TODO: call API lưu detection zone ở đây
      navigation.goBack();
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
    const top = PREVIEW_HEIGHT * 0.3;
    const bottom = PREVIEW_HEIGHT * 0.7;
    setZone({
      topLeft: { x: 0, y: top },
      topRight: { x: PREVIEW_WIDTH, y: top },
      bottomLeft: { x: 0, y: bottom },
      bottomRight: { x: PREVIEW_WIDTH, y: bottom },
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

  useEffect(() => {
    Orientation.lockToLandscape();
    return () => {
      Orientation.lockToPortrait();
    };
  }, []);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backArea} onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" color="#FFFFFF" size={26} />
          </TouchableOpacity>
          <View style={styles.flex1} />
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            <Text style={styles.saveText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        <View style={styles.previewContainer}>
          <WebView
            ref={webViewRef}
            source={{ html: getStreamHTML(streamUrl) }}
            style={styles.cameraPreview}
            onLoad={handleWebViewLoad}
            onError={handleWebViewError}
            onHttpError={handleWebViewHttpError}
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
            originWhitelist={['*']}
            allowFileAccess
            allowUniversalAccessFromFileURLs
            allowsFullscreenVideo
            scalesPageToFit
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
            injectedJavaScript={getInjectedJavaScript()}
          />

          <View
            style={[styles.overlayContainer, { width: PREVIEW_WIDTH, height: PREVIEW_HEIGHT }]}
            pointerEvents="box-none"
          >
            <View style={styles.gridOverlay} pointerEvents="none">
              {renderGrid()}
            </View>

            <View
              pointerEvents="none"
              style={[
                styles.zoneOverlay,
                {
                  top: zone.topLeft.y,
                  left: zone.topLeft.x,
                  width: zone.topRight.x - zone.topLeft.x,
                  height: zone.bottomLeft.y - zone.topLeft.y,
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

            <View style={styles.rightButtons}>
              <TouchableOpacity style={styles.roundButton} onPress={handleDrawRectangle}>
                <Icon name="selection-drag" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.roundButton} onPress={handleReset}>
                <Icon name="trash-can-outline" size={22} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default DetectionZoneSetup;
