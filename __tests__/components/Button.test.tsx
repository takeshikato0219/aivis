// __tests__/components/Button.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../../src/components/Button/Button';

describe('Button', () => {
  it('renders with title', () => {
    const { getByText } = render(<Button title="My Button" onPress={() => {}} />);
    expect(getByText('My Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Press Me" onPress={onPress} />);
    fireEvent.press(getByText('Press Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button title="Disabled" onPress={onPress} disabled />);
    fireEvent.press(getByText('Disabled'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows loading indicator when loading', () => {
    const { getByRole } = render(<Button title="Loading" onPress={() => {}} loading />);
    expect(getByRole('progressbar')).toBeTruthy();
  });

  it('renders with icon if provided', () => {
    const { getByTestId } = render(<Button title="With Icon" onPress={() => {}} icon="plus" />);
    expect(getByTestId('button-icon-container')).toBeTruthy();
  });
});
