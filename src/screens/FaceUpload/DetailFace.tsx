import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useInput } from '@hooks/useInput';
import { Camera, useCameraPermission } from 'react-native-vision-camera';
import FaceDetection, { Face } from '@react-native-ml-kit/face-detection';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import BackIcon from '@assets/svg/icon-back.svg';
import TextInput from '@components/TextInput/TextInput';
import { styles } from './FaceUpload.styles';
import faceService, { Member, MemberRelationship } from '@/services/faceService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '@constants/theme';
import { DetailFaceNavigationProp, DetailFaceRouteProp } from '@navigation/types';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { useImagePicker } from '@hooks/useImagePicker';
import { ImagePickerModal } from '@components/ImagePickerModal/ImagePickerModal';
import { getApiErrorDisplayMessage } from '@utils/errorHandler';

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
  const navigation = useNavigation<DetailFaceNavigationProp>();
  const route = useRoute<DetailFaceRouteProp>();
  const { t } = useTranslation();
  const { memberId, relationships: routeRelationships } = route.params;

  const camera = React.useRef<Camera>(null);
  const scanLineAnim = React.useRef(new Animated.Value(0)).current;
  const particleAnim = React.useRef(new Animated.Value(0)).current;
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const successAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = require('react-native-vision-camera').useCameraDevice('front');

  const prepareTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const scanTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // landmarkMode: 'all' required for ML Kit to return Euler angles (rotationX, rotationY)
  // needed to validate left/right/up/down face positions
  const faceDetectionOptions = {
    performanceMode: 'accurate' as const,
    landmarkMode: 'all' as const,
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

  const [changedImageIndices, setChangedImageIndices] = useState<Set<number>>(new Set());

  const [isSaveDisabled, setIsSaveDisabled] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);

  const imagePicker = useImagePicker();

  const FACE_POSITIONS = [
    {
      key: 'center',
      label: t('faceUpload.center'),
      instruction: t('faceUpload.lookStraightAtTheCamera'),
      scanDuration: 3000,
      prepareTime: 2000,
    },
    {
      key: 'left',
      label: t('faceUpload.turnLeftFace'),
      instruction: t('faceUpload.slowlyTurnYourHeadLEFT'),
      scanDuration: 3000,
      prepareTime: 2000,
    },
    {
      key: 'right',
      label: t('faceUpload.turnRightFace'),
      instruction: t('faceUpload.slowlyTurnYourHeadRIGHT'),
      scanDuration: 3000,
      prepareTime: 2000,
    },
    {
      key: 'up',
      label: t('faceUpload.lookUpFace'),
      instruction: t('faceUpload.slowlyTiltYourHeadUP'),
      scanDuration: 3000,
      prepareTime: 2000,
    },
    {
      key: 'down',
      label: t('faceUpload.lookDownFace'),
      instruction: t('faceUpload.slowlyTiltYourHeadDOWN'),
      scanDuration: 3000,
      prepareTime: 2000,
    },
  ] as const;

  useEffect(() => {
    setHasLoadedData(false);
    setIsLoading(true);
    setMember(null);
    setOriginalData(null);
    setSelectedRelationship(null);
    setHasChanges(false);
    // ✅ Reset changed indices khi đổi member
    setChangedImageIndices(new Set());
  }, [memberId]);

  const [originalData, setOriginalData] = useState<{
    name: string;
    relationship_type_id: string;
  } | null>(null);

  const nameInput = useInput({
    validateFn: (v) => (v.trim() ? undefined : 'required'),
  });

  function ensureFiveImageSlots(images: any[] = []) {
    return Array.from({ length: 5 }, (_, i) => {
      const found = images.find((img) => img && img.sort_order === i);
      return found || { sort_order: i, image_url: '', id: undefined };
    });
  }

  const fetchMemberDetail = useCallback(async () => {
    if (!memberId || hasLoadedData) return;

    try {
      setIsLoading(true);
      const memberData = await faceService.getMember(memberId);

      if (memberData) {
        memberData.images = ensureFiveImageSlots(memberData.images);

        setMember(memberData);
        nameInput.setValue(memberData.name);

        setOriginalData({
          name: memberData.name,
          relationship_type_id:
            memberData.relationship?.id ?? memberData.relationship_type_id ?? '',
        });

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

  useEffect(() => {
    if (!originalData || !selectedRelationship) return;

    const hasNameChanged = nameInput.value.trim() !== originalData.name;
    const hasRelationshipChanged = selectedRelationship.id !== originalData.relationship_type_id;
    // ✅ Cũng check changedImageIndices
    const hasImageChanged = changedImageIndices.size > 0;
    const newHasChanges = hasNameChanged || hasRelationshipChanged || hasImageChanged;

    setHasChanges((prev) => (prev !== newHasChanges ? newHasChanges : prev));
  }, [nameInput.value, selectedRelationship, originalData, changedImageIndices]);

  useEffect(() => {
    if (showSingleDetectModal && selectedImageIndex >= 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

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
        const isChanged = changedImageIndices.has(index);
        const uri = image?.image_url ?? '';

        const isLocalUri =
          uri.length > 0 && !uri.startsWith('http://') && !uri.startsWith('https://');

        if (isChanged && isLocalUri) {
          imageIndices.push(index);
          const positionKey = FACE_POSITION_TITLES[index]?.key || 'center';
          imageFiles.push({
            uri,
            type: 'image/jpeg',
            name: `${positionKey}.jpg`,
          });
        }
      });

      if (imageFiles.length > 0) {
        formData.append('sort_orders', imageIndices.join(','));
      }
      imageFiles.forEach((file) => formData.append('images', file));
      await faceService.updateMember(member.id, formData);

      setChangedImageIndices(new Set());
      setHasLoadedData(false);
      fetchMemberDetail();

      Alert.alert(
        t('common.success') || 'Success',
        t('profile.updateSuccessMessage') || 'Member updated successfully',
        [
          {
            text: t('common.ok') || 'OK',
            onPress: () => {},
          },
        ]
      );
      setIsSaveDisabled(true);
    } catch (error) {
      console.error('Failed to update member:', error);
      const displayMessage = getApiErrorDisplayMessage(error);
      Alert.alert('', displayMessage, [
        {
          text: t('common.ok') || 'OK',
        },
      ]);
      setIsSaveDisabled(false);
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

  const handleImagePress = (index: number) => {
    setEditingImageIndex(index);
    imagePicker.handleUploadPress();
  };

  useEffect(() => {
    if (editingImageIndex !== null && imagePicker.selectedImage && member) {
      const updatedImages = ensureFiveImageSlots(member.images);
      updatedImages[editingImageIndex] = {
        ...updatedImages[editingImageIndex],
        image_url: imagePicker.selectedImage.uri,
      };
      setMember({ ...member, images: updatedImages });
      setHasChanges(true);

      setChangedImageIndices((prev) => new Set(prev).add(editingImageIndex));

      imagePicker.setSelectedImage(null);
      setEditingImageIndex(null);
    }
  }, [editingImageIndex, imagePicker.selectedImage, imagePicker, member]);

  useEffect(() => {
    if (!showSingleDetectModal) {
      setImageLoading((prev) => {
        const next = [...prev];
        if (editingImageIndex !== null) {
          next[editingImageIndex] = false;
        }
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSingleDetectModal]);

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

  const validateFacePosition = (face: Face, positionKey: string): boolean => {
    const rotX = face.rotationX ?? 0;
    const rotY = face.rotationY ?? 0;
    if (rotX === 0 && rotY === 0 && positionKey !== 'center') {
      return false;
    }
    const normalizeAngle = (angle: number) => {
      let normalized = angle % 360;
      if (normalized > 180) normalized -= 360;
      if (normalized < -180) normalized += 360;
      return normalized;
    };

    const rotationX = normalizeAngle(rotX);
    const rotationY = normalizeAngle(rotY);
    const rotationThreshold = 15;

    switch (positionKey) {
      case 'center':
        return Math.abs(rotationX) < rotationThreshold && Math.abs(rotationY) < rotationThreshold;
      case 'left':
        return rotationY < -rotationThreshold && Math.abs(rotationX) < rotationThreshold * 2;
      case 'right':
        return rotationY > rotationThreshold && Math.abs(rotationX) < rotationThreshold * 2;
      case 'up':
        return rotationX > rotationThreshold && Math.abs(rotationY) < rotationThreshold * 2;
      case 'down':
        return rotationX < -rotationThreshold && Math.abs(rotationY) < rotationThreshold * 2;
      default:
        return false;
    }
  };

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

  const startSingleScanning = () => {
    setIsDetecting(true);
    setDetectProgress(0);

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
      let imgWidth: number | null = null;
      let imgHeight: number | null = null;

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
          imgWidth = resizedImage.width;
          imgHeight = resizedImage.height;
        } catch (resizeError) {
          console.error('Image resize error:', resizeError);
        }
      } else {
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
          console.error('Image resize error:', resizeError);
        }
      }

      const allFaces = await FaceDetection.detect(imageUri, faceDetectionOptions);
      const positionKey = FACE_POSITION_TITLES[selectedImageIndex]?.key || 'center';

      // Validation params per position (same as FaceUpload.tsx)
      const FRAME_MARGIN = positionKey === 'center' ? 0.15 : 0.12;
      const MIN_OVERLAP_RATIO = positionKey === 'center' ? 0.8 : 0.75;
      const MIN_FACE_RATIO = 0.1;
      const MAX_FACE_RATIO = 0.9;

      const filterFacesInFrame = (
        width: number,
        height: number,
        frameLeft: number,
        frameTop: number,
        frameRight: number,
        frameBottom: number
      ): Face[] => {
        return allFaces.filter((face) => {
          const fl = face.frame.left;
          const ft = face.frame.top;
          const fr = face.frame.left + face.frame.width;
          const fb = face.frame.top + face.frame.height;
          const overlapLeft = Math.max(fl, frameLeft);
          const overlapTop = Math.max(ft, frameTop);
          const overlapRight = Math.min(fr, frameRight);
          const overlapBottom = Math.min(fb, frameBottom);
          const overlapW = Math.max(0, overlapRight - overlapLeft);
          const overlapH = Math.max(0, overlapBottom - overlapTop);
          const overlapRatioW = overlapW / face.frame.width;
          const overlapRatioH = overlapH / face.frame.height;
          const enoughInFrame =
            overlapRatioW >= MIN_OVERLAP_RATIO && overlapRatioH >= MIN_OVERLAP_RATIO;
          if (!enoughInFrame) return false;
          const faceSizeRatio = Math.max(face.frame.width / width, face.frame.height / height);
          return faceSizeRatio >= MIN_FACE_RATIO && faceSizeRatio <= MAX_FACE_RATIO;
        });
      };

      const runFilterWithDimensions = (width: number, height: number): Face[] => {
        const marginX = width * FRAME_MARGIN;
        const marginY = height * FRAME_MARGIN;
        return filterFacesInFrame(
          width,
          height,
          marginX,
          marginY,
          width - marginX,
          height - marginY
        );
      };

      let faces: Face[];
      let usedWidth: number | null = null;
      let usedHeight: number | null = null;

      if (Platform.OS === 'ios') {
        if (imgWidth != null && imgHeight != null) {
          faces = runFilterWithDimensions(imgWidth, imgHeight);
          if (faces.length === 0 && allFaces.length > 0) {
            faces = runFilterWithDimensions(imgHeight, imgWidth);
            if (faces.length > 0) {
              usedWidth = imgHeight;
              usedHeight = imgWidth;
            } else {
              usedWidth = imgWidth;
              usedHeight = imgHeight;
            }
          } else if (faces.length > 0 || allFaces.length > 0) {
            usedWidth = imgWidth;
            usedHeight = imgHeight;
          }
        } else {
          faces = [];
        }
      } else {
        faces = await new Promise<Face[]>((resolve) => {
          Image.getSize(
            imageUri,
            (w, h) => {
              usedWidth = w;
              usedHeight = h;
              resolve(runFilterWithDimensions(w, h));
            },
            () => resolve([])
          );
        });
      }

      const getFrameRejectionReason = (): string | null => {
        if (allFaces.length === 0 || allFaces.length > 1) return null;
        if (usedWidth == null || usedHeight == null) return t('faceUpload.faceOutsideFrame');
        const face = allFaces[0];
        const marginX = usedWidth * FRAME_MARGIN;
        const marginY = usedHeight * FRAME_MARGIN;
        const frameLeft = marginX;
        const frameTop = marginY;
        const frameRight = usedWidth - marginX;
        const frameBottom = usedHeight - marginY;
        const fl = face.frame.left;
        const ft = face.frame.top;
        const fr = face.frame.left + face.frame.width;
        const fb = face.frame.top + face.frame.height;
        const overlapLeft = Math.max(fl, frameLeft);
        const overlapTop = Math.max(ft, frameTop);
        const overlapRight = Math.min(fr, frameRight);
        const overlapBottom = Math.min(fb, frameBottom);
        const overlapW = Math.max(0, overlapRight - overlapLeft);
        const overlapH = Math.max(0, overlapBottom - overlapTop);
        const overlapRatioW = overlapW / face.frame.width;
        const overlapRatioH = overlapH / face.frame.height;
        const enoughInFrame =
          overlapRatioW >= MIN_OVERLAP_RATIO && overlapRatioH >= MIN_OVERLAP_RATIO;
        if (!enoughInFrame) return t('faceUpload.faceOutsideFrame');
        const faceSizeRatio = Math.max(
          face.frame.width / usedWidth,
          face.frame.height / usedHeight
        );
        if (faceSizeRatio < MIN_FACE_RATIO) return t('faceUpload.faceTooFar');
        if (faceSizeRatio > MAX_FACE_RATIO) return t('faceUpload.faceTooClose');
        return null;
      };

      if (faces.length === 1 && validateFacePosition(faces[0], positionKey)) {
        const updatedImages = ensureFiveImageSlots(member.images);
        updatedImages[selectedImageIndex] = {
          ...updatedImages[selectedImageIndex],
          image_url: imageUri,
        };

        setMember({ ...member, images: updatedImages });
        setHasChanges(true);

        setChangedImageIndices((prev) => new Set(prev).add(selectedImageIndex));

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

        setTimeout(() => {
          handleCloseDetectModal();
        }, 2000);
      } else {
        let errorMessage = '';

        if (faces.length === 0) {
          errorMessage =
            allFaces.length > 0
              ? (getFrameRejectionReason() ?? t('faceUpload.faceOutsideFrame'))
              : t('faceUpload.noFaceDetected') || 'No face detected';
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
              stopSinglePrepare();
              stopSingleScanning();
              setIsDetecting(false);
              setDetectProgress(0);
              setIsPreparing(false);
              setPrepareProgress(0);
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

  const [imageLoading, setImageLoading] = useState<boolean[]>([false, false, false, false, false]);

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
            <Text style={styles.detailSectionTitle}>{t('faceUpload.images')}</Text>
            <Text style={styles.detailSectionTitle}>
              {t(
                'faceUpload.pleaseProvideAll5PhotosInTheCorrectPositionsToImproveRecognitionAccuracy'
              )}
            </Text>
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
                            onLoadStart={() => {
                              setImageLoading((prev) => {
                                const next = [...prev];
                                next[index] = true;
                                return next;
                              });
                            }}
                            onLoadEnd={() => {
                              setImageLoading((prev) => {
                                const next = [...prev];
                                next[index] = false;
                                return next;
                              });
                            }}
                          />
                          {imageLoading[index] && (
                            <View
                              style={[
                                styles.imagePreview,
                                // eslint-disable-next-line react-native/no-inline-styles
                                {
                                  position: 'absolute',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  backgroundColor: 'rgba(255,255,255,0.5)',
                                },
                              ]}
                            >
                              <ActivityIndicator size="large" color="#000" />
                            </View>
                          )}
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

        {/* Loading Overlay for Uploading */}
        {isUpdating && (
          <View style={styles.uploadingOverlay}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.uploadingText}>{t('faceUpload.uploading') || 'Uploading...'}</Text>
          </View>
        )}

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
                <Camera
                  ref={camera}
                  style={styles.absoluteFill}
                  device={device}
                  isActive={showSingleDetectModal}
                  photo={true}
                />

                <View style={styles.overlay}>
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

                    {selectedImageIndex >= 0 &&
                      FACE_POSITIONS[selectedImageIndex]?.key !== 'center' &&
                      !isCapturing && (
                        <PositionArrow position={FACE_POSITIONS[selectedImageIndex].key} />
                      )}
                  </View>

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
