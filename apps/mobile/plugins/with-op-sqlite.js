/**
 * Expo config plugin for @op-engineering/op-sqlite.
 *
 * op-sqlite v11 ships no app.plugin.js. This minimal plugin sets the
 * Android gradle property that enables the SQLCipher build variant.
 *
 * Usage in app.json:
 *   "plugins": [["./plugins/with-op-sqlite", { "sqlcipher": true }]]
 */
const { withGradleProperties } = require('@expo/config-plugins');

/**
 * @param {import('@expo/config-plugins').ExpoConfig} config
 * @param {{ sqlcipher?: boolean }} options
 */
function withOpSqlite(config, options = {}) {
  const { sqlcipher = false } = options;

  return withGradleProperties(config, (cfg) => {
    const props = cfg.modResults;

    // Remove any existing op-sqlite property before adding the new value
    const filtered = props.filter(
      (item) => !(item.type === 'property' && item.key === 'OP_SQLITE_SQLCIPHER'),
    );

    if (sqlcipher) {
      filtered.push({ type: 'property', key: 'OP_SQLITE_SQLCIPHER', value: 'true' });
    }

    cfg.modResults = filtered;
    return cfg;
  });
}

module.exports = withOpSqlite;
