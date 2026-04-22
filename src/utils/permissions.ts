import { Platform, Linking } from 'react-native';
import { check, request, RESULTS, PERMISSIONS } from 'react-native-permissions';

export async function checkMicPermission(): Promise<
  'granted' | 'denied' | 'blocked' | 'unavailable'
> {
  let permission;
  if (Platform.OS === 'ios') {
    permission = PERMISSIONS.IOS.MICROPHONE;
  } else {
    permission = PERMISSIONS.ANDROID.RECORD_AUDIO;
  }
  const status = await check(permission);
  if (status === RESULTS.GRANTED) return 'granted';
  if (status === RESULTS.BLOCKED) return 'blocked';
  if (status === RESULTS.DENIED) return 'denied';
  return 'unavailable';
}

export async function requestMicPermission(): Promise<
  'granted' | 'denied' | 'blocked' | 'unavailable'
> {
  let permission;
  if (Platform.OS === 'ios') {
    permission = PERMISSIONS.IOS.MICROPHONE;
  } else {
    permission = PERMISSIONS.ANDROID.RECORD_AUDIO;
  }
  const status = await request(permission);
  if (status === RESULTS.GRANTED) return 'granted';
  if (status === RESULTS.BLOCKED) return 'blocked';
  if (status === RESULTS.DENIED) return 'denied';
  return 'unavailable';
}

export function openAppSettings() {
  Linking.openSettings();
}
