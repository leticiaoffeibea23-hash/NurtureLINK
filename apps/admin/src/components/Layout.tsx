import React from 'react';
import { NavLink } from 'react-router-dom';
import { getStoredUser } from '../api/client';

const NAV = [
  { to: '/foods',    label: 'Food Composition' },
  { to: '/seasonal', label: 'Seasonal Matrix' },
  { to: '/voice',    label: 'Voice Studio' },
  { to: '/clinical', label: 'Clinical Rules' },
  { to: '/export',   label: 'DHIMS2 Export' },
];

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export function Layout({ children, onLogout }: LayoutProps) {
  const user = getStoredUser();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <nav style={{ width: 220, background: '#08283B', padding: '24px 0', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 20px 24px', color: '#fff', fontWeight: 700, fontSize: 18 }}>
          NurtureLink Admin
        </div>

        <div style={{ flex: 1 }}>
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'block',
                padding: '12px 20px',
                color: isActive ? '#fff' : '#92C9F9',
                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 400,
                fontSize: 14,
              })}
            >
              {label}
            </NavLink>
          ))}
        </div>

        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {user && (
            <div style={{ color: '#92C9F9', fontSize: 12, marginBottom: 10 }}>
              <div style={{ fontWeight: 600, color: '#fff', marginBottom: 2 }}>{user.name}</div>
              <div style={{ textTransform: 'capitalize' }}>{user.role.replace(/_/g, ' ')}</div>
            </div>
          )}
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'rgba(255,255,255,0.1)',
              color: '#92C9F9',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 5,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Sign out
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, padding: 32, background: '#f5f5f5' }}>{children}</main>
    </div>
  );
}
