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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './Register.styles';
import { useResponsive } from '@hooks/useResponsive';
import { Text, RadioButton } from 'react-native-paper';
import TextInput from '@components/TextInput/TextInput';
import {
  EmailOutlineIcon,
  LockOutlineIcon,
  PhoneOutlineIcon,
} from '@components/IconCustom/IconCustom';
import { COLORS } from '@constants/theme';
import Button from '@components/Button/Button';
import { useAppSelector, useAppDispatch } from '@redux/store';
import { useTranslation } from 'react-i18next';
import { commonStyles } from '@styles/commonStyles';
import { useInput } from '@hooks/useInput';
import {
  isEmail,
  isPassword,
  isPasswordConfirm,
  isPhoneNumber,
  validateImage,
  isName,
} from '@utils/validate';
import { useErrorHandler } from '@hooks/useErrorHandler';
import { useAppSetup } from '@hooks/useAppSetup';
import Logo from '@assets/svg/logo.svg';
import LoginBackground from '@assets/svg/login-background.svg';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { setAuthData } from '@utils/authStorage';
import { registerAsync, setAuthenticated, setUser, setTokens } from '@redux/slices/authSlice';
import { useImagePicker } from '@hooks/useImagePicker';
import { ImagePickerModal } from '@components/ImagePickerModal/ImagePickerModal';
import { disableBiometricLogin } from '@/services/biometricService';
import { useBiometric } from '@hooks/useBiometric';
import { showCommonAlert } from '@components/Alert/Alert';
import { API_BASE_URL, API_ENDPOINTS } from '@api/apiEndpoints';
import axios from 'axios';
import { User } from '@api/types/authTypes';

