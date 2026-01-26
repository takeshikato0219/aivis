import { useState, useRef, useEffect } from 'react';
import { Alert, Animated, Platform, Dimensions } from 'react-native';
import { check, request, RESULTS, openSettings, PERMISSIONS } from 'react-native-permissions';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { useTranslation } from 'react-i18next';
import { pickImageIOS } from '@utils/iosPhotoPicker';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface ImagePickerHookResult {
  selectedImage: any;
  showImagePicker: boolean;
  slideAnim: Animated.Value;
  opacityAnim: Animated.Value;
  handleUploadPress: () => void;
  handleTakePhoto: () => Promise<void>;
  handleChooseFromLibrary: () => Promise<void>;
  handleRemoveImage: () => void;
  closeModal: () => void;
  setSelectedImage: (image: any) => void;
}

export const useImagePicker = (): ImagePickerHookResult => {
  const { t } = useTranslation();

  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const openModal = () => {
    setShowImagePicker(true);
    setIsAnimating(true);
  };

  const closeModal = () => {
    setIsAnimating(false);
  };

  const isPhotoGranted = (status: string) => {
    if (Platform.OS === 'ios') {
      return status === RESULTS.GRANTED || status === RESULTS.LIMITED;
    }
    return status === RESULTS.GRANTED || status === RESULTS.UNAVAILABLE;
  };

  const isCameraGranted = (status: string) => {
    if (Platform.OS === 'ios') {
      return status === RESULTS.GRANTED;
    }
    return status === RESULTS.GRANTED || status === RESULTS.UNAVAILABLE;
  };

  const handleImageResponse = (response: ImagePickerResponse) => {
    if (response.didCancel) return;

    if (response.errorCode) {
      Alert.alert('Error', response.errorMessage || 'Image picker error');
      return;
    }

    if (response.assets && response.assets.length > 0) {
      setSelectedImage(response.assets[0]);
    }
  };

  const openCamera = () => {
    launchCamera(
      {
        mediaType: 'photo',
        cameraType: 'back',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        includeBase64: true,
      },
      handleImageResponse
    );
  };

  const openGallery = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        includeBase64: true,
        selectionLimit: 1,
      },
      handleImageResponse
    );
  };

  const handleUploadPress = () => {
    openModal();
  };

  // Camera
  const handleTakePhoto = async () => {
    closeModal();

    const permission = Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA;

    const status = await check(permission);

    if (isCameraGranted(status)) {
      openCamera();
      return;
    }

    if (status === RESULTS.BLOCKED) {
      Alert.alert(t('permission.imageTitle'), t('permission.permissionBlocked'), [
        { text: t('permission.cancel'), style: 'cancel' },
        { text: t('permission.openSettings'), onPress: () => openSettings() },
      ]);
      return;
    }

    await request(permission);
  };

  // Gallery
  const handleChooseFromLibrary = async () => {
    closeModal();
    if (Platform.OS === 'ios') {
      const status = await check(PERMISSIONS.IOS.PHOTO_LIBRARY);
      if (status === RESULTS.BLOCKED) {
        Alert.alert(t('permission.imageTitle'), t('permission.permissionBlocked'), [
          { text: t('permission.cancel'), style: 'cancel' },
          {
            text: t('permission.openSettings'),
            onPress: () => openSettings(),
          },
        ]);
        return;
      }

      try {
        const response = await pickImageIOS();
        if (response?.assets?.length) {
          setSelectedImage(response.assets[0]);
        }
      } catch (e) {
        console.warn(e);
      }

      return;
    }

    const permission = PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
    const status = await check(permission);

    if (isPhotoGranted(status)) {
      openGallery();
      return;
    }

    if (status === RESULTS.BLOCKED) {
      Alert.alert(t('permission.imageTitle'), t('permission.permissionBlocked'), [
        { text: t('permission.cancel'), style: 'cancel' },
        { text: t('permission.openSettings'), onPress: () => openSettings() },
      ]);
      return;
    }

    const result = await request(permission);

    if (isPhotoGranted(result)) {
      openGallery();
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  useEffect(() => {
    if (isAnimating) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (showImagePicker) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowImagePicker(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnimating]);

  return {
    selectedImage,
    showImagePicker,
    slideAnim,
    opacityAnim,
    handleUploadPress,
    handleTakePhoto,
    handleChooseFromLibrary,
    handleRemoveImage,
    closeModal,
    setSelectedImage,
  };
};
