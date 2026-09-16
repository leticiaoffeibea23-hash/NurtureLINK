import { drain, acknowledge } from './outbox';
import { getToken, getRefreshToken, storeTokens, clearSession } from '../auth/session';
import { useAppStore } from '../store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8181';

/** Attempt to exchange the stored refresh token for a new access token. */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const { accessToken } = (await res.json()) as { accessToken: string };
    // Persist the new access token (keep the same refresh token)
    await storeTokens(accessToken, refreshToken);
    return accessToken;
  } catch {
    return null;
  }
}

/** Fire the push request with the given token. */
async function doPush(
  mutations: Awaited<ReturnType<typeof drain>>,
  token: string | null,
): Promise<Response> {
  return fetch(`${API_URL}/sync/push`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ mutations }),
  });
}

/**
 * Push all queued outbox mutations to the server.
 *
 * - 401 (first attempt): tries to refresh the access token and retries once.
 * - 401 (after refresh): clears session and surfaces re-login prompt via Zustand.
 * - 5xx / network error: throws so the orchestrator can log and back off.
 */
export async function pushMutations(): Promise<void> {
  const mutations = await drain();
  if (mutations.length === 0) return;

  const token = await getToken();
  let res = await doPush(mutations, token);

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      // Refresh failed — force re-login via Zustand flag
      await clearSession().catch(() => {});
      useAppStore.getState().setSessionExpired(true);
      console.warn('[Push] 401 + refresh failed — session cleared, re-login required');
      return;
    }
    // Retry once with the fresh access token
    res = await doPush(mutations, newToken);
    if (res.status === 401) {
      await clearSession().catch(() => {});
      useAppStore.getState().setSessionExpired(true);
      console.warn('[Push] 401 on retry — session cleared, re-login required');
      return;
    }
  }

  if (!res.ok) {
    throw new Error(`Push failed: ${res.status}`);
  }

  const { accepted } = (await res.json()) as { accepted: string[]; errors: unknown[] };
  await acknowledge(accepted);

  console.log(`[Push] Accepted ${accepted.length}/${mutations.length} mutations`);
}
