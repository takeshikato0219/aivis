import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { Camera, WorkflowStatus } from '@api/types/cameraTypes';
import { MemberRelationship } from '@api/faceService';

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
  Policy: { type: string };
};

// ===== APP STACK =====
export type AppStackParamList = {
  Introduce: undefined;
  Home: undefined;
  Notifications: { userId?: string };
  Detail: {
    camera: Camera;
    workflowStatuses: WorkflowStatus[];
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
    camera: Camera;
    zoneType?: 'detection' | 'restricted' | 'entryExit';
    typeId?: string;
    liveUrl: string;
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
  FaceUpload: { type: string };
  ConnectionSuccessful: { cameraData: Camera };
  SettingAI: { camera: Camera };
  ListFace: { type: string };
  DetailFace: { memberId: string; relationships?: MemberRelationship[] };
  AiDetectionRules: { camera: Camera };
  WorkSchedule: {
    camera: Camera;
    ruleId: string;
    title: string;
    code: string;
  };
  UploadDetectZone: {
    camera: Camera;
  };
  ListNotificationCamera: {
    title: string;
    icon: string;
    code: string;
    cameraId: string;
    detected_at?: string;
  };
  CustomerReport: { title: string; icon: string };
  Policy: { type: string };
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

export type SetupCompleteScreenNavigationProp = StackNavigationProp<
  AppStackParamList,
  'SetupComplete'
>;

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

export type ConnectionSuccessfulScreenRouteProp = RouteProp<
  AppStackParamList,
  'ConnectionSuccessful'
>;

export type DetailFaceNavigationProp = StackNavigationProp<AppStackParamList, 'DetailFace'>;
export type DetailFaceRouteProp = RouteProp<AppStackParamList, 'DetailFace'>;

export type WorkScheduleRouteProp = RouteProp<AppStackParamList, 'WorkSchedule'>;

export type ListFaceRouteProp = RouteProp<AppStackParamList, 'ListFace'>;

// ===== DECLARE GLOBAL =====
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
