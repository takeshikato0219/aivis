import Line from '@xmartlabs/react-native-line';
import { Linking } from 'react-native';

// Global flag to prevent multiple LINE SDK setups
let isLineSdkConfigured = false;

/**
 * Base class for LINE services providing common functionality
 * including SDK configuration, authentication checks, and utility methods
 */
export abstract class BaseLineService {
  protected channelId = '2008969814';

  constructor() {
    this.configure();
  }

  /**
   * Configure LINE SDK with channel ID
   * Uses singleton pattern to prevent multiple setups
   */
  protected async configure(): Promise<void> {
    if (isLineSdkConfigured) {
      return;
    }

    try {
      const setupParams = { channelId: this.channelId };
      await Line.setup(setupParams);
      isLineSdkConfigured = true;
    } catch (error: any) {
      console.log('[LINE] Setup error caught:', error);
    }
  }

  /**
   * Check if user is currently signed in to LINE
   */
  async isSignedIn(): Promise<boolean> {
    try {
      const token = await Line.getCurrentAccessToken();
      return !!token?.accessToken;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if LINE app is installed on the device
   */
  protected async isLineAppInstalled(): Promise<boolean> {
    try {
      const lineUrl = 'line://';
      return await Linking.canOpenURL(lineUrl);
    } catch (error) {
      console.log('[LINE] Error checking LINE app installation:', error);
      return false;
    }
  }

  /**
   * Get current LINE user profile
   */
  async getCurrentUser() {
    try {
      return await Line.getProfile();
    } catch (error) {
      console.log('[LINE] Failed to get current user:', error);
      return null;
    }
  }
}
