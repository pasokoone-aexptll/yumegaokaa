const { withEntitlementsPlist } = require("expo/config-plugins");
// Clear any entitlement left by an earlier NFC-enabled prebuild as well.
module.exports = (config) =>
  withEntitlementsPlist(config, (config) => {
    delete config.modResults["com.apple.developer.nfc.readersession.formats"];
    return config;
  });
