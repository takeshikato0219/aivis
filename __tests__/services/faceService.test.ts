import faceService from '../../src/services/faceService';
import axiosInstance from '../../src/api/axiosConfig';

jest.mock('../../src/api/axiosConfig');
jest.mock('../../src/api/apiEndpoints', () => ({
  API_ENDPOINTS: {
    MEMBER_RELATIONSHIPS: '/mock/member-relationships',
    MEMBERS: '/mock/members',
    AUTH: {
      LOGIN: '/mock/login',
      REGISTER: '/mock/register',
      REFRESH_TOKEN: '/mock/refresh',
      FORGOT_PASSWORD: '/mock/forgot',
    },
  },
}));

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

describe('faceService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getMemberRelationships', () => {
    it('should return member relationships on success', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          success: true,
          message: 'ok',
          data: [
            { id: '1', name: 'Parent' },
            { id: '2', name: 'Child' },
          ],
        },
      });
      const result = await faceService.getMemberRelationships();
      expect(result).toEqual([
        { id: '1', name: 'Parent' },
        { id: '2', name: 'Child' },
      ]);
      expect(mockedAxios.get).toHaveBeenCalledWith('/mock/member-relationships');
    });

    it('should throw on error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(faceService.getMemberRelationships()).rejects.toThrow('fail');
    });
  });

  describe('getMembers', () => {
    it('should return members response on success', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          success: true,
          message: 'ok',
          data: [],
          meta: {
            page: 1,
            per_page: 20,
            total: 0,
            total_pages: 1,
            has_next: false,
            has_prev: false,
            is_truncated: false,
          },
        },
      });
      const result = await faceService.getMembers();
      expect(result.success).toBe(true);
      expect(mockedAxios.get).toHaveBeenCalledWith('/mock/members', {
        params: expect.objectContaining({
          sort_by: 'created_at',
          sort_order: 'desc',
          page: 1,
          per_page: 20,
        }),
      });
    });

    it('should throw on error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(faceService.getMembers()).rejects.toThrow('fail');
    });
  });

  describe('updateMember', () => {
    it('should return success on update', async () => {
      mockedAxios.patch.mockResolvedValue({ data: { success: true, message: 'updated' } });
      const formData = new FormData();
      const result = await faceService.updateMember('123', formData);
      expect(result).toEqual({ success: true, message: 'updated' });
      expect(mockedAxios.patch).toHaveBeenCalledWith('/mock/members/123', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    });

    it('should throw on error', async () => {
      mockedAxios.patch.mockRejectedValue(new Error('fail'));
      await expect(faceService.updateMember('123', new FormData())).rejects.toThrow('fail');
    });
  });

  describe('getMember', () => {
    it('should return member on success', async () => {
      mockedAxios.get.mockResolvedValue({
        data: {
          success: true,
          message: 'ok',
          data: {
            id: '123',
            name: 'Test',
            relationship: { id: '1', name: 'Parent' },
            owner: { id: '1', name: 'Owner' },
            note: null,
            images: [],
            created_at: '',
            updated_at: '',
          },
        },
      });
      const result = await faceService.getMember('123');
      expect(result).toEqual({
        id: '123',
        name: 'Test',
        relationship: { id: '1', name: 'Parent' },
        owner: { id: '1', name: 'Owner' },
        note: null,
        images: [],
        created_at: '',
        updated_at: '',
      });
      expect(mockedAxios.get).toHaveBeenCalledWith('/mock/members/123');
    });

    it('should throw on error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('fail'));
      await expect(faceService.getMember('123')).rejects.toThrow('fail');
    });
  });

  describe('uploadFaces', () => {
    it('should return upload response on success', async () => {
      mockedAxios.post.mockResolvedValue({ data: { success: true, message: 'uploaded' } });
      const formData = new FormData();
      const result = await faceService.uploadFaces(formData);
      expect(result).toEqual({ success: true, message: 'uploaded' });
      expect(mockedAxios.post).toHaveBeenCalledWith('/mock/members', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    });

    it('should throw on error', async () => {
      mockedAxios.post.mockRejectedValue(new Error('fail'));
      await expect(faceService.uploadFaces(new FormData())).rejects.toThrow('fail');
    });
  });

  describe('deleteMemberFace', () => {
    it('should return success on delete', async () => {
      mockedAxios.delete.mockResolvedValue({ data: { success: true, message: 'deleted' } });
      const result = await faceService.deleteMemberFace('123');
      expect(result).toEqual({ success: true, message: 'deleted' });
      expect(mockedAxios.delete).toHaveBeenCalledWith('/mock/members/123');
    });

    it('should throw on error', async () => {
      mockedAxios.delete.mockRejectedValue(new Error('fail'));
      await expect(faceService.deleteMemberFace('123')).rejects.toThrow('fail');
    });
  });
});
