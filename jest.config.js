module.exports = {
  preset: 'react-native',

  testMatch: ['<rootDir>/__tests__/**/*.test.ts', '<rootDir>/__tests__/**/*.test.tsx'],

  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],

  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|@reduxjs/toolkit|immer|react-native-vector-icons|react-native|react-native-paper|@react-navigation|@react-native-community|@react-native-async-storage|react-redux|@reduxjs)/)',
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
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@providers/(.*)$': '<rootDir>/src/providers/$1',
    '^@i18n/(.*)$': '<rootDir>/src/i18n/$1',
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@locales/(.*)$': '<rootDir>/src/locales/$1',
    '^@test-helpers/(.*)$': '<rootDir>/__tests__/helpers/$1',
  },

  modulePaths: ['<rootDir>'],
  moduleDirectories: ['node_modules', 'src'],

  collectCoverage: false,

  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.styles.{ts,tsx}',
    '!src/**/index.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/constants/materialTheme.ts',
    // Exclude test & styles
    '!src/**/*.test.ts',
    '!src/**/*.test.tsx',
    '!src/**/*.styles.ts',
    '!src/**/*.styles.tsx',

    // Exclude types
    '!src/types/**',

    // Exclude __tests__
    '!src/**/__tests__/**',

    // Exclude folders you do NOT test
    '!src/navigation/**',
    '!src/screens/**',
    '!src/providers/**',
    '!src/styles/**',
  ],

  coverageDirectory: 'coverage',

  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'cobertura', 'json-summary'],

  coverageThreshold: {
    global: {
      branches: 40,
      functions: 40,
      lines: 40,
      statements: 40,
    },
  },

  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
  ],

  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 10000,

  maxWorkers: '50%',
};
