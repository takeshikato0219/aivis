import React from 'react';
import { Button as PaperButton } from 'react-native-paper';
import { ViewStyle, TextStyle } from 'react-native';
import { styles } from './Button.styles';

interface ButtonProps {
  title: string;
  onPress: () => void;
  mode?: 'text' | 'outlined' | 'contained' | 'elevated' | 'contained-tonal';
  icon?: string;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  mode = 'contained',
  icon,
  loading = false,
  disabled = false,
  style,
  contentStyle,
  labelStyle,
}) => {
  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      icon={icon}
      loading={loading}
      disabled={disabled}
      style={[styles.button, disabled && styles.disabledButton, style]}
      contentStyle={[styles.content, contentStyle]}
      labelStyle={[styles.label, labelStyle]}
    >
      {title}
    </PaperButton>
  );
};

export default Button;
