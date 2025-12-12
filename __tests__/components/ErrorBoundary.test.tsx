import React from 'react';
import { render } from '@testing-library/react-native';
import ErrorBoundary from '../../src/components/ErrorBoundary/ErrorBoundary';
import { Text } from 'react-native';

beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Hello</Text>
      </ErrorBoundary>
    );
    expect(getByText('Hello')).toBeTruthy();
  });
});
