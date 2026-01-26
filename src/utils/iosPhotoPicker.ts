import { NativeModules, Platform } from 'react-native';

const { PhotoPickerModule } = NativeModules;

export const pickImageIOS = async () => {
  if (Platform.OS !== 'ios') return null;

  if (!PhotoPickerModule) {
    throw new Error('PhotoPickerModule not linked');
  }

  return PhotoPickerModule.pickImage();
};
