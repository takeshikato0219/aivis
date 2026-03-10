import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useInput } from '@hooks/useInput';
import { Camera, useCameraPermission } from 'react-native-vision-camera';
import FaceDetection, { Face } from '@react-native-ml-kit/face-detection';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import BackIcon from '@assets/svg/icon-back.svg';
import TextInput from '@components/TextInput/TextInput';
import { styles } from './FaceUpload.styles';
import faceService, { Member, MemberRelationship } from '@api/faceService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '@constants/theme';
import { DetailFaceNavigationProp, DetailFaceRouteProp } from '@navigation/types';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { useImagePicker } from '@hooks/useImagePicker';
import { ImagePickerModal } from '@components/ImagePickerModal/ImagePickerModal';

// Face position titles for individual image editing
const FACE_POSITION_TITLES = [
  {
    key: 'center',
    getTitle: (t: any) => t('faceUpload.frontView'),
    getInstruction: (t: any) => t('faceUpload.lookStraight'),
  },
  {
    key: 'left',
    getTitle: (t: any) => t('faceUpload.leftSide'),
    getInstruction: (t: any) => t('faceUpload.turnLeft'),
  },
  {
    key: 'right',
    getTitle: (t: any) => t('faceUpload.rightSide'),
    getInstruction: (t: any) => t('faceUpload.turnRight'),
  },
  {
    key: 'up',
    getTitle: (t: any) => t('faceUpload.lookingUp'),
    getInstruction: (t: any) => t('faceUpload.lookUp'),
  },
  {
    key: 'down',
    getTitle: (t: any) => t('faceUpload.lookingDown'),
    getInstruction: (t: any) => t('faceUpload.lookDown'),
  },
] as const;

const FACE_POSITIONS = [
  {
    key: 'center',
    label: 'Center',
    instruction: 'Look straight at the camera',
    scanDuration: 3000,
    prepareTime: 2000,
  },
  {
    key: 'left',
    label: 'Turn Left',
    instruction: 'Slowly turn your head LEFT',
    scanDuration: 3000,
    prepareTime: 2000,
  },
  {
    key: 'right',
    label: 'Turn Right',
    instruction: 'Slowly turn your head RIGHT',
    scanDuration: 3000,
    prepareTime: 2000,
  },
  {
    key: 'up',
    label: 'Look Up',
    instruction: 'Slowly tilt your head UP',
    scanDuration: 3000,
    prepareTime: 2000,
  },
  {
    key: 'down',
    label: 'Look Down',
    instruction: 'Slowly tilt your head DOWN',
    scanDuration: 3000,
    prepareTime: 2000,
  },
] as const;

