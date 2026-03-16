const { withInfoPlist } = require('@expo/config-plugins');

/**
 * Removes UISupportedInterfaceOrientations~ipad from Info.plist.
 * Needed because Expo adds this key even when supportsTablet: false.
 * See: https://github.com/expo/expo/issues/32344
 */
module.exports = function removeIpadOrientations(config) {
  return withInfoPlist(config, (config) => {
    delete config.modResults['UISupportedInterfaceOrientations~ipad'];
    return config;
  });
};
