import { StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@constants/theme';
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
    padding: 20,
  },
  scrollContentTablet: {
    paddingHorizontal: 40,
  },
  header: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTablet: {
    paddingTop: 4,
    paddingBottom: 8,
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
  styleCreateAcc: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  card: {
    marginBottom: 16,
    backgroundColor: 'transparent',
    elevation: 0,
    borderWidth: 0,
    flex: 1,
  },
  label: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.success,
    marginBottom: 4,
  },
  input: {
    marginBottom: 12,
    backgroundColor: COLORS['3E3E3E'],
    fontSize: isTablet() ? 25 : 19,
    height: isTablet() ? 70 : 56,
  },
  absoluteFill: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  loginHere: {
    color: COLORS.success,
    fontSize: isTablet() ? 25 : 16,
    marginTop: 39,
  },
  styleErrorText: {
    color: COLORS.error,
    marginBottom: 5,
    fontSize: isTablet() ? 25 : 16,
  },
  button: {
    backgroundColor: COLORS.success,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    marginVertical: 8,
    width: '100%',
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: FONTS.weights.bold,
    textAlign: 'center',
  },
});
