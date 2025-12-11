import { StyleSheet } from 'react-native';
import { COLORS } from '@constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  unreadCard: {
    backgroundColor: COLORS.primary + '10',
  },
  timeText: {
    opacity: 0.6,
    marginTop: 8,
  },
});
