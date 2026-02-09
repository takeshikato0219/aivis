import React, { useState } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Image,
  Alert,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './EditProfile.styles';
import { useResponsive } from '@hooks/useResponsive';
import { Text } from 'react-native-paper';
import TextInput from '@components/TextInput/TextInput';
import { COLORS } from '@constants/theme';
import Button from '@components/Button/Button';
import { useAppDispatch, useAppSelector } from '@redux/store';
import { useTranslation } from 'react-i18next';
import { useInput } from '@hooks/useInput';
import { isEmail, isPhoneNumber, validateImage, isName } from '@utils/validate';
import { useErrorHandler } from '@hooks/useErrorHandler';
import { useAppSetup } from '@hooks/useAppSetup';
import { useNavigation } from '@react-navigation/native';
import { HomeScreenNavigationProp } from '@navigation/types';
import HomeBackgroundImage from '@assets/png/home-background.png';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useImagePicker } from '@hooks/useImagePicker';
import { ImagePickerModal } from '@components/ImagePickerModal/ImagePickerModal';
import BackIcon from '@assets/svg/icon-back.svg';
import authService from '@api/authService';
import { logout, setUser } from '@redux/slices/authSlice';
import { removeAuthData, setUserData } from '@utils/authStorage';
import { ShopIconComponent } from '@components/IconCustom/IconCustom';

