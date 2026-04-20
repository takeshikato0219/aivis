import Line from '@xmartlabs/react-native-line';
import { Linking } from 'react-native';

// Global flag + in-flight promise so concurrent constructors only call native setup once
let isLineSdkConfigured = false;
let configurePromise: Promise<void> | null = null;

function isSetupAlreadyCompletedError(error: unknown): boolean {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  return message.includes('already completed');
}

/**
 * Base class for LINE services providing common functionality
 * including SDK configuration, authentication checks, and utility methods
 */
export abstract class BaseLineService {
  protected channelId = '2009814613';

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
    if (configurePromise) {
      return configurePromise;
    }

    configurePromise = (async () => {
      try {
        const setupParams = { channelId: this.channelId };
        await Line.setup(setupParams);
        isLineSdkConfigured = true;
      } catch (error: unknown) {
        if (isSetupAlreadyCompletedError(error)) {
          isLineSdkConfigured = true;
          return;
        }
        console.log('[LINE] Setup error caught:', error);
      } finally {
        configurePromise = null;
      }
    })();

    return configurePromise;
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
