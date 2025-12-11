import React, { useState } from 'react';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { ViewStyle, TextInputProps as RNTextInputProps } from 'react-native';
import { styles } from './TextInput.styles';

interface TextInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  mode?: 'flat' | 'outlined';
  icon?: string;
  rightIcon?: string;
  secureTextEntry?: boolean;
  keyboardType?: RNTextInputProps['keyboardType'];
  multiline?: boolean;
  numberOfLines?: number;
  error?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  mode = 'outlined',
  icon,
  rightIcon,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  error = false,
  disabled = false,
  style,
}) => {
  const [secureText, setSecureText] = useState(secureTextEntry);

  return (
    <PaperTextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      mode={mode}
      left={icon ? <PaperTextInput.Icon icon={icon} /> : undefined}
      right={
        secureTextEntry ? (
          <PaperTextInput.Icon
            icon={secureText ? 'eye' : 'eye-off'}
            onPress={() => setSecureText(!secureText)}
          />
        ) : rightIcon ? (
          <PaperTextInput.Icon icon={rightIcon} />
        ) : undefined
      }
      secureTextEntry={secureText}
      keyboardType={keyboardType}
      multiline={multiline}
      numberOfLines={numberOfLines}
      error={error}
      disabled={disabled}
      style={[styles.input, style]}
    />
  );
};

export default TextInput;
