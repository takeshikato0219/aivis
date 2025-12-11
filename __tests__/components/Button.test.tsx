import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, TouchableOpacity } from 'react-native';

const Button = ({ title, onPress, disabled }: any) => (
  <TouchableOpacity onPress={onPress} disabled={disabled}>
    <Text>{title}</Text>
  </TouchableOpacity>
);

describe('Button Component', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Button title="Test Button" onPress={() => {}} />);
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<Button title="Click Me" onPress={mockOnPress} />);
    fireEvent.press(getByText('Click Me'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(<Button title="Disabled" onPress={mockOnPress} disabled />);
    fireEvent.press(getByText('Disabled'));
    expect(mockOnPress).not.toHaveBeenCalled();
  });
});
