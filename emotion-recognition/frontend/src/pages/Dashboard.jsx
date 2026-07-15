/**
 * src/pages/Dashboard.jsx
 * ────────────────────────
 * User dashboard: emotion stats, charts, session history.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { getEmotionMeta, CHART_COLORS } from '../utils/emotionUtils';
import Navbar from '../components/Navbar';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale,
  LinearScale, BarElement, LineElement, PointElement);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats,    setStats]    = useState(null);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, histRes] = await Promise.all([
        api.get('/emotion/stats'),
        api.get('/emotion/history?limit=10')
      ]);
      setStats(statsRes.data);
      setHistory(histRes.data.records);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <LoadingScreen />;

  const emotionEntries = stats ? Object.entries(stats.emotion_counts || {}) : [];
  const totalDetections = stats?.total || 0;
  const topEmotion = emotionEntries.sort((a, b) => b[1] - a[1])[0];

  /* ── Doughnut data ── */
  const doughnutData = {
    labels: emotionEntries.map(([e]) => e),
    datasets: [{
      data:            emotionEntries.map(([, c]) => c),
      backgroundColor: emotionEntries.map(([e]) => getEmotionMeta(e).color),
      borderWidth: 0,
      hoverOffset: 8,
    }]
  };

  /* ── Bar chart data ── */
  const barData = {
    labels: emotionEntries.map(([e]) => e),
    datasets: [{
      label: 'Detections',
      data:  emotionEntries.map(([, c]) => c),
      backgroundColor: emotionEntries.map(([e]) => getEmotionMeta(e).color + 'CC'),
      borderRadius: 8,
    }]
  };

  /* ── Timeline line chart ── */
  const timeline    = stats?.timeline || [];
  const timeLabels  = timeline.map(t => t.date);
  const happyData   = timeline.map(t => t.emotions['Happy']   || 0);
  const sadData     = timeline.map(t => t.emotions['Sad']     || 0);
  const angryData   = timeline.map(t => t.emotions['Angry']   || 0);
  const neutralData = timeline.map(t => t.emotions['Neutral'] || 0);

  const lineData = {
    labels: timeLabels,
    datasets: [
      { label: 'Happy',   data: happyData,   borderColor: '#FFD700', backgroundColor: '#FFD70022', tension: 0.4, fill: true },
      { label: 'Sad',     data: sadData,     borderColor: '#4FC3F7', backgroundColor: '#4FC3F722', tension: 0.4 },
      { label: 'Angry',   data: angryData,   borderColor: '#EF5350', backgroundColor: '#EF535022', tension: 0.4 },
      { label: 'Neutral', data: neutralData, borderColor: '#78909C', backgroundColor: '#78909C22', tension: 0.4 },
    ]
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#ccc', font: { size: 12 } } } },
    scales: {
      x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' } }
    }
  };

  return (
    <div style={styles.page}>
      <Navbar />
      <div style={styles.container}>

        {/* ── Welcome banner ── */}
        <div style={styles.welcome}>
          <div>
            <h1 style={styles.welcomeTitle}>
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={styles.welcomeSub}>
              Here's your emotion analysis overview
            </p>
          </div>
          <Link to="/detect" style={styles.detectBtn}>
            🎥 Start Detection
          </Link>
        </div>

        {/* ── Stat cards ── */}
        <div style={styles.cards}>
          <StatCard label="Total Detections" value={totalDetections} icon="📊" color="#6C63FF" />
          <StatCard label="Sessions" value={stats?.recent_sessions?.length ?? 0} icon="🎬" color="#00D2FF" />
          <StatCard
            label="Top Emotion"
            value={topEmotion ? `${getEmotionMeta(topEmotion[0]).emoji} ${topEmotion[0]}` : '—'}
            icon="🏆" color="#FFD700"
          />
          <StatCard
            label="Avg Confidence"
            value={
              totalDetections > 0
                ? (Object.values(stats?.avg_confidence || {}).reduce((a, b) => a + b, 0) /
                   Math.max(Object.keys(stats?.avg_confidence || {}).length, 1)).toFixed(1) + '%'
                : '—'
            }
            icon="🎯" color="#66BB6A"
          />
        </div>

        {/* ── Charts row ── */}
        <div style={styles.chartsRow}>
          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Emotion Distribution</h3>
            {totalDetections > 0
              ? <div style={{ height: 260 }}><Doughnut data={doughnutData} /></div>
              : <EmptyChart />}
          </div>

          <div style={styles.chartCard}>
            <h3 style={styles.chartTitle}>Emotion Frequency</h3>
            {totalDetections > 0
              ? <div style={{ height: 260 }}><Bar data={barData} options={chartOpts} /></div>
              : <EmptyChart />}
          </div>
        </div>

        {/* ── Timeline chart ── */}
        <div style={{ ...styles.chartCard, marginBottom: 32 }}>
          <h3 style={styles.chartTitle}>7-Day Emotion Timeline</h3>
          {timeline.length > 0
            ? <div style={{ height: 280 }}><Line data={lineData} options={chartOpts} /></div>
            : <EmptyChart message="No data for the past 7 days" />}
        </div>

        {/* ── Recent history ── */}
        <div style={styles.chartCard}>
          <div style={styles.historyHeader}>
            <h3 style={styles.chartTitle}>Recent Detections</h3>
            <Link to="/history" style={styles.viewAll}>View All →</Link>
          </div>
          {history.length === 0
            ? <EmptyChart message="No detections yet. Try the detector!" />
            : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    {['Emotion', 'Confidence', 'Date & Time'].map(h => (
                      <th key={h} style={styles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map(r => {
                    const meta = getEmotionMeta(r.detected_emotion);
                    return (
                      <tr key={r.id} style={styles.tr}>
                        <td style={styles.td}>
                          <span style={{ ...styles.badge, background: meta.color + '33', color: meta.color }}>
                            {meta.emoji} {r.detected_emotion}
                          </span>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.confWrap}>
                            <div style={{ ...styles.confBar, width: `${r.confidence_score}%`, background: meta.color }} />
                            <span style={{ fontSize: 12, color: '#aaa' }}>{r.confidence_score}%</span>
                          </div>
                        </td>
                        <td style={{ ...styles.td, color: '#aaa', fontSize: 13 }}>
                          {new Date(r.detected_at).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
        </div>

      </div>
    </div>
  );
}

/* ── Sub-components ── */
const StatCard = ({ label, value, icon, color }) => (
  <div style={{ ...styles.statCard, borderTop: `3px solid ${color}` }}>
    <span style={{ fontSize: 28 }}>{icon}</span>
    <div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, opacity: 0.6 }}>{label}</div>
    </div>
  </div>
);

const EmptyChart = ({ message = 'No data yet' }) => (
  <div style={styles.empty}>{message}</div>
);

const LoadingScreen = () => (
  <div style={styles.loading}>
    <div style={styles.spinner} />
    <p style={{ color: '#aaa', marginTop: 16 }}>Loading your dashboard…</p>
  </div>
);

const styles = {
  page:      { minHeight: '100vh', background: '#0D0D1A', fontFamily: "'Segoe UI', sans-serif" },
  container: { maxWidth: 1200, margin: '0 auto', padding: '32px 24px' },
  welcome:   {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 32, flexWrap: 'wrap', gap: 16,
  },
  welcomeTitle: { margin: 0, fontSize: 28, fontWeight: 800, color: '#fff' },
  welcomeSub:   { margin: '6px 0 0', color: '#888', fontSize: 15 },
  detectBtn: {
    background: 'linear-gradient(135deg, #6C63FF, #00D2FF)',
    color: '#fff', textDecoration: 'none', borderRadius: 14,
    padding: '14px 28px', fontWeight: 700, fontSize: 15,
    boxShadow: '0 8px 32px rgba(108,99,255,0.4)',
  },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 20, marginBottom: 28 },
  statCard: {
    background: 'rgba(255,255,255,0.05)', borderRadius: 18,
    padding: '24px 22px', display: 'flex', alignItems: 'center', gap: 18,
    border: '1px solid rgba(255,255,255,0.08)',
    color: '#fff',
  },
  chartsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(340px,1fr))', gap: 24, marginBottom: 24 },
  chartCard: {
    background: 'rgba(255,255,255,0.05)', borderRadius: 20,
    padding: '28px 24px', border: '1px solid rgba(255,255,255,0.08)',
  },
  chartTitle: { margin: '0 0 20px', fontSize: 17, fontWeight: 700, color: '#fff' },
  historyHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  viewAll: { color: '#6C63FF', textDecoration: 'none', fontSize: 14, fontWeight: 600 },
  table:   { width: '100%', borderCollapse: 'collapse' },
  th:      { color: '#777', fontSize: 12, fontWeight: 600, textAlign: 'left', padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
  tr:      { borderBottom: '1px solid rgba(255,255,255,0.04)' },
  td:      { padding: '12px', color: '#ddd', fontSize: 14 },
  badge:   { padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 600 },
  confWrap:{ display: 'flex', alignItems: 'center', gap: 10 },
  confBar: { height: 6, borderRadius: 3, transition: 'width 0.5s', minWidth: 4 },
  empty:   { color: '#555', textAlign: 'center', padding: '48px 0', fontSize: 15 },
  loading: { minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0D0D1A' },
  spinner: {
    width: 48, height: 48, borderRadius: '50%',
    border: '4px solid rgba(108,99,255,0.2)',
    borderTop: '4px solid #6C63FF',
    animation: 'spin 0.8s linear infinite',
  },
};
