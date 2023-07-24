module.exports = {
  project: {
    android: {
      unstable_reactLegacyComponentNames: ['RNVVideo'],
    },
    ios: {
      unstable_reactLegacyComponentNames: ['RNVVideo'],
    },
  },

  dependencies: {
    'react-native-video': {
      platforms: {
        android: {
          sourceDir: '../node_modules/react-native-video/android-exoplayer',
        },
      },
    },
  },
};
