import { StyleSheet } from 'react-native';
import { COLORS } from '@constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.text,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 20,
    color: COLORS.card,
  },
});
