import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'nl_access_token';
const REFRESH_TOKEN_KEY = 'nl_refresh_token';
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/** Store both tokens after a successful login. */
export async function storeTokens(accessToken: string, refreshToken: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken, SECURE_OPTIONS),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken, SECURE_OPTIONS),
  ]);
}

/**
 * Store a demo placeholder token (offline / fallback mode).
 * The sync layer will get a 401 from the server and skip gracefully.
 */
export async function storeSession(role: string): Promise<void> {
  const demo = `demo.${role}.${Date.now()}`;
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, demo, SECURE_OPTIONS);
}

/** Remove both tokens on logout or forced sign-out. */
export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
  ]);
}

/** Read the current access token (null if not logged in). */
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

/** Read the current refresh token (null if not logged in). */
export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}