const Register: React.FC = () => {
  const responsive = useResponsive();
  const { isLoading } = useAppSelector((state) => state.auth);
  const [checked, setChecked] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { handleError, handleNetworkError } = useErrorHandler();
  const { isConnected } = useAppSetup({ screenName: 'Register' });
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();

  const { biometricInfo, biometricTypeName, saveCredentials } = useBiometric();

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
  } = useImagePicker();

  const nameInput = useInput({
    validateFn: isName,
  });

  const emailInput = useInput({
    validateFn: isEmail,
  });

  const phoneInput = useInput({
    validateFn: isPhoneNumber,
  });

  const passwordInput = useInput({
    validateFn: isPassword,
  });

  const passwordConfirm = useInput({
    validateFn: (value) => isPasswordConfirm(passwordInput.value, value),
  });

  const openModalBiometricEnable = (registerResult: {
    accessToken: string;
    refreshToken: string;
  }) => {
    if (biometricInfo.available) {
      setTimeout(() => {
        showCommonAlert({
          title: t('biometric.enableTitle', { type: biometricTypeName }),
          message: t('biometric.enableMessage', { type: biometricTypeName }),
          buttons: [
            { text: t('common.notNow'), style: 'cancel' },
            {
              text: t('common.enable'),
              onPress: async () => {
                const saved = await saveCredentials({
                  accessToken: registerResult.accessToken,
                  refreshToken: registerResult.refreshToken,
                });
                showCommonAlert({
                  title: saved ? t('common.success') : t('common.error'),
                  message: saved
                    ? t('biometric.enabled', { type: biometricTypeName })
                    : t('biometric.failed', { type: biometricTypeName }),
                });
              },
            },
          ],
        });
      }, 100);
    }
  };

  const validateRegistrationInputs = () => {
    const imageValidation = validateImage(selectedImage);
    setImageError(imageValidation ?? null);

    const validations = {
      isNameValid: nameInput.validate(),
      isEmailValid: emailInput.validate(),
      isPhoneValid: phoneInput.validate(),
      isPasswordValid: passwordInput.validate(),
      isPasswordConfirmValid: passwordConfirm.validate(),
    };

    const isAllValid = Object.values(validations).every((v) => v) && !imageValidation;

    return { validations, imageValidation, isAllValid };
  };

  const registerOnAndroid = async () => {
    const formData = new FormData();
    formData.append('name', nameInput.value);
    formData.append('email', emailInput.value);
    formData.append('password', passwordInput.value);
    formData.append('confirm_password', passwordConfirm.value);
    formData.append('phone', phoneInput.value);

    if (selectedImage) {
      formData.append('avatar', {
        uri: selectedImage.uri,
        type: selectedImage.type || 'image/png',
        name: selectedImage.fileName || 'avatar.png',
      } as any);
    }

    const url = `${API_BASE_URL}${API_ENDPOINTS.AUTH.REGISTER}`.replace(/\/+$/, '');
    const response = await axios.post(url, formData, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000,
    });

    const registerResult = response.data.data;
    const userInfo = mapApiResponseToUser(registerResult);

    return { registerResult, userInfo };
  };

  const registerOnOtherPlatforms = async () => {
    const avatarFile = selectedImage
      ? {
          uri: selectedImage.uri,
          type: selectedImage.type || 'image/jpeg',
          name: selectedImage.fileName || `avatar_${Date.now()}.jpg`,
        }
      : null;

    const registerData = {
      email: emailInput.value,
      password: passwordInput.value,
      confirm_password: passwordConfirm.value,
      name: nameInput.value,
      phone: phoneInput.value,
      avatar: avatarFile,
    };

    const registerResult = await dispatch(registerAsync(registerData)).unwrap();
    const userInfo = registerResult.user;

    return { registerResult, userInfo };
  };

  const mapApiResponseToUser = (registerResult: any): User => ({
    id: registerResult.user_info.id,
    email: registerResult.user_info.email,
    name: registerResult.user_info.name,
    phone: registerResult.user_info.phone,
    line_user_id: registerResult.user_info.line_user_id,
    is_admin: registerResult.user_info.is_admin,
    is_active: registerResult.user_info.is_active,
    created_at: registerResult.user_info.created_at,
    updated_at: registerResult.user_info.updated_at,
    avatar_path: registerResult.user_info.avatar_path,
    avatar_url: registerResult.user_info.avatar_url,
  });

  const handleRegistrationSuccess = async (registerResult: any, userInfo: User) => {
    await disableBiometricLogin();

    const accessToken = registerResult.access_token ?? registerResult.accessToken ?? '';
    const refreshToken = registerResult.refresh_token ?? registerResult.refreshToken ?? '';

    await setAuthData(accessToken, refreshToken, userInfo);

    dispatch(setUser(userInfo));
    dispatch(setTokens({ accessToken, refreshToken }));

    Alert.alert(
      t('auth.registerSuccess', 'Registration Successful'),
      t('auth.welcomeMessage', 'Welcome! You can now access all features.'),
      [
        {
          text: 'OK',
          onPress: () => {
            dispatch(setAuthenticated());
            openModalBiometricEnable({ accessToken, refreshToken });
          },
        },
      ]
    );
  };

  const handleRegister = async () => {
    const { isAllValid } = validateRegistrationInputs();
    if (!isAllValid) return;

    if (!isConnected) {
      handleNetworkError();
      return;
    }

    try {
      const { registerResult, userInfo } =
        Platform.OS === 'android' ? await registerOnAndroid() : await registerOnOtherPlatforms();

      await handleRegistrationSuccess(registerResult, userInfo);
    } catch (error: any) {
      handleError(error);
    }
  };

  const getImageErrorMessage = () => {
    if (imageError === 'required') return t('validate.avatarRequired');
    if (imageError === 'size') return t('validate.avatarSize');
    return t('validate.avatarType');
  };

  const imageErrorMessage = imageError ? getImageErrorMessage() : null;

  const goToLogin = () => {
    navigation.navigate('Login' as never);
  };

  return (
    <SafeAreaView style={[styles.container]}>
      <StatusBar translucent backgroundColor="transparent" />
      <View style={styles.absoluteFill}>
        <LoginBackground width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
      </View>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            responsive.isTablet && styles.scrollContentTablet,
          ]}
          keyboardShouldPersistTaps="handled"
          testID="register-scroll"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View>
              {/* Header */}
              <View style={[styles.header, responsive.isTablet && styles.headerTablet]}>
                <Logo
                  width={responsive.isTablet ? 400 : 236}
                  height={responsive.isTablet ? 100 : 68}
                />
              </View>
              <Text style={styles.title}>{t('auth.createAccount')}</Text>
              <View style={styles.card}>
                <Text style={styles.label}>NAME</Text>
                <TextInput
                  value={nameInput.value}
                  onChangeText={nameInput.handleChange}
                  placeholder={t('register.namePlaceHolder')}
                  autoCapitalize="words"
                  autoComplete="name"
                  disabled={isLoading}
                  error={!!nameInput.error}
                  style={styles.input}
                  testID="name-input"
                  placeholderTextColor={COLORS.BBBBBB}
                />
                {nameInput.error && (
                  <Text style={styles.styleErrorText}>{t('validate.' + nameInput.error)}</Text>
                )}

                {/* ID/email */}
                <Text style={styles.label}>ID/EMAIl</Text>
                <TextInput
                  value={emailInput.value}
                  onChangeText={emailInput.handleChange}
                  icon={EmailOutlineIcon}
                  keyboardType="email-address"
                  placeholder={t('auth.placeHolderMail')}
                  autoCapitalize="none"
                  autoComplete="email"
                  disabled={isLoading}
                  error={!!emailInput.error}
                  style={styles.input}
                  testID="email-input"
                  placeholderTextColor={COLORS.BBBBBB}
                />
                {emailInput.error && (
                  <Text style={styles.styleErrorText}>{t('validate.' + emailInput.error)}</Text>
                )}

                {/* Phone */}
                <Text style={styles.label}>PHONE</Text>
                <TextInput
                  value={phoneInput.value}
                  onChangeText={phoneInput.handleChange}
                  icon={PhoneOutlineIcon}
                  placeholder={t('auth.placeHolderPhone')}
                  autoCapitalize="none"
                  autoComplete="tel"
                  keyboardType="phone-pad"
                  disabled={isLoading}
                  error={!!phoneInput.error}
                  style={styles.input}
                  testID="phone-input"
                  placeholderTextColor={COLORS.BBBBBB}
                />
                {phoneInput.error && (
                  <Text style={styles.styleErrorText}>{t('validate.' + phoneInput.error)}</Text>
                )}

                {/* Password */}
                <Text style={styles.label}>PASSWORD</Text>
                <TextInput
                  value={passwordInput.value}
                  onChangeText={passwordInput.handleChange}
                  icon={LockOutlineIcon}
                  secureTextEntry
                  placeholder={t('auth.placeHolderPassword')}
                  autoCapitalize="none"
                  autoComplete="password"
                  disabled={isLoading}
                  error={!!passwordInput.error}
                  style={styles.input}
                  testID="password-input"
                  placeholderTextColor={COLORS.BBBBBB}
                />
                {passwordInput.error && (
                  <Text style={styles.styleErrorText}>{t('validate.' + passwordInput.error)}</Text>
                )}

                {/* Re-Password */}
                <Text style={styles.label}>RE-PASSWORD</Text>
                <TextInput
                  value={passwordConfirm.value}
                  onChangeText={passwordConfirm.handleChange}
                  icon={LockOutlineIcon}
                  secureTextEntry
                  placeholder={t('auth.placeHolderPasswordConfirm')}
                  autoCapitalize="none"
                  autoComplete="password"
                  disabled={isLoading}
                  error={!!passwordConfirm.error}
                  style={styles.input}
                  testID="password-confirm-input"
                  placeholderTextColor={COLORS.BBBBBB}
                />
                {passwordConfirm.error && (
                  <Text style={styles.styleErrorText}>
                    {t('validate.' + passwordConfirm.error)}
                  </Text>
                )}

                {/* Upload image */}
                <Text style={styles.label}>UPLOAD IMAGE</Text>
                <View style={styles.imageUploadContainer}>
                  {selectedImage ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: selectedImage.uri }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <View style={styles.imageActions}>
                        <TouchableOpacity
                          style={styles.changeImageButton}
                          onPress={handleUploadPress}
                          disabled={isLoading}
                        >
                          <Icon name="edit" size={16} color="#FFFFFF" />
                          <Text style={styles.changeImageText}>{t('register.change')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.removeImageButton}
                          onPress={handleRemoveImage}
                          disabled={isLoading}
                        >
                          <Icon name="delete" size={16} color="#FFFFFF" />
                          <Text style={styles.removeImageText}>{t('register.remove')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.uploadPlaceholder}
                      onPress={handleUploadPress}
                      disabled={isLoading}
                      activeOpacity={0.7}
                    >
                      <Icon name="add-a-photo" size={48} color={COLORS.BBBBBB} />
                      <Text style={styles.uploadText}>{t('register.tapToUploadImage')}</Text>
                      <Text style={styles.uploadSubtext}>
                        {t('register.chooseFromLibraryOrTakeAPhoto')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                {imageError && imageErrorMessage && (
                  <Text style={styles.styleErrorText}>{imageErrorMessage}</Text>
                )}
              </View>
              <View style={styles.checkboxRow}>
                <RadioButton.Android
                  value="agree"
                  status={checked ? 'checked' : 'unchecked'}
                  onPress={() => setChecked(!checked)}
                  color="#4CAF50"
                  uncheckedColor="#4CAF50"
                />
                <Text style={styles.termOfUse}>{t('auth.termOfUse')}</Text>
              </View>
              <View style={styles.bottomStyle}>
                <View>
                  <Button
                    title={isLoading ? t('auth.btnRegister') + '...' : t('auth.btnRegister')}
                    mode="contained"
                    onPress={handleRegister}
                    loading={isLoading}
                    disabled={isLoading || !checked}
                    style={isLoading || !checked ? styles.disableButton : styles.loginButton}
                    labelStyle={styles.btnSignIn}
                  />
                </View>
              </View>
              <View style={commonStyles.centerContainer}>
                <TouchableOpacity onPress={goToLogin}>
                  <Text style={styles.loginHere}>{t('auth.loginHere')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Image Picker Modal */}
      <ImagePickerModal
        visible={showImagePicker}
        slideAnim={slideAnim}
        opacityAnim={opacityAnim}
        onClose={closeModal}
        onTakePhoto={handleTakePhoto}
        onChooseFromLibrary={handleChooseFromLibrary}
      />
    </SafeAreaView>
  );
};

export default Register;
