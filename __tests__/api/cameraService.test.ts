import axiosInstance from '../../src/api/axiosConfig';
import { API_ENDPOINTS } from '../../src/api/apiEndpoints';
import cameraService from '@/services/cameraService';
import {
  RegisterCameraRequest,
  RegisterCameraResponse,
  GetCamerasParams,
  GetCamerasResponse,
  GetWorkflowStatusesResponse,
} from '../../src/api/types/cameraTypes';

// Mock axios and its instance
jest.mock('../../src/api/axiosConfig', () => ({
  __esModule: true,
  default: {
    patch: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock API endpoints
jest.mock('../../src/api/apiEndpoints', () => ({
  API_BASE_URL: 'http://localhost',
  API_ENDPOINTS: {
    CAMERAS: '/cameras',
    FACILITIES: '/facilities',
    STATUSES: '/statuses',
  },
}));

describe('CameraService (API)', () => {
  const mockAxiosInstance = axiosInstance as jest.Mocked<typeof axiosInstance>;
  const mockApiEndpoints = API_ENDPOINTS as jest.Mocked<typeof API_ENDPOINTS>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('registerCamera', () => {
    const mockRegisterData: RegisterCameraRequest = {
      id: 'cam-123',
      name: 'Test Camera',
      status_id: 'active',
      description: 'Test camera description',
    };

    const mockResponse: RegisterCameraResponse = {
      success: true,
      message: 'Camera registered successfully',
      data: {
        id: 'cam-123',
        name: 'Test Camera',
        serial: 'ABC123',
        rtsp_url: 'rtsp://192.168.1.100/live',
        status: 'active',
        location: 'Test Location',
        facility_id: 'facility-1',
        user_id: 'user-1',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
    };

    it('should register camera with all fields', async () => {
      mockAxiosInstance.patch.mockResolvedValue({ data: mockResponse });

      const result = await cameraService.registerCamera(mockRegisterData);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        `${mockApiEndpoints.CAMERAS}/${mockRegisterData.id}`,
        {
          name: mockRegisterData.name,
          status_id: mockRegisterData.status_id,
          description: mockRegisterData.description,
        }
      );
      expect(result).toEqual(mockResponse);
    });

    it('should register camera with only required id field', async () => {
      const minimalData: RegisterCameraRequest = { id: 'cam-456' };
      mockAxiosInstance.patch.mockResolvedValue({ data: mockResponse });

      await cameraService.registerCamera(minimalData);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        `${mockApiEndpoints.CAMERAS}/${minimalData.id}`,
        {}
      );
    });

    it('should register camera with partial fields', async () => {
      const partialData: RegisterCameraRequest = {
        id: 'cam-789',
        name: 'Partial Camera',
      };
      mockAxiosInstance.patch.mockResolvedValue({ data: mockResponse });

      await cameraService.registerCamera(partialData);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        `${mockApiEndpoints.CAMERAS}/${partialData.id}`,
        {
          name: partialData.name,
        }
      );
    });

    it('should throw error when id is missing', async () => {
      const invalidData = {
        name: 'Test Camera',
      } as RegisterCameraRequest;

      await expect(cameraService.registerCamera(invalidData)).rejects.toThrow(
        'Missing required field: id'
      );

      expect(mockAxiosInstance.patch).not.toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const apiError = new Error('API Error');
      mockAxiosInstance.patch.mockRejectedValue(apiError);

      await expect(cameraService.registerCamera(mockRegisterData)).rejects.toThrow('API Error');
    });
  });

  describe('getCameras', () => {
    const mockCamerasResponse: GetCamerasResponse = {
      success: true,
      message: 'Cameras retrieved successfully',
      data: [
        {
          id: 'cam-1',
          name: 'Camera 1',
          serial: 'ABC001',
          rtsp_url: 'rtsp://192.168.1.100/live1',
          status: 'active',
          location: 'Location 1',
          facility_id: 'facility-1',
          user_id: 'user-1',
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 'cam-2',
          name: 'Camera 2',
          serial: 'ABC002',
          rtsp_url: 'rtsp://192.168.1.101/live2',
          status: 'inactive',
          location: 'Location 2',
          facility_id: 'facility-1',
          user_id: 'user-2',
          created_at: '2023-01-02T00:00:00Z',
          updated_at: '2023-01-02T00:00:00Z',
        },
      ],
      total: 2,
      page: 1,
      per_page: 20,
      total_pages: 1,
    };

    it('should get cameras with default parameters', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockCamerasResponse });

      const result = await cameraService.getCameras();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(mockApiEndpoints.CAMERAS, {
        params: {
          sort_by: 'created_at',
          sort_order: 'desc',
          page: 1,
          per_page: 20,
        },
      });
      expect(result).toEqual(mockCamerasResponse);
    });

    it('should get cameras with custom parameters', async () => {
      const customParams: GetCamerasParams = {
        sort_by: 'name',
        sort_order: 'asc',
        page: 2,
        per_page: 10,
        facility_id: 'facility-123',
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockCamerasResponse });

      const result = await cameraService.getCameras(customParams);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(mockApiEndpoints.CAMERAS, {
        params: customParams,
      });
      expect(result).toEqual(mockCamerasResponse);
    });

    it('should get cameras with partial parameters', async () => {
      const partialParams: GetCamerasParams = {
        page: 3,
        facility_id: 'facility-456',
      };
      mockAxiosInstance.get.mockResolvedValue({ data: mockCamerasResponse });

      await cameraService.getCameras(partialParams);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(mockApiEndpoints.CAMERAS, {
        params: {
          sort_by: 'created_at',
          sort_order: 'desc',
          page: 3,
          per_page: 20,
          facility_id: 'facility-456',
        },
      });
    });

    it('should handle API errors', async () => {
      const apiError = new Error('Failed to fetch cameras');
      mockAxiosInstance.get.mockRejectedValue(apiError);

      await expect(cameraService.getCameras()).rejects.toThrow('Failed to fetch cameras');
    });

    it('should handle empty response', async () => {
      const emptyResponse: GetCamerasResponse = {
        success: true,
        message: 'No cameras found',
        data: [],
        total: 0,
        page: 1,
        per_page: 20,
        total_pages: 0,
      };
      mockAxiosInstance.get.mockResolvedValue({ data: emptyResponse });

      const result = await cameraService.getCameras();

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getWorkflowStatuses', () => {
    const mockWorkflowStatusesResponse: GetWorkflowStatusesResponse = {
      success: true,
      message: 'Workflow statuses retrieved successfully',
      data: [
        {
          id: 'status-1',
          name: 'Active',
          name_ja: 'アクティブ',
          description: 'Camera is active',
          description_ja: 'カメラはアクティブです',
          name_trans: 'Active',
          desc_trans: 'Camera is active',
        },
        {
          id: 'status-2',
          name: 'Inactive',
          name_ja: '非アクティブ',
          description: 'Camera is inactive',
          description_ja: 'カメラは非アクティブです',
          name_trans: 'Inactive',
          desc_trans: 'Camera is inactive',
        },
      ],
    };

    it('should get workflow statuses successfully', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: mockWorkflowStatusesResponse });

      const result = await cameraService.getWorkflowStatuses();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(mockApiEndpoints.FACILITIES);
      expect(result).toEqual(mockWorkflowStatusesResponse);
    });

    it('should handle API errors', async () => {
      const apiError = new Error('Failed to fetch workflow statuses');
      mockAxiosInstance.get.mockRejectedValue(apiError);

      await expect(cameraService.getWorkflowStatuses()).rejects.toThrow(
        'Failed to fetch workflow statuses'
      );
    });

    it('should handle empty workflow statuses', async () => {
      const emptyResponse: GetWorkflowStatusesResponse = {
        success: true,
        message: 'No workflow statuses found',
        data: [],
      };
      mockAxiosInstance.get.mockResolvedValue({ data: emptyResponse });

      const result = await cameraService.getWorkflowStatuses();

      expect(result.data).toHaveLength(0);
    });
  });

  describe('registerCamera — user_id', () => {
    it('should include user_id in body when provided', async () => {
      mockAxiosInstance.patch.mockResolvedValue({
        data: { success: true, message: 'ok', data: {} as any },
      });

      await cameraService.registerCamera({
        id: 'cam-1',
        user_id: 'user-99',
        name: 'Cam',
      });

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(`${mockApiEndpoints.CAMERAS}/cam-1`, {
        user_id: 'user-99',
        name: 'Cam',
      });
    });
  });

  describe('updateStatus', () => {
    it('should GET statuses endpoint', async () => {
      const payload = { id: 's1', name: 'Active' };
      mockAxiosInstance.get.mockResolvedValue({ data: payload });

      const result = await cameraService.updateStatus();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(mockApiEndpoints.STATUSES);
      expect(result).toEqual(payload);
    });

    it('should propagate axios errors', async () => {
      mockAxiosInstance.get.mockRejectedValue(new Error('status fail'));
      await expect(cameraService.updateStatus()).rejects.toThrow('status fail');
    });
  });

  describe('getLiveStreamUrl', () => {
    it('should GET livestream URL for camera', async () => {
      const payload = { success: true, data: { url: 'wss://x' } } as any;
      mockAxiosInstance.get.mockResolvedValue({ data: payload });

      const result = await cameraService.getLiveStreamUrl('cam-42');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `${mockApiEndpoints.CAMERAS}/cam-42/livestream`
      );
      expect(result).toEqual(payload);
    });
  });

  describe('getRulesForCamera', () => {
    it('should GET rules for camera', async () => {
      const payload = { success: true, data: [] } as any;
      mockAxiosInstance.get.mockResolvedValue({ data: payload });

      const result = await cameraService.getRulesForCamera('cam-9');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`${mockApiEndpoints.CAMERAS}/cam-9/rules`);
      expect(result).toEqual(payload);
    });
  });

  describe('deleteCamera', () => {
    it('should DELETE camera by id', async () => {
      const payload: GetWorkflowStatusesResponse = {
        success: true,
        message: 'deleted',
        data: [],
      };
      mockAxiosInstance.delete.mockResolvedValue({ data: payload });

      const result = await cameraService.deleteCamera('cam-del');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(`${mockApiEndpoints.CAMERAS}/cam-del`);
      expect(result).toEqual(payload);
    });
  });

  describe('getWorkScheduleForRule', () => {
    it('should GET work schedule for rule', async () => {
      const payload = { success: true, data: {} } as any;
      mockAxiosInstance.get.mockResolvedValue({ data: payload });

      const result = await cameraService.getWorkScheduleForRule('c1', 'r1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`${mockApiEndpoints.CAMERAS}/c1/rules/r1`);
      expect(result).toEqual(payload);
    });
  });

  describe('updateWorkScheduleForRule', () => {
    it('should PATCH work schedule body', async () => {
      const body = { slots: [{ day: 1 }] };
      const payload = { success: true } as any;
      mockAxiosInstance.patch.mockResolvedValue({ data: payload });

      const result = await cameraService.updateWorkScheduleForRule('c1', 'r1', body);

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        `${mockApiEndpoints.CAMERAS}/c1/rules/r1`,
        body
      );
      expect(result).toEqual(payload);
    });
  });

  describe('getCameraModes', () => {
    it('should GET camera modes', async () => {
      const payload = { success: true, data: [] } as any;
      mockAxiosInstance.get.mockResolvedValue({ data: payload });

      const result = await cameraService.getCameraModes();

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`${mockApiEndpoints.CAMERAS}/modes`);
      expect(result).toEqual(payload);
    });
  });

  describe('getDetailCamera', () => {
    it('should GET camera detail', async () => {
      const payload = { success: true, data: { id: 'c1' } } as any;
      mockAxiosInstance.get.mockResolvedValue({ data: payload });

      const result = await cameraService.getDetailCamera('c1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`${mockApiEndpoints.CAMERAS}/c1`);
      expect(result).toEqual(payload);
    });
  });

  describe('updateCamera', () => {
    it('should PATCH mode_id on camera', async () => {
      const payload = { success: true } as any;
      mockAxiosInstance.patch.mockResolvedValue({ data: payload });

      const result = await cameraService.updateCamera('c1', 'mode-2');

      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(`${mockApiEndpoints.CAMERAS}/c1`, {
        mode_id: 'mode-2',
      });
      expect(result).toEqual(payload);
    });
  });

  describe('countDetections', () => {
    it('should GET stats for camera', async () => {
      const payload = { visitor_count: 1 };
      mockAxiosInstance.get.mockResolvedValue({ data: payload });

      const result = await cameraService.countDetections('c1');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`${mockApiEndpoints.CAMERAS}/c1/stats`);
      expect(result).toEqual(payload);
    });
  });

  describe('reportCustomer', () => {
    it('should GET attribute-report with date param', async () => {
      const payload = { success: true, data: [] } as any;
      mockAxiosInstance.get.mockResolvedValue({ data: payload });

      const result = await cameraService.reportCustomer('c1', { date: '2025-03-01' });

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `${mockApiEndpoints.CAMERAS}/c1/attribute-report`,
        {
          params: { date: '2025-03-01' },
        }
      );
      expect(result).toEqual(payload);
    });
  });
});
