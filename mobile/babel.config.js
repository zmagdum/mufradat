module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Load .env file for native builds (iOS/Android)
      // This plugin inlines environment variables at build time
      // Must be first to ensure env vars are available to other plugins
      [
        'inline-dotenv',
        {
          path: '.env',
          systemVar: 'overwrite', // Use .env file values over system env vars
          silent: false, // Show warnings if .env file is missing
          unsafe: false, // Don't allow unsafe variable names
        },
      ],
      [
        'module-resolver',
        {
          root: ['./src'],
          extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
          alias: {
            '@components': './src/components',
            '@screens': './src/screens',
            '@navigation': './src/navigation',
            '@services': './src/services',
            '@store': './src/store',
            '@utils': './src/utils',
            '@types': './src/types',
            '@assets': './src/assets',
            '@shared': '../shared',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
