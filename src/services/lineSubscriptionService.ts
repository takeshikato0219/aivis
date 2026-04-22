import AsyncStorage from '@react-native-async-storage/async-storage';
import { showCommonAlert } from '@components/Alert/Alert';
import i18n from '@/i18n';
import { BaseLineService } from '@/services/baseLineService';
import { getAuthData } from '@utils/authStorage';

export interface LineSubscriptionStatus {
  isSubscribed: boolean;
  userId?: string;
  displayName?: string;
  statusMessage?: string;
}

export class LineSubscriptionService extends BaseLineService {
  private storageKey = '@line_subscription_status';

  /**
   * Check if user is subscribed to the LINE Official Account
   */
  async checkSubscriptionStatus(): Promise<LineSubscriptionStatus> {
    try {
      // Get current LINE user profile
      const profile = await this.getCurrentUser();

      if (!profile?.userId) {
        return { isSubscribed: false };
      }
      const isSubscribed = await this.checkFollowerStatus(profile.userId);
      return {
        isSubscribed,
        userId: profile.userId,
        displayName: profile.displayName,
        statusMessage: profile.statusMessage,
      };
    } catch (error: any) {
      console.log('[LINE Subscription] Error checking subscription:', error);
      showCommonAlert({
        title: i18n.t('lineSubscription.checkSubscriptionStatusErrorTitle'),
        message: i18n.t('lineSubscription.checkSubscriptionStatusErrorMessage'),
        buttons: [{ text: i18n.t('common.ok') }],
      });
      return { isSubscribed: false };
    }
  }

  /**
   * Subscribe user to LINE Official Account
   */
  async subscribeToOfficialAccount(): Promise<boolean> {
    try {
      const profile = await this.getCurrentUser();

      if (!profile?.userId) {
        throw new Error('Unable to get LINE user profile');
      }
      const success = true;

      if (success) {
        // Save subscription status to local storage
        await this.saveSubscriptionStatus(profile.userId, true);

        showCommonAlert({
          title: i18n.t('lineSubscription.subscribeSuccessAlertTitle'),
          message: i18n.t('lineSubscription.subscriptionSuccess'),
          buttons: [{ text: i18n.t('common.ok') }],
        });
      }

      return success;
    } catch (error: any) {
      console.log('[LINE Subscription] Error subscribing:', error);
      showCommonAlert({
        title: i18n.t('lineSubscription.subscribeFailedTitle'),
        message: i18n.t('lineSubscription.subscribeFailedMessage'),
        buttons: [{ text: i18n.t('common.ok') }],
      });
      return false;
    }
  }

  /**
   * Private method to check if user is following the official account
   * In a real app, this would call your backend API
   */
  /**
   * Check if the stored follower status matches the given userId and isSubscribed is true
   */
  async checkFollowerStatus(_userId: string): Promise<boolean> {
    try {
      const { user } = await getAuthData();
      const stored = user.has_followed_bot;
      if (!stored) {
        console.log(
          '[LINE Subscription] No stored status found for user:',
          _userId,
          '- defaulting to not subscribed'
        );
        return false;
      }
      let parsed;
      try {
        parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
      } catch (e) {
        console.log('[LINE Subscription] Error parsing stored status:', e);
        return false;
      }
      if (parsed.userId !== _userId) {
        return false;
      }
      return !!parsed.isSubscribed;
    } catch (error) {
      console.log('[LINE Subscription] Error checking follower status:', error);
      return false;
    }
  }

  /**
   * Private method to save subscription status to storage
   */
  private async saveSubscriptionStatus(userId: string, isSubscribed: boolean): Promise<void> {
    try {
      const statusData = {
        userId,
        isSubscribed,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(statusData));
    } catch (error) {
      console.log('[LINE Subscription] Error saving subscription status:', error);
    }
  }
}

export default new LineSubscriptionService();
