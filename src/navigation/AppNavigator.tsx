import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AppStackParamList } from './types';
import { DARK_COLORS } from '@constants/theme';
import BLEConnectionHandler from '@components/BLEConnectionHandler/BLEConnectionHandler';

// Import Screens
import Home from '@screens/Home/Home';
import Notifications from '@screens/Notifications/Notifications';
import Introduce from '@screens/Introduce/Introduce';
import Detail from '@screens/Detail/Detail';
import CameraLiveView from '@screens/CameraLiveView/CameraLiveView';
import QRScanner from '@screens/QRScanner/QRScanner';
import CameraSetup from '@screens/CameraSetup/CameraSetup';
import SetupComplete from '@screens/SetupComplete/SetupComplete';
import Profile from '@screens/Profile/Profile';
import EditProfile from '@screens/EditProfile/EditProfile';
import ChangePassword from '@screens/ChangePassword/ChangePassword';
import DetectionZoneSetup from '@screens/DetectionZoneSetup/DetectionZoneSetup';
import ConnectDevice from '@screens/ConnectDevice/ConnectDevice';
import PairingCode from '@screens/PairingCode/PairingCode';
import ConnectWifiHotspot from '@screens/ConnectWifiHotspot/ConnectWifiHotspot';
import NetworkSetup from '@screens/NetworkSetup/NetworkSetup';
import Setting from '@screens/Setting/Setting';
import FaceUpload from '@screens/FaceUpload/FaceUpload';
import ConnectionSuccessful from '@screens/ConnectionSuccessful/ConnectionSuccessful';
import SettingAI from '@screens/SettingAI/SettingAI';
import ListFace from '@screens/FaceUpload/ListFace';
import DetailFace from '@screens/FaceUpload/DetailFace';
import AiDetectionRules from '@screens/AiDetectionRules/AiDetectionRules';
import WorkSchedule from '@screens/WorkSchedule/WorkSchedule';
import UploadDetectZone from '@screens/DetectionZoneSetup/UploadDetectZone';
import ListNotificationCamera from '@screens/ListNotificationCamera/ListNotificationCamera';
import CustomerReport from '@screens/CustomerReport/CustomerReport';
import Policy from "@screens/Policy/Policy";

const Stack = createStackNavigator<AppStackParamList>();

// ===== APP STACK NAVIGATOR (Wrap BottomTab + Modal Screens) =====
const AppNavigator = () => {
  return (
    <>
      <BLEConnectionHandler />
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: DARK_COLORS.background,
          },
          headerTintColor: DARK_COLORS.text,
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        }}
      >
        <Stack.Screen
          name="Introduce"
          component={Introduce}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Home"
          component={Home}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="Detail"
          component={Detail}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CameraLive"
          component={CameraLiveView}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Notifications"
          component={Notifications}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="QRScanner"
          component={QRScanner}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CameraSetup"
          component={CameraSetup}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="SetupComplete"
          component={SetupComplete}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Profile"
          component={Profile}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="EditProfile"
          component={EditProfile}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ChangePassword"
          component={ChangePassword}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="DetectionZoneSetup"
          component={DetectionZoneSetup}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="ConnectDevice"
          component={ConnectDevice}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="PairingCode"
          component={PairingCode}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="NetworkSetup"
          component={NetworkSetup}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="ConnectWifiHotspot"
          component={ConnectWifiHotspot}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Setting"
          component={Setting}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="FaceUpload"
          component={FaceUpload}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ConnectionSuccessful"
          component={ConnectionSuccessful}
          options={{
            headerShown: false,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="SettingAI"
          component={SettingAI}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ListFace"
          component={ListFace}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="DetailFace"
          component={DetailFace}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="AiDetectionRules"
          component={AiDetectionRules}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="WorkSchedule"
          component={WorkSchedule}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="UploadDetectZone"
          component={UploadDetectZone}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="ListNotificationCamera"
          component={ListNotificationCamera}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="CustomerReport"
          component={CustomerReport}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Policy"
          component={Policy}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </>
  );
};

export default AppNavigator;
