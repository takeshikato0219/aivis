import NotificationsService from '../../src/services/notificationsService';
import axiosInstance from '../../src/api/axiosConfig';

jest.mock('../../src/api/axiosConfig');
jest.mock('../../src/api/apiEndpoints', () => ({
  API_ENDPOINTS: {
    NOTIFICATIONS: '/mock/notifications',
    DETECTIONS: '/mock/detections',
    AUTH: {
      LOGIN: '/mock/login',
      REGISTER: '/mock/register',
      REFRESH_TOKEN: '/mock/refresh',
      FORGOT_PASSWORD: '/mock/forgot',
    },
  },
}));

describe('NotificationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotifications', () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'Fetched',
        data: [
          {
            id: '1',
            detection_id: 'd1',
            camera_rules_id: 'cr1',
            rules_master_id: 'rm1',
            user_id: 'u1',
            camera_id: 'c1',
            line_user_id: null,
            message: 'msg',
            is_seen: false,
            sent_at: '2024-01-01T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ],
        meta: {
          page: 1,
          per_page: 10,
          total: 1,
          total_pages: 1,
          has_next: false,
          has_prev: false,
          is_truncated: false,
        },
      },
    };

    it('should fetch notifications successfully', async () => {
      (axiosInstance.get as jest.Mock).mockResolvedValueOnce(mockResponse);
      const result = await NotificationsService.getNotifications({ page: 1, per_page: 10 });
      expect(result).toEqual(mockResponse.data);
      expect(axiosInstance.get).toHaveBeenCalledWith(
        '/mock/notifications/',
        expect.objectContaining({
          params: expect.objectContaining({
            sort_by: 'sent_at',
            sort_order: 'desc',
            page: 1,
            per_page: 10,
          }),
          headers: expect.any(Object),
        })
      );
    });

    it('should set custom headers for params', async () => {
      (axiosInstance.get as jest.Mock).mockResolvedValueOnce(mockResponse);
      await NotificationsService.getNotifications({
        page: 2,
        per_page: 5,
        user_id: 'u2',
        is_seen: true,
      });
      expect(axiosInstance.get).toHaveBeenCalledWith(
        '/mock/notifications/',
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Param-page': '2',
            'X-Param-per_page': '5',
            'X-Param-user_id': 'u2',
            'X-Param-is_seen': 'true',
          }),
        })
      );
    });

    it('should throw error when axios fails', async () => {
      (axiosInstance.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      await expect(NotificationsService.getNotifications()).rejects.toThrow('Network error');
    });
  });

  describe('updateNotificationSeen', () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'Updated',
        data: {
          id: '1',
          is_seen: true,
        },
      },
    };

    it('should update notification seen successfully', async () => {
      (axiosInstance.patch as jest.Mock).mockResolvedValueOnce(mockResponse);
      const result = await NotificationsService.updateNotificationSeen('1', true);
      expect(result).toEqual(mockResponse.data.data);
      expect(axiosInstance.patch).toHaveBeenCalledWith('/mock/notifications/1', { is_seen: true });
    });

    it('should throw error when axios fails', async () => {
      (axiosInstance.patch as jest.Mock).mockRejectedValueOnce(new Error('Patch error'));
      await expect(NotificationsService.updateNotificationSeen('1', true)).rejects.toThrow(
        'Patch error'
      );
    });
  });

  describe('getNotificationWithType', () => {
    const mockResponse = {
      data: {
        success: true,
        message: 'Detection fetched',
        data: [
          {
            id: 'd1',
            user_id: 'u1',
            camera_id: 'c1',
            confidence: 0.9,
            image_url: 'url',
            detected_at: '2024-01-01T00:00:00Z',
            event_type: 'motion',
            camera_rules_id: 'cr1',
            rules_master_id: 'rm1',
            member_id: 'm1',
            notification_message: 'msg',
          },
        ],
        meta: {
          page: 1,
          per_page: 10,
          total: 1,
          total_pages: 1,
          has_next: false,
          has_prev: false,
          is_truncated: false,
        },
      },
    };

    it('should fetch detection with type successfully', async () => {
      (axiosInstance.get as jest.Mock).mockResolvedValueOnce(mockResponse);
      const result = await NotificationsService.getNotificationWithType(
        'c1',
        'motion',
        '2024-01-01T00:00:00Z'
      );
      expect(result).toEqual(mockResponse.data);
      expect(axiosInstance.get).toHaveBeenCalledWith(
        '/mock/detections',
        expect.objectContaining({
          params: expect.objectContaining({
            camera_id: 'c1',
            event_type: 'motion',
            detected_at: '2024-01-01T00:00:00Z',
          }),
        })
      );
    });

    it('should fetch detection without detected_at', async () => {
      (axiosInstance.get as jest.Mock).mockResolvedValueOnce(mockResponse);
      await NotificationsService.getNotificationWithType('c1', 'motion');
      expect(axiosInstance.get).toHaveBeenCalledWith(
        '/mock/detections',
        expect.objectContaining({
          params: expect.objectContaining({
            camera_id: 'c1',
            event_type: 'motion',
          }),
        })
      );
    });

    it('should throw error when axios fails', async () => {
      (axiosInstance.get as jest.Mock).mockRejectedValueOnce(new Error('Detection error'));
      await expect(NotificationsService.getNotificationWithType('c1', 'motion')).rejects.toThrow(
        'Detection error'
      );
    });
  });
});
