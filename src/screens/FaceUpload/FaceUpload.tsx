import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  StatusBar,
  Image,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './FaceUpload.styles';

const FACE_POSITIONS = [
  { key: 'center', label: 'Center' },
  { key: 'left', label: 'Left' },
  { key: 'right', label: 'Right' },
  { key: 'up', label: 'Up' },
  { key: 'down', label: 'Down' },
] as const;

type FacePosition = (typeof FACE_POSITIONS)[number]['key'];

interface FaceData {
  position: FacePosition;
  imageUri: string;
  timestamp: number;
}

const FaceUpload: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { hasPermission, requestPermission } = useCameraPermission();

  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [capturedFaces, setCapturedFaces] = useState<FaceData[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null);

  const device = useCameraDevice('front');
  const camera = useRef<Camera>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;

  const currentPosition = FACE_POSITIONS[currentPositionIndex];

  // Request permission on mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown logic
  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      void handleCaptureFace();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countdown]);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPositionIndex]);

  const getPositionInstruction = (position: FacePosition): string => {
    const instructions: Record<FacePosition, string> = {
      center: t('faceUpload.lookStraight') || 'Look straight ahead',
      left: t('faceUpload.turnLeft') || 'Turn your face LEFT',
      right: t('faceUpload.turnRight') || 'Turn your face RIGHT',
      up: t('faceUpload.lookUp') || 'Tilt your head UP',
      down: t('faceUpload.lookDown') || 'Tilt your head DOWN',
    };
    return instructions[position];
  };

  const startCapture = () => {
    if (isProcessing) return;
    setCountdown(3);

    // Animate frame color
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleCaptureFace = async () => {
    if (isProcessing || !camera.current) {
      setCountdown(null);
      return;
    }

    setIsProcessing(true);
    setCountdown(null);

    try {
      const photo = await camera.current.takePhoto({
        flash: 'off',
      });

      const imageUri = `file://${photo.path}`;

      const faceData: FaceData = {
        position: currentPosition.key,
        imageUri,
        timestamp: Date.now(),
      };

      setCapturedFaces((prev) => [...prev, faceData]);
      setLastCapturedImage(imageUri);
      setShowPreview(true);

      // Success animation
      Animated.sequence([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(800),
        Animated.timing(successAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Progress bar animation
      const progress = ((currentPositionIndex + 1) / FACE_POSITIONS.length) * 100;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();

      // Move to next position or complete
      setTimeout(() => {
        setShowPreview(false);
        if (currentPositionIndex < FACE_POSITIONS.length - 1) {
          setCurrentPositionIndex(currentPositionIndex + 1);
          setIsProcessing(false);
        } else {
          handleComplete([...capturedFaces, faceData]);
        }
      }, 1500);
    } catch (error) {
      console.error('Capture error:', error);
      Alert.alert(
        t('faceUpload.captureError') || 'Capture Error',
        t('faceUpload.tryAgain') || 'Please try again'
      );
      setIsProcessing(false);
      setCountdown(null);
    }
  };

  const handleComplete = (allFaces: FaceData[]) => {
    Alert.alert(
      '✓ ' + (t('faceUpload.complete') || 'Complete'),
      t('faceUpload.allPositionsCaptured') || 'All 5 face positions captured successfully!',
      [
        {
          text: t('common.ok') || 'OK',
          onPress: () => {
            console.log('Captured faces:', allFaces);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleRetake = () => {
    Alert.alert(
      t('faceUpload.retake') || 'Retake?',
      t('faceUpload.retakeConfirm') || 'Do you want to retake this position?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.yes') || 'Yes',
          onPress: () => {
            setCapturedFaces((prev) => prev.slice(0, -1));
            setIsProcessing(false);
            setShowPreview(false);
          },
        },
      ]
    );
  };

  const progressPercentage = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>
            {t('faceUpload.permissionRequired') || 'Camera Permission Required'}
          </Text>
          <Text style={styles.permissionText}>
            {t('faceUpload.cameraPermissionNeeded') ||
              'We need camera access to capture your face for registration'}
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>
              {t('common.grantPermission') || 'Grant Permission'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.errorText}>
            {t('faceUpload.noCamera') || 'No camera device found'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Camera */}
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!showPreview}
        photo={true}
      />

      {/* Preview overlay */}
      {showPreview && lastCapturedImage && (
        <View style={StyleSheet.absoluteFill}>
          <Image source={{ uri: lastCapturedImage }} style={StyleSheet.absoluteFill} />
          <Animated.View
            style={[
              styles.successOverlay,
              {
                opacity: successAnim,
              },
            ]}
          >
            <View style={styles.successBadge}>
              <Text style={styles.successText}>✓</Text>
            </View>
          </Animated.View>
        </View>
      )}

      {/* UI Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                Alert.alert(
                  t('common.cancel') || 'Cancel',
                  t('faceUpload.cancelConfirm') || 'Are you sure you want to cancel?',
                  [
                    { text: t('common.no') || 'No', style: 'cancel' },
                    { text: t('common.yes') || 'Yes', onPress: () => navigation.goBack() },
                  ]
                );
              }}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.title}>{t('faceUpload.title') || 'Face Registration'}</Text>

            <View style={styles.styleWidth} />
          </View>
        </SafeAreaView>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: progressPercentage }]} />
          </View>
          <Text style={styles.progressText}>
            {currentPositionIndex + 1} / {FACE_POSITIONS.length}
          </Text>
        </View>

        {/* Face Frame Container */}
        <View style={styles.faceFrameContainer}>
          <Animated.View
            style={[
              styles.faceFrame,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <FaceFrameSVG countdown={countdown} />
          </Animated.View>

          {/* Position Arrow */}
          {currentPosition.key !== 'center' && <PositionArrow position={currentPosition.key} />}

          {/* Countdown */}
          {countdown !== null && countdown > 0 && (
            <Animated.View
              style={[
                styles.countdownContainer,
                {
                  opacity: fadeAnim,
                  transform: [
                    {
                      scale: fadeAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.countdownText}>{countdown}</Text>
            </Animated.View>
          )}
        </View>

        {/* Instructions */}
        <Animated.View style={[styles.instructionsContainer, { opacity: fadeAnim }]}>
          <Text style={styles.positionLabel}>{currentPosition.label.toUpperCase()}</Text>
          <Text style={styles.instruction}>{getPositionInstruction(currentPosition.key)}</Text>

          {!isProcessing && countdown === null && (
            <Text style={styles.subInstruction}>
              {t('faceUpload.tapWhenReady') || 'Position your face and tap the button'}
            </Text>
          )}
        </Animated.View>

        {/* Position Indicators */}
        <View style={styles.positionsIndicator}>
          {FACE_POSITIONS.map((pos, index) => (
            <View
              key={pos.key}
              style={[
                styles.positionDot,
                index < currentPositionIndex && styles.positionDotCompleted,
                index === currentPositionIndex && styles.positionDotActive,
              ]}
            />
          ))}
        </View>

        {/* Capture Button */}
        <SafeAreaView edges={['bottom']} style={styles.bottomContainer}>
          {!isProcessing && countdown === null && !showPreview && (
            <TouchableOpacity
              style={styles.captureButton}
              onPress={startCapture}
              activeOpacity={0.7}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          )}

          {showPreview && (
            <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
              <Text style={styles.retakeButtonText}>{t('faceUpload.retake') || 'Retake'}</Text>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </View>
    </View>
  );
};

// Face Frame SVG Component
const FaceFrameSVG: React.FC<{ countdown: number | null }> = ({ countdown }) => {
  const color = countdown !== null ? '#4CAF50' : '#FFFFFF';
  const size = 250;
  const strokeWidth = 4;
  const cornerLength = 50;

  return (
    <Svg width={size} height={size * 1.3} viewBox={`0 0 ${size} ${size * 1.3}`}>
      <Defs>
        <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity="1" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </LinearGradient>
      </Defs>

      {/* Top-left corner */}
      <Path
        d={`M ${strokeWidth / 2} ${cornerLength} L ${strokeWidth / 2} ${strokeWidth / 2} L ${cornerLength} ${strokeWidth / 2}`}
        stroke="url(#grad)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Top-right corner */}
      <Path
        d={`M ${size - cornerLength} ${strokeWidth / 2} L ${size - strokeWidth / 2} ${strokeWidth / 2} L ${size - strokeWidth / 2} ${cornerLength}`}
        stroke="url(#grad)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bottom-left corner */}
      <Path
        d={`M ${strokeWidth / 2} ${size * 1.3 - cornerLength} L ${strokeWidth / 2} ${size * 1.3 - strokeWidth / 2} L ${cornerLength} ${size * 1.3 - strokeWidth / 2}`}
        stroke="url(#grad)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Bottom-right corner */}
      <Path
        d={`M ${size - cornerLength} ${size * 1.3 - strokeWidth / 2} L ${size - strokeWidth / 2} ${size * 1.3 - strokeWidth / 2} L ${size - strokeWidth / 2} ${size * 1.3 - cornerLength}`}
        stroke="url(#grad)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Center dot */}
      <Circle cx={size / 2} cy={size * 0.65} r={8} fill={color} opacity={0.8} />
    </Svg>
  );
};

// Position Arrow Component
const PositionArrow: React.FC<{ position: FacePosition }> = ({ position }) => {
  const getArrowStyle = (): any => {
    const base = { position: 'absolute' as const };
    switch (position) {
      case 'left':
        return { ...base, left: 30, top: '50%', marginTop: -30 };
      case 'right':
        return { ...base, right: 30, top: '50%', marginTop: -30 };
      case 'up':
        return { ...base, top: 80, left: '50%', marginLeft: -30 };
      case 'down':
        return { ...base, bottom: 180, left: '50%', marginLeft: -30 };
      default:
        return base;
    }
  };

  const getRotation = () => {
    switch (position) {
      case 'left':
        return '180deg';
      case 'right':
        return '0deg';
      case 'up':
        return '270deg';
      case 'down':
        return '90deg';
      default:
        return '0deg';
    }
  };

  return (
    <View style={[styles.arrow, getArrowStyle()]}>
      <Text style={[styles.arrowText, { transform: [{ rotate: getRotation() }] }]}>→</Text>
    </View>
  );
};

export default FaceUpload;