export const FaceFrameSVG: React.FC<{
  isScanning: boolean;
  scanProgress: number;
  isPreparing: boolean;
}> = ({ isScanning, scanProgress, isPreparing }) => {
  let color: string;
  if (isScanning) {
    color = '#4CAF50';
  } else if (isPreparing) {
    color = '#FFFFFF';
  } else {
    color = '#FFFFFF';
  }
  const size = 250;
  const strokeWidth = 4;
  const cornerLength = 50;

  return (
    <Svg width={size} height={size * 1.3} viewBox={`0 0 ${size} ${size * 1.3}`}>
      <Defs>
        <LinearGradient id="scanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <Stop offset={`${scanProgress}%`} stopColor={color} stopOpacity="1" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.3" />
        </LinearGradient>
        <LinearGradient id="cornerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity="1" />
          <Stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </LinearGradient>
      </Defs>
      {/* Top-left corner */}
      <Path
        d={`M ${strokeWidth / 2} ${cornerLength} L ${strokeWidth / 2} ${strokeWidth / 2} L ${cornerLength} ${strokeWidth / 2}`}
        stroke={isScanning ? 'url(#scanGrad)' : 'url(#cornerGrad)'}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top-right corner */}
      <Path
        d={`M ${size - cornerLength} ${strokeWidth / 2} L ${size - strokeWidth / 2} ${strokeWidth / 2} L ${size - strokeWidth / 2} ${cornerLength}`}
        stroke={isScanning ? 'url(#scanGrad)' : 'url(#cornerGrad)'}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom-left corner */}
      <Path
        d={`M ${strokeWidth / 2} ${size * 1.3 - cornerLength} L ${strokeWidth / 2} ${size * 1.3 - strokeWidth / 2} L ${cornerLength} ${size * 1.3 - strokeWidth / 2}`}
        stroke={isScanning ? 'url(#scanGrad)' : 'url(#cornerGrad)'}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Bottom-right corner */}
      <Path
        d={`M ${size - cornerLength} ${size * 1.3 - strokeWidth / 2} L ${size - strokeWidth / 2} ${size * 1.3 - strokeWidth / 2} L ${size - strokeWidth / 2} ${size * 1.3 - cornerLength}`}
        stroke={isScanning ? 'url(#scanGrad)' : 'url(#cornerGrad)'}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Scanning grid lines */}
      {isScanning && (
        <>
          {[...Array(5)].map((_, i) => (
            <Line
              key={`h-${i}`}
              x1={strokeWidth}
              y1={strokeWidth + (i * (size * 1.3 - strokeWidth * 2)) / 4}
              x2={size - strokeWidth}
              y2={strokeWidth + (i * (size * 1.3 - strokeWidth * 2)) / 4}
              stroke={color}
              strokeWidth={0.5}
              opacity={0.3}
            />
          ))}
          {[...Array(4)].map((_, i) => (
            <Line
              key={`v-${i}`}
              x1={strokeWidth + (i * (size - strokeWidth * 2)) / 3}
              y1={strokeWidth}
              x2={strokeWidth + (i * (size - strokeWidth * 2)) / 3}
              y2={size * 1.3 - strokeWidth}
              stroke={color}
              strokeWidth={0.5}
              opacity={0.3}
            />
          ))}
        </>
      )}
      {/* Center dot */}
      <Circle cx={size / 2} cy={size * 0.65} r={isScanning ? 6 : 8} fill={color} opacity={0.8} />
    </Svg>
  );
};

