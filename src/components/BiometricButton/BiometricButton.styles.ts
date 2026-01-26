import { StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING } from '@constants/theme';

export const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },

  text: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },

  button: {
    marginBottom: SPACING.sm,
  },

  buttonTablet: {
    transform: [{ scale: 1.1 }],
  },

  label: {
    color: COLORS.text,
    fontWeight: FONTS.weights.medium,
  },

  labelDisabled: {
    color: COLORS.textSecondary,
  },

  enabledText: {
    color: COLORS.success,
    fontWeight: FONTS.weights.semiBold,
    fontSize: FONTS.sizes.xs,
  },

  loadingText: {
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },

  squareButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(61,255,127,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    borderWidth: 1,
  },

  pressed: {
    backgroundColor: 'rgba(61,255,127,0.08)',
  },

  disabled: {
    opacity: 0.4,
  },

  squareButtonTablet: {
    width: 56,
    height: 56,
  },

  squareButtonDisabled: {
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },

  squareButtonPressed: {
    opacity: 0.85,
  },
});
