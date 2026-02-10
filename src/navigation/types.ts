import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { Camera } from '@api/types/cameraTypes';

// ===== ROOT STACK =====
export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

// ===== AUTH STACK =====
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
  VerifyEmail: { email: string };
};

// ===== APP STACK =====
export type AppStackParamList = {
  Introduce: undefined;
  Home: undefined;
  Notifications: undefined;
  Detail: {
    camera: Camera;
  };
  CameraLive: {
    cameraId: string;
    cameraName?: string;
    baseUrl?: string;
  };
  QRScanner: undefined;
  CameraSetup: { qrData: string | null };
  SetupComplete: { cameraName: string; ssid: string };
  Profile: undefined;
  EditProfile: undefined;
  ChangePassword: undefined;
  DetectionZoneSetup: {
    cameraId: string;
    cameraSnapshot?: string;
  };
  ConnectDevice: undefined;
  PairingCode: {
    device?: {
      id: string;
      name?: string | null;
      isConnectable?: boolean | null;
      localName?: string | null;
      manufacturerData?: any;
      serviceUUIDs?: string[] | null;
    };
    pairingCode?: string;
    wifi?: any;
    isWifi?: boolean;
  };
  ConnectWifiHotspot: { wifi: any };
  NetworkSetup: { cameraAp: string };
  Setting: undefined;
  FaceUpload: undefined;
  ConnectionSuccessful: { cameraData: Camera };
  SettingAI: { cameraData: Camera };
  ListFace: undefined;
  DetailFace: { memberId: string };
};

// ===== NAVIGATION PROPS =====

export type HomeScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<AppStackParamList, 'Home'>,
  StackNavigationProp<RootStackParamList, 'App'>
>;

// Auth
export type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

export type DetailScreenNavigationProp = StackNavigationProp<AppStackParamList, 'Detail'>;
export type DetailScreenRouteProp = RouteProp<AppStackParamList, 'Detail'>;

export type CameraLiveScreenNavigationProp = StackNavigationProp<AppStackParamList, 'CameraLive'>;
export type CameraLiveScreenRouteProp = RouteProp<AppStackParamList, 'CameraLive'>;

export type CameraSetupScreenNavigationProp = StackNavigationProp<AppStackParamList, 'CameraSetup'>;
export type CameraSetupScreenRouteProp = RouteProp<AppStackParamList, 'CameraSetup'>;

export type DetectionZoneSetupScreenNavigationProp = StackNavigationProp<
  AppStackParamList,
  'DetectionZoneSetup'
>;
export type DetectionZoneSetupScreenRouteProp = RouteProp<AppStackParamList, 'DetectionZoneSetup'>;

export type SetupCompleteScreenNavigationProp = StackNavigationProp<
  AppStackParamList,
  'SetupComplete'
>;
export type SetupCompleteScreenRouteProp = RouteProp<AppStackParamList, 'SetupComplete'>;

export type ConnectDeviceScreenNavigationProp = CompositeNavigationProp<
  StackNavigationProp<AppStackParamList, 'ConnectDevice'>,
  StackNavigationProp<RootStackParamList, 'App'>
>;

export type PairingCodeScreenNavigationProp = StackNavigationProp<AppStackParamList, 'PairingCode'>;
export type PairingCodeScreenRouteProp = RouteProp<AppStackParamList, 'PairingCode'>;

export type ConnectWifiHotspotNavigationProp = StackNavigationProp<
  AppStackParamList,
  'ConnectWifiHotspot'
>;
export type ConnectWifiHotspotRouteProp = RouteProp<AppStackParamList, 'ConnectWifiHotspot'>;

export type NetworkSetupNavigationProp = StackNavigationProp<AppStackParamList, 'NetworkSetup'>;
export type NetworkSetupRouteProp = RouteProp<AppStackParamList, 'NetworkSetup'>;

export type ConnectionSuccessfulScreenNavigationProp = StackNavigationProp<
  AppStackParamList,
  'ConnectionSuccessful'
>;
export type ConnectionSuccessfulScreenRouteProp = RouteProp<
  AppStackParamList,
  'ConnectionSuccessful'
>;

export type SettingAIScreenNavigationProp = StackNavigationProp<AppStackParamList, 'SettingAI'>;
export type SettingAIScreenRouteProp = RouteProp<AppStackParamList, 'SettingAI'>;

export type DetailFaceNavigationProp = StackNavigationProp<AppStackParamList, 'DetailFace'>;
export type DetailFaceRouteProp = RouteProp<AppStackParamList, 'DetailFace'>;

// ===== DECLARE GLOBAL =====
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
