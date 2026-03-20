import { StyleSheet } from 'react-native';
import { COLORS, FONTS } from '@constants/theme';
import { isTablet, scale } from '@utils/responsive';

export const CONTAINER_H_PADDING = scale(20);
export const CARD_PADDING = scale(18);

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#0B0F14',
  },
  container: {
    flex: 1,
    paddingHorizontal: CONTAINER_H_PADDING,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  backBtn: {
    width: scale(44),
    height: scale(44),
    borderRadius: scale(22),
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: '#EAF1F7',
    fontSize: scale(18),
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'left',
    marginLeft: scale(14),
    color: '#EAF1F7',
    fontSize: scale(20),
    fontWeight: '700',
    letterSpacing: 0.3,
    flexShrink: 1,
  },
  headerSpacer: { width: scale(44) },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  card: {
    marginTop: 16,
    borderRadius: scale(26),
    padding: CARD_PADDING,
    backgroundColor: 'rgba(28, 44, 60, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(120, 160, 190, 0.25)',
  },

  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: COLORS.card,
    fontSize: scale(20),
    fontWeight: FONTS.weights.medium,
    flexShrink: 1,
  },
  blueLine: {
    height: 1,
    backgroundColor: '#5C5C5C',
    marginTop: scale(14),
    borderRadius: 2,
    opacity: 0.9,
  },

  sectionLabel: {
    marginTop: scale(16),
    color: 'rgba(234,241,247,0.6)',
    fontSize: scale(16),
    fontWeight: FONTS.weights.medium,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scale(12),
    gap: scale(6),
  },
  dayChip: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: scale(46),
    maxHeight: scale(46),
    borderRadius: scale(23),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipActive: {
    backgroundColor: '#2A9EC6',
    shadowColor: '#2A9EC6',
    shadowOpacity: 0.55,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  dayChipInactive: {
    backgroundColor: 'rgba(0,0,0,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(160, 190, 210, 0.25)',
  },
  dayChipDisabled: {
    backgroundColor: '#d1d5db', // gray background
    borderColor: '#d1d5db',
  },
  dayChipText: {
    fontSize: scale(16),
    fontWeight: FONTS.weights.semiBold,
  },
  dayChipTextActive: {
    color: '#EAF1F7',
  },
  dayChipTextInactive: {
    color: 'rgba(234,241,247,0.8)',
  },
  dayChipTextDisabled: {
    color: '#888', // gray text
    opacity: 1,
  },
  divider: {
    height: 1,
    marginTop: scale(16),
    backgroundColor: 'rgba(234,241,247,0.16)',
  },

  timeHeaderRow: {
    marginTop: scale(14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: scale(8),
  },
  timeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: scale(8),
    flexShrink: 1,
  },
  timeIcon: {
    width: scale(32),
    height: scale(32),
    borderRadius: scale(16),
    backgroundColor: 'rgba(0, 170, 210, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeIconText: {
    fontSize: scale(14),
  },
  timeLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: scale(16),
    fontWeight: FONTS.weights.medium,
    flexShrink: 1,
  },
  timePill: {
    paddingHorizontal: scale(12),
    paddingVertical: scale(6),
    borderRadius: scale(18),
    borderWidth: 1,
    borderColor: 'rgba(160, 190, 210, 0.22)',
    backgroundColor: 'rgba(10, 14, 20, 0.18)',
  },
  timePillText: {
    color: '#EAF1F7',
    fontSize: scale(16),
    fontWeight: FONTS.weights.medium,
  },
  sliderContainer: {
    marginTop: scale(10),
  },
  sliderTrack: {
    height: scale(8),
    borderRadius: scale(8),
  },
  sliderSelected: {
    backgroundColor: '#2A9EC6',
  },
  sliderUnselected: {
    backgroundColor: 'rgba(234,241,247,0.25)',
  },
  sliderMarker: {
    height: scale(20),
    width: scale(20),
    borderRadius: scale(14),
    backgroundColor: '#F2F6FA',
    borderWidth: 3,
    borderColor: '#2A9EC6',
  },
  sliderAlignCenter: {
    alignSelf: 'center',
  },
  timeTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scale(8),
    paddingHorizontal: 4,
  },
  tickText: {
    color: 'rgba(234,241,247,0.55)',
    fontSize: scale(11),
    fontWeight: '700',
  },
  saveBtn: {
    marginTop: 24,
    marginBottom: 24,
    height: scale(56),
    borderRadius: scale(35),
    backgroundColor: '#2A9EC6',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: scale(8),
  },
  saveIcon: {
    color: COLORS.card,
    fontSize: scale(21),
    fontWeight: FONTS.weights.medium,
  },
  saveText: {
    color: COLORS.card,
    fontSize: scale(21),
    fontWeight: FONTS.weights.medium,
  },
  multipleSelectRow: {
    marginBottom: 18,
  },
  memberChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberChip: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#2A9EC6',
    backgroundColor: '#F2F6FA',
  },
  memberChipActive: {
    backgroundColor: '#2A9EC6',
    borderColor: '#2A9EC6',
  },
  memberChipInactive: {
    backgroundColor: '#F2F6FA',
    borderColor: '#2A9EC6',
  },
  memberChipText: {
    fontSize: 15,
    color: '#2A3440',
  },
  memberChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  memberChipTextInactive: {
    color: '#2A3440',
  },
  styleMultipleSelectRow: {
    marginTop: 8,
    backgroundColor: 'rgba(28, 44, 60, 0.55)',
    color: COLORS.card,
  },
  select2Trigger: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  button: {
    paddingHorizontal: 16,
    backgroundColor: '#2A9EC6',
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  text: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    flexShrink: 1,
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    width: isTablet() ? 50 : 46,
    height: isTablet() ? 50 : 46,
  },
  dropDownItemStyleEnabled: {
    color: '#fff',
    backgroundColor: 'rgba(28, 44, 60, 0.55)',
  },
  dropDownPlaceholderStyleEnabled: {
    color: '#fff',
    opacity: 1,
  },
  dropDownBadgeTextStyleEnabled: {
    color: '#fff',
    opacity: 1,
  },
  listParentContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(234,241,247,0.16)',
    backgroundColor: 'rgba(28, 44, 60, 0.8)',
  },
  listParentLabel: {
    color: '#EAF1F7',
    fontSize: scale(16),
    fontWeight: '600',
  },
  listChildContainer: {
    paddingVertical: 10,
    paddingLeft: 32,
    backgroundColor: 'rgba(28, 44, 60, 0.55)',
  },
  listChildLabel: {
    color: 'rgba(234,241,247,0.9)',
    fontSize: scale(15),
  },
});
