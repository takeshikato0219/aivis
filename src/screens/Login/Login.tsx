import React, { useEffect, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector, store } from '@redux/store';
import {
  loginAsync,
  socialLineLoginAsync,
  socialLoginAsync,
  verifyTokenAsync,
} from '@redux/slices/authSlice';
import Button from '@components/Button/Button';
import TextInput from '@components/TextInput/TextInput';
import { useResponsive } from '@hooks/useResponsive';
import { useErrorHandler } from '@hooks/useErrorHandler';
import { useAppSetup } from '@hooks/useAppSetup';
import { useBiometric } from '@hooks/useBiometric';
import { BiometricButton } from '@components/BiometricButton/BiometricButton';
import { styles } from './Login.styles';
import { isEmail, isPassword } from '@utils/validate';
import { useInput } from '@hooks/useInput';
import { COLORS, FONTS } from '@constants/theme';
import { showCommonAlert } from '@components/Alert/Alert';
import { useTranslation } from 'react-i18next';
import {
  EmailOutlineIcon,
  GoogleIconComponent,
  LineIconComponent,
  LockOutlineIcon,
} from '@components/IconCustom/IconCustom';
import { LoginScreenNavigationProp } from '@navigation/types';
import { useNavigation, useIsFocused, useFocusEffect } from '@react-navigation/native';
import LoginBackground from '@assets/svg/login-background.svg';
import Logo from '@assets/svg/logo.svg';
import { setAuthData } from '@utils/authStorage';
import { disableBiometricLogin } from '@/services/biometricService';
import lineAuthService from '@api/lineAuthService';
import googleAuthService from '@api/googleAuthService';

