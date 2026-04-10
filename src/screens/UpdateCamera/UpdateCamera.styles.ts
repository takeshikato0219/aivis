import { StyleSheet } from 'react-native';
import { isTablet } from '@utils/responsive';
import { COLORS, FONTS } from '@constants/theme';

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
  styleViewButton: {
    marginTop: 20,
    gap: 14,
    marginHorizontal: 22,
  },
  styleText: {
    fontSize: isTablet() ? 35 : 20,
    fontWeight: FONTS.weights.medium,
    color: COLORS.background,
  },
  styleButton: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#101820',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 65,
  },
  styleTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  styleButtonUpdate: {
    marginRight: 12,
  },
  styleButtonRelative: {
    position: 'relative',
  },
  styleButtonDisabled: {
    backgroundColor: '#2D3748',
    opacity: 0.5,
  },
  newBadgeContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 10,
    alignSelf: 'flex-end',
  },
  newBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 10,
    letterSpacing: 1,
  },
});