const EditProfile: React.FC = () => {
  const responsive = useResponsive();
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { t } = useTranslation();
  const { handleError } = useErrorHandler();
  const [imageError, setImageError] = useState<string | null>(null);
  useAppSetup({ screenName: 'EditProfile' });
  const dispatch = useAppDispatch();

  const [initialValues, setInitialValues] = React.useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    avatar: user?.avatar_url || '',
    agency_code: user?.agency_code || '',
  });

  const [initialImage, setInitialImage] = React.useState(user?.avatar_url || '');

  React.useEffect(() => {
    if (user) {
      const newInitialValues = {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar_url || '',
        agency_code: user.agency_code || '',
      };
      setInitialValues(newInitialValues);
      setInitialImage(user.avatar_url || '');

      // Reset input values when user data changes
      nameInput.setValue(user.name || '');
      emailInput.setValue(user.email || '');
      phoneInput.setValue(user.phone || '');

      // Reset selected image when user data changes
      setSelectedImage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const {
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
  } = useImagePicker();

  // Form inputs
  const nameInput = useInput({
    validateFn: (value) => {
      if (!hasChanges) return undefined;
      return isName(value);
    },
    initialValue: user?.name || '',
  });

  const emailInput = useInput({
    validateFn: isEmail,
    initialValue: user?.email || '',
  });

  const phoneInput = useInput({
    validateFn: isPhoneNumber,
    initialValue: user?.phone || '',
  });

  const agencyCodeInput = useInput({
    validateFn: (value) => value,
  });

  const hasChanges = React.useMemo(() => {
    const currentImageUri = selectedImage?.uri || user?.avatar_url || '';

    return (
      nameInput.value !== initialValues.name ||
      emailInput.value !== initialValues.email ||
      phoneInput.value !== initialValues.phone ||
      agencyCodeInput.value !== initialValues.agency_code ||
      currentImageUri !== initialImage
    );
  }, [
    nameInput.value,
    emailInput.value,
    phoneInput.value,
    agencyCodeInput.value,
    selectedImage?.uri,
    user?.avatar_url,
    initialValues,
    initialImage,
  ]);

  const isFormValid = React.useMemo(() => {
    if (!hasChanges) {
      return true;
    }

    let fieldsValid = true;

    if (nameInput.value.trim() !== '') {
      fieldsValid = fieldsValid && isName(nameInput.value) === undefined;
    }

    if (phoneInput.value.trim() !== '') {
      fieldsValid = fieldsValid && isPhoneNumber(phoneInput.value) === undefined;
    }

    const imageValid = !validateImage(selectedImage);
    return fieldsValid && imageValid;
  }, [hasChanges, nameInput.value, phoneInput.value, selectedImage]);

  const isSubmitEnabled = hasChanges && isFormValid;

  const validateForm = () => {
    const imageValidation = validateImage(selectedImage);
    setImageError(imageValidation ?? null);

    const isNameValid = nameInput.validate();
    const isEmailValid = emailInput.validate();
    const isPhoneValid = phoneInput.validate();

    return { isNameValid, isEmailValid, isPhoneValid, imageValidation };
  };

  const buildUpdateData = () => {
    const updateData: any = {};

    // Build basic fields
    if (nameInput.value !== initialValues.name) {
      updateData.name = nameInput.value;
    }
    if (emailInput.value !== initialValues.email) {
      updateData.email = emailInput.value;
    }
    if (phoneInput.value !== initialValues.phone) {
      updateData.phone = phoneInput.value;
    }
    if (agencyCodeInput.value !== initialValues.agency_code) {
      updateData.agency_code = agencyCodeInput.value;
    }

    // Handle avatar logic
    updateData.avatar = getAvatarUpdateData();

    return updateData;
  };

  const getAvatarUpdateData = () => {
    const currentImageUri = selectedImage?.uri || user?.avatar_url || '';

    if (currentImageUri !== initialImage) {
      if (selectedImage) {
        return {
          uri: selectedImage.uri,
          type: selectedImage.type || 'image/jpeg',
          name: selectedImage.fileName || `avatar_${Date.now()}.jpg`,
        };
      } else if (!selectedImage && user?.avatar_url) {
        return '';
      }
    }
    return undefined;
  };

  const showSuccessAlert = (isEmailChanged: boolean) => {
    if (isEmailChanged) {
      Alert.alert(
        t('profile.updateSuccess'),
        t('profile.emailChangeDetectedMessage'),
        [
          {
            text: t('profile.loginAgain', 'Login Again'),
            onPress: async () => {
              await removeAuthData();
              dispatch(logout());
            },
          },
        ],
        { cancelable: false }
      );
    } else {
      Alert.alert(t('profile.updateSuccess'), t('profile.updateSuccessMessage'), [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    }
  };

  const updateLocalState = () => {
    setInitialValues({
      name: nameInput.value,
      email: emailInput.value,
      phone: phoneInput.value,
      agency_code: agencyCodeInput.value,
      avatar: selectedImage?.uri || user?.avatar_url || '',
    });
    setInitialImage(selectedImage?.uri || user?.avatar_url || '');
  };

  const handleSave = async () => {
    if (!isSubmitEnabled) return;

    const validation = validateForm();
    if (!isFormValidationPassed(validation)) return;

    try {
      await processProfileUpdate();
    } catch (error: any) {
      handleError(error);
    }
  };

  const isFormValidationPassed = (validation: ReturnType<typeof validateForm>) => {
    const { isNameValid, isEmailValid, isPhoneValid, imageValidation } = validation;
    return isNameValid && isEmailValid && isPhoneValid && !imageValidation;
  };

  const processProfileUpdate = async () => {
    const updateData = buildUpdateData();

    if (Object.keys(updateData).length > 0) {
      const updatedUser = await authService.updateProfile(updateData);
      await setUserData(updatedUser);
      dispatch(setUser(updatedUser));
    }

    const isEmailChanged = emailInput.value !== initialValues.email;
    showSuccessAlert(isEmailChanged);
    updateLocalState();
  };

  const handleBack = () => {
    navigation.goBack();
  };
  const useScrollView = responsive.isLandscape;

  const scrollViewProps = {
    contentContainerStyle: [
      styles.scrollContent,
      responsive.isTablet && styles.scrollContentTablet,
    ],
    keyboardShouldPersistTaps: 'handled' as const,
    showsVerticalScrollIndicator: false,
    testID: 'edit-profile-scroll',
  };

  const getImageErrorMessage = () => {
    if (imageError === 'required') return t('validate.avatarRequired');
    if (imageError === 'size') return t('validate.avatarSize');
    return t('validate.avatarType');
  };

  const imageErrorMessage = imageError ? getImageErrorMessage() : null;

  const renderHeader = () => (
    <View style={[styles.header, responsive.isTablet && styles.headerTablet]}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <BackIcon />
      </TouchableOpacity>
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>{t('profile.editProfile', 'Edit Profile')}</Text>
      </View>
    </View>
  );

  const renderFormContent = () => (
    <View style={styles.paddingView}>
      <View style={styles.card}>
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            {selectedImage?.uri || user?.avatar_url ? (
              <Image
                source={{
                  uri: selectedImage?.uri || user?.avatar_url!,
                }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Icon name="account" size={50} color="#00ADD4" />
              </View>
            )}
            {selectedImage ? (
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
                disabled={isLoading}
              >
                <Icon name="delete" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.changeAvatarButton} onPress={handleUploadPress}>
              <Icon name="camera" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
          {imageError && hasChanges && imageErrorMessage && (
            <Text style={styles.styleErrorText}>{imageErrorMessage}</Text>
          )}
        </View>

        {/* Form Fields */}
        <Text style={styles.label}>NAME</Text>
        <TextInput
          value={nameInput.value}
          onChangeText={nameInput.handleChange}
          placeholder={t('register.namePlaceHolder')}
          autoCapitalize="words"
          autoComplete="name"
          disabled={isLoading}
          error={!!nameInput.error && hasChanges}
          style={styles.input}
          testID="name-input"
          placeholderTextColor={COLORS.BBBBBB}
        />
        {nameInput.error && hasChanges && (
          <Text style={styles.styleErrorText}>{t('validate.' + nameInput.error)}</Text>
        )}

        <Text style={styles.label}>EMAIL</Text>
        <TextInput
          value={emailInput.value}
          onChangeText={emailInput.handleChange}
          keyboardType="email-address"
          placeholder={t('auth.placeHolderMail')}
          autoCapitalize="none"
          autoComplete="email"
          disabled={true}
          error={!!emailInput.error && hasChanges}
          style={styles.input}
          testID="email-input"
          placeholderTextColor={COLORS.BBBBBB}
        />
        {emailInput.error && hasChanges && (
          <Text style={styles.styleErrorText}>{t('validate.' + emailInput.error)}</Text>
        )}

        <Text style={styles.label}>PHONE</Text>
        <TextInput
          value={phoneInput.value}
          onChangeText={phoneInput.handleChange}
          placeholder={t('auth.placeHolderPhone')}
          autoCapitalize="none"
          autoComplete="tel"
          keyboardType="phone-pad"
          disabled={isLoading}
          error={!!phoneInput.error && hasChanges}
          style={styles.input}
          testID="phone-input"
          placeholderTextColor={COLORS.BBBBBB}
        />
        {phoneInput.error && hasChanges && (
          <Text style={styles.styleErrorText}>{t('validate.' + phoneInput.error)}</Text>
        )}

        <Text style={styles.label}>{t('register.agencyCode')}</Text>
        <TextInput
          value={agencyCodeInput.value}
          onChangeText={agencyCodeInput.handleChange}
          icon={ShopIconComponent}
          placeholder={t('register.agencyCodePlaceholder')}
          autoCapitalize="none"
          disabled={true}
          style={styles.input}
          placeholderTextColor={COLORS.BBBBBB}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.rootContainer}>
      <ImageBackground
        source={HomeBackgroundImage}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeAreaContainer} edges={['top', 'left', 'right']}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
          >
            {renderHeader()}
            <ScrollView {...scrollViewProps}>
              <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                {useScrollView ? (
                  <View style={[styles.content, responsive.isTablet && styles.contentTablet]}>
                    {renderFormContent()}
                  </View>
                ) : (
                  renderFormContent()
                )}
              </TouchableWithoutFeedback>
              <View style={styles.fixedButtonContainer}>
                <Button
                  title={isLoading ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                  mode="contained"
                  onPress={handleSave}
                  loading={isLoading}
                  disabled={isLoading || !isSubmitEnabled}
                  style={styles.saveButton}
                  labelStyle={styles.btnSave}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
        {/* Image Picker Modal */}
        <ImagePickerModal
          visible={showImagePicker}
          slideAnim={slideAnim}
          opacityAnim={opacityAnim}
          onClose={closeModal}
          onTakePhoto={handleTakePhoto}
          onChooseFromLibrary={handleChooseFromLibrary}
        />
      </ImageBackground>
    </View>
  );
};

export default EditProfile;
