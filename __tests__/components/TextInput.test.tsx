import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import TextInput from '../../src/components/TextInput/TextInput';

describe('TextInput', () => {
  it('renders with label and value', () => {
    const { getAllByText, getByDisplayValue } = render(
      <TextInput label="Test Label" value="Test Value" onChangeText={() => {}} />
    );
    expect(getAllByText('Test Label').length).toBeGreaterThan(0);
    expect(getByDisplayValue('Test Value')).toBeTruthy();
  });

  it('calls onChangeText when input changes', () => {
    const onChangeText = jest.fn();
    const { getByDisplayValue } = render(
      <TextInput label="Email" value="abc" onChangeText={onChangeText} />
    );
    fireEvent.changeText(getByDisplayValue('abc'), 'def');
    expect(onChangeText).toHaveBeenCalledWith('def');
  });

  it('shows left icon when icon prop is provided', () => {
    const { getByTestId } = render(
      <TextInput label="Icon" value="" onChangeText={() => {}} icon="email" />
    );
    expect(getByTestId('left-icon-adornment')).toBeTruthy();
  });

  it('shows right icon when rightIcon prop is provided', () => {
    const { getByTestId } = render(
      <TextInput label="RightIcon" value="" onChangeText={() => {}} rightIcon="close" />
    );
    expect(getByTestId('right-icon-adornment')).toBeTruthy();
  });

  it('toggles secureTextEntry icon', () => {
    const { getByTestId } = render(
      <TextInput label="Password" value="" onChangeText={() => {}} secureTextEntry />
    );
    const icon = getByTestId('right-icon-adornment');
    fireEvent.press(icon);
    expect(icon).toBeTruthy();
  });
});
