import { StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@constants/theme';
import { isTablet } from '@utils/responsive';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020205',
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
  styleButton: {
    flexDirection: 'row',
    marginHorizontal: 24,
    padding: 16,
    backgroundColor: '#101820',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 80,
  },
  styleViewButton: {
    marginTop: 20,
    gap: 14,
  },
  styleText: {
    color: COLORS.background,
    fontSize: 20,
    fontWeight: FONTS.weights.medium,
  },
  styleTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  styleButtonDelete: {
    flexDirection: 'row',
    marginHorizontal: 24,
    padding: 16,
    backgroundColor: '#c20b0b',
    borderRadius: 22,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleButtonUpdate: {
    marginRight: 12,
    marginLeft: 12,
  },
  newBadgeContainer: {
    position: 'absolute',
    top: 8,
    right: 16,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 10,
    alignSelf: 'flex-end',
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  relativeContainer: {
    position: 'relative',
  },
});
