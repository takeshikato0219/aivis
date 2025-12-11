import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  headerCard: {
    margin: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    opacity: 0.7,
  },
  userId: {
    marginTop: 4,
    opacity: 0.5,
    fontSize: 11,
  },
  divider: {
    marginVertical: 8,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  bottomSpace: {
    height: 32,
  },
});
