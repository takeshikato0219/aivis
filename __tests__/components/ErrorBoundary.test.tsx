// typescript
// File: `__tests__/components/ErrorBoundary.test.tsx`
import React from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

jest.mock('../../src/utils/errorHandler', () => ({
  __esModule: true,
  default: { handleApiError: jest.fn() },
}));

import ErrorHandler from '../../src/utils/errorHandler';

let ErrorBoundary: any;
beforeAll(() => {
  const mod = require('../../src/components/ErrorBoundary/ErrorBoundary');
  ErrorBoundary = mod.default ?? mod.ErrorBoundary ?? mod;
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ErrorBoundary internals and UI', () => {
  it('getDerivedStateFromError sets hasError true', () => {
    const result = (ErrorBoundary as any).getDerivedStateFromError(new Error('boom'));
    expect(result).toEqual({ hasError: true });
  });

  it('componentDidCatch calls ErrorHandler.handleApiError and onError when invoked', () => {
    const onError = jest.fn();
    const instance = new (ErrorBoundary as any)({ children: null, onError });
    const err = new Error('uh-oh');
    const info = { componentStack: 'stack' };

    (ErrorBoundary as any).prototype.componentDidCatch.call(instance, err, info);

    expect(ErrorHandler.handleApiError as jest.Mock).toHaveBeenCalledWith(err, 'ErrorBoundary');
    expect(onError).toHaveBeenCalledWith(err, info);
  });

  it('handleReset calls setState to clear error', () => {
    const instance = new (ErrorBoundary as any)({ children: null });
    instance.setState = jest.fn();
    (instance as any).handleReset();
    expect(instance.setState).toHaveBeenCalledWith({ hasError: false });
  });

  it('renders children when no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>OK</Text>
      </ErrorBoundary>
    );
    expect(getByText('OK')).toBeTruthy();
  });
});
