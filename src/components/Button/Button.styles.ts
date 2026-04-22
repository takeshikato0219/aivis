import { StyleSheet } from 'react-native';
import { FONTS } from '@constants/theme';
import { isTablet } from '@utils/responsive';

export const styles = StyleSheet.create({
  button: {
    marginVertical: 4,
  },
  content: {
    minHeight: isTablet() ? 65 : 30,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  label: {
    fontSize: FONTS.sizes.md,
    lineHeight: 20,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.7,
  },
});
