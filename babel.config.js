module.exports = {
  presets: ['@react-native/babel-preset', '@babel/preset-typescript'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: [
          '.ios.ts',
          '.android.ts',
          '. ts',
          '.ios.tsx',
          '.android.tsx',
          '.tsx',
          '. jsx',
          '.js',
          '.json',
        ],
        alias: {
          '@': './src',
          '@api': './src/api',
          '@components': './src/components',
          '@screens': './src/screens',
          '@utils': './src/utils',
          '@hooks': './src/hooks',
          '@navigation': './src/navigation',
          '@redux': './src/redux',
          '@constants': './src/constants',
          '@styles': './src/styles',
          '@types': './src/types',
          '@i18n': './src/i18n',
          '@locales': './src/locales',
        },
      },
    ],
    'react-native-paper/babel',
  ],
};
