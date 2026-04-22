import detectionZoneService from '../../src/services/detectionZone';
import axiosInstance from '../../src/api/axiosConfig';
import { API_ENDPOINTS } from '../../src/api/apiEndpoints';

jest.mock('../../src/api/axiosConfig');

describe('detectionZoneService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getZones', () => {
    it('calls axios with correct params and returns data', async () => {
      const mockData = { success: true, message: 'ok', data: [], meta: {} };
      (axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockData });
      const result = await detectionZoneService.getZones('cam1', 'zoneType1', {
        sort_by: 'name',
        sort_order: 'asc',
        page: 2,
        per_page: 5,
      });
      expect(axiosInstance.get).toHaveBeenCalledWith(
        `${API_ENDPOINTS.CAMERAS}/cam1/detection-zones`,
        {
          params: {
            zone_type_id: 'zoneType1',
            sort_by: 'name',
            sort_order: 'asc',
            page: 2,
            per_page: 5,
          },
        }
      );
      expect(result).toEqual(mockData);
    });

    it('calls axios with minimal params', async () => {
      const mockData = { success: true, message: 'ok', data: [], meta: {} };
      (axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockData });
      await detectionZoneService.getZones('cam2', 'zoneType2');
      expect(axiosInstance.get).toHaveBeenCalledWith(
        `${API_ENDPOINTS.CAMERAS}/cam2/detection-zones`,
        {
          params: { zone_type_id: 'zoneType2' },
        }
      );
    });

    it('throws and logs error if axios fails', async () => {
      const error = new Error('fail');
      (axiosInstance.get as jest.Mock).mockRejectedValue(error);
      const spy = jest.spyOn(console, 'error').mockImplementation();
      await expect(detectionZoneService.getZones('cam', 'zoneType')).rejects.toThrow('fail');
      expect(spy).toHaveBeenCalledWith('Error getting detection zones:', error);
      spy.mockRestore();
    });
  });

  describe('createZone', () => {
    it('calls axios.post with correct params and returns data', async () => {
      const mockData = { success: true };
      (axiosInstance.post as jest.Mock).mockResolvedValue({ data: mockData });
      const zoneData = { zone_type_id: 'z1', coordinates: [{ x: 1, y: 2 }] };
      const result = await detectionZoneService.createZone('cam3', zoneData);
      expect(axiosInstance.post).toHaveBeenCalledWith(
        `${API_ENDPOINTS.CAMERAS}/cam3/detection-zones`,
        zoneData
      );
      expect(result).toEqual(mockData);
    });

    it('throws and logs error if axios fails', async () => {
      const error = new Error('fail');
      (axiosInstance.post as jest.Mock).mockRejectedValue(error);
      const spy = jest.spyOn(console, 'error').mockImplementation();
      await expect(
        detectionZoneService.createZone('cam', { zone_type_id: 'z', coordinates: [] })
      ).rejects.toThrow('fail');
      expect(spy).toHaveBeenCalledWith('Error creating detection zone:', error);
      spy.mockRestore();
    });
  });

  describe('getType', () => {
    it('calls axios.get with correct endpoint and returns data', async () => {
      const mockData = { success: true, data: [], message: '', meta: {} };
      (axiosInstance.get as jest.Mock).mockResolvedValue({ data: mockData });
      const result = await detectionZoneService.getType();
      expect(axiosInstance.get).toHaveBeenCalledWith(API_ENDPOINTS.CAMERAS_DETECTION_TYPE);
      expect(result).toEqual(mockData);
    });

    it('throws and logs error if axios fails', async () => {
      const error = new Error('fail');
      (axiosInstance.get as jest.Mock).mockRejectedValue(error);
      const spy = jest.spyOn(console, 'error').mockImplementation();
      await expect(detectionZoneService.getType()).rejects.toThrow('fail');
      expect(spy).toHaveBeenCalledWith('Error getting zone types:', error);
      spy.mockRestore();
    });
  });
});
