/**
 * src/pages/AdminDashboard.jsx
 * ─────────────────────────────
 * Admin panel: user list, system analytics, emotion overview.
 */

import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '../utils/api';
import { getEmotionMeta } from '../utils/emotionUtils';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const load = async () => {
      try {
        const [aRes, uRes] = await Promise.all([
          api.get('/admin/analytics'),
          api.get('/admin/users')
        ]);
        setAnalytics(aRes.data);
        setUsers(uRes.data.users);
      } catch (e) {
        toast.error('Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleUser = async (uid, current) => {
    try {
      await api.put(`/admin/users/${uid}/toggle`);
      setUsers(us => us.map(u =>
        u.id === uid ? { ...u, is_active: !current } : u
      ));
      toast.success(`User ${current ? 'deactivated' : 'activated'}`);
    } catch {
      toast.error('Failed to update user');
    }
  };

  if (loading) return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.loadingWrap}><div style={styles.spinner} /></div>
    </div>
  );

  const emotionEntries = Object.entries(analytics?.emotion_counts || {});
  const doughnutData = {
    labels: emotionEntries.map(([e]) => e),
    datasets: [{
      data:            emotionEntries.map(([, c]) => c),
      backgroundColor: emotionEntries.map(([e]) => getEmotionMeta(e).color),
      borderWidth: 0, hoverOffset: 6,
    }]
  };

  const barData = {
    labels: (analytics?.top_users || []).map(u => u.name),
    datasets: [{
      label: 'Detections',
      data:  (analytics?.top_users || []).map(u => u.detections),
      backgroundColor: '#6C63FF88', borderRadius: 6,
    }]
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#ccc' } } },
    scales: {
      x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>

        {/* Title */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>⚙️ Admin Dashboard</h1>
            <p style={styles.sub}>System overview and user management</p>
          </div>
        </div>

        {/* Tab bar */}
        <div style={styles.tabs}>
          {['overview', 'users'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}>
              {tab === 'overview' ? '📊 Overview' : '👥 Users'}
            </button>
          ))}
        </div>

        {/* ── Overview tab ── */}
        {activeTab === 'overview' && (
          <>
            {/* Stat cards */}
            <div style={styles.cards}>
              <AdminCard label="Total Users"    value={analytics.total_users}    icon="👥" color="#6C63FF" />
              <AdminCard label="Active Users"   value={analytics.active_users}   icon="✅" color="#66BB6A" />
              <AdminCard label="Total Records"  value={analytics.total_records}  icon="📊" color="#00D2FF" />
              <AdminCard label="Total Sessions" value={analytics.total_sessions} icon="🎬" color="#FFD700" />
            </div>

            <div style={styles.chartsRow}>
              <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}>Global Emotion Distribution</h3>
                {emotionEntries.length > 0
                  ? <div style={{ height: 260 }}><Doughnut data={doughnutData} /></div>
                  : <Empty />}
              </div>
              <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}>Most Active Users</h3>
                {analytics.top_users?.length > 0
                  ? <div style={{ height: 260 }}><Bar data={barData} options={chartOpts} /></div>
                  : <Empty />}
              </div>
            </div>

            {/* Recent registrations */}
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Recent Registrations</h3>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Name', 'Email', 'Role', 'Joined'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(analytics.recent_users || []).map(u => (
                    <tr key={u.id} style={styles.tr}>
                      <td style={styles.td}>{u.name}</td>
                      <td style={{ ...styles.td, color: '#888' }}>{u.email}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.roleBadge, background: u.role === 'admin' ? '#6C63FF33' : '#66BB6A33', color: u.role === 'admin' ? '#6C63FF' : '#66BB6A' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: '#666', fontSize: 13 }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Users tab ── */}
        {activeTab === 'users' && (
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>All Users ({users.length})</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['ID', 'Name', 'Email', 'Role', 'Detections', 'Status', 'Joined', 'Action'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ ...styles.tr, opacity: u.is_active ? 1 : 0.5 }}>
                      <td style={{ ...styles.td, color: '#555' }}>{u.id}</td>
                      <td style={styles.td}>{u.name}</td>
                      <td style={{ ...styles.td, color: '#888', fontSize: 13 }}>{u.email}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.roleBadge, background: u.role === 'admin' ? '#6C63FF33' : '#00D2FF22', color: u.role === 'admin' ? '#6C63FF' : '#00D2FF' }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: '#aaa' }}>{u.total_detections}</td>
                      <td style={styles.td}>
                        <span style={{ ...styles.statusDot, background: u.is_active ? '#66BB6A' : '#EF5350' }}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ ...styles.td, color: '#555', fontSize: 12 }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td style={styles.td}>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => toggleUser(u.id, u.is_active)}
                            style={{ ...styles.toggleBtn, background: u.is_active ? '#EF535022' : '#66BB6A22', color: u.is_active ? '#EF5350' : '#66BB6A' }}>
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const AdminCard = ({ label, value, icon, color }) => (
  <div style={{ ...styles.statCard, borderTop: `3px solid ${color}` }}>
    <span style={{ fontSize: 30 }}>{icon}</span>
    <div>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{(value || 0).toLocaleString()}</div>
      <div style={{ fontSize: 12, opacity: 0.6 }}>{label}</div>
    </div>
  </div>
);
const Empty = () => <div style={{ color: '#555', textAlign: 'center', padding: '48px 0' }}>No data yet</div>;

const styles = {
  page:       { minHeight: '100vh', background: '#0D0D1A', fontFamily: "'Segoe UI', sans-serif" },
  container:  { maxWidth: 1200, margin: '0 auto', padding: '32px 24px' },
  header:     { marginBottom: 28 },
  title:      { margin: 0, fontSize: 26, fontWeight: 800, color: '#fff' },
  sub:        { margin: '6px 0 0', color: '#666', fontSize: 14 },
  tabs:       { display: 'flex', gap: 8, marginBottom: 28 },
  tab: {
    padding: '10px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)', color: '#888', cursor: 'pointer', fontSize: 14, fontWeight: 600,
  },
  tabActive:  { background: 'rgba(108,99,255,0.2)', color: '#a89fff', borderColor: '#6C63FF66' },
  cards:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20, marginBottom: 28 },
  statCard: {
    background: 'rgba(255,255,255,0.05)', borderRadius: 18, padding: '22px',
    display: 'flex', alignItems: 'center', gap: 18, border: '1px solid rgba(255,255,255,0.07)', color: '#fff',
  },
  chartsRow:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 24, marginBottom: 24 },
  chartCard: {
    background: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: '26px 22px',
    border: '1px solid rgba(255,255,255,0.07)', marginBottom: 24,
  },
  chartTitle: { margin: '0 0 20px', fontSize: 16, fontWeight: 700, color: '#fff' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { color: '#555', fontSize: 12, fontWeight: 600, padding: '12px 14px', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  tr:         { borderBottom: '1px solid rgba(255,255,255,0.04)' },
  td:         { padding: '13px 14px', color: '#ddd', fontSize: 14 },
  roleBadge:  { padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 },
  statusDot: {
    padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 5,
  },
  toggleBtn:  { padding: '5px 14px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
  loadingWrap:{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' },
  spinner: {
    width: 48, height: 48, borderRadius: '50%',
    border: '4px solid rgba(108,99,255,0.2)', borderTop: '4px solid #6C63FF',
    animation: 'spin 0.8s linear infinite',
  },
};
