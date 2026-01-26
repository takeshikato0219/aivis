import { renderHook, act } from '@testing-library/react-native';
import { useImagePicker } from '@hooks/useImagePicker';

// Mock react-native-permissions
jest.mock('react-native-permissions', () => ({
  check: jest.fn(),
  request: jest.fn(),
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
    UNAVAILABLE: 'unavailable',
    LIMITED: 'limited',
  },
  PERMISSIONS: {
    IOS: {
      CAMERA: 'ios.permission.CAMERA',
      PHOTO_LIBRARY: 'ios.permission.PHOTO_LIBRARY',
    },
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
      READ_MEDIA_IMAGES: 'android.permission.READ_MEDIA_IMAGES',
    },
  },
  openSettings: jest.fn(),
}));

// Mock react-native-image-picker
jest.mock('react-native-image-picker', () => ({
  launchCamera: jest.fn(),
  launchImageLibrary: jest.fn(),
}));

// Mock iosPhotoPicker utility
jest.mock('@utils/iosPhotoPicker', () => ({
  pickImageIOS: jest.fn(),
}));

import { check, request, RESULTS, PERMISSIONS, openSettings } from 'react-native-permissions';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { Alert, Animated, Platform } from 'react-native';
import { pickImageIOS } from '@utils/iosPhotoPicker';

// Mock react-native-reanimated since the hook uses it
jest.mock('react-native-reanimated', () => ({
  useAnimatedStyle: jest.fn(() => ({})),
  useSharedValue: jest.fn(() => ({ value: 0 })),
  withTiming: jest.fn(),
  withSpring: jest.fn(),
  runOnJS: jest.fn(),
  interpolate: jest.fn(),
}));

// Create mock variables - these will be mocked by jest setup or our manual mocks
let mockCheck: jest.MockedFunction<typeof check>;
let mockRequest: jest.MockedFunction<typeof request>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let mockOpenSettings: jest.MockedFunction<typeof openSettings>;
let mockLaunchCamera: jest.MockedFunction<typeof launchCamera>;
let mockLaunchImageLibrary: jest.MockedFunction<typeof launchImageLibrary>;
let mockPickImageIOS: jest.MockedFunction<typeof pickImageIOS>;

// Since Alert.alert is mocked globally in jest setup, use global.alert
// @ts-ignore
let mockAlert: jest.MockedFunction<typeof global.alert>;

