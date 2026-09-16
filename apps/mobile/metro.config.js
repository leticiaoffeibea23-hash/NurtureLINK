const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Disable the package exports resolver so Metro falls back to each package's
// `main` field instead of the `exports` field. Several packages (lucide-react-native,
// uuid) expose ESM-only "browser"/"default" exports that use `import.meta`, which
// Metro's classic-script web output cannot handle. Their `main` fields point to
// CJS builds that work fine. Expo packages use .web.js file extensions for
// platform splitting, which works independently of this setting.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
