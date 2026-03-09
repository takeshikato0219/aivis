import PolicyService, { PoliciesResponse } from '../../src/api/policyService';
import axiosInstance from '../../src/api/axiosConfig';
import { API_ENDPOINTS } from '../../src/api/apiEndpoints';

jest.mock('../../src/api/axiosConfig');

describe('PolicyService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getPolicies calls axios with correct params and returns data', async () => {
    const mockResponse: PoliciesResponse = {
      items: [
        {
          id: '1',
          title: 'Policy 1',
          type: 1,
          description: 'desc',
          content: 'content',
          created_at: '2023-01-01',
          updated_at: null,
        },
      ],
      total: 1,
      limit: 100,
      offset: 0,
    };
    (axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse });

    const result = await PolicyService.getPolicies(1);
    expect(axiosInstance.get).toHaveBeenCalledWith(API_ENDPOINTS.POLICIES, {
      params: { type: 1, limit: 100, offset: 0 },
      headers: { accept: 'application/json' },
    });
    expect(result).toEqual(mockResponse);
  });

  it('getPolicies passes custom limit and offset', async () => {
    const mockResponse: PoliciesResponse = {
      items: [],
      total: 0,
      limit: 10,
      offset: 5,
    };
    (axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockResponse });

    const result = await PolicyService.getPolicies(2, 10, 5);
    expect(axiosInstance.get).toHaveBeenCalledWith(API_ENDPOINTS.POLICIES, {
      params: { type: 2, limit: 10, offset: 5 },
      headers: { accept: 'application/json' },
    });
    expect(result).toEqual(mockResponse);
  });

  it('getPolicies throws error if axios fails', async () => {
    (axiosInstance.get as jest.Mock).mockRejectedValue(new Error('Network error'));
    await expect(PolicyService.getPolicies(1)).rejects.toThrow('Network error');
  });
});
