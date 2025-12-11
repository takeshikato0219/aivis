import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export interface ResponsiveInfo {
  width: number;
  height: number;
  isPortrait: boolean;
  isLandscape: boolean;
  isTablet: boolean;
  isPhone: boolean;
  scale: number;
  fontScale: number;
}

export const useResponsive = (): ResponsiveInfo => {
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const { width, height, scale, fontScale } = dimensions;
  const isPortrait = height >= width;
  const isTablet = Math.min(width, height) >= 768;

  return {
    width,
    height,
    isPortrait,
    isLandscape: !isPortrait,
    isTablet,
    isPhone: !isTablet,
    scale,
    fontScale,
  };
};
