module.exports = {
  root: true,
  extends: ['@react-native', 'plugin:prettier/recommended'],
  plugins: ['prettier'],
  rules: {
    'prettier/prettier': 'warn',
    'react-native/no-inline-styles': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'no-void': ['error', { allowAsStatement: true }],
  },
  ignorePatterns: [
    'node_modules/',
    'android/',
    'ios/',
    'coverage/',
    '.metro/',
    'dist/',
    'build/',
    '*. log',
    'junit.xml',
  ],
};
