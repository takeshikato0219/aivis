import React from 'react';
import { Button as PaperButton } from 'react-native-paper';
import { ViewStyle } from 'react-native';
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
}) => {
  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      icon={icon}
      loading={loading}
      disabled={disabled}
      style={[styles.button, style]}
      contentStyle={[styles.content, contentStyle]}
    >
      {title}
    </PaperButton>
  );
};

export default Button;
