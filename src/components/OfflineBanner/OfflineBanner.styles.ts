import { StyleSheet, Platform, StatusBar } from 'react-native';
import { COLORS } from '@constants/theme';

// Calculate top offset for Dynamic Island
const getTopOffset = () => {
  if (Platform.OS === 'ios') {
    // iPhone with Dynamic Island needs more offset
    const iosVersion = parseInt(Platform.Version as string, 10);
    if (iosVersion >= 16) {
      // iPhone 14 Pro+, 15 Pro+, 16 Pro+ have Dynamic Island
      return 54;
    }
    // iPhone with notch
    return (StatusBar.currentHeight || 0) + 44;
  }
  return StatusBar.currentHeight || 0;
};

export const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.error,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: getTopOffset(), //Dynamic offset
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  text: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
