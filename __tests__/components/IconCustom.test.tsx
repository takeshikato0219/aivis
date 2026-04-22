import React from 'react';
import { View } from 'react-native';
import { render } from '@testing-library/react-native';

const createSvgMock = (testID: string) => {
  const Mock = () => <View testID={testID} />;
  Mock.displayName = `${testID}-svg`;
  return {
    __esModule: true,
    default: Mock,
  };
};

/**
 * Mock SVG assets
 */
jest.mock('@assets/svg/mail.svg', () => createSvgMock('mail-icon'));

jest.mock('@assets/svg/lock.svg', () => createSvgMock('lock-icon'));

jest.mock('@assets/svg/phone.svg', () => createSvgMock('phone-icon'));

/**
 * Import component sau khi mock
 */
import {
  EmailOutlineIcon,
  LockOutlineIcon,
  PhoneOutlineIcon,
} from '../../src/components/IconCustom/IconCustom';

describe('IconCustom', () => {
  it('renders EmailOutlineIcon', () => {
    const { getByTestId } = render(<EmailOutlineIcon />);
    expect(getByTestId('mail-icon')).toBeTruthy();
  });

  it('renders LockOutlineIcon', () => {
    const { getByTestId } = render(<LockOutlineIcon />);
    expect(getByTestId('lock-icon')).toBeTruthy();
  });

  it('renders PhoneOutlineIcon', () => {
    const { getByTestId } = render(<PhoneOutlineIcon />);
    expect(getByTestId('phone-icon')).toBeTruthy();
  });
});
