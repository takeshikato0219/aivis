import AsyncStorage from '@react-native-async-storage/async-storage';
import { showCommonAlert } from '@components/Alert/Alert';
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
      const isSubscribed = await this.checkFollowerStatus();
      return {
        isSubscribed,
        userId: profile.userId,
        displayName: profile.displayName,
        statusMessage: profile.statusMessage,
      };
    } catch (error: any) {
      console.log('[LINE Subscription] Error checking subscription:', error);
      showCommonAlert({
        title: 'LINE Subscription Error',
        message: 'Unable to check LINE subscription status. Please try again.',
        buttons: [{ text: 'OK' }],
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
          title: 'Subscription Successful',
          message: 'You have successfully subscribed to our LINE Official Account!',
          buttons: [{ text: 'OK' }],
        });
      }

      return success;
    } catch (error: any) {
      console.log('[LINE Subscription] Error subscribing:', error);
      showCommonAlert({
        title: 'Subscription Failed',
        message: 'Unable to subscribe to LINE Official Account. Please try again.',
        buttons: [{ text: 'OK' }],
      });
      return false;
    }
  }

  /**
   * Private method to check if user is following the official account
   * In a real app, this would call your backend API
   */
  private async checkFollowerStatus(): Promise<boolean> {
    try {
      const { user } = await getAuthData();
      if (user.has_followed_bot) {
        return user.has_followed_bot;
      }
      return false;
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
