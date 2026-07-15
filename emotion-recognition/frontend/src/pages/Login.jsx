/**
 * src/pages/Login.jsx
 * ────────────────────
 * Login page with animated entrance and form validation.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login }    = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = e =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Background circles */}
      <div style={styles.circle1} />
      <div style={styles.circle2} />

      <div style={styles.card}>
        {/* Brand header */}
        <div style={styles.brand}>
          <div style={styles.logo}>ES</div>
          <h1 style={styles.title}>EmotiSense</h1>
          <p style={styles.subtitle}>AI-powered Emotion Recognition</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              style={styles.input}
              autoComplete="email"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              style={styles.input}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={styles.link}>Create one free</Link>
        </p>

        {/* Demo hint */}
        <div style={styles.demo}>
          <strong>Demo:</strong> demo@emotisense.com / Demo@123
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Segoe UI', sans-serif",
  },
  circle1: {
    position: 'absolute', width: 400, height: 400, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(100,80,255,0.25) 0%, transparent 70%)',
    top: -100, left: -100, pointerEvents: 'none',
  },
  circle2: {
    position: 'absolute', width: 500, height: 500, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,200,255,0.15) 0%, transparent 70%)',
    bottom: -150, right: -150, pointerEvents: 'none',
  },
  card: {
    background: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 24,
    padding: '48px 40px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
    color: '#fff',
    zIndex: 1,
  },
  brand: { textAlign: 'center', marginBottom: 36 },
  logo: {
    width: 64, height: 64, borderRadius: 20,
    background: 'linear-gradient(135deg, #6C63FF, #00D2FF)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 22, fontWeight: 800, color: '#fff',
    margin: '0 auto 16px',
    boxShadow: '0 8px 32px rgba(108,99,255,0.5)',
  },
  title:    { margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: -1 },
  subtitle: { margin: '6px 0 0', fontSize: 14, opacity: 0.6 },
  form:     { display: 'flex', flexDirection: 'column', gap: 20 },
  field:    { display: 'flex', flexDirection: 'column', gap: 8 },
  label:    { fontSize: 13, fontWeight: 600, opacity: 0.8, letterSpacing: 0.5 },
  input: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: '14px 18px',
    color: '#fff',
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  btn: {
    background: 'linear-gradient(135deg, #6C63FF, #00D2FF)',
    border: 'none',
    borderRadius: 12,
    padding: '16px',
    color: '#fff',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: 8,
    letterSpacing: 0.5,
    transition: 'transform 0.15s',
  },
  footer: { textAlign: 'center', marginTop: 28, fontSize: 14, opacity: 0.7 },
  link:   { color: '#00D2FF', textDecoration: 'none', fontWeight: 600 },
  demo: {
    marginTop: 20,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  }
};
