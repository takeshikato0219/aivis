import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { COLORS } from './theme';

export const paperLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    primaryContainer: COLORS.primary + '20',
    secondary: COLORS.secondary,
    secondaryContainer: COLORS.secondary + '20',
    tertiary: COLORS.primary,
    error: COLORS.error,
    errorContainer: COLORS.error + '20',
    background: COLORS.background,
    surface: COLORS.card,
    surfaceVariant: COLORS.card,
    onSurface: COLORS.text,
    onSurfaceVariant: COLORS.textSecondary,
    outline: COLORS.border,
    success: COLORS.success,
    warning: COLORS.warning,
  },
  roundness: 12,
};

export const paperDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: COLORS.primary,
    primaryContainer: COLORS.primary + '40',
    secondary: COLORS.secondary,
    secondaryContainer: COLORS.secondary + '40',
    tertiary: COLORS.primary,
    error: COLORS.error,
    errorContainer: COLORS.error + '40',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#CCCCCC',
    outline: '#444444',
  },
  roundness: 12,
};
