import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const baseWidth = 375;

export const scale = (size: number): number => {
  const newSize = (SCREEN_WIDTH / baseWidth) * size;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const scaleFont = (size: number): number => scale(size);

export const getResponsivePadding = () => {
  const minDimension = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT);
  if (minDimension >= 768) {
    return { small: 12, medium: 20, large: 32, xlarge: 48 };
  }
  return { small: 8, medium: 16, large: 24, xlarge: 32 };
};

export const isTablet = (): boolean => {
  return Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) >= 768;
};