// Move PositionArrow outside of DetailFace
export const PositionArrow: React.FC<{ position: string }> = ({ position }) => {
  const getArrowStyle = () => {
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

const DetailFace = () => {
  // All hooks must be called at the top level, before any conditional logic or returns
  const navigation = useNavigation<DetailFaceNavigationProp>();
  const route = useRoute<DetailFaceRouteProp>();
  const { t } = useTranslation();
  const { memberId, relationships: routeRelationships } = route.params;

  // Camera and animation refs for single face detection
  const camera = React.useRef<Camera>(null);
  const scanLineAnim = React.useRef(new Animated.Value(0)).current;
  const particleAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const successAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = require('react-native-vision-camera').useCameraDevice('front');

  // Timer refs
  const prepareTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const scanTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Face detection options
  const faceDetectionOptions = {
    performanceMode: 'accurate' as const,
    landmarkMode: 'none' as const,
    contourMode: 'none' as const,
    classificationMode: 'none' as const,
    minFaceSize: Platform.OS === 'ios' ? 0.1 : 0.15,
    trackingEnabled: false,
  };

  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [memberRelationships, setMemberRelationships] = useState<MemberRelationship[]>(
    routeRelationships || []
  );
  const [selectedRelationship, setSelectedRelationship] = useState<MemberRelationship | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [relationshipError, setRelationshipError] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [showSingleDetectModal, setShowSingleDetectModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectProgress, setDetectProgress] = useState(0);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepareProgress, setPrepareProgress] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [changedImageIds, setChangedImageIds] = useState<Set<string>>(new Set());
  const [isSaveDisabled, setIsSaveDisabled] = useState(false);

  // New: track which image index is being edited for upload
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);

  const imagePicker = useImagePicker();

  // Reset loaded data when memberId changes
  useEffect(() => {
    setHasLoadedData(false);
    setIsLoading(true);
    setMember(null);
    setOriginalData(null);
    setSelectedRelationship(null);
    setHasChanges(false);
  }, [memberId]);

  // Original data for comparison
  const [originalData, setOriginalData] = useState<{
    name: string;
    relationship_type_id: string;
  } | null>(null);

  const nameInput = useInput({
    validateFn: (v) => (v.trim() ? undefined : 'required'),
  });

  const fetchMemberDetail = useCallback(async () => {
    if (!memberId || hasLoadedData) return;

    try {
      setIsLoading(true);
      const memberData = await faceService.getMember(memberId);

      if (memberData) {
        setMember(memberData);
        nameInput.setValue(memberData.name);

        setOriginalData({
          name: memberData.name,
          relationship_type_id:
            memberData.relationship?.id ?? memberData.relationship_type_id ?? '',
        });

        // Use relationships from route params
        setMemberRelationships(routeRelationships || []);

        const currentRelationship = (routeRelationships || []).find(
          (r: MemberRelationship) =>
            r.id === (memberData.relationship?.id || memberData.relationship_type_id)
        );
        if (currentRelationship) {
          setSelectedRelationship(currentRelationship);
        }

        setHasLoadedData(true);
      }
    } catch (error) {
      console.error('Failed to fetch member detail:', error);
      Alert.alert(t('common.error') || 'Error', 'Failed to load member details');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memberId, t, hasLoadedData, routeRelationships]);

  useFocusEffect(
    useCallback(() => {
      fetchMemberDetail();
    }, [fetchMemberDetail])
  );

  // Check for changes
  useEffect(() => {
    if (!originalData || !selectedRelationship) return;

    const hasNameChanged = nameInput.value.trim() !== originalData.name;
    const hasRelationshipChanged = selectedRelationship.id !== originalData.relationship_type_id;
    const newHasChanges = hasNameChanged || hasRelationshipChanged;

    // Only update if there's actually a change to avoid unnecessary re-renders
    setHasChanges((prev) => (prev !== newHasChanges ? newHasChanges : prev));
  }, [nameInput.value, selectedRelationship, originalData]);

  // Auto start prepare phase when single detect modal opens
  useEffect(() => {
    if (showSingleDetectModal && selectedImageIndex >= 0) {
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      // Breathing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.03,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start prepare after modal opens with a longer delay
      const initTimer = setTimeout(() => {
        startSinglePrepare();
      }, 1500);

      return () => {
        clearTimeout(initTimer);
        stopSinglePrepare();
        stopSingleScanning();
        fadeAnim.setValue(0);
        scaleAnim.setValue(1);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSingleDetectModal, selectedImageIndex]);

  const handleSave = async () => {
    setIsSaveDisabled(true);
    if (!member || !selectedRelationship) return;

    try {
      setIsUpdating(true);

      const formData = new FormData();
      formData.append('name', nameInput.value.trim());
      formData.append('relationship_type_id', selectedRelationship.id);
      const imageIndices: number[] = [];
      const imageFiles: any[] = [];
      member.images.forEach((image, index) => {
        if (
          image &&
          image.id &&
          changedImageIds.has(image.id) &&
          image.image_url &&
          image.image_url.startsWith('file://')
        ) {
          imageIndices.push(index);
          const positionKey = FACE_POSITION_TITLES[index]?.key || 'center';
          imageFiles.push({
            uri: image.image_url,
            type: 'image/jpeg',
            name: `${positionKey}.jpg`,
          });
        }
      });
      formData.append('sort_orders', imageIndices.join(','));
      imageFiles.forEach((file) => formData.append('images', file));
      console.log(formData);
      await faceService.updateMember(member.id, formData);
      fetchMemberDetail();

      Alert.alert(
        t('common.success') || 'Success',
        t('profile.updateSuccessMessage') || 'Member updated successfully',
        [
          {
            text: t('common.ok') || 'OK',
            onPress: () => {
              setChangedImageIds(new Set());
            },
          },
        ]
      );
      // After successful save
      setIsSaveDisabled(true);
    } catch (error) {
      console.error('Failed to update member:', error);
      Alert.alert(t('common.error') || 'Error', 'Failed to update member details');
      setIsSaveDisabled(false); // Re-enable if error
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(t('faceUpload.deleteMember'), t('faceUpload.deleteMemberConfirmation'), [
      {
        text: 'OK',
        onPress: async () => {
          if (member) {
            const response = await faceService.deleteMemberFace(member.id);
            if (response) navigation.goBack();
          }
        },
      },
      {
        text: t('common.cancel'),
      },
    ]);
  };

  const handleRelationshipSelect = (relationship: MemberRelationship) => {
    setSelectedRelationship(relationship);
    setRelationshipError('');
    setShowDropdown(false);
  };

  // Handle image press to open single face detection modal
  const handleImagePress = (index: number) => {
    setEditingImageIndex(index);
    imagePicker.handleUploadPress();
  };

  useEffect(() => {
    if (
      editingImageIndex !== null &&
      imagePicker.selectedImage &&
      member &&
      member.images &&
      member.images[editingImageIndex]
    ) {
      const updatedImages = [...member.images];
      updatedImages[editingImageIndex] = {
        ...updatedImages[editingImageIndex],
        image_url: imagePicker.selectedImage.uri,
      };
      setMember({ ...member, images: updatedImages });
      setHasChanges(true);
      if (updatedImages[editingImageIndex]?.id) {
        setChangedImageIds((prev) => new Set(prev).add(updatedImages[editingImageIndex].id));
      }
      setEditingImageIndex(null);
      imagePicker.setSelectedImage(null);
    }
  }, [editingImageIndex, imagePicker, member, imagePicker.selectedImage]);

  const getPositionErrorMessage = (position: string): string => {
    switch (position) {
      case 'center':
        return (
          t('faceUpload.pleaseFaceTheCameraStraightAhead') ||
          'Please face the camera straight ahead'
        );
      case 'left':
        return t('faceUpload.pleaseTurnYourFaceToTheLEFT') || 'Please turn your face to the LEFT';
      case 'right':
        return t('faceUpload.pleaseTurnYourFaceToTheRIGHT') || 'Please turn your face to the RIGHT';
      case 'up':
        return t('faceUpload.pleaseTiltYourHeadUP') || 'Please tilt your head UP';
      case 'down':
        return t('faceUpload.pleaseTiltYourHeadDOWN') || 'Please tilt your head DOWN';
      default:
        return (
          t('faceUpload.pleasePositionYourFaceCorrectly') || 'Please position your face correctly'
        );
    }
  };

  // Validate face position based on current position key
  const validateFacePosition = (face: Face, positionKey: string): boolean => {
    // ML Kit returns angles in degrees, not radians
    // Normalize to -180 to 180 range
    const normalizeAngle = (angle: number) => {
      let normalized = angle % 360;
      if (normalized > 180) normalized -= 360;
      if (normalized < -180) normalized += 360;
      return normalized;
    };

    const rotationX = normalizeAngle(face.rotationX);
    const rotationY = normalizeAngle(face.rotationY);
    const rotationThreshold = 15; // degrees

    switch (positionKey) {
      case 'center':
        // Face should be relatively straight
        return Math.abs(rotationX) < rotationThreshold && Math.abs(rotationY) < rotationThreshold;

      case 'left':
        // Face should be turned left (negative Y rotation for front camera)
        return rotationY < -rotationThreshold && Math.abs(rotationX) < rotationThreshold * 2;

      case 'right':
        // Face should be turned right (positive Y rotation for front camera)
        return rotationY > rotationThreshold && Math.abs(rotationX) < rotationThreshold * 2;

      case 'up':
        // Face should be tilted up (positive X rotation for front camera)
        return rotationX > rotationThreshold && Math.abs(rotationY) < rotationThreshold * 2;

      case 'down':
        // Face should be tilted down (negative X rotation for front camera)
        return rotationX < -rotationThreshold && Math.abs(rotationY) < rotationThreshold * 2;

      default:
        return false;
    }
  };

  // Start prepare phase for single face detection
  const startSinglePrepare = () => {
    setIsPreparing(true);
    setPrepareProgress(0);

    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 2000) * 100, 100);
      setPrepareProgress(progress);

      if (progress >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    }, 50);

    prepareTimerRef.current = setTimeout(() => {
      stopSinglePrepare();
      startSingleScanning();
    }, 2000);
  };

  // Stop prepare phase
  const stopSinglePrepare = () => {
    setIsPreparing(false);
    setPrepareProgress(0);

    if (prepareTimerRef.current) {
      clearTimeout(prepareTimerRef.current);
      prepareTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Start scanning phase for single face detection
  const startSingleScanning = () => {
    setIsDetecting(true);
    setDetectProgress(0);

    // Animation effects
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(particleAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Progress tracking
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / 3000) * 100, 100);
      setDetectProgress(progress);

      if (progress >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    }, 50);

    scanTimerRef.current = setTimeout(() => {
      stopSingleScanning();
      handleSingleCaptureFace();
    }, 3000);
  };

  // Stop scanning phase
  const stopSingleScanning = () => {
    setIsDetecting(false);
    scanLineAnim.stopAnimation();
    particleAnim.stopAnimation();
    pulseAnim.stopAnimation();
    scanLineAnim.setValue(0);
    particleAnim.setValue(0);

    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  // Handle single face capture
  const handleSingleCaptureFace = async () => {
    if (isDetecting || !camera.current || !member || isCapturing) {
      return;
    }

    setIsCapturing(true);
    try {
      const photo = await camera.current.takePhoto({
        flash: 'off',
      });

      let imageUri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;

      // iOS: Normalize image orientation
      if (Platform.OS === 'ios') {
        try {
          const resizedImage = await ImageResizer.createResizedImage(
            imageUri,
            1920,
            1920,
            'JPEG',
            100,
            0,
            undefined,
            false
          );
          imageUri = resizedImage.uri;
        } catch (resizeError) {
          console.error('Image resize/normalize error:', resizeError);
        }
      }

      // Detect faces
      const faces = await FaceDetection.detect(imageUri, faceDetectionOptions);
      const positionKey = FACE_POSITION_TITLES[selectedImageIndex]?.key || 'center';

      if (faces.length === 1 && validateFacePosition(faces[0], positionKey)) {
        // Update the image in member data
        const updatedImages = [...member.images];
        updatedImages[selectedImageIndex] = {
          ...updatedImages[selectedImageIndex],
          image_url: imageUri,
        };

        const updatedMember = {
          ...member,
          images: updatedImages,
        };

        setMember(updatedMember);
        setHasChanges(true);
        if (updatedImages[selectedImageIndex]?.id) {
          setChangedImageIds((prev) => new Set(prev).add(updatedImages[selectedImageIndex].id));
        }

        // Success animation
        Animated.sequence([
          Animated.timing(successAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.delay(600),
          Animated.timing(successAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();

        // Close modal after success
        setTimeout(() => {
          handleCloseDetectModal();
        }, 2000);
      } else {
        // Show error based on detection result
        let errorMessage = '';

        if (faces.length === 0) {
          errorMessage = t('faceUpload.noFaceDetected') || 'No face detected';
        } else if (faces.length > 1) {
          errorMessage = t('faceUpload.multipleFacesDetected') || 'Multiple faces detected';
        } else if (faces.length === 1) {
          errorMessage = getPositionErrorMessage(positionKey);
        }

        Alert.alert(t('faceUpload.faceDetectionError') || 'Face Detection Error', errorMessage, [
          {
            text: t('common.cancel') || 'Cancel',
            style: 'cancel',
            onPress: () => {
              handleCloseDetectModal();
            },
          },
          {
            text: t('common.retry') || 'Retry',
            onPress: () => {
              // Stop current processes first
              stopSinglePrepare();
              stopSingleScanning();

              // Reset all states
              setIsDetecting(false);
              setDetectProgress(0);
              setIsPreparing(false);
              setPrepareProgress(0);

              // Restart prepare phase after a short delay
              setTimeout(() => {
                startSinglePrepare();
              }, 500);
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Face capture error:', error);
      Alert.alert(
        t('faceUpload.captureError') || 'Capture Error',
        t('faceUpload.tryAgain') || 'Please try again'
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const handleCloseDetectModal = () => {
    setShowSingleDetectModal(false);
    setSelectedImageIndex(-1);
    setIsPreparing(false);
    setIsDetecting(false);
    setIsCapturing(false);
    setPrepareProgress(0);
    setDetectProgress(0);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
          </TouchableOpacity>
          <View style={styles.viewTitle}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {t('detailFace.detailFace')}
            </Text>
          </View>
          <View style={styles.styleWidth} />
        </View>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.detailContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Member Info */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>{t('faceUpload.name') || 'Name'}</Text>
            <TextInput
              value={nameInput.value}
              onChangeText={nameInput.handleChange}
              placeholder={t('faceUpload.enterName') || 'Enter name'}
              autoCapitalize="words"
              error={!!nameInput.error}
              style={styles.detailInput}
              placeholderTextColor={COLORS.BBBBBB}
            />
            {nameInput.error && (
              <Text style={styles.errorInputText}>
                {t('validate.' + nameInput.error) || 'This field is required'}
              </Text>
            )}
          </View>

          {/* Relationship Type */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>
              {t('faceUpload.memberRelationship') || 'Member Relationship'}
            </Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowDropdown(true)}
              disabled={isLoading}
            >
              <Text
                style={[
                  styles.dropdownButtonText,
                  !selectedRelationship && styles.dropdownPlaceholder,
                ]}
              >
                {selectedRelationship?.name_trans ||
                  t('faceUpload.selectRelationship') ||
                  'Select relationship'}
              </Text>
              <Icon name="chevron-down" size={24} color="#fff" />
            </TouchableOpacity>
            {relationshipError && (
              <Text style={styles.errorInputText}>{t('validate.' + relationshipError)}</Text>
            )}
          </View>

          {/* Images Section */}
          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>{t('faceUpload.images') || 'Images'}</Text>
            <View style={styles.imagesGrid}>
              {[0, 1, 2, 3, 4].map((index) => {
                const images = member?.images || [];

                const image = images.find((img) => img.sort_order === index);

                const positionTitle = FACE_POSITION_TITLES[index];
                return (
                  <View key={image?.id || index} style={styles.imageItemContainer}>
                    <Text style={styles.imageTitle}>
                      {index + 1}. {positionTitle?.getTitle(t) || `Position ${index + 1}`}
                    </Text>
                    <TouchableOpacity
                      style={styles.imageItem}
                      onPress={() => handleImagePress(index)}
                    >
                      {image?.image_url ? (
                        <>
                          <Image
                            source={{ uri: image.image_url }}
                            style={styles.imagePreview}
                            resizeMode="cover"
                          />
                          <View style={styles.imageOverlay}>
                            <Icon name="pencil" size={20} color="#fff" />
                            <Text style={styles.imageIndex}>{index + 1}</Text>
                          </View>
                        </>
                      ) : (
                        <View style={styles.imageOverlay}>
                          <Icon name="plus" size={32} color="#ccc" />
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
            <Text style={styles.imageNote}>
              {t('faceUpload.tapToEditImage') || 'Tap on image to edit'}
            </Text>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              (!hasChanges || isUpdating || isSaveDisabled) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!hasChanges || isUpdating || isSaveDisabled}
          >
            {isUpdating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="content-save" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>{t('common.save') || 'Save'}</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            {isUpdating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name="delete-circle" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>{t('common.delete')}</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>

        {/* Relationship Dropdown Modal */}
        <Modal
          visible={showDropdown}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDropdown(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDropdown(false)}
          >
            <View style={styles.dropdownModal}>
              <View style={styles.dropdownHeader}>
                <Text style={styles.dropdownTitle}>
                  {t('faceUpload.selectRelationship') || 'Select Relationship'}
                </Text>
                <TouchableOpacity onPress={() => setShowDropdown(false)}>
                  <Icon name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              <FlatList
                data={memberRelationships}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      selectedRelationship?.id === item.id && styles.dropdownItemActive,
                    ]}
                    onPress={() => handleRelationshipSelect(item)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        selectedRelationship?.id === item.id && styles.dropdownItemTextActive,
                      ]}
                    >
                      {item.name_trans}
                    </Text>
                    {selectedRelationship?.id === item.id && (
                      <Icon name="check" size={20} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyList}>
                    <Text style={styles.emptyListText}>
                      {t('faceUpload.noRelationships') || 'No relationships available'}
                    </Text>
                  </View>
                }
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Single Face Detection Modal */}
        <Modal
          visible={showSingleDetectModal}
          animationType="fade"
          onRequestClose={() => handleCloseDetectModal()}
        >
          <View style={styles.container}>
            {!hasPermission ? (
              <View style={styles.permissionContainer}>
                <Text style={styles.permissionTitle}>
                  {t('faceUpload.cameraPermission') || 'Camera Permission Required'}
                </Text>
                <Text style={styles.permissionText}>
                  {t('faceUpload.cameraPermissionDesc') ||
                    'Please grant camera permission to capture face images'}
                </Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                  <Text style={styles.permissionButtonText}>
                    {t('faceUpload.grantPermission') || 'Grant Permission'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : !device ? (
              <View style={styles.permissionContainer}>
                <Text style={styles.permissionTitle}>
                  {t('faceUpload.noCamera') || 'No Camera Found'}
                </Text>
                <Text style={styles.permissionText}>
                  {t('faceUpload.noCameraDesc') || 'Unable to access camera device'}
                </Text>
              </View>
            ) : (
              <View style={styles.container}>
                {/* Camera */}
                <Camera
                  ref={camera}
                  style={styles.absoluteFill}
                  device={device}
                  isActive={showSingleDetectModal}
                  photo={true}
                />

                <View style={styles.overlay}>
                  {/* Header */}
                  <SafeAreaView edges={['top']}>
                    <View style={styles.header}>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={handleCloseDetectModal}
                        disabled={isCapturing}
                      >
                        <Text style={styles.closeButtonText}>✕</Text>
                      </TouchableOpacity>

                      <Text style={styles.title}>
                        {selectedImageIndex >= 0 && FACE_POSITION_TITLES[selectedImageIndex]
                          ? FACE_POSITION_TITLES[selectedImageIndex].getTitle(t)
                          : t('faceUpload.editImage') || 'Edit Image'}
                      </Text>

                      <View style={styles.styleWidth} />
                    </View>
                  </SafeAreaView>

                  <View style={styles.faceFrameContainer}>
                    <Animated.View
                      style={[
                        styles.faceFrame,
                        {
                          transform: [{ scale: scaleAnim }],
                        },
                      ]}
                    >
                      {isPreparing && (
                        <View style={styles.holdProgressRing}>
                          <Svg width={270} height={351} viewBox="0 0 270 351">
                            <Circle
                              cx={135}
                              cy={175.5}
                              r={130}
                              stroke="rgba(255, 255, 255, 0.2)"
                              strokeWidth={4}
                              fill="none"
                            />
                            <Circle
                              cx={135}
                              cy={175.5}
                              r={130}
                              stroke="#FFFFFF"
                              strokeWidth={4}
                              fill="none"
                              strokeDasharray={2 * Math.PI * 130}
                              strokeDashoffset={2 * Math.PI * 130 * (1 - prepareProgress / 100)}
                              strokeLinecap="round"
                              transform="rotate(-90 135 175.5)"
                            />
                          </Svg>
                        </View>
                      )}

                      {/* Scanning Line */}
                      {isDetecting && (
                        <Animated.View
                          style={[
                            styles.scanLine,
                            {
                              transform: [
                                {
                                  translateY: scanLineAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-162.5, 162.5],
                                  }),
                                },
                              ],
                            },
                          ]}
                        >
                          <View style={styles.scanLineGlow} />
                        </Animated.View>
                      )}

                      {/* Scanning Particles */}
                      {isDetecting && (
                        <Animated.View
                          style={[
                            styles.scanParticles,
                            {
                              opacity: particleAnim.interpolate({
                                inputRange: [0, 0.5, 1],
                                outputRange: [0.3, 1, 0.3],
                              }),
                            },
                          ]}
                        >
                          {[...Array(8)].map((_, i) => (
                            <View
                              key={i}
                              style={[
                                styles.particle,
                                {
                                  left: `${i * 12.5 + 6}%`,
                                  top: `${20 + Math.sin(i) * 30}%`,
                                },
                              ]}
                            />
                          ))}
                        </Animated.View>
                      )}

                      <FaceFrameSVG
                        isScanning={isDetecting}
                        scanProgress={detectProgress}
                        isPreparing={isPreparing}
                      />

                      {/* Corner Indicators with Pulse */}
                      {isDetecting && (
                        <Animated.View
                          style={[
                            styles.cornerIndicators,
                            {
                              transform: [{ scale: pulseAnim }],
                            },
                          ]}
                        >
                          {/* eslint-disable-next-line react-native/no-inline-styles */}
                          <View style={[styles.cornerDot, { top: 10, left: 10 }]} />
                          {/* eslint-disable-next-line react-native/no-inline-styles */}
                          <View style={[styles.cornerDot, { top: 10, right: 10 }]} />
                          {/* eslint-disable-next-line react-native/no-inline-styles */}
                          <View style={[styles.cornerDot, { bottom: 10, left: 10 }]} />
                          {/* eslint-disable-next-line react-native/no-inline-styles */}
                          <View style={[styles.cornerDot, { bottom: 10, right: 10 }]} />
                        </Animated.View>
                      )}

                      {/* Success Badge */}
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
                    </Animated.View>

                    {/* Position Arrow */}
                    {selectedImageIndex >= 0 &&
                      FACE_POSITIONS[selectedImageIndex]?.key !== 'center' &&
                      !isCapturing && (
                        <PositionArrow position={FACE_POSITIONS[selectedImageIndex].key} />
                      )}
                  </View>

                  {/* Instructions */}
                  <Animated.View style={[styles.instructionsContainer, { opacity: fadeAnim }]}>
                    {selectedImageIndex >= 0 && FACE_POSITIONS[selectedImageIndex] && (
                      <>
                        <Text style={styles.positionLabel}>
                          {FACE_POSITIONS[selectedImageIndex].label.toUpperCase()}
                        </Text>
                        <Text style={styles.instruction}>
                          {FACE_POSITIONS[selectedImageIndex].instruction}
                        </Text>
                      </>
                    )}

                    {/* Status */}
                    {isPreparing && (
                      <View style={styles.feedbackContainer}>
                        <Text style={styles.feedbackText}>
                          {t('faceUpload.getReady') || 'Get ready...'}
                        </Text>
                      </View>
                    )}

                    {isDetecting && (
                      <View style={styles.scanProgressContainer}>
                        <Text style={styles.scanProgressText}>
                          {t('faceUpload.scanning') || 'Scanning'}: {Math.round(detectProgress)}%
                        </Text>
                        <View style={styles.miniProgressBar}>
                          <View
                            style={[styles.miniProgressFill, { width: `${detectProgress}%` }]}
                          />
                        </View>
                      </View>
                    )}
                  </Animated.View>
                </View>
              </View>
            )}
          </View>
        </Modal>
      </SafeAreaView>
      <ImagePickerModal
        visible={imagePicker.showImagePicker}
        slideAnim={imagePicker.slideAnim}
        opacityAnim={imagePicker.opacityAnim}
        onClose={() => {
          imagePicker.closeModal();
          setEditingImageIndex(null);
        }}
        onTakePhoto={() => {
          imagePicker.closeModal();
          if (!hasPermission) {
            requestPermission();
            return;
          }
          setIsPreparing(false);
          setIsDetecting(false);
          setIsCapturing(false);
          setPrepareProgress(0);
          setDetectProgress(0);
          setSelectedImageIndex(editingImageIndex ?? -1);
          setShowSingleDetectModal(true);
        }}
        onChooseFromLibrary={imagePicker.handleChooseFromLibrary}
      />
    </View>
  );
};

export default DetailFace;
