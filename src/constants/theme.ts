import { scaleFont, getResponsivePadding, isTablet } from '@utils/responsive';

const padding = getResponsivePadding();

export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  background: '#FFFFFF',
  surface: '#F2F2F7',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  textTertiary: '#C7C7CC',
  border: '#E5E5EA',
  divider: '#E5E5EA',
};

export const FONTS = {
  sizes: {
    xs: scaleFont(12),
    sm: scaleFont(14),
    md: scaleFont(16),
    lg: scaleFont(18),
    xl: scaleFont(20),
    xxl: scaleFont(24),
    xxxl: scaleFont(32),
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
};

export const SPACING = {
  xs: padding.small / 2,
  sm: padding.small,
  md: padding.medium,
  lg: padding.large,
  xl: padding.xlarge,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};

export const SIZES = {
  buttonHeight: isTablet() ? 56 : 48,
  inputHeight: isTablet() ? 52 : 44,
};
