const { withXcodeProject } = require("expo/config-plugins");

/**
 * Ensures ALL targets in the Xcode project have TARGETED_DEVICE_FAMILY = 1 (iPhone only).
 * Must be listed BEFORE expo-share-intent in the plugins array so it runs AFTER
 * expo-share-intent's withXcodeProject mod (Expo mods registered first run last).
 * Fixes expo-share-intent hardcoding "1,2" on the ShareExtension target.
 */
const withIphoneOnly = (config) => {
  return withXcodeProject(config, async (config) => {
    const project = config.modResults;
    const configurations = project.pbxXCBuildConfigurationSection();

    for (const [, entry] of Object.entries(configurations || {})) {
      if (typeof entry === "string") continue;
      const buildSettings = entry?.buildSettings;
      if (buildSettings?.TARGETED_DEVICE_FAMILY) {
        buildSettings.TARGETED_DEVICE_FAMILY = "1";
      }
    }

    return config;
  });
};

module.exports = withIphoneOnly;
