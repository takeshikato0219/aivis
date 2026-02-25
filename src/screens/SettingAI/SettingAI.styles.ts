import { StyleSheet, Platform, StatusBar } from 'react-native';
import { COLORS, FONTS } from '@constants/theme';
import { isTablet } from '@utils/responsive';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020205',
  },

  backgroundImage: {
    flex: 1,
    width: '100%',
    backgroundColor: '#101820',
  },

  imageStyle: {
    width: '100%',
    height: '100%',
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
});
