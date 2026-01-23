import React, { useState, ReactNode } from 'react';
import { TextInput as PaperTextInput } from 'react-native-paper';
import { ViewStyle, TextInputProps as RNTextInputProps, Keyboard } from 'react-native';
import { styles } from './TextInput.styles';

interface TextInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  mode?: 'flat' | 'outlined';
  icon?: string | (() => ReactNode);
  rightIcon?: string;
  secureTextEntry?: boolean;
  keyboardType?: RNTextInputProps['keyboardType'];
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: RNTextInputProps['autoComplete'];
  multiline?: boolean;
  numberOfLines?: number;
  error?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
  placeholderTextColor?: string;
}

const TextInput: React.FC<TextInputProps> = ({
  label = '',
  value,
  onChangeText,
  placeholder,
  mode = 'outlined',
  icon,
  rightIcon,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize,
  autoComplete,
  multiline = false,
  numberOfLines = 1,
  error = false,
  disabled = false,
  style,
  testID,
  placeholderTextColor,
}) => {
  const [secureText, setSecureText] = useState(secureTextEntry);

  const leftIcon = icon ? <PaperTextInput.Icon icon={icon} /> : undefined;

  // Build right icon component
  const getRightIcon = () => {
    if (secureTextEntry) {
      return (
        <PaperTextInput.Icon
          icon={secureText ? 'eye-outline' : 'eye-off-outline'}
          onPress={() => {
            setSecureText(!secureText);
            Keyboard.dismiss();
          }}
          forceTextInputFocus={false}
        />
      );
    }

    if (rightIcon) {
      return <PaperTextInput.Icon icon={rightIcon} />;
    }

    return undefined;
  };

  return (
    <PaperTextInput
      label={label}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      mode={mode}
      left={leftIcon}
      right={getRightIcon()}
      secureTextEntry={secureText}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      autoComplete={autoComplete}
      multiline={multiline}
      numberOfLines={numberOfLines}
      error={error}
      disabled={disabled}
      style={[styles.input, style]}
      testID={testID}
      placeholderTextColor={placeholderTextColor}
    />
  );
};

export default TextInput;
