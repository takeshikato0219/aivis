import RulesService from '../../src/services/rulesService';
import axiosInstance from '../../src/api/axiosConfig';

jest.mock('../../src/api/axiosConfig');
jest.mock('../../src/api/apiEndpoints', () => ({
  API_ENDPOINTS: {
    RULES_MASTER: '/mock/rules',
    AUTH: {
      LOGIN: '/mock/login',
      REGISTER: '/mock/register',
      REFRESH_TOKEN: '/mock/refresh',
      FORGOT_PASSWORD: '/mock/forgot',
    },
  },
}));

describe('RulesService', () => {
  const mockResponse = {
    data: {
      success: true,
      message: 'Fetched successfully',
      data: [
        {
          id: '1',
          rule_name: 'Rule 1',
          code: 'R1',
          facility_id: 'F1',
          facility_name: 'Facility 1',
          start_time: '08:00',
          end_time: '17:00',
          weekdays: [1, 2, 3],
          notification_message_template: 'Notify',
          is_active: true,
        },
      ],
      meta: {
        page: 1,
        per_page: 10,
        total: 1,
        total_pages: 1,
        has_next: false,
        has_prev: false,
        is_truncated: null,
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch rules successfully', async () => {
    (axiosInstance.get as jest.Mock).mockResolvedValueOnce(mockResponse);
    const result = await RulesService.getRules();
    expect(result).toEqual(mockResponse.data);
    expect(axiosInstance.get).toHaveBeenCalledWith(
      '/mock/rules',
      expect.objectContaining({
        params: expect.objectContaining({
          sort_by: 'sort_order',
          sort_order: 'asc',
          page: 1,
          per_page: 50,
        }),
      })
    );
  });

  it('should pass custom params to axios', async () => {
    (axiosInstance.get as jest.Mock).mockResolvedValueOnce(mockResponse);
    const params = { facility_id: 'F2', page: 2, per_page: 5 };
    await RulesService.getRules(params);
    expect(axiosInstance.get).toHaveBeenCalledWith(
      '/mock/rules',
      expect.objectContaining({
        params: expect.objectContaining({
          ...params,
          sort_by: 'sort_order',
          sort_order: 'asc',
          // page and per_page will be overwritten by ...params if present
        }),
      })
    );
  });

  it('should throw error when axios fails', async () => {
    (axiosInstance.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    await expect(RulesService.getRules()).rejects.toThrow('Network error');
  });
});
