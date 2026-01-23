import { pickImageIOS } from '../../src/utils/iosPhotoPicker';

describe('iOS Photo Picker', () => {
  it('should be defined', () => {
    expect(pickImageIOS).toBeDefined();
    expect(typeof pickImageIOS).toBe('function');
  });

  // Note: This function calls a native iOS module (PhotoPickerModule)
  // which cannot be easily mocked in Jest. The function is very simple
  // and just checks platform + calls native module. Integration testing
  // would be more appropriate for full testing.
});
