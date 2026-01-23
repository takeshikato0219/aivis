import { StyleSheet } from 'react-native';
import { COLORS } from '@constants/theme';

export const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 998,
  },

  drawer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },

  drawerSafeArea: {
    flex: 1,
  },

  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },

  closeBtn: {
    padding: 8,
    marginRight: 12,
  },

  closeText: {
    fontSize: 28,
    color: COLORS.card,
    fontWeight: '300',
    lineHeight: 28,
  },

  drawerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },

  drawerUserInfo: {
    flex: 1,
  },

  drawerUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.card,
    marginBottom: 4,
  },

  drawerUserEmail: {
    fontSize: 13,
    color: COLORS.card,
  },

  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },

  menuList: {
    flex: 1,
  },

  menuListContent: {
    paddingVertical: 8,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  menuItemDanger: {
    backgroundColor: 'transparent',
  },

  menuIcon: {
    fontSize: 24,
    marginRight: 16,
    width: 32,
  },

  menuLabel: {
    fontSize: 16,
    color: COLORS.card,
    fontWeight: '500',
  },

  menuLabelDanger: {
    color: '#E53935',
  },

  drawerFooter: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },

  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
});
