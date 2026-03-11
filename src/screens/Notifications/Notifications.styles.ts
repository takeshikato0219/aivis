import { StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@constants/theme';
import { isTablet } from '@utils/responsive';

export const styles = StyleSheet.create({
  container: {
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
  content: {
    flex: 1,
  },
  headerCard: {
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  notificationCard: {
    marginBottom: 8,
    backgroundColor: '#181717',
    borderRadius: 16,
  },
  unreadCard: {
    backgroundColor: COLORS.primary + '10',
  },
  timeText: {
    opacity: 0.6,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 10,
    marginBottom: 10,
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
  },

  headerTitle: {
    fontSize: isTablet() ? 35 : 20,
    fontWeight: FONTS.weights.medium,
    color: COLORS.background,
  },
  noData: {
    alignItems: 'center',
    marginTop: 32,
  },
  loadingMoreContainer: {
    alignItems: 'center',
    padding: 16,
  },
});
