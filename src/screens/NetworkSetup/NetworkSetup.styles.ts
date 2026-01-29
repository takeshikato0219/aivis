import { StyleSheet, Platform } from 'react-native';
import { isTablet, scale } from '@utils/responsive';
import { COLORS } from '@constants/theme';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeAreaContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginTop: 10,
    marginBottom: 14,
  },
  backBtn: {
    marginRight: 4,
    padding: 3,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 20,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 8,
    marginBottom: 13,
    backgroundColor: '#1A202C',
    marginHorizontal: scale(10),
    borderRadius: 8,
    paddingVertical: 6,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 22,
    borderRadius: 8,
    backgroundColor: '#1A202C',
  },
  tabBtnActive: {
    backgroundColor: COLORS.main,
  },
  tabText: {
    color: '#7BAAC4',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 11,
  },
  tabTextActive: {
    color: '#FFF',
    fontWeight: '800',
    fontSize: 16,
    marginLeft: 11,
  },
  availableTitle: {
    color: '#8CE9FF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 19,
    marginTop: 7,
    marginBottom: 6,
  },
  listStyle: {
    maxHeight: 260,
  },
  networkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 17,
    paddingVertical: 14,
    paddingHorizontal: 13,
    backgroundColor: 'rgba(27,34,50,0.7)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#20304A',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  networkItemActive: {
    backgroundColor: '#172D48',
    borderColor: '#62C5FF',
  },
  networkLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  networkName: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },
  networkSignal: {
    color: '#A6C4DE',
    fontSize: 13,
    fontWeight: '500',
  },
  signalExcellent: {
    color: '#41D5A3',
  },
  signalGood: {
    color: '#E7E46A',
  },
  signalWeak: {
    color: '#FF7157',
  },
  passwordSection: {
    marginHorizontal: 20,
    marginTop: 18,
  },
  passLabel: {
    color: '#83BFF1',
    fontWeight: '700',
    marginBottom: 7,
    fontSize: 14,
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
  systemCheck: {
    marginHorizontal: 20,
    marginTop: 29,
  },
  progressLabel: {
    color: '#85B8D8',
    fontWeight: '700',
    marginBottom: 3,
    fontSize: 13,
  },
  inProgress: {
    color: '#40D7FF',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 7,
  },
  progressBarBg: {
    height: 7,
    backgroundColor: '#234269',
    borderRadius: 9,
    marginVertical: 4,
  },
  progressBarFill: {
    height: 7,
    backgroundColor: '#49DBFF',
    borderRadius: 9,
    width: '30%',
  },
  checkDescription: {
    color: '#89A7BF',
    fontSize: 13,
    marginTop: 6,
    marginLeft: 1,
    marginBottom: 4,
    fontWeight: '500',
  },
  connectBtn: {
    backgroundColor: '#41CFFF',
    marginHorizontal: 18,
    marginTop: 25,
    marginBottom: 26,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
  },
  connectBtnDisabled: {
    backgroundColor: '#817d7d',
  },
  connectBtnText: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: '800',
  },
  connectBtnTextDisabled: {
    color: '#666666',
  },
  tabContentCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  lanText: {
    color: '#A9CAF2',
    fontSize: 16,
    fontWeight: '600',
    padding: 12,
    textAlign: 'center',
  },
  lteText: {
    color: '#A6EFFF',
    fontSize: 16,
    fontWeight: '600',
    padding: 17,
    textAlign: 'center',
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
  paddingBottomFlatList: {
    paddingBottom: 0,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 120, // Space for bottom container
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 40 : 26,
    paddingTop: 10,
  },
  rescanButton: {
    alignSelf: 'flex-end',
    marginRight: 24,
    marginBottom: 7,
  },
  rescanText: {
    fontWeight: '700',
    fontSize: 15,
  },
  rescanTextScanning: {
    color: '#7896B3',
  },
  rescanTextActive: {
    color: '#44D6FF',
  },
  scanningIndicator: {
    marginTop: 12,
  },
  emptyWifiText: {
    color: '#A8C4E1',
    textAlign: 'center',
    marginTop: 36,
    fontSize: 15,
  },
  iosWifiContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  iosWifiText: {
    color: '#A5C0DF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 12,
  },
  iosCurrentWifiText: {
    color: '#7CCDFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 7,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A3C58',
    width: '100%',
  },
});
