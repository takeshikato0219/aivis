module.exports = {
  preset: 'react-native',

  // ============================================
  // Test matching
  // ============================================
  testMatch: ['<rootDir>/__tests__/**/*.test. ts', '<rootDir>/__tests__/**/*.test.tsx'],

  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],

  // ============================================
  // Setup
  // ============================================
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // ============================================
  // Transform ignore patterns - FOR JEST 29
  // ============================================
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|@react-native-community|@react-native-async-storage|react-redux|@reduxjs)/)',
  ],

  // ============================================
  // Module name mapper
  // ============================================
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@navigation/(.*)$': '<rootDir>/src/navigation/$1',
    '^@redux/(. *)$': '<rootDir>/src/redux/$1',
    '^@constants/(.*)$': '<rootDir>/src/constants/$1',
    '^@styles/(.*)$': '<rootDir>/src/styles/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@providers/(.*)$': '<rootDir>/src/providers/$1',
    '^@i18n/(.*)$': '<rootDir>/src/i18n/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@locales/(. *)$': '<rootDir>/src/locales/$1',
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
  collectCoverage: false,

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.styles.{ts,tsx}',
    '!src/**/index.{ts,tsx}',
    '!src/**/*. d.ts',
    '!src/**/__tests__/**',
  ],

  coverageDirectory: 'coverage',

  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'cobertura', 'json-summary'],

  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // ============================================
  // Reporters
  // ============================================
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: '. /',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],

  // ============================================
  // Other options
  // ============================================
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 10000,

  // ============================================
  // For Jest 29 - Fix for workers
  // ============================================
  maxWorkers: '50%',
};
