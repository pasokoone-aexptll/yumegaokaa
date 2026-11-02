// Apple Maps adapter is iOS-only. Android continues to use MapLibre.
module.exports = {
  dependencies: {
    "react-native-maps": { platforms: { android: null } },
  },
};
