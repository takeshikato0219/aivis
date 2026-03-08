import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@api/types/authTypes';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';
const LINE_PROFILE_KEY = 'lineProfile';

export const setUserData = async (user: User) => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (e) {
    console.log('Error saving user data:', e);
  }
};

export const setAuthData = async (accessToken: string, refreshToken: string, user: User) => {
  try {
    await AsyncStorage.multiSet([
      [ACCESS_TOKEN_KEY, accessToken],
      [REFRESH_TOKEN_KEY, refreshToken],
      [USER_KEY, JSON.stringify(user)],
    ]);
  } catch (e) {
    // handle error
    console.log('Error saving auth data:', e);
  }
};

export const removeAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([
      ACCESS_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_KEY,
      LINE_PROFILE_KEY,
    ]);
  } catch (e) {
    console.log('Error removing auth data:', e);
  }
};

export const getAuthData = async () => {
  try {
    const values = await AsyncStorage.multiGet([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    const accessToken = values[0][1];
    const refreshToken = values[1][1];
    const user = values[2][1] ? JSON.parse(values[2][1] as string) : null;
    return { accessToken, refreshToken, user };
  } catch (e) {
    console.log('Error loading auth data:', e);
    return { accessToken: null, refreshToken: null, user: null };
  }
};

export const updateTokens = async (accessToken: string, refreshToken?: string) => {
  try {
    const updates: [string, string][] = [[ACCESS_TOKEN_KEY, accessToken]];
    if (refreshToken) {
      updates.push([REFRESH_TOKEN_KEY, refreshToken]);
    }
    await AsyncStorage.multiSet(updates);
  } catch (e) {
    console.log('Error updating tokens:', e);
  }
};
