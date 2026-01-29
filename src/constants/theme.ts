import { getResponsivePadding, isTablet } from '@utils/responsive';

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
  gray696969: '#696969',
  BBBBBB: '#BBBBBB',
  CACACA: '#CACACA',
  gray9A9A9A: '#9A9A9A',
  B8B8B8: '#B8B8B8',
  '3E3E3E': '#3E3E3E',
  FF0000: '#FF0000',
  main: '#00ADD4',
};

export const DARK_COLORS = {
  primary: '#0A84FF',
  secondary: '#5E5CE6',
  success: '#30D158',
  warning: '#FFD60A',
  error: '#FF453A',
  background: '#1C1C1E',
  surface: '#2C2C2E',
  card: '#242426',
  text: '#FFFFFF',
  textSecondary: '#A1A1AA',
  textTertiary: '#636366',
  border: '#3A3A3C',
  divider: '#48484A',
  gray696969: '#A1A1AA',
};

export const FONTS = {
  sizes: {
    xs: isTablet() ? 14 : 12,
    sm: isTablet() ? 16 : 14,
    md: isTablet() ? 18 : 16,
    lg: isTablet() ? 20 : 18,
    xl: isTablet() ? 24 : 20,
    xxl: isTablet() ? 28 : 24,
    xxxl: isTablet() ? 36 : 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
  },
  align: {
    left: 'left' as const,
    right: 'right' as const,
    center: 'center' as const,
    justify: 'justify' as const,
    alignSelfStart: 'flex-start' as const,
    alignSelfEnd: 'flex-end' as const,
    alignSelfCenter: 'center' as const,
    alignSelfStretch: 'stretch' as const,
    alignSelfBaseline: 'baseline' as const,
    alignSelfAuto: 'auto' as const,
  },
};

export const SPACING = {
  xs: padding.small / 2,
  sm: padding.small,
  md: padding.medium,
  lg: padding.large,
  xl: padding.xlarge,
  ml2: isTablet() ? 4 : 2,
  ml4: isTablet() ? 8 : 4,
  ml6: isTablet() ? 12 : 6,
  ml8: isTablet() ? 16 : 8,
  ml10: isTablet() ? 20 : 10,
  ml12: isTablet() ? 24 : 12,
  ml14: isTablet() ? 28 : 14,
  ml16: isTablet() ? 32 : 16,
  ml18: isTablet() ? 36 : 18,
  ml20: isTablet() ? 40 : 20,
  mr2: isTablet() ? 4 : 2,
  mr4: isTablet() ? 8 : 4,
  mr6: isTablet() ? 12 : 6,
  mr8: isTablet() ? 16 : 8,
  mr10: isTablet() ? 20 : 10,
  mr12: isTablet() ? 24 : 12,
  mr14: isTablet() ? 28 : 14,
  mr16: isTablet() ? 32 : 16,
  mr18: isTablet() ? 36 : 18,
  mr20: isTablet() ? 40 : 20,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
};

export const SIZES = {
  buttonHeight: isTablet() ? 56 : 48,
  inputHeight: isTablet() ? 52 : 44,
  maxContentWidth: isTablet() ? 600 : 450,
};
