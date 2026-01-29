import { StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@constants/theme';
import { isTablet } from '@utils/responsive';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
    marginBottom: 16,
  },
  backBtn: {
    marginRight: 5,
    padding: 4,
  },
  headerTitle: {
    color: COLORS.background,
    fontSize: 20,
    fontWeight: FONTS.weights.bold,
    marginLeft: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'flex-start',
  },
  introText: {
    color: '#C3E0FF',
    fontSize: 15,
    marginBottom: 7,
    fontWeight: '500',
    marginTop: 10,
  },
  inputLabel: {
    color: COLORS.main,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    marginLeft: 2,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.4,
    borderColor: '#2D3E51',
    backgroundColor: '#161F2C',
    paddingLeft: 13,
    paddingRight: 10,
    height: 46,
  },
  input: {
    marginBottom: 12,
    backgroundColor: COLORS['3E3E3E'],
    fontSize: isTablet() ? 25 : 19,
    height: isTablet() ? 70 : 56,
  },
  infoBox: {
    marginTop: 23,
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#162233',
    borderRadius: 15,
    padding: 12,
    borderWidth: 1.4,
    borderColor: '#2A5D78',
  },
  infoBoxTitle: {
    color: COLORS.main,
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 2,
  },
  infoBoxContent: {
    color: '#B2C8DE',
    fontSize: 13,
    fontWeight: '500',
  },

  connectBtn: {
    backgroundColor: COLORS.main,
    marginHorizontal: 22,
    marginBottom: 50,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
  },
  connectBtnDisabled: {
    backgroundColor: '#4A5568', // Gray color for disabled state
    opacity: 0.6,
  },
  connectBtnText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: FONTS.weights.medium,
  },
  connectBtnTextDisabled: {
    color: '#A0AEC0', // Lighter gray for disabled text
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
  styleTitlePassword: {
    marginTop: 34,
    marginBottom: 14,
  },
  textDisconnect: {
    color: COLORS.main,
  },
  styleIconInformation: {
    marginRight: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonIcon: {
    width: isTablet() ? 50 : 46,
    height: isTablet() ? 50 : 46,
  },
});
