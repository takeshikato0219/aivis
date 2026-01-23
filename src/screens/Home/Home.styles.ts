import { StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@constants/theme';

export const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
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
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  userName: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: FONTS.weights.regular,
    fontSize: 14,
  },
  subTitle: {
    color: COLORS.background,
    fontSize: 18,
    fontWeight: FONTS.weights.semiBold,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  iconBtn: {
    marginLeft: 14,
  },
  headerIcon: {
    width: 28,
    height: 28,
    tintColor: 'white',
  },
  title: {
    marginTop: 23,
    marginBottom: 31,
  },
  titleText: {
    color: COLORS.background,
    fontWeight: FONTS.weights.bold,
    fontSize: 28,
    marginBottom: 14,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  filterBtn: {
    backgroundColor: 'rgba(24, 54, 86, 0.6)',
    borderRadius: 18,
    paddingVertical: 5,
    paddingHorizontal: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#B5D2FE',
  },
  filterText: {
    color: COLORS.background,
    fontWeight: FONTS.weights.medium,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#223E5C',
    borderRadius: 50,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
  },
  videoWrapper: {
    borderRadius: 50,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  cardBadge: {
    position: 'absolute',
    right: 40,
    top: 40,
    backgroundColor: 'rgba(255,255,255,0.4)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.FF0000,
    marginRight: 6,
  },
  badgeText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: FONTS.weights.medium,
  },
  cardText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    marginTop: 29,
    marginBottom: 34,
    marginLeft: 28,
    flex: 1,
  },
  addCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    marginTop: 8,
  },
  addCameraText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 18,
    marginRight: 8,
  },
  cameraIcon: {
    width: 28,
    height: 28,
    marginRight: 6,
    tintColor: '#fff',
  },
  arrowIcon: {
    width: 28,
    height: 28,
    tintColor: '#fff',
  },
  activeFilterBtn: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    alignItems: FONTS.align.alignSelfEnd,
    marginRight: 28,
  },
  manualButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 40,
    padding: 16,
    minHeight: 72,
    borderWidth: 1,
    borderColor: 'rgba(0,255,170,0.4)',
  },
  manualButtonText: {
    fontSize: 23,
    fontWeight: FONTS.weights.medium,
    color: '#FFF',
    textAlign: 'center',
    flex: 1,
  },
});
