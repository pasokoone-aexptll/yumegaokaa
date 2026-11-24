module.exports = function (api) {
  const android = api.caller(caller => caller?.platform === 'android');
  return { presets: ['babel-preset-expo'], plugins: android ? ['./scripts/android-typography-babel.cjs'] : [] };
};
