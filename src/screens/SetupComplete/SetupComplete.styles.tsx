import { StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 24,
  },
  styleLandscape: {
    alignItems: 'center',
    paddingBottom: 120,
    marginTop: 50,
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
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFF',
  },
  logoSubtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 4,
  },
  successIconContainer: {
    marginBottom: 17,
  },
  messageContainer: {
    alignItems: 'center',
    marginBottom: 99,
  },
  successTitle: {
    fontSize: 39,
    fontWeight: FONTS.weights.medium,
    color: COLORS.card,
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    fontWeight: FONTS.weights.regular,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 8,
  },
  cameraCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 40,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#2A3A45',
    marginBottom: 90,
  },
  cameraCardLandscape: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 40,
    padding: 20,
    width: 500,
    borderWidth: 1,
    borderColor: '#2A3A45',
    marginBottom: 40,
    alignSelf: 'center',
  },
  cameraImageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(0,217,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cameraInfo: {
    flex: 1,
  },
  cameraName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  cameraSerial: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  bottomContainer: {
    paddingBottom: 24,
    gap: 12,
  },
  dashboardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00D9FF',
    borderRadius: 40,
    paddingVertical: 16,
    gap: 8,
  },
  dashboardButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A2A35',
    borderRadius: 40,
    paddingVertical: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#2A3A45',
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});
