import { StyleSheet, Platform, StatusBar } from 'react-native';
import { COLORS } from '@constants/theme';

// Calculate top offset for Dynamic Island
const getTopOffset = () => {
  if (Platform.OS === 'ios') {
    const version =
      typeof Platform.Version === 'string' ? parseInt(Platform.Version, 10) : Platform.Version;

    if (version >= 16) {
      return 54; // Dynamic Island
    }

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
