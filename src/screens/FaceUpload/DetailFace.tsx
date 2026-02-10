import React, { useEffect, useState, useCallback, useRef } from 'react';
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
} from 'react-native';
import { Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useInput } from '@hooks/useInput';
import { useFocusEffect } from '@react-navigation/native';
import { Camera, useCameraDevice, useCameraPermission } from 'react-native-vision-camera';
import FaceDetection, { Face, FaceDetectionOptions } from '@react-native-ml-kit/face-detection';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import BackIcon from '@assets/svg/icon-back.svg';
import TextInput from '@components/TextInput/TextInput';
import { styles } from './FaceUpload.styles';
import faceService, { Member, MemberRelationship, MemberImage } from '@api/faceService';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '@constants/theme';
import { DetailFaceNavigationProp, DetailFaceRouteProp } from '@navigation/types';

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

const DetailFace = () => {
  const navigation = useNavigation<DetailFaceNavigationProp>();
  const route = useRoute<DetailFaceRouteProp>();
  const { t } = useTranslation();
  const { memberId } = route.params;

  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [memberRelationships, setMemberRelationships] = useState<MemberRelationship[]>([]);
  const [selectedRelationship, setSelectedRelationship] = useState<MemberRelationship | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [relationshipError, setRelationshipError] = useState<string>('');
  const [hasChanges, setHasChanges] = useState(false);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  // Single face detect modal states
  const [showSingleDetectModal, setShowSingleDetectModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(-1);
  const [selectedImageData, setSelectedImageData] = useState<MemberImage | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectProgress, setDetectProgress] = useState(0);
  const [isPreparing, setIsPreparing] = useState(false);
  const [prepareProgress, setPrepareProgress] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);

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

  // Camera and animation refs for single face detection
  const camera = useRef<Camera>(null);
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const successAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');

  // Timer refs
  const prepareTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scanTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Face detection options
  const faceDetectionOptions: FaceDetectionOptions = {
    performanceMode: 'accurate',
    landmarkMode: 'none',
    contourMode: 'none',
    classificationMode: 'none',
    minFaceSize: Platform.OS === 'ios' ? 0.1 : 0.15,
    trackingEnabled: false,
  };

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

        // Find and set selected relationship
        const relationships = await faceService.getMemberRelationships();
        setMemberRelationships(relationships);

        const currentRelationship = relationships.find(
          (r) => r.id === (memberData.relationship?.id || memberData.relationship_type_id)
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
  }, [memberId, t, hasLoadedData]);

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
    if (!member || !selectedRelationship) return;

    try {
      setIsUpdating(true);

      const formData = new FormData();
      formData.append('name', nameInput.value.trim());
      formData.append('relationship_type_id', selectedRelationship.id);

      await faceService.updateMember(member.id, formData);

      Alert.alert(
        t('common.success') || 'Success',
        t('profile.updateSuccessMessage') || 'Member updated successfully',
        [
          {
            text: t('common.ok') || 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to update member:', error);
      Alert.alert(t('common.error') || 'Error', 'Failed to update member details');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRelationshipSelect = (relationship: MemberRelationship) => {
    setSelectedRelationship(relationship);
    setRelationshipError('');
    setShowDropdown(false);
  };

  // Handle image press to open single face detection modal
  const handleImagePress = async (index: number, image: MemberImage) => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          t('faceUpload.cameraPermission') || 'Camera Permission Required',
          t('faceUpload.cameraPermissionDesc') || 'We need camera access to capture your face'
        );
        return;
      }
    }

    // Reset all detection states before opening modal
    setIsPreparing(false);
    setIsDetecting(false);
    setIsCapturing(false);
    setPrepareProgress(0);
    setDetectProgress(0);

    setSelectedImageIndex(index);
    setSelectedImageData(image);
    setShowSingleDetectModal(true);
  };

  // Handle close detect modal
  const handleCloseDetectModal = () => {
    // Stop all animations and processes first
    stopSinglePrepare();
    stopSingleScanning();

    // Reset all animation values
    fadeAnim.setValue(0);
    scaleAnim.setValue(1);
    scanLineAnim.setValue(0);
    particleAnim.setValue(0);
    pulseAnim.setValue(1);
    successAnim.setValue(0);

    // Close modal
    setShowSingleDetectModal(false);
    setSelectedImageIndex(-1);
    setSelectedImageData(null);
    setIsPreparing(false);
    setIsDetecting(false);
    setIsCapturing(false);
    setPrepareProgress(0);
    setDetectProgress(0);
  };

  // Get error message for incorrect face position
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('detailFace.detailFace') || 'Member Detail'}</Text>
            <View style={styles.styleWidth} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>{t('common.loading') || 'Loading...'}</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (!member) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <BackIcon width={styles.buttonIcon.width} height={styles.buttonIcon.height} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('detailFace.detailFace') || 'Member Detail'}</Text>
            <View style={styles.styleWidth} />
          </View>
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('common.notAvailable') || 'Member not found'}</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

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
            {(() => {
              const images = member?.images || [];
              if (images.length > 0) {
                return (
                  <>
                    <View style={styles.imagesGrid}>
                      {images.map((image, index) => {
                        const positionTitle = FACE_POSITION_TITLES[index];
                        return (
                          <View key={image.id || index} style={styles.imageItemContainer}>
                            <Text style={styles.imageTitle}>
                              {index + 1}. {positionTitle?.getTitle(t) || `Position ${index + 1}`}
                            </Text>
                            <TouchableOpacity
                              style={styles.imageItem}
                              onPress={() => handleImagePress(index, image)}
                            >
                              <Image
                                source={{ uri: image.image_url }}
                                style={styles.imagePreview}
                                resizeMode="cover"
                              />
                              <View style={styles.imageOverlay}>
                                <Icon name="camera" size={20} color="#fff" />
                                <Text style={styles.imageIndex}>{index + 1}</Text>
                              </View>
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                    <Text style={styles.imageNote}>
                      {t('faceUpload.tapToEditImage') || 'Tap on image to edit'}
                    </Text>
                  </>
                );
              } else {
                return (
                  <Text style={styles.detailValue}>
                    {t('faceUpload.noImages') || 'No images available'}
                  </Text>
                );
              }
            })()}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, (!hasChanges || isUpdating) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!hasChanges || isUpdating}
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
              <Animated.View
                style={[
                  styles.absoluteFill,
                  {
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }],
                  },
                ]}
              >
                <Camera
                  ref={camera}
                  style={styles.absoluteFill}
                  device={device}
                  isActive={showSingleDetectModal}
                  photo={true}
                />

                {/* Close Button */}
                <View style={[styles.closeButton]}>
                  <TouchableOpacity
                    onPress={handleCloseDetectModal}
                    disabled={isCapturing}
                  >
                    <Icon name="close" size={24} color={isCapturing ? '#666' : '#fff'} />
                  </TouchableOpacity>
                </View>

                {/* Face Frame */}
                <View style={styles.faceFrameContainer}>
                  <Animated.View
                    style={[
                      styles.faceFrame,
                      // eslint-disable-next-line react-native/no-inline-styles
                      {
                        transform: [{ scale: pulseAnim }],
                        borderColor: isDetecting ? '#4CAF50' : '#fff',
                        borderWidth: isDetecting ? 3 : 2,
                      },
                    ]}
                  >
                    {/* Scan Line Animation */}
                    {isDetecting && (
                      <Animated.View
                        style={[
                          styles.scanLine,
                          {
                            transform: [
                              {
                                translateY: scanLineAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, 325],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                    )}

                    {/* Particle Animation */}
                    {isDetecting && (
                      <View style={styles.scanParticles}>
                        {Array.from({ length: 12 }).map((_, i) => (
                          <Animated.View
                            key={i}
                            style={[
                              styles.particle,
                              {
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                opacity: particleAnim.interpolate({
                                  inputRange: [0, 0.5, 1],
                                  outputRange: [0, 1, 0],
                                }),
                                transform: [
                                  {
                                    scale: particleAnim.interpolate({
                                      inputRange: [0, 0.5, 1],
                                      outputRange: [0.5, 1.5, 0.5],
                                    }),
                                  },
                                ],
                              },
                            ]}
                          />
                        ))}
                      </View>
                    )}

                    {/* Corner Indicators */}
                    <View style={styles.cornerIndicators}>
                      {/* eslint-disable-next-line react-native/no-inline-styles */}
                      <View style={[styles.cornerDot, { top: -4, left: -4 }]} />
                      {/* eslint-disable-next-line react-native/no-inline-styles */}
                      <View style={[styles.cornerDot, { top: -4, right: -4 }]} />
                      {/* eslint-disable-next-line react-native/no-inline-styles */}
                      <View style={[styles.cornerDot, { bottom: -4, left: -4 }]} />
                      {/* eslint-disable-next-line react-native/no-inline-styles */}
                      <View style={[styles.cornerDot, { bottom: -4, right: -4 }]} />
                    </View>

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
                </View>

                {/* Position Title and Instructions */}
                {selectedImageIndex >= 0 && FACE_POSITION_TITLES[selectedImageIndex] && (
                  <View style={styles.instructionsContainer}>
                    <Text style={styles.positionLabel}>
                      {FACE_POSITION_TITLES[selectedImageIndex].getTitle(t)}
                    </Text>
                    <Text style={styles.instruction}>
                      {FACE_POSITION_TITLES[selectedImageIndex].getInstruction(t)}
                    </Text>
                  </View>
                )}

                {/* Progress Indicators */}
                {isPreparing && (
                  <View style={styles.holdProgressContainer}>
                    <Text style={styles.holdProgressText}>
                      {t('faceUpload.preparing') || 'Preparing...'} {Math.round(prepareProgress)}%
                    </Text>
                    <View style={styles.progressContainer}>
                      <View style={styles.progressBar}>
                        <Animated.View
                          style={[
                            styles.progressFill,
                            {
                              width: `${prepareProgress}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>
                )}

                {isDetecting && (
                  <View style={styles.scanProgressContainer}>
                    <Text style={styles.scanProgressText}>
                      {t('faceUpload.scanning') || 'Scanning...'} {Math.round(detectProgress)}%
                    </Text>
                    <View style={styles.miniProgressBar}>
                      <Animated.View
                        style={[
                          styles.miniProgressFill,
                          {
                            width: `${detectProgress}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                )}
              </Animated.View>
            )}
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

export default DetailFace;
