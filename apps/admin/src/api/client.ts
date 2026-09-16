const BASE = '/api';

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Request failed');
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('text/csv')) return res.text() as unknown as T;
  return res.json() as Promise<T>;
}

export const adminApi = {
  get:    <T>(path: string)                => request<T>('GET',    path),
  post:   <T>(path: string, body?: unknown) => request<T>('POST',   path, body),
  put:    <T>(path: string, body?: unknown) => request<T>('PUT',    path, body),
  delete: <T>(path: string)                => request<T>('DELETE',  path),
};

export function getStoredUser(): { role: string; name: string } | null {
  try {
    const raw = localStorage.getItem('admin_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('admin_user');
}
