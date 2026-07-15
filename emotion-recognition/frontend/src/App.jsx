/**
 * src/App.jsx
 * ────────────
 * Root component: sets up routing and global providers.
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { AuthProvider }  from './context/AuthContext';
import ProtectedRoute    from './components/ProtectedRoute';

import Login            from './pages/Login';
import Register         from './pages/Register';
import Dashboard        from './pages/Dashboard';
import EmotionDetector  from './pages/EmotionDetector';
import History          from './pages/History';
import AdminDashboard   from './pages/AdminDashboard';

/* ── Global keyframe injected once ── */
const globalCSS = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes scanDown {
    0%   { transform: translateY(0); opacity: 1; }
    80%  { opacity: 1; }
    100% { transform: translateY(480px); opacity: 0; }
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  * { box-sizing: border-box; }
  body { margin: 0; }
  input::placeholder { color: rgba(255,255,255,0.3); }
  input:focus { border-color: rgba(108,99,255,0.6) !important; }
  select option { background: #1A1A2E; }
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); }
  ::-webkit-scrollbar-thumb { background: rgba(108,99,255,0.4); border-radius: 3px; }
`;

export default function App() {
  return (
    <>
      {/* Inject global CSS */}
      <style>{globalCSS}</style>

      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login"    element={<Login />}    />
            <Route path="/register" element={<Register />} />

            {/* Protected */}
            <Route path="/dashboard" element={
              <ProtectedRoute><Dashboard /></ProtectedRoute>
            } />
            <Route path="/detect" element={
              <ProtectedRoute><EmotionDetector /></ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute><History /></ProtectedRoute>
            } />

            {/* Admin only */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: '#1A1A2E',
                color: '#fff',
                border: '1px solid rgba(108,99,255,0.3)',
                borderRadius: 12,
                fontSize: 14,
              },
              success: { iconTheme: { primary: '#66BB6A', secondary: '#0D0D1A' } },
              error:   { iconTheme: { primary: '#EF5350', secondary: '#0D0D1A' } },
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </>
  );
}
