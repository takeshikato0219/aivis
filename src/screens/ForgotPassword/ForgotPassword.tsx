import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './ForgotPassword.styles';
import { useResponsive } from '@hooks/useResponsive';
import { Text } from 'react-native-paper';
import TextInput from '@components/TextInput/TextInput';
import { EmailOutlineIcon } from '@components/IconCustom/IconCustom';
import { COLORS } from '@constants/theme';
import { useAppSelector } from '@redux/store';
import { useTranslation } from 'react-i18next';
import { useInput } from '@hooks/useInput';
import { isEmail } from '@utils/validate';
import { useErrorHandler } from '@hooks/useErrorHandler';
import { useAppSetup } from '@hooks/useAppSetup';
import Logo from '@assets/svg/logo.svg';
import LoginBackground from '@assets/svg/login-background.svg';
import { LoginScreenNavigationProp } from '@navigation/types';
import { useNavigation } from '@react-navigation/native';
import authService from '@/services/authService';

const ForgotPassword: React.FC = () => {
  const { isLoading } = useAppSelector((state) => state.auth);
  const { t } = useTranslation();
  const { handleError, handleNetworkError } = useErrorHandler();
  const { isConnected } = useAppSetup({ screenName: 'Register' });
  const responsive = useResponsive();
  const navigation = useNavigation<LoginScreenNavigationProp>();

  const Container = responsive.isLandscape ? ScrollView : View;
  const containerProps = responsive.isLandscape
    ? {
        contentContainerStyle: [
          styles.scrollContent,
          responsive.isTablet && styles.scrollContentTablet,
        ],
        keyboardShouldPersistTaps: 'handled' as const,
        showsVerticalScrollIndicator: false,
        testID: 'login-scroll',
      }
    : {
        style: [styles.scrollContent, responsive.isTablet && styles.scrollContentTablet],
      };

  const emailInput = useInput({
    validateFn: isEmail,
  });

  const handleForgotPassword = async () => {
    const isEmailValid = emailInput.validate();

    if (!isEmailValid) {
      return;
    }

    if (!isConnected) {
      handleNetworkError();
      return;
    }

    try {
      const response = await authService.forgotPassword(emailInput.value);
      Alert.alert(t('home.notifications'), response.message, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      handleError(error);
    }
  };

  const goToLogin = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  return (
    <SafeAreaView style={[styles.container]}>
      <View style={styles.absoluteFill}>
        <LoginBackground width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
      </View>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={undefined}>
        <Container {...containerProps}>
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
              </View>
            </View>
          </TouchableWithoutFeedback>
          <View style={styles.styleCreateAcc}>
            <TouchableOpacity style={styles.button} onPress={handleForgotPassword}>
              <Text style={styles.buttonText}>{t('auth.completion')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goToLogin}>
              <Text style={styles.loginHere}>{t('auth.loginHere')}</Text>
            </TouchableOpacity>
          </View>
        </Container>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ForgotPassword;
