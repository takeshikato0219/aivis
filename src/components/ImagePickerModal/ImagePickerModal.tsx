import React from 'react';
import { View, TouchableOpacity, TouchableWithoutFeedback, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { COLORS } from '@constants/theme';
import { useTranslation } from 'react-i18next';
import { styles } from './ImagePickerModal.styles';

interface ImagePickerModalProps {
  visible: boolean;
  slideAnim: Animated.Value;
  opacityAnim: Animated.Value;
  onClose: () => void;
  onTakePhoto: () => void;
  onChooseFromLibrary: () => void;
}

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  visible,
  slideAnim,
  opacityAnim,
  onClose,
  onTakePhoto,
  onChooseFromLibrary,
}) => {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={[
            styles.modalBackdrop,
            {
              opacity: opacityAnim,
            },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Modal Content - Bottom Sheet */}
      <Animated.View
        style={[
          styles.modalContent,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
        pointerEvents="box-none"
      >
        {/* Drag indicator */}
        <View style={styles.modalDragIndicator} />

        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('register.chooseImageSource')}</Text>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Options Container */}
        <View style={styles.modalOptionsContainer}>
          {/* Camera Option */}
          <TouchableOpacity style={styles.modalButton} onPress={onTakePhoto} activeOpacity={0.7}>
            <View style={styles.modalButtonIconContainer}>
              <Icon name="camera-alt" size={28} color={COLORS.primary} />
            </View>
            <View style={styles.modalButtonContent}>
              <Text style={styles.modalButtonText}>{t('register.takePhoto')}</Text>
              <Text style={styles.modalButtonDescription}>
                {t('register.useCameraToTakeANewPhoto')}
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#BBBBBB" />
          </TouchableOpacity>

          {/* Library Option */}
          <TouchableOpacity
            style={styles.modalButton}
            onPress={onChooseFromLibrary}
            activeOpacity={0.7}
          >
            <View style={styles.modalButtonIconContainer}>
              <Icon name="photo-library" size={28} color={COLORS.primary} />
            </View>
            <View style={styles.modalButtonContent}>
              <Text style={styles.modalButtonText}>{t('register.chooseFromLibrary')}</Text>
              <Text style={styles.modalButtonDescription}>
                {t('register.selectFromYourPhotoGallery')}
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color="#BBBBBB" />
          </TouchableOpacity>
        </View>

        {/* Cancel Button */}
        <View style={styles.modalFooter}>
          <TouchableOpacity style={styles.modalCancelButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.modalCancelText}>{t('register.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};
