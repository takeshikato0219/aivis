import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, FONTS, SPACING } from '@constants/theme';
import { isTablet } from '@utils/responsive';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.md,
  },
  scrollContentTablet: {
    paddingHorizontal: 40,
  },
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  content: {
    width: '100%',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  contentTablet: {
    maxWidth: 700,
    alignSelf: 'center',
    justifyContent: 'flex-start',
    paddingTop: '18%',
  },
  header: {
    alignItems: 'center',
    flex: isTablet() ? 0.3 : 0.5,
    justifyContent: 'center',
  },
  headerTablet: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  card: {
    marginBottom: 16,
    flex: 1,
    elevation: 0,
    borderWidth: 0,
  },
  input: {
    marginBottom: 12,
    backgroundColor: COLORS['3E3E3E'],
    fontSize: isTablet() ? 25 : 19,
    height: isTablet() ? 70 : 56,
  },
  loginButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.success,
    height: isTablet() ? 70 : 52,
    justifyContent: 'center',
    marginRight: 26,
  },
  registerButton: {
    color: COLORS.background,
    marginRight: 6,
    fontSize: isTablet() ? 25 : 16,
  },
  buttonText: {
    textAlign: FONTS.align.right,
    color: COLORS.CACACA,
    fontSize: isTablet() ? 25 : 16,
    marginTop: 15,
  },
  styleLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
  },
  fixedBottom: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  styleCreateAcc: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.success,
    marginBottom: 4,
  },
  btnSignIn: {
    fontSize: isTablet() ? 20 : 14,
    color: COLORS.background,
    justifyContent: 'center',
  },
  labelStyleForgotText: {
    color: COLORS.success,
    fontSize: isTablet() ? 25 : 16,
  },
  styleErrorText: {
    color: COLORS.error,
    marginBottom: 5,
    fontSize: isTablet() ? 25 : 16,
  },
  socialGoogleButton: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  socialLineButton: {
    backgroundColor: COLORS.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledText: {
    color: '#ccc',
  },
});
