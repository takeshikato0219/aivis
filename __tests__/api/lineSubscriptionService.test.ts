import LineSubscriptionService from '@/services/lineSubscriptionService';
import { showCommonAlert } from '@components/Alert/Alert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthData } from '@utils/authStorage';

jest.mock('@components/Alert/Alert');
jest.mock('@react-native-async-storage/async-storage');
jest.mock('@utils/authStorage');
jest.mock('@xmartlabs/react-native-line', () => ({
  setup: jest.fn(),
  getCurrentAccessToken: jest.fn(),
  getProfile: jest.fn(),
}));

// Mock BaseLineService.getCurrentUser
LineSubscriptionService.getCurrentUser = jest.fn();

describe('LineSubscriptionService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkSubscriptionStatus', () => {
    it('returns isSubscribed=false if no profile', async () => {
      (LineSubscriptionService.getCurrentUser as jest.Mock).mockResolvedValue(undefined);
      const result = await LineSubscriptionService.checkSubscriptionStatus();
      expect(result).toEqual({ isSubscribed: false });
    });

    it('returns isSubscribed=false if no userId in profile', async () => {
      (LineSubscriptionService.getCurrentUser as jest.Mock).mockResolvedValue({});
      const result = await LineSubscriptionService.checkSubscriptionStatus();
      expect(result).toEqual({ isSubscribed: false });
    });

    it('returns correct status and profile info if subscribed', async () => {
      (LineSubscriptionService.getCurrentUser as jest.Mock).mockResolvedValue({
        userId: 'u1',
        displayName: 'Test',
        statusMessage: 'msg',
      });
      jest.spyOn(LineSubscriptionService as any, 'checkFollowerStatus').mockResolvedValue(true);
      const result = await LineSubscriptionService.checkSubscriptionStatus();
      expect(result).toEqual({
        isSubscribed: true,
        userId: 'u1',
        displayName: 'Test',
        statusMessage: 'msg',
      });
    });

    it('returns correct status and profile info if not subscribed', async () => {
      (LineSubscriptionService.getCurrentUser as jest.Mock).mockResolvedValue({
        userId: 'u2',
        displayName: 'Test2',
        statusMessage: 'msg2',
      });
      jest.spyOn(LineSubscriptionService as any, 'checkFollowerStatus').mockResolvedValue(false);
      const result = await LineSubscriptionService.checkSubscriptionStatus();
      expect(result).toEqual({
        isSubscribed: false,
        userId: 'u2',
        displayName: 'Test2',
        statusMessage: 'msg2',
      });
    });

    it('shows alert and returns isSubscribed=false on error', async () => {
      (LineSubscriptionService.getCurrentUser as jest.Mock).mockRejectedValue(new Error('fail'));
      const spy = jest.spyOn(console, 'log').mockImplementation();
      const result = await LineSubscriptionService.checkSubscriptionStatus();
      expect(result).toEqual({ isSubscribed: false });
      expect(showCommonAlert).toHaveBeenCalledWith(
        expect.objectContaining({ title: expect.any(String) })
      );
      spy.mockRestore();
    });
  });

  describe('subscribeToOfficialAccount', () => {
    it('saves status and shows success alert if subscribe succeeds', async () => {
      (LineSubscriptionService.getCurrentUser as jest.Mock).mockResolvedValue({ userId: 'u3' });
      jest
        .spyOn(LineSubscriptionService as any, 'saveSubscriptionStatus')
        .mockResolvedValue(undefined);
      const result = await LineSubscriptionService.subscribeToOfficialAccount();
      expect(result).toBe(true);
      expect((LineSubscriptionService as any).saveSubscriptionStatus).toHaveBeenCalledWith(
        'u3',
        true
      );
      expect(showCommonAlert).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Subscription Successful' })
      );
    });

    it('shows error alert and returns false if no userId', async () => {
      (LineSubscriptionService.getCurrentUser as jest.Mock).mockResolvedValue({});
      const result = await LineSubscriptionService.subscribeToOfficialAccount();
      expect(result).toBe(false);
      expect(showCommonAlert).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Subscription Failed' })
      );
    });

    it('shows error alert and returns false on error', async () => {
      (LineSubscriptionService.getCurrentUser as jest.Mock).mockRejectedValue(new Error('fail'));
      const spy = jest.spyOn(console, 'log').mockImplementation();
      const result = await LineSubscriptionService.subscribeToOfficialAccount();
      expect(result).toBe(false);
      expect(showCommonAlert).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Subscription Failed' })
      );
      spy.mockRestore();
    });
  });

  describe('checkFollowerStatus', () => {
    it('returns true if stored status matches user and isSubscribed', async () => {
      (getAuthData as jest.Mock).mockResolvedValue({
        user: { has_followed_bot: JSON.stringify({ userId: 'u4', isSubscribed: true }) },
      });
      const result = await (LineSubscriptionService as any).checkFollowerStatus('u4');
      expect(result).toBe(true);
    });

    it('returns false if stored status is for different user', async () => {
      (getAuthData as jest.Mock).mockResolvedValue({
        user: { has_followed_bot: JSON.stringify({ userId: 'other', isSubscribed: true }) },
      });
      const result = await (LineSubscriptionService as any).checkFollowerStatus('u5');
      expect(result).toBe(false);
    });

    it('returns false if no stored status', async () => {
      (getAuthData as jest.Mock).mockResolvedValue({ user: { has_followed_bot: undefined } });
      const spy = jest.spyOn(console, 'log').mockImplementation();
      const result = await (LineSubscriptionService as any).checkFollowerStatus('u6');
      expect(result).toBe(false);
      expect(spy).toHaveBeenCalledWith(
        '[LINE Subscription] No stored status found for user:',
        'u6',
        '- defaulting to not subscribed'
      );
      spy.mockRestore();
    });

    it('returns false and logs error if exception thrown', async () => {
      (getAuthData as jest.Mock).mockRejectedValue(new Error('fail'));
      const spy = jest.spyOn(console, 'log').mockImplementation();
      const result = await (LineSubscriptionService as any).checkFollowerStatus('u7');
      expect(result).toBe(false);
      expect(spy).toHaveBeenCalledWith(
        '[LINE Subscription] Error checking follower status:',
        expect.any(Error)
      );
      spy.mockRestore();
    });
  });

  describe('saveSubscriptionStatus', () => {
    it('saves status to AsyncStorage', async () => {
      (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now);
      await (LineSubscriptionService as any).saveSubscriptionStatus('u8', true);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@line_subscription_status',
        JSON.stringify({ userId: 'u8', isSubscribed: true, timestamp: now })
      );
      (Date.now as jest.Mock).mockRestore?.();
    });

    it('logs error if AsyncStorage.setItem throws', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('fail'));
      const spy = jest.spyOn(console, 'log').mockImplementation();
      await (LineSubscriptionService as any).saveSubscriptionStatus('u9', false);
      expect(spy).toHaveBeenCalledWith(
        '[LINE Subscription] Error saving subscription status:',
        expect.any(Error)
      );
      spy.mockRestore();
    });
  });
});
