import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showCommonAlert } from '@components/Alert/Alert';
import { BaseLineService } from './baseLineService';

export interface LineSubscriptionStatus {
  isSubscribed: boolean;
  userId?: string;
  displayName?: string;
  statusMessage?: string;
}

export class LineSubscriptionService extends BaseLineService {
  private baseUrl = 'https://api.line.me/v2/bot'; // LINE Official Account API base URL
  private channelAccessToken = ''; // This should be configured in your environment
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

      // Check if user is following the official account
      // Note: In a real implementation, you would call your backend API
      // which would use LINE's Messaging API to check follower status
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

      // In a real implementation, this would:
      // 1. Send a welcome message to the user via LINE Messaging API
      // 2. Add user to your subscription database
      // 3. Send push notifications, etc.

      const success = await this.sendSubscriptionMessage(profile.userId);

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
   * Unsubscribe user from LINE Official Account
   */
  async unsubscribeFromOfficialAccount(): Promise<boolean> {
    try {
      const profile = await this.getCurrentUser();

      if (!profile?.userId) {
        throw new Error('Unable to get LINE user profile');
      }

      // In a real implementation, this would:
      // 1. Remove user from subscription database
      // 2. Stop sending notifications, etc.

      const success = await this.sendUnsubscriptionMessage(profile.userId);

      if (success) {
        // Save unsubscription status to local storage
        await this.saveSubscriptionStatus(profile.userId, false);

        showCommonAlert({
          title: 'Unsubscription Successful',
          message: 'You have successfully unsubscribed from our LINE Official Account.',
          buttons: [{ text: 'OK' }],
        });
      }

      return success;
    } catch (error: any) {
      console.log('[LINE Subscription] Error unsubscribing:', error);
      showCommonAlert({
        title: 'Unsubscription Failed',
        message: 'Unable to unsubscribe from LINE Official Account. Please try again.',
        buttons: [{ text: 'OK' }],
      });
      return false;
    }
  }

  /**
   * Private method to check if user is following the official account
   * In a real app, this would call your backend API
   */
  private async checkFollowerStatus(userId: string): Promise<boolean> {
    try {
      // Get stored subscription status
      const storedStatus = await AsyncStorage.getItem(this.storageKey);

      if (storedStatus) {
        const parsedStatus = JSON.parse(storedStatus);
        // Check if the stored status belongs to the current user
        if (parsedStatus.userId === userId) {
          return parsedStatus.isSubscribed;
        }
      }

      // If no stored status or different user, check with LINE API
      // For demo purposes, we'll assume user is not subscribed initially
      console.log(
        '[LINE Subscription] No stored status found for user:',
        userId,
        '- defaulting to not subscribed'
      );

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In real implementation, this would call LINE API to check follower status
      // For demo, return false (not subscribed) as default
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
      console.log('[LINE Subscription] Saved subscription status:', statusData);
    } catch (error) {
      console.log('[LINE Subscription] Error saving subscription status:', error);
    }
  }

  /**
   * Private method to send subscription message
   * In a real app, this would call LINE Messaging API
   */
  private async sendSubscriptionMessage(userId: string): Promise<boolean> {
    try {
      console.log('[LINE Subscription] Sending subscription message to user:', userId);

      // Mock implementation - in real app, call LINE Messaging API
      // const response = await axios.post(`${this.baseUrl}/message/push`, {
      //   to: userId,
      //   messages: [{
      //     type: 'text',
      //     text: 'Welcome! You are now subscribed to our LINE Official Account.'
      //   }]
      // }, {
      //   headers: {
      //     'Authorization': `Bearer ${this.channelAccessToken}`,
      //     'Content-Type': 'application/json',
      //   },
      // });

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return true;
    } catch (error) {
      console.log('[LINE Subscription] Error sending subscription message:', error);
      return false;
    }
  }

  /**
   * Private method to send unsubscription message
   * In a real app, this would call LINE Messaging API
   */
  private async sendUnsubscriptionMessage(userId: string): Promise<boolean> {
    try {
      console.log('[LINE Subscription] Sending unsubscription message to user:', userId);

      // Mock implementation - in real app, call LINE Messaging API
      // const response = await axios.post(`${this.baseUrl}/message/push`, {
      //   to: userId,
      //   messages: [{
      //     type: 'text',
      //     text: 'You have unsubscribed from our LINE Official Account. We\'re sorry to see you go!'
      //   }]
      // }, {
      //   headers: {
      //     'Authorization': `Bearer ${this.channelAccessToken}`,
      //     'Content-Type': 'application/json',
      //   },
      // });

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      return true;
    } catch (error) {
      console.log('[LINE Subscription] Error sending unsubscription message:', error);
      return false;
    }
  }

  /**
   * Get LINE Official Account QR Code URL
   * This can be used to show QR code for users to scan and follow
   */
  getOfficialAccountQRUrl(): string {
    // This would be your LINE Official Account's QR code URL
    return `https://qr-official.line.me/gs/M/${this.channelId}/l.png`;
  }

  /**
   * Open LINE Official Account in LINE app or browser
   */
  async openOfficialAccount() {
    try {
      const lineUrl = `line://ti/p/@${this.channelId}`;
      const webUrl = `https://line.me/R/ti/p/${this.channelId}`;

      const canOpenLine = await this.isLineAppInstalled();

      if (canOpenLine) {
        await Linking.openURL(lineUrl);
      } else {
        // Fallback to web URL
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.log('[LINE Subscription] Error opening official account:', error);
      showCommonAlert({
        title: 'Error',
        message: 'Unable to open LINE Official Account. Please try again.',
        buttons: [{ text: 'OK' }],
      });
    }
  }
}

export default new LineSubscriptionService();
