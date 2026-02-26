import { StyleSheet } from 'react-native';
import { FONTS } from '@constants/theme';
import { isTablet } from '@utils/responsive';

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0B0F14',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#EAF1F7',
    fontSize: 18,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'left',
    marginLeft: 14,
    color: '#EAF1F7',
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  headerSpacer: {
    width: 44,
  },
  subtitle: {
    marginTop: 12,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: FONTS.weights.medium,
  },

  card: {
    marginTop: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(28, 44, 60, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(120, 160, 190, 0.25)',
    overflow: 'hidden',
  },
  cardContent: {
    paddingVertical: 6,
  },
  row: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 170, 210, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  title: {
    color: '#EAF1F7',
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(234,241,247,0.16)',
  },
  footer: {
    flexDirection: 'row',
    marginTop: 18,
    gap: 10,
    alignItems: 'flex-start',
  },
  footerIcon: {
    color: '#2A9EC6',
    fontSize: 16,
    marginTop: 1,
  },
  footerText: {
    flex: 1,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: FONTS.weights.medium,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    width: isTablet() ? 50 : 46,
    height: isTablet() ? 50 : 46,
  },
  loadingText: {
    color: '#EAF1F7',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 20,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 20,
  },
  noRuleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noRuleText: {
    color: '#FFF',
    fontSize: 16,
  },
});