describe('useImagePicker hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Set up mock variables
    mockCheck = check as jest.MockedFunction<typeof check>;
    mockRequest = request as jest.MockedFunction<typeof request>;
    mockOpenSettings = openSettings as jest.MockedFunction<typeof openSettings>;
    mockLaunchCamera = launchCamera as jest.MockedFunction<typeof launchCamera>;
    mockLaunchImageLibrary = launchImageLibrary as jest.MockedFunction<typeof launchImageLibrary>;
    mockPickImageIOS = pickImageIOS as jest.MockedFunction<typeof pickImageIOS>;
    // Spy on Alert.alert since it's mocked in jest setup
    mockAlert = jest.spyOn(Alert, 'alert') as jest.MockedFunction<typeof Alert.alert>;

    // Spy on Animated functions
    // @ts-ignore
    jest.spyOn(Animated, 'Value').mockImplementation(() => ({
      setValue: jest.fn(),
      interpolate: jest.fn(),
    }));
    // @ts-ignore
    jest.spyOn(Animated, 'parallel').mockImplementation(() => ({
      start: jest.fn(),
    }));
    // @ts-ignore
    jest.spyOn(Animated, 'timing').mockImplementation(() => ({
      start: jest.fn(),
    }));
  });

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useImagePicker());

    expect(result.current.selectedImage).toBeNull();
    expect(result.current.showImagePicker).toBe(false);
    expect(result.current.slideAnim).toBeDefined();
    expect(result.current.opacityAnim).toBeDefined();
    expect(typeof result.current.handleUploadPress).toBe('function');
    expect(typeof result.current.handleTakePhoto).toBe('function');
    expect(typeof result.current.handleChooseFromLibrary).toBe('function');
    expect(typeof result.current.handleRemoveImage).toBe('function');
    expect(typeof result.current.closeModal).toBe('function');
    expect(typeof result.current.setSelectedImage).toBe('function');
  });

  describe('handleUploadPress', () => {
    it('should open modal when called', () => {
      const { result } = renderHook(() => useImagePicker());

      act(() => {
        result.current.handleUploadPress();
      });

      expect(result.current.showImagePicker).toBe(true);
    });
  });

  describe('closeModal', () => {
    it('should start closing modal animation when called', () => {
      const { result } = renderHook(() => useImagePicker());

      act(() => {
        result.current.handleUploadPress(); // Open modal first
      });
      expect(result.current.showImagePicker).toBe(true);

      act(() => {
        result.current.closeModal();
      });

      // Modal should still be visible during animation
      expect(result.current.showImagePicker).toBe(true);
      // But animation should have been triggered
      expect(Animated.parallel).toHaveBeenCalled();
    });
  });

  describe('handleRemoveImage', () => {
    it('should clear selected image', () => {
      const { result } = renderHook(() => useImagePicker());

      const mockImage = { uri: 'test-uri', width: 100, height: 100 };
      act(() => {
        result.current.setSelectedImage(mockImage);
      });
      expect(result.current.selectedImage).toEqual(mockImage);

      act(() => {
        result.current.handleRemoveImage();
      });

      expect(result.current.selectedImage).toBeNull();
    });
  });

  describe('handleTakePhoto - iOS', () => {
    beforeEach(() => {
      // Mock iOS platform
      Object.defineProperty(Platform, 'OS', {
        value: 'ios',
        configurable: true,
      });
    });

    it('should close modal and open camera when permission is granted', async () => {
      mockCheck.mockResolvedValue(RESULTS.GRANTED);

      const { result } = renderHook(() => useImagePicker());

      act(() => {
        result.current.handleUploadPress();
      });
      expect(result.current.showImagePicker).toBe(true);

      await act(async () => {
        await result.current.handleTakePhoto();
      });

      // Modal should still be visible during animation
      expect(result.current.showImagePicker).toBe(true);
      expect(mockLaunchCamera).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaType: 'photo',
          cameraType: 'back',
          quality: 0.8,
        }),
        expect.any(Function)
      );
    });

    it('should show blocked permission alert when permission is blocked', async () => {
      mockCheck.mockResolvedValue(RESULTS.BLOCKED);

      const { result } = renderHook(() => useImagePicker());

      await act(async () => {
        await result.current.handleTakePhoto();
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'permission.imageTitle',
        'permission.permissionBlocked',
        expect.arrayContaining([
          { text: 'permission.cancel', style: 'cancel' },
          { text: 'permission.openSettings', onPress: expect.any(Function) },
        ])
      );
    });

    it('should request permission when not granted and not blocked', async () => {
      mockCheck.mockResolvedValue(RESULTS.DENIED);
      mockRequest.mockResolvedValue(RESULTS.GRANTED);

      const { result } = renderHook(() => useImagePicker());

      await act(async () => {
        await result.current.handleTakePhoto();
      });

      expect(mockRequest).toHaveBeenCalledWith(PERMISSIONS.IOS.CAMERA);
    });
  });

  describe('handleTakePhoto - Android', () => {
    beforeEach(() => {
      // Mock Android platform
      Object.defineProperty(Platform, 'OS', {
        value: 'android',
        configurable: true,
      });
    });

    it('should handle camera permission on Android', async () => {
      mockCheck.mockResolvedValue(RESULTS.GRANTED);

      const { result } = renderHook(() => useImagePicker());

      await act(async () => {
        await result.current.handleTakePhoto();
      });

      expect(mockLaunchCamera).toHaveBeenCalled();
    });

    it('should accept UNAVAILABLE as granted on Android', async () => {
      mockCheck.mockResolvedValue(RESULTS.UNAVAILABLE);

      const { result } = renderHook(() => useImagePicker());

      await act(async () => {
        await result.current.handleTakePhoto();
      });

      expect(mockLaunchCamera).toHaveBeenCalled();
    });
  });

  describe('handleChooseFromLibrary - iOS', () => {
    beforeEach(() => {
      // Mock iOS platform
      Object.defineProperty(Platform, 'OS', {
        value: 'ios',
        configurable: true,
      });
      mockPickImageIOS.mockResolvedValue({
        assets: [{ uri: 'ios-image-uri', width: 200, height: 200 }],
      });
    });

    it('should close modal and use iOS photo picker when permission is granted', async () => {
      mockCheck.mockResolvedValue(RESULTS.GRANTED);

      const { result } = renderHook(() => useImagePicker());

      act(() => {
        result.current.handleUploadPress();
      });
      expect(result.current.showImagePicker).toBe(true);

      await act(async () => {
        await result.current.handleChooseFromLibrary();
      });

      // Modal should still be visible during animation
      expect(result.current.showImagePicker).toBe(true);
      expect(mockPickImageIOS).toHaveBeenCalled();
      expect(result.current.selectedImage).toEqual({
        uri: 'ios-image-uri',
        width: 200,
        height: 200,
      });
    });

    it('should handle LIMITED permission on iOS as granted', async () => {
      mockCheck.mockResolvedValue(RESULTS.LIMITED);

      const { result } = renderHook(() => useImagePicker());

      await act(async () => {
        await result.current.handleChooseFromLibrary();
      });

      expect(mockPickImageIOS).toHaveBeenCalled();
    });

    it('should show blocked permission alert on iOS when permission is blocked', async () => {
      mockCheck.mockResolvedValue(RESULTS.BLOCKED);

      const { result } = renderHook(() => useImagePicker());

      await act(async () => {
        await result.current.handleChooseFromLibrary();
      });

      expect(mockAlert).toHaveBeenCalledWith(
        'permission.imageTitle',
        'permission.permissionBlocked',
        expect.any(Array)
      );
    });

    it('should handle iOS photo picker errors gracefully', async () => {
      mockCheck.mockResolvedValue(RESULTS.GRANTED);
      mockPickImageIOS.mockRejectedValue(new Error('Picker failed'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const { result } = renderHook(() => useImagePicker());

      await act(async () => {
        await result.current.handleChooseFromLibrary();
      });

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('handleChooseFromLibrary - Android', () => {
    beforeEach(() => {
      // Mock Android platform
      Object.defineProperty(Platform, 'OS', {
        value: 'android',
        configurable: true,
      });
    });

    it('should close modal and open gallery when permission is granted', async () => {
      mockCheck.mockResolvedValue(RESULTS.GRANTED);

      const { result } = renderHook(() => useImagePicker());

      act(() => {
        result.current.handleUploadPress();
      });
      expect(result.current.showImagePicker).toBe(true);

      await act(async () => {
        await result.current.handleChooseFromLibrary();
      });

      // Modal should still be visible during animation
      expect(result.current.showImagePicker).toBe(true);
      expect(mockLaunchImageLibrary).toHaveBeenCalledWith(
        expect.objectContaining({
          mediaType: 'photo',
          selectionLimit: 1,
        }),
        expect.any(Function)
      );
    });

    it('should accept UNAVAILABLE as granted on Android', async () => {
      mockCheck.mockResolvedValue(RESULTS.UNAVAILABLE);

      const { result } = renderHook(() => useImagePicker());

      await act(async () => {
        await result.current.handleChooseFromLibrary();
      });

      expect(mockLaunchImageLibrary).toHaveBeenCalled();
    });

    it('should request permission when not granted and not blocked', async () => {
      mockCheck.mockResolvedValue(RESULTS.DENIED);
      mockRequest.mockResolvedValue(RESULTS.GRANTED);

      const { result } = renderHook(() => useImagePicker());

      await act(async () => {
        await result.current.handleChooseFromLibrary();
      });

      expect(mockRequest).toHaveBeenCalledWith(PERMISSIONS.ANDROID.READ_MEDIA_IMAGES);
      expect(mockLaunchImageLibrary).toHaveBeenCalled();
    });
  });

  describe('Image picker response handling', () => {
    it('should set selected image when response has assets', async () => {
      const mockResponse = {
        assets: [{ uri: 'test-uri', width: 100, height: 100 }],
      };

      mockCheck.mockResolvedValue(RESULTS.GRANTED);
      // @ts-ignore
      mockLaunchCamera.mockImplementation((options, callback) => {
        // Call the callback immediately with the response
        callback && callback(mockResponse);
      });

      const { result } = renderHook(() => useImagePicker());

      await act(async () => {
        await result.current.handleTakePhoto();
      });

      expect(result.current.selectedImage).toEqual(mockResponse.assets[0]);
    });

    it('should not set image when response is cancelled', () => {
      const mockResponse = {
        didCancel: true,
      };

      const { result } = renderHook(() => useImagePicker());
      // @ts-ignore
      mockLaunchCamera.mockImplementation((options, callback) => {
        // @ts-ignore
        callback(mockResponse);
      });

      act(() => {
        result.current.setSelectedImage({ uri: 'existing-image' });
        result.current.handleTakePhoto();
      });

      expect(result.current.selectedImage).toEqual({ uri: 'existing-image' });
    });

    it('should show alert when response has error', async () => {
      const mockResponse = {
        errorCode: 'camera_unavailable',
        errorMessage: 'Camera not available',
      };

      mockCheck.mockResolvedValue(RESULTS.GRANTED);
      // @ts-ignore
      mockLaunchCamera.mockImplementation((options, callback) => {
        if (callback) {
          // @ts-ignore
          callback(mockResponse);
        }
        return Promise.resolve();
      });

      const { result } = renderHook(() => useImagePicker());

      await act(async () => {
        await result.current.handleTakePhoto();
      });

      expect(mockAlert).toHaveBeenCalledWith('Error', 'Camera not available');
    });
  });

  describe('Animation behavior', () => {
    it('should trigger open animation when modal opens', () => {
      const { result } = renderHook(() => useImagePicker());

      act(() => {
        result.current.handleUploadPress();
      });

      expect(Animated.parallel).toHaveBeenCalled();
      expect(Animated.timing).toHaveBeenCalledTimes(2); // slide and opacity
    });

    it('should trigger close animation when modal closes', () => {
      const { result } = renderHook(() => useImagePicker());

      act(() => {
        result.current.handleUploadPress();
      });

      // Reset mock call counts
      // @ts-ignore
      (Animated.parallel as jest.SpyInstance).mockClear();
      // @ts-ignore
      (Animated.timing as jest.SpyInstance).mockClear();

      act(() => {
        result.current.closeModal();
      });

      expect(Animated.parallel).toHaveBeenCalled();
      expect(Animated.timing).toHaveBeenCalledTimes(2);
    });
  });

  describe('setSelectedImage', () => {
    it('should update selected image', () => {
      const { result } = renderHook(() => useImagePicker());

      const mockImage = { uri: 'custom-image', width: 300, height: 300 };

      act(() => {
        result.current.setSelectedImage(mockImage);
      });

      expect(result.current.selectedImage).toEqual(mockImage);
    });
  });
});
