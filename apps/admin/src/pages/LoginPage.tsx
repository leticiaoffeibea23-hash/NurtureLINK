import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || pin.length !== 4) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), pin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Login failed');

      const { accessToken, user } = data as {
        accessToken: string;
        user: { firstName: string; lastName: string; role: string };
      };

      // Only admin roles can access this back-office.
      if (!['system_admin', 'district_admin', 'nutrition_officer'].includes(user.role)) {
        throw new Error('This account does not have admin access.');
      }

      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('admin_user', JSON.stringify({
        role: user.role,
        name: `${user.firstName} ${user.lastName}`,
      }));
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>NurtureLink</div>
        <div style={s.sub}>District Nutrition Back-Office</div>

        <form onSubmit={handleSubmit} style={{ marginTop: 28 }}>
          <div style={s.field}>
            <label style={s.label}>Phone number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+233 XX XXX XXXX"
              style={s.input}
              required
              autoComplete="username"
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>PIN (4 digits)</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="• • • •"
              style={s.input}
              maxLength={4}
              inputMode="numeric"
              required
              autoComplete="current-password"
            />
          </div>

          {error && <p style={s.error}>{error}</p>}

          <button
            type="submit"
            disabled={loading || pin.length !== 4 || !phone}
            style={{
              ...s.btn,
              opacity: loading || pin.length !== 4 || !phone ? 0.6 : 1,
              cursor: loading || pin.length !== 4 || !phone ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={s.hint}>
          Only accounts with <em>nutrition_officer</em>, <em>district_admin</em>, or{' '}
          <em>system_admin</em> roles can access this portal.
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    background: '#f5f5f5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'sans-serif',
  } as const,
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '40px 36px',
    width: 360,
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
  } as const,
  logo: {
    fontSize: 26,
    fontWeight: 800,
    color: '#08283B',
    letterSpacing: '-0.5px',
  } as const,
  sub: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 4,
  } as const,
  field: { marginBottom: 18 } as const,
  label: {
    display: 'block',
    fontWeight: 600,
    fontSize: 13,
    color: '#374151',
    marginBottom: 6,
  } as const,
  input: {
    width: '100%',
    padding: '11px 14px',
    border: '1px solid #d1d5db',
    borderRadius: 7,
    fontSize: 15,
    boxSizing: 'border-box' as const,
    outline: 'none',
  } as const,
  btn: {
    width: '100%',
    padding: '13px',
    background: '#08283B',
    color: '#fff',
    border: 'none',
    borderRadius: 7,
    fontWeight: 700,
    fontSize: 15,
    marginTop: 4,
  } as const,
  error: {
    color: '#b91c1c',
    fontSize: 13,
    marginBottom: 12,
    marginTop: -4,
  } as const,
  hint: {
    marginTop: 24,
    fontSize: 12,
    color: '#9ca3af',
    lineHeight: 1.6,
    textAlign: 'center' as const,
  } as const,
};
