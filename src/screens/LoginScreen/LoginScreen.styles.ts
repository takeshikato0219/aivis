import { StyleSheet } from 'react-native';
import { COLORS } from '@constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  scrollContentTablet: {
    paddingHorizontal: 40,
  },
  content: {
    width: '100%',
  },
  contentTablet: {
    maxWidth: 500,
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.primary,
  },
  subtitle: {
    opacity: 0.7,
    textAlign: 'center',
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 12,
  },
  loginButton: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 16,
  },
  registerCard: {
    marginTop: 8,
  },
  registerContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  registerButton: {
    marginTop: 12,
  },
  infoCard: {
    marginTop: 16,
    backgroundColor: 'transparent',
  },
  infoText: {
    textAlign: 'center',
    opacity: 0.6,
  },
});
