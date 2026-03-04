import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  StatusBar,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import FaceDetection, { Face, FaceDetectionOptions } from '@react-native-ml-kit/face-detection';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from './FaceUpload.styles';
import { useInput } from '@hooks/useInput';
import TextInput from '@components/TextInput/TextInput';
import faceService, { MemberRelationship } from '@api/faceService';
import { COLORS } from '@constants/theme';
import BackIcon from '@assets/svg/icon-back.svg';
import { isName } from '@utils/validate';
import { ListFaceRouteProp } from '@navigation/types';
import { launchImageLibrary } from 'react-native-image-picker';
import { ScrollView } from 'react-native';

type FacePosition = 'center' | 'left' | 'right' | 'up' | 'down';

const FaceUpload: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { hasPermission, requestPermission } = useCameraPermission();
  const route = useRoute<ListFaceRouteProp>();
  const type = route?.params?.type;

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

  interface FaceData {
    position: FacePosition;
    imageUri: string;
    timestamp: number;
    scanProgress: number;
  }

  const [currentPositionIndex, setCurrentPositionIndex] = useState(0);
  const [capturedFaces, setCapturedFaces] = useState<FaceData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [prepareProgress, setPrepareProgress] = useState(0);
  const [isPreparing, setIsPreparing] = useState(false);

  // Form state
  const [showForm, setShowForm] = useState(true);
  const [memberRelationships, setMemberRelationships] = useState<MemberRelationship[]>([]);
  const [selectedRelationship, setSelectedRelationship] = useState<MemberRelationship | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoadingRelationships, setIsLoadingRelationships] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [relationshipError, setRelationshipError] = useState<string | undefined>(undefined);
  const [choosePhotoError, setChoosePhotoError] = useState<string | undefined>(undefined);
  const nameInput = useInput({
    validateFn: isName,
  });

  // Face detection options for static images
  const faceDetectionOptions: FaceDetectionOptions = {
    performanceMode: 'accurate',
    landmarkMode: 'none',
    contourMode: 'none',
    classificationMode: 'none',
    minFaceSize: Platform.OS === 'ios' ? 0.1 : 0.15,
    trackingEnabled: false,
  };

  // Validate face position based on rotation angles
  const validateFacePosition = (face: Face, position: FacePosition): boolean => {
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

    switch (position) {
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

  const getPositionErrorMessage = (position: FacePosition): string => {
    switch (position) {
      case 'center':
        return t('faceUpload.pleaseFaceTheCameraStraightAhead');
      case 'left':
        return t('faceUpload.pleaseTurnYourFaceToTheLEFT');
      case 'right':
        return t('faceUpload.pleaseTurnYourFaceToTheRIGHT');
      case 'up':
        return t('faceUpload.pleaseTiltYourHeadUP');
      case 'down':
        return t('faceUpload.pleaseTiltYourHeadDOWN');
      default:
        return t('faceUpload.pleasePositionYourFaceCorrectly');
    }
  };

  const device = useCameraDevice('front');
  const camera = useRef<Camera>(null);
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prepareTimerRef = useRef<NodeJS.Timeout | null>(null);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const currentPosition = FACE_POSITIONS[currentPositionIndex];

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    const fetchRelationships = async () => {
      setIsLoadingRelationships(true);
      try {
        const data = await faceService.getMemberRelationships();
        setMemberRelationships(data);
      } catch (error) {
        console.error('Failed to fetch member relationships:', error);
      } finally {
        setIsLoadingRelationships(false);
      }
    };
    fetchRelationships();
  }, []);

  useEffect(() => {
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
  }, [scaleAnim]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [currentPositionIndex, fadeAnim]);

  useEffect(() => {
    if (isProcessing || showPreview || showForm) return;

    const initTimer = setTimeout(() => {
      startPrepare();
    }, 1000);

    return () => {
      clearTimeout(initTimer);
      stopPrepare();
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPositionIndex, isProcessing, showPreview, showForm]);

  const startPrepare = () => {
    setIsPreparing(true);
    setPrepareProgress(0);

    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / currentPosition.prepareTime) * 100, 100);
      setPrepareProgress(progress);

      if (progress >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    }, 50);

    prepareTimerRef.current = setTimeout(() => {
      stopPrepare();
      startScanning();
    }, currentPosition.prepareTime);
  };

  const stopPrepare = () => {
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

  const startScanning = () => {
    setIsScanning(true);
    setScanProgress(0);

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
      const progress = Math.min((elapsed / currentPosition.scanDuration) * 100, 100);
      setScanProgress(progress);

      if (progress >= 100) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
      }
    }, 50);

    scanTimerRef.current = setTimeout(() => {
      stopScanning();
      void handleCaptureFace();
    }, currentPosition.scanDuration);
  };

  const stopScanning = () => {
    setIsScanning(false);
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

  const handleCaptureFace = async () => {
    if (isProcessing || !camera.current) {
      return;
    }

    setIsProcessing(true);
    stopScanning();

    try {
      const photo = await camera.current.takePhoto({
        flash: 'off',
      });
      let imageUri = photo.path.startsWith('file://') ? photo.path : `file://${photo.path}`;
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

      // Detect faces in the captured image
      const faces = await FaceDetection.detect(imageUri, faceDetectionOptions);

      // Check if exactly one face is detected and in correct position
      if (faces.length === 1 && validateFacePosition(faces[0], currentPosition.key)) {
        const faceData: FaceData = {
          position: currentPosition.key,
          imageUri,
          timestamp: Date.now(),
          scanProgress: scanProgress,
        };

        setCapturedFaces((prev) => [...prev, faceData]);
        setLastCapturedImage(imageUri);
        setShowPreview(true);

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
        }, 1400);
      } else {
        // Show error based on detection result
        let errorMessage = '';

        if (faces.length === 0) {
          errorMessage = t('faceUpload.noFaceDetected');
        } else if (faces.length > 1) {
          errorMessage = t('faceUpload.multipleFacesDetected');
        } else if (faces.length === 1) {
          errorMessage = getPositionErrorMessage(currentPosition.key);
        }

        Alert.alert(t('faceUpload.faceDetectionError'), errorMessage, [
          {
            text: t('common.retry') || 'Retry',
            onPress: () => {
              setIsProcessing(false);
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Capture/Face detection error:', error);
      Alert.alert(
        t('faceUpload.captureError') || 'Capture Error',
        t('faceUpload.tryAgain') || 'Please try again'
      );
      setIsProcessing(false);
    }
  };

  const uploadFaces = async (allFaces: { position: string; imageUri: string }[]) => {
    if (allFaces.length !== 5) {
      Alert.alert(
        t('faceUpload.validationError') || 'Validation Error',
        t('faceUpload.mustHave5Images') || 'Must capture all 5 face positions before uploading'
      );
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('name', nameInput.value);
      if (selectedRelationship) {
        formData.append('relationship_type_id', selectedRelationship.id);
      }
      allFaces.forEach((face) => {
        formData.append('images', {
          uri: face.imageUri,
          type: 'image/jpeg',
          name: `${face.position}.jpg`,
        } as any);
      });

      await faceService.uploadFaces(formData);
      Alert.alert(
        t('faceUpload.uploadSuccess') || 'Success',
        t('faceUpload.uploadSuccessMessage') || 'Face data uploaded successfully!',
        [
          {
            text: t('common.ok') || 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        t('faceUpload.uploadFailed') || 'Upload Failed',
        t('faceUpload.uploadFailedMessage') || 'Failed to upload face data. Please try again.',
        [
          {
            text: t('common.ok') || 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleComplete = async (allFaces: FaceData[]) => {
    await uploadFaces(allFaces.map(({ position, imageUri }) => ({ position, imageUri })));
  };

  const stopAllScanning = () => {
    stopPrepare();
    stopScanning();

    setIsProcessing(false);
    setIsPreparing(false);
    setIsScanning(false);

    // stop animation
    scanLineAnim.stopAnimation();
    particleAnim.stopAnimation();
    pulseAnim.stopAnimation();

    scanLineAnim.setValue(0);
    particleAnim.setValue(0);

    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    if (prepareTimerRef.current) {
      clearTimeout(prepareTimerRef.current);
      prepareTimerRef.current = null;
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  const handleRetake = () => {
    Alert.alert(
      t('faceUpload.retake') || 'Retake?',
      t('faceUpload.retakeConfirm') || 'Do you want to retake this scan?',
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

  const validateForm = (): boolean => {
    const isNameValid = nameInput.validate();
    const isRelationshipValid = selectedRelationship !== null;

    // Set relationship error
    if (!isRelationshipValid) {
      setRelationshipError(t('validate.relationshipRequired'));
    } else {
      setRelationshipError(undefined);
    }

    if (type !== 'capture') {
      const hasAtLeastOneImage = images.some((img) => !!img);
      if (!hasAtLeastOneImage) {
        setChoosePhotoError(t('faceUpload.pleaseChooseAtLeastOneImage'));
        return false;
      } else {
        setChoosePhotoError(undefined);
      }
    }

    if (!isNameValid) {
      return false;
    }

    return isRelationshipValid;
  };

  const handleStartScan = () => {
    if (validateForm()) {
      setShowForm(false);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    const facePositions = ['center', 'left', 'right', 'up', 'down'];
    const allFaces = images
      .map((img, idx) => (img ? { position: facePositions[idx], imageUri: img } : null))
      .filter((face): face is { position: string; imageUri: string } => !!face);
    await uploadFaces(allFaces);
  };

  const FACE_POSITION_TITLES = [
    {
      key: 'center',
      getTitle: (trans: any) => trans('faceUpload.frontView'),
      getInstruction: (trans: any) => trans('faceUpload.lookStraight'),
    },
    {
      key: 'left',
      getTitle: (trans: any) => trans('faceUpload.leftSide'),
      getInstruction: (trans: any) => trans('faceUpload.turnLeft'),
    },
    {
      key: 'right',
      getTitle: (trans: any) => trans('faceUpload.rightSide'),
      getInstruction: (trans: any) => trans('faceUpload.turnRight'),
    },
    {
      key: 'up',
      getTitle: (trans: any) => trans('faceUpload.lookingUp'),
      getInstruction: (trans: any) => trans('faceUpload.lookUp'),
    },
    {
      key: 'down',
      getTitle: (trans: any) => trans('faceUpload.lookingDown'),
      getInstruction: (trans: any) => trans('faceUpload.lookDown'),
    },
  ] as const;

  const [images, setImages] = useState<(string | null)[]>([null, null, null, null, null]);

  const handleImagePress = async (index: number) => {
    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1 });
    if (result.assets && result.assets.length > 0) {
      const newImages = [...images];
      newImages[index] = result.assets[0].uri || null;
      setImages(newImages);
      setChoosePhotoError(undefined);
    }
  };

  const renderChoosePhoto = () => (
    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>{t('faceUpload.images') || 'Images'}</Text>
      <View style={styles.imagesGrid}>
        {[0, 1, 2, 3, 4].map((index) => (
          <View key={index} style={styles.imageItemContainerPhoto}>
            <Text style={styles.imageTitle}>
              {index + 1}. {FACE_POSITION_TITLES[index]?.getTitle?.(t) || `Position ${index + 1}`}
            </Text>
            <TouchableOpacity style={styles.imageItem} onPress={() => handleImagePress(index)}>
              {images[index] ? (
                <>
                  <Image
                    source={{ uri: images[index]! }}
                    style={styles.imagePreview}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.imageOverlay}
                    onPress={() => {
                      const newImages = [...images];
                      newImages[index] = null;
                      setImages(newImages);
                    }}
                  >
                    <Icon name="close" size={24} color="#fff" />
                    <Text style={styles.imageIndex}>{index + 1}</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.imageOverlay}>
                  <Icon name="plus" size={32} color="#ccc" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        ))}
      </View>
      {choosePhotoError && <Text style={styles.errorChoosePhoto}>{choosePhotoError}</Text>}
      <TouchableOpacity
        style={styles.saveButtonChoosePhoto}
        onPress={handleSave}
        disabled={isLoadingRelationships}
      >
        <Text style={styles.startButtonText}>{t('workSchedule.save')}</Text>
      </TouchableOpacity>
    </View>
  );

  const progressPercentage = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-162.5, 162.5],
  });

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>
            {t('faceUpload.permissionRequired') || 'Camera Permission Required'}
          </Text>
          <Text style={styles.permissionText}>
            {t('faceUpload.cameraPermissionNeeded') || 'We need camera access to scan your face'}
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

  // Form UI - Show before scanning
  if (showForm) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
            </TouchableOpacity>
            <View style={styles.viewTitle}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {t('faceUpload.title') || 'Face Registration'}
              </Text>
            </View>
            <View style={styles.styleWidth} />
          </View>
          <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Form Content */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.formContainer}>
                <Text style={styles.formTitle}>
                  {t('faceUpload.enterInformation') || 'Enter Information'}
                </Text>
                {type === 'capture' ? (
                  <Text style={styles.formSubtitle}>
                    {t('faceUpload.fillFormBeforeScan') ||
                      'Please fill in the information below before starting face scan'}
                  </Text>
                ) : (
                  <Text style={styles.formSubtitle}>
                    {t('faceUpload.pleaseEnterTheRequiredInformation')}
                  </Text>
                )}

                {/* Member Relationship Dropdown */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>
                    {t('faceUpload.memberRelationship') || 'Member Relationship'}
                  </Text>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowDropdown(true)}
                    disabled={isLoadingRelationships}
                  >
                    {isLoadingRelationships ? (
                      <ActivityIndicator size="small" color="#4CAF50" />
                    ) : (
                      <>
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
                      </>
                    )}
                  </TouchableOpacity>
                  {relationshipError && (
                    <Text style={styles.errorInputText}>{relationshipError}</Text>
                  )}
                </View>

                {/* Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>{t('faceUpload.name') || 'Name'}</Text>
                  <TextInput
                    value={nameInput.value}
                    onChangeText={nameInput.handleChange}
                    placeholder={t('faceUpload.enterName') || 'Enter name'}
                    autoCapitalize="words"
                    error={!!nameInput.error}
                    style={styles.textInput}
                    placeholderTextColor={COLORS.BBBBBB}
                  />
                  {nameInput.error && (
                    <Text style={styles.errorInputText}>{t('validate.' + nameInput.error)}</Text>
                  )}
                </View>

                {type === 'capture' ? (
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={handleStartScan}
                    disabled={isLoadingRelationships}
                  >
                    <Icon name="face-recognition" size={24} color="#fff" />
                    <Text style={styles.startButtonText}>
                      {t('faceUpload.startScan') || 'Start Face Scan'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  renderChoosePhoto()
                )}
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>

          {/* Dropdown Modal */}
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
                      onPress={() => {
                        setSelectedRelationship(item);
                        setRelationshipError(undefined);
                        setShowDropdown(false);
                      }}
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
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Camera */}
      <Camera
        ref={camera}
        style={styles.absoluteFill}
        device={device}
        isActive={!showPreview && !showForm}
        photo={true}
      />

      {/* Preview overlay */}
      {showPreview && lastCapturedImage && (
        <View style={styles.absoluteFill}>
          <Image source={{ uri: lastCapturedImage }} style={styles.absoluteFill} />
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
                stopAllScanning();
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

            <Text style={styles.title}>{t('faceUpload.title') || 'Face ID Setup'}</Text>

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
            {/* Prepare Progress Ring */}
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
            {isScanning && (
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [{ translateY: scanLineTranslateY }],
                  },
                ]}
              >
                <View style={styles.scanLineGlow} />
              </Animated.View>
            )}

            {/* Scanning Particles */}
            {isScanning && (
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
              isScanning={isScanning}
              scanProgress={scanProgress}
              isPreparing={isPreparing}
            />

            {/* Corner Indicators with Pulse */}
            {isScanning && (
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
          </Animated.View>

          {/* Position Arrow */}
          {currentPosition.key !== 'center' && !isProcessing && (
            <PositionArrow position={currentPosition.key} />
          )}
        </View>

        {/* Instructions */}
        <Animated.View style={[styles.instructionsContainer, { opacity: fadeAnim }]}>
          <Text style={styles.positionLabel}>{currentPosition.label.toUpperCase()}</Text>
          <Text style={styles.instruction}>{currentPosition.instruction}</Text>

          {/* Status */}
          {isPreparing && (
            <View style={styles.feedbackContainer}>
              {/* eslint-disable-next-line react-native/no-inline-styles */}
              <Text style={[styles.feedbackText, { color: '#FFFFFF' }]}>
                {t('faceUpload.getReady') || 'Get ready...'}
              </Text>
            </View>
          )}

          {isScanning && (
            <View style={styles.scanProgressContainer}>
              <Text style={styles.scanProgressText}>
                {t('faceUpload.scanning') || 'Scanning'}: {Math.round(scanProgress)}%
              </Text>
              <View style={styles.miniProgressBar}>
                <View style={[styles.miniProgressFill, { width: `${scanProgress}%` }]} />
              </View>
            </View>
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

        {/* Retake Button */}
        {showPreview && (
          <SafeAreaView edges={['bottom']} style={styles.bottomContainer}>
            <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
              <Text style={styles.retakeButtonText}>{t('faceUpload.retake') || 'Retake'}</Text>
            </TouchableOpacity>
          </SafeAreaView>
        )}
      </View>

      {/* Uploading Overlay */}
      {isUploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.uploadingText}>{t('faceUpload.uploading') || 'Uploading...'}</Text>
        </View>
      )}
    </View>
  );
};

// Face Frame SVG Component
const FaceFrameSVG: React.FC<{
  isScanning: boolean;
  scanProgress: number;
  isPreparing: boolean;
}> = ({ isScanning, scanProgress, isPreparing }) => {
  const color = isScanning ? '#4CAF50' : isPreparing ? '#FFFFFF' : '#FFFFFF';
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

// Position Arrow Component
const PositionArrow: React.FC<{ position: FacePosition }> = ({ position }) => {
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

export default FaceUpload;
