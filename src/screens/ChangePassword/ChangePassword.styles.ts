import { StyleSheet } from 'react-native';
import { BORDER_RADIUS, COLORS, FONTS } from '@constants/theme';
import { isTablet } from '@utils/responsive';

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  scrollContentTablet: {
    paddingHorizontal: 40,
  },
  header: {
    alignItems: 'center',
    flex: 0.5,
    justifyContent: 'center',
  },
  headerTablet: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  card: {
    marginBottom: 16,
    flex: isTablet() ? 0.5 : 1,
    backgroundColor: 'transparent',
    elevation: 0,
    borderWidth: 0,
  },
  label: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.main,
    marginBottom: 4,
  },
  loginButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.main,
    fontSize: FONTS.sizes.xl,
    height: isTablet() ? 70 : 52,
    justifyContent: 'center',
  },
  disableButton: {
    flex: 1,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.gray696969,
    fontSize: FONTS.sizes.xl,
    height: isTablet() ? 70 : 52,
    justifyContent: 'center',
  },
  btnSignIn: {
    fontSize: FONTS.sizes.md,
    color: COLORS.background,
  },
  input: {
    marginBottom: 12,
    backgroundColor: COLORS['3E3E3E'],
    fontSize: isTablet() ? 25 : 19,
    height: isTablet() ? 70 : 56,
  },
  bottomStyle: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  styleErrorText: {
    color: COLORS.error,
    marginBottom: 5,
    fontSize: isTablet() ? 25 : 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
    marginTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.background,
    fontSize: 20,
    fontWeight: FONTS.weights.bold,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#101820',
  },
  imageStyle: {
    width: '100%',
    height: '100%',
  },
});
