import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SetupCompleteScreenNavigationProp } from '@navigation/types';
import QrScannerBackground from '@assets/webp/qr-scan-background.webp';
import { styles } from './CameraSetup.styles';
import MoveRightIcon from '@assets/svg/vector-right.svg';
import WifiIcon from '@assets/svg/wifi-icon.svg';
import CameraIcon from '@assets/svg/camera-icon.svg';
import UsageScenariosIcon from '@assets/svg/usage-scenarios-icon.svg';
import WifiNameIcon from '@assets/svg/wifi-name-icon.svg';
import SetupLockIcon from '@assets/svg/setup-lock-icon.svg';
import PencilIcon from '@assets/svg/pencil-icon.svg';

const LOCATIONS = ['リビング', '玄関', '寝室', 'ガレージ'];
const SCENES = [
  { id: 'aivis1', label: 'AIVIS', icon: 'home' },
  { id: 'aivis2', label: 'AIVIS', icon: 'office-building' },
  { id: 'aivis3', label: 'AIVIS', icon: 'store' },
];

const CameraSetup: React.FC = () => {
  const navigation = useNavigation<SetupCompleteScreenNavigationProp>();

  const [ssid, setSsid] = useState('AIVIS_Home_5G');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cameraName, setCameraName] = useState('例：リビングカメラ');
  const [selectedLocation, setSelectedLocation] = useState('リビング');
  const [selectedScene, setSelectedScene] = useState('aivis1');

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSaveAndNext = () => {
    navigation.navigate('SetupComplete', {
      cameraName,
      ssid,
    });
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={QrScannerBackground}
        style={styles.backgroundImage}
        resizeMode="stretch"
        imageStyle={styles.imageStyle}
      >
        <SafeAreaView style={styles.container} edges={['top']}>
          <KeyboardAvoidingView
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Icon name="arrow-left" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.title}>カメラ設定</Text>
              <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Wi-Fi Connection Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <WifiIcon />
                  <Text style={styles.sectionTitle}>ネットワーク接続</Text>
                </View>

                <View style={styles.styleInputBorder}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>SSID (Wi-Fi名)</Text>
                    <View style={styles.inputWrapper}>
                      <WifiNameIcon style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={ssid}
                        onChangeText={setSsid}
                        placeholder="WiFi名を入力"
                        placeholderTextColor="#6B7280"
                      />
                      {ssid && <Icon name="check-circle" size={18} color="#00D9FF" />}
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>パスワード</Text>
                    <View style={styles.inputWrapper}>
                      <SetupLockIcon style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="パスワードを入力"
                        placeholderTextColor="#6B7280"
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                        <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Camera Info Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <CameraIcon />
                  <Text style={styles.sectionTitle}>カメラ情報</Text>
                </View>

                <View style={styles.styleInputBorder}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>カメラ名</Text>
                    <View style={styles.inputWrapper}>
                      <PencilIcon style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={cameraName}
                        onChangeText={setCameraName}
                        placeholder="カメラ名を入力"
                        placeholderTextColor="#6B7280"
                      />
                    </View>
                  </View>

                  {/* Location Selection */}
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>カメラ名</Text>
                    <View style={styles.chipContainer}>
                      {LOCATIONS.map((location) => (
                        <TouchableOpacity
                          key={location}
                          style={[styles.chip, selectedLocation === location && styles.chipActive]}
                          onPress={() => setSelectedLocation(location)}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              selectedLocation === location && styles.chipTextActive,
                            ]}
                          >
                            {location}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>

              {/* Scene Selection Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <UsageScenariosIcon />
                  <Text style={styles.sectionTitle}>利用シーン</Text>
                </View>

                <View style={styles.sceneContainer}>
                  {SCENES.map((scene) => (
                    <TouchableOpacity
                      key={scene.id}
                      style={[
                        styles.sceneCard,
                        selectedScene === scene.id && styles.sceneCardActive,
                      ]}
                      onPress={() => setSelectedScene(scene.id)}
                    >
                      <View
                        style={[
                          styles.sceneIconContainer,
                          selectedScene === scene.id && styles.sceneIconContainerActive,
                        ]}
                      >
                        <Icon
                          name={scene.icon}
                          size={24}
                          color={selectedScene === scene.id ? '#00D9FF' : '#6B7280'}
                        />
                      </View>
                      <Text style={styles.sceneLabel}>{scene.label}</Text>
                      {selectedScene === scene.id && (
                        <View style={styles.sceneCheck}>
                          <Icon name="check" size={12} color="#FFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              {/* Bottom Button */}
              <View style={styles.bottomContainer}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveAndNext}>
                  <Text style={styles.saveButtonText}>設定を保存して次へ</Text>
                  <MoveRightIcon />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
};

export default CameraSetup;
