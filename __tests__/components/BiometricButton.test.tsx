import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { BiometricButton } from '@components/BiometricButton/BiometricButton';

// Mock useResponsive hook
jest.mock('@hooks/useResponsive', () => ({
  useResponsive: jest.fn(),
}));

describe('BiometricButton', () => {
  it('renders loading state correctly', () => {
    const { getByText, getByTestId } = render(<BiometricButton isLoading={true} />);

    expect(getByTestId('ActivityIndicator')).toBeTruthy();
    expect(getByText('Checking biometric...')).toBeTruthy();
  });

  it('renders button with icon and handles press', () => {
    const { useResponsive } = require('@hooks/useResponsive');
    useResponsive.mockReturnValue({ isTablet: false });

    const mockOnPress = jest.fn();
    const { getByTestId } = render(<BiometricButton iconName="check" onPress={mockOnPress} />);

    const button = getByTestId('Pressable');
    fireEvent.press(button);

    expect(mockOnPress).toHaveBeenCalled();
  });

  it('disables button when disabled prop is true', () => {
    const { useResponsive } = require('@hooks/useResponsive');
    useResponsive.mockReturnValue({ isTablet: false });

    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <BiometricButton iconName="check" onPress={mockOnPress} disabled={true} />
    );

    const button = getByTestId('Pressable');
    fireEvent.press(button);

    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('renders with phone styling', () => {
    const { useResponsive } = require('@hooks/useResponsive');
    useResponsive.mockReturnValue({ isTablet: false });

    const { getByTestId } = render(<BiometricButton iconName="check" onPress={jest.fn()} />);
    expect(getByTestId('Pressable')).toBeTruthy();
  });

  it('renders with tablet styling', () => {
    const { useResponsive } = require('@hooks/useResponsive');
    useResponsive.mockReturnValue({ isTablet: true });

    const { getByTestId } = render(<BiometricButton iconName="check" onPress={jest.fn()} />);
    expect(getByTestId('Pressable')).toBeTruthy();
  });
});
