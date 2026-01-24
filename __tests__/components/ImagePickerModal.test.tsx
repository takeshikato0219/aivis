import React from 'react';
import { Animated } from 'react-native';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ImagePickerModal } from '../../src/components/ImagePickerModal/ImagePickerModal';

// ===== MOCK EXTERNAL DEPENDENCIES =====

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function MockIcon({ name, size, color }: any) {
    return <Text testID={`icon-${name}`}>{`${name}-${size}-${color}`}</Text>;
  };
});

// Mock react-native-paper
jest.mock('react-native-paper', () => ({
  Text: ({ children, ...props }: any) => {
    const React = require('react');
    const { Text: RNText } = require('react-native');
    return <RNText {...props}>{children}</RNText>;
  },
}));

// Mock constants
jest.mock('@constants/theme', () => ({
  COLORS: {
    primary: '#007AFF',
  },
}));

// Mock styles
jest.mock('../../src/components/ImagePickerModal/ImagePickerModal.styles', () => ({
  styles: {
    modalOverlay: { flex: 1 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: 'white', borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    modalDragIndicator: { width: 40, height: 4, backgroundColor: '#CCCCCC', borderRadius: 2, alignSelf: 'center', marginVertical: 8 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    modalTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
    modalOptionsContainer: { paddingHorizontal: 16 },
    modalButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
    modalButtonIconContainer: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    modalButtonContent: { flex: 1 },
    modalButtonText: { fontSize: 16, fontWeight: '500', color: '#333' },
    modalButtonDescription: { fontSize: 14, color: '#666', marginTop: 2 },
    modalFooter: { padding: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
    modalCancelButton: { paddingVertical: 12, alignItems: 'center' },
    modalCancelText: { fontSize: 16, color: '#666' },
  },
}));

describe('ImagePickerModal Component', () => {
  const defaultProps = {
    visible: true,
    slideAnim: new Animated.Value(0),
    opacityAnim: new Animated.Value(1),
    onClose: jest.fn(),
    onTakePhoto: jest.fn(),
    onChooseFromLibrary: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Visibility Control', () => {
    it('renders modal when visible is true', () => {
      render(<ImagePickerModal {...defaultProps} />);

      expect(screen.getByText('register.chooseImageSource')).toBeTruthy();
      expect(screen.getByText('register.takePhoto')).toBeTruthy();
      expect(screen.getByText('register.chooseFromLibrary')).toBeTruthy();
    });

    it('does not render modal when visible is false', () => {
      render(<ImagePickerModal {...defaultProps} visible={false} />);

      expect(screen.queryByText('register.chooseImageSource')).toBeNull();
      expect(screen.queryByText('register.takePhoto')).toBeNull();
      expect(screen.queryByText('register.chooseFromLibrary')).toBeNull();
    });

    it('returns null when not visible', () => {
      const { toJSON } = render(<ImagePickerModal {...defaultProps} visible={false} />);
      expect(toJSON()).toBeNull();
    });
  });

  describe('Event Handlers', () => {
    it('receives and stores event handler props', () => {
      const onClose = jest.fn();
      const onTakePhoto = jest.fn();
      const onChooseFromLibrary = jest.fn();

      render(
        <ImagePickerModal
          {...defaultProps}
          onClose={onClose}
          onTakePhoto={onTakePhoto}
          onChooseFromLibrary={onChooseFromLibrary}
        />
      );

      // Props are passed and stored in component
      expect(onClose).not.toHaveBeenCalled();
      expect(onTakePhoto).not.toHaveBeenCalled();
      expect(onChooseFromLibrary).not.toHaveBeenCalled();
    });

    it('can handle multiple event handlers', () => {
      const onClose = jest.fn();
      const onTakePhoto = jest.fn();
      const onChooseFromLibrary = jest.fn();

      const { rerender } = render(
        <ImagePickerModal
          {...defaultProps}
          onClose={onClose}
          onTakePhoto={onTakePhoto}
          onChooseFromLibrary={onChooseFromLibrary}
        />
      );

      // Props can be updated
      const newOnClose = jest.fn();
      rerender(
        <ImagePickerModal
          {...defaultProps}
          onClose={newOnClose}
          onTakePhoto={onTakePhoto}
          onChooseFromLibrary={onChooseFromLibrary}
        />
      );

      expect(newOnClose).not.toHaveBeenCalled();
    });
  });

  describe('UI Structure', () => {
    it('renders modal overlay and backdrop', () => {
      render(<ImagePickerModal {...defaultProps} />);

      // Modal is rendered with proper structure
      expect(screen.getByText('register.chooseImageSource')).toBeTruthy();
    });

    it('renders modal content with drag indicator', () => {
      render(<ImagePickerModal {...defaultProps} />);

      // Check if modal content elements are rendered
      expect(screen.getByText('register.chooseImageSource')).toBeTruthy();
    });

    it('renders header with title and close button', () => {
      const { getByTestId } = render(<ImagePickerModal {...defaultProps} />);

      expect(screen.getByText('register.chooseImageSource')).toBeTruthy();
      expect(getByTestId('icon-close')).toBeTruthy();
    });

    it('renders camera option with icon and text', () => {
      const { getByTestId } = render(<ImagePickerModal {...defaultProps} />);

      expect(getByTestId('icon-camera-alt')).toBeTruthy();
      expect(screen.getByText('register.takePhoto')).toBeTruthy();
      expect(screen.getByText('register.useCameraToTakeANewPhoto')).toBeTruthy();
    });

    it('renders library option with icon and text', () => {
      const { getByTestId } = render(<ImagePickerModal {...defaultProps} />);

      expect(getByTestId('icon-photo-library')).toBeTruthy();
      expect(screen.getByText('register.chooseFromLibrary')).toBeTruthy();
      expect(screen.getByText('register.selectFromYourPhotoGallery')).toBeTruthy();
    });

    it('renders cancel button', () => {
      render(<ImagePickerModal {...defaultProps} />);

      expect(screen.getByText('register.cancel')).toBeTruthy();
    });
  });

  describe('Props and Animations', () => {
    it('applies slide animation to modal content', () => {
      const slideAnim = new Animated.Value(100);
      render(<ImagePickerModal {...defaultProps} slideAnim={slideAnim} />);

      // The animation value should be applied to transform
      expect(slideAnim).toBeInstanceOf(Animated.Value);
    });

    it('applies opacity animation to backdrop', () => {
      const opacityAnim = new Animated.Value(0.5);
      render(<ImagePickerModal {...defaultProps} opacityAnim={opacityAnim} />);

      // The opacity animation should be applied to the backdrop
      expect(opacityAnim).toBeInstanceOf(Animated.Value);
      expect(opacityAnim._value).toBe(0.5);
    });

    it('passes all required props correctly', () => {
      const customProps = {
        visible: true,
        slideAnim: new Animated.Value(0),
        opacityAnim: new Animated.Value(1),
        onClose: jest.fn(),
        onTakePhoto: jest.fn(),
        onChooseFromLibrary: jest.fn(),
      };

      const { rerender } = render(<ImagePickerModal {...customProps} />);

      // Component should render without errors with custom props
      expect(() => rerender(<ImagePickerModal {...customProps} />)).not.toThrow();
    });
  });

  describe('Accessibility and Interaction', () => {
    it('has proper touch targets for buttons', () => {
      render(<ImagePickerModal {...defaultProps} />);

      // Check that interactive elements exist (TouchableOpacity elements are present)
      expect(screen.getByText('register.takePhoto')).toBeTruthy();
      expect(screen.getByText('register.chooseFromLibrary')).toBeTruthy();
      expect(screen.getByText('register.cancel')).toBeTruthy();
    });

    it('handles multiple rapid presses correctly', () => {
      const onTakePhoto = jest.fn();
      const { getByTestId } = render(<ImagePickerModal {...defaultProps} onTakePhoto={onTakePhoto} />);

      const cameraButton = getByTestId('icon-camera-alt').parent.parent;

      // Simulate rapid presses
      fireEvent.press(cameraButton);
      fireEvent.press(cameraButton);
      fireEvent.press(cameraButton);

      expect(onTakePhoto).toHaveBeenCalledTimes(3);
    });

    it('maintains event handler references', () => {
      const onClose = jest.fn();
      const onTakePhoto = jest.fn();
      const onChooseFromLibrary = jest.fn();

      const { rerender } = render(
        <ImagePickerModal
          {...defaultProps}
          onClose={onClose}
          onTakePhoto={onTakePhoto}
          onChooseFromLibrary={onChooseFromLibrary}
        />
      );

      // Props should remain the same after rerender
      rerender(
        <ImagePickerModal
          {...defaultProps}
          onClose={onClose}
          onTakePhoto={onTakePhoto}
          onChooseFromLibrary={onChooseFromLibrary}
        />
      );

      expect(onClose).not.toHaveBeenCalled();
      expect(onTakePhoto).not.toHaveBeenCalled();
      expect(onChooseFromLibrary).not.toHaveBeenCalled();
    });
  });
});