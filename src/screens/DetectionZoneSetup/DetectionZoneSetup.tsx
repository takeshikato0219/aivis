import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  PanResponder,
  Animated,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Polygon, Line } from 'react-native-svg';
import DetectionZoneSetupBackground from '@assets/png/detect-zone-background.png';
import BackIcon from '@assets/svg/icon-back.svg';
import { styles } from './DetectionZoneSetup.styles';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Camera preview size
const PREVIEW_WIDTH = SCREEN_WIDTH - 32;
const PREVIEW_HEIGHT = (PREVIEW_WIDTH * 9) / 16; // 16:9 aspect ratio

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

const DetectionZoneSetup: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { cameraId, cameraSnapshot } = route.params as any;

  // Initial zone (center rectangle)
  const [zone, setZone] = useState<DetectionZone>({
    topLeft: { x: PREVIEW_WIDTH * 0.2, y: PREVIEW_HEIGHT * 0.3 },
    topRight: { x: PREVIEW_WIDTH * 0.8, y: PREVIEW_HEIGHT * 0.3 },
    bottomLeft: { x: PREVIEW_WIDTH * 0.2, y: PREVIEW_HEIGHT * 0.7 },
    bottomRight: { x: PREVIEW_WIDTH * 0.8, y: PREVIEW_HEIGHT * 0.7 },
  });

  const [activeCorner, setActiveCorner] = useState<keyof DetectionZone | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Create pan responder for each corner
  const createPanResponder = (corner: keyof DetectionZone) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setActiveCorner(corner);
      },
      onPanResponderMove: (_, gestureState) => {
        const newX = Math.max(0, Math.min(PREVIEW_WIDTH, zone[corner].x + gestureState.dx));
        const newY = Math.max(0, Math.min(PREVIEW_HEIGHT, zone[corner].y + gestureState.dy));

        setZone((prev) => ({
          ...prev,
          [corner]: { x: newX, y: newY },
        }));
      },
      onPanResponderRelease: () => {
        setActiveCorner(null);
      },
    });
  };

  const panResponders = {
    topLeft: createPanResponder('topLeft'),
    topRight: createPanResponder('topRight'),
    bottomLeft: createPanResponder('bottomLeft'),
    bottomRight: createPanResponder('bottomRight'),
  };

  // Convert coordinates to percentage (0-1) for server
  const getZoneCoordinates = () => {
    return {
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
    };
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const coordinates = getZoneCoordinates();

      console.log('📍 Detection zone coordinates:', coordinates);

      // API call to save detection zone
      const response = await fetch(`https://your-api. com/cameras/${cameraId}/detection-zone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cameraId,
          zone: coordinates,
        }),
      });

      if (response.ok) {
        console.log('✅ Detection zone saved');
        navigation.goBack();
      } else {
        console.error('❌ Failed to save detection zone');
      }
    } catch (error) {
      console.error('❌ Error saving detection zone:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setZone({
      topLeft: { x: PREVIEW_WIDTH * 0.2, y: PREVIEW_HEIGHT * 0.3 },
      topRight: { x: PREVIEW_WIDTH * 0.8, y: PREVIEW_HEIGHT * 0.3 },
      bottomLeft: { x: PREVIEW_WIDTH * 0.2, y: PREVIEW_HEIGHT * 0.7 },
      bottomRight: { x: PREVIEW_WIDTH * 0.8, y: PREVIEW_HEIGHT * 0.7 },
    });
  };

  const handleDrawRectangle = () => {
    // Auto draw rectangle mode
    const centerX = PREVIEW_WIDTH / 2;
    const centerY = PREVIEW_HEIGHT / 2;
    const width = PREVIEW_WIDTH * 0.6;
    const height = PREVIEW_HEIGHT * 0.4;

    setZone({
      topLeft: { x: centerX - width / 2, y: centerY - height / 2 },
      topRight: { x: centerX + width / 2, y: centerY - height / 2 },
      bottomLeft: { x: centerX - width / 2, y: centerY + height / 2 },
      bottomRight: { x: centerX + width / 2, y: centerY + height / 2 },
    });
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={DetectionZoneSetupBackground}
        style={styles.backgroundImage}
        resizeMode="stretch"
        imageStyle={styles.imageStyle}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>検知エリア設定</Text>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.saveButtonText}>{isSaving ? '保存中...' : '保存'}</Text>
            </TouchableOpacity>
          </View>

          {/* Camera Preview with Zone Overlay */}
          <View style={styles.previewContainer}>
            <View style={styles.previewWrapper}>
              {/* Camera snapshot */}
              <Image
                source={{ uri: cameraSnapshot || 'https://via.placeholder.com/800x450' }}
                style={styles.cameraPreview}
                resizeMode="cover"
              />

              {/* SVG Overlay for drawing zone */}
              <Svg
                width={PREVIEW_WIDTH}
                height={PREVIEW_HEIGHT}
                style={[StyleSheet.absoluteFill, styles.drawingZone]}
              >
                {/* Detection zone polygon */}
                <Polygon
                  points={`${zone.topLeft.x},${zone.topLeft.y} ${zone.topRight.x},${zone.topRight.y} ${zone.bottomRight.x},${zone.bottomRight.y} ${zone.bottomLeft.x},${zone.bottomLeft.y}`}
                  fill="rgba(0,255,170,0.2)"
                  stroke="#00FFAA"
                  strokeWidth="2"
                  strokeDasharray="8,4"
                />

                {/* Grid lines */}
                <Line
                  x1={zone.topLeft.x}
                  y1={zone.topLeft.y}
                  x2={zone.topRight.x}
                  y2={zone.topRight.y}
                  stroke="#00FFAA"
                  strokeWidth="2"
                />
                <Line
                  x1={zone.topRight.x}
                  y1={zone.topRight.y}
                  x2={zone.bottomRight.x}
                  y2={zone.bottomRight.y}
                  stroke="#00FFAA"
                  strokeWidth="2"
                />
                <Line
                  x1={zone.bottomRight.x}
                  y1={zone.bottomRight.y}
                  x2={zone.bottomLeft.x}
                  y2={zone.bottomLeft.y}
                  stroke="#00FFAA"
                  strokeWidth="2"
                />
                <Line
                  x1={zone.bottomLeft.x}
                  y1={zone.bottomLeft.y}
                  x2={zone.topLeft.x}
                  y2={zone.topLeft.y}
                  stroke="#00FFAA"
                  strokeWidth="2"
                />
              </Svg>

              {/* Instruction */}
              <View style={styles.instructionBanner}>
                <View style={styles.instructionBox}>
                  <Text style={styles.instructionText}>
                    ポイントをドラッグしてエリアを設定してください
                  </Text>
                </View>
              </View>

              {/* Draggable corners */}
              {(Object.keys(zone) as Array<keyof DetectionZone>).map((corner) => (
                <Animated.View
                  key={corner}
                  style={[
                    styles.cornerHandle,
                    {
                      left: zone[corner].x - 16,
                      bottom: PREVIEW_HEIGHT - zone[corner].y - 16, // Tính từ bottom
                      transform: [{ scale: activeCorner === corner ? 1.3 : 1 }],
                    },
                  ]}
                  {...panResponders[corner].panHandlers}
                >
                  <View style={styles.cornerDot} />
                  <View style={styles.cornerRing} />
                </Animated.View>
              ))}

              {/* Fullscreen button */}
              <TouchableOpacity style={styles.fullscreenButton}>
                <Icon name="fullscreen" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        {/* Bottom Controls - OUTSIDE SafeAreaView để full width */}
        <View style={styles.bottomControlsWrapper}>
          <View style={styles.bottomControls}>
            {/* 描画 - Draw */}
            <TouchableOpacity style={styles.controlButton} onPress={handleDrawRectangle}>
              <View style={styles.controlIconContainer}>
                <Icon name="pencil" size={24} color="#00FFAA" />
              </View>
              <Text style={styles.controlLabel}>描画</Text>
            </TouchableOpacity>

            {/* 消去 - Clear */}
            <TouchableOpacity style={styles.controlButton} onPress={handleReset}>
              <View style={styles.controlIconContainer}>
                <Icon name="broom" size={24} color="#00FFAA" />
              </View>
              <Text style={styles.controlLabel}>消去</Text>
            </TouchableOpacity>

            {/* エリア追加 - Add Area */}
            <TouchableOpacity style={styles.controlButton} onPress={handleDrawRectangle}>
              <View style={[styles.controlIconContainer, styles.primaryButton]}>
                <Icon name="plus" size={28} color="#0A1A23" />
              </View>
              <Text style={styles.controlLabel}>エリア追加</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

export default DetectionZoneSetup;
