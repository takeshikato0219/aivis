import { StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../constants/theme';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },

  paddingSm: {
    padding: SPACING.sm,
  },
  paddingMd: {
    padding: SPACING.md,
  },
  paddingLg: {
    padding: SPACING.lg,
  },
  paddingXl: {
    padding: SPACING.xl,
  },

  marginSm: {
    margin: SPACING.sm,
  },
  marginMd: {
    margin: SPACING.md,
  },
  marginLg: {
    margin: SPACING.lg,
  },

  textCenter: {
    textAlign: 'center',
  },
  textBold: {
    fontWeight: FONTS.weights.bold,
  },
  textSemiBold: {
    fontWeight: FONTS.weights.semiBold,
  },

  row: {
    flexDirection: 'row',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.md,
  },
});
