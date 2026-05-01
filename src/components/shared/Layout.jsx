// src/components/shared/Layout.jsx
import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logoutUser } from '../../services/authService';
import { Avatar } from './UI';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/dashboard', icon: '⬡', label: 'Dashboard' },
  { to: '/projects',  icon: '◈', label: 'Projects'  },
  { to: '/tasks',     icon: '◻', label: 'My Tasks'  },
  { to: '/team',      icon: '◎', label: 'Team'      },
];

const Layout = ({ children }) => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logoutUser();
    toast.success('Signed out');
    navigate('/auth');
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <nav className="sidebar">
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, background: 'var(--accent)',
              borderRadius: 8, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff',
            }}>PF</div>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>ProjectFlow</span>
          </div>
        </div>

        <div style={{ padding: '12px 8px', flex: 1 }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 2,
              textDecoration: 'none', fontSize: 14, fontWeight: 500,
              color: isActive ? 'var(--accent2)' : 'var(--text2)',
              background: isActive ? 'var(--accent-bg)' : 'transparent',
              transition: 'all 0.15s',
            })}>
              <span style={{ fontSize: 14, opacity: 0.8 }}>{icon}</span>
              {label}
            </NavLink>
          ))}

          {profile?.role === 'admin' && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.08em', padding: '0 12px', marginBottom: 6 }}>
                ADMIN
              </div>
              <NavLink to="/admin" style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8,
                textDecoration: 'none', fontSize: 14, fontWeight: 500,
                color: isActive ? 'var(--accent2)' : 'var(--text2)',
                background: isActive ? 'var(--accent-bg)' : 'transparent',
              })}>
                <span style={{ fontSize: 14 }}>⚙</span> Settings
              </NavLink>
            </div>
          )}
        </div>

        {/* User footer */}
        <div style={{ padding: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--surface2)' }}>
            <Avatar name={profile?.name || '?'} size={30} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, truncate: true, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {profile?.name}
              </div>
              <div style={{ fontSize: 10, color: 'var(--accent2)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {profile?.role}
              </div>
            </div>
            <button onClick={handleLogout} disabled={loggingOut}
              title="Sign out"
              style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 16, padding: 4 }}>
              ⎋
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="main">
        <div className="content">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
