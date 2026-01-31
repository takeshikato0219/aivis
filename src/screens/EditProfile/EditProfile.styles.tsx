import { StyleSheet, Platform } from 'react-native';
import { COLORS, FONTS, SPACING } from '@constants/theme';
import { isTablet } from '@utils/responsive';

export const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  safeAreaContainer: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.md,
    paddingBottom: 100,
  },
  scrollContentTablet: {
    paddingHorizontal: 40,
  },
  content: {
    width: '100%',
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 10,
  },
  contentTablet: {
    maxWidth: 700,
    alignSelf: 'center',
    justifyContent: 'flex-start',
    paddingTop: '5%',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    justifyContent: 'flex-start',
    paddingHorizontal: 24,
    marginTop: 20,
  },
  headerTablet: {
    paddingTop: 4,
    paddingBottom: 8,
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
    marginRight: 40,
  },
  headerTitle: {
    color: COLORS.background,
    fontSize: 20,
    fontWeight: FONTS.weights.bold,
  },

  title: {
    fontSize: isTablet() ? 30 : 24,
    color: COLORS.background,
    fontWeight: FONTS.weights.bold,
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    marginBottom: 16,
    backgroundColor: 'transparent',
    elevation: 0,
    borderWidth: 0,
  },

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: COLORS.main,
  },
  changeAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.main,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeAvatarTextButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changeAvatarText: {
    color: COLORS.success,
    fontSize: 14,
    fontWeight: FONTS.weights.medium,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Form
  label: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    color: COLORS.main,
    marginBottom: 4,
  },
  input: {
    marginBottom: 12,
    backgroundColor: COLORS['3E3E3E'],
    fontSize: isTablet() ? 25 : 19,
    height: isTablet() ? 70 : 56,
  },
  styleErrorText: {
    color: COLORS.error,
    marginBottom: 5,
    fontSize: isTablet() ? 25 : 16,
  },
  fixedButtonContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 50 : 20,
  },
  saveButton: {
    height: isTablet() ? 60 : 50,
    borderRadius: 40,
    backgroundColor: COLORS.main,
    justifyContent: 'center',
  },
  btnSave: {
    fontSize: isTablet() ? 18 : 16,
    fontWeight: FONTS.weights.medium,
    color: COLORS.background,
  },
  paddingView: {
    paddingHorizontal: 16,
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  removeImageButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
