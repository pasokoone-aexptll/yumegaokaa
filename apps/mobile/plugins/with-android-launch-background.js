// Match the starting window to the first map frame before React mounts.
const { withAndroidStyles } = require("expo/config-plugins");
module.exports = config => withAndroidStyles(config, mod => {
  for (const style of mod.modResults.resources.style ?? []) {
    if (!["AppTheme", "Theme.App.SplashScreen"].includes(style.$.name)) continue;
    for (const attr of ["android:windowBackground", "android:windowSplashScreenBackground"]) {
      style.item = (style.item ?? []).filter(item => item.$.name !== attr);
      style.item.push({ $: { name: attr }, _: "#303947" });
    }
  }
  return mod;
});
