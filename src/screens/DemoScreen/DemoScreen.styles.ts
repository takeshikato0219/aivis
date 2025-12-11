import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  card: {
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  spacing: {
    marginTop: 8,
  },
  miniDivider: {
    marginVertical: 8,
  },
  divider: {
    marginVertical: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 16,
  },
  bottomSpace: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});
