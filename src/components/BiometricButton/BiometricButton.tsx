import React from 'react';
import { View, Pressable } from 'react-native';
import { Text, Icon, ActivityIndicator } from 'react-native-paper';
import { useResponsive } from '@hooks/useResponsive';
import { COLORS } from '@constants/theme';
import { styles } from './BiometricButton.styles';

export const BiometricButton: React.FC<any> = ({
  iconName,
  onPress,
  disabled = false,
  isLoading = false,
  style,
}) => {
  const responsive = useResponsive();

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="small" color={COLORS.primary} testID="ActivityIndicator" />
        <Text variant="bodySmall" style={styles.loadingText}>
          Checking biometric...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.squareButton,
          responsive.isTablet && styles.squareButtonTablet,
          pressed && styles.pressed,
          disabled && styles.disabled,
        ]}
        testID="Pressable"
      >
        <Icon
          source={iconName}
          size={responsive.isTablet ? 35 : 26}
          color={disabled ? COLORS.textSecondary : COLORS.main}
        />
      </Pressable>
    </View>
  );
};
