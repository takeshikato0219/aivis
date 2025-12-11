/* eslint-env jest */
import '@testing-library/jest-native/extend-expect';

// ============================================
// GLOBAL TEST SETUP
// ============================================

beforeAll(() => {
  console.log('🧪 Starting test suite...');
});

afterAll(() => {
  console.log('✅ Test suite completed');
});

// ============================================
// CUSTOM MATCHERS (optional)
// ============================================

expect.extend({
  toBeValidEmail(received: string) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid email`
          : `expected ${received} to be a valid email`,
    };
  },
});

// TypeScript declaration
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidEmail(): R;
    }
  }
}
