import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  StatusBar,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './ChangePassword.styles';
import { useResponsive } from '@hooks/useResponsive';
import { Text } from 'react-native-paper';
import TextInput from '@components/TextInput/TextInput';
import { LockOutlineIcon } from '@components/IconCustom/IconCustom';
import { COLORS } from '@constants/theme';
import Button from '@components/Button/Button';
import { useAppSelector, useAppDispatch } from '@redux/store';
import { useTranslation } from 'react-i18next';
import { useInput } from '@hooks/useInput';
import { isPassword, isPasswordConfirm } from '@utils/validate';
import { useErrorHandler } from '@hooks/useErrorHandler';
import { useAppSetup } from '@hooks/useAppSetup';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@navigation/types';
import { useNavigation } from '@react-navigation/native';
import BackIcon from '@assets/svg/icon-back.svg';
import HomeBackgroundImage from '@assets/png/home-background.png';
import authService from '@api/authService';
import { removeAuthData } from '@utils/authStorage';
import { logout } from '@redux/slices/authSlice';

const ChangePassword: React.FC = () => {
  const responsive = useResponsive();
  const { isLoading } = useAppSelector((state) => state.auth);
  const { t } = useTranslation();
  const { handleError, handleNetworkError } = useErrorHandler();
  const { isConnected } = useAppSetup({ screenName: 'Register' });
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();

  const oldPasswordInput = useInput({
    validateFn: isPassword,
  });

  const newPasswordInput = useInput({
    validateFn: isPassword,
  });

  const passwordConfirm = useInput({
    validateFn: (value) => isPasswordConfirm(newPasswordInput.value, value),
  });

  const handleChangePassword = async () => {
    // Validate inputs
    const isOldPasswordValid = oldPasswordInput.validate();
    const isNewPasswordValid = newPasswordInput.validate();
    const isPasswordConfirmValid = passwordConfirm.validate();

    // Check validation
    if (!isOldPasswordValid || !isNewPasswordValid || !isPasswordConfirmValid) {
      return;
    }

    // Check network
    if (!isConnected) {
      handleNetworkError();
      return;
    }

    try {
      const response = await authService.changePassword(
        oldPasswordInput.value,
        newPasswordInput.value,
        passwordConfirm.value
      );
      Alert.alert(
        response.message || t('changePassword.changePasswordSuccess', 'Password Changed'),
        t(
          'changePassword.changePasswordSuccessMessage',
          'Your password has been changed successfully. Please log in again with your new password.'
        ),
        [
          {
            text: 'OK',
            onPress: async () => {
              await removeAuthData();
              dispatch(logout());
            },
          },
        ]
      );
    } catch (error: any) {
      handleError(error);
    }
  };

  const goBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.wrapper}>
      <StatusBar translucent backgroundColor="transparent" />
      <ImageBackground
        source={HomeBackgroundImage}
        style={styles.backgroundImage}
        resizeMode="stretch"
        imageStyle={styles.imageStyle}
      >
        <SafeAreaView style={[styles.container]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={goBack} style={styles.backButton} testID="back-button">
              <BackIcon />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>{t('profile.changePassword')}</Text>
            </View>
          </View>
          <KeyboardAvoidingView style={styles.keyboardView} behavior={undefined}>
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
                  <View style={styles.card}>
                    {/* Old Password */}
                    <Text style={styles.label}>OLD PASSWORD</Text>
                    <TextInput
                      value={oldPasswordInput.value}
                      onChangeText={oldPasswordInput.handleChange}
                      icon={LockOutlineIcon}
                      secureTextEntry
                      placeholder={t('auth.placeHolderOldPassword')}
                      autoCapitalize="none"
                      autoComplete="password"
                      disabled={isLoading}
                      error={!!oldPasswordInput.error}
                      style={styles.input}
                      testID="password-input"
                      placeholderTextColor={COLORS.BBBBBB}
                    />
                    {oldPasswordInput.error && (
                      <Text style={styles.styleErrorText}>
                        {t('validate.' + oldPasswordInput.error)}
                      </Text>
                    )}
                    <Text style={styles.label}>NEW PASSWORD</Text>
                    <TextInput
                      value={newPasswordInput.value}
                      onChangeText={newPasswordInput.handleChange}
                      icon={LockOutlineIcon}
                      secureTextEntry
                      placeholder={t('auth.placeHolderNewPassword')}
                      autoCapitalize="none"
                      autoComplete="password"
                      disabled={isLoading}
                      error={!!newPasswordInput.error}
                      style={styles.input}
                      testID="password-input"
                      placeholderTextColor={COLORS.BBBBBB}
                    />
                    {newPasswordInput.error && (
                      <Text style={styles.styleErrorText}>
                        {t('validate.' + newPasswordInput.error)}
                      </Text>
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
                  </View>
                </View>
              </TouchableWithoutFeedback>
              <View style={styles.bottomStyle}>
                <View>
                  <Button
                    title={isLoading ? t('common.save') + '...' : t('common.save')}
                    mode="contained"
                    onPress={handleChangePassword}
                    loading={isLoading}
                    disabled={isLoading}
                    style={isLoading ? styles.disableButton : styles.loginButton}
                    labelStyle={styles.btnSignIn}
                  />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export default ChangePassword;
