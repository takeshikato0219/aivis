import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  headerCard: {
    marginBottom: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  welcomeText: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userText: {
    opacity: 0.7,
  },
  divider: {
    marginVertical: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  actionButton: {
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCard: {
    flex: 1,
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityItem: {
    marginBottom: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityText: {
    marginLeft: 12,
    flex: 1,
  },
  activityTime: {
    opacity: 0.6,
    marginTop: 2,
  },
  logoutButton: {
    marginTop: 8,
    marginBottom: 24,
  },
  statCardDone: {
    backgroundColor: '#4CAF5020',
  },
  statCardPending: {
    backgroundColor: '#FF980020',
  },
  statTextDone: {
    color: '#4CAF50',
  },
  statTextPending: {
    color: '#FF9800',
  },
});
