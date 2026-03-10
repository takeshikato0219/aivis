import { StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@constants/theme';
import { isTablet, scale } from '@utils/responsive';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
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

  card: {
    borderRadius: 24,
    marginTop: isTablet() ? 40 : 24,
    marginBottom: isTablet() ? 40 : 24,
    marginHorizontal: 24,
  },

  videoWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
  },

  cardImage: {
    width: '100%',
    height: 250,
  },

  cardBadge: {
    position: 'absolute',
    right: 24,
    top: 24,
    backgroundColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },

  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.FF0000,
    marginRight: 6,
  },

  badgeText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: FONTS.weights.medium,
  },

  cartSecurityMode: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 21,
  },

  textSecurityMode: {
    color: COLORS.card,
    fontSize: isTablet() ? 32 : 22,
    fontWeight: FONTS.weights.medium,
  },

  filterRow: {
    marginHorizontal: scale(24),
    marginBottom: scale(32),
  },

  filterContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  filterBtn: {
    backgroundColor: 'rgba(24, 54, 86, 0.6)',
    borderRadius: 18,
    padding: scale(10),
    marginRight: scale(8),
    borderWidth: 1,
    borderColor: '#B5D2FE',
    width: isTablet() ? scale(200) : scale(125),
    justifyContent: 'space-between',
  },

  filterText: {
    color: COLORS.background,
    fontWeight: FONTS.weights.medium,
    fontSize: isTablet() ? 26 : 16,
  },

  filterSmall: {
    color: COLORS.background,
    fontWeight: FONTS.weights.medium,
    fontSize: isTablet() ? 20 : 11,
  },

  activeFilterBtn: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },

  filterBtnActiveWarning: {
    borderWidth: 2,
    borderColor: 'rgb(7,181,255)',
  },

  rowFront: {
    borderRadius: 22,
    padding: 16,
    minHeight: 70,
    marginHorizontal: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  rowBack: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 24,
    width: 80,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  deleteBtn: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  itemSeparator: {
    height: 12,
  },

  scrollViewPaddingBottom: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  disableBackground: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  disableText: {
    color: COLORS.gray9A9A9A,
  },
  disableIcon: {
    opacity: 0.4,
  },
});
