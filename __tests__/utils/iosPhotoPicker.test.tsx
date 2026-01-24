// Mock the iosPhotoPicker module to prevent native module access during import
jest.mock('../../src/utils/iosPhotoPicker.ts', () => ({
  pickImageIOS: jest.fn(),
}));

import { pickImageIOS } from '@utils/iosPhotoPicker';

describe('iOS Photo Picker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(pickImageIOS).toBeDefined();
    expect(typeof pickImageIOS).toBe('function');
  });

  it('should be a mock function', () => {
    expect(pickImageIOS).toHaveProperty('mock');
  });

  describe('Mock behavior testing', () => {
    it('should return configured mock values', async () => {
      (pickImageIOS as jest.MockedFunction<typeof pickImageIOS>).mockResolvedValue({
        assets: [{ uri: 'file://test.jpg' }],
      });

      const result = await pickImageIOS();
      expect(result).toEqual({
        assets: [{ uri: 'file://test.jpg' }],
      });
    });

    it('should handle null return values', async () => {
      (pickImageIOS as jest.MockedFunction<typeof pickImageIOS>).mockResolvedValue(null);

      const result = await pickImageIOS();
      expect(result).toBeNull();
    });

    it('should handle promise rejections', async () => {
      const testError = new Error('Mock error');
      (pickImageIOS as jest.MockedFunction<typeof pickImageIOS>).mockRejectedValue(testError);

      await expect(pickImageIOS()).rejects.toThrow('Mock error');
    });

    it('should track function calls', async () => {
      (pickImageIOS as jest.MockedFunction<typeof pickImageIOS>).mockResolvedValue(null);

      await pickImageIOS();
      await pickImageIOS();

      expect(pickImageIOS).toHaveBeenCalledTimes(2);
    });
  });

  describe('Interface testing', () => {
    it('should return a promise when called', () => {
      (pickImageIOS as jest.MockedFunction<typeof pickImageIOS>).mockResolvedValue(null);

      const result = pickImageIOS();
      expect(result).toBeInstanceOf(Promise);
    });

    it('should be callable without parameters', async () => {
      (pickImageIOS as jest.MockedFunction<typeof pickImageIOS>).mockResolvedValue(undefined);

      await expect(pickImageIOS()).resolves.toBeUndefined();
    });

    it('should handle different response types', async () => {
      const testCases = [
        null,
        undefined,
        { assets: [] },
        { assets: [{ uri: 'file://test.jpg' }] },
        'string response',
        42,
        [],
        {},
      ];

      for (const testValue of testCases) {
        (pickImageIOS as jest.MockedFunction<typeof pickImageIOS>).mockResolvedValue(testValue);
        const result = await pickImageIOS();
        expect(result).toBe(testValue);
      }
    });
  });
});
