import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Text, Card, Divider, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@redux/store';
import { loginAsync } from '@redux/slices/authSlice';
import Button from '@components/Button/Button';
import TextInput from '@components/TextInput/TextInput';
import { useResponsive } from '@hooks/useResponsive';
import { useErrorHandler } from '@hooks/useErrorHandler';
import { useAppSetup } from '@hooks/useAppSetup';
import { styles } from './LoginScreen.styles';
import { isEmail, isPassword } from '@utils/validate';
import { COLORS } from '@constants/theme';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { isLoading } = useAppSelector((state) => state.auth);
  const responsive = useResponsive();
  const { handleError, handleNetworkError } = useErrorHandler();
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // USING COMMON HOOKS
  const { isConnected } = useAppSetup({ screenName: 'LoginScreen' });

  const handleLogin = async () => {
    const newErrors: { email?: string; password?: string } = {};
    newErrors.email = isEmail(email);
    newErrors.password = isPassword(password);

    setErrors(newErrors);
    if (newErrors.email || newErrors.password) return;

    // CHECK NETWORK FROM HOOK
    if (!isConnected) {
      handleNetworkError();
      return;
    }

    try {
      await dispatch(loginAsync({ email, password })).unwrap();
    } catch (err) {
      handleError(err, true);
    }
  };

  const handleRegister = () => {
    Alert.alert('Info', 'Register feature coming soon');
  };

  const handleForgotPassword = () => {
    Alert.alert('Info', 'Forgot password feature coming soon');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
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
            testID="login-scroll"
          >
            <View style={[styles.content, responsive.isTablet && styles.contentTablet]}>
              {/* Header */}
              <View style={styles.header}>
                <Text variant="displaySmall" style={styles.title}>
                  Welcome Back
                </Text>
                <Text variant="bodyLarge" style={styles.subtitle}>
                  Sign in to continue
                </Text>
              </View>

              {/* Login Card */}
              <Card style={styles.card} elevation={2}>
                <Card.Content>
                  <Text variant="titleLarge" style={styles.cardTitle}>
                    Login
                  </Text>

                  <TextInput
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    icon="email"
                    keyboardType="email-address"
                    placeholder="example@email.com"
                    disabled={isLoading}
                    style={styles.input}
                  />
                  {errors.email && <Text style={{ color: COLORS.error }}>{errors.email}</Text>}
                  <TextInput
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    icon="lock"
                    secureTextEntry
                    placeholder="Enter your password"
                    disabled={isLoading}
                    style={styles.input}
                  />
                  {errors.password && (
                    <Text style={{ color: COLORS.error }}>{errors.password}</Text>
                  )}
                  <Button
                    title={isLoading ? 'Signing in...' : 'Sign In'}
                    mode="contained"
                    icon="login"
                    onPress={handleLogin}
                    loading={isLoading}
                    disabled={isLoading}
                    style={styles.loginButton}
                  />

                  <Divider style={styles.divider} />

                  <Button
                    title="Forgot Password?"
                    mode="text"
                    icon="help-circle"
                    onPress={handleForgotPassword}
                    disabled={isLoading}
                  />
                </Card.Content>
              </Card>

              {/* Register Card */}
              <Card style={styles.registerCard} elevation={1}>
                <Card.Content style={styles.registerContent}>
                  <Text variant="bodyMedium">Don't have an account?</Text>
                  <Button
                    title="Create Account"
                    mode="outlined"
                    icon="account-plus"
                    onPress={handleRegister}
                    disabled={isLoading}
                    style={styles.registerButton}
                  />
                </Card.Content>
              </Card>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default LoginScreen;
