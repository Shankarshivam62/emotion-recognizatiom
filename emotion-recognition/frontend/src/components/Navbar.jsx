/**
 * src/components/Navbar.jsx
 * ──────────────────────────
 * Responsive top navigation bar.
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location         = useLocation();
  const navigate         = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const links   = [
    { to: '/dashboard', label: '🏠 Dashboard' },
    { to: '/detect',    label: '🎥 Detect'    },
    { to: '/history',   label: '📋 History'   },
    ...(isAdmin ? [{ to: '/admin', label: '⚙️ Admin' }] : []),
  ];

  return (
    <nav style={styles.nav}>
      <div style={styles.inner}>
        {/* Logo */}
        <Link to="/dashboard" style={styles.logo}>
          <div style={styles.logoIcon}>ES</div>
          <span style={styles.logoText}>EmotiSense</span>
        </Link>

        {/* Desktop links */}
        <div style={styles.links}>
          {links.map(l => (
            <Link key={l.to} to={l.to} style={{
              ...styles.link,
              ...(location.pathname === l.to ? styles.linkActive : {})
            }}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* User menu */}
        <div style={styles.userMenu}>
          <div style={styles.avatar} onClick={() => setMenuOpen(o => !o)}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          {menuOpen && (
            <div style={styles.dropdown}>
              <div style={styles.dropName}>{user?.name}</div>
              <div style={styles.dropEmail}>{user?.email}</div>
              <hr style={styles.divider} />
              {links.map(l => (
                <Link key={l.to} to={l.to} style={styles.dropLink}
                  onClick={() => setMenuOpen(false)}>
                  {l.label}
                </Link>
              ))}
              <hr style={styles.divider} />
              <button onClick={handleLogout} style={styles.logoutBtn}>
                🚪 Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    background: 'rgba(13,13,26,0.95)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    position: 'sticky', top: 0, zIndex: 1000,
  },
  inner: {
    maxWidth: 1300, margin: '0 auto', padding: '0 24px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: 64,
  },
  logo:     { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: 'linear-gradient(135deg, #6C63FF, #00D2FF)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 800, color: '#fff',
  },
  logoText: { color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: -0.5 },
  links:    { display: 'flex', gap: 4 },
  link: {
    color: '#888', textDecoration: 'none', padding: '8px 14px',
    borderRadius: 10, fontSize: 14, fontWeight: 500, transition: 'all 0.2s',
  },
  linkActive: { color: '#a89fff', background: 'rgba(108,99,255,0.15)' },
  userMenu:   { position: 'relative' },
  avatar: {
    width: 38, height: 38, borderRadius: '50%',
    background: 'linear-gradient(135deg, #6C63FF, #00D2FF)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
  },
  dropdown: {
    position: 'absolute', right: 0, top: 48,
    background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 16, padding: '16px 0', minWidth: 200,
    boxShadow: '0 24px 60px rgba(0,0,0,0.6)', zIndex: 999,
  },
  dropName:   { color: '#fff', fontWeight: 700, fontSize: 14, padding: '0 16px 2px' },
  dropEmail:  { color: '#666', fontSize: 12, padding: '0 16px 8px' },
  divider:    { border: 'none', borderTop: '1px solid rgba(255,255,255,0.07)', margin: '8px 0' },
  dropLink:   {
    display: 'block', color: '#aaa', textDecoration: 'none',
    padding: '9px 16px', fontSize: 14, transition: 'background 0.15s',
  },
  logoutBtn: {
    width: '100%', background: 'none', border: 'none',
    color: '#EF5350', padding: '10px 16px', textAlign: 'left',
    fontSize: 14, cursor: 'pointer', fontWeight: 600,
  },
};
