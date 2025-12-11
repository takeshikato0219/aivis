module.exports = {
  preset: 'react-native',

  testMatch: ['<rootDir>/__tests__/**/*.test.ts', '<rootDir>/__tests__/**/*.test.tsx'],

  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],

  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-redux|@reduxjs|@react-native-community|@react-native-async-storage)/)',
  ],

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@navigation/(.*)$': '<rootDir>/src/navigation/$1',
    '^@redux/(.*)$': '<rootDir>/src/redux/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@test-helpers/(. *)$': '<rootDir>/__tests__/helpers/$1',
  },

  // ============================================
  // Module directories
  // ============================================
  modulePaths: ['<rootDir>'],
  moduleDirectories: ['node_modules', 'src'],

  // ============================================
  // Coverage
  // ============================================
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.styles.{ts,tsx}', '!src/**/index.{ts,tsx}'],

  verbose: true,
  clearMocks: true,
};
