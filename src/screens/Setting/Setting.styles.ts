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
    marginLeft: 20,
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
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionTitle: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: FONTS.weights.bold,
    marginBottom: 8,
  },
  sectionDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    minWidth: 0,
  },
  statusLabel: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: FONTS.weights.medium,
    flexShrink: 0,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: FONTS.weights.medium,
    color: COLORS.background,
    flex: 1,
    flexShrink: 1,
  },
  statusWithIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContainer: {
    gap: 12,
  },
  lineButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  subscribeButton: {
    backgroundColor: '#00C300',
  },
  unsubscribeButton: {
    backgroundColor: '#FF6B6B',
  },
  openAccountButton: {
    backgroundColor: 'rgba(0, 173, 212, 0.8)',
    borderWidth: 1,
    borderColor: COLORS.background,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: FONTS.weights.medium,
  },
});
