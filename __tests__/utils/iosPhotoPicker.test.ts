const mockPickImage = jest.fn();

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' as string },
  NativeModules: {
    PhotoPickerModule: {
      pickImage: (...args: unknown[]) => mockPickImage(...args),
    },
  },
}));

import { pickImageIOS } from '@utils/iosPhotoPicker';

const { Platform } = require('react-native');

describe('iosPhotoPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'ios';
    mockPickImage.mockResolvedValue(undefined);
  });

  it('returns null when Platform is not iOS', async () => {
    Platform.OS = 'android';

    const result = await pickImageIOS();

    expect(result).toBeNull();
    expect(mockPickImage).not.toHaveBeenCalled();
  });

  it('calls PhotoPickerModule.pickImage and returns its result on iOS', async () => {
    const payload = { assets: [{ uri: 'file:///tmp/photo.jpg' }] };
    mockPickImage.mockResolvedValue(payload);

    const result = await pickImageIOS();

    expect(mockPickImage).toHaveBeenCalledTimes(1);
    expect(result).toEqual(payload);
  });

  it('propagates rejection when pickImage fails', async () => {
    mockPickImage.mockRejectedValue(new Error('User cancelled'));

    await expect(pickImageIOS()).rejects.toThrow('User cancelled');
  });
});

describe('iosPhotoPicker — PhotoPickerModule not linked', () => {
  it('throws when native module is missing', async () => {
    jest.resetModules();
    jest.doMock('react-native', () => ({
      Platform: { OS: 'ios' },
      NativeModules: {},
    }));
    const { pickImageIOS: pickImageIOSFresh } = require('@utils/iosPhotoPicker');

    await expect(pickImageIOSFresh()).rejects.toThrow('PhotoPickerModule not linked');
  });
});
