import { Platform, NativeModules } from 'react-native';
import notifee from '@notifee/react-native';

/**
 * Synchronize the badge count on the app icon with the unread notification count.
 * - iOS: Use Notifee setBadgeCount (native support)
 * - Android: Use ShortcutBadger if react-native-shortcutbadger is installed (Samsung, Xiaomi, Nova...)
 */
class AppBadgeService {
  private get ShortcutBadger() {
    return Platform.OS === 'android' ? NativeModules.ShortcutBadger : null;
  }

  /**
   * Set the badge count on the app icon.
   * @param count - Number of unread notifications (0 to clear badge)
   */
  async setBadgeCount(count: number): Promise<void> {
    const safeCount = Math.max(0, Math.min(count, 99));
    try {
      if (Platform.OS === 'ios') {
        await notifee.setBadgeCount(safeCount);
      } else if (Platform.OS === 'android' && this.ShortcutBadger) {
        if (safeCount === 0) {
          this.ShortcutBadger.removeCount?.();
        } else {
          this.ShortcutBadger.applyCount?.(safeCount);
        }
      }
    } catch (error) {
      console.warn('[AppBadge] setBadgeCount error:', error);
    }
  }

  /**
   * Get the current badge count (iOS only)
   */
  async getBadgeCount(): Promise<number> {
    if (Platform.OS !== 'ios') return 0;
    try {
      return await notifee.getBadgeCount();
    } catch {
      return 0;
    }
  }
}

export const appBadgeService = new AppBadgeService();