const Login: React.FC = () => {
  const isFocused = useIsFocused();
  const hasPromptedRef = useRef(false);
  const isMountedRef = useRef(true);
  const screenFocusTimeRef = useRef<number>(0);
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const dispatch = useAppDispatch();
  const { isLoading } = useAppSelector((state) => state.auth);
  const responsive = useResponsive();
  const { handleError, handleNetworkError } = useErrorHandler();
  const { isConnected } = useAppSetup({ screenName: 'Login' });
  const { t } = useTranslation();

  const emailOrPhoneInput = useInput({
    validateFn: isEmail,
  });
  const passwordInput = useInput({
    validateFn: isPassword,
  });

  const {
    biometricInfo,
    isEnabled: isBiometricEnabled,
    isLoading: isBiometricLoading,
    biometricTypeName,
    biometricIconName,
    saveCredentials,
    getCredentials,
    refresh,
  } = useBiometric();

  useFocusEffect(
    useCallback(() => {
      hasPromptedRef.current = false;
      screenFocusTimeRef.current = Date.now();
      refresh();
      emailOrPhoneInput.reset();
      passwordInput.reset();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refresh])
  );

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const biometricAutoLogin = async (credentials: {
    accessToken?: string;
    refreshToken?: string;
  }) => {
    if (credentials?.accessToken) {
      try {
        await dispatch(
          verifyTokenAsync({
            accessToken: credentials.accessToken,
            refreshToken: credentials.refreshToken,
          })
        ).unwrap();

        const state = store.getState();
        if (state.auth.user && state.auth.accessToken) {
          await setAuthData(state.auth.accessToken, state.auth.refreshToken ?? '', state.auth.user);

          if (state.auth.accessToken !== credentials.accessToken) {
            await saveCredentials({
              accessToken: state.auth.accessToken ?? '',
              refreshToken: state.auth.refreshToken ?? '',
            });
          }
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error: any) {
        await disableBiometricLogin();
        // Show message to user
        showCommonAlert({
          title: t('biometric.tokenExpired'),
          message: t('biometric.pleaseLoginAgain'),
        });
      }
    }
  };

  const shouldTriggerBiometricAutoLogin = () => {
    return (
      isFocused &&
      biometricInfo.available &&
      isBiometricEnabled &&
      !isBiometricLoading &&
      !hasPromptedRef.current &&
      !isLoading &&
      isConnected
    );
  };

  const shouldSkipDueToTiming = () => {
    const timeSinceFocus = Date.now() - screenFocusTimeRef.current;
    return timeSinceFocus < 1000;
  };

  const performBiometricAutoLogin = async () => {
    if (!isMountedRef.current) return;
    if (!biometricInfo.available || !isBiometricEnabled) return;
    if (!isConnected) return;

    try {
      const credentials = await getCredentials();
      if (!isMountedRef.current) return;

      await biometricAutoLogin(credentials ?? {});
    } catch (err: any) {
      if (isMountedRef.current && isConnected) {
        handleError(err, true);
      }
    }
  };

  useEffect(() => {
    if (!shouldTriggerBiometricAutoLogin()) {
      return;
    }

    if (shouldSkipDueToTiming()) {
      return;
    }

    hasPromptedRef.current = true;

    const timer = setTimeout(async () => {
      await performBiometricAutoLogin();
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isFocused,
    biometricInfo.available,
    isBiometricEnabled,
    isBiometricLoading,
    isLoading,
    isConnected,
  ]);

  const handleBiometricLogin = async () => {
    if (!biometricInfo.available) {
      showCommonAlert({
        title: t('common.notAvailable'),
        message: t('biometric.notAvailableOnDevice', { type: biometricTypeName }),
      });
      return;
    }

    if (!isBiometricEnabled) {
      showCommonAlert({
        title: t('common.notEnable'),
        message: t('biometric.notEnabledYet'),
      });
      return;
    }

    if (!isConnected) {
      handleNetworkError();
      return;
    }

    try {
      const credentials = await getCredentials();
      await biometricAutoLogin(credentials ?? {});
    } catch (err: any) {
      handleError(err, true);
    }
  };

  const validateLoginInputs = () => {
    const isEmailValid = emailOrPhoneInput.validate();
    const isPasswordValid = passwordInput.validate();
    return { isEmailValid, isPasswordValid };
  };

  const showBiometricEnablePrompt = async (loginResult: any) => {
    if (!biometricInfo.available || isBiometricEnabled) {
      await saveCredentials({
        accessToken: loginResult.accessToken,
        refreshToken: loginResult.refreshToken,
      });
      return;
    }

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
                accessToken: loginResult.accessToken,
                refreshToken: loginResult.refreshToken,
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
  };

  const handleLoginSuccess = async (loginResult: any) => {
    await setAuthData(
      loginResult.accessToken ?? '',
      loginResult.refreshToken ?? '',
      loginResult.user
    );

    await showBiometricEnablePrompt(loginResult);
  };

  const handleLoginError = (err: any) => {
    if (err.message) {
      showCommonAlert({
        title: t('auth.loginFailed'),
        message: err.message,
      });
    } else {
      handleError(err, true);
    }
  };

  const handleLogin = async () => {
    const { isEmailValid, isPasswordValid } = validateLoginInputs();

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    if (!isConnected) {
      handleNetworkError();
      return;
    }

    try {
      const loginResult = await dispatch(
        loginAsync({
          email: emailOrPhoneInput.value,
          password: passwordInput.value,
        })
      ).unwrap();

      await handleLoginSuccess(loginResult);
    } catch (err: any) {
      handleLoginError(err);
    }
  };

  const handleRegister = () => {
    navigation.navigate('Register');
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };

  const handleGoogleLogin = async () => {
    if (!isConnected) {
      handleNetworkError();
      return;
    }

    try {
      const googleUser = await googleAuthService.signIn();
      const loginResult = await dispatch(
        socialLoginAsync({
          id_token: googleUser.idToken,
        })
      ).unwrap();
      await handleLoginSuccess(loginResult);
    } catch (err: any) {
      handleLoginError(err);
    }
  };

  const handleLineLogin = async () => {
    if (!isConnected) {
      handleNetworkError();
      return;
    }

    try {
      const lineUser = await lineAuthService.signIn();
      if (!lineUser) {
        return;
      }
      const loginResult = await dispatch(
        socialLineLoginAsync({
          id_token: lineUser.idToken ?? '',
        })
      ).unwrap();
      await handleLoginSuccess(loginResult);
    } catch (err: any) {
      console.error('[Login] Error details:', err);
    }
  };

  // Conditional container: ScrollView when screen is small or in landscape
  // iPhone 7/8 has height ~667px, iPhone SE ~568px
  const isSmallScreen = responsive.height < 700;
  const shouldUseScrollView = responsive.isLandscape || isSmallScreen;
  const Container = shouldUseScrollView ? ScrollView : View;
  const containerProps = shouldUseScrollView
    ? {
        contentContainerStyle: [
          styles.scrollContent,
          responsive.isTablet && styles.scrollContentTablet,
        ],
        keyboardShouldPersistTaps: 'handled' as const,
        showsVerticalScrollIndicator: false,
        testID: 'login-scroll',
        scrollEnabled: true,
        bounces: true,
        alwaysBounceVertical: true,
        overScrollMode: 'always' as const,
      }
    : {
        style: [styles.scrollContent, responsive.isTablet && styles.scrollContentTablet],
      };
  return (
    <SafeAreaView style={[styles.container]}>
      <StatusBar translucent backgroundColor="transparent" />
      <View style={styles.absoluteFill}>
        <LoginBackground width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
      </View>
      <Container {...containerProps}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={[styles.content, responsive.isTablet && styles.contentTablet]}>
              {/* Header */}
              <View style={[styles.header, responsive.isTablet && styles.headerTablet]}>
                <Logo
                  width={responsive.isTablet ? 400 : 236}
                  height={responsive.isTablet ? 100 : 68}
                />
              </View>

              {/* Login Card */}
              <View style={styles.card}>
                <Text style={styles.label}>ID/EMAIl</Text>
                <TextInput
                  value={emailOrPhoneInput.value}
                  onChangeText={emailOrPhoneInput.handleChange}
                  icon={EmailOutlineIcon}
                  keyboardType="email-address"
                  placeholder={t('auth.placeHolderMail')}
                  autoCapitalize="none"
                  autoComplete="email"
                  disabled={isLoading}
                  error={!!emailOrPhoneInput.error}
                  style={styles.input}
                  testID="email-input"
                  placeholderTextColor={COLORS.BBBBBB}
                />
                {emailOrPhoneInput.error && (
                  <Text style={styles.styleErrorText}>
                    {t('validate.' + emailOrPhoneInput.error)}
                  </Text>
                )}
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

                <View style={{ alignSelf: FONTS.align.alignSelfEnd }}>
                  <TouchableOpacity onPress={handleForgotPassword}>
                    <Text style={styles.buttonText}>{t('auth.forgotPassword')}</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.styleLoginButton}>
                  <Button
                    title={isLoading ? t('auth.signIn') + '...' : t('auth.signIn')}
                    mode="contained"
                    onPress={handleLogin}
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.loginButton}
                    labelStyle={styles.btnSignIn}
                  />
                  <BiometricButton
                    iconName={biometricIconName}
                    label={biometricTypeName}
                    onPress={handleBiometricLogin}
                    disabled={isLoading}
                    isEnabled={isBiometricEnabled}
                  />
                </View>
                <View style={styles.socialButtonRow}>
                  <TouchableOpacity
                    style={[
                      styles.socialButton,
                      styles.socialGoogleButton,
                      isLoading && styles.disabledButton,
                    ]}
                    onPress={handleGoogleLogin}
                    disabled={isLoading}
                    testID="google-login-button"
                  >
                    <View style={styles.socialButtonContent}>
                      <GoogleIconComponent />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.socialButton,
                      styles.socialLineButton,
                      isLoading && styles.disabledButton,
                    ]}
                    onPress={handleLineLogin}
                    disabled={isLoading}
                    testID="line-login-button"
                  >
                    <View style={styles.socialButtonContent}>
                      <LineIconComponent />
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
        <View pointerEvents="box-none" style={styles.fixedBottom}>
          <View style={styles.styleCreateAcc}>
            <Text style={styles.registerButton}>{t('auth.dontHaveAnAccountYet')}</Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.labelStyleForgotText}>{t('auth.register')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Container>
    </SafeAreaView>
  );
};

export default Login;
