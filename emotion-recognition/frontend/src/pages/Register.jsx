/**
 * src/pages/Register.jsx
 * ───────────────────────
 * Registration form with real-time validation feedback.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { register } = useAuth();
  const navigate      = useNavigate();
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = e =>
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill in all fields'); return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters'); return;
    }
    if (form.password !== form.confirm) {
      toast.error('Passwords do not match'); return;
    }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome to EmotiSense 🎉');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const strength = form.password.length === 0 ? 0
    : form.password.length < 6  ? 1
    : form.password.length < 10 ? 2 : 3;

  const strengthColors = ['transparent', '#EF5350', '#FF9800', '#66BB6A'];
  const strengthLabels = ['', 'Weak', 'Medium', 'Strong'];

  return (
    <div style={styles.page}>
      <div style={styles.circle1} />
      <div style={styles.circle2} />

      <div style={styles.card}>
        <div style={styles.brand}>
          <div style={styles.logo}>ES</div>
          <h1 style={styles.title}>Create Account</h1>
          <p style={styles.subtitle}>Join EmotiSense — free forever</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input name="name" value={form.name} onChange={handleChange}
              placeholder="John Doe" style={styles.input} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@example.com"
              style={styles.input} />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="Min 6 characters"
              style={styles.input} />
            {/* Strength bar */}
            {form.password && (
              <div style={styles.strengthWrap}>
                {[1,2,3].map(i => (
                  <div key={i} style={{
                    ...styles.strengthBar,
                    background: i <= strength ? strengthColors[strength] : 'rgba(255,255,255,0.15)'
                  }} />
                ))}
                <span style={{ fontSize: 11, opacity: 0.7, color: strengthColors[strength] }}>
                  {strengthLabels[strength]}
                </span>
              </div>
            )}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Confirm Password</label>
            <input type="password" name="confirm" value={form.confirm}
              onChange={handleChange} placeholder="Repeat password"
              style={{
                ...styles.input,
                borderColor: form.confirm && form.confirm !== form.password
                  ? '#EF5350' : undefined
              }} />
          </div>

          <button type="submit" disabled={loading}
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}>
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '20px', position: 'relative', overflow: 'hidden',
    fontFamily: "'Segoe UI', sans-serif",
  },
  circle1: {
    position: 'absolute', width: 350, height: 350, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(0,200,255,0.2) 0%, transparent 70%)',
    top: -80, right: -80, pointerEvents: 'none',
  },
  circle2: {
    position: 'absolute', width: 450, height: 450, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(108,99,255,0.2) 0%, transparent 70%)',
    bottom: -120, left: -120, pointerEvents: 'none',
  },
  card: {
    background: 'rgba(255,255,255,0.07)',
    backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: 24,
    padding: '44px 40px', width: '100%', maxWidth: 420,
    boxShadow: '0 32px 80px rgba(0,0,0,0.5)', color: '#fff', zIndex: 1,
  },
  brand:    { textAlign: 'center', marginBottom: 32 },
  logo: {
    width: 60, height: 60, borderRadius: 18,
    background: 'linear-gradient(135deg, #00D2FF, #6C63FF)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, fontWeight: 800, color: '#fff',
    margin: '0 auto 14px', boxShadow: '0 8px 32px rgba(0,210,255,0.4)',
  },
  title:    { margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -0.8 },
  subtitle: { margin: '6px 0 0', fontSize: 13, opacity: 0.6 },
  form:     { display: 'flex', flexDirection: 'column', gap: 18 },
  field:    { display: 'flex', flexDirection: 'column', gap: 7 },
  label:    { fontSize: 12, fontWeight: 600, opacity: 0.75, letterSpacing: 0.5 },
  input: {
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 11, padding: '13px 16px',
    color: '#fff', fontSize: 14, outline: 'none',
  },
  strengthWrap: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 },
  strengthBar:  { flex: 1, height: 3, borderRadius: 3, transition: 'background 0.3s' },
  btn: {
    background: 'linear-gradient(135deg, #00D2FF, #6C63FF)',
    border: 'none', borderRadius: 12, padding: '15px',
    color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
    marginTop: 6, letterSpacing: 0.5,
  },
  footer: { textAlign: 'center', marginTop: 24, fontSize: 13, opacity: 0.7 },
  link:   { color: '#6C63FF', textDecoration: 'none', fontWeight: 600 },
};
