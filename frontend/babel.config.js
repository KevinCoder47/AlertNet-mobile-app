module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module:react-native-dotenv',
        {
          moduleName: '@env',
          path: '.env',
          blocklist: null,
          allowlist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
      '@babel/plugin-transform-export-namespace-from', 
      // Remove the line: 'react-native-worklets/plugin',
      'react-native-reanimated/plugin', // Make sure this is last
    ],
  };
};