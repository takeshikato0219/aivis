import { StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@constants/theme';

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
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
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 16,
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
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    marginLeft: 14,
  },

  // Profile Card
  profileCard: {
    backgroundColor: 'rgba(34, 62, 92, 0.8)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.main,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    alignItems: 'center',
  },
  userName: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: FONTS.weights.bold,
    marginBottom: 8,
  },
  userEmail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    marginBottom: 4,
  },
  userPhone: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.main,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Settings Section
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: COLORS.background,
    fontSize: 20,
    fontWeight: FONTS.weights.bold,
    marginBottom: 16,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 62, 92, 0.6)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 82, 82, 0.2)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FF5252',
  },
  logoutText: {
    color: '#FF5252',
    fontSize: 16,
    fontWeight: FONTS.weights.medium,
    marginLeft: 8,
  },
});
