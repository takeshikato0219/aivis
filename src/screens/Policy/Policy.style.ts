import { StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@constants/theme';
import { isTablet } from '@utils/responsive';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A202C',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 10,
    height: 56,
  },

  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonIcon: {
    width: isTablet() ? 50 : 46,
    height: isTablet() ? 50 : 46,
  },

  viewTitle: {
    flex: 1,
    marginHorizontal: 14,
    justifyContent: 'center',
  },

  headerTitle: {
    fontSize: isTablet() ? 35 : 20,
    fontWeight: FONTS.weights.medium,
    color: COLORS.background,
  },
  scrollViewPaddingBottom: {
    paddingBottom: 40,
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  contentText: {
    color: '#fff',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  uploadingText: {
    marginTop: 16,
    color: '#fff',
    fontSize: 18,
    fontWeight: '500',
  },
});
